// --- CATHEDRAL ORGAN SYNTH & RECORDER ENGINE ---

// MIDI to Frequency
function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

// 25 notes from C3 (MIDI 48) to C5 (MIDI 72)
const organNotes = [
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

// Web Audio API Elements
let audioCtx = null;
let masterGain = null;
let reverbNode = null;
let reverbFeedback = null;
let reverbWetGain = null;

const activeVoices = new Map(); // midiNumber -> OrganVoice

// Config State
const config = {
    stops: {
        principal: true,
        gedeckt: false,
        octave: true,
        flute: false,
        mixture: false,
        oboe: false
    },
    reverb: { decay: 3.5, wet: 0.35 }
};

// Loop Recording State
let isRecording = false;
let isPlayingLoop = false;
let recordStep = 0;
let recordTimer = null;
let recordedSequence = new Array(16).fill(null);
let bpm = 120;

// Initialize Audio
function initAudio() {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.7;

    // Emulate Nave Reverb using Multi-Tap Delay feedback lines
    reverbNode = audioCtx.createDelay(4.0);
    reverbNode.delayTime.value = 0.28; // Wall reflections

    reverbFeedback = audioCtx.createGain();
    reverbFeedback.gain.value = 0.65; // Decay rate

    reverbWetGain = audioCtx.createGain();
    reverbWetGain.gain.value = config.reverb.wet;

    // Feedback Loop
    reverbNode.connect(reverbFeedback);
    reverbFeedback.connect(reverbNode);

    // Connections
    masterGain.connect(audioCtx.destination); // Dry route
    masterGain.connect(reverbNode);          // Send path
    reverbNode.connect(reverbWetGain);
    reverbWetGain.connect(audioCtx.destination);
}

// Organ Voice Synthesis (Combines multiple stop ranks)
class OrganVoice {
    constructor(midi) {
        initAudio();
        this.midi = midi;
        this.freq = midiToFreq(midi);
        this.oscillators = [];
        this.gainNode = audioCtx.createGain();
        this.gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        this.gainNode.connect(masterGain);

        const now = audioCtx.currentTime;

        // stop multipliers and stop wave styles
        const ranks = [
            { active: config.stops.principal, freqMult: 1.0, type: 'sine', gain: 0.35 },
            { active: config.stops.gedeckt, freqMult: 1.0, type: 'triangle', gain: 0.3 },
            { active: config.stops.octave, freqMult: 2.0, type: 'sine', gain: 0.25 },
            { active: config.stops.flute, freqMult: 2.0, type: 'triangle', gain: 0.2 },
            { active: config.stops.mixture, freqMult: 3.0, type: 'sine', gain: 0.15 },
            { active: config.stops.mixture, freqMult: 4.0, type: 'sine', gain: 0.1 },
            { active: config.stops.oboe, freqMult: 1.0, type: 'sawtooth', gain: 0.15 }
        ];

        ranks.forEach(rank => {
            if (rank.active) {
                const osc = audioCtx.createOscillator();
                osc.type = rank.type;
                osc.frequency.setValueAtTime(this.freq * rank.freqMult, now);
                
                const rankGain = audioCtx.createGain();
                rankGain.gain.setValueAtTime(rank.gain, now);

                osc.connect(rankGain);
                rankGain.connect(this.gainNode);
                osc.start(now);
                this.oscillators.push(osc);
            }
        });

        // Fast attack, slow release (Cathedral envelope)
        this.gainNode.gain.linearRampToValueAtTime(0.6, now + 0.04);
    }

    release() {
        const now = audioCtx.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.3); // Organ release wind fade

        setTimeout(() => {
            this.oscillators.forEach(osc => osc.stop());
            this.gainNode.disconnect();
        }, 350);
    }
}

// Visual Keyboard Generator
const keyboard = document.getElementById('keyboard');
function generateKeys() {
    keyboard.innerHTML = "";
    
    // Sort white and black keys
    const whiteNotes = organNotes.filter(n => !n.isBlack);
    const blackNotes = organNotes.filter(n => n.isBlack);

    whiteNotes.forEach(note => {
        const key = document.createElement('div');
        key.className = 'key white';
        key.dataset.midi = note.midi;
        key.innerHTML = `
            <div class="key-note">${note.name}</div>
            <div class="key-label">${note.char}</div>
        `;
        
        bindKeyEvents(key, note.midi);
        keyboard.appendChild(key);
    });

    blackNotes.forEach(note => {
        const key = document.createElement('div');
        key.className = 'key black';
        key.dataset.midi = note.midi;
        key.innerHTML = `
            <div class="key-note">${note.name}</div>
            <div class="key-label">${note.char}</div>
        `;
        
        // Calculate position relative to white keys
        const whiteWidth = 100 / whiteNotes.length;
        const leftPercent = (note.whiteIndex * whiteWidth);
        key.style.position = 'absolute';
        key.style.left = `${leftPercent}%`;
        
        bindKeyEvents(key, note.midi);
        keyboard.appendChild(key);
    });
}

