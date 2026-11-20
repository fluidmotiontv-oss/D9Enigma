// --- SOVEREIGN SEQUENCER ENGINE ---

let audioCtx = null;
let isPlaying = false;
let bpm = 120;
let isLooping = true;
let isMetronomeOn = false;

// Audio parameters
const NUM_TRACKS = 7;
const NUM_STEPS = 16;
let currentStep = 0;
let nextStepTime = 0.0;
const scheduleAheadTime = 0.1; // seconds
const lookaheadMs = 25; // milliseconds
let schedulerTimer = null;

// Track State arrays
const trackBuffers = new Array(NUM_TRACKS).fill(null);
const trackMutes = new Array(NUM_TRACKS).fill(false);
const trackSolos = new Array(NUM_TRACKS).fill(false);
const trackVolumes = [0.8, 0.7, 0.7, 0.6, 0.7, 0.7, 0.75]; // default volumes

// Grid State: 2D array [track][step]
const gridState = Array.from({ length: NUM_TRACKS }, () => new Array(NUM_STEPS).fill(false));

// Pre-packaged synthesized tracks sample builders (to work 100% offline out-of-the-box)
function synthesizeDefaultSamples() {
    initAudio();
    const sampleRate = audioCtx.sampleRate;

    // 1. Drum hit (Synth Kick) - 0.2s duration
    const kickDur = 0.25;
    const kickBuffer = audioCtx.createBuffer(1, sampleRate * kickDur, sampleRate);
    const kickData = kickBuffer.getChannelData(0);
    for (let i = 0; i < kickBuffer.length; i++) {
        const t = i / sampleRate;
        // Pitch sweep from 150Hz to 40Hz
        const f = 150 * Math.exp(-t * 25) + 40;
        // Apply envelope
        const env = Math.exp(-t * 12);
        kickData[i] = Math.sin(2 * Math.PI * f * t) * env;
    }
    trackBuffers[0] = kickBuffer;

    // 2. Synth Chord - 0.4s duration
    const synthDur = 0.4;
    const synthBuffer = audioCtx.createBuffer(1, sampleRate * synthDur, sampleRate);
    const synthData = synthBuffer.getChannelData(0);
    for (let i = 0; i < synthBuffer.length; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 6);
        // Play minor triad chord: C4 (261.63Hz), Eb4 (311.13Hz), G4 (392.00Hz)
        const chord = Math.sin(2 * Math.PI * 261.63 * t) +
                      Math.sin(2 * Math.PI * 311.13 * t) +
                      Math.sin(2 * Math.PI * 392.00 * t);
        synthData[i] = (chord / 3) * env;
    }
    trackBuffers[1] = synthBuffer;

    // 3. Ukulele Strum - 0.5s duration
    const ukeDur = 0.5;
    const ukeBuffer = audioCtx.createBuffer(1, sampleRate * ukeDur, sampleRate);
    const ukeData = ukeBuffer.getChannelData(0);
    for (let i = 0; i < ukeBuffer.length; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 5);
        // Play synthesized strum C Chord (G4, C4, E4, C5)
        const chord = Math.sin(2 * Math.PI * 392.00 * t) +
                      Math.sin(2 * Math.PI * 261.63 * t) +
                      Math.sin(2 * Math.PI * 329.63 * t) +
                      Math.sin(2 * Math.PI * 523.25 * t);
        ukeData[i] = (chord / 4) * env;
    }
    trackBuffers[2] = ukeBuffer;

    // 4. Healer Ambient Pad - 1.0s duration
    const padDur = 1.0;
    const padBuffer = audioCtx.createBuffer(1, sampleRate * padDur, sampleRate);
    const padData = padBuffer.getChannelData(0);
    for (let i = 0; i < padBuffer.length; i++) {
        const t = i / sampleRate;
        // Fade in and out envelope
        const env = Math.sin(Math.PI * t / padDur) * 0.8;
        // Play Solfeggio 528Hz healing resonance note with a sub-harmony of 264Hz
        const sound = Math.sin(2 * Math.PI * 528 * t) + Math.sin(2 * Math.PI * 264 * t);
        padData[i] = (sound / 2) * env;
    }
    trackBuffers[3] = padBuffer;

    updateStatus("Preloaded default synthesized loops successfully!");
}

