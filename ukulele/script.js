// --- SOVEREIGN UKULELE INSTRUCTOR AUDIO & VISUAL ENGINE ---

// Chord configurations mapping [String 4 (G), String 3 (C), String 2 (E), String 1 (A)] frets
const ukeChords = {
    "C": [0, 0, 0, 3],
    "G": [0, 2, 3, 2],
    "Am": [2, 0, 0, 0],
    "F": [2, 0, 1, 0],
    "D": [2, 2, 2, 0],
    "Em": [0, 4, 3, 2],
    "A": [2, 1, 0, 0],
    "Dm": [2, 2, 1, 0],
    "G7": [0, 2, 1, 2],
    "C7": [0, 0, 0, 1],
    "Fmaj7": [2, 4, 1, 0]
};

// String frequencies [String G4, String C4, String E4, String A4]
const baseStringFreqs = [392.00, 261.63, 329.63, 440.00];

// Progressions lists
const progressions = {
    "island": ["C", "G", "Am", "F"],
    "reggae": ["Am", "Dm", "G", "C"],
    "jazzy": ["Fmaj7", "Fmaj7", "G7", "C"],
    "classic": ["C", "Am", "F", "G"]
};

// Web Audio API context
let audioCtx = null;
let activeChord = "C";
let currentFretboardPositions = [0, 0, 0, 3];

// Metronome state
let bpm = 100;
let isMetronomeRunning = false;
let metronomeInterval = null;
let currentBeat = 0; // 0 to 3 (beats 1-4)
let beatTimeMs = 600;

// Progression practice state
let isProgressionActive = false;
let progressionIndex = 0;
let currentProgression = [];

// DOM References
const fretSvg = document.getElementById('fretboardSvg');
const chordGrid = document.getElementById('chordGrid');
const activeTitle = document.getElementById('activeChordTitle');
const metronomeBpm = document.getElementById('metronomeBpm');
const metronomeBpmVal = document.getElementById('metronomeBpmVal');
const metronomeToggle = document.getElementById('metronomeToggle');
const progressionSelect = document.getElementById('progressionSelect');
const progressionToggle = document.getElementById('progressionToggle');
const strumBtn = document.getElementById('strumChordBtn');
const currentPrompt = document.getElementById('currentChordPrompt');
const nextPrompt = document.getElementById('nextChordPrompt');
const timelineBar = document.getElementById('timelineBar');
const rhythmGuide = document.getElementById('rhythmGuidePanel');

// Initialise Audio
function initAudio() {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
}

// --- SOUND SYNTHESIS ENGINE ---

// Pluck a single string
function pluckString(stringIndex, fret, delayTime = 0) {
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime + delayTime;
    const baseFreq = baseStringFreqs[stringIndex];
    
    // Frequency calculation: baseFreq * 2^(fret/12)
    const freq = baseFreq * Math.pow(2, fret / 12);
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Custom periodic wave or triangle to mimic ukulele acoustic sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    
    // Pluck Envelope (Fast Attack, Fast Decay decay to sustain=0, release)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2); // Decay string resonance
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 1.2);
}

// Strum complete chord (strings plucked sequentially with small delay)
function strumActiveChord() {
    const frets = ukeChords[activeChord] || [0, 0, 0, 0];
    
    // Loop Record
    if (isRecording) {
        recordedSequence[recordStep] = activeChord;
    }

    // Strum from top string (G, index 0) to bottom string (A, index 3)
    const strumSpeed = 0.035; // 35ms delay between string plucks
    for (let i = 0; i < 4; i++) {
        pluckString(i, frets[i], i * strumSpeed);
    }
}

// Metronome click synthesizer
function playMetronomeClick(isDownbeat) {
    initAudio();
    const now = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    // Downbeat is higher pitched
    osc.frequency.setValueAtTime(isDownbeat ? 1000 : 700, now);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.05);
}

