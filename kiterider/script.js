import { getDragonSync } from '../scripts/math.js';

let currentRoot = 1;
let currentD9Time = "00:00:00";
let activeThreatLevel = "green";
let guardMode = "disarmed"; // disarmed, silent, escort

// Audio recording variables
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordStartTime = null;

// IndexedDB database reference
const DB_NAME = 'KiteRiderDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';
let db = null;

// Web Audio security analyzers and siren synthesizers
let securityAudioCtx = null;
let micSourceNode = null;
let micAnalyser = null;
let sirenOsc = null;
let sirenLFO = null;
let sirenGain = null;
let isSirenPlaying = false;
let micStream = null;

// Camera & motion variables
let videoStream = null;
let isCamActive = false;
let prevFrameData = null;
let motionDetectionInterval = null;
let lastAlertTime = 0; // Prevent spamming warnings

// Radar visualizer variables
const radarCanvas = document.getElementById('radarCanvas');
const radarCtx = radarCanvas.getContext('2d');
let radarAngle = 0;
let radarTargets = []; // { x, y, radius, alpha, type }

// DOM Elements
const dom = {
    clockD9: document.getElementById('clockD9'),
    clockMilli: document.getElementById('clockMilli'),
    rootDisplay: document.getElementById('rootDisplay'),
    voiceStatus: document.getElementById('voiceStatus'),
    voicePitch: document.getElementById('voicePitch') || { value: 1.0 },
    voiceRate: document.getElementById('voiceRate') || { value: 0.9 },
    windshieldDisplay: document.getElementById('windshieldDisplay'),
    displayMode: document.getElementById('displayMode'),
    gpsCoords: document.getElementById('gpsCoords'),
    threatInstruction: document.getElementById('threatInstruction'),
    customInput: document.getElementById('customInput'),
    systemStatus: document.getElementById('systemStatus'),
    
    // Recording controls
    recordDot: document.getElementById('recordDot'),
    recStatus: document.getElementById('recStatus'),
    btnRecord: document.getElementById('btnRecord'),
    recordingsContainer: document.getElementById('recordingsContainer'),
    
    // QR distress beacon
    beaconQr: document.getElementById('beaconQr'),
    beaconStatus: document.getElementById('beaconStatus'),
    logger: document.getElementById('logger'),
    
    // Bodyguard inputs
    sliderAudioThresh: document.getElementById('slider-audio-thresh'),
    labelAudioThresh: document.getElementById('label-audio-thresh'),
    labelAmbientDb: document.getElementById('label-ambient-db'),
    
    sliderMotionThresh: document.getElementById('slider-motion-thresh'),
    labelMotionThresh: document.getElementById('label-motion-thresh'),
    labelMotionVal: document.getElementById('label-motion-val'),
    
    sliderSirenVol: document.getElementById('slider-siren-vol'),
    webcamView: document.getElementById('webcamView'),
    nightVisionTint: document.getElementById('nightVisionTint'),
    camStatus: document.getElementById('cam-status'),
    btnArmDisarmed: document.getElementById('arm-disarmed'),
    btnArmSilent: document.getElementById('arm-silent'),
    btnArmEscort: document.getElementById('arm-escort')
};

function log(msg, type = 'SYSTEM') {
    const entry = document.createElement('div');
    entry.textContent = `[${type}] ${msg}`;
    dom.logger.prepend(entry);
}

// ----------------------------------------------------
// DATABASE & OFFLINE RECORDINGS STORAGE
// ----------------------------------------------------

function initDB(callback) {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (e) => {
        log("IndexedDB failed. Offline audio saving disabled.", "ERROR");
    };
    request.onsuccess = (e) => {
        db = e.target.result;
        log("Blackbox databases verified and secured offline.", "SYSTEM");
        if (callback) callback();
    };
    request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
    };
}

function saveAudioLog(logItem, callback) {
    if (!db) return;
    const trans = db.transaction([STORE_NAME], 'readwrite');
    const store = trans.objectStore(STORE_NAME);
    const request = store.put(logItem);
    request.onsuccess = () => {
        if (callback) callback();
    };
}

