import firebase_admin
from firebase_admin import credentials, firestore
import os

# CONFIG
KEY_PATH = "swastik-furniture-firebase-adminsdk-fbsvc-0393fbe44c.json"

# INITIAL DATA
initial_products = [
    {
        "name": "Modern 3-Seater Sofa",
        "price": "22,500",
        "category": "Living Room",
        "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=500&fit=crop",
        "desc": "Premium comfort with durable fabric."
    },
    {
        "name": "Solid Wood King Bed",
        "price": "35,000",
        "category": "Bedroom",
        "image": "https://images.unsplash.com/photo-1540932626318-85f1cb39b64b?w=400&h=500&fit=crop",
        "desc": "Hand-carved teak wood finish."
    },
    {
        "name": "Wooden Dining Table Set",
        "price": "28,000",
        "category": "Dining",
        "image": "https://images.unsplash.com/photo-1473093295203-cad00df16e50?w=400&h=500&fit=crop",
        "desc": "6-Seater family dining set."
    }
]

def seed_database():
    if not os.path.exists(KEY_PATH):
        print("❌ Error: 'serviceAccountKey.json' not found.")
        print("Please download it from Firebase Console -> Project Settings -> Service Accounts.")
        return

    # Initialize Firebase
    if not firebase_admin._apps:
        cred = credentials.Certificate(KEY_PATH)
        firebase_admin.initialize_app(cred)
    
    db = firestore.client()
    collection_ref = db.collection('products')

    print("🚀 Starting upload...")
    
    for product in initial_products:
        # We use the name as the document ID just to keep it readable, 
        # or let Firestore auto-generate ID by using .add()
        db.collection('products').add(product)
        print(f"   Uploaded: {product['name']}")
    
    print("✅ Database successfully seeded!")

if __name__ == "__main__":
    seed_database()