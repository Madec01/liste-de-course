# Guide d'intégration des améliorations

## 📋 Vue d'ensemble

Ce guide explique comment intégrer les améliorations dans votre planificateur de menus existant.

## 🚀 Installation rapide

### Option 1 : Intégration complète (recommandé)

Ajoutez les balises suivantes dans votre fichier HTML **avant** la balise `</head>` :

```html
<!-- CSS des améliorations -->
<style>
  /* Copier le contenu de ameliorations.css ici */
</style>
```

Ajoutez juste **avant** la balise `</body>` :

```html
<!-- JavaScript des améliorations -->
<script src="ameliorations.js"></script>

<!-- Intégration avec l'application existante -->
<script>
  // Attendre que APP soit initialisé
  window.addEventListener('load', function() {
    if (window.APP) {
      // Remplacer la fonction save par la version sécurisée
      APP.saveOriginal = APP.save;
      APP.save = function() {
        const result = window.MenuEnhancements.StorageManager.save({
          ingredients: this.ingredients,
          recipes: this.recipes,
          weeks: this.weeks,
          customTags: this.customTags
        });

        if (!result.success) {
          this.toast('⚠️ ' + result.message, 'error');
        }
      };

      // Ajouter les nouvelles méthodes à APP
      APP.exportJSON = window.MenuEnhancements.DataTransfer.exportJSON;
      APP.importJSON = window.MenuEnhancements.DataTransfer.importJSON;

      // Initialiser les raccourcis clavier
      console.log('✅ Améliorations intégrées !');
    }
  });
</script>
```

### Option 2 : Intégration sélective

Vous pouvez intégrer seulement certaines fonctionnalités :

```html
<script>
  // Import/Export uniquement
  APP.exportJSON = function() {
    window.MenuEnhancements.DataTransfer.exportJSON();
  };

  APP.importJSON = function(file) {
    window.MenuEnhancements.DataTransfer.importJSON(file);
  };
</script>
```

## 🎯 Ajout des boutons UI

### 1. Boutons Import/Export

Ajoutez dans la section "Paramètres" (`settings-view`) :

```html
<div class="import-export-section">
  <h3>📦 Sauvegarde & Restauration</h3>
  <p style="color:var(--text-3);font-size:14px;margin-bottom:15px">
    Exportez vos données pour créer une sauvegarde ou les transférer vers un autre appareil.
  </p>

  <div class="import-export-buttons">
    <button class="btn-export" onclick="APP.exportJSON()">
      💾 Exporter mes données
    </button>

    <button class="btn-import" onclick="document.getElementById('import-file-input').click()">
      📥 Importer des données
    </button>
  </div>

  <input
    type="file"
    id="import-file-input"
    accept=".json"
    onchange="APP.handleImport(event)"
    style="display:none">
</div>
```

Ajoutez la fonction de gestion :

```javascript
APP.handleImport = function(event) {
  const file = event.target.files[0];
  if (file) {
    window.MenuEnhancements.DataTransfer.importJSON(file)
      .then(() => {
        console.log('Import réussi !');
      })
      .catch(err => {
        console.error('Erreur import:', err);
      });
  }
  // Reset input
  event.target.value = '';
};
```

### 2. Bouton Dupliquer semaine

Modifiez la fonction `renderWeeksList` pour ajouter le bouton :

```javascript
APP.renderWeeksList = function() {
  // ... code existant ...

  // Dans la boucle forEach des semaines, modifiez les actions :
  card.innerHTML = `
    <div class="week-title">${week.name}</div>
    <div class="week-dates">${self.formatDateRange(week.startDate)}</div>
    <div style="color:#666;margin-bottom:10px">🍽️ ${mealCount} repas</div>
    <div class="week-actions">
      <button class="btn-edit" onclick="event.stopPropagation();APP.editWeek(${week.id})">✏️</button>
      <button class="btn-duplicate" onclick="event.stopPropagation();APP.duplicateWeek(${week.id})">📋</button>
      <button class="btn-delete" onclick="event.stopPropagation();APP.deleteWeek(${week.id})">🗑️</button>
    </div>
  `;

  // ... reste du code ...
};
```

Ajoutez la fonction de duplication :

```javascript
APP.duplicateWeek = function(weekId) {
  const week = this.weeks.find(w => w.id === weekId);
  if (!week) return;

  const self = this;
  this.confirm(
    'Dupliquer cette semaine ?',
    `Une copie de "${week.name}" sera créée avec tous ses repas.`,
    function() {
      const newId = Math.max(...self.weeks.map(w => w.id), 0) + 1;

      // Créer la copie
      const copy = {
        ...week,
        id: newId,
        name: week.name + ' (copie)',
        menu: JSON.parse(JSON.stringify(week.menu)), // Deep copy
        isCurrent: false
      };

      self.weeks.push(copy);
      self.save();
      self.renderWeeksList();
      self.toast(`✅ Semaine "${copy.name}" créée !`);
    }
  );
};
```

### 3. Onglet Statistiques

Ajoutez un nouveau bouton dans la navigation :

```html
<button onclick="APP.showView('stats')">📊 Statistiques</button>
```

Ajoutez la vue :

```html
<div id="stats-view" class="view">
  <h2>📊 Statistiques</h2>
  <div id="stats-container"></div>
</div>
```

Ajoutez la fonction de rendu :

