/**
 * TutorialSystem.js
 * Gestionnaire du tutoriel interactif pour IleRise
 * Affiche les étapes du tutoriel avec pointeurs et animations
 */

export class TutorialSystem {
    constructor() {
        this.steps = [];
        this.currentStepIndex = 0;
        this.isActive = false;
        this.hasCompletedTutorial = this.loadProgress();
        this.overlay = null;
        this.stepContainer = null;
    }

    /**
     * Initialise le système de tutoriel
     */
    async init() {
        try {
            // Charger les étapes du tutoriel
            const response = await fetch('/src/tutorial/tutorialSteps.json');
            this.steps = await response.json();

            // Créer l'interface du tutoriel
            this.createTutorialUI();

            console.log('✅ TutorialSystem initialized with', this.steps.length, 'steps');
        } catch (error) {
            console.error('❌ Failed to load tutorial:', error);
        }
    }

    /**
     * Crée l'interface UI du tutoriel
     */
    createTutorialUI() {
        // Overlay semi-transparent
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.className = 'tutorial-overlay hidden';

        // Conteneur de l'étape
        this.stepContainer = document.createElement('div');
        this.stepContainer.className = 'tutorial-step-container';

        this.stepContainer.innerHTML = `
            <div class="tutorial-header">
                <h3 id="tutorial-title"></h3>
                <button id="tutorial-skip" class="tutorial-skip-btn">✕ Passer</button>
            </div>

            <div class="tutorial-content">
                <div id="tutorial-icon" class="tutorial-icon"></div>
                <div id="tutorial-text" class="tutorial-text"></div>
            </div>

            <div class="tutorial-progress">
                <div id="tutorial-progress-bar" class="tutorial-progress-bar">
                    <div id="tutorial-progress-fill" class="tutorial-progress-fill"></div>
                </div>
                <p class="tutorial-step-counter">
                    Étape <span id="tutorial-current-step">1</span> / <span id="tutorial-total-steps">8</span>
                </p>
            </div>

            <div class="tutorial-actions">
                <button id="tutorial-prev" class="tutorial-btn tutorial-btn-secondary">← Précédent</button>
                <button id="tutorial-next" class="tutorial-btn tutorial-btn-primary">Suivant →</button>
            </div>
        `;

        // Flèche pointant vers les éléments
        this.pointer = document.createElement('div');
        this.pointer.className = 'tutorial-pointer hidden';
        this.pointer.innerHTML = `
            <div class="pointer-arrow"></div>
            <div class="pointer-pulse"></div>
        `;

        this.overlay.appendChild(this.stepContainer);
        this.overlay.appendChild(this.pointer);
        document.body.appendChild(this.overlay);

        // Event listeners
        this.attachEventListeners();
    }

