export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export class RealTimeSpeechRecognition {
  private recognition: any;
  private isListening: boolean = false;
  private onResultCallback: ((result: SpeechRecognitionResult) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (this.onResultCallback) {
        if (finalTranscript) {
          this.onResultCallback({
            transcript: finalTranscript.trim(),
            isFinal: true,
            confidence: event.results[event.results.length - 1][0].confidence || 0.9
          });
        } else if (interimTranscript) {
          this.onResultCallback({
            transcript: interimTranscript,
            isFinal: false,
            confidence: 0.5
          });
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        console.log('No speech detected, continuing...');
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart if it stops unexpectedly
        this.recognition.start();
      } else if (this.onEndCallback) {
        this.onEndCallback();
      }
    };
  }

  start(onResult: (result: SpeechRecognitionResult) => void, onEnd?: () => void) {
    if (!this.recognition) {
      console.error('Speech Recognition not initialized');
      return false;
    }

    this.onResultCallback = onResult;
    this.onEndCallback = onEnd || null;
    this.isListening = true;

    try {
      this.recognition.start();
      console.log('🎤 Speech recognition started');
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      console.log('🎤 Speech recognition stopped');
    }
  }

  isSupported(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }
}
