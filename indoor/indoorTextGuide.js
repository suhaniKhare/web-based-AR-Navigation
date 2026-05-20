/**
 * indoorTextGuide.js
 * Controls the HUD UI displaying textual instructions and speaking steps out loud.
 */

class IndoorTextGuideManager {
    constructor() {
        this.container = null;
        this.routeSteps = [];
        this.currentStepIndex = 0;
        
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('indoor-guide-styles')) return;
        const style = document.createElement('style');
        style.id = 'indoor-guide-styles';
        style.textContent = `
            .indoor-guide-hud {
                position: fixed; bottom: 25px; left: 50%; transform: translateX(-50%);
                width: 90%; max-width: 400px; background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 20px;
                padding: 20px; box-sizing: border-box; z-index: 998;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                font-family: 'Outfit', sans-serif;
                animation: guide-slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
            }
            @keyframes guide-slide-in {
                from { transform: translate(-50%, 50px); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
            }
            .guide-header {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 12px;
            }
            .guide-step-indicator {
                font-size: 12px; font-weight: 700; color: #10b981;
                background: rgba(16, 185, 129, 0.15); padding: 4px 10px;
                border-radius: 6px; letter-spacing: 0.5px;
            }
            .guide-instruction-text {
                font-size: 16px; font-weight: 600; color: #ffffff;
                line-height: 1.5; text-align: left; min-height: 50px;
                margin-bottom: 15px;
            }
            .guide-progress-bar-bg {
                width: 100%; height: 4px; background: rgba(255, 255, 255, 0.1);
                border-radius: 99px; margin-bottom: 20px; overflow: hidden;
            }
            .guide-progress-bar-fill {
                height: 100%; background: #10b981; width: 0%;
                transition: width 0.3s ease;
            }
            .guide-footer-controls {
                display: flex; gap: 10px;
            }
            .guide-nav-btn {
                flex: 1; padding: 10px; border-radius: 10px; border: none;
                font-size: 14px; font-weight: 700; cursor: pointer;
                transition: background 0.2s;
            }
            .guide-nav-btn-back {
                background: rgba(255, 255, 255, 0.08); color: white;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .guide-nav-btn-next {
                background: #10b981; color: white;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Starts rendering steps on the interface.
     * @param {Array} steps The step list array.
     */
    start(steps) {
        this.routeSteps = steps;
        this.currentStepIndex = 0;

        if (this.container) {
            this.stop();
        }

        this.container = document.createElement('div');
        this.container.className = 'indoor-guide-hud';
        document.body.appendChild(this.container);

        this.renderStep();
    }

    renderStep() {
        if (!this.container || this.routeSteps.length === 0) return;

        const currentStep = this.routeSteps[this.currentStepIndex];
        const stepNum = this.currentStepIndex + 1;
        const totalSteps = this.routeSteps.length;
        const percent = (stepNum / totalSteps) * 100;

        // Render HTML structure
        this.container.innerHTML = `
            <div class="guide-header">
                <span class="guide-step-indicator">STEP ${stepNum} OF ${totalSteps}</span>
                <span id="guide-exit-btn" style="font-size: 12px; color: #f87171; cursor: pointer; font-weight: 600;">Exit</span>
            </div>
            <div class="guide-instruction-text">${currentStep.instruction}</div>
            <div class="guide-progress-bar-bg">
                <div class="guide-progress-bar-fill" style="width: ${percent}%;"></div>
            </div>
            <div class="guide-footer-controls">
                <button id="guide-prev-btn" class="guide-nav-btn guide-nav-btn-back" ${this.currentStepIndex === 0 ? 'disabled style="opacity: 0.3; cursor: default;"' : ''}>Previous</button>
                <button id="guide-next-btn" class="guide-nav-btn guide-nav-btn-next">${this.currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next Step'}</button>
            </div>
        `;

        // Announce route instructions using Web Speech Synthesizer wrapper
        if (window.speechManager) {
            window.speechManager.speak(currentStep.instruction);
        }

        // Attach action listeners
        this.container.querySelector('#guide-exit-btn').addEventListener('click', () => {
            this.stop();
            window.indoorNavigator.exitNavigation();
        });

        this.container.querySelector('#guide-prev-btn').addEventListener('click', () => {
            if (this.currentStepIndex > 0) {
                this.currentStepIndex--;
                this.renderStep();
            }
        });

        this.container.querySelector('#guide-next-btn').addEventListener('click', () => {
            if (this.currentStepIndex < this.routeSteps.length - 1) {
                this.currentStepIndex++;
                this.renderStep();
            } else {
                // Completed all steps
                this.stop();
                alert("You have reached your destination room!");
                window.indoorNavigator.exitNavigation();
            }
        });
    }

    stop() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
            this.container = null;
        }
    }
}

// Export global instance
window.indoorTextGuide = new IndoorTextGuideManager();
