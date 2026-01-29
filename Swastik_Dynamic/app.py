import os
from flask import Flask, render_template, jsonify, request, session, redirect, url_for, flash
import firebase_admin
from firebase_admin import credentials, firestore, auth 
from functools import wraps
import cloudinary
import cloudinary.uploader
import cloudinary.api

app = Flask(__name__)
# Use environment variable for secret key, fallback to a default only for local dev
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'default_dev_secret_key')

# --- CLOUDINARY SETUP ---
# Load from Environment Variables (Best Practice for Deployment)
cloudinary.config( 
  cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'), 
  api_key = os.environ.get('CLOUDINARY_API_KEY'), 
  api_secret = os.environ.get('CLOUDINARY_API_SECRET') 
)

# --- DATABASE SETUP ---
try:
    # 1. First try to load credentials from Environment Variable (Best for Production/Render/Heroku)
    # You would store the entire JSON content of serviceAccountKey.json in an env var named FIREBASE_CREDENTIALS
    firebase_creds_json = os.environ.get('FIREBASE_CREDENTIALS')
    
    if firebase_creds_json:
        import json
        # Parse the JSON string from env var
        creds_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(creds_dict)
        firebase_admin.initialize_app(cred)
        print("✅ Connected to Firebase Firestore via Environment Variable")
        
    # 2. Fallback to local file (Best for Local Development)
    elif os.path.exists('serviceAccountKey.json'):
        cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
        print("✅ Connected to Firebase Firestore using serviceAccountKey.json")
        
    else:
        print("⚠️ No Firebase credentials found (Env Var or File). Database will not work.")
        
    db = firestore.client()
except Exception as e:
    print(f"❌ Error initializing Firebase: {e}")
    db = None

# --- CONTEXT PROCESSOR FOR GLOBAL SHOP SETTINGS ---
@app.context_processor
def inject_shop_settings():
    """Fetches shop settings to be available in all templates (like footer)."""
    shop_info = {
        'phone': '+91 90020 66361',
        'email': 'info@swastikfurnitures.com',
        'address': 'Eastern Bypass, Siliguri, West Bengal',
        'map_url': 'https://www.google.com/maps/search/?api=1&query=Eastern+Bypass,+Siliguri,+West+Bengal'
    }
    if db:
        try:
            doc = db.collection('shop_info').document('main').get()
            if doc.exists:
                shop_info.update(doc.to_dict())
        except Exception:
            pass # Fallback to defaults if DB fails
    return dict(shop_settings=shop_info)

# --- LOGIN DECORATOR ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session:
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

# --- HELPER: EXTRACT CLOUDINARY PUBLIC ID ---
def get_public_id_from_url(url):
    """
    Extracts the public_id from a Cloudinary URL.
    Example URL: https://res.cloudinary.com/demo/image/upload/v1570979139/sample.jpg
    Returns: 'sample'
    """
    try:
        if 'cloudinary.com' not in url:
            return None
        # Split by '/' and get the last part (filename)
        filename = url.split('/')[-1]
        # Remove the file extension (.jpg, .png, etc.)
        public_id = filename.split('.')[0]
        return public_id
    except Exception:
        return None

# --- PUBLIC ROUTES ---
@app.route('/')
def home(): return render_template('index.html')
@app.route('/category.html')
def category_page(): return render_template('category.html')
@app.route('/about.html')
def about_page(): return render_template('about.html')
@app.route('/contact.html')
def contact_page(): return render_template('contact.html')
@app.route('/search.html')
def search_page(): return render_template('search.html')
@app.route('/product.html')
def product_page(): return render_template('product.html')
@app.route('/cart.html')
def cart_page(): return render_template('cart.html')


# --- ADMIN ROUTES ---

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'GET':
        if 'logged_in' in session:
            return redirect(url_for('admin_dashboard'))
        return render_template('admin/login.html')

    if request.method == 'POST':
        try:
            data = request.get_json()
            id_token = data.get('id_token')
            if not id_token: return jsonify({'error': 'Missing ID token'}), 400
            
            decoded_token = auth.verify_id_token(id_token)
            uid = decoded_token['uid']
            
            session['logged_in'] = True
            session['user_id'] = uid
            return jsonify({'status': 'success', 'uid': uid}), 200
        except Exception as e:
            return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/admin/logout')