// Initialize Audio Context & Nodes
function initAudio() {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
}

// --- SEQUENCER PLAYER ENGINE ---

// MIDI to Frequency conversion
function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

// Strum G4, C4, E4, A4 for Ukulele chords
const baseStringFreqs = [392.00, 261.63, 329.63, 440.00];
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

// Play dynamic synthesizers for recorded tracks
function playLiveSynthNote(trackIndex, stepIndex, time, gainNode) {
    if (trackIndex === 4) {
        // 🎹 Recorded Pianola
        const seq = JSON.parse(localStorage.getItem('d9_recorded_pianola_sequence') || '[]');
        const midi = seq[stepIndex];
        if (!midi) return;
        const freq = midiToFreq(midi);

        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        // Envelope
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.5, time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);

        osc.connect(gainNode);
        osc.start(time);
        osc.stop(time + 0.55);
    } else if (trackIndex === 5) {
        // ⛪ Recorded Cathedral Organ
        const seq = JSON.parse(localStorage.getItem('d9_recorded_organ_sequence') || '[]');
        const midi = seq[stepIndex];
        if (!midi) return;
        const freq = midiToFreq(midi);

        // Mix fundamental (Principal Stop) and octave stop
        const osc1 = audioCtx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, time);

        const osc2 = audioCtx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2.0, time); // Octave stop

        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.4, time + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.85);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.9);
        osc2.stop(time + 0.9);
    } else if (trackIndex === 6) {
        // 🎸 Recorded Ukulele Strum
        const seq = JSON.parse(localStorage.getItem('d9_recorded_ukulele_sequence') || '[]');
        const chord = seq[stepIndex];
        if (!chord) return;
        const frets = ukeChords[chord] || [0, 0, 0, 0];
        const strumSpeed = 0.035;

        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.6, time + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 1.0);

        for (let i = 0; i < 4; i++) {
            const osc = audioCtx.createOscillator();
            osc.type = 'triangle';
            const stringFreq = baseStringFreqs[i] * Math.pow(2, frets[i] / 12);
            osc.frequency.setValueAtTime(stringFreq, time + i * strumSpeed);

            osc.connect(gainNode);
            osc.start(time + i * strumSpeed);
            osc.stop(time + 1.1);
        }
    }
}

function playSample(buffer, time, trackIndex, stepIndex) {
    // Route: Source -> Mute/Solo Gain -> Volume Gain -> Destination
    const trackGain = audioCtx.createGain();
    
    // Calculate volumes considering mutes and solos
    let activeVol = trackVolumes[trackIndex];
    if (trackMutes[trackIndex]) {
        activeVol = 0;
    }
    const anySoloActive = trackSolos.some(s => s);
    if (anySoloActive && !trackSolos[trackIndex]) {
        activeVol = 0;
    }

    trackGain.gain.setValueAtTime(activeVol, time);
    trackGain.connect(audioCtx.destination);

    if (trackIndex < 4) {
        if (!buffer) return;
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(trackGain);
        source.start(time);
    } else {
        // Live synthesized tracks
        playLiveSynthNote(trackIndex, stepIndex, time, trackGain);
    }
}

// High-precision Scheduler
function scheduler() {
    while (nextStepTime < audioCtx.currentTime + scheduleAheadTime) {
        scheduleNextStep(currentStep, nextStepTime);
        incrementStep();
    }
}

