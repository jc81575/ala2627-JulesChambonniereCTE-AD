from flask import Flask, render_template, request, jsonify, redirect, url_for
import json
import os
from datetime import datetime
import requests

try:
    import stripe
except ImportError:
    stripe = None

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

@app.route('/checkout')
def checkout_page():
    """Page de paiement avec les clés publiques configurées."""
    return render_template(
        'checkout.html',
        stripe_publishable_key=os.getenv('STRIPE_PUBLISHABLE_KEY', ''),
        paypal_client_id=os.getenv('PAYPAL_CLIENT_ID', '')
    )

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
    if not data or not data.get('customer_name') or not data.get('email') or not data.get('items'):
        return jsonify({'error': 'Données manquantes'}), 400

    validated_items, total = validate_cart(data['items'])
    if validated_items is None:
        return jsonify({'error': 'Panier invalide'}), 400

    # Créer la commande
    order = {
        'id': len(load_orders()) + 1,
        'date': datetime.now().isoformat(),
        'customer_name': data['customer_name'],
        'email': data['email'],
        'address': data.get('address', ''),
        'items': validated_items,
        'total': total,
        'payment_method': data.get('payment_method', 'manual'),
        'payment_id': data.get('payment_id', ''),
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

def validate_cart(items):
    """Recalcule le panier depuis le catalogue pour éviter les prix falsifiés."""
    products = {product['id']: product for product in load_products()}
    validated_items = []
    total = 0

    for item in items:
        product = products.get(item.get('id'))
        quantity = item.get('quantity', 0)
        if not product or not isinstance(quantity, int) or quantity < 1 or quantity > product['stock']:
            return None, 0
        validated_item = {
            'id': product['id'],
            'name': product['name'],
            'price': product['price'],
            'quantity': quantity,
            'image': product.get('image', '')
        }
        validated_items.append(validated_item)
        total += product['price'] * quantity

    return validated_items, round(total, 2)

@app.route('/api/stripe/create-session', methods=['POST'])
def create_stripe_session():
    """Créer une session Stripe Checkout côté serveur."""
    if stripe is None or not os.getenv('STRIPE_SECRET_KEY'):
        return jsonify({'error': 'Stripe n’est pas configuré'}), 503

    data = request.get_json(silent=True) or {}
    items, total = validate_cart(data.get('items', []))
    if items is None or not data.get('customer_name') or not data.get('email'):
        return jsonify({'error': 'Informations de commande invalides'}), 400

    stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
    session = stripe.checkout.Session.create(
        mode='payment',
        customer_email=data['email'],
        line_items=[{
            'price_data': {
                'currency': 'eur',
                'product_data': {'name': item['name']},
                'unit_amount': round(item['price'] * 100)
            },
            'quantity': item['quantity']
        } for item in items],
        metadata={
            'customer_name': data['customer_name'],
            'address': data.get('address', ''),
            'items': json.dumps(items, ensure_ascii=True)
        },
        success_url=url_for('payment_success', provider='stripe', _external=True),
        cancel_url=url_for('checkout_page', _external=True)
    )
    return jsonify({'url': session.url, 'total': total})

@app.route('/api/paypal/create-order', methods=['POST'])
def create_paypal_order():
    """Créer une commande PayPal via l'API serveur."""
    data = request.get_json(silent=True) or {}
    items, total = validate_cart(data.get('items', []))
    if items is None:
        return jsonify({'error': 'Panier invalide'}), 400

    access_token = paypal_access_token()
    if not access_token:
        return jsonify({'error': 'PayPal n’est pas configuré'}), 503

    response = requests.post(
        f'{paypal_base_url()}/v2/checkout/orders',
        headers={'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'},
        json={'intent': 'CAPTURE', 'purchase_units': [{
            'amount': {'currency_code': 'EUR', 'value': f'{total:.2f}'},
            'description': 'Commande Boulangerie Jules'
        }]},
        timeout=15
    )
    if not response.ok:
        return jsonify({'error': 'Impossible de créer la commande PayPal'}), 502
    return jsonify({'id': response.json()['id']})

@app.route('/api/paypal/capture-order', methods=['POST'])
def capture_paypal_order():
    """Capturer un paiement PayPal après validation du bouton."""
    data = request.get_json(silent=True) or {}
    access_token = paypal_access_token()
    if not access_token or not data.get('order_id'):
        return jsonify({'error': 'PayPal n’est pas configuré'}), 503
    response = requests.post(
        f"{paypal_base_url()}/v2/checkout/orders/{data['order_id']}/capture",
        headers={'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'},
        timeout=15
    )
    if not response.ok or response.json().get('status') != 'COMPLETED':
        return jsonify({'error': 'Le paiement PayPal n’a pas été confirmé'}), 502
    return jsonify({'success': True, 'payment_id': data['order_id']})

def paypal_base_url():
    return 'https://api-m.sandbox.paypal.com' if os.getenv('PAYPAL_MODE', 'sandbox') == 'sandbox' else 'https://api-m.paypal.com'

def paypal_access_token():
    client_id = os.getenv('PAYPAL_CLIENT_ID')
    client_secret = os.getenv('PAYPAL_CLIENT_SECRET')
    if not client_id or not client_secret:
        return None
    response = requests.post(
        f'{paypal_base_url()}/v1/oauth2/token',
        auth=(client_id, client_secret),
        data={'grant_type': 'client_credentials'},
        timeout=15
    )
    return response.json().get('access_token') if response.ok else None

@app.route('/payment-success')
def payment_success():
    """Retour Stripe après paiement; la commande est enregistrée après vérification."""
    if request.args.get('provider') != 'stripe' or stripe is None:
        return redirect(url_for('checkout_page'))
    try:
        session = stripe.checkout.Session.retrieve(request.args['session_id'])
        if session.payment_status != 'paid':
            return redirect(url_for('checkout_page'))
        items = json.loads(session.metadata['items'])
        order = save_order(session.metadata['customer_name'], session.customer_details.email, session.metadata['address'], items, 'stripe', session.payment_intent)
        return render_template('payment_success.html', order=order)
    except (KeyError, ValueError, json.JSONDecodeError):
        return redirect(url_for('checkout_page'))

def save_order(customer_name, email, address, items, payment_method, payment_id):
    orders = load_orders()
    order = {
        'id': len(orders) + 1, 'date': datetime.now().isoformat(),
        'customer_name': customer_name, 'email': email, 'address': address,
        'items': items, 'total': round(sum(item['price'] * item['quantity'] for item in items), 2),
        'payment_method': payment_method, 'payment_id': payment_id, 'status': 'En attente'
    }
    orders.append(order)
    save_orders(orders)
    return order

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
