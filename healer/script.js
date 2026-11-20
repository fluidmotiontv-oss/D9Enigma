// Dragon 9 | Frequency Healer Sound Engine & Visualizer

// Solfeggio Presets Configuration
const SOLFEGGIO_PRESETS = [
    {
        freq: 174,
        name: "Pain Relief",
        desc: "Deep grounding and tension release. Perfect for physical relaxation and comfort.",
        color: "#ff3b30", // Red
        glow: "rgba(255, 59, 48, 0.35)",
        chakra: "Root Aura"
    },
    {
        freq: 285,
        name: "Energy Fields",
        desc: "Rejuvenating tissues, restructuring organs, and restoring energy fields.",
        color: "#ff9500", // Orange
        glow: "rgba(255, 149, 0, 0.35)",
        chakra: "Earth Star"
    },
    {
        freq: 396,
        name: "Liberate Guilt & Fear",
        desc: "Overcoming fear and clearing deep-seated guilt. Clears path for creation.",
        color: "#ffcc00", // Yellow
        glow: "rgba(255, 204, 0, 0.35)",
        chakra: "Root Chakra"
    },
    {
        freq: 417,
        name: "Facilitate Change",
        desc: "Clearing negative blockages, undoing old situations, and welcoming change.",
        color: "#ff5e3a", // Coral Red
        glow: "rgba(255, 94, 58, 0.35)",
        chakra: "Sacral Chakra"
    },
    {
        freq: 528,
        name: "DNA Transformation",
        desc: "The frequency of miracles, transformation, and cellular restoration.",
        color: "#4cd964", // Green
        glow: "rgba(76, 217, 100, 0.35)",
        chakra: "Solar Plexus"
    },
    {
        freq: 639,
        name: "Harmonize Relationships",
        desc: "Connecting hearts, healing social blockages, and bringing interpersonal harmony.",
        color: "#ff2d55", // Pink
        glow: "rgba(255, 45, 85, 0.35)",
        chakra: "Heart Chakra"
    },
    {
        freq: 741,
        name: "Awaken Intuition",
        desc: "Detoxification of cells, awakening intuition, and mental clarity.",
        color: "#5ac8fa", // Blue
        glow: "rgba(90, 200, 250, 0.35)",
        chakra: "Throat Chakra"
    },
    {
        freq: 852,
        name: "Spiritual Order",
        desc: "Returning to spiritual order, opening inner vision and clairvoyance.",
        color: "#5856d6", // Indigo
        glow: "rgba(88, 86, 214, 0.35)",
        chakra: "Third Eye"
    },
    {
        freq: 963,
        name: "Divine Consciousness",
        desc: "Crown chakra alignment, experience of pure oneness and cosmic connection.",
        color: "#af52de", // Violet
        glow: "rgba(175, 82, 222, 0.35)",
        chakra: "Crown Chakra"
    }
];

// Audio State Variables
let audioCtx = null;
let masterGain = null;
let analyserNode = null;

// Oscillators and gains
let carrierOsc = null;
let offsetOsc = null;
let toneGainNode = null;
let beatGainNode = null;
let padGainNode = null;

// Stereo Panners
let panNodeL = null;
let panNodeR = null;

// Noise / Ambient Generators
let ambientSource = null;
let ambientFilter = null;
let ambientLFO = null;
let ambientLFOGain = null;

// Celestial Pad Oscillators
let padOscs = [];
let padFilter = null;
let padLFO = null;
let padLFOGain = null;

// General state
let isPlaying = false;
let carrierFreq = 528;
let beatFreq = 6.0;
let isBinaural = false;
let ambientType = 'ocean'; // ocean, rain, pink, off
let selectedWaveform = 'sine'; // sine, triangle, sawtooth, square
let volumeTone = 0.7;
let volumeBeat = 0.4;
let volumePad = 0.3;

// Sleep Timer variables
let timerDuration = 0; // minutes
let timerRemaining = 0; // seconds
let timerInterval = null;
let isFadingOut = false;

// Visualizer Canvas setup
const canvas = document.getElementById('visualizer-canvas');
const ctx = canvas.getContext('2d');
let animationFrameId = null;

