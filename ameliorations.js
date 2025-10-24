/**
 * AMÉLIORATIONS DU PLANIFICATEUR DE MENUS
 * À intégrer dans le fichier HTML principal
 */

// ============================================================================
// 1. SANITIZATION & SÉCURITÉ
// ============================================================================

const Security = {
  /**
   * Nettoie une chaîne HTML pour prévenir les XSS
   */
  sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Nettoie un attribut HTML
   */
  sanitizeAttribute(str) {
    if (!str) return '';
    return String(str).replace(/['"<>&]/g, c => ({
      "'": '&#39;',
      '"': '&quot;',
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;'
    }[c]));
  },

  /**
   * Valide un nom (ingrédient, recette, semaine)
   */
  validateName(name) {
    const cleaned = String(name || '').trim();
    if (cleaned.length === 0) {
      throw new Error('Le nom ne peut pas être vide');
    }
    if (cleaned.length > 100) {
      throw new Error('Le nom est trop long (max 100 caractères)');
    }
    return cleaned;
  },

  /**
   * Valide un nombre de portions
   */
  validatePortions(value) {
    const num = parseInt(value);
    if (isNaN(num) || num < 1 || num > 20) {
      throw new Error('Les portions doivent être entre 1 et 20');
    }
    return num;
  }
};

// ============================================================================
// 2. GESTION AMÉLIORÉE DU STORAGE
// ============================================================================

const StorageManager = {
  QUOTA_WARNING_THRESHOLD: 0.8, // 80%
  STORAGE_KEY: 'menuData',

  /**
   * Sauvegarde avec gestion d'erreurs
   */
  save(data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.STORAGE_KEY, serialized);
      this.checkQuota();
      return { success: true };
    } catch(e) {
      console.error('Erreur sauvegarde:', e);

      if (e.name === 'QuotaExceededError') {
        return {
          success: false,
          error: 'quota',
          message: 'Espace de stockage plein'
        };
      }

      return {
        success: false,
        error: 'unknown',
        message: e.message
      };
    }
  },

  /**
   * Charge les données avec validation
   */
  load() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);

      // Validation basique de la structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Format de données invalide');
      }

      return parsed;
    } catch(e) {
      console.error('Erreur chargement:', e);
      return null;
    }
  },

  /**
   * Vérifie l'utilisation du quota
   */
  async checkQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const {usage, quota} = await navigator.storage.estimate();
        const percentUsed = usage / quota;

        if (percentUsed > this.QUOTA_WARNING_THRESHOLD) {
          console.warn(`⚠️ Stockage à ${(percentUsed * 100).toFixed(1)}%`);
          // Afficher un toast si nécessaire
          if (window.APP && percentUsed > 0.9) {
            APP.toast('Espace de stockage presque plein. Pensez à exporter vos données.', 'warning');
          }
        }

        return { usage, quota, percentUsed };
      } catch(e) {
        console.error('Erreur quota:', e);
      }
    }
    return null;
  },

  /**
   * Nettoie les anciennes semaines
   */
  cleanOldWeeks(weeksToKeep = 4) {
    const data = this.load();
    if (!data || !data.weeks) return;

    // Trier par date (plus récentes en premier)
    data.weeks.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    // Garder seulement les N plus récentes + celle marquée "current"
    const currentWeek = data.weeks.find(w => w.isCurrent);
    const recentWeeks = data.weeks.slice(0, weeksToKeep);

    // Fusionner et dédupliquer
    const toKeep = currentWeek
      ? [...new Set([currentWeek, ...recentWeeks])]
      : recentWeeks;

    data.weeks = toKeep;
    this.save(data);

    return {
      kept: toKeep.length,
      removed: data.weeks.length - toKeep.length
    };
  }
};

// ============================================================================
// 3. IMPORT / EXPORT
// ============================================================================

