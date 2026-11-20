// Web Audio Guitar Tuner & Frequency Generator/Reader Engine

// State variables
let audioCtx = null;
let micStream = null;
let micSourceNode = null;
let micFilterNode = null;
let micAnalyserNode = null;
let micBuffer = null;
let isReading = false;
let animationFrameId = null;

let oscNode = null;
let oscGainNode = null;
let oscAnalyserNode = null;
let isGenerating = false;
let genAnimationFrameId = null;
let selectedWaveform = 'sine';

// DOM selectors
const dom = {
    btnMicToggle: document.getElementById('btn-mic-toggle'),
    readerPanel: document.getElementById('reader-panel'),
    noteDisplay: document.getElementById('note-display'),
    hzDisplay: document.getElementById('hz-display'),
    centsDisplay: document.getElementById('cents-display'),
    dialCanvas: document.getElementById('dialCanvas'),
    micScope: document.getElementById('micScope'),
    
    btnGenToggle: document.getElementById('btn-gen-toggle'),
    genFreqSlider: document.getElementById('gen-freq-slider'),
    genFreqText: document.getElementById('gen-freq-text'),
    genGainSlider: document.getElementById('gen-gain-slider'),
    genGainText: document.getElementById('gen-gain-text'),
    genScope: document.getElementById('genScope'),
    btnPresets: document.querySelectorAll('.btn-preset'),
    btnWaves: document.querySelectorAll('.btn-wave')
};

// Dial configuration
const dialCtx = dom.dialCanvas.getContext('2d');
let currentCentsFiltered = 0; // Filtered cent displacement for smooth rendering

// Musical Note Frequency Names
const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function getNoteFromFrequency(frequency) {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const roundedNoteNum = Math.round(noteNum) + 69;
    
    // Ensure we are inside a normal pitch range
    if (roundedNoteNum < 0 || roundedNoteNum > 120) return null;
    
    const noteName = noteStrings[roundedNoteNum % 12];
    const octave = Math.floor(roundedNoteNum / 12) - 1;
    const expectedFreq = 440 * Math.pow(2, (roundedNoteNum - 69) / 12);
    const cents = Math.round(1200 * (Math.log(frequency / expectedFreq) / Math.log(2)));
    
    return {
        note: noteName + octave,
        expectedFreq: expectedFreq,
        cents: cents
    };
}

// ----------------------------------------------------
// 1. FREQUENCY READER (TUNER)
// ----------------------------------------------------

async function startReading() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }

    try {
        micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });
        
        micSourceNode = audioCtx.createMediaStreamSource(micStream);
        
        // Lowpass filter to eliminate high frequency harmonics (e.g. below 800 Hz)
        micFilterNode = audioCtx.createBiquadFilter();
        micFilterNode.type = 'lowpass';
        micFilterNode.frequency.value = 800; 

        micAnalyserNode = audioCtx.createAnalyser();
        micAnalyserNode.fftSize = 2048; // Standard size for autocorrelation stability
        
        // Connect mic -> lowpass filter -> analyser
        micSourceNode.connect(micFilterNode);
        micFilterNode.connect(micAnalyserNode);
        
        micBuffer = new Float32Array(micAnalyserNode.fftSize);
        isReading = true;
        
        dom.btnMicToggle.textContent = '🛑 DEACTIVATE MICROPHONE';
        dom.btnMicToggle.classList.add('active');
        
        updateReader();
    } catch (err) {
        console.error("Microphone access denied or audio issue:", err);
        alert("Unable to access microphone. Verify hardware connections and permission permissions.");
        stopReading();
    }
}

function stopReading() {
    isReading = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        micStream = null;
    }
    
    dom.btnMicToggle.textContent = '🎤 ACTIVATE MICROPHONE';
    dom.btnMicToggle.classList.remove('active');
    
    dom.noteDisplay.textContent = '--';
    dom.hzDisplay.textContent = '0.00 Hz';
    dom.centsDisplay.textContent = 'Tune to begin';
    dom.centsDisplay.className = 'cents-dev';
    dom.noteDisplay.classList.remove('in-tune');
    dom.readerPanel.classList.remove('in-tune-glow');
    
    currentCentsFiltered = 0;
    drawDial(0, false);
    clearCanvas(dom.micScope);
}