// --- FRETBOARD RENDERER (SVG) ---
function renderFretboard() {
    fretSvg.innerHTML = '';
    
    const width = 600;
    const height = 150;
    const paddingLeft = 60;
    const paddingRight = 40;
    const boardWidth = width - paddingLeft - paddingRight;
    
    const totalFrets = 5;
    const fretSpacing = boardWidth / totalFrets;
    const stringSpacing = height / 5;
    
    // 1. Draw Fretboard Neck Background (subtle dark wood texture)
    const neck = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    neck.setAttribute("x", paddingLeft);
    neck.setAttribute("y", stringSpacing);
    neck.setAttribute("width", boardWidth);
    neck.setAttribute("height", stringSpacing * 3);
    neck.setAttribute("fill", "rgba(255,255,255,0.02)");
    neck.setAttribute("rx", "4");
    fretSvg.appendChild(neck);

    // 2. Draw Frets (Vertical lines)
    for (let i = 0; i <= totalFrets; i++) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        const x = paddingLeft + i * fretSpacing;
        line.setAttribute("x1", x);
        line.setAttribute("y1", stringSpacing);
        line.setAttribute("x2", x);
        line.setAttribute("y2", stringSpacing * 4);
        
        // Thicker nut line (fret 0)
        if (i === 0) {
            line.setAttribute("stroke", "var(--accent-gold)");
            line.setAttribute("stroke-width", "4");
        } else {
            line.setAttribute("stroke", "rgba(255, 255, 255, 0.2)");
            line.setAttribute("stroke-width", "2");
        }
        fretSvg.appendChild(line);
        
        // Fret Numbers Labels below
        if (i > 0) {
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", x - fretSpacing / 2);
            label.setAttribute("y", stringSpacing * 4.6);
            label.setAttribute("fill", "var(--text-muted)");
            label.setAttribute("font-family", "Share Tech Mono, monospace");
            label.setAttribute("font-size", "10");
            label.setAttribute("text-anchor", "middle");
            label.textContent = `FRET ${i}`;
            fretSvg.appendChild(label);
        }
    }

    // 3. Draw Strings (Horizontal lines)
    const stringNames = ["G", "C", "E", "A"];
    for (let i = 0; i < 4; i++) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        const y = stringSpacing + i * stringSpacing;
        line.setAttribute("x1", paddingLeft - 20);
        line.setAttribute("y1", y);
        line.setAttribute("x2", paddingLeft + boardWidth);
        line.setAttribute("y2", y);
        line.setAttribute("stroke", "rgba(255, 255, 255, 0.5)");
        // Strings get thinner towards bottom (G to A)
        line.setAttribute("stroke-width", `${2.5 - i * 0.5}`);
        fretSvg.appendChild(line);
        
        // String note name indicators at the head
        const noteText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        noteText.setAttribute("x", paddingLeft - 35);
        noteText.setAttribute("y", y + 4);
        noteText.setAttribute("fill", "var(--accent-cyan)");
        noteText.setAttribute("font-family", "Orbitron, sans-serif");
        noteText.setAttribute("font-size", "11");
        noteText.setAttribute("font-weight", "bold");
        noteText.textContent = stringNames[i];
        fretSvg.appendChild(noteText);
    }

    // 4. Draw Finger placement Dots based on current active chord frets
    const frets = ukeChords[activeChord] || [0, 0, 0, 0];
    
    for (let i = 0; i < 4; i++) {
        const fretVal = frets[i];
        const y = stringSpacing + i * stringSpacing;
        
        if (fretVal === 0) {
            // Open string indicator 'O'
            const openText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            openText.setAttribute("x", paddingLeft - 10);
            openText.setAttribute("y", y + 4);
            openText.setAttribute("fill", "var(--text-muted)");
            openText.setAttribute("font-family", "Share Tech Mono, monospace");
            openText.setAttribute("font-size", "11");
            openText.setAttribute("font-weight", "bold");
            openText.setAttribute("text-anchor", "middle");
            openText.textContent = "O";
            fretSvg.appendChild(openText);
        } else {
            // Finger dot placed centered inside the fret space
            const dotX = paddingLeft + (fretVal - 0.5) * fretSpacing;
            
            // Outer glow ring
            const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            glow.setAttribute("cx", dotX);
            glow.setAttribute("cy", y);
            glow.setAttribute("r", "12");
            glow.setAttribute("fill", "rgba(0, 229, 255, 0.25)");
            fretSvg.appendChild(glow);
            
            // Inner solid dot
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("cx", dotX);
            dot.setAttribute("cy", y);
            dot.setAttribute("r", "7");
            dot.setAttribute("fill", "var(--accent-cyan)");
            fretSvg.appendChild(dot);

            // Add finger note label on top of dot
            const fretLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            fretLabel.setAttribute("x", dotX);
            fretLabel.setAttribute("y", y + 3);
            fretLabel.setAttribute("fill", "#000");
            fretLabel.setAttribute("font-family", "Share Tech Mono, monospace");
            fretLabel.setAttribute("font-weight", "bold");
            fretLabel.setAttribute("font-size", "9");
            fretLabel.setAttribute("text-anchor", "middle");
            fretLabel.textContent = `${fretVal}`;
            fretSvg.appendChild(fretLabel);
        }
    }
}

