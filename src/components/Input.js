/**
 * Input Component
 * Composant input avec label et validation
 */

export class Input {
  /**
   * Crée un input
   * @param {Object} options - Options de l'input
   * @param {string} options.label - Label de l'input
   * @param {string} options.type - Type d'input (text, number, email, etc.)
   * @param {string} options.placeholder - Placeholder
   * @param {string} options.value - Valeur initiale
   * @param {Function} options.onChange - Callback au changement
   * @param {Function} options.validator - Fonction de validation
   * @param {string} options.errorMessage - Message d'erreur
   * @returns {HTMLDivElement}
   */
  static create(options = {}) {
    const {
      label = '',
      type = 'text',
      placeholder = '',
      value = '',
      onChange = null,
      validator = null,
      errorMessage = 'Valeur invalide',
      required = false,
      className = ''
    } = options;

    const container = document.createElement('div');
    container.className = `input-group ${className}`.trim();

    // Label
    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'input-label';
      labelEl.textContent = label + (required ? ' *' : '');
      container.appendChild(labelEl);
    }

    // Input
    const input = document.createElement('input');
    input.type = type;
    input.className = 'input-field';
    input.placeholder = placeholder;
    input.value = value;
    if (required) input.required = true;

    // Message d'erreur
    const errorEl = document.createElement('div');
    errorEl.className = 'input-error';
    errorEl.style.display = 'none';

    // Validation
    const validate = () => {
      if (validator && !validator(input.value)) {
        input.classList.add('input-invalid');
        errorEl.textContent = errorMessage;
        errorEl.style.display = 'block';
        return false;
      } else {
        input.classList.remove('input-invalid');
        errorEl.style.display = 'none';
        return true;
      }
    };

    // Events
    input.addEventListener('input', (e) => {
      if (onChange) onChange(e.target.value);
    });

    input.addEventListener('blur', validate);

    container.appendChild(input);
    container.appendChild(errorEl);

    // Méthode pour obtenir la valeur
    container.getValue = () => input.value;
    container.setValue = (val) => { input.value = val; };
    container.validate = validate;

    return container;
  }

  /**
   * Input texte simple
   */
  static text(label, placeholder = '', onChange = null) {
    return this.create({ label, type: 'text', placeholder, onChange });
  }

  /**
   * Input nombre
   */
  static number(label, placeholder = '', onChange = null) {
    return this.create({
      label,
      type: 'number',
      placeholder,
      onChange,
      validator: (val) => !isNaN(val) && val !== ''
    });
  }

  /**
   * Input email
   */
  static email(label, placeholder = '', onChange = null) {
    return this.create({
      label,
      type: 'email',
      placeholder,
      onChange,
      validator: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      errorMessage: 'Email invalide'
    });
  }
}

// Styles CSS à ajouter
export const inputStyles = `
.input-group {
  margin-bottom: var(--spacing-lg);
}

.input-label {
  display: block;
  margin-bottom: var(--spacing-sm);
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.9rem;
}

.input-field {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-primary);
  transition: all 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: var(--nasa-blue);
  box-shadow: 0 0 0 3px rgba(11, 61, 145, 0.1);
}

.input-field::placeholder {
  color: var(--text-light);
}

.input-field.input-invalid {
  border-color: var(--error-color);
}

.input-field.input-invalid:focus {
  box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
}

.input-error {
  margin-top: var(--spacing-xs);
  color: var(--error-color);
  font-size: 0.875rem;
}
`;