// Autocorrelation algorithm for pitch detection
function autoCorrelate(buffer, sampleRate) {
    const bufferSize = buffer.length;
    
    // 1. Calculate Root Mean Square (RMS) to verify signal strength
    let rms = 0;
    for (let i = 0; i < bufferSize; i++) {
        rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / bufferSize);
    if (rms < 0.008) {
        return -1; // Signal too quiet
    }

    // 2. Perform autocorrelation
    const size = Math.floor(bufferSize / 2);
    const correlations = new Float32Array(size);
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            correlations[i] += buffer[j] * buffer[j + i];
        }
    }

    // 3. Find the zero-crossing/minimum
    let d = 0;
    while (d < size - 1 && correlations[d] > correlations[d + 1]) {
        d++;
    }

    // 4. Find absolute peak
    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < size; i++) {
        if (correlations[i] > maxval) {
            maxval = correlations[i];
            maxpos = i;
        }
    }

    let T0 = maxpos;

    // Verify periodicity confidence threshold
    if (T0 < 0 || correlations[T0] / correlations[0] < 0.35) {
        return -1;
    }

    // 5. Parabolic interpolation for sub-Hz refinement
    if (T0 > 0 && T0 < size - 1) {
        const x1 = correlations[T0 - 1];
        const x2 = correlations[T0];
        const x3 = correlations[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;
        if (a) {
            T0 = T0 - b / (2 * a);
        }
    }

    return sampleRate / T0;
}

function updateReader() {
    if (!isReading) return;
    
    micAnalyserNode.getFloatTimeDomainData(micBuffer);
    const pitch = autoCorrelate(micBuffer, audioCtx.sampleRate);
    
    let isPitchFound = false;
    
    if (pitch !== -1 && pitch > 30 && pitch < 1200) { // Keep limits inside normal instrument pitches
        const data = getNoteFromFrequency(pitch);
        if (data) {
            isPitchFound = true;
            
            // Apply exponential moving average filter for smooth needle movement
            currentCentsFiltered += (data.cents - currentCentsFiltered) * 0.15;
            
            dom.noteDisplay.textContent = data.note;
            dom.hzDisplay.textContent = `${pitch.toFixed(2)} Hz`;
            
            const centsRound = Math.round(data.cents);
            const deviationText = centsRound === 0 ? "Perfect" : (centsRound > 0 ? `+${centsRound} cents` : `${centsRound} cents`);
            dom.centsDisplay.textContent = deviationText;
            
            // In-tune threshold (+-3 cents)
            const inTune = Math.abs(data.cents) <= 3;
            if (inTune) {
                dom.centsDisplay.className = 'cents-dev in-tune';
                dom.noteDisplay.classList.add('in-tune');
                dom.readerPanel.classList.add('in-tune-glow');
            } else {
                dom.centsDisplay.className = data.cents > 0 ? 'cents-dev sharp' : 'cents-dev flat';
                dom.noteDisplay.classList.remove('in-tune');
                dom.readerPanel.classList.remove('in-tune-glow');
            }
        }
    }
    
    if (!isPitchFound) {
        // Slow fallback decay
        currentCentsFiltered += (0 - currentCentsFiltered) * 0.05;
        if (Math.abs(currentCentsFiltered) < 0.5) currentCentsFiltered = 0;
    }
    
    drawDial(currentCentsFiltered, isPitchFound);
    drawScope(micAnalyserNode, dom.micScope, '#00e5ff');
    
    animationFrameId = requestAnimationFrame(updateReader);
}

