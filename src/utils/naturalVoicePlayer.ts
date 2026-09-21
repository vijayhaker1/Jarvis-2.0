/**
 * Single-Model Natural Voice Player for J.A.R.V.I.S.
 * Dedicated strictly to ONE single specific voice: Iron Man Movie J.A.R.V.I.S. (Articulate British Butler)
 * 
 * - Primary Engine: Fenrir Neural Voice (Gemini TTS) mastered with studio acoustics (warmth, presence, compression)
 * - Calibrated Fallback Engine: Strictly Male British Butler Voice (never female, never random old voices)
 * - Circuit Breaker: Automatically prevents quota depletion without console error spam
 */

export interface VoicePlayerOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class NaturalVoicePlayer {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isMuted: boolean = false;
  private isSpeaking: boolean = false;
  private audioCache: Map<string, AudioBuffer> = new Map();
  private abortController: AbortController | null = null;
  private ttsCooldownUntil: number = 0;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      // Warm up AudioContext on initial user gesture
      const unlockAudio = () => {
        this.getAudioContext();
        this.loadVoices();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
      window.addEventListener('touchstart', unlockAudio, { once: true });

      // Cache speech synthesis voices as soon as they become available
      if ('speechSynthesis' in window) {
        this.loadVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      this.cachedVoices = voices;
    }
  }

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeech();
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public stopSpeech() {
    this.isSpeaking = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {}
      this.currentSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }

  /**
   * Converts 16-bit linear PCM little-endian base64 string (24kHz) to AudioBuffer
   */
  private decodePcmToBuffer(base64Data: string, sampleRate = 24000): AudioBuffer | undefined {
    const ctx = this.getAudioContext();
    if (!ctx) return undefined;

    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const audioBuffer = ctx.createBuffer(1, int16Array.length, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }

      return audioBuffer;
    } catch {
      return undefined;
    }
  }

  /**
   * Natural Iron Man Movie J.A.R.V.I.S. Audio Mastering Chain
   * Shapes vocal presence, warmth, and studio dynamic range.
   */
  private createMasteringChain(ctx: AudioContext): {
    input: AudioNode;
    output: AudioNode;
    analyser: AnalyserNode;
  } {
    // 1. Studio Presence Filter (3.8 kHz high shelf for British crispness)
    const presenceFilter = ctx.createBiquadFilter();
    presenceFilter.type = 'highshelf';
    presenceFilter.frequency.setValueAtTime(3800, ctx.currentTime);
    presenceFilter.gain.setValueAtTime(1.8, ctx.currentTime);

    // 2. Chest Warmth Filter (220 Hz peaking for resonant masculine depth)
    const warmthFilter = ctx.createBiquadFilter();
    warmthFilter.type = 'peaking';
    warmthFilter.frequency.setValueAtTime(220, ctx.currentTime);
    warmthFilter.Q.setValueAtTime(1.2, ctx.currentTime);
    warmthFilter.gain.setValueAtTime(1.4, ctx.currentTime);

    // 3. Studio Broadcast Compressor (smooth, cinematic mastering)
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, ctx.currentTime);
    compressor.knee.setValueAtTime(18, ctx.currentTime);
    compressor.ratio.setValueAtTime(3.5, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.2, ctx.currentTime);

    // 4. Analyser node for live reactive Arc Reactor waveforms
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;
    this.analyser = analyser;

    // 5. Output Gain
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(1.0, ctx.currentTime);

    // Connect node chain: presence -> warmth -> compressor -> analyser -> gain -> destination
    presenceFilter.connect(warmthFilter);
    warmthFilter.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(ctx.destination);

    return {
      input: presenceFilter,
      output: gainNode,
      analyser
    };
  }

  /**
   * Resolves the highest quality British Male Butler voice available on the device.
   * STRICTLY rejects female voices and unnatural robotic/toy voices.
   */
  private getBestBritishMaleVoice(): SpeechSynthesisVoice | undefined {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
    const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return undefined;

    const femaleOrGimmickRegex = /(female|woman|girl|zira|hazel|samantha|victoria|serena|karen|catherine|susan|fiona|moira|tessa|veena|eva|allison|kendra|ava|stephanie|zaria|helena|alice|jenny|aria|sonia|natasha|lucy|amy|emma|olivia|clara|sarah|mary|lisa|anna|kate|beth|cathy|vicki|princess|whisper|organ|deranged|cellos|bells|boing|bubbles|junior|ralph|albert|fred|jester)/i;

    const validMaleVoices = voices.filter(v => !femaleOrGimmickRegex.test(v.name));

    // Priority 1: Named British Male Voices
    const britishMale = validMaleVoices.find(v => {
      const n = v.name.toLowerCase();
      const isGB = v.lang.startsWith('en-GB') || v.lang.startsWith('en_GB') || n.includes('uk') || n.includes('british') || n.includes('united kingdom');
      return isGB && (n.includes('daniel') || n.includes('george') || n.includes('oliver') || n.includes('arthur') || n.includes('male') || n.includes('brian'));
    });
    if (britishMale) return britishMale;

    // Priority 2: Any English voice with Daniel or George or Oliver
    const namedEnglishMale = validMaleVoices.find(v => {
      const n = v.name.toLowerCase();
      return n.includes('daniel') || n.includes('george') || n.includes('oliver') || n.includes('guy') || n.includes('arthur');
    });
    if (namedEnglishMale) return namedEnglishMale;

    // Priority 3: Any en-GB male voice
    const anyGb = validMaleVoices.find(v => v.lang.startsWith('en-GB') || v.lang.startsWith('en_GB'));
    if (anyGb) return anyGb;

    // Priority 4: Standard articulate English male voice
    const articulateMale = validMaleVoices.find(v => {
      const n = v.name.toLowerCase();
      return (n.includes('male') || n.includes('david') || n.includes('mark') || n.includes('ryan') || n.includes('alex')) && v.lang.startsWith('en');
    });
    if (articulateMale) return articulateMale;

    // Priority 5: Any valid non-female English voice
    const anyEnglishMale = validMaleVoices.find(v => v.lang.startsWith('en'));
    return anyEnglishMale || validMaleVoices[0];
  }

  /**
   * High-Precision Calibrated Speech Synthesis Fallback.
   * Strictly British masculine vocal configuration with baritone tuning.
   */
  private speakWithBrowser(text: string, onStart?: () => void, onEnd?: () => void) {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const targetVoice = this.getBestBritishMaleVoice();
      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      // British accent formatting & masculine baritone gravitas
      utterance.lang = 'en-GB';
      utterance.pitch = 0.86; // Deep masculine poise (never high or female)
      utterance.rate = 1.0;   // Deliberate butler pacing

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (onStart) onStart();
      };

      const finish = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      window.speechSynthesis.speak(utterance);
    } catch {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }

  /**
   * Speaks using ONE unified J.A.R.V.I.S. voice persona.
   * Prioritizes studio-mastered neural audio with instant zero-lag fallback to calibrated British male speech.
   */
  public async speakText(text: string, options?: VoicePlayerOptions): Promise<void> {
    if (this.isMuted) {
      if (options?.onEnd) options.onEnd();
      return;
    }

    this.stopSpeech();

    const cleanText = text
      .replace(/[*_~`#]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      if (options?.onEnd) options.onEnd();
      return;
    }

    // If cooldown is active due to quota limit, speak with calibrated British male speech immediately
    if (Date.now() < this.ttsCooldownUntil) {
      this.speakWithBrowser(cleanText, options?.onStart, options?.onEnd);
      return;
    }

    const ctx = this.getAudioContext();
    if (!ctx) {
      this.speakWithBrowser(cleanText, options?.onStart, options?.onEnd);
      return;
    }

    let audioBuffer = this.audioCache.get(cleanText);

    if (!audioBuffer) {
      try {
        this.abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          if (this.abortController) this.abortController.abort();
        }, 5000);

        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText }),
          signal: this.abortController.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('TTS response not ok');
        }

        const data = await response.json();

        if (data.fallback || !data.audioData) {
          // If server reported quota limit or fallback, activate 5-min client cooldown
          this.ttsCooldownUntil = Date.now() + 5 * 60 * 1000;
          this.speakWithBrowser(cleanText, options?.onStart, options?.onEnd);
          return;
        }

        audioBuffer = this.decodePcmToBuffer(data.audioData, data.sampleRate || 24000);
        if (audioBuffer && this.audioCache.size < 60) {
          this.audioCache.set(cleanText, audioBuffer);
        }
      } catch {
        // Instant seamless fallback without console errors
        this.speakWithBrowser(cleanText, options?.onStart, options?.onEnd);
        return;
      }
    }

    if (!audioBuffer) {
      this.speakWithBrowser(cleanText, options?.onStart, options?.onEnd);
      return;
    }

    try {
      // Play through J.A.R.V.I.S. mastering chain
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      const chain = this.createMasteringChain(ctx);
      source.connect(chain.input);

      this.currentSource = source;
      this.isSpeaking = true;

      source.onended = () => {
        this.isSpeaking = false;
        this.currentSource = null;
        if (options?.onEnd) options.onEnd();
      };

      if (options?.onStart) options.onStart();
      source.start(0);
    } catch {
      this.speakWithBrowser(cleanText, options?.onStart, options?.onEnd);
    }
  }

  /**
   * Returns current voice frequency spectrum for holographic visualizers (0 to 255)
   */
  public getVisualizerData(): Uint8Array | null {
    if (!this.analyser || !this.isSpeaking) return null;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

export const jarvisVoicePlayer = new NaturalVoicePlayer();
