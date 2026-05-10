let audioCtx: AudioContext | null = null;

export function playTasbihSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    // Create a new context if we don't have one, or if it got closed
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    
    const time = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'sine';
    
    // Quick pop sound
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.linearRampToValueAtTime(100, time + 0.05);
    
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.5, time + 0.005);
    gainNode.gain.linearRampToValueAtTime(0, time + 0.05);
    
    osc.start(time);
    osc.stop(time + 0.05);
    
  } catch (err) {
    console.warn("Audio error", err);
  }
}