def admin_logout():
    session.pop('logged_in', None)
    session.pop('user_id', None)
    return redirect(url_for('admin_login'))

@app.route('/admin')
@login_required
def admin_dashboard():
    products = []
    if db:
        docs = db.collection('products').stream()
        for doc in docs:
            p = doc.to_dict()
            p['id'] = doc.id
            products.append(p)
    return render_template('admin/dashboard.html', products=products)

@app.route('/admin/product/new', methods=['GET', 'POST'])
@login_required
def admin_add_product():
    if request.method == 'POST':
        try:
            image_url = ""
            if 'image_file' in request.files:
                file = request.files['image_file']
                if file.filename != '':
                    upload_result = cloudinary.uploader.upload(file)
                    image_url = upload_result['secure_url']
            
            if not image_url:
                image_url = request.form.get('image_url')

            product_data = {
                'name': request.form.get('name'),
                'price': request.form.get('price'),
                'original_price': request.form.get('original_price'),
                'category': request.form.get('category'),
                'image': image_url,
                'description': request.form.get('description'),
                'dimensions': request.form.get('dimensions'),
                'material': request.form.get('material'),
                'bestseller': 'bestseller' in request.form,
                'available': 'available' in request.form 
            }
            
            if db:
                db.collection('products').add(product_data)
                flash('Product Added Successfully', 'success')
                return redirect(url_for('admin_dashboard'))
        except Exception as e:
            flash(f'Error adding product: {str(e)}', 'error')
            
    return render_template('admin/product_form.html', product=None)