const DataTransfer = {
  /**
   * Exporte toutes les données en JSON
   */
  exportJSON() {
    try {
      const data = StorageManager.load();
      if (!data) {
        throw new Error('Aucune donnée à exporter');
      }

      // Ajouter métadonnées
      const exportData = {
        version: '2.0.0',
        exportDate: new Date().toISOString(),
        data: data
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `menu-planificateur-${new Date().toISOString().split('T')[0]}.json`;
      a.click();

      URL.revokeObjectURL(url);

      if (window.APP) {
        APP.toast('✅ Export réussi !', 'success');
      }

      return true;
    } catch(e) {
      console.error('Erreur export:', e);
      if (window.APP) {
        APP.toast('❌ Erreur lors de l\'export', 'error');
      }
      return false;
    }
  },

  /**
   * Importe des données depuis JSON
   */
  importJSON(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('Aucun fichier sélectionné'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const imported = JSON.parse(content);

          // Validation du format
          if (!imported.data || !imported.version) {
            throw new Error('Format de fichier invalide');
          }

          // Vérifier la compatibilité de version
          const importVersion = parseFloat(imported.version);
          if (importVersion < 1.0) {
            throw new Error('Version trop ancienne, non compatible');
          }

          // Sauvegarder
          const result = StorageManager.save(imported.data);

          if (!result.success) {
            throw new Error(result.message);
          }

          if (window.APP) {
            APP.toast('✅ Import réussi ! Rechargement...', 'success');

            // Recharger l'app après un court délai
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }

          resolve(imported.data);
        } catch(err) {
          console.error('Erreur import:', err);
          if (window.APP) {
            APP.toast('❌ Erreur : ' + err.message, 'error');
          }
          reject(err);
        }
      };

      reader.onerror = () => {
        const error = new Error('Erreur de lecture du fichier');
        if (window.APP) {
          APP.toast('❌ ' + error.message, 'error');
        }
        reject(error);
      };

      reader.readAsText(file);
    });
  },

  /**
   * Export PDF amélioré avec meilleur formatage
   */
  exportPDFAdvanced(weekData) {
    if (typeof window.jspdf === 'undefined') {
      console.error('jsPDF non chargé');
      return false;
    }

    const {jsPDF} = window.jspdf;
    const doc = new jsPDF();

    // En-tête avec logo/titre
    doc.setFontSize(24);
    doc.setTextColor(102, 126, 234); // Couleur primaire
    doc.text('🍽️ Plan de Menu', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(weekData.name || 'Semaine', 105, 30, { align: 'center' });
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, 37, { align: 'center' });

    // Ligne de séparation
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);

    let y = 50;

    // TODO: Ajouter le contenu du menu de manière formatée
    // (Code à compléter selon les besoins spécifiques)

    doc.save(`menu-${weekData.name.replace(/\s+/g, '-')}.pdf`);
    return true;
  }
};

// ============================================================================
// 4. RACCOURCIS CLAVIER
// ============================================================================

const KeyboardShortcuts = {
  shortcuts: {
    'ctrl+e': 'Exporter les données',
    'ctrl+i': 'Importer des données',
    'ctrl+n': 'Nouvelle semaine',
    'ctrl+k': 'Recherche rapide',
    'escape': 'Fermer la modale active'
  },

  init() {
    document.addEventListener('keydown', (e) => {
      const key = this.getKeyCombo(e);

      switch(key) {
        case 'ctrl+e':
        case 'meta+e': // Mac
          e.preventDefault();
          DataTransfer.exportJSON();
          break;

        case 'ctrl+i':
        case 'meta+i':
          e.preventDefault();
          document.getElementById('import-file-input')?.click();
          break;

        case 'ctrl+n':
        case 'meta+n':
          e.preventDefault();
          if (window.APP) {
            APP.showWeekModal();
          }
          break;

        case 'ctrl+k':
        case 'meta+k':
          e.preventDefault();
          // Focus sur la recherche si disponible
          const searchInput = document.querySelector('.search-input');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
          break;

        case 'escape':
          // Fermer la modale active
          const activeModal = document.querySelector('.modal-overlay.active');
          if (activeModal) {
            activeModal.click(); // Simule un clic sur le backdrop
          }
          break;
      }
    });
  },

  getKeyCombo(e) {
    const parts = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.metaKey) parts.push('meta');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');

    const key = e.key.toLowerCase();
    if (key !== 'control' && key !== 'meta' && key !== 'alt' && key !== 'shift') {
      parts.push(key);
    }

    return parts.join('+');
  },

  showHelp() {
    let html = '<div class="shortcuts-help"><h3>⌨️ Raccourcis clavier</h3><ul>';

    for (const [combo, description] of Object.entries(this.shortcuts)) {
      const displayCombo = combo
        .replace('ctrl', window.navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
        .replace('meta', '⌘')
        .replace('+', ' + ')
        .toUpperCase();

      html += `<li><kbd>${displayCombo}</kbd> ${description}</li>`;
    }

    html += '</ul></div>';

    return html;
  }
};

// ============================================================================
// 5. UTILITAIRES DIVERS
// ============================================================================

const Utils = {
  /**
   * Debounce une fonction
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle une fonction
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Copie du texte dans le presse-papier
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch(err) {
      // Fallback pour anciens navigateurs
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand('copy');
        return true;
      } catch(e) {
        console.error('Erreur copie:', e);
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  },

  /**
   * Formate un nombre avec séparateurs
   */
  formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
  },

  /**
   * Génère un ID unique
   */
  generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Trouve les doublons dans un tableau
   */
  findDuplicates(arr, key) {
    const seen = new Set();
    const duplicates = new Set();

    for (const item of arr) {
      const value = key ? item[key] : item;
      if (seen.has(value)) {
        duplicates.add(value);
      }
      seen.add(value);
    }

    return Array.from(duplicates);
  }
};

// ============================================================================
// 6. STATISTIQUES
// ============================================================================