// --- CHORD SELECTION CONTROLLER ---
function selectChord(chordName) {
    if (!ukeChords[chordName]) return;
    
    activeChord = chordName;
    
    // Update Active Buttons styles
    document.querySelectorAll('.chord-btn').forEach(btn => {
        if (btn.dataset.chord === chordName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update visuals
    activeTitle.innerHTML = `CHORD: <span>${chordName}</span>`;
    renderFretboard();
    
    // Auto-strum chord on click
    strumActiveChord();
}

function renderChordButtons() {
    chordGrid.innerHTML = '';
    Object.keys(ukeChords).forEach(chord => {
        const btn = document.createElement('button');
        btn.className = 'chord-btn';
        btn.dataset.chord = chord;
        btn.textContent = chord;
        if (chord === activeChord) btn.classList.add('active');
        
        btn.addEventListener('click', () => selectChord(chord));
        chordGrid.appendChild(btn);
    });
}

// --- METRONOME & PRACTICE ENGINE ---
function toggleMetronome() {
    if (isMetronomeRunning) {
        stopMetronome();
    } else {
        startMetronome();
    }
}

function startMetronome() {
    initAudio();
    isMetronomeRunning = true;
    currentBeat = 0;
    if (metronomeToggle) {
        metronomeToggle.textContent = "⏹️ Stop Metronome";
        metronomeToggle.classList.add('active');
    }
    
    runMetronomeTick();
}

function stopMetronome() {
    isMetronomeRunning = false;
    if (metronomeInterval) {
        clearInterval(metronomeInterval);
        metronomeInterval = null;
    }
    if (metronomeToggle) {
        metronomeToggle.textContent = "🔊 Start Metronome";
        metronomeToggle.classList.remove('active');
    }
    
    // Reset visuals
    resetTimeline();
}

function runMetronomeTick() {
    beatTimeMs = (60 / bpm) * 1000;
    
    // Schedule loop
    metronomeInterval = setInterval(() => {
        // 1. Play synthesized tick audio
        const isDownbeat = (currentBeat === 0);
        playMetronomeClick(isDownbeat);
        
        // 2. Animate progress bar visual
        animateBeatProgress(currentBeat);
        
        // 3. Handle chord progression transitions
        if (isProgressionActive && currentBeat === 0) {
            transitionProgressionChord();
        }
        
        // Increment beat count (1 to 4 loop)
        currentBeat = (currentBeat + 1) % 4;
        
    }, beatTimeMs);
}

function animateBeatProgress(beatIndex) {
    // Reset step active styles
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`beatStep-${i}`);
        if (step) {
            if (i === (beatIndex + 1)) {
                step.className = 'active-step-indicator';
            } else {
                step.className = '';
            }
        }
    }
    
    // Smooth progress bar transition
    if (timelineBar) {
        timelineBar.style.transition = 'none';
        timelineBar.style.width = '0%';
        
        setTimeout(() => {
            if (timelineBar) {
                timelineBar.style.transition = `width ${beatTimeMs / 1000}s linear`;
                timelineBar.style.width = '100%';
            }
        }, 10);
    }
}

function resetTimeline() {
    if (timelineBar) {
        timelineBar.style.transition = 'none';
        timelineBar.style.width = '0%';
    }
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`beatStep-${i}`);
        if (step) step.className = '';
    }
}

// Progression Practice loop
function toggleProgressionPractice() {
    const select = progressionSelect.value;
    if (select === 'none') {
        alert("Please select a chord progression sequence first!");
        return;
    }
    
    if (isProgressionActive) {
        // Deactivate
        isProgressionActive = false;
        progressionToggle.textContent = "⚡ Practice Progression";
        progressionToggle.classList.remove('active');
        rhythmGuide.style.opacity = '0.5';
        
        currentPrompt.textContent = "SELECT PROGRESSION";
        nextPrompt.textContent = "NEXT: --";
    } else {
        // Activate
        isProgressionActive = true;
        currentProgression = progressions[select];
        progressionIndex = 0;
        
        progressionToggle.textContent = "⏹️ Stop Practice";
        progressionToggle.classList.add('active');
        rhythmGuide.style.opacity = '1';
        
        // Auto-start metronome if it's idle
        if (!isMetronomeRunning) {
            startMetronome();
        }
        
        // Initial setups
        const currentChord = currentProgression[0];
        const nextChord = currentProgression[1];
        selectChord(currentChord);
        
        currentPrompt.textContent = `PLAY: ${currentChord}`;
        nextPrompt.textContent = `NEXT: ${nextChord}`;
    }
}

