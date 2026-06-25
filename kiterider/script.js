import { getDragonSync } from '../scripts/math.js';

let currentRoot = 1;
let currentD9Time = "00:00:00";
let activeThreatLevel = "green";

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

const dom = {
    clockD9: document.getElementById('clockD9'),
    clockMilli: document.getElementById('clockMilli'),
    rootDisplay: document.getElementById('rootDisplay'),
    voiceStatus: document.getElementById('voiceStatus'),
    voicePitch: document.getElementById('voicePitch'),
    voiceRate: document.getElementById('voiceRate'),
    windshieldDisplay: document.getElementById('windshieldDisplay'),
    displayMode: document.getElementById('displayMode'),
    gpsCoords: document.getElementById('gpsCoords'),
    threatInstruction: document.getElementById('threatInstruction'),
    customInput: document.getElementById('customInput'),
    
    // Recording controls
    recordDot: document.getElementById('recordDot'),
    recStatus: document.getElementById('recStatus'),
    btnRecord: document.getElementById('btnRecord'),
    recordingsContainer: document.getElementById('recordingsContainer'),
    
    // QR distress beacon
    beaconQr: document.getElementById('beaconQr'),
    beaconStatus: document.getElementById('beaconStatus'),
    logger: document.getElementById('logger')
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

// Render historical recording ledger
function renderRecordings() {
    getAudioLogs((logs) => {
        dom.recordingsContainer.innerHTML = '';
        if (!logs || logs.length === 0) {
            dom.recordingsContainer.innerHTML = `<div style="font-size:0.65rem; opacity:0.6; text-align:center; padding: 15px 0;">NO OFFLINE RECORDINGS DETECTED</div>`;
            return;
        }

        // Sort descending by date
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

// Play recording
window.playAudio = function(id) {
    getAudioLogs((logs) => {
        const rec = logs.find(l => l.id === id);
        if (!rec) return;

        const playerBox = document.getElementById(`playerBox-${id}`);
        const audioEl = document.getElementById(`audio-${id}`);
        const playBtn = document.getElementById(`playBtn-${id}`);
        
        if (playerBox.style.display === 'none') {
            // Hide any other active playboxes to conserve screen space
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

// Download audio export
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
// MEDIA RECORDER (BLACK BOX INTERACTION)
// ----------------------------------------------------

window.toggleRecording = function() {
    if (!isRecording) {
        // Start Microphone capture
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

                    // Stop all tracks in the stream to release microphone block
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
                alert("Could not access microphone. Ensure permissions are granted for off-grid logs.");
            });
    } else {
        // Stop recording
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
// BIOMETRICS & THREAT CONTROLS
// ----------------------------------------------------

window.setThreatLevel = function(level) {
    activeThreatLevel = level;
    
    // Toggle active classes in nodes
    document.getElementById('threatGreen').classList.remove('active');
    document.getElementById('threatAmber').classList.remove('active');
    document.getElementById('threatRed').classList.remove('active');
    document.getElementById('threatPanic').classList.remove('active');

    let instruction = "";
    if (level === 'green') {
        document.getElementById('threatGreen').classList.add('active');
        instruction = "Keep hands visible on the steering wheel. Remain polite and state that you are audio-recording this encounter for mutual safety.";
        log("Environment state checked: SAFE NOMINAL.");
    } else if (level === 'amber') {
        document.getElementById('threatAmber').classList.add('active');
        instruction = "Caution. Clarify if you are detained by asking, 'Officer, am I free to go?'. Do not exit the vehicle unless ordered.";
        log("Threat warning issued: VEHICLE DETAINMENT THREAT.", "WARN");
    } else if (level === 'red') {
        document.getElementById('threatRed').classList.add('active');
        instruction = "High Risk. Under Section 23 of the NZ Bill of Rights, state clearly: 'I am silent and consult my lawyer.' Do not consent to search.";
        log("Threat risk level elevated: IMMEDIATE THREAT / DETENTION.", "WARN");
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
    // Cancel any current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set customized pitch and rate parameters
    utterance.pitch = parseFloat(dom.voicePitch.value);
    utterance.rate = parseFloat(dom.voiceRate.value);

    // Look for an English voice with a mechanical/authoritative voice
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
            // Pulse waveform when speaking
            const time = performance.now() * 0.015;
            // Center bars higher than edges
            const multiplier = index === 3 || index === 4 ? 45 : (index === 2 || index === 5 ? 30 : 15);
            const wave = Math.sin(time + index * 0.5) * multiplier + (multiplier + 10);
            targetHeight = wave + (Math.random() - 0.5) * 12;
        } else if (isRecActive) {
            // Green microphone input emulation jitter
            targetHeight = 20 + Math.random() * 25;
        } else {
            // Default Knight Rider resting voice signature bars
            const restingHeights = [10, 20, 38, 55, 55, 38, 20, 10];
            targetHeight = restingHeights[index] || 10;
        }
        targetHeight = Math.max(5, Math.min(85, targetHeight));
        bar.style.height = `${targetHeight}px`;
    });

    requestAnimationFrame(animateVoiceBox);
}

// ----------------------------------------------------
// TICK SYNC telemetries
// ----------------------------------------------------

function tick() {
    const now = new Date();
    const v = getDragonSync(now);
    const micro = Math.floor((performance.now() % 1000) * 1000).toString().padStart(6, '0');

    currentRoot = v.root;
    currentD9Time = v.isRelax ? "RELAX" : 
        `${String(v.h).padStart(2,'0')}:${String(v.m).padStart(2,'0')}:${String(v.s).padStart(2,'0')}`;

    dom.clockD9.innerText = currentD9Time;
    dom.clockMilli.innerText = `.${micro}`;
    dom.rootDisplay.innerText = `ROOT: ${v.root}`;

    requestAnimationFrame(tick);
}

// ----------------------------------------------------
// INITIALIZE APPLICATION
// ----------------------------------------------------

// Wait for speech synthesis voices to populate
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {};
}

initDB(() => {
    renderRecordings();
});

tick();
animateVoiceBox();
log("Shield dashboard diagnostic calibrations complete. K.I.T.E. Online.");
