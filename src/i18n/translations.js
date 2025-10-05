/**
 * Internationalization (i18n) - IleRise
 * Languages: French (fr), English (en)
 * NASA Space Apps Challenge 2025
 */

export const translations = {
  // ========== COMMON ==========
  common: {
    back: {
      fr: 'Retour',
      en: 'Back',
      fon: 'Gbɔ'
    },
    continue: {
      fr: 'Continuer',
      en: 'Continue',
      fon: 'Yi ɖohu'
    },
    confirm: {
      fr: 'Confirmer',
      en: 'Confirm',
      fon: 'Jlǒ'
    },
    cancel: {
      fr: 'Annuler',
      en: 'Cancel',
      fon: 'Sɔ'
    },
    close: {
      fr: 'Fermer',
      en: 'Close',
      fon: 'Tu'
    },
    yes: {
      fr: 'Oui',
      en: 'Yes',
      fon: 'Ɛn'
    },
    no: {
      fr: 'Non',
      en: 'No',
      fon: 'A'
    },
    loading: {
      fr: 'Chargement...',
      en: 'Loading...',
      fon: 'É ka jí...'
    },
    error: {
      fr: 'Erreur',
      en: 'Error',
      fon: 'Nukún'
    },
    success: {
      fr: 'Succès',
      en: 'Success',
      fon: 'Nǔ vivi'
    }
  },

  // ========== HOME SCREEN ==========
  home: {
    title: {
      fr: 'IleRise',
      en: 'IleRise',
      fon: 'IleRise'
    },
    subtitle: {
      fr: 'AgroData Explorer',
      en: 'AgroData Explorer',
      fon: 'Agblɔmɛ Kpɔ́ɖenamɛ'
    },
    heroMessage: {
      fr: 'Sauvez AgriVerse avec les données NASA',
      en: 'Save AgriVerse with NASA data',
      fon: 'Ɖò AgriVerse kpo NASA lɛ nukúnmɛ tɔn lɛ'
    },
    btnStart: {
      fr: '🚀 Commencer',
      en: '🚀 Start',
      fon: '🚀 Jɛ'
    },
    btnTutorial: {
      fr: '🎓 Tutoriel Interactif',
      en: '🎓 Interactive Tutorial',
      fon: '🎓 Kplɔ́nkplɔ́n'
    },
    btnProfile: {
      fr: '👤 Mon Profil',
      en: '👤 My Profile',
      fon: '👤 Nye tɔn'
    },
    btnLogout: {
      fr: '🚪 Se déconnecter',
      en: '🚪 Logout',
      fon: '🚪 Do gó'
    },
    lives: {
      fr: 'Vies',
      en: 'Lives',
      fon: 'Gbɛzán'
    },
    coins: {
      fr: 'Pièces',
      en: 'Coins',
      fon: 'Kpɔ́n'
    },
    poweredBy: {
      fr: 'Powered by NASA Earth Data',
      en: 'Powered by NASA Earth Data',
      fon: 'NASA Ayikúngban Nukúnmɛ tɔn'
    }
  },

  // ========== AUTH SCREEN ==========
  auth: {
    login: {
      fr: 'Connexion',
      en: 'Login'
    },
    register: {
      fr: 'Inscription',
      en: 'Register'
    },
    guestMode: {
      fr: '🎮 Jouer en tant qu\'invité',
      en: '🎮 Play as Guest'
    },
    username: {
      fr: 'Nom d\'utilisateur',
      en: 'Username'
    },
    email: {
      fr: 'Email',
      en: 'Email'
    },
    password: {
      fr: 'Mot de passe',
      en: 'Password'
    },
    rememberMe: {
      fr: 'Se souvenir de moi',
      en: 'Remember me'
    },
    noAccount: {
      fr: 'Pas encore de compte ?',
      en: 'No account yet?'
    },
    hasAccount: {
      fr: 'Déjà un compte ?',
      en: 'Already have an account?'
    },
    btnLogin: {
      fr: 'Se connecter',
      en: 'Sign In'
    },
    btnRegister: {
      fr: 'S\'inscrire',
      en: 'Sign Up'
    },
    logout: {
      fr: 'Déconnexion',
      en: 'Logout',
      fon: 'Dó gbɔ'
    },
    logoutConfirm: {
      fr: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      en: 'Are you sure you want to logout?',
      fon: 'Ɖò à lɛ ɖó wà dó gbɔ à?'
    }
  },

  // ========== LOCATION SELECTION ==========
  location: {
    title: {
      fr: '📍 Choisissez votre localité',
      en: '📍 Choose your location'
    },
    subtitle: {
      fr: 'Sélectionnez une ville du Bénin pour charger les données satellites NASA',
      en: 'Select a city in Benin to load NASA satellite data'
    },
    hint: {
      fr: '💡 Les conditions climatiques varient selon les régions',
      en: '💡 Climate conditions vary by region'
    },
    ndvi: {
      fr: 'NDVI',
      en: 'NDVI'
    },
    temperature: {
      fr: 'Température',
      en: 'Temperature'
    },
    soilMoisture: {
      fr: 'Humidité Sol',
      en: 'Soil Moisture'
    },
    precipitation: {
      fr: 'Précipitations',
      en: 'Precipitation'
    },
    btnConfirm: {
      fr: 'Confirmer et Choisir Culture',
      en: 'Confirm and Choose Crop'
    },
    statusGood: {
      fr: '🟢 Bonne végétation',
      en: '🟢 Good vegetation'
    },
    statusMedium: {
      fr: '🟡 Végétation moyenne',
      en: '🟡 Medium vegetation'
    },
    statusPoor: {
      fr: '🔴 Végétation faible',
      en: '🔴 Poor vegetation'
    }
  },

  // ========== CROP SELECTION ==========
  cropSelect: {
    title: {
      fr: 'Choisissez votre culture',
      en: 'Choose your crop'
    },
    btnKnowledgeCards: {
      fr: '📚 Cartes Éducatives NASA',
      en: '📚 NASA Educational Cards'
    },
    locked: {
      fr: '🔒 Bloqué',
      en: '🔒 Locked'
    },
    unlock: {
      fr: 'Débloquer',
      en: 'Unlock'
    },
    unlockCost: {
      fr: 'Coût: {cost} pièces',
      en: 'Cost: {cost} coins'
    }
  },

  // ========== LEVEL SELECTION ==========
  levelSelect: {
    title: {
      fr: '{crop}',
      en: '{crop}'
    },
    description: {
      fr: 'Progressez à travers 3 niveaux de difficulté croissante',
      en: 'Progress through 3 levels of increasing difficulty'
    },
    easy: {
      fr: 'Facile',
      en: 'Easy'
    },
    medium: {
      fr: 'Moyen',
      en: 'Medium'
    },
    hard: {
      fr: 'Difficile',
      en: 'Hard'
    },
    locked: {
      fr: 'Obtenir 3 étoiles au niveau précédent',
      en: 'Get 3 stars in previous level'
    },
    bestScore: {
      fr: 'Meilleur score: {score}',
      en: 'Best score: {score}'
    },
    stars: {
      fr: 'Étoiles',
      en: 'Stars'
    }
  },

  // ========== GAME SCREEN ==========
  game: {
    title: {
      fr: '{crop} - Niveau {level}',
      en: '{crop} - Level {level}'
    },
    loadingField: {
      fr: 'Chargement de votre champ...',
      en: 'Loading your field...'
    },
    parameters: {
      fr: 'Paramètres de Culture',
      en: 'Crop Parameters'
    },
    irrigation: {
      fr: '💧 Irrigation',
      en: '💧 Irrigation'
    },
    npkFertilizer: {
      fr: '🌾 Engrais NPK',
      en: '🌾 NPK Fertilizer'
    },
    soilPH: {
      fr: '⚗️ pH du Sol',
      en: '⚗️ Soil pH'
    },
    btnNASAHelp: {
      fr: '📡 Aide NASA',
      en: '📡 NASA Help'
    },
    btnSimulate: {
      fr: 'Lancer la Simulation',
      en: 'Run Simulation'
    },
    comingSoon: {
      fr: 'Prochainement',
      en: 'Coming Soon'
    },
    uploadData: {
      fr: '📤 Importer vos données',
      en: '📤 Upload your data'
    },
    inDevelopment: {
      fr: '(En développement)',
      en: '(In development)'
    },
    noLives: {
      fr: 'Plus de vies',
      en: 'No lives left'
    },
    noLivesMessage: {
      fr: 'Vous n\'avez plus de vies. Revenez dans {time}.',
      en: 'You have no lives left. Come back in {time}.'
    }
  },

  // ========== SIMULATION PROGRESS ==========
  simulation: {
    title: {
      fr: 'Simulation en cours...',
      en: 'Simulation in progress...'
    },
    day: {
      fr: 'Jour {day}/90',
      en: 'Day {day}/90'
    },
    phase: {
      fr: 'Phase: {phase}',
      en: 'Phase: {phase}'
    },
    germination: {
      fr: 'Germination',
      en: 'Germination'
    },
    vegetation: {
      fr: 'Végétation',
      en: 'Vegetation'
    },
    flowering: {
      fr: 'Floraison',
      en: 'Flowering'
    },
    maturation: {
      fr: 'Maturation',
      en: 'Maturation'
    },
    statusGermination: {
      fr: 'Germination des graines...',
      en: 'Seed germination...'
    },
    statusVegetation: {
      fr: 'Croissance végétative...',
      en: 'Vegetative growth...'
    },
    statusFlowering: {
      fr: 'Floraison en cours...',
      en: 'Flowering in progress...'
    },
    statusMaturation: {
      fr: 'Maturation finale...',
      en: 'Final maturation...'
    }
  },

  // ========== RESULTS SCREEN ==========
  results: {
    titleSuccess: {
      fr: '🎉 Niveau Réussi !',
      en: '🎉 Level Passed!'
    },
    titleFailed: {
      fr: '😔 Niveau Échoué',
      en: '😔 Level Failed'
    },
    score: {
      fr: 'Score',
      en: 'Score'
    },
    yield: {
      fr: 'Rendement',
      en: 'Yield'
    },
    target: {
      fr: 'Objectif',
      en: 'Target'
    },
    coinsEarned: {
      fr: 'Pièces gagnées',
      en: 'Coins earned'
    },
    evolution: {
      fr: '📊 Évolution du Champ',
      en: '📊 Field Evolution'
    },
    before: {
      fr: 'AVANT',
      en: 'BEFORE'
    },
    after: {
      fr: 'APRÈS',
      en: 'AFTER'
    },
    days: {
      fr: '{days} jours',
      en: '{days} days'
    },
    plantHealth: {
      fr: 'Santé des plantes',
      en: 'Plant health'
    },
    soilMoisture: {
      fr: 'Humidité du sol',
      en: 'Soil moisture'
    },
    plantHeight: {
      fr: 'Hauteur plants',
      en: 'Plant height'
    },
    diagnosis: {
      fr: '🔍 Diagnostic',
      en: '🔍 Diagnosis'
    },
    didYouKnow: {
      fr: '📚 Savais-tu que...?',
      en: '📚 Did you know...?'
    },
    btnRetry: {
      fr: '🔄 Rejouer',
      en: '🔄 Retry'
    },
    btnNextLevel: {
      fr: '➡️ Niveau Suivant',
      en: '➡️ Next Level'
    },
    btnMainMenu: {
      fr: '🏠 Menu Principal',
      en: '🏠 Main Menu'
    },
    excellentWork: {
      fr: 'Excellent travail !',
      en: 'Excellent work!'
    },
    goodWork: {
      fr: 'Bon travail !',
      en: 'Good work!'
    },
    tryAgain: {
      fr: 'Essayez encore',
      en: 'Try again'
    },
    timeline90Days: {
      fr: '📅 Évolution sur 90 jours',
      en: '📅 90-day Evolution'
    }
  },

  // ========== PROFILE SCREEN ==========
  profile: {
    title: {
      fr: 'Mon Profil',
      en: 'My Profile'
    },
    btnExport: {
      fr: '📥 Exporter',
      en: '📥 Export'
    },
    level: {
      fr: 'Niveau',
      en: 'Level'
    },
    gamesPlayed: {
      fr: 'Parties jouées',
      en: 'Games played'
    },
    totalStars: {
      fr: 'Étoiles totales',
      en: 'Total stars'
    },
    livesRemaining: {
      fr: 'Vies restantes',
      en: 'Lives remaining'
    },
    competences: {
      fr: '📊 Compétences',
      en: '📊 Skills'
    },
    recentGames: {
      fr: '🎮 Parties Récentes',
      en: '🎮 Recent Games'
    },
    achievements: {
      fr: '🏆 Succès',
      en: '🏆 Achievements'
    },
    titleBeginner: {
      fr: 'Débutant',
      en: 'Beginner'
    },
    titleApprentice: {
      fr: 'Apprenti',
      en: 'Apprentice'
    },
    titleSkilled: {
      fr: 'Agriculteur Averti',
      en: 'Skilled Farmer'
    },
    titleConfirmed: {
      fr: 'Agronome Confirmé',
      en: 'Confirmed Agronomist'
    },
    titleExpert: {
      fr: 'Expert NASA',
      en: 'NASA Expert'
    }
  },

  // ========== KNOWLEDGE CARDS ==========
  knowledge: {
    title: {
      fr: '📚 Cartes de Savoir',
      en: '📚 Knowledge Cards'
    },
    filterAll: {
      fr: 'Toutes',
      en: 'All'
    },
    filterWater: {
      fr: 'Eau',
      en: 'Water'
    },
    filterNutrients: {
      fr: 'Nutriments',
      en: 'Nutrients'
    },
    filterSoil: {
      fr: 'Sol',
      en: 'Soil'
    },
    filterClimate: {
      fr: 'Climat',
      en: 'Climate'
    },
    filterNASA: {
      fr: 'NASA',
      en: 'NASA'
    },
    filterPractices: {
      fr: 'Pratiques',
      en: 'Practices'
    },
    cardsUnlocked: {
      fr: '{count} carte(s) débloquée(s)',
      en: '{count} card(s) unlocked'
    }
  },

  // ========== NASA HELP MODAL ==========
  nasaHelp: {
    title: {
      fr: '📡 Recommandations NASA',
      en: '📡 NASA Recommendations'
    },
    subtitle: {
      fr: 'Données satellites appliquées à votre champ',
      en: 'Satellite data applied to your field'
    },
    adjustments: {
      fr: 'Ajustements effectués:',
      en: 'Adjustments made:'
    },
    irrigation: {
      fr: '💧 Irrigation',
      en: '💧 Irrigation'
    },
    npk: {
      fr: '🌾 Engrais NPK',
      en: '🌾 NPK Fertilizer'
    },
    ph: {
      fr: '⚗️ pH du Sol',
      en: '⚗️ Soil pH'
    },
    usage: {
      fr: 'Utilisation: {current}/{max}',
      en: 'Usage: {current}/{max}'
    },
    close: {
      fr: 'Compris !',
      en: 'Got it!'
    }
  },

  // ========== TUTORIAL ==========
  tutorial: {
    welcome: {
      fr: 'Bienvenue dans IleRise',
      en: 'Welcome to IleRise'
    },
    step1: {
      fr: 'Ajustez les paramètres de culture',
      en: 'Adjust crop parameters'
    },
    step2: {
      fr: 'Utilisez les données NASA',
      en: 'Use NASA data'
    },
    step3: {
      fr: 'Lancez la simulation',
      en: 'Run the simulation'
    },
    step4: {
      fr: 'Analysez vos résultats',
      en: 'Analyze your results'
    },
    btnSkip: {
      fr: 'Passer',
      en: 'Skip'
    },
    btnNext: {
      fr: 'Suivant',
      en: 'Next'
    },
    btnFinish: {
      fr: 'Terminer',
      en: 'Finish'
    }
  },

  // ========== NOTIFICATIONS ==========
  notifications: {
    livesRestored: {
      fr: '❤️ Vies restaurées !',
      en: '❤️ Lives restored!'
    },
    levelUnlocked: {
      fr: '🎉 Nouveau niveau débloqué !',
      en: '🎉 New level unlocked!'
    },
    cropUnlocked: {
      fr: '🌾 Nouvelle culture débloquée !',
      en: '🌾 New crop unlocked!'
    },
    achievementUnlocked: {
      fr: '🏆 Succès débloqué !',
      en: '🏆 Achievement unlocked!'
    },
    exportSuccess: {
      fr: '✅ Exportation réussie',
      en: '✅ Export successful'
    },
    exportMessage: {
      fr: 'Vos données de profil ont été téléchargées avec succès !',
      en: 'Your profile data has been successfully downloaded!'
    }
  },

  // ========== ERRORS ==========
  errors: {
    noInternet: {
      fr: 'Pas de connexion Internet',
      en: 'No Internet connection'
    },
    serverError: {
      fr: 'Erreur serveur',
      en: 'Server error'
    },
    loadingFailed: {
      fr: 'Échec du chargement',
      en: 'Loading failed'
    },
    invalidCredentials: {
      fr: 'Identifiants invalides',
      en: 'Invalid credentials'
    },
    notEnoughCoins: {
      fr: 'Pas assez de pièces',
      en: 'Not enough coins'
    },
    alreadyUnlocked: {
      fr: 'Déjà débloqué',
      en: 'Already unlocked'
    }
  },

  // ========== CROPS ==========
  crops: {
    maize: {
      fr: 'Maïs',
      en: 'Maize'
    },
    rice: {
      fr: 'Riz',
      en: 'Rice'
    },
    cowpea: {
      fr: 'Niébé',
      en: 'Cowpea'
    },
    cassava: {
      fr: 'Manioc',
      en: 'Cassava'
    },
    cacao: {
      fr: 'Cacao',
      en: 'Cacao'
    },
    cotton: {
      fr: 'Coton',
      en: 'Cotton'
    },
    wheat: {
      fr: 'Blé',
      en: 'Wheat'
    },
    potato: {
      fr: 'Pomme de terre',
      en: 'Potato'
    },
    tomato: {
      fr: 'Tomate',
      en: 'Tomato'
    },
    sorghum: {
      fr: 'Sorgho',
      en: 'Sorghum'
    }
  }
};

/**
 * Get translation for a key
 * @param {string} key - Translation key (e.g., 'home.title')
 * @param {string} lang - Language code ('fr' or 'en')
 * @param {object} params - Parameters to replace in translation
 * @returns {string} Translated text
 */
export function t(key, lang = 'fr', params = {}) {
  const keys = key.split('.');
  let value = translations;

  for (const k of keys) {
    value = value?.[k];
    if (!value) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  let text = value[lang] || value['fr'] || key;

  // Replace parameters
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });

  return text;
}

/**
 * Get current language from localStorage
 * @returns {string} Language code
 */
export function getCurrentLanguage() {
  return localStorage.getItem('ilerise_language') || 'fr';
}

/**
 * Set current language
 * @param {string} lang - Language code ('fr' or 'en')
 */
export function setLanguage(lang) {
  if (!['fr', 'en'].includes(lang)) {
    console.warn(`Unsupported language: ${lang}`);
    return;
  }

  localStorage.setItem('ilerise_language', lang);
  document.documentElement.lang = lang;

  // Emit custom event for UI update
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
}

export default { translations, t, getCurrentLanguage, setLanguage };