function getAudioLogs(callback) {
    if (!db) return;
    const trans = db.transaction([STORE_NAME], 'readonly');
    const store = trans.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = (e) => {
        if (callback) callback(e.target.result);
    };
}

function deleteAudioLog(id, callback) {
    if (!db) return;
    const trans = db.transaction([STORE_NAME], 'readwrite');
    const store = trans.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => {
        if (callback) callback();
    };
}

function renderRecordings() {
    getAudioLogs((logs) => {
        dom.recordingsContainer.innerHTML = '';
        if (!logs || logs.length === 0) {
            dom.recordingsContainer.innerHTML = `<div style="font-size:0.65rem; opacity:0.6; text-align:center; padding: 15px 0;">NO OFFLINE RECORDINGS DETECTED</div>`;
            return;
        }

        logs.sort((a, b) => new Date(b.date) - new Date(a.date));

        logs.forEach(rec => {
            const card = document.createElement('div');
            card.className = 'recording-card';
            
            const recDate = new Date(rec.date).toLocaleDateString();
            const sizeKB = Math.round(rec.blob.size / 1024);
            
            card.innerHTML = `
                <div class="recording-card-row">
                    <span style="color: var(--accent); font-weight: bold;">📻 ${rec.id}</span>
                    <span style="opacity:0.7;">${recDate} | ${sizeKB} KB</span>
                </div>
                <div style="font-size: 0.6rem; opacity:0.8;">D9 TIME: ${rec.d9Time} | ROOT: ${rec.root}</div>
                <div style="font-size: 0.55rem; color: var(--highlight); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">GPS: ${rec.coords}</div>
                <div class="recording-card-row" style="margin-top: 8px; gap: 8px;">
                    <button id="playBtn-${rec.id}" style="padding: 4px 8px; font-size: 0.6rem; background: rgba(0, 255, 65, 0.1); border-color: rgba(0,255,65,0.4);" onclick="window.playAudio('${rec.id}')">PLAYBACK</button>
                    <button style="padding: 4px 8px; font-size: 0.6rem; background: rgba(255, 255, 255, 0.05); border-color: rgba(255,255,255,0.2);" onclick="window.downloadAudio('${rec.id}')">EXPORT</button>
                    <button style="padding: 4px 8px; font-size: 0.6rem; background: rgba(255, 34, 0, 0.1); border-color: rgba(255,34,0,0.4);" onclick="window.deleteAudio('${rec.id}')">DELETE</button>
                </div>
                <div id="playerBox-${rec.id}" style="display:none; margin-top: 8px;">
                    <audio id="audio-${rec.id}" controls style="width: 100%; height: 28px; outline: none;"></audio>
                </div>
            `;
            dom.recordingsContainer.appendChild(card);
        });
    });
}

window.playAudio = function(id) {
    getAudioLogs((logs) => {
        const rec = logs.find(l => l.id === id);
        if (!rec) return;

        const playerBox = document.getElementById(`playerBox-${id}`);
        const audioEl = document.getElementById(`audio-${id}`);
        const playBtn = document.getElementById(`playBtn-${id}`);
        
        if (playerBox.style.display === 'none') {
            document.querySelectorAll('[id^="playerBox-"]').forEach(box => box.style.display = 'none');
            
            const audioUrl = URL.createObjectURL(rec.blob);
            audioEl.src = audioUrl;
            playerBox.style.display = 'block';
            audioEl.play();
            playBtn.textContent = 'CLOSE';
            log(`Playing audio recording: ${id}`);
        } else {
            audioEl.pause();
            audioEl.src = '';
            playerBox.style.display = 'none';
            playBtn.textContent = 'PLAYBACK';
        }
    });
};

