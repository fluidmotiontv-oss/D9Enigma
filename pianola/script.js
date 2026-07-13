// --- SYNESTHETIC PIANOLA SYNTH ENGINE & VISUALIZER ---

// MIDI to Frequency conversion
function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

// 25 notes from C3 (MIDI 48) to C5 (MIDI 72)
const pianoNotes = [
    { midi: 48, name: "C3", isBlack: false, whiteIndex: 0, char: "A", code: "KeyA" },
    { midi: 49, name: "C#3", isBlack: true, whiteIndex: 0.5, char: "W", code: "KeyW" },
    { midi: 50, name: "D3", isBlack: false, whiteIndex: 1, char: "S", code: "KeyS" },
    { midi: 51, name: "D#3", isBlack: true, whiteIndex: 1.5, char: "E", code: "KeyE" },
    { midi: 52, name: "E3", isBlack: false, whiteIndex: 2, char: "D", code: "KeyD" },
    { midi: 53, name: "F3", isBlack: false, whiteIndex: 3, char: "F", code: "KeyF" },
    { midi: 54, name: "F#3", isBlack: true, whiteIndex: 3.5, char: "T", code: "KeyT" },
    { midi: 55, name: "G3", isBlack: false, whiteIndex: 4, char: "G", code: "KeyG" },
    { midi: 56, name: "G#3", isBlack: true, whiteIndex: 4.5, char: "Y", code: "KeyY" },
    { midi: 57, name: "A3", isBlack: false, whiteIndex: 5, char: "H", code: "KeyH" },
    { midi: 58, name: "A#3", isBlack: true, whiteIndex: 5.5, char: "U", code: "KeyU" },
    { midi: 59, name: "B3", isBlack: false, whiteIndex: 6, char: "J", code: "KeyJ" },
    { midi: 60, name: "C4", isBlack: false, whiteIndex: 7, char: "K", code: "KeyK" },
    { midi: 61, name: "C#4", isBlack: true, whiteIndex: 7.5, char: "O", code: "KeyO" },
    { midi: 62, name: "D4", isBlack: false, whiteIndex: 8, char: "L", code: "KeyL" },
    { midi: 63, name: "D#4", isBlack: true, whiteIndex: 8.5, char: "P", code: "KeyP" },
    { midi: 64, name: "E4", isBlack: false, whiteIndex: 9, char: ";", code: "Semicolon" },
    { midi: 65, name: "F4", isBlack: false, whiteIndex: 10, char: "'", code: "Quote" },
    { midi: 66, name: "F#4", isBlack: true, whiteIndex: 10.5, char: "]", code: "BracketRight" },
    { midi: 67, name: "G4", isBlack: false, whiteIndex: 11, char: "Z", code: "KeyZ" },
    { midi: 68, name: "G#4", isBlack: true, whiteIndex: 11.5, char: "X", code: "KeyX" },
    { midi: 69, name: "A4", isBlack: false, whiteIndex: 12, char: "C", code: "KeyC" },
    { midi: 70, name: "A#4", isBlack: true, whiteIndex: 12.5, char: "V", code: "KeyV" },
    { midi: 71, name: "B4", isBlack: false, whiteIndex: 13, char: "B", code: "KeyB" },
    { midi: 72, name: "C5", isBlack: false, whiteIndex: 14, char: "N", code: "KeyN" }
];

// Web Audio API State
let audioCtx = null;
let masterGain = null;
let delayNode = null;
let delayFeedback = null;
let delayWetGain = null;
let filterNode = null;

const activeVoices = new Map(); // midiNumber -> SynthVoice

// ADSR & FX configuration selectors
const config = {
    waveform: 'sine',
    envelope: { attack: 0.05, decay: 0.15, sustain: 0.7, release: 0.5 },
    filter: { cutoff: 2000, Q: 1.0 },
    delay: { time: 0.3, feedback: 0.3, wet: 0.2 }
};