```javascript
APP.renderStats = function() {
  const container = document.getElementById('stats-container');
  if (!container) return;

  const data = {
    ingredients: this.ingredients,
    recipes: this.recipes,
    weeks: this.weeks,
    customTags: this.customTags
  };

  const html = window.MenuEnhancements.Statistics.generateStatsReport(data);
  container.innerHTML = html;
};

// Appeler lors de l'affichage de la vue
// Modifier showView pour détecter 'stats'
const originalShowView = APP.showView;
APP.showView = function(viewName) {
  originalShowView.call(this, viewName);

  if (viewName === 'stats') {
    this.renderStats();
  }
};
```

### 4. Indicateur de raccourcis clavier

Ajoutez avant la fermeture de `<body>` :

```html
<div class="shortcuts-indicator">
  <div class="shortcuts-indicator-title">
    ⌨️ Raccourcis clavier
  </div>
  <div class="shortcuts-indicator-list">
    <kbd>Ctrl+E</kbd> Exporter<br>
    <kbd>Ctrl+I</kbd> Importer<br>
    <kbd>Ctrl+N</kbd> Nouvelle semaine<br>
    <kbd>Esc</kbd> Fermer modal
  </div>
</div>
```

## 🔧 Personnalisation

### Modifier les raccourcis clavier

Éditez le fichier `ameliorations.js`, section `KeyboardShortcuts` :

```javascript
KeyboardShortcuts.shortcuts = {
  'ctrl+e': 'Exporter', // Changez 'ctrl+e' par ce que vous voulez
  // ...
};
```

### Ajouter des statistiques personnalisées

```javascript
window.MenuEnhancements.Statistics.getCustomStat = function(data) {
  // Votre logique ici
  return {
    label: 'Ma stat',
    value: 42
  };
};
```

### Personnaliser les thèmes

Modifiez les variables CSS :

```css
[data-theme="monTheme"] {
  --primary: #ff6b6b;
  --primary-dark: #ee5a6f;
  --bg-gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  /* ... */
}
```

Puis ajoutez le bouton de thème :

```html
<button class="theme-btn" data-theme="monTheme" onclick="APP.changeTheme('monTheme')"></button>
```

## 🐛 Dépannage

### Les raccourcis ne fonctionnent pas

Vérifiez que `KeyboardShortcuts.init()` est bien appelé :

```javascript
window.addEventListener('DOMContentLoaded', () => {
  window.MenuEnhancements.KeyboardShortcuts.init();
});
```

### Import ne fonctionne pas

Vérifiez que l'input file est bien présent :

```javascript
const input = document.getElementById('import-file-input');
console.log('Input trouvé:', input); // Doit afficher l'élément
```

### Export produit une erreur

Vérifiez que les données sont valides :

```javascript
const data = window.MenuEnhancements.StorageManager.load();
console.log('Données à exporter:', data);
```

### Stockage plein

Utilisez la fonction de nettoyage :

```javascript
window.MenuEnhancements.StorageManager.cleanOldWeeks(2); // Garder 2 semaines
```

## 📱 Optimisation Mobile

Ajoutez le viewport meta si absent :

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
```

Ajoutez les méta pour PWA :

```html
<meta name="theme-color" content="#667eea">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

## 🔒 Sécurité

### Sanitize tous les inputs utilisateur

Remplacez les `innerHTML` par :

```javascript
// Avant
element.innerHTML = userInput;

// Après
element.textContent = window.MenuEnhancements.Security.sanitizeHTML(userInput);
```

### Valider les données

```javascript
// Avant
const name = document.getElementById('input').value;

// Après
const name = window.MenuEnhancements.Security.validateName(
  document.getElementById('input').value
);
```

## 🧪 Tests

Testez les fonctionnalités clés :

```javascript
// Test export
APP.exportJSON();
// Vérifiez qu'un fichier est téléchargé

// Test import
// 1. Exportez d'abord
// 2. Supprimez des données
// 3. Importez
// 4. Vérifiez que les données sont restaurées

// Test duplication
APP.duplicateWeek(1);
// Vérifiez qu'une nouvelle semaine apparaît

// Test statistiques
APP.showView('stats');
// Vérifiez que les stats s'affichent

// Test raccourcis
// Appuyez sur Ctrl+E
// Vérifiez que l'export se lance
```

## 📚 Ressources

- [Documentation jsPDF](https://github.com/parallax/jsPDF)
- [Guide accessibilité ARIA](https://www.w3.org/WAI/ARIA/apg/)
- [LocalStorage best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)

## 🆘 Support

En cas de problème :

1. Vérifiez la console (F12) pour les erreurs
2. Vérifiez que les fichiers sont bien chargés
3. Testez les fonctions individuellement
4. Consultez les exemples dans `AMELIORATIONS.md`

## ✅ Checklist d'intégration

- [ ] Fichiers `ameliorations.js` et `ameliorations.css` ajoutés
- [ ] Scripts d'initialisation ajoutés
- [ ] Boutons UI ajoutés
- [ ] Tests effectués
- [ ] Backup des données existantes créé
- [ ] Documentation lue
- [ ] Raccourcis clavier testés
- [ ] Mobile testé
- [ ] Sanitization activée
- [ ] Validation activée

## 🎉 Prochaines étapes

Une fois l'intégration terminée :

1. Testez avec de vraies données
2. Collectez les retours utilisateurs
3. Ajustez selon les besoins
4. Explorez les fonctionnalités avancées
5. Contribuez des améliorations !