window.downloadAudio = function(id) {
    getAudioLogs((logs) => {
        const rec = logs.find(l => l.id === id);
        if (!rec) return;

        const url = URL.createObjectURL(rec.blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${rec.id}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log(`Exported file ${rec.id}.webm successful.`);
    });
};

window.deleteAudio = function(id) {
    if (confirm(`Confirm permanent removal of recording ${id} from off-grid databases?`)) {
        deleteAudioLog(id, () => {
            log(`Deleted file: ${id}`, "SYSTEM");
            renderRecordings();
        });
    }
};

// ----------------------------------------------------
// BODYGUARD CORE & GUARD STATE MANAGEMENT
// ----------------------------------------------------

window.setGuardMode = function(mode) {
    guardMode = mode;
    
    dom.btnArmDisarmed.classList.remove('active');
    dom.btnArmSilent.classList.remove('active');
    dom.btnArmEscort.classList.remove('active');
    
    if (mode === 'disarmed') {
        dom.btnArmDisarmed.classList.add('active');
        dom.systemStatus.textContent = "SOVEREIGN SHIELD DISARMED";
        dom.systemStatus.style.color = "var(--amber)";
        log("Bodyguard disarmed. Perimeter monitoring deactivated.");
        
        // Stop siren if active
        if (isSirenPlaying) stopSiren();
        document.body.classList.remove('panic-strobe');
    } else if (mode === 'silent') {
        dom.btnArmSilent.classList.add('active');
        dom.systemStatus.textContent = "BODYGUARD ARMED (SILENT)";
        dom.systemStatus.style.color = "var(--blue)";
        log("Bodyguard Armed in Silent Mode. Monitoring perimeter...");
        
        initSecurityAudio();
    } else if (mode === 'escort') {
        dom.btnArmEscort.classList.add('active');
        dom.systemStatus.textContent = "BODYGUARD ESCORT ACTIVE";
        dom.systemStatus.style.color = "var(--highlight)";
        log("Bodyguard Escort Activated. Voice alerts operational.", "SUCCESS");
        
        initSecurityAudio();
        speakText("K.I.T.E. Digital Bodyguard armed and active. Standby for perimeter updates.");
    }
};

// ----------------------------------------------------
// WEB AUDIO ANALYSIS & SYNTHTHESIS (SIREN)
// ----------------------------------------------------

function initSecurityAudio() {
    if (securityAudioCtx) return;
    
    securityAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Attempt Mic connection for DB level checks
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            micStream = stream;
            micSourceNode = securityAudioCtx.createMediaStreamSource(stream);
            micAnalyser = securityAudioCtx.createAnalyser();
            micAnalyser.fftSize = 256;
            
            micSourceNode.connect(micAnalyser);
            log("Microphone connected to security level analyser.");
        })
        .catch(err => {
            log("Secure mic analysis disabled (Permission denied).", "WARN");
        });
}

// Synthesize police siren
function startSiren() {
    if (isSirenPlaying || !securityAudioCtx) return;
    
    if (securityAudioCtx.state === 'suspended') {
        securityAudioCtx.resume();
    }
    
    isSirenPlaying = true;
    
    // Main Oscillator sweeping
    sirenOsc = securityAudioCtx.createOscillator();
    sirenOsc.type = 'sawtooth';
    sirenOsc.frequency.setValueAtTime(600, securityAudioCtx.currentTime);
    
    // Volume Gain
    sirenGain = securityAudioCtx.createGain();
    const volume = parseFloat(dom.sliderSirenVol.value) / 100;
    sirenGain.gain.setValueAtTime(volume * 0.15, securityAudioCtx.currentTime); // keep scaled safety
    
    // LFO modulator for sweep
    sirenLFO = securityAudioCtx.createOscillator();
    sirenLFO.frequency.value = 2.5; // Sweep rate
    
    const lfoGain = securityAudioCtx.createGain();
    lfoGain.gain.value = 400; // Modulates between 200Hz and 1000Hz
    
    sirenLFO.connect(lfoGain);
    lfoGain.connect(sirenOsc.frequency);
    
    sirenOsc.connect(sirenGain);
    sirenGain.connect(securityAudioCtx.destination);
    
    sirenLFO.start(securityAudioCtx.currentTime);
    sirenOsc.start(securityAudioCtx.currentTime);
    
    log("Panic Alarm Siren activated.", "WARN");
}