function scheduleNextStep(step, time) {
    // 1. Play active steps
    for (let track = 0; track < NUM_TRACKS; track++) {
        if (gridState[track][step]) {
            playSample(trackBuffers[track], time, track, step);
        }
    }

    // 2. Play metronome if active
    if (isMetronomeOn && step % 4 === 0) {
        playMetronomeClick(time, step === 0);
    }

    // 3. Highlight playing step on main UI
    // Queue the DOM update onto animation frames for UI smoothness
    requestAnimationFrame(() => {
        document.querySelectorAll('.step-block').forEach(block => {
            const bStep = parseInt(block.dataset.step);
            if (bStep === step) {
                block.classList.add('playing-head');
            } else {
                block.classList.remove('playing-head');
            }
        });
    });
}

function incrementStep() {
    const stepDuration = (60.0 / bpm) / 4.0; // 16th note steps duration
    nextStepTime += stepDuration;

    currentStep++;
    if (currentStep === NUM_STEPS) {
        if (isLooping) {
            currentStep = 0;
        } else {
            stopPlayback();
        }
    }
}

function playMetronomeClick(time, isDownbeat) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 1000 : 700, time);
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(time);
    osc.stop(time + 0.05);
}

// Playback toggles
function startPlayback() {
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    isPlaying = true;
    currentStep = 0;
    nextStepTime = audioCtx.currentTime + 0.05;

    document.getElementById('playBtn').textContent = "⏸️ Pause";
    document.getElementById('playBtn').classList.add('active');
    updateStatus("Playback started // Compiling output...");

    schedulerTimer = setInterval(scheduler, lookaheadMs);
}

function pausePlayback() {
    isPlaying = false;
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    
    document.getElementById('playBtn').textContent = "▶️ Play";
    document.getElementById('playBtn').classList.remove('active');
    updateStatus("Playback paused");
}

function stopPlayback() {
    isPlaying = false;
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    currentStep = 0;
    
    document.getElementById('playBtn').textContent = "▶️ Play";
    document.getElementById('playBtn').classList.remove('active');
    
    // Clear playing head outlines
    document.querySelectorAll('.step-block').forEach(block => {
        block.classList.remove('playing-head');
    });

    updateStatus("Playback stopped");
}

// --- DOM CREATION & UI EVENTS ---

function createGrid() {
    for (let track = 0; track < NUM_TRACKS; track++) {
        const gridContainer = document.querySelector(`.step-grid[data-track="${track}"]`);
        gridContainer.innerHTML = '';
        
        for (let step = 0; step < NUM_STEPS; step++) {
            const block = document.createElement('div');
            block.className = 'step-block';
            block.dataset.track = track;
            block.dataset.step = step;
            
            block.addEventListener('mousedown', (e) => {
                e.preventDefault();
                toggleStep(track, step, block);
            });
            
            gridContainer.appendChild(block);
        }
    }
}

function toggleStep(track, step, element) {
    gridState[track][step] = !gridState[track][step];
    if (gridState[track][step]) {
        element.classList.add('selected');
        // Play sample instantly as a feedback sound
        initAudio();
        playSample(trackBuffers[track], audioCtx.currentTime, track, step);
    } else {
        element.classList.remove('selected');
    }
}

// Setup file loaders
function setupFileLoaders() {
    for (let track = 0; track < 4; track++) {
        const fileInput = document.getElementById(`fileInput-${track}`);
        if (!fileInput) continue;
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            updateStatus(`Decoding file: ${file.name}...`);
            const reader = new FileReader();
            reader.onload = function(e) {
                initAudio();
                audioCtx.decodeAudioData(e.target.result)
                    .then(decodedBuffer => {
                        trackBuffers[track] = decodedBuffer;
                        updateStatus(`Loaded custom sample into Track ${track + 1}!`);
                    })
                    .catch(err => {
                        updateStatus(`Error decoding audio file: ${file.name}`);
                        console.error(err);
                    });
            };
            reader.readAsArrayBuffer(file);
        });
    }
}