// Initialize Web Audio Graph
function initAudio() {
    if (audioCtx) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    // Nodes creation
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.8; // Avoid clipping

    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = config.filter.cutoff;
    filterNode.Q.value = config.filter.Q;

    // Delay FX Graph: Filter -> Delay -> Feedback -> Delay -> WetGain -> Master
    delayNode = audioCtx.createDelay(2.0);
    delayNode.delayTime.value = config.delay.time;
    
    delayFeedback = audioCtx.createGain();
    delayFeedback.gain.value = config.delay.feedback;
    
    delayWetGain = audioCtx.createGain();
    delayWetGain.gain.value = config.delay.wet;

    // Delay Feedback Loop
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);

    // Connections
    filterNode.connect(masterGain); // Dry path
    filterNode.connect(delayNode);  // Send to delay
    delayWetGain.connect(masterGain);
    delayNode.connect(delayWetGain);

    masterGain.connect(audioCtx.destination);
}

// Synth Voice Blueprint
class SynthVoice {
    constructor(midi) {
        initAudio();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        this.midi = midi;
        this.freq = midiToFreq(midi);
        
        this.osc = audioCtx.createOscillator();
        this.gainNode = audioCtx.createGain();
        
        this.osc.type = config.waveform;
        this.osc.frequency.setValueAtTime(this.freq, audioCtx.currentTime);
        
        this.osc.connect(this.gainNode);
        this.gainNode.connect(filterNode);
        
        const now = audioCtx.currentTime;
        this.gainNode.gain.setValueAtTime(0, now);
        this.gainNode.gain.linearRampToValueAtTime(0.6, now + config.envelope.attack);
        this.gainNode.gain.setValueAtTime(0.6, now + config.envelope.attack);
        this.gainNode.gain.exponentialRampToValueAtTime(0.6 * config.envelope.sustain + 0.0001, now + config.envelope.attack + config.envelope.decay);
        
        this.osc.start(now);
        this.released = false;
    }

    release() {
        if (this.released) return;
        this.released = true;
        
        const now = audioCtx.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + config.envelope.release);
        this.osc.stop(now + config.envelope.release);
    }
}

// --- DOM Rendering & Event Listeners ---
const keybed = document.getElementById('keyboard');

// Generate Keyboard Keys
function generateKeyboard() {
    keybed.innerHTML = '';
    
    // Sort white keys first, black keys absolute positioned relative to white keys index
    const whiteNotes = pianoNotes.filter(n => !n.isBlack);
    const blackNotes = pianoNotes.filter(n => n.isBlack);

    whiteNotes.forEach(note => {
        const key = document.createElement('div');
        key.className = `key white`;
        key.dataset.midi = note.midi;
        key.innerHTML = `
            <span class="key-note">${note.name}</span>
            <span class="key-label">${note.char}</span>
        `;
        keybed.appendChild(key);
    });

    blackNotes.forEach(note => {
        const key = document.createElement('div');
        key.className = `key black`;
        key.dataset.midi = note.midi;
        key.innerHTML = `
            <span class="key-note">${note.name}</span>
            <span class="key-label">${note.char}</span>
        `;
        
        // Find placement offset based on whiteIndex
        // For whiteIndex 0.5, we position it relative to the white keys grid
        const whiteKeysCount = 15;
        const leftPercent = (note.whiteIndex / whiteKeysCount) * 100;
        key.style.position = 'absolute';
        key.style.left = `calc(${leftPercent}% + 10px)`; // Account for padding
        
        keybed.appendChild(key);
    });

    // Attach Mouse/Touch events
    document.querySelectorAll('.key').forEach(key => {
        const midi = parseInt(key.dataset.midi);
        key.addEventListener('mousedown', (e) => {
            e.preventDefault();
            triggerNoteOn(midi);
        });
        key.addEventListener('mouseup', () => triggerNoteOff(midi));
        key.addEventListener('mouseleave', () => triggerNoteOff(midi));
        
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            triggerNoteOn(midi);
        }, {passive: false});
        key.addEventListener('touchend', () => triggerNoteOff(midi));
    });
}

