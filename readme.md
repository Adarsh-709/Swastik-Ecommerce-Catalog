# 🛋️ Swastik Furnitures Website

A modern, responsive static website built for a local furniture shop.  
The website displays product listings dynamically using JavaScript data files and is designed for fast, free static hosting.

---

## 🚀 Features

- Responsive design for mobile and desktop  
- Product listing from `data.js`  
- Product details stored in category-wise JavaScript files  
- Images stored in category-specific subfolders  
- Category-wise product filtering  
- Individual product detail pages  
- WhatsApp order button integration  
- Google Maps embed for shop location  
- Fast and lightweight static setup  

---

## 🛠️ Tech Stack

- HTML5  
- CSS3  
- JavaScript (Vanilla)  
- Static Data Management (`data.js`)  

---

## 📂 Project Structure

SWASTIK-FURNITURES
├── Swastik_Dynamic # Dynamic version (Flask + Firebase) for future use
├── Swastik_Static # Current static production version
│ ├── css # Stylesheets
│ │ ├── style.css
│ │ ├── home.css
│ │ ├── product.css
│ │ ├── products.css
│ │ ├── cart.css
│ │ ├── search.css
│ │ ├── contact.css
│ │ └── about.css
│ │
│ ├── imgs # Product images stored category-wise
│ │
│ ├── js
│ │ ├── categories # Category-wise product data files
│ │ ├── about.js
│ │ ├── cart.js
│ │ ├── common.js
│ │ ├── contact.js
│ │ ├── data.js # Global shop configuration & settings
│ │ ├── home.js
│ │ ├── product.js
│ │ ├── products.js
│ │ └── search.js
│ │
│ ├── index.html
│ ├── products.html
│ ├── product.html
│ ├── cart.html
│ ├── search.html
│ ├── contact.html
│ └── about.html
│
└── README.md


---

## ✏️ Updating Products

1. Add new product data in the relevant category file inside `js/categories/`
2. Add product images in the respective category folder inside `imgs/`
3. Push changes to GitHub
4. Hosting platform auto-deploys updates

---

## 📌 Hosting

- Designed for free static hosting  
- Compatible with **Vercel**, **Netlify**, and **GitHub Pages**  
- Custom domain fully supported  
- Free SSL (HTTPS) enabled by hosting platform  

---

## 👨‍💻 Developer

**Adarsh Sharma**  
Built as a real-world client project for a local furniture business.

---

## Live Preview

https://swastikfurnitures.in