// DOM Elements
const dom = {
    btnPlay: document.getElementById('btn-play-toggle'),
    playIcon: document.getElementById('play-icon'),
    playText: document.getElementById('play-text'),
    statFreq: document.getElementById('stat-freq'),
    statBeat: document.getElementById('stat-beat'),
    statPad: document.getElementById('stat-pad'),
    solfeggioContainer: document.getElementById('solfeggio-container'),
    visualizerCard: document.querySelector('.visualizer-card'),
    statusPill: document.getElementById('status-pill'),
    statusCopy: document.getElementById('status-copy'),
    modeChip: document.getElementById('mode-chip'),
    ambientChip: document.getElementById('ambient-chip'),
    immersiveToggle: document.getElementById('immersive-toggle'),
    ritualTransition: document.getElementById('ritual-transition'),
    journeySteps: Array.from(document.querySelectorAll('.journey-step')),
    
    // Sliders
    sliderToneVol: document.getElementById('slider-tone-vol'),
    labelToneVol: document.getElementById('label-tone-vol'),
    sliderBeatVol: document.getElementById('slider-beat-vol'),
    labelBeatVol: document.getElementById('label-beat-vol'),
    sliderPadVol: document.getElementById('slider-pad-vol'),
    labelPadVol: document.getElementById('label-pad-vol'),
    sliderCarrierFreq: document.getElementById('slider-carrier-freq'),
    labelCarrierFreq: document.getElementById('label-carrier-freq'),
    sliderBeatFreq: document.getElementById('slider-beat-freq'),
    labelBeatFreq: document.getElementById('label-beat-freq'),
    
    // Dropdowns / toggles
    selectWaveform: document.getElementById('select-waveform'),
    toggleBinaural: document.getElementById('toggle-binaural'),
    selectAmbient: document.getElementById('select-ambient'),
    
    // Brainwave buttons
    btnSubs: document.querySelectorAll('.btn-sub'),
    
    // Timer buttons
    btnTimers: document.querySelectorAll('.btn-timer'),
    timerCountdown: document.getElementById('timer-countdown')
};

// Initial setup
function init() {
    renderSolfeggioCards();
    setupEventListeners();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    drawVisualizerPlaceholder();
    updateSessionCard();
}

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight || 280;
}

// Generate the 9 Solfeggio Cards
function renderSolfeggioCards() {
    dom.solfeggioContainer.innerHTML = '';
    SOLFEGGIO_PRESETS.forEach(preset => {
        const card = document.createElement('div');
        card.className = `preset-card ${preset.freq === carrierFreq ? 'active' : ''}`;
        card.style.setProperty('--glow-color', preset.color);
        card.setAttribute('data-freq', preset.freq);
        
        card.innerHTML = `
            <div class="preset-freq">${preset.freq} <span>Hz</span></div>
            <div class="preset-name">${preset.name}</div>
            <div class="preset-desc">${preset.desc}</div>
            <div style="font-family: 'Share Tech Mono', monospace; font-size: 0.7rem; color: ${preset.color}; margin-top: auto; opacity: 0.9;">
                ${preset.chakra}
            </div>
        `;
        
        card.addEventListener('click', () => {
            selectSolfeggioPreset(preset);
        });
        
        dom.solfeggioContainer.appendChild(card);
    });
}

function selectSolfeggioPreset(preset) {
    carrierFreq = preset.freq;
    dom.sliderCarrierFreq.value = carrierFreq;
    dom.labelCarrierFreq.textContent = `${carrierFreq} Hz`;
    dom.statFreq.textContent = carrierFreq;
    
    // Update active class on cards
    document.querySelectorAll('.preset-card').forEach(c => {
        c.classList.remove('active');
        if (c.getAttribute('data-freq') == carrierFreq) {
            c.classList.add('active');
        }
    });
    
    // Set custom CSS variable for glow theme match
    document.documentElement.style.setProperty('--glow-color', preset.color);
    updateSessionCard();
    
    if (isPlaying) {
        updateFrequencies();
    }
}

