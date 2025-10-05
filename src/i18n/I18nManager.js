/**
 * I18nManager.js
 * Manages internationalization (i18n) for IleRise
 * Automatically updates DOM elements with translation keys
 */

import { t, getCurrentLanguage, setLanguage, translations } from './translations.js';

export class I18nManager {
  constructor() {
    this.currentLang = getCurrentLanguage();
    this.observers = [];
  }

  /**
   * Initialize i18n system
   */
  init() {
    // Set HTML lang attribute
    document.documentElement.lang = this.currentLang;

    // Listen for language change events
    window.addEventListener('languagechange', (e) => {
      this.currentLang = e.detail.lang;
      this.updateAllTranslations();
    });

    // Initial translation
    this.updateAllTranslations();

    console.log(`✅ I18n initialized (${this.currentLang})`);
  }

  /**
   * Translate a key
   * @param {string} key - Translation key
   * @param {object} params - Parameters to replace
   * @returns {string} Translated text
   */
  translate(key, params = {}) {
    return t(key, this.currentLang, params);
  }

  /**
   * Change language
   * @param {string} lang - Language code ('fr' or 'en')
   */
  changeLanguage(lang) {
    if (lang === this.currentLang) return;

    setLanguage(lang);
    this.currentLang = lang;
    this.updateAllTranslations();

    console.log(`🌐 Language changed to: ${lang}`);
  }

  /**
   * Get available languages
   * @returns {Array} List of language objects
   */
  getAvailableLanguages() {
    return [
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'fon', name: 'Fon', flag: '🇧🇯' }
    ];
  }

  /**
   * Update all DOM elements with translations
   */
  updateAllTranslations() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const params = this.getParamsFromElement(el);
      el.textContent = this.translate(key, params);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.translate(key);
    });

    // Update aria-labels
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      el.setAttribute('aria-label', this.translate(key));
    });

    // Update titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.setAttribute('title', this.translate(key));
    });

    // Notify observers
    this.notifyObservers();
  }

  /**
   * Get parameters from element's data attributes
   * @param {HTMLElement} element
   * @returns {object} Parameters
   */
  getParamsFromElement(element) {
    const params = {};
    const dataset = element.dataset;

    Object.keys(dataset).forEach(key => {
      if (key.startsWith('i18nParam')) {
        const paramName = key.replace('i18nParam', '').toLowerCase();
        params[paramName] = dataset[key];
      }
    });

    return params;
  }

  /**
   * Translate a dynamic element
   * @param {string} key - Translation key
   * @param {object} params - Parameters
   * @returns {string} Translated text
   */
  translateDynamic(key, params = {}) {
    return this.translate(key, params);
  }

  /**
   * Add observer for language changes
   * @param {Function} callback - Called when language changes
   */
  addObserver(callback) {
    this.observers.push(callback);
  }

  /**
   * Notify all observers
   */
  notifyObservers() {
    this.observers.forEach(callback => callback(this.currentLang));
  }

  /**
   * Create language switcher button
   * @returns {HTMLElement} Language switcher element
   */
  createLanguageSwitcher() {
    const container = document.createElement('div');
    container.className = 'language-switcher';

    const currentLang = this.getAvailableLanguages().find(l => l.code === this.currentLang);

    container.innerHTML = `
      <button class="btn-language" id="btn-language-toggle">
        <span class="lang-flag">${currentLang.flag}</span>
        <span class="lang-code">${currentLang.code.toUpperCase()}</span>
      </button>
      <div class="language-dropdown" id="language-dropdown" style="display:none;">
        ${this.getAvailableLanguages().map(lang => `
          <button class="language-option ${lang.code === this.currentLang ? 'active' : ''}" data-lang="${lang.code}">
            <span class="lang-flag">${lang.flag}</span>
            <span class="lang-name">${lang.name}</span>
          </button>
        `).join('')}
      </div>
    `;

    // Toggle dropdown
    const toggleBtn = container.querySelector('#btn-language-toggle');
    const dropdown = container.querySelector('#language-dropdown');

    toggleBtn.addEventListener('click', () => {
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    // Language selection
    container.querySelectorAll('.language-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        this.changeLanguage(lang);
        dropdown.style.display = 'none';

        // Update button
        const selectedLang = this.getAvailableLanguages().find(l => l.code === lang);
        toggleBtn.innerHTML = `
          <span class="lang-flag">${selectedLang.flag}</span>
          <span class="lang-code">${selectedLang.code.toUpperCase()}</span>
        `;

        // Update active state
        container.querySelectorAll('.language-option').forEach(o => {
          o.classList.toggle('active', o.getAttribute('data-lang') === lang);
        });
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    return container;
  }

  /**
   * Get translation object for a specific section
   * @param {string} section - Section name (e.g., 'home', 'game')
   * @returns {object} Section translations
   */
  getSection(section) {
    const sectionData = translations[section];
    if (!sectionData) return {};

    const result = {};
    Object.keys(sectionData).forEach(key => {
      result[key] = sectionData[key][this.currentLang] || sectionData[key]['fr'];
    });

    return result;
  }

  /**
   * Format number according to locale
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  formatNumber(num) {
    const locale = this.currentLang === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.NumberFormat(locale).format(num);
  }

  /**
   * Format date according to locale
   * @param {Date} date - Date to format
   * @returns {string} Formatted date
   */
  formatDate(date) {
    const locale = this.currentLang === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
}

export default I18nManager;