const Statistics = {
  /**
   * Calcule les ingrédients les plus utilisés
   */
  getMostUsedIngredients(weeks, ingredients, limit = 10) {
    const counts = {};

    weeks.forEach(week => {
      Object.values(week.menu || {}).forEach(meal => {
        // Ingrédients directs
        (meal.ingredients || []).forEach(id => {
          counts[id] = (counts[id] || 0) + 1;
        });

        // Ingrédients via recettes
        (meal.recipes || []).forEach(recipeId => {
          const recipe = window.APP?.recipes?.find(r => r.id === recipeId);
          if (recipe) {
            recipe.ingredients.forEach(id => {
              counts[id] = (counts[id] || 0) + 1;
            });
          }
        });
      });
    });

    // Convertir en tableau et trier
    const sorted = Object.entries(counts)
      .map(([id, count]) => {
        const ingredient = ingredients.find(i => i.id === parseInt(id));
        return { ingredient, count };
      })
      .filter(item => item.ingredient)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sorted;
  },

  /**
   * Calcule les recettes les plus utilisées
   */
  getMostUsedRecipes(weeks, recipes, limit = 10) {
    const counts = {};

    weeks.forEach(week => {
      Object.values(week.menu || {}).forEach(meal => {
        (meal.recipes || []).forEach(recipeId => {
          counts[recipeId] = (counts[recipeId] || 0) + 1;
        });
      });
    });

    const sorted = Object.entries(counts)
      .map(([id, count]) => {
        const recipe = recipes.find(r => r.id === parseInt(id));
        return { recipe, count };
      })
      .filter(item => item.recipe)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sorted;
  },

  /**
   * Calcule les statistiques générales
   */
  getGeneralStats(data) {
    return {
      totalIngredients: data.ingredients?.length || 0,
      totalRecipes: data.recipes?.length || 0,
      totalWeeks: data.weeks?.length || 0,
      totalMeals: this.countTotalMeals(data.weeks),
      favoriteIngredients: data.ingredients?.filter(i => i.favorite)?.length || 0,
      customTags: data.customTags?.length || 0
    };
  },

  countTotalMeals(weeks) {
    let total = 0;
    (weeks || []).forEach(week => {
      total += Object.keys(week.menu || {}).length;
    });
    return total;
  },

  /**
   * Génère un rapport HTML
   */
  generateStatsReport(data) {
    const stats = this.getGeneralStats(data);
    const topIngredients = this.getMostUsedIngredients(
      data.weeks || [],
      data.ingredients || [],
      5
    );
    const topRecipes = this.getMostUsedRecipes(
      data.weeks || [],
      data.recipes || [],
      5
    );

    let html = '<div class="stats-report">';

    // Stats générales
    html += '<div class="stats-section">';
    html += '<h3>📊 Statistiques générales</h3>';
    html += '<div class="stats-grid">';
    html += `<div class="stat-item"><span class="stat-value">${stats.totalIngredients}</span><span class="stat-label">Ingrédients</span></div>`;
    html += `<div class="stat-item"><span class="stat-value">${stats.totalRecipes}</span><span class="stat-label">Recettes</span></div>`;
    html += `<div class="stat-item"><span class="stat-value">${stats.totalWeeks}</span><span class="stat-label">Semaines</span></div>`;
    html += `<div class="stat-item"><span class="stat-value">${stats.totalMeals}</span><span class="stat-label">Repas planifiés</span></div>`;
    html += '</div></div>';

    // Top ingrédients
    if (topIngredients.length > 0) {
      html += '<div class="stats-section">';
      html += '<h3>🥇 Ingrédients les plus utilisés</h3>';
      html += '<ul class="stats-list">';
      topIngredients.forEach((item, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍';
        html += `<li>${medal} <strong>${item.ingredient.name}</strong> <span class="count">×${item.count}</span></li>`;
      });
      html += '</ul></div>';
    }

    // Top recettes
    if (topRecipes.length > 0) {
      html += '<div class="stats-section">';
      html += '<h3>📖 Recettes préférées</h3>';
      html += '<ul class="stats-list">';
      topRecipes.forEach((item, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍';
        html += `<li>${medal} <strong>${item.recipe.name}</strong> <span class="count">×${item.count}</span></li>`;
      });
      html += '</ul></div>';
    }

    html += '</div>';

    return html;
  }
};

// ============================================================================
// 7. INIT ET EXPORT
// ============================================================================

// Initialiser les raccourcis clavier au chargement
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    KeyboardShortcuts.init();
    console.log('✅ Améliorations chargées');
  });
}

// Exporter pour utilisation globale
if (typeof window !== 'undefined') {
  window.MenuEnhancements = {
    Security,
    StorageManager,
    DataTransfer,
    KeyboardShortcuts,
    Utils,
    Statistics
  };
}

// Export pour modules (si besoin)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Security,
    StorageManager,
    DataTransfer,
    KeyboardShortcuts,
    Utils,
    Statistics
  };
}