// --- Note Trigger Controller ---
function triggerNoteOn(midi) {
    if (activeVoices.has(midi)) return; // Already playing
    
    const voice = new SynthVoice(midi);
    activeVoices.set(midi, voice);
    
    // Visual Updates
    const key = document.querySelector(`.key[data-midi="${midi}"]`);
    if (key) key.classList.add('active');
    
    // Spawn waterfall note
    spawnWaterfallNote(midi);
    
    updateHUD();
}

function triggerNoteOff(midi) {
    const voice = activeVoices.get(midi);
    if (!voice) return;
    
    voice.release();
    activeVoices.delete(midi);
    
    // Visual Updates
    const key = document.querySelector(`.key[data-midi="${midi}"]`);
    if (key) key.classList.remove('active');
    
    // End waterfall note growth
    releaseWaterfallNote(midi);
    
    updateHUD();
}

function updateHUD() {
    const label = document.getElementById('activeNotesLabel');
    if (label) label.textContent = `ACTIVE VOICES: ${activeVoices.size}`;
}

// --- QWERTY Keyboard Listeners ---
const keyMap = new Map();
pianoNotes.forEach(n => {
    keyMap.set(n.code, n.midi);
});

window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const midi = keyMap.get(e.code);
    if (midi) {
        triggerNoteOn(midi);
    }
});

window.addEventListener('keyup', (e) => {
    const midi = keyMap.get(e.code);
    if (midi) {
        triggerNoteOff(midi);
    }
});

// --- Settings Sliders Listeners ---
document.getElementById('synthWaveform').addEventListener('change', (e) => {
    config.waveform = e.target.value;
});

// ADSR
setupSlider('synthAttack', 'attackVal', 'attack', 's');
setupSlider('synthDecay', 'decayVal', 'decay', 's');
setupSlider('synthSustain', 'sustainVal', 'sustain', '');
setupSlider('synthRelease', 'releaseVal', 'release', 's');

// Filter
setupSlider('filterCutoff', 'filterCutoffVal', 'cutoff', 'Hz', (val) => {
    config.filter.cutoff = val;
    if (filterNode) filterNode.frequency.setValueAtTime(val, audioCtx.currentTime);
});
setupSlider('filterQ', 'filterQVal', 'Q', '', (val) => {
    config.filter.Q = val;
    if (filterNode) filterNode.Q.setValueAtTime(val, audioCtx.currentTime);
});

// Delay
setupSlider('delayTime', 'delayTimeVal', 'time', 's', (val) => {
    config.delay.time = val;
    if (delayNode) delayNode.delayTime.setValueAtTime(val, audioCtx.currentTime);
});
setupSlider('delayFeedback', 'delayFeedbackVal', 'feedback', '', (val) => {
    config.delay.feedback = val;
    if (delayFeedback) delayFeedback.gain.setValueAtTime(val, audioCtx.currentTime);
});
setupSlider('delayMix', 'delayMixVal', 'wet', '', (val) => {
    config.delay.wet = val;
    if (delayWetGain) delayWetGain.gain.setValueAtTime(val, audioCtx.currentTime);
});

function setupSlider(sliderId, valueId, key, suffix, customCallback) {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(valueId);
    slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (display) display.textContent = val + suffix;
        if (customCallback) {
            customCallback(val);
        } else {
            config.envelope[key] = val;
        }
    });
}