// Event handlers
function setupEventListeners() {
    dom.btnPlay.addEventListener('click', togglePlayback);
    dom.immersiveToggle.addEventListener('click', toggleImmersiveMode);
    
    // Volumes
    dom.sliderToneVol.addEventListener('input', (e) => {
        volumeTone = parseFloat(e.target.value) / 100;
        dom.labelToneVol.textContent = `${e.target.value}%`;
        if (toneGainNode && isPlaying) {
            toneGainNode.gain.setValueAtTime(volumeTone, audioCtx.currentTime);
        }
    });
    
    dom.sliderBeatVol.addEventListener('input', (e) => {
        volumeBeat = parseFloat(e.target.value) / 100;
        dom.labelBeatVol.textContent = `${e.target.value}%`;
        if (beatGainNode && isPlaying) {
            beatGainNode.gain.setValueAtTime(volumeBeat, audioCtx.currentTime);
        }
    });
    
    dom.sliderPadVol.addEventListener('input', (e) => {
        volumePad = parseFloat(e.target.value) / 100;
        dom.labelPadVol.textContent = `${e.target.value}%`;
        if (padGainNode && isPlaying) {
            padGainNode.gain.setValueAtTime(volumePad, audioCtx.currentTime);
        }
    });
    
    // Carrier Freq
    dom.sliderCarrierFreq.addEventListener('input', (e) => {
        carrierFreq = parseInt(e.target.value);
        dom.labelCarrierFreq.textContent = `${carrierFreq} Hz`;
        dom.statFreq.textContent = carrierFreq;
        
        // Remove preset card highlights if it doesn't match exactly
        document.querySelectorAll('.preset-card').forEach(c => {
            if (c.getAttribute('data-freq') == carrierFreq) {
                c.classList.add('active');
            } else {
                c.classList.remove('active');
            }
        });
        updateSessionCard();
        
        if (isPlaying) {
            updateFrequencies();
        }
    });

    // Waveform
    dom.selectWaveform.addEventListener('change', (e) => {
        selectedWaveform = e.target.value;
        if (isPlaying) {
            if (carrierOsc) carrierOsc.type = selectedWaveform;
            if (offsetOsc) offsetOsc.type = selectedWaveform;
        }
    });
    
    // Binaural toggle
    dom.toggleBinaural.addEventListener('change', (e) => {
        isBinaural = e.target.checked;
        dom.statBeat.textContent = isBinaural ? `${beatFreq}Hz` : 'OFF';
        updateSessionCard();
        if (isPlaying) {
            rebuildAudioPipeline();
        }
    });
    
    // Beat Freq
    dom.sliderBeatFreq.addEventListener('input', (e) => {
        beatFreq = parseFloat(e.target.value);
        dom.labelBeatFreq.textContent = `${beatFreq.toFixed(1)} Hz`;
        if (isBinaural) {
            dom.statBeat.textContent = `${beatFreq.toFixed(1)}Hz`;
        }
        
        // Update active class on brainwave preset buttons
        dom.btnSubs.forEach(btn => {
            if (parseFloat(btn.getAttribute('data-beat')) === beatFreq) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        updateSessionCard();
        
        if (isPlaying) {
            updateFrequencies();
        }
    });
    
    // Brainwave Preset clicks
    dom.btnSubs.forEach(btn => {
        btn.addEventListener('click', () => {
            dom.btnSubs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            beatFreq = parseFloat(btn.getAttribute('data-beat'));
            dom.sliderBeatFreq.value = beatFreq;
            dom.labelBeatFreq.textContent = `${beatFreq.toFixed(1)} Hz`;
            
            if (isBinaural) {
                dom.statBeat.textContent = `${beatFreq.toFixed(1)}Hz`;
            }
            
            // Check the binaural checkbox automatically if clicked a preset
            if (!isBinaural) {
                dom.toggleBinaural.checked = true;
                isBinaural = true;
                dom.statBeat.textContent = `${beatFreq.toFixed(1)}Hz`;
                if (isPlaying) {
                    rebuildAudioPipeline();
                    return;
                }
            }
            updateSessionCard();
            
            if (isPlaying) {
                updateFrequencies();
            }
        });
    });
    
    // Ambient noise choice
    dom.selectAmbient.addEventListener('change', (e) => {
        ambientType = e.target.value;
        dom.statPad.textContent = ambientType.toUpperCase();
        updateSessionCard();
        if (isPlaying) {
            rebuildAudioPipeline();
        }
    });
    
    // Sleep Timer clicks
    dom.btnTimers.forEach(btn => {
        btn.addEventListener('click', () => {
            dom.btnTimers.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const minutes = parseInt(btn.getAttribute('data-time'));
            setSleepTimer(minutes);
        });
    });
}

// Audio initialization and toggle
function togglePlayback() {
    if (isPlaying) {
        stopAudio();
    } else {
        startAudio();
    }
}

function toggleImmersiveMode() {
    document.body.classList.toggle('immersive-mode');
    const active = document.body.classList.contains('immersive-mode');
    dom.immersiveToggle.textContent = active ? '◌ Exit ritual view' : '⟡ Full ritual view';
    dom.immersiveToggle.style.borderColor = active ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)';
    dom.immersiveToggle.style.color = active ? 'var(--accent-cyan)' : 'var(--text-main)';
}

function triggerRitualTransition() {
    if (!dom.ritualTransition) return;
    dom.ritualTransition.classList.remove('active');
    void dom.ritualTransition.offsetWidth;
    dom.ritualTransition.classList.add('active');
    setTimeout(() => dom.ritualTransition.classList.remove('active'), 650);
}

function advanceJourneyStep() {
    if (!dom.journeySteps || !dom.journeySteps.length) return;
    dom.journeySteps.forEach((step, index) => {
        step.classList.toggle('active', index <= (isPlaying ? 1 : 0));
    });
}

function startAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    isPlaying = true;
    isFadingOut = false;
    
    dom.btnPlay.classList.add('playing');
    dom.playIcon.textContent = '⏹';
    dom.playText.textContent = 'Deactivate resonance';
    
    buildAudioPipeline();
    animateVisualizer();
    updateSessionCard();
    triggerRitualTransition();
    advanceJourneyStep();
}

