// Gestion du panier
let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    updateCartUI();
});

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
    }
}

function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">${product.image}</div>
            <div class="product-content">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">${product.price.toFixed(2)} €</span>
                    <span class="stock-info">Stock: ${product.stock}</span>
                </div>
            </div>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id}, '${product.name}', ${product.price}, '${product.image}')">
                🛒 Ajouter
            </button>
        `;
        grid.appendChild(card);
    });
}

function addToCart(id, name, price, image) {
    // Vérifier si le produit est déjà dans le panier
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }

    // Sauvegarder le panier
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();

    // Afficher une notification
    showNotification(`${name} ajouté au panier! 🎉`);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartUI();
        }
    }
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const cartTotal = document.getElementById('cartTotal');

    // Mettre à jour le compteur
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Afficher/masquer le bouton de checkout
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Votre panier est vide</p>';
        if (cartTotal) cartTotal.textContent = '0,00 €';
        return;
    }

    let html = '';
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;

        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.image} ${item.name}</div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
                <div class="cart-item-price">${subtotal.toFixed(2)} €</div>
                <button class="remove-btn" onclick="removeFromCart(${item.id})" title="Supprimer">🗑️</button>
            </div>
        `;
    });

    cartItems.innerHTML = html;
    if (cartTotal) cartTotal.textContent = total.toFixed(2) + ' €';
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    cartSidebar.classList.toggle('active');
}

// Fermer le panier quand on clique en dehors
document.addEventListener('click', function(event) {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartToggle = document.getElementById('cartToggle');
    
    if (cartSidebar && cartToggle && !cartSidebar.contains(event.target) && !cartToggle.contains(event.target)) {
        cartSidebar.classList.remove('active');
    }
});

function goToCheckout() {
    if (cart.length > 0) {
        window.location.href = '/checkout';
    }
}

function showNotification(message) {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: #00a86b;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 999;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Supprimer après 2 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
