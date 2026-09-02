from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

# Fichier de données pour les produits
PRODUCTS_FILE = 'products.json'
ORDERS_FILE = 'orders.json'

def load_products():
    """Charger les produits depuis le fichier JSON"""
    if os.path.exists(PRODUCTS_FILE):
        with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def load_orders():
    """Charger les commandes depuis le fichier JSON"""
    if os.path.exists(ORDERS_FILE):
        with open(ORDERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_orders(orders):
    """Sauvegarder les commandes"""
    with open(ORDERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(orders, f, ensure_ascii=False, indent=2)

# Produits par défaut si le fichier n'existe pas
DEFAULT_PRODUCTS = [
    {
        "id": 1,
        "name": "Baguette Classique",
        "price": 2.50,
        "description": "Une délicieuse baguette française traditionnelle",
        "category": "Pains",
        "image": "🥖",
        "stock": 50
    },
    {
        "id": 2,
        "name": "Croissant Beurre",
        "price": 1.80,
        "description": "Croissant feuilleté au beurre frais",
        "category": "Viennoiseries",
        "image": "🥐",
        "stock": 30
    },
    {
        "id": 3,
        "name": "Pain au Chocolat",
        "price": 2.00,
        "description": "Pain feuilleté avec deux barres de chocolat",
        "category": "Viennoiseries",
        "image": "🍫",
        "stock": 25
    },
    {
        "id": 4,
        "name": "Tarte aux Pommes",
        "price": 4.50,
        "description": "Tarte pâtissière aux pommes fraîches",
        "category": "Pâtisseries",
        "image": "🥧",
        "stock": 15
    },
    {
        "id": 5,
        "name": "Éclair au Café",
        "price": 3.50,
        "description": "Éclair délicat au goût de café",
        "category": "Pâtisseries",
        "image": "💄",
        "stock": 20
    },
    {
        "id": 6,
        "name": "Macarons Assortis",
        "price": 8.00,
        "description": "Boîte de 6 macarons de couleurs variées",
        "category": "Pâtisseries",
        "image": "🎨",
        "stock": 10
    }
]

# Créer le fichier de produits s'il n'existe pas
if not os.path.exists(PRODUCTS_FILE):
    with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(DEFAULT_PRODUCTS, f, ensure_ascii=False, indent=2)

@app.route('/')
def index():
    """Page d'accueil avec catalogue"""
    products = load_products()
    return render_template('index.html', products=products)

@app.route('/api/products')
def get_products():
    """API pour obtenir tous les produits"""
    products = load_products()
    return jsonify(products)

@app.route('/api/products/<int:product_id>')
def get_product(product_id):
    """API pour obtenir un produit spécifique"""
    products = load_products()
    product = next((p for p in products if p['id'] == product_id), None)
    if product:
        return jsonify(product)
    return jsonify({'error': 'Produit non trouvé'}), 404

@app.route('/api/checkout', methods=['POST'])
def checkout():
    """Traiter une commande"""
    data = request.json
    
    # Validation de base
    if not data.get('customer_name') or not data.get('email') or not data.get('items'):
        return jsonify({'error': 'Données manquantes'}), 400
    
    # Créer la commande
    order = {
        'id': len(load_orders()) + 1,
        'date': datetime.now().isoformat(),
        'customer_name': data['customer_name'],
        'email': data['email'],
        'address': data.get('address', ''),
        'items': data['items'],
        'total': data['total'],
        'status': 'En attente'
    }
    
    # Sauvegarder la commande
    orders = load_orders()
    orders.append(order)
    save_orders(orders)
    
    return jsonify({
        'success': True,
        'order_id': order['id'],
        'message': 'Commande confirmée! Merci pour votre achat.'
    })

@app.route('/orders')
def orders():
    """Page pour voir les commandes"""
    all_orders = load_orders()
    return render_template('orders.html', orders=all_orders)

@app.route('/admin')
def admin():
    """Page d'administration (simple)"""
    products = load_products()
    all_orders = load_orders()
    return render_template('admin.html', products=products, orders=all_orders)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