function stopAudio() {
    if (!isPlaying) return;
    
    isPlaying = false;
    dom.btnPlay.classList.remove('playing');
    dom.playIcon.textContent = '▶';
    dom.playText.textContent = 'Activate resonance';
    updateSessionCard();
    advanceJourneyStep();
    
    // Smooth fadeout before stopping
    if (audioCtx && masterGain) {
        masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
        masterGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    }
    
    setTimeout(() => {
        if (!isPlaying) {
            cleanupAudioNodes();
            cancelAnimationFrame(animationFrameId);
            drawVisualizerPlaceholder();
        }
    }, 160);
}

function buildAudioPipeline() {
    cleanupAudioNodes();
    
    // Master routing
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);
    
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 1024;
    analyserNode.connect(masterGain);
    
    // Individual mix gains
    toneGainNode = audioCtx.createGain();
    toneGainNode.gain.setValueAtTime(volumeTone, audioCtx.currentTime);
    toneGainNode.connect(analyserNode);
    
    beatGainNode = audioCtx.createGain();
    beatGainNode.gain.setValueAtTime(volumeBeat, audioCtx.currentTime);
    beatGainNode.connect(analyserNode);
    
    padGainNode = audioCtx.createGain();
    padGainNode.gain.setValueAtTime(volumePad, audioCtx.currentTime);
    padGainNode.connect(analyserNode);
    
    // 1. CARRIER OSCILLATOR (Left Ear / Center)
    carrierOsc = audioCtx.createOscillator();
    carrierOsc.type = selectedWaveform;
    
    if (isBinaural) {
        // Binaural mode: Route carrier to Left channel only
        panNodeL = audioCtx.createStereoPanner();
        panNodeL.pan.value = -1;
        carrierOsc.connect(panNodeL);
        panNodeL.connect(toneGainNode);
        
        // 2. OFFSET OSCILLATOR (Right Ear only)
        offsetOsc = audioCtx.createOscillator();
        offsetOsc.type = selectedWaveform;
        
        panNodeR = audioCtx.createStereoPanner();
        panNodeR.pan.value = 1;
        offsetOsc.connect(panNodeR);
        panNodeR.connect(beatGainNode);
    } else {
        // Mono mode: Route carrier to center
        carrierOsc.connect(toneGainNode);
    }
    
    updateFrequencies();
    
    // Start oscillators
    carrierOsc.start(audioCtx.currentTime);
    if (isBinaural && offsetOsc) {
        offsetOsc.start(audioCtx.currentTime);
    }
    
    // 3. AMBIENT NOISE / PAD
    if (ambientType === 'ocean') {
        createOceanSynth();
    } else if (ambientType === 'rain') {
        createRainSynth();
    } else if (ambientType === 'pink') {
        createPinkNoise();
    }
}

function rebuildAudioPipeline() {
    if (!isPlaying) return;
    
    // Smooth transition
    const tempToneVol = volumeTone;
    const tempBeatVol = volumeBeat;
    const tempPadVol = volumePad;
    
    buildAudioPipeline();
}