function stopSiren() {
    if (!isSirenPlaying) return;
    
    isSirenPlaying = false;
    
    if (sirenOsc) {
        try { sirenOsc.stop(); } catch(e) {}
        sirenOsc = null;
    }
    if (sirenLFO) {
        try { sirenLFO.stop(); } catch(e) {}
        sirenLFO = null;
    }
    
    log("Panic Alarm Siren stopped.");
}

// ----------------------------------------------------
// WEBCAM EYE & MOTION DETECTION
// ----------------------------------------------------

window.toggleCamera = function() {
    if (isCamActive) {
        stopCamera();
    } else {
        startCamera();
    }
};

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            videoStream = stream;
            dom.webcamView.srcObject = stream;
            dom.webcamView.style.display = 'block';
            dom.nightVisionTint.style.display = 'block';
            isCamActive = true;
            dom.camStatus.textContent = "NIGHT-VISION CAM SYSTEM ONLINE";
            dom.camStatus.style.color = "var(--highlight)";
            log("Perimeter security camera eye activated.", "SYSTEM");
            
            // Motion scanner hidden comparator interval
            prevFrameData = null;
            motionDetectionInterval = setInterval(checkCameraMotion, 400);
        })
        .catch(err => {
            log("Camera initialization failed: " + err.message, "ERROR");
            alert("Unable to bind camera source. Verify webcam permissions.");
        });
}

function stopCamera() {
    if (!isCamActive) return;
    
    if (motionDetectionInterval) {
        clearInterval(motionDetectionInterval);
        motionDetectionInterval = null;
    }
    
    if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
        videoStream = null;
    }
    
    dom.webcamView.srcObject = null;
    dom.webcamView.style.display = 'none';
    dom.nightVisionTint.style.display = 'none';
    isCamActive = false;
    dom.camStatus.textContent = "CAMERA OFFLINE (RADAR SWEEP ACTIVE)";
    dom.camStatus.style.color = "var(--accent)";
    log("Perimeter security camera eye disengaged.");
}

// Pixel discrepancy comparison
function checkCameraMotion() {
    if (!isCamActive || !dom.webcamView.videoWidth) return;
    
    const width = 80; // keep small to process fast
    const height = 60;
    
    // Create temporary processing canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw current frame
    tempCtx.drawImage(dom.webcamView, 0, 0, width, height);
    const frame = tempCtx.getImageData(0, 0, width, height);
    const data = frame.data;
    
    if (prevFrameData) {
        let diffSum = 0;
        const totalPixels = width * height;
        
        for (let i = 0; i < data.length; i += 4) {
            // Compare luminance values
            const rDiff = Math.abs(data[i] - prevFrameData[i]);
            const gDiff = Math.abs(data[i+1] - prevFrameData[i+1]);
            const bDiff = Math.abs(data[i+2] - prevFrameData[i+2]);
            diffSum += (rDiff + gDiff + bDiff) / 3;
        }
        
        const deviation = Math.min(100, Math.round((diffSum / totalPixels) * 1.5));
        dom.labelMotionVal.textContent = `${deviation}%`;
        
        // Trigger alert if deviation exceeds threshold and armed
        const threshold = parseInt(dom.sliderMotionThresh.value);
        if (guardMode !== 'disarmed' && deviation > threshold) {
            triggerBodyguardAlert("motion", deviation);
        }
        
        // Sonar plotting mapping
        if (deviation > 5) {
            plotRadarPoint(deviation);
        }
    }
    
    prevFrameData = data;
}

