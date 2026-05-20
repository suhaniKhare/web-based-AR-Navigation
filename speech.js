/**
 * speech.js
 * Manages Text-To-Speech (TTS) audio prompts using the Web Speech Synthesis API.
 */

class WebSpeechManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voice = null;
        this.initVoice();

        // Listen for voice updates (often loaded asynchronously by browsers)
        if (this.synth && typeof this.synth.addEventListener === 'function') {
            this.synth.addEventListener('voiceschanged', () => this.initVoice());
        }
    }

    initVoice() {
        if (!this.synth) return;
        const voices = this.synth.getVoices();
        // Prefer an English voice, ideally local/native for low latency
        this.voice = voices.find(v => v.lang.startsWith('en') && v.localService) ||
                     voices.find(v => v.lang.startsWith('en')) ||
                     voices[0];
    }

    /**
     * Announces a string immediately, canceling any currently speaking prompts.
     * @param {string} text The navigation guidance text to speak.
     */
    speak(text) {
        if (!this.synth) {
            console.warn("Speech synthesis is not supported on this browser.");
            return;
        }

        // Cancel current speech to ensure immediate turn cues are not delayed
        this.synth.cancel();

        if (!text || text.trim() === "") return;

        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) {
            utterance.voice = this.voice;
        }
        utterance.rate = 1.0; // Normal speaking pace
        utterance.pitch = 1.0;

        utterance.onerror = (e) => {
            console.error("Speech Synthesis Error: ", e);
        };

        this.synth.speak(utterance);
    }

    shutdown() {
        if (this.synth) {
            this.synth.cancel();
        }
    }
}

// Export global speech manager
window.speechManager = new WebSpeechManager();