function cleanupAudioNodes() {
    // Tone oscillators
    if (carrierOsc) {
        try { carrierOsc.stop(); } catch(e) {}
        carrierOsc = null;
    }
    if (offsetOsc) {
        try { offsetOsc.stop(); } catch(e) {}
        offsetOsc = null;
    }
    
    // Noise source
    if (ambientSource) {
        try { ambientSource.stop(); } catch(e) {}
        ambientSource = null;
    }
    if (ambientLFO) {
        try { ambientLFO.stop(); } catch(e) {}
        ambientLFO = null;
    }
    
    // Pad oscillators
    padOscs.forEach(osc => {
        try { osc.stop(); } catch(e) {}
    });
    padOscs = [];
    
    if (padLFO) {
        try { padLFO.stop(); } catch(e) {}
        padLFO = null;
    }
}

function updateFrequencies() {
    if (!isPlaying) return;
    
    const now = audioCtx.currentTime;
    if (isBinaural) {
        // Binaural beat: Carrier on Left, Carrier + Beat on Right
        if (carrierOsc) {
            carrierOsc.frequency.setValueAtTime(carrierFreq, now);
        }
        if (offsetOsc) {
            offsetOsc.frequency.setValueAtTime(carrierFreq + beatFreq, now);
        }
    } else {
        // Mono: Carrier central
        if (carrierOsc) {
            carrierOsc.frequency.setValueAtTime(carrierFreq, now);
        }
    }
    
    // If celestial pad is running, update its tones to harmonise with carrier
    if (ambientType === 'pink' && padOscs.length > 0) {
        const root = carrierFreq * 0.5; // one octave below
        const third = carrierFreq * 0.6; // minor 3rd
        const fifth = carrierFreq * 0.75; // fifth
        
        if (padOscs[0]) padOscs[0].frequency.setValueAtTime(root, now);
        if (padOscs[1]) padOscs[1].frequency.setValueAtTime(third, now);
        if (padOscs[2]) padOscs[2].frequency.setValueAtTime(fifth, now);
    }
}

// Noise / Synthesis algorithms
function createOceanSynth() {
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // Kellet's Pink Noise filter approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        output[i] = pink * 0.11; // Gain scale
    }
    
    ambientSource = audioCtx.createBufferSource();
    ambientSource.buffer = noiseBuffer;
    ambientSource.loop = true;
    
    // Lowpass filter swept by slow LFO
    ambientFilter = audioCtx.createBiquadFilter();
    ambientFilter.type = 'lowpass';
    ambientFilter.frequency.value = 450; // base frequency
    ambientFilter.Q.value = 1.0;
    
    ambientLFO = audioCtx.createOscillator();
    ambientLFO.frequency.value = 0.07; // ~14s cycle
    
    ambientLFOGain = audioCtx.createGain();
    ambientLFOGain.gain.value = 350; // Sweeps filter between 100Hz and 800Hz
    
    // Routing LFO -> Filter Cutoff
    ambientLFO.connect(ambientLFOGain);
    ambientLFOGain.connect(ambientFilter.frequency);
    
    ambientSource.connect(ambientFilter);
    ambientFilter.connect(padGainNode);
    
    ambientLFO.start(audioCtx.currentTime);
    ambientSource.start(audioCtx.currentTime);
}

function createRainSynth() {
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    // White noise
    for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.6;
    }
    
    ambientSource = audioCtx.createBufferSource();
    ambientSource.buffer = noiseBuffer;
    ambientSource.loop = true;
    
    // Bandpass + Highpass filters for light rain hiss
    ambientFilter = audioCtx.createBiquadFilter();
    ambientFilter.type = 'bandpass';
    ambientFilter.frequency.value = 1400;
    ambientFilter.Q.value = 0.8;
    
    const highpass = audioCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 550;
    
    ambientSource.connect(highpass);
    highpass.connect(ambientFilter);
    ambientFilter.connect(padGainNode);
    
    ambientSource.start(audioCtx.currentTime);
}