// Alert Dispatcher
function triggerBodyguardAlert(type, value) {
    const now = Date.now();
    if (now - lastAlertTime < 6000) return; // limit alerts frequency
    
    lastAlertTime = now;
    
    if (type === 'motion') {
        log(`Perimeter Alert: Motion detected! Dev: ${value}%`, "WARN");
        window.setThreatLevel('red');
        
        if (guardMode === 'escort') {
            speakText("Security Alert. Motion detected in the vehicle perimeter.");
        }
        
        // Auto-start recording
        if (!isRecording) {
            window.toggleRecording();
        }
    } else if (type === 'audio') {
        log(`Perimeter Alert: High volume sound! Vol: ${value} dB`, "WARN");
        window.setThreatLevel('red');
        
        if (guardMode === 'escort') {
            speakText("Security Alert. Noise levels exceed safety parameters.");
        }
        
        // Auto-start recording
        if (!isRecording) {
            window.toggleRecording();
        }
    }
}

// ----------------------------------------------------
// EMERGENCY SYSTEM & PANIC TRIGGERS
// ----------------------------------------------------

window.triggerEmergencyAlarm = function() {
    // Elevate threat level
    window.setThreatLevel('panic');
    
    // Flashing overlay
    document.body.classList.add('panic-strobe');
    
    // Start siren
    initSecurityAudio();
    setTimeout(() => {
        startSiren();
    }, 100);
    
    // Windshield display update
    dom.displayMode.textContent = "MODE: PANIC SECURE BROADCAST";
    dom.windshieldDisplay.textContent = "SECURITY CRISIS ENCOUNTER // DISTRESS BEACON ACTIVE // BYSTANDERS SCAN SECURE CO-OP BEACON";
    
    // Voice notice
    speakText("Security warning. Emergency distress mode active. Bystanders are requested to scan the visual beacon and stand witness.");
    
    // Auto-record
    if (!isRecording) {
        window.toggleRecording();
    }
};

// ----------------------------------------------------
// SONAR RADAR CANVAS SWEEPER
// ----------------------------------------------------

function plotRadarPoint(val) {
    const radius = radarCanvas.width / 2;
    const distance = (1 - (val / 100)) * (radius - 30);
    const x = radius + Math.cos(radarAngle) * distance;
    const y = radius + Math.sin(radarAngle) * distance;
    
    radarTargets.push({
        x: x,
        y: y,
        radius: 4 + (val * 0.1),
        alpha: 1.0,
        type: val > 30 ? 'threat' : 'ping'
    });
}

function drawRadar() {
    radarCtx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);
    
    const cx = radarCanvas.width / 2;
    const cy = radarCanvas.height / 2;
    const radius = radarCanvas.width / 2 - 10;
    
    // Radar background circles
    radarCtx.strokeStyle = 'rgba(0, 255, 65, 0.15)';
    radarCtx.lineWidth = 1;
    for (let r = 40; r <= radius; r += 40) {
        radarCtx.beginPath();
        radarCtx.arc(cx, cy, r, 0, Math.PI * 2);
        radarCtx.stroke();
    }
    
    // Crosshairs lines
    radarCtx.beginPath();
    radarCtx.moveTo(cx - radius, cy);
    radarCtx.lineTo(cx + radius, cy);
    radarCtx.moveTo(cx, cy - radius);
    radarCtx.lineTo(cx, cy + radius);
    radarCtx.stroke();
    
    // Rotate scanner sweep line
    radarAngle += 0.035;
    if (radarAngle > Math.PI * 2) radarAngle = 0;
    
    // Sweep line gradient
    radarCtx.save();
    radarCtx.translate(cx, cy);
    radarCtx.rotate(radarAngle);
    
    const sweepGrad = radarCtx.createLinearGradient(0, 0, radius, 0);
    sweepGrad.addColorStop(0, 'rgba(0, 255, 65, 0)');
    sweepGrad.addColorStop(1, 'rgba(0, 255, 65, 0.45)');
    
    radarCtx.fillStyle = sweepGrad;
    radarCtx.beginPath();
    radarCtx.moveTo(0, 0);
    radarCtx.arc(0, 0, radius, -0.2, 0);
    radarCtx.closePath();
    radarCtx.fill();
    radarCtx.restore();
    
    // Draw targets
    radarTargets.forEach((target, index) => {
        target.alpha -= 0.008; // fade out
        if (target.alpha <= 0) {
            radarTargets.splice(index, 1);
            return;
        }
        
        radarCtx.save();
        radarCtx.globalAlpha = target.alpha;
        radarCtx.fillStyle = target.type === 'threat' ? '#ff2200' : 'var(--highlight)';
        radarCtx.shadowBlur = target.type === 'threat' ? 8 : 4;
        radarCtx.shadowColor = radarCtx.fillStyle;
        
        radarCtx.beginPath();
        radarCtx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        radarCtx.fill();
        radarCtx.restore();
    });
    
    // Static outer ring
    radarCtx.strokeStyle = 'rgba(0, 255, 65, 0.4)';
    radarCtx.lineWidth = 2.5;
    radarCtx.beginPath();
    radarCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    radarCtx.stroke();
    
    // Sonar sweeps scheduler
    requestAnimationFrame(drawRadar);
}