function bindKeyEvents(el, midi) {
    const handleStart = (e) => {
        e.preventDefault();
        triggerNoteOn(midi);
    };
    const handleEnd = (e) => {
        e.preventDefault();
        triggerNoteOff(midi);
    };
    
    el.addEventListener('mousedown', handleStart);
    el.addEventListener('mouseup', handleEnd);
    el.addEventListener('mouseleave', handleEnd);
    el.addEventListener('touchstart', handleStart, { passive: false });
    el.addEventListener('touchend', handleEnd, { passive: false });
}

// Trigger note play
function triggerNoteOn(midi) {
    if (activeVoices.has(midi)) return;
    
    const voice = new OrganVoice(midi);
    activeVoices.set(midi, voice);

    // Record note if active
    if (isRecording) {
        recordedSequence[recordStep] = midi;
    }

    const key = document.querySelector(`.key[data-midi="${midi}"]`);
    if (key) key.classList.add('active');

    updateHUD();
}

function triggerNoteOff(midi) {
    const voice = activeVoices.get(midi);
    if (!voice) return;
    
    voice.release();
    activeVoices.delete(midi);

    const key = document.querySelector(`.key[data-midi="${midi}"]`);
    if (key) key.classList.remove('active');

    updateHUD();
}

function updateHUD() {
    const label = document.getElementById('activePipesLabel');
    if (label) label.textContent = `ACTIVE PIPES: ${activeVoices.size * Object.values(config.stops).filter(Boolean).length}`;
}

// QWERTY keyboard bindings
const keyMap = new Map();
organNotes.forEach(n => {
    keyMap.set(n.code, n.midi);
});

window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const midi = keyMap.get(e.code);
    if (midi) triggerNoteOn(midi);
});

window.addEventListener('keyup', (e) => {
    const midi = keyMap.get(e.code);
    if (midi) triggerNoteOff(midi);
});

// Settings Handlers
document.querySelectorAll('.drawknob').forEach(knob => {
    knob.addEventListener('click', () => {
        const stopName = knob.dataset.stop;
        config.stops[stopName] = !config.stops[stopName];
        knob.classList.toggle('active', config.stops[stopName]);
    });
});

// Reverb Controllers
document.getElementById('organReverb').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    config.reverb.decay = val;
    document.getElementById('reverbDecayVal').textContent = `${val.toFixed(1)}s`;
    if (reverbFeedback) {
        // Map decay to feedback level (0.1s -> 0.1, 8s -> 0.85)
        reverbFeedback.gain.setValueAtTime(0.3 + (val / 8.0) * 0.55, audioCtx.currentTime);
    }
});

document.getElementById('organReverbMix').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    config.reverb.wet = val;
    document.getElementById('reverbMixVal').textContent = val.toFixed(2);
    if (reverbWetGain) {
        reverbWetGain.gain.setValueAtTime(val, audioCtx.currentTime);
    }
});

// --- metronome and step recorder ---
const stepIndicator = document.getElementById('step-indicator');
function generateSteps() {
    stepIndicator.innerHTML = "";
    for (let i = 0; i < 16; i++) {
        const dot = document.createElement('div');
        dot.className = 'step-dot';
        stepIndicator.appendChild(dot);
    }
}

function playMetronomeClick(accented) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.frequency.setValueAtTime(accented ? 900 : 500, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
}

// Metronome Loop timer
function startRecordingLoop() {
    initAudio();
    clearInterval(recordTimer);
    
    const stepTime = (60 / bpm) * 1000 / 2; // eighth notes sync (4 seconds per loop)
    
    recordTimer = setInterval(() => {
        // Draw active step
        const dots = document.querySelectorAll('.step-dot');
        dots.forEach(d => d.classList.remove('active', 'recording-active'));
        
        if (dots[recordStep]) {
            dots[recordStep].classList.add(isRecording ? 'recording-active' : 'active');
        }

        // Metronome click sound
        if (isRecording && recordStep % 2 === 0) {
            playMetronomeClick(recordStep === 0);
        }

        // Play recorded note on step
        if (isPlayingLoop || isRecording) {
            const recordedMidi = recordedSequence[recordStep];
            if (recordedMidi) {
                // Play chord or note
                const voice = new OrganVoice(recordedMidi);
                voice.gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
                setTimeout(() => voice.release(), stepTime - 20);
                
                // Highlight keyboard key visually during playback
                const key = document.querySelector(`.key[data-midi="${recordedMidi}"]`);
                if (key) {
                    key.classList.add('active');
                    setTimeout(() => key.classList.remove('active'), stepTime - 20);
                }
            }
        }

        // Advance
        recordStep = (recordStep + 1) % 16;
    }, stepTime);
}