function transitionProgressionChord() {
    progressionIndex = (progressionIndex + 1) % currentProgression.length;
    
    const currentChord = currentProgression[progressionIndex];
    const nextChord = currentProgression[(progressionIndex + 1) % currentProgression.length];
    
    selectChord(currentChord);
    
    currentPrompt.textContent = `PLAY: ${currentChord}`;
    nextPrompt.textContent = `NEXT: ${nextChord}`;
}

// Metronome inputs configuration
metronomeBpm.addEventListener('input', (e) => {
    bpm = parseInt(e.target.value);
    if (metronomeBpmVal) metronomeBpmVal.textContent = `${bpm} BPM`;
    if (isRecording || isPlayingLoop) {
        startRecordingLoop();
    }
});

// Event Triggers
progressionToggle.addEventListener('click', toggleProgressionPractice);
strumBtn.addEventListener('click', strumActiveChord);

// Progression dropdown update
progressionSelect.addEventListener('change', () => {
    if (isProgressionActive) {
        toggleProgressionPractice();
    }
});

// Strum on fretboard click triggers
fretSvg.addEventListener('click', strumActiveChord);

// --- Loop Recorder & Metronome ---
let isRecording = false;
let isPlayingLoop = false;
let recordStep = 0;
let recordTimer = null;
let recordedSequence = new Array(16).fill(null);

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
    initAudio();
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

function startRecordingLoop() {
    initAudio();
    clearInterval(recordTimer);
    
    const stepTime = (60 / bpm) * 1000 / 2; // eighth notes
    
    recordTimer = setInterval(() => {
        const dots = document.querySelectorAll('.step-dot');
        dots.forEach(d => d.classList.remove('active', 'recording-active'));
        
        if (dots[recordStep]) {
            dots[recordStep].classList.add(isRecording ? 'recording-active' : 'active');
        }

        if (isRecording && recordStep % 2 === 0) {
            playMetronomeClick(recordStep === 0);
        }

        if (isPlayingLoop || isRecording) {
            const recordedChord = recordedSequence[recordStep];
            if (recordedChord) {
                // Strum the recorded chord
                const frets = ukeChords[recordedChord] || [0, 0, 0, 0];
                const strumSpeed = 0.035;
                for (let i = 0; i < 4; i++) {
                    pluckString(i, frets[i], i * strumSpeed);
                }
                
                // Highlight the chord button visually during playback if visible
                const btn = document.querySelector(`.chord-btn[data-chord="${recordedChord}"]`);
                if (btn) {
                    btn.classList.add('active');
                    setTimeout(() => btn.classList.remove('active'), stepTime - 20);
                }
            }
        }

        recordStep = (recordStep + 1) % 16;
    }, stepTime);
}

const recordBtn = document.getElementById('btn-record-toggle');
const playBtn = document.getElementById('btn-play-toggle');

recordBtn.addEventListener('click', () => {
    isRecording = !isRecording;
    if (isRecording) {
        isPlayingLoop = false;
        recordedSequence.fill(null);
        recordStep = 0;
        recordBtn.textContent = '⏹️ Stop';
        recordBtn.style.background = '#ff0055';
        playBtn.disabled = true;
        startRecordingLoop();
    } else {
        recordBtn.textContent = '🔴 Record';
        recordBtn.style.background = 'rgba(255,0,85,0.08)';
        playBtn.disabled = false;
        clearInterval(recordTimer);
        const dots = document.querySelectorAll('.step-dot');
        dots.forEach(d => d.classList.remove('active', 'recording-active'));
        
        localStorage.setItem('d9_recorded_ukulele_sequence', JSON.stringify(recordedSequence));
        console.log("Saved live Ukulele recorded track:", recordedSequence);
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

// Render initial state
renderFretboard();
renderChordButtons();
resetTimeline();
generateSteps();