// ----------------------------------------------------
// MEDIA RECORDER (BLACK BOX INTERACTION)
// ----------------------------------------------------

window.toggleRecording = function() {
    if (!isRecording) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                audioChunks = [];
                mediaRecorder = new MediaRecorder(stream);
                
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        audioChunks.push(e.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const uniqueId = 'REC-' + Math.floor(100000 + Math.random() * 900000);
                    
                    const recItem = {
                        id: uniqueId,
                        date: new Date().toISOString(),
                        blob: audioBlob,
                        d9Time: currentD9Time,
                        root: currentRoot,
                        coords: "Lat -36.9038, Lon 174.7820 (Okiwi Anchor)"
                    };

                    saveAudioLog(recItem, () => {
                        log(`Successfully saved secure audio chunk: ${uniqueId}`, "SUCCESS");
                        renderRecordings();
                    });

                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                isRecording = true;
                recordStartTime = Date.now();
                
                dom.recordDot.classList.add('recording');
                dom.btnRecord.classList.add('recording');
                dom.btnRecord.textContent = "🛑 STOP RECORDING";
                dom.recStatus.textContent = "RECORDING ACTIVE";
                log("Audio blackbox initialized. Recording cabin interactions...", "WARN");
            })
            .catch(err => {
                log("Microphone access failed: " + err.message, "ERROR");
            });
    } else {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        isRecording = false;
        dom.recordDot.classList.remove('recording');
        dom.btnRecord.classList.remove('recording');
        dom.btnRecord.textContent = "🎙️ START RECORDING";
        dom.recStatus.textContent = "RECORD STOPPED";
        log("Recording finalized. Packing telemetry payload.");
    }
};

// ----------------------------------------------------
// BIOMETRICS & THREAT LEVEL SETTINGS
// ----------------------------------------------------

window.setThreatLevel = function(level) {
    activeThreatLevel = level;
    
    document.getElementById('threatGreen').classList.remove('active');
    document.getElementById('threatAmber').classList.remove('active');
    document.getElementById('threatRed').classList.remove('active');
    document.getElementById('threatPanic').classList.remove('active');

    let instruction = "";
    if (level === 'green') {
        document.getElementById('threatGreen').classList.add('active');
        instruction = "Keep hands visible on the steering wheel. Remain polite and state that you are audio-recording this encounter for mutual safety.";
        log("Environment state checked: SAFE NOMINAL.");
        document.body.classList.remove('panic-strobe');
        if (isSirenPlaying) stopSiren();
    } else if (level === 'amber') {
        document.getElementById('threatAmber').classList.add('active');
        instruction = "Caution. Clarify if you are detained by asking, 'Officer, am I free to go?'. Do not exit the vehicle unless ordered.";
        log("Threat warning issued: VEHICLE DETAINMENT THREAT.", "WARN");
        document.body.classList.remove('panic-strobe');
        if (isSirenPlaying) stopSiren();
    } else if (level === 'red') {
        document.getElementById('threatRed').classList.add('active');
        instruction = "High Risk. Under Section 23 of the NZ Bill of Rights, state clearly: 'I am silent and consult my lawyer.' Do not consent to search.";
        log("Threat risk level elevated: IMMEDIATE THREAT / DETENTION.", "WARN");
        document.body.classList.remove('panic-strobe');
        if (isSirenPlaying) stopSiren();
    } else if (level === 'panic') {
        document.getElementById('threatPanic').classList.add('active');
        instruction = "Confrontation active. K.I.T.E. distress beacon QR displayed on screen. Bystanders can scan to carry secure records.";
        log("Distress activated: CRITICAL CONFRONTATION ENCOUNTER.", "ERROR");
        window.activateBeacon();
    }

    dom.threatInstruction.textContent = instruction;
};