// Draw the traditional tuning needle dial
function drawDial(cents, isPitchActive) {
    const w = dom.dialCanvas.width;
    const h = dom.dialCanvas.height;
    dialCtx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h - 20;
    const r = w * 0.42;

    // Draw dial arc
    dialCtx.beginPath();
    dialCtx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
    dialCtx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    dialCtx.lineWidth = 10;
    dialCtx.stroke();

    // Center divider zone (in tune zone)
    dialCtx.beginPath();
    dialCtx.arc(cx, cy, r, -Math.PI/2 - 0.06, -Math.PI/2 + 0.06);
    dialCtx.strokeStyle = isPitchActive && Math.abs(cents) <= 3 ? 'rgba(0, 255, 102, 0.6)' : 'rgba(212, 175, 55, 0.3)';
    dialCtx.lineWidth = 12;
    dialCtx.stroke();

    // Draw tick marks
    const ticks = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];
    ticks.forEach(t => {
        const angle = (t / 50) * (Math.PI / 3.5) - Math.PI / 2;
        const xStart = cx + (r - 10) * Math.cos(angle);
        const yStart = cy + (r - 10) * Math.sin(angle);
        const xEnd = cx + r * Math.cos(angle);
        const yEnd = cy + r * Math.sin(angle);

        dialCtx.beginPath();
        dialCtx.moveTo(xStart, yStart);
        dialCtx.lineTo(xEnd, yEnd);
        
        if (t === 0) {
            dialCtx.strokeStyle = isPitchActive && Math.abs(cents) <= 3 ? '#00ff66' : '#d4af37';
            dialCtx.lineWidth = 3;
        } else {
            dialCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            dialCtx.lineWidth = 1.5;
        }
        dialCtx.stroke();

        // Labels
        if (t % 20 === 0 || t === 0) {
            const labelX = cx + (r - 28) * Math.cos(angle);
            const labelY = cy + (r - 28) * Math.sin(angle);
            dialCtx.font = "bold 9px 'Orbitron'";
            dialCtx.fillStyle = t === 0 ? '#d4af37' : '#6b7280';
            dialCtx.textAlign = 'center';
            dialCtx.textBaseline = 'middle';
            dialCtx.fillText(t === 0 ? "0" : (t > 0 ? `+${t}` : t), labelX, labelY);
        }
    });

    // Draw needle
    const needleAngle = (cents / 50) * (Math.PI / 3.5) - Math.PI / 2;
    const needleLength = r - 5;
    const nx = cx + needleLength * Math.cos(needleAngle);
    const ny = cy + needleLength * Math.sin(needleAngle);

    dialCtx.beginPath();
    dialCtx.moveTo(cx, cy);
    dialCtx.lineTo(nx, ny);
    
    if (isPitchActive) {
        dialCtx.strokeStyle = Math.abs(cents) <= 3 ? '#00ff66' : (cents > 0 ? '#ff3366' : '#ffaa00');
        dialCtx.shadowBlur = 10;
        dialCtx.shadowColor = dialCtx.strokeStyle;
    } else {
        dialCtx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        dialCtx.shadowBlur = 0;
    }
    dialCtx.lineWidth = 3.5;
    dialCtx.lineCap = 'round';
    dialCtx.stroke();
    dialCtx.shadowBlur = 0; // Reset

    // Draw central hub pin
    dialCtx.beginPath();
    dialCtx.arc(cx, cy, 8, 0, 2 * Math.PI);
    dialCtx.fillStyle = isPitchActive && Math.abs(cents) <= 3 ? '#00ff66' : '#d4af37';
    dialCtx.fill();
    
    dialCtx.beginPath();
    dialCtx.arc(cx, cy, 3, 0, 2 * Math.PI);
    dialCtx.fillStyle = '#fff';
    dialCtx.fill();
}

// ----------------------------------------------------
// 2. FREQUENCY GENERATOR
// ----------------------------------------------------

async function startGenerating() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
    }

    oscNode = audioCtx.createOscillator();
    oscNode.type = selectedWaveform;
    oscNode.frequency.value = parseFloat(dom.genFreqSlider.value);

    oscGainNode = audioCtx.createGain();
    // Exponential curve for smoother volume response
    const volume = parseFloat(dom.genGainSlider.value);
    oscGainNode.gain.setValueAtTime(volume * volume, audioCtx.currentTime);

    oscAnalyserNode = audioCtx.createAnalyser();
    oscAnalyserNode.fftSize = 1024;

    // Connect oscillator -> gain -> analyser -> speakers
    oscNode.connect(oscGainNode);
    oscGainNode.connect(oscAnalyserNode);
    oscAnalyserNode.connect(audioCtx.destination);

    oscNode.start();
    isGenerating = true;

    dom.btnGenToggle.textContent = '🛑 STOP TUNING TONE';
    dom.btnGenToggle.classList.add('active');

    updateGeneratorScope();
}

