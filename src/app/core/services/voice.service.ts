import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private recognition: any;
  
  // Signals for UI reactivity
  isListening = signal<boolean>(false);
  transcript = signal<string>('');
  error = signal<string | null>(null);

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      this.error.set("Web Speech API n'est pas supportée dans ce navigateur.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'fr-FR'; // French support as requested in context
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onstart = () => {
      this.isListening.set(true);
      this.error.set(null);
    };

    this.recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      this.transcript.set(result);
    };

    this.recognition.onerror = (event: any) => {
      this.error.set(`Erreur vocale: ${event.error}`);
      this.isListening.set(false);
    };

    this.recognition.onend = () => {
      this.isListening.set(false);
    };
  }

  startListening() {
    if (this.recognition && !this.isListening()) {
      this.transcript.set('');
      try {
        this.recognition.start();
      } catch (err) {
        console.error('Erreur démarrage reco:', err);
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening()) {
      this.recognition.stop();
    }
  }
}