// Event Bindings
document.getElementById('playBtn').addEventListener('click', () => {
    if (isPlaying) {
        pausePlayback();
    } else {
        startPlayback();
    }
});

document.getElementById('stopBtn').addEventListener('click', stopPlayback);

document.getElementById('bpmSlider').addEventListener('input', (e) => {
    bpm = parseInt(e.target.value);
    document.getElementById('bpmVal').textContent = `${bpm} BPM`;
});

document.getElementById('metronomeBtn').addEventListener('click', (e) => {
    isMetronomeOn = !isMetronomeOn;
    if (isMetronomeOn) {
        e.target.textContent = "🔔 Click On";
        e.target.classList.add('active-solo');
    } else {
        e.target.textContent = "🔔 Click Off";
        e.target.classList.remove('active-solo');
    }
});

document.getElementById('loopBtn').addEventListener('click', (e) => {
    isLooping = !isLooping;
    if (isLooping) {
        e.target.textContent = "🔄 Loop On";
        e.target.classList.add('active-solo');
    } else {
        e.target.textContent = "🔄 Loop Off";
        e.target.classList.remove('active-solo');
    }
});

// Setup volume, mute, solo triggers per track
document.querySelectorAll('.track-row').forEach(row => {
    const trackIdx = parseInt(row.dataset.track);
    
    // Volume slider
    const volumeSlider = row.querySelector('.track-volume');
    const volDisplay = row.querySelector('.track-vol-val');
    volumeSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        volDisplay.textContent = `${val}%`;
        trackVolumes[trackIdx] = val / 100.0;
    });

    // Mute button
    const muteBtn = row.querySelector('.btn-mute');
    muteBtn.addEventListener('click', () => {
        trackMutes[trackIdx] = !trackMutes[trackIdx];
        if (trackMutes[trackIdx]) {
            muteBtn.classList.add('active-mute');
        } else {
            muteBtn.classList.remove('active-mute');
        }
    });

    // Solo button
    const soloBtn = row.querySelector('.btn-solo');
    soloBtn.addEventListener('click', () => {
        trackSolos[trackIdx] = !trackSolos[trackIdx];
        if (trackSolos[trackIdx]) {
            soloBtn.classList.add('active-solo');
        } else {
            soloBtn.classList.remove('active-solo');
        }
    });
});

function updateStatus(msg) {
    const label = document.getElementById('statusLabel');
    if (label) label.textContent = msg;
}

// --- SONG COMPILING & WAV WRITING ---

document.getElementById('compileBtn').addEventListener('click', compileSong);

