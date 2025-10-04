/**
 * Export de tous les composants UI
 */

export { Button, buttonStyles } from './Button.js';
export { Card, cardStyles } from './Card.js';
export { Modal, modalStyles } from './Modal.js';
export { Input, inputStyles } from './Input.js';
export { Badge, badgeStyles } from './Badge.js';
export { ProgressBar, progressBarStyles } from './ProgressBar.js';

/**
 * Fonction pour injecter tous les styles des composants
 */
export function injectComponentStyles() {
  const styles = `
    ${buttonStyles}
    ${cardStyles}
    ${modalStyles}
    ${inputStyles}
    ${badgeStyles}
    ${progressBarStyles}
  `;

  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