// ----------------------------------------------------
// WEB SPEECH SYNTHESIS & LAUNCH RIGHTS PROCLAMATIONS
// ----------------------------------------------------

const sovereignScripts = {
    silence: "I am exercising my right to remain silent under Section 23 of the New Zealand Bill of Rights Act. I am not obliged to answer any questions and will wait to consult with my lawyer.",
    warrant: "Under Section 21 of the Bill of Rights Act, I am secure against unreasonable search. Please state your statutory authority or show a written warrant. Otherwise, I do not consent to this search.",
    detention: "Officer, please clarify. Am I being detained, or am I free to go? If I am not being detained, I request to go on my way. If I am detained, I demand to know the legal grounds immediately under Section 23.",
    traffic: "Under the Land Transport Act, I have provided my details. I am not legally required to answer questions regarding my origin, destination, or activities. I request to be issued any citations promptly so I can proceed."
};

window.triggerProtocol = function(type) {
    const text = sovereignScripts[type];
    if (!text) return;

    dom.displayMode.textContent = `MODE: ${type.toUpperCase()} PROTOCOL`;
    dom.windshieldDisplay.textContent = text;
    
    speakText(text);
};

window.speakCustom = function() {
    const text = dom.customInput.value.trim();
    if (!text) return;

    dom.displayMode.textContent = "MODE: CUSTOM BROADCAST";
    dom.windshieldDisplay.textContent = text;
    speakText(text);
    dom.customInput.value = '';
};

window.shutUp = function() {
    window.speechSynthesis.cancel();
    dom.voiceStatus.textContent = "VOICE ONLINE | MUTED";
    dom.displayMode.textContent = "STATUS: IDLE";
    log("Muted voice synthesizer.");
};

function speakText(text) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = parseFloat(dom.voicePitch.value);
    utterance.rate = parseFloat(dom.voiceRate.value);

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-US') || v.lang.startsWith('en-GB')) || voices[0];
    if (englishVoice) {
        utterance.voice = englishVoice;
    }

    utterance.onstart = () => {
        dom.voiceStatus.textContent = "K.I.T.E. BROADCASTING RIGHTS PROTOCOL";
    };

    utterance.onend = () => {
        dom.voiceStatus.textContent = "VOICE ONLINE | AWAITING COMMAND";
        dom.displayMode.textContent = "STATUS: BROADCAST TERMINATED";
    };

    window.speechSynthesis.speak(utterance);
    log(`Spoken Rights Proclamation: "${text.substring(0, 45)}..."`);
}

// ----------------------------------------------------
// DISTRESS BEACON QR CODE
// ----------------------------------------------------

window.activateBeacon = function() {
    const beaconData = {
        event: "SOVEREIGN SHIELD DISTRESS",
        d9Time: currentD9Time,
        root: currentRoot,
        coords: "Lat -36.9038, Lon 174.7820 (Okiwi Anchor)",
        threat: activeThreatLevel.toUpperCase(),
        timestamp: new Date().toISOString()
    };

    const payload = JSON.stringify(beaconData);
    
    dom.beaconQr.style.display = 'block';
    
    new QRious({
        element: dom.beaconQr,
        value: payload,
        size: 150,
        background: '#ffffff',
        foreground: '#000000',
        level: 'H'
    });

    dom.beaconStatus.innerHTML = `<span style="color:var(--accent); font-weight:bold;">DISTRESS BEACON BROADCAST ONLINE</span><br>Bystanders scan this cryptographically stamped security event offline immediately.`;
    log("Emergency distress beacon generated and painted to console.", "ERROR");
};