function compileSong() {
    initAudio();
    
    // Show spinner modal
    const overlay = document.getElementById('compilingOverlay');
    overlay.classList.add('active');

    // Calculate length of 16-step grid in seconds
    const stepDuration = (60.0 / bpm) / 4.0;
    const totalDuration = NUM_STEPS * stepDuration;
    const sampleRate = audioCtx.sampleRate;
    
    // Create Offline Context
    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
        2, 
        sampleRate * totalDuration, 
        sampleRate
    );

    // Re-create the layout for offline compilation
    for (let step = 0; step < NUM_STEPS; step++) {
        const time = step * stepDuration;
        
        for (let track = 0; track < NUM_TRACKS; track++) {
            if (gridState[track][step] && trackBuffers[track]) {
                // Determine offline volume
                let activeVol = trackVolumes[track];
                if (trackMutes[track]) activeVol = 0;
                
                const anySolo = trackSolos.some(s => s);
                if (anySolo && !trackSolos[track]) activeVol = 0;
                
                if (activeVol > 0) {
                    const source = offlineCtx.createBufferSource();
                    source.buffer = trackBuffers[track];
                    
                    const gain = offlineCtx.createGain();
                    gain.gain.setValueAtTime(activeVol, time);
                    
                    source.connect(gain);
                    gain.connect(offlineCtx.destination);
                    
                    source.start(time);
                }
            }
        }
    }

    // Render Offline
    offlineCtx.startRendering()
        .then(renderedBuffer => {
            // Write to WAV
            const wavBlob = audioBufferToWav(renderedBuffer);
            const downloadUrl = URL.createObjectURL(wavBlob);
            
            // Auto trigger download link
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `dragon9_sequencer_mix.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up
            overlay.classList.remove('active');
            updateStatus("Song compiled and downloaded as WAV successfully!");
        })
        .catch(err => {
            overlay.classList.remove('active');
            updateStatus("Compiling failed!");
            console.error(err);
        });
}

// WAV audio writer utility helper
function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    
    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // File length
    view.setUint32(4, length - 8, true);
    // RIFF Type
    writeString(view, 8, 'WAVE');
    // Format chunk identifier
    writeString(view, 12, 'fmt ');
    // Format chunk length (PCM)
    view.setUint32(16, 16, true);
    // Sample format (raw/uncompressed PCM)
    view.setUint16(20, 1, true);
    // Channel count
    view.setUint16(22, numOfChan, true);
    // Sample Rate
    view.setUint32(24, buffer.sampleRate, true);
    // Byte Rate (sampleRate * blockAlign)
    view.setUint32(28, buffer.sampleRate * numOfChan * 2, true);
    // Block align (channelCount * bytesPerSample)
    view.setUint16(32, numOfChan * 2, true);
    // Bits per sample
    view.setUint16(34, 16, true);
    // Data chunk identifier
    writeString(view, 36, 'data');
    // Data chunk length
    view.setUint32(40, length - 44, true);
    
    // Write interleaved audio sample channels (16-bit PCM)
    const channels = [];
    for (let i = 0; i < numOfChan; i++) {
        channels.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numOfChan; channel++) {
            const sample = Math.max(-1, Math.min(1, channels[channel][i]));
            // Clamp and convert to signed 16-bit integer
            const sample16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, sample16, true);
            offset += 2;
        }
    }
    
    return new Blob([bufferArr], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function loadLiveSyncSequences() {
    try {
        // 1. Pianola
        const pianolaSeq = JSON.parse(localStorage.getItem('d9_recorded_pianola_sequence') || '[]');
        // 2. Organ
        const organSeq = JSON.parse(localStorage.getItem('d9_recorded_organ_sequence') || '[]');
        // 3. Ukulele
        const ukeSeq = JSON.parse(localStorage.getItem('d9_recorded_ukulele_sequence') || '[]');

        const pairs = [
            { track: 4, seq: pianolaSeq },
            { track: 5, seq: organSeq },
            { track: 6, seq: ukeSeq }
        ];

        pairs.forEach(pair => {
            const { track, seq } = pair;
            for (let step = 0; step < 16; step++) {
                const blockVal = (seq[step] !== null && seq[step] !== undefined);
                gridState[track][step] = blockVal;
                
                // Highlight step block in UI
                const block = document.querySelector(`.step-block[data-track="${track}"][data-step="${step}"]`);
                if (block) {
                    if (blockVal) {
                        block.classList.add('selected');
                    } else {
                        block.classList.remove('selected');
                    }
                }
            }
        });
        updateStatus("Synced recorded instrument tracks successfully!");
    } catch (e) {
        console.error("Error loading sync tracks:", e);
    }
}

// Initialise
createGrid();
setupFileLoaders();
loadLiveSyncSequences();

// Re-sync recorded sequences whenever tab gains focus for live linking
window.addEventListener('focus', loadLiveSyncSequences);

// Trigger synthesizing default audio samples on click/interaction to satisfy browser security policies
window.addEventListener('click', () => {
    if (!trackBuffers[0]) {
        synthesizeDefaultSamples();
    }
}, { once: true });
window.addEventListener('keydown', () => {
    if (!trackBuffers[0]) {
        synthesizeDefaultSamples();
    }
}, { once: true });