function stopGenerating() {
    isGenerating = false;
    if (genAnimationFrameId) {
        cancelAnimationFrame(genAnimationFrameId);
    }

    if (oscNode) {
        oscNode.stop();
        oscNode.disconnect();
        oscNode = null;
    }
    if (oscGainNode) {
        oscGainNode.disconnect();
        oscGainNode = null;
    }

    dom.btnGenToggle.textContent = '🔊 PLAY TUNING TONE';
    dom.btnGenToggle.classList.remove('active');
    
    clearCanvas(dom.genScope);
}

function updateGeneratorScope() {
    if (!isGenerating) return;
    drawScope(oscAnalyserNode, dom.genScope, '#d4af37');
    genAnimationFrameId = requestAnimationFrame(updateGeneratorScope);
}

// ----------------------------------------------------
// 3. COMMON UTILITIES & EVENT HANDLERS
// ----------------------------------------------------

function drawScope(analyser, canvas, color) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    // Responsive scaling
    if (canvas.clientWidth !== w || canvas.clientHeight !== h) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = 'rgba(10, 10, 15, 0.2)'; // Persistent trails
    ctx.fillRect(0, 0, w, h);

    // Center baseline
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Signal waveform
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;

    const sliceWidth = w / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // 0.0 to 2.0
        const y = (v * h) / 2;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset
}

function clearCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Reader Activation Click Handler
dom.btnMicToggle.addEventListener('click', () => {
    if (isReading) {
        stopReading();
    } else {
        startReading();
    }
});

// Generator Activation Click Handler
dom.btnGenToggle.addEventListener('click', () => {
    if (isGenerating) {
        stopGenerating();
    } else {
        startGenerating();
    }
});

// Preset Buttons Event Binding
dom.btnPresets.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from other presets
        dom.btnPresets.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const freq = parseFloat(btn.getAttribute('data-freq'));
        dom.genFreqSlider.value = freq;
        dom.genFreqText.value = `${freq.toFixed(1)} Hz`;

        if (isGenerating && oscNode) {
            oscNode.frequency.setValueAtTime(freq, audioCtx.currentTime);
        }
    });
});

// Waveform Selector Event Binding
dom.btnWaves.forEach(btn => {
    btn.addEventListener('click', () => {
        dom.btnWaves.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        selectedWaveform = btn.getAttribute('data-wave');
        if (isGenerating && oscNode) {
            oscNode.type = selectedWaveform;
        }
    });
});

// Frequency Slider input event handler
dom.genFreqSlider.addEventListener('input', (e) => {
    // Remove active markers on presets when adjusting slider
    dom.btnPresets.forEach(b => b.classList.remove('active'));
    
    const freq = parseFloat(e.target.value);
    dom.genFreqText.value = `${freq.toFixed(1)} Hz`;

    if (isGenerating && oscNode) {
        oscNode.frequency.setValueAtTime(freq, audioCtx.currentTime);
    }
});

// Manual frequency text box input event handler
dom.genFreqText.addEventListener('change', (e) => {
    dom.btnPresets.forEach(b => b.classList.remove('active'));
    
    let freq = parseFloat(e.target.value);
    
    if (isNaN(freq)) {
        freq = 440;
    }
    // Constrain range limits
    freq = Math.max(20, Math.min(22000, freq));
    
    dom.genFreqSlider.value = freq;
    dom.genFreqText.value = `${freq.toFixed(1)} Hz`;

    if (isGenerating && oscNode) {
        oscNode.frequency.setValueAtTime(freq, audioCtx.currentTime);
    }
});

// Gain Slider input event handler
dom.genGainSlider.addEventListener('input', (e) => {
    const volume = parseFloat(e.target.value);
    dom.genGainText.textContent = `${Math.round(volume * 100)}%`;

    if (isGenerating && oscGainNode) {
        // Gain maps exponentially for natural human hearing perception
        oscGainNode.gain.setValueAtTime(volume * volume, audioCtx.currentTime);
    }
});

// Start initial dial rendering
drawDial(0, false);