// --- Web MIDI API Integration ---
function initMIDI() {
    const deviceLabel = document.getElementById('midiDeviceLabel');
    if (!navigator.requestMIDIAccess) {
        if (deviceLabel) deviceLabel.textContent = "MIDI UNSUPPORTED BY BROWSER";
        return;
    }
    
    navigator.requestMIDIAccess()
        .then(midiAccess => {
            const inputs = midiAccess.inputs.values();
            let hasDevice = false;
            for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
                input.value.onmidimessage = handleMIDIMessage;
                if (deviceLabel) deviceLabel.textContent = `CONNECTED: ${input.value.name}`;
                hasDevice = true;
            }
            if (!hasDevice) {
                if (deviceLabel) deviceLabel.textContent = "NO MIDI DEVICE DETECTED";
            }
            
            // Listen for connection status changes
            midiAccess.onstatechange = (e) => {
                if (e.port.type === 'input') {
                    if (e.port.state === 'connected') {
                        e.port.onmidimessage = handleMIDIMessage;
                        if (deviceLabel) deviceLabel.textContent = `CONNECTED: ${e.port.name}`;
                    } else {
                        if (deviceLabel) deviceLabel.textContent = "MIDI CONTROLLER DISCONNECTED";
                    }
                }
            };
        })
        .catch(err => {
            if (deviceLabel) deviceLabel.textContent = "MIDI ACCESS BLOCKED/DENIED";
            console.error("MIDI Init Failed: ", err);
        });
}

function handleMIDIMessage(message) {
    const command = message.data[0];
    const midiNote = message.data[1];
    const velocity = message.data.length > 2 ? message.data[2] : 0;
    
    // We restrict incoming notes to our 2-octave C3-C5 range (48 to 72)
    // Transpose octaves if notes fall out of bounds
    let adjustedNote = midiNote;
    while (adjustedNote < 48) adjustedNote += 12;
    while (adjustedNote > 72) adjustedNote -= 12;

    if (command === 144 && velocity > 0) { // Note On
        triggerNoteOn(adjustedNote);
    } else if (command === 128 || (command === 144 && velocity === 0)) { // Note Off
        triggerNoteOff(adjustedNote);
    }
}

// --- Waterfall Canvas Renderer ---
const canvas = document.getElementById('waterfallCanvas');
const ctx = canvas.getContext('2d');
const waterfallNotes = [];

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function spawnWaterfallNote(midi) {
    const noteInfo = pianoNotes.find(n => n.midi === midi);
    if (!noteInfo) return;
    
    const keyWidth = canvas.width / 15;
    let x, w;
    if (noteInfo.isBlack) {
        x = noteInfo.whiteIndex * keyWidth;
        w = keyWidth * 0.55;
    } else {
        x = noteInfo.whiteIndex * keyWidth;
        w = keyWidth - 2;
    }
    
    // Cyan gradient color for white keys, Magenta/Purple for black keys
    const color = noteInfo.isBlack ? '#af52de' : '#00e5ff';
    
    waterfallNotes.push({
        midi: midi,
        x: x,
        w: w,
        y: 0,
        h: 0,
        color: color,
        isPressed: true
    });
}

function releaseWaterfallNote(midi) {
    waterfallNotes.forEach(note => {
        if (note.midi === midi && note.isPressed) {
            note.isPressed = false;
        }
    });
}

function animateWaterfall() {
    // Clear canvas with subtle trail fade
    ctx.fillStyle = 'rgba(0, 2, 8, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const speed = 4; // Waterfall speed pixels per frame
    
    // Draw and update active notes
    for (let i = waterfallNotes.length - 1; i >= 0; i--) {
        const note = waterfallNotes[i];
        
        ctx.fillStyle = note.color;
        // Shadow/glow glow
        ctx.shadowColor = note.color;
        ctx.shadowBlur = 10;
        
        ctx.fillRect(note.x, note.y, note.w, note.h);
        
        // Reset shadow
        ctx.shadowBlur = 0;
        
        if (note.isPressed) {
            // Keep growing the note block height from the top down
            note.h += speed;
        } else {
            // Move the entire note block down the canvas
            note.y += speed;
        }
        
        // Remove note if it falls completely off the canvas
        if (note.y > canvas.height) {
            waterfallNotes.splice(i, 1);
        }
    }
    
    requestAnimationFrame(animateWaterfall);
}

// Initialise
generateKeyboard();
initMIDI();
animateWaterfall();