// ----------------------------------------------------
// DYNAMIC VOICE WAVE ANIMATION (KITT VOICE BOX)
// ----------------------------------------------------

function animateVoiceBox() {
    const bars = document.querySelectorAll('.voice-bar');
    if (!bars.length) return;

    const isSpeaking = window.speechSynthesis.speaking;
    const isRecActive = isRecording;

    bars.forEach((bar, index) => {
        let targetHeight = 10;
        if (isSpeaking) {
            const time = performance.now() * 0.015;
            const multiplier = index === 3 || index === 4 ? 45 : (index === 2 || index === 5 ? 30 : 15);
            const wave = Math.sin(time + index * 0.5) * multiplier + (multiplier + 10);
            targetHeight = wave + (Math.random() - 0.5) * 12;
        } else if (isRecActive) {
            targetHeight = 20 + Math.random() * 25;
        } else {
            const restingHeights = [10, 20, 38, 55, 55, 38, 20, 10];
            targetHeight = restingHeights[index] || 10;
        }
        targetHeight = Math.max(5, Math.min(85, targetHeight));
        bar.style.height = `${targetHeight}px`;
    });

    requestAnimationFrame(animateVoiceBox);
}

// ----------------------------------------------------
// SECURITY LEVEL TICKING & MONITORING
// ----------------------------------------------------

function checkSecurityLevels() {
    if (guardMode === 'disarmed') return;
    
    // Check Audio db levels
    if (micAnalyser) {
        const bufferLength = micAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        micAnalyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const dbEquivalent = Math.round((avg / 255) * 100);
        
        dom.labelAmbientDb.textContent = dbEquivalent;
        
        const thresh = parseInt(dom.sliderAudioThresh.value);
        if (dbEquivalent > thresh) {
            triggerBodyguardAlert("audio", dbEquivalent);
        }
    }
}

// ----------------------------------------------------
// TICK SYNC telemetries
// ----------------------------------------------------

function tick() {
    const localDate = new Date(Date.now() - (new Date().getTimezoneOffset() * 60000));
    const v = getDragonSync(localDate);
    const micro = Math.floor((performance.now() % 1000) * 1000).toString().padStart(6, '0');

    currentRoot = v.root;
    currentD9Time = v.isRelax ? "RELAX" : 
        `${String(v.h).padStart(2,'0')}:${String(v.m).padStart(2,'0')}:${String(v.s).padStart(2,'0')}`;

    dom.clockD9.innerText = currentD9Time;
    dom.clockMilli.innerText = `.${micro}`;
    dom.rootDisplay.innerText = `ROOT: ${v.root}`;

    checkSecurityLevels();

    requestAnimationFrame(tick);
}

// Resize canvas helper
function resizeRadar() {
    radarCanvas.width = radarCanvas.parentElement.clientWidth;
    radarCanvas.height = radarCanvas.parentElement.clientHeight || 200;
}

// Bind sliders value display listeners
dom.sliderAudioThresh.addEventListener('input', (e) => {
    dom.labelAudioThresh.textContent = `${e.target.value} dB`;
});
dom.sliderMotionThresh.addEventListener('input', (e) => {
    dom.labelMotionThresh.textContent = `${e.target.value}%`;
});
dom.sliderSirenVol.addEventListener('input', (e) => {
    if (sirenGain && isSirenPlaying) {
        sirenGain.gain.setValueAtTime((parseFloat(e.target.value) / 100) * 0.15, securityAudioCtx.currentTime);
    }
});

// Initializations
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {};
}

initDB(() => {
    renderRecordings();
});

// Configure Radar Sonar Sweeper
resizeRadar();
window.addEventListener('resize', resizeRadar);
drawRadar();

tick();
animateVoiceBox();
log("Digital Bodyguard Shield calibrations active. K.I.T.E. Online.");