function createPinkNoise() {
    // Generate pink noise buffer and overlay a soft synthesizer minor/major pad
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        output[i] = pink * 0.04; // low level pink background
    }
    
    ambientSource = audioCtx.createBufferSource();
    ambientSource.buffer = noiseBuffer;
    ambientSource.loop = true;
    ambientSource.connect(padGainNode);
    ambientSource.start(audioCtx.currentTime);
    
    // Create Celestial Drone Pad (3 chord-based triangle waves)
    const root = carrierFreq * 0.5; 
    const third = carrierFreq * 0.6; 
    const fifth = carrierFreq * 0.75;
    const frequencies = [root, third, fifth];
    
    padFilter = audioCtx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 350;
    padFilter.Q.value = 2.0;
    
    padLFO = audioCtx.createOscillator();
    padLFO.frequency.value = 0.15; // 6s sweep
    
    padLFOGain = audioCtx.createGain();
    padLFOGain.gain.value = 150; // sweeps cutoff between 200Hz and 500Hz
    
    padLFO.connect(padLFOGain);
    padLFOGain.connect(padFilter.frequency);
    padFilter.connect(padGainNode);
    
    frequencies.forEach(f => {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = f;
        
        // Custom gain per pad voice
        const voiceGain = audioCtx.createGain();
        voiceGain.gain.value = 0.25; 
        
        osc.connect(voiceGain);
        voiceGain.connect(padFilter);
        
        osc.start(audioCtx.currentTime);
        padOscs.push(osc);
    });
    
    padLFO.start(audioCtx.currentTime);
}

// Sleep Timer logic
function setSleepTimer(minutes) {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    timerDuration = minutes;
    
    if (minutes === 0) {
        dom.timerCountdown.style.display = 'none';
        isFadingOut = false;
        if (masterGain && isPlaying) {
            masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
        }
        return;
    }
    
    timerRemaining = minutes * 60;
    dom.timerCountdown.style.display = 'block';
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timerRemaining--;
        updateTimerDisplay();
        
        // Start fading out when 15 seconds are left
        if (timerRemaining === 15 && isPlaying && !isFadingOut) {
            isFadingOut = true;
            if (masterGain) {
                masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 15);
            }
        }
        
        if (timerRemaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            stopAudio();
            // Reset active timer button classes
            dom.btnTimers.forEach(b => b.classList.remove('active'));
            document.querySelector('.btn-timer[data-time="0"]').classList.add('active');
            dom.timerCountdown.style.display = 'none';
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(timerRemaining / 60);
    const secs = timerRemaining % 60;
    const formattedMins = mins.toString().padStart(2, '0');
    const formattedSecs = secs.toString().padStart(2, '0');
    
    if (isFadingOut) {
        dom.timerCountdown.textContent = `FADING OUT: ${formattedMins}:${formattedSecs}`;
        dom.timerCountdown.style.color = '#ff0080';
    } else {
        dom.timerCountdown.textContent = `SLEEP TIMER: ${formattedMins}:${formattedSecs}`;
        dom.timerCountdown.style.color = 'var(--accent-gold)';
    }
}

// Canvas visualization
function drawVisualizerPlaceholder() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const gradient = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.45, 20, canvas.width * 0.5, canvas.height * 0.45, canvas.width * 0.6);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.16)');
    gradient.addColorStop(0.5, 'rgba(4, 8, 20, 0.78)');
    gradient.addColorStop(1, 'rgba(2, 2, 5, 0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 38) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 38) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
    }
    
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 70, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.04)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 36, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(244, 228, 188, 0.6)';
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RESONATOR STANDBY • READY FOR A DEEPER FIELD', canvas.width / 2, canvas.height / 2 + 108);
}

function updateSessionCard() {
    const preset = SOLFEGGIO_PRESETS.find(item => item.freq === carrierFreq) || SOLFEGGIO_PRESETS[4];
    const ambientLabel = ambientType === 'ocean' ? 'Ocean veil' : ambientType === 'rain' ? 'Rain hush' : ambientType === 'pink' ? 'Pink drift' : 'Tone only';
    const focusLabel = preset.freq >= 741 ? 'Clarity & vision' : preset.freq >= 639 ? 'Connection & heart opening' : preset.freq >= 528 ? 'Transformation & renewal' : 'Grounding & release';
    const toneLabel = isPlaying ? 'Resonance active' : 'Ready to begin';
    const beatLabel = isBinaural ? 'Binaural pulse' : 'Mono carrier';

    if (dom.statusPill) dom.statusPill.textContent = toneLabel.toUpperCase();
    if (dom.statusCopy) dom.statusCopy.innerHTML = `<strong>${preset.name}</strong> · ${beatLabel} · ${ambientLabel}`;
    if (dom.modeChip) dom.modeChip.textContent = focusLabel;
    if (dom.ambientChip) dom.ambientChip.textContent = ambientType === 'off' ? 'No ambience' : ambientLabel;
    if (dom.visualizerCard) {
        dom.visualizerCard.classList.toggle('active', isPlaying);
        dom.visualizerCard.style.setProperty('--glow-color', preset.color);
    }
}

