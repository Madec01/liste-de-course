# 🍽️ Planificateur de Menus - Version Améliorée

Application web complète pour planifier vos menus hebdomadaires, gérer vos recettes et générer automatiquement des listes de courses optimisées.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## ✨ Fonctionnalités

### 🗓️ Planification de menus
- **Gestion multi-semaines** : Créez et gérez plusieurs semaines de menus
- **Portions personnalisables** : Ajustez le nombre de portions par repas
- **Statuts spéciaux** : Restaurant, copains, joker, etc.
- **Duplication** : Copiez une semaine en un clic
- **Remplissage automatique** : Génération aléatoire de repas équilibrés

### 🥕 Gestion d'ingrédients
- **Base de données** : 166 ingrédients pré-enregistrés
- **Catégories** : Protéines, féculents, légumes, autres
- **Rayons** : Organisation par rayon de supermarché
- **Favoris** : Marquez vos ingrédients préférés
- **Portions intelligentes** : Gestion par poids, volume ou quantité
- **Recherche & filtres** : Trouvez rapidement ce que vous cherchez

### 📖 Recettes
- **Création facile** : Composez vos recettes à partir des ingrédients
- **Tags personnalisables** : Végétarien, vegan, sans gluten, etc.
- **Tags personnalisés** : Créez vos propres étiquettes
- **Réutilisation** : Ajoutez vos recettes aux menus en un clic

### 🛒 Liste de courses
- **Génération automatique** : Calcul intelligent des quantités
- **Organisation par rayon** : Pour un shopping efficace
- **Calcul portions** : Adaptation automatique au nombre de convives
- **Export PDF** : Imprimez votre liste
- **Items personnalisés** : Ajoutez vos propres articles
- **Recherche en temps réel** : Filtrez votre liste

### 📊 Statistiques
- **Ingrédients populaires** : Top 5 des plus utilisés
- **Recettes favorites** : Vos recettes préférées
- **Aperçu global** : Nombre d'ingrédients, recettes, semaines
- **Graphiques visuels** : Visualisation claire des données

### 🎨 Thèmes
- **3 thèmes inclus** : Sombre, clair, forêt
- **Détection automatique** : S'adapte aux préférences système
- **Personnalisable** : Variables CSS modifiables

### 📅 Calendrier de saisonnalité
- **Fruits et légumes** : Sachez quand acheter local
- **Viandes et poissons** : Saisonnalité complète
- **Recherche** : Trouvez rapidement un produit
- **Indication pleine saison** : Optimisez vos achats

## 🚀 Nouveautés v2.0

### Import/Export 💾
- **Sauvegarde complète** : Exportez toutes vos données en JSON
- **Restauration** : Importez depuis un fichier de backup
- **Migration facile** : Transférez entre appareils
- **Métadonnées** : Versioning automatique

### Raccourcis clavier ⌨️
- `Ctrl/Cmd + E` : Exporter
- `Ctrl/Cmd + I` : Importer
- `Ctrl/Cmd + N` : Nouvelle semaine
- `Ctrl/Cmd + K` : Recherche rapide
- `Escape` : Fermer modale

### Sécurité 🔒
- **Sanitization XSS** : Protection contre les injections
- **Validation des données** : Contrôles stricts
- **Gestion quota** : Alerte espace de stockage

### Accessibilité ♿
- **Labels ARIA** : Support lecteurs d'écran
- **Navigation clavier** : Accessible sans souris
- **Contraste élevé** : Lisibilité optimale
- **Focus visible** : Indication claire

### Performance ⚡
- **Debouncing** : Recherche optimisée
- **Gestion erreurs** : Fallbacks robustes
- **Cache localStorage** : Sauvegarde automatique

## 📦 Installation

### Prérequis
- Navigateur web moderne (Chrome, Firefox, Safari, Edge)
- JavaScript activé
- LocalStorage disponible (5-10 MB recommandés)

### Installation simple
1. Téléchargez ou clonez ce repository
2. Ouvrez `index.html` dans votre navigateur
3. C'est tout ! Aucune installation serveur requise

### Avec améliorations
1. Assurez-vous d'avoir les 3 fichiers :
   - `index.html` (fichier principal)
   - `ameliorations.js` (nouvelles fonctionnalités)
   - `ameliorations.css` (styles additionnels)

2. Suivez le [Guide d'intégration](GUIDE_INTEGRATION.md)

3. Ouvrez dans votre navigateur

## 📚 Documentation

- [Analyse complète](ANALYSE.md) - Analyse technique du code
- [Améliorations](AMELIORATIONS.md) - Liste détaillée des améliorations
- [Guide d'intégration](GUIDE_INTEGRATION.md) - Comment intégrer les améliorations

## 🎯 Utilisation rapide

### Première utilisation

1. **Créez votre première semaine**
2. **Planifiez vos repas**
3. **Générez votre liste de courses**

Voir le guide complet dans la documentation.

## ⭐ Quick Start

```bash
# Clone le repository
git clone https://github.com/votre-repo/liste-de-course.git

# Ouvrir index.html
cd liste-de-course
open index.html
```

---

**Fait avec ❤️ et beaucoup de ☕**