// Connect buttons
const recordBtn = document.getElementById('btn-record-toggle');
const playBtn = document.getElementById('btn-play-toggle');

recordBtn.addEventListener('click', () => {
    isRecording = !isRecording;
    if (isRecording) {
        isPlayingLoop = false;
        recordedSequence.fill(null);
        recordStep = 0;
        recordBtn.textContent = '⏹️ Stop';
        recordBtn.classList.add('recording');
        playBtn.disabled = true;
        startRecordingLoop();
    } else {
        recordBtn.textContent = '🔴 Record';
        recordBtn.classList.remove('recording');
        playBtn.disabled = false;
        clearInterval(recordTimer);
        const dots = document.querySelectorAll('.step-dot');
        dots.forEach(d => d.classList.remove('active', 'recording-active'));
        
        // Save sequence to localStorage
        localStorage.setItem('d9_recorded_organ_sequence', JSON.stringify(recordedSequence));
        console.log("Saved live Organ recorded track:", recordedSequence);
    }
});

playBtn.addEventListener('click', () => {
    isPlayingLoop = !isPlayingLoop;
    if (isPlayingLoop) {
        isRecording = false;
        recordStep = 0;
        playBtn.textContent = '⏹️ Stop';
        startRecordingLoop();
    } else {
        playBtn.textContent = '▶ Play';
        clearInterval(recordTimer);
        const dots = document.querySelectorAll('.step-dot');
        dots.forEach(d => d.classList.remove('active', 'recording-active'));
    }
});

// BPM Tempo adjustment
document.getElementById('recordTempo').addEventListener('input', (e) => {
    bpm = parseInt(e.target.value);
    document.getElementById('tempoVal').textContent = bpm;
    if (isRecording || isPlayingLoop) {
        startRecordingLoop();
    }
});

// --- PIPES VISUALIZER ---
const canvas = document.getElementById('pipesCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);

// Render pipe pillars
const numPipes = 18;
const pipeHeights = new Array(numPipes).fill(0);

function drawPipes() {
    requestAnimationFrame(drawPipes);
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid lines
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    const padding = 15;
    const pipeWidth = (canvas.width - padding * 2) / numPipes;
    
    for (let i = 0; i < numPipes; i++) {
        // Calculate pipe heights gothic shape
        const baseHeight = (canvas.height * 0.45) + Math.sin((i / numPipes) * Math.PI) * (canvas.height * 0.35);
        
        // Target height if note is playing
        let targetValue = 0;
        activeVoices.forEach(voice => {
            const voiceNoteIdx = organNotes.findIndex(n => n.midi === voice.midi);
            if (Math.abs(voiceNoteIdx - (i * (organNotes.length / numPipes))) < 1.8) {
                targetValue = 40 + Math.random() * 30; // vibrate pipe
            }
        });

        // Interpolate visual heights
        pipeHeights[i] += (targetValue - pipeHeights[i]) * 0.15;

        // Draw Pipe cylinder
        const px = padding + i * pipeWidth;
        const py = canvas.height - baseHeight - pipeHeights[i];
        
        const grad = ctx.createLinearGradient(px, 0, px + pipeWidth, 0);
        grad.addColorStop(0, '#534327');
        grad.addColorStop(0.3, '#d4af37'); // Shiny gold reflection
        grad.addColorStop(0.7, '#f4e4bc');
        grad.addColorStop(1, '#1e160a');
        
        ctx.fillStyle = grad;
        ctx.fillRect(px + 2, py, pipeWidth - 4, baseHeight + pipeHeights[i]);

        // Draw pipe top point gothic arch
        ctx.beginPath();
        ctx.moveTo(px + 2, py);
        ctx.lineTo(px + pipeWidth / 2, py - 8);
        ctx.lineTo(px + pipeWidth - 2, py);
        ctx.fillStyle = '#d4af37';
        ctx.fill();

        // Draw active pipe light glow
        if (targetValue > 0) {
            ctx.shadowColor = '#d4af37';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.strokeRect(px + 2, py, pipeWidth - 4, baseHeight + pipeHeights[i]);
            ctx.shadowBlur = 0; // reset
        }
    }
}

// Initialise
generateKeys();
generateSteps();
resizeCanvas();
drawPipes();