function animateVisualizer() {
    if (!isPlaying) return;
    
    animationFrameId = requestAnimationFrame(animateVisualizer);
    
    const bufferLength = analyserNode.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);
    
    analyserNode.getByteTimeDomainData(timeData);
    analyserNode.getByteFrequencyData(freqData);
    
    // Fade out trail
    ctx.fillStyle = 'rgba(2, 2, 5, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Get average amplitude energy
    let energySum = 0;
    for (let i = 0; i < bufferLength; i++) {
        energySum += freqData[i];
    }
    const averageEnergy = energySum / bufferLength;
    const energyScale = 1 + (averageEnergy / 255) * 0.8;
    
    // Draw cybernetic network grids that reacts to sound
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.01 + (averageEnergy / 255) * 0.05})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    
    // Draw mathematical Lemniscate (Infinity symbol) in center
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const t = Date.now() * 0.001;
    
    // Draw outer orbital path
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.arc(cx, cy, 90 * energyScale, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw real-time oscillating sine waves representing Carrier & Offset
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 12;
    
    // Left Channel (Cyan)
    ctx.strokeStyle = 'var(--accent-cyan)';
    ctx.shadowColor = 'var(--accent-cyan)';
    ctx.beginPath();
    for (let i = 0; i < canvas.width; i++) {
        const v = timeData[Math.floor((i / canvas.width) * bufferLength)] / 128.0;
        // Modulate with simple mathematical wave to simulate organic drift
        const waveMod = Math.sin(i * 0.02 + t * 5) * 6 * (1 + (isBinaural ? 1 : 0));
        const y = (v * canvas.height / 2) + waveMod;
        
        if (i === 0) {
            ctx.moveTo(i, y);
        } else {
            ctx.lineTo(i, y);
        }
    }
    ctx.stroke();
    
    // Right Channel (Magenta - only rendered if binaural beat offset is active)
    if (isBinaural) {
        ctx.strokeStyle = 'var(--accent-magenta)';
        ctx.shadowColor = 'var(--accent-magenta)';
        ctx.beginPath();
        for (let i = 0; i < canvas.width; i++) {
            const v = timeData[Math.floor((i / canvas.width) * bufferLength)] / 128.0;
            // Draw slightly shifted wave representing the binaural frequency discrepancy
            const waveMod = Math.sin(i * 0.02 - t * (5 + beatFreq * 0.1)) * 6;
            const y = (v * canvas.height / 2) + waveMod;
            
            if (i === 0) {
                ctx.moveTo(i, y);
            } else {
                ctx.lineTo(i, y);
            }
        }
        ctx.stroke();
    }
    
    // Draw Lemniscate tracer ring (Infinity loop)
    ctx.shadowBlur = 15;
    const activeColor = getComputedStyle(document.documentElement).getPropertyValue('--glow-color').trim() || 'var(--accent-cyan)';
    ctx.strokeStyle = activeColor;
    ctx.shadowColor = activeColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    const scale = 110 * energyScale;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
        // Math formula for lemniscate: x = cos(a) / (1 + sin^2(a)), y = sin(a)cos(a) / (1 + sin^2(a))
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const denom = 1 + sin * sin;
        
        // Add dynamic frequency noise factor
        const noise = (freqData[Math.floor((angle / (Math.PI * 2)) * (bufferLength / 4))] || 0) * 0.06;
        
        const x = cx + (scale * cos) / denom;
        const y = cy + (scale * sin * cos) / denom + Math.sin(angle * 12 + t * 8) * noise;
        
        if (angle === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.stroke();
    
    // Draw dynamic core particle
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    const pulseAngle = t * 1.5;
    const sinP = Math.sin(pulseAngle);
    const cosP = Math.cos(pulseAngle);
    const denomP = 1 + sinP * sinP;
    const px = cx + (scale * cosP) / denomP;
    const py = cy + (scale * sinP * cosP) / denomP;
    
    ctx.arc(px, py, 6 + (averageEnergy / 255) * 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0; // reset
}

// Start
window.addEventListener('DOMContentLoaded', init);