    /**
     * Attache les event listeners
     */
    attachEventListeners() {
        const nextBtn = this.stepContainer.querySelector('#tutorial-next');
        const prevBtn = this.stepContainer.querySelector('#tutorial-prev');
        const skipBtn = this.stepContainer.querySelector('#tutorial-skip');

        console.log('📚 Tutorial buttons found:', { nextBtn: !!nextBtn, prevBtn: !!prevBtn, skipBtn: !!skipBtn });

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                console.log('➡️ Next button clicked');
                this.nextStep();
            });
        }
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                console.log('⬅️ Prev button clicked');
                this.prevStep();
            });
        }
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                console.log('✕ Skip button clicked');
                this.skip();
            });
        }

        // Navigation clavier
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;

            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                this.nextStep();
            } else if (e.key === 'ArrowLeft') {
                this.prevStep();
            } else if (e.key === 'Escape') {
                this.skip();
            }
        });
    }

    /**
     * Démarre le tutoriel
     */
    start() {
        if (this.hasCompletedTutorial) {
            // Demander si l'utilisateur veut refaire le tutoriel via le modal de l'app
            if (window.app) {
                window.app.showConfirm(
                    'Tutoriel déjà terminé',
                    'Vous avez déjà terminé le tutoriel. Voulez-vous le refaire ?',
                    (confirmed) => {
                        if (confirmed) {
                            this.continueStart();
                        }
                    }
                );
                return;
            }
        }
        this.continueStart();
    }

    continueStart() {
        this.isActive = true;
        this.currentStepIndex = 0;
        this.overlay.classList.remove('hidden');
        this.showStep(0);

        console.log('🎓 Tutorial started');
    }

    /**
     * Affiche une étape spécifique
     */
    showStep(index) {
        if (index < 0 || index >= this.steps.length) return;

        const step = this.steps[index];
        this.currentStepIndex = index;

        // Mettre à jour le contenu
        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-icon').textContent = step.icon;
        document.getElementById('tutorial-text').innerHTML = step.content;

        // Mettre à jour la progression
        document.getElementById('tutorial-current-step').textContent = index + 1;
        document.getElementById('tutorial-total-steps').textContent = this.steps.length;

        const progress = ((index + 1) / this.steps.length) * 100;
        document.getElementById('tutorial-progress-fill').style.width = `${progress}%`;

        // Gérer les boutons
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');

        prevBtn.disabled = index === 0;
        prevBtn.style.opacity = index === 0 ? '0.5' : '1';

        if (index === this.steps.length - 1) {
            nextBtn.textContent = 'Terminer ✓';
        } else {
            nextBtn.textContent = 'Suivant →';
        }

        // Pointeur vers l'élément cible
        if (step.target) {
            this.showPointer(step.target, step.pointerPosition);
            this.highlightElement(step.target);
        } else {
            this.hidePointer();
            this.clearHighlights();
        }

        // Animation d'entrée
        this.stepContainer.classList.remove('tutorial-fade-in');
        setTimeout(() => {
            this.stepContainer.classList.add('tutorial-fade-in');
        }, 10);
    }

    /**
     * Affiche le pointeur vers un élément
     */
    showPointer(targetSelector, position = 'bottom') {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) {
            this.hidePointer();
            return;
        }

        const rect = targetElement.getBoundingClientRect();
        this.pointer.classList.remove('hidden');

        // Position du pointeur selon la configuration
        let left, top;

        switch (position) {
            case 'top':
                left = rect.left + rect.width / 2;
                top = rect.top - 60;
                this.pointer.style.transform = 'rotate(180deg)';
                break;
            case 'bottom':
                left = rect.left + rect.width / 2;
                top = rect.bottom + 20;
                this.pointer.style.transform = 'rotate(0deg)';
                break;
            case 'left':
                left = rect.left - 60;
                top = rect.top + rect.height / 2;
                this.pointer.style.transform = 'rotate(90deg)';
                break;
            case 'right':
                left = rect.right + 20;
                top = rect.top + rect.height / 2;
                this.pointer.style.transform = 'rotate(-90deg)';
                break;
        }

        this.pointer.style.left = `${left}px`;
        this.pointer.style.top = `${top}px`;
    }

    /**
     * Cache le pointeur
     */
    hidePointer() {
        this.pointer.classList.add('hidden');
    }

    /**
     * Met en surbrillance un élément
     */
    highlightElement(selector) {
        this.clearHighlights();

        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('tutorial-highlight');

            // Scroll vers l'élément si nécessaire
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Retire toutes les surbrillances
     */
    clearHighlights() {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    }

    /**
     * Passe à l'étape suivante
     */
    nextStep() {
        if (this.currentStepIndex < this.steps.length - 1) {
            this.showStep(this.currentStepIndex + 1);
        } else {
            this.complete();
        }
    }

    /**
     * Retourne à l'étape précédente
     */
    prevStep() {
        if (this.currentStepIndex > 0) {
            this.showStep(this.currentStepIndex - 1);
        }
    }

    /**
     * Passe le tutoriel
     */
    skip() {
        if (window.app) {
            window.app.showConfirm(
                'Passer le tutoriel',
                'Êtes-vous sûr de vouloir passer le tutoriel ?',
                (confirmed) => {
                    if (confirmed) {
                        this.close();
                    }
                }
            );
        } else {
            this.close();
        }
    }

    /**
     * Termine le tutoriel
     */
    complete() {
        this.hasCompletedTutorial = true;
        this.saveProgress();

        // Message de félicitations via le modal de l'app
        if (window.app) {
            window.app.showMessage(
                '🎉 Félicitations !',
                'Vous avez terminé le tutoriel.\n\nVous êtes maintenant prêt à sauver AgriVerse avec les données NASA !',
                'success'
            );
        }

        this.close();

        console.log('✅ Tutorial completed');
    }

    /**
     * Ferme le tutoriel
     */
    close() {
        this.isActive = false;
        this.overlay.classList.add('hidden');
        this.clearHighlights();
        this.hidePointer();
    }

    /**
     * Sauvegarde la progression
     */
    saveProgress() {
        localStorage.setItem('ilerise_tutorial_completed', 'true');
    }

    /**
     * Charge la progression
     */
    loadProgress() {
        return localStorage.getItem('ilerise_tutorial_completed') === 'true';
    }

    /**
     * Réinitialise le tutoriel
     */
    reset() {
        localStorage.removeItem('ilerise_tutorial_completed');
        this.hasCompletedTutorial = false;
        console.log('🔄 Tutorial reset');
    }

    /**
     * Vérifie si le tutoriel a été complété
     */
    isCompleted() {
        return this.hasCompletedTutorial;
    }
}