@app.route('/admin/product/edit/<product_id>', methods=['GET', 'POST'])
@login_required
def admin_edit_product(product_id):
    if not db: return "DB Error", 500
    
    doc_ref = db.collection('products').document(product_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        flash('Product not found', 'error')
        return redirect(url_for('admin_dashboard'))

    current_product = doc.to_dict()

    if request.method == 'POST':
        try:
            image_url = current_product.get('image', '')
            
            # Check if a new file is being uploaded
            if 'image_file' in request.files:
                file = request.files['image_file']
                if file.filename != '':
                    # 1. Delete old image if it exists on Cloudinary
                    old_image_url = current_product.get('image')
                    if old_image_url:
                        public_id = get_public_id_from_url(old_image_url)
                        if public_id:
                            cloudinary.uploader.destroy(public_id)

                    # 2. Upload new image
                    upload_result = cloudinary.uploader.upload(file)
                    image_url = upload_result['secure_url']
            
            elif request.form.get('image_url') and request.form.get('image_url') != image_url:
                image_url = request.form.get('image_url')

            product_data = {
                'name': request.form.get('name'),
                'price': request.form.get('price'),
                'original_price': request.form.get('original_price'),
                'category': request.form.get('category'),
                'image': image_url,
                'description': request.form.get('description'),
                'dimensions': request.form.get('dimensions'),
                'material': request.form.get('material'),
                'bestseller': 'bestseller' in request.form,
                'available': 'available' in request.form 
            }
            doc_ref.update(product_data)
            flash('Product Updated Successfully', 'success')
            return redirect(url_for('admin_dashboard'))
        except Exception as e:
            flash(f'Error updating product: {str(e)}', 'error')

    current_product['id'] = doc.id
    return render_template('admin/product_form.html', product=current_product)

@app.route('/admin/product/delete/<product_id>')
@login_required
def admin_delete_product(product_id):
    if db:
        try:
            # 1. Get the product document to find the image URL
            doc_ref = db.collection('products').document(product_id)
            doc = doc_ref.get()
            
            if doc.exists:
                product = doc.to_dict()
                image_url = product.get('image')

                # 2. Delete image from Cloudinary if it exists
                if image_url:
                    public_id = get_public_id_from_url(image_url)
                    if public_id:
                        cloudinary.uploader.destroy(public_id)
                        print(f"Deleted Cloudinary image: {public_id}")

                # 3. Delete document from Firestore
                doc_ref.delete()
                flash('Product and Image Deleted', 'success')
            else:
                flash('Product not found', 'error')
                
        except Exception as e:
            print(f"Delete Error: {e}")
            flash('Error deleting product', 'error')

    return redirect(url_for('admin_dashboard'))

# --- NEW: SHOP SETTINGS ROUTE ---
@app.route('/admin/settings', methods=['GET', 'POST'])
@login_required
def admin_settings():
    if not db: return "DB Error", 500
    
    settings_ref = db.collection('shop_info').document('main')
    
    if request.method == 'POST':
        settings_data = {
            'shop_name': request.form.get('shop_name'),
            'shop_logo': request.form.get('shop_logo'),
            'phone': request.form.get('phone'),
            'email': request.form.get('email'),
            'address': request.form.get('address'),
            'map_url': request.form.get('map_url')
        }
        settings_ref.set(settings_data, merge=True)
        flash('Settings Updated Successfully', 'success')
        return redirect(url_for('admin_settings'))

    doc = settings_ref.get()
    settings = doc.to_dict() if doc.exists else {}
    return render_template('admin/settings.html', settings=settings)

# --- API ENDPOINTS (Keep existing ones) ---
@app.route('/api/bestsellers')
def get_bestsellers():
    if not db: return jsonify({'error': 'Database not connected'}), 500
    products_list = []
    try:
        products_ref = db.collection('products')
        
        # 1. Fetch available bestsellers
        # Note: Compound queries (bestseller==True AND available==True) require an index in Firestore.
        # If the index is missing, this query might fail or return an empty list initially.
        # A safer approach for small datasets is to fetch by 'bestseller' and filter 'available' in Python.
        
        query = products_ref.where('bestseller', '==', True).limit(50) # Fetch slightly more to filter
        docs = query.stream()
        
        for doc in docs:
            p = doc.to_dict()
            p['id'] = doc.id
            
            # 2. Filter in Python: Only include if 'available' is True (or key is missing, assume True)
            # Adjust this logic based on your preference. Here, we enforce 'available' must be True.
            if p.get('available') is not False: 
                products_list.append(p)
                
        return jsonify(products_list)
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/api/products')
def get_products():
    if not db: return jsonify({'error': 'Database not connected'}), 500
    category = request.args.get('category')
    product_type = request.args.get('type')
    products_list = []
    try:
        products_ref = db.collection('products')
        
        # Base query to fetch products
        if product_type == 'bestsellers':
            query = products_ref.where('bestseller', '==', True)
        elif category:
            query = products_ref.where('category', '==', category)
        else:
            query = products_ref # Fetch all if no filter
            
        # Execute query
        if isinstance(query, firestore.CollectionReference):
            docs = query.stream() # If no 'where', fetch all
        else:
            docs = query.stream()

        for doc in docs:
            p = doc.to_dict()
            p['id'] = doc.id
            # Note: For the main product list, we WANT to show unavailable items (with a tag),
            # so we do NOT filter them out here. The frontend handles the tag display.
            products_list.append(p)
                
        return jsonify(products_list)
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/api/search')
def search_products():
    if not db: return jsonify({'error': 'Database not connected'}), 500
    query_text = request.args.get('q', '').lower()
    limit_val = request.args.get('limit', type=int)
    products_list = []
    try:
        docs = db.collection('products').stream()
        for doc in docs:
            p = doc.to_dict()
            p['id'] = doc.id
            # Search matches name AND includes unavailable items (frontend handles tag)
            if query_text in p.get('name', '').lower():
                products_list.append(p)
        if limit_val and limit_val > 0: products_list = products_list[:limit_val]
        return jsonify(products_list)
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/api/product/<product_id>')
def get_product_details(product_id):
    if not db: return jsonify({'error': 'Database not connected'}), 500
    try:
        doc = db.collection('products').document(product_id).get()
        if doc.exists:
            p = doc.to_dict()
            p['id'] = doc.id
            return jsonify(p)
        else: return jsonify({'error': 'Product not found'}), 404
    except Exception as e: return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)