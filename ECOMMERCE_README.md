# 🥖 Boulangerie Jules - Site E-Commerce Fonctionnel

Votre site personnel a été transformé en un **site e-commerce complet et fonctionnel** pour la vente de pâtisseries et pains français!

## ✨ Fonctionnalités

✅ **Catalogue de produits** - Affichage dynamique avec catégories  
✅ **Panier interactif** - Ajouter/supprimer/modifier les quantités  
✅ **Système de commande** - Formulaire de checkout avec validation  
✅ **Gestion des commandes** - Historique complet des commandes  
✅ **Panneau d'administration** - Statistiques, gestion des produits  
✅ **Design responsive** - Fonctionne sur mobile, tablette et desktop  
✅ **Système de stockage JSON** - Persistance des données  

## 🚀 Installation et démarrage

### 1. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 2. Lancer le serveur

```bash
python app.py
```

L'application sera accessible à: **http://localhost:5000**

## 📁 Structure du projet

```
├── app.py                      # Serveur Flask (backend)
├── requirements.txt            # Dépendances Python
├── products.json               # Base de données des produits
├── orders.json                 # Base de données des commandes
├── templates/                  # Fichiers HTML (vues)
│   ├── index.html             # Page d'accueil / Catalogue
│   ├── checkout.html          # Page de commande
│   ├── orders.html            # Historique des commandes
│   └── admin.html             # Panneau d'administration
├── static/                    # Fichiers statiques
│   ├── style.css              # Feuille de styles CSS
│   └── app.js                 # Logique JavaScript côté client
└── game/                      # Ancien jeu (toujours disponible)
```

## 🛍️ Pages principales

| Page | URL | Description |
|------|-----|-------------|
| Boutique | `/` | Affiche le catalogue et le panier |
| Checkout | `/checkout` | Formulaire de commande |
| Commandes | `/orders` | Historique de toutes les commandes |
| Admin | `/admin` | Panneau de gestion |

## 💻 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/products` | Récupère tous les produits |
| GET | `/api/products/<id>` | Récupère un produit spécifique |
| POST | `/api/checkout` | Crée une nouvelle commande |

## 📊 Exemple de commande JSON

```json
{
  "id": 1,
  "date": "2026-09-01T10:30:00",
  "customer_name": "Jules Chambonnière",
  "email": "chambonnierejules@gmail.com",
  "address": "Paris, France",
  "items": [
    {
      "id": 1,
      "name": "Baguette Classique",
      "price": 2.50,
      "quantity": 2,
      "image": "🥖"
    }
  ],
  "total": 5.00,
  "status": "En attente"
}
```

## 🎨 Personnalisation

### Modifier les produits
Éditez le fichier `products.json` pour:
- Ajouter/supprimer des produits
- Modifier les prix
- Changer les descriptions

### Modifier les couleurs
Éditez `static/style.css` et modifiez les variables CSS:
```css
:root {
    --primary: #d72638;        /* Couleur principale */
    --secondary: #f4c95d;      /* Couleur secondaire */
    /* ... */
}
```

### Ajouter des images réelles
Remplacez les emojis par des URLs d'images:
```json
"image": "https://example.com/image.jpg"
```

## 📝 Fonctionnalités futures

- [ ] Paiement en ligne (Stripe/PayPal)
- [ ] Système d'authentification utilisateur
- [ ] Avis et commentaires clients
- [ ] Suivi de commande en temps réel
- [ ] Email de confirmation automatique
- [ ] Gestion d'inventaire avancée
- [ ] Statistiques de ventes détaillées

## 🛠️ Développement

### Architecture

**Frontend:**
- HTML5 / CSS3 / JavaScript vanilla
- LocalStorage pour le panier côté client
- Design mobile-first responsive

**Backend:**
- Flask (framework Python léger)
- JSON pour la persistance des données
- API RESTful

### Améliorations possibles

```python
# Remplacer JSON par une vraie base de données
from sqlalchemy import create_engine
engine = create_engine('sqlite:///boulangerie.db')

# Ajouter une authentification
from flask_login import LoginManager
login_manager = LoginManager()

# Ajouter un système de paiement
from stripe import Stripe
stripe_client = Stripe('your-key-here')
```

## 👨‍💻 Auteur

Transformé en site e-commerce fonctionnel - Septembre 2026

**Jules Chambonnière**
- Email: chambonnierejules@gmail.com
- Philosophie: "Les vainqueurs l'écrivent, les vaincus racontent l'histoire"

---

**Bon commerce! 🥖✨**
