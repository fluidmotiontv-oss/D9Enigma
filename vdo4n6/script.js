import { getDragonSync } from '../scripts/math.js';
import { countryNodes } from '../scripts/data.js';

// --- SYSTEM STATE & INITIAL DATABASE ---
const defaultEvents = [
    {
        id: 'evt_01',
        title: 'Portal Core Initial Sync',
        timestamp: new Date('2026-06-18T12:00:00'),
        layer: 'primary',
        desc: 'System baseline locked. Master host primary_portal_engine registered all local clock buffers.',
        device: 'primary_portal_engine',
        tag: 'SYSTEM',
        gps: '-41.2865, 174.7762 (Wellington)',
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        mood: 'Reflective',
        parentEventId: null
    },
    {
        id: 'evt_02',
        title: 'Fiordland Deep Sounding Scan',
        timestamp: new Date('2026-06-18T18:30:00'),
        layer: 'primary',
        desc: 'Acoustic resonance probe detected oceanic Precambrian structures at Fiordland offset Node.',
        device: 'hydro-sonic-04',
        tag: 'SOUNDING',
        gps: '-45.4144, 167.7181 (Fiordland)',
        hash: 'ab536e2f18f1a28a38a7c2e36b85ef37a28b49520a221f1d1b01c1ab08f47648',
        mood: 'Calm',
        parentEventId: 'evt_01'
    },
    {
        id: 'evt_03',
        title: 'What-If: Wellington Rest Offset Drift',
        timestamp: new Date('2026-06-18T23:55:00'),
        layer: 'creative',
        desc: 'Branching timeline: Simulating effect on local creation hubs if Wellington midday relax period drifted by +6 minutes.',
        device: 'sovereign_mind_emulator',
        tag: 'EMULATION',
        gps: '-41.2865, 174.7762 (Wellington)',
        hash: 'bf82f4d1c68f18d0999c0ac08a95f9c4ea82110c1c1ab08a9a838ca5d72f16ef',
        mood: 'Creative',
        parentEventId: 'evt_02'
    },
    {
        id: 'evt_04',
        title: 'Auckland Fabric Coupled',
        timestamp: new Date('2026-06-19T01:10:00'),
        layer: 'primary',
        desc: 'Sovereign Node Auckland connected. Broadcast handshake registered on Triad Link.',
        device: 'node_01_auckland',
        tag: 'FABRIC',
        gps: '-36.8485, 174.7633 (Auckland)',
        hash: 'd482c1aca953e5bc1aca9538b18b4aa73547025116663d3c0aca28f476482940',
        mood: 'Reflective',
        parentEventId: 'evt_02'
    },
    {
        id: 'evt_05',
        title: 'What-If: Sovereign Rest Hubs Split',
        timestamp: new Date('2026-06-19T01:25:00'),
        layer: 'creative',
        desc: 'Branching timeline: Auckland nodes decouple from master sync and run local isolated consensus fabric.',
        device: 'sovereign_mind_emulator',
        tag: 'IMAGINATION',
        gps: '-36.8485, 174.7633 (Auckland)',
        hash: 'ea82f091f090b83cc61a0baf5074ad2b01c1ab024da9a18b4aa7354702511666',
        mood: 'Chaotic',
        parentEventId: 'evt_04'
    },
    {
        id: 'user_vid_01',
        title: 'Untitled - Sequence 01',
        timestamp: new Date('2026-06-20T12:00:00'),
        layer: 'creative',
        desc: 'Adobe Rush project timeline sequence 01. Decoded stream from local video path.',
        device: 'Oppo DCIM Rush',
        tag: 'TIMELINE',
        gps: '-36.8485, 174.7633 (Auckland)',
        hash: '9a8d9b8972e36b85ef37a28b49520a221f1d1b01c1ab08f476482940827da421',
        mood: 'Chaotic',
        videoUrl: '../assets/video/Untitled - Sequence 01.mp4',
        parentEventId: 'evt_05'
    },
    {
        id: 'user_vid_02',
        title: 'Untitled - Sequence 01 1',
        timestamp: new Date('2026-06-20T12:15:00'),
        layer: 'creative',
        desc: 'Adobe Rush project timeline sequence 01 copy 1. Fragmented frames reconstructed.',
        device: 'Oppo DCIM Rush',
        tag: 'FRAGMENT',
        gps: '-36.8485, 174.7633 (Auckland)',
        hash: 'ea82d091f090b83cc61a0baf5074ad2bbf82d1c68f18d0999c0ac08a95f9c4ea',
        mood: 'Calm',
        videoUrl: '../assets/video/Untitled - Sequence 01 1.mp4',
        parentEventId: 'user_vid_01'
    },
    {
        id: 'user_vid_03',
        title: 'Untitled - Sequence 01 2',
        timestamp: new Date('2026-06-20T12:30:00'),
        layer: 'creative',
        desc: 'Adobe Rush project timeline sequence 01 copy 2. Parallax tracking calibration complete.',
        device: 'Oppo DCIM Rush',
        tag: 'CALIBRATION',
        gps: '-36.8485, 174.7633 (Auckland)',
        hash: '7c2e36b85ef37a28b49520a221f1d1b01c1ab08f47648bf82d1c68f18d0999c0',
        mood: 'Reflective',
        videoUrl: '../assets/video/Untitled - Sequence 01 2.mp4',
        parentEventId: 'user_vid_02'
    },
    {
        id: 'user_vid_04',
        title: 'Untitled - Sequence 01 3',
        timestamp: new Date('2026-06-20T12:45:00'),
        layer: 'creative',
        desc: 'Adobe Rush project timeline sequence 01 copy 3. Volumetric color balancing applied.',
        device: 'Oppo DCIM Rush',
        tag: 'VOLUMETRIC',
        gps: '-36.8485, 174.7633 (Auckland)',
        hash: 'ab536e2f18f1a28a38a7c2e36b85ef37c982ef0411ab1889b4f9810acb7762a4',
        mood: 'Energetic',
        videoUrl: '../assets/video/Untitled - Sequence 01 3.mp4',
        parentEventId: 'user_vid_03'
    },
    {
        id: 'user_vid_05',
        title: 'FilmForth Untitled Capture',
        timestamp: new Date('2026-06-20T13:00:00'),
        layer: 'primary',
        desc: 'Standalone FilmForth timeline assembly. Decoded spatial grid audio/video channels.',
        device: 'FilmForth Transceiver',
        tag: 'FORENSIC',
        gps: '-41.2865, 174.7762 (Wellington)',
        hash: 'c982ef0411ab1889b4f9810acb7762a4dfb39c1482de9f018a38a7c2e36b85ef',
        mood: 'Creative',
        videoUrl: '../assets/video/FilmForth Untitled.mp4',
        parentEventId: 'evt_01'
    },
    {
        id: 'user_img_01',
        title: 'God Shapes Pyramid Yeehaapattern 3',
        timestamp: new Date('2026-06-20T13:10:00'),
        layer: 'primary',
        desc: 'Holographic 6K spatial texture representing yeehaapattern 3 structure alignment grid.',
        device: 'Consensus Vector Scanner',
        tag: 'TEXTURE',
        gps: '-41.2865, 174.7762 (Wellington)',
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        mood: 'Reflective',
        videoUrl: '../assets/projector/god_shapes_pyramid_yeehaapattern3.png',
        parentEventId: 'evt_01'
    },
    {
        id: 'fm_vid_01',
        title: 'Sam Karate Training Loop',
        timestamp: new Date('2026-06-20T13:20:00'),
        layer: 'creative',
        desc: 'Sam Karate fluid motion physical alignment exercise capturing raw motion vectors.',
        device: 'Misaki Capture Rig',
        tag: 'MARTIAL',
        gps: '-36.8485, 174.7633 (Auckland)',
        hash: 'b1889b4f9810acb7762a4dfb39c1482de9f018a38a7c2e36b85efe3b0c44298f',
        mood: 'Energetic',
        videoUrl: '../assets/video/Sam Karate.mp4',
        parentEventId: 'evt_04'
    },
    {
        id: 'fm_vid_02',
        title: 'Pig Chase Sequence',
        timestamp: new Date('2026-06-20T13:30:00'),
        layer: 'creative',
        desc: 'High-speed field pursuit footage representing rural movement dynamics.',
        device: 'GoPro Hero Sovereign',
        tag: 'DYNAMICS',
        gps: '-37.8136, 144.9631 (Melbourne)',
        hash: '8f47648bf82d1c68f18d0999c0ac08a95f9c4ea82d091f090b83cc61a0baf5074',
        mood: 'Chaotic',
        videoUrl: '../assets/video/pigchase.mp4',
        parentEventId: 'evt_04'
    },
    {
        id: 'fm_vid_03',
        title: 'River Flow Calibration',
        timestamp: new Date('2026-06-20T13:40:00'),
        layer: 'primary',
        desc: 'Hydrological tracking overlay displaying water current vectors and turbulence constants.',
        device: 'Fluid Transit sensor',
        tag: 'HYDROLOGY',
        gps: '-45.4144, 167.7181 (Fiordland)',
        hash: '7c2e36b85ef37a28b49520a221f1d1b01c1ab08f47648ea82d091f090b83cc61',
        mood: 'Calm',
        videoUrl: '../assets/video/river1.mp4',
        parentEventId: 'evt_02'
    },
    {
        id: 'fm_vid_04',
        title: 'River Aerial Flyby',
        timestamp: new Date('2026-06-20T13:50:00'),
        layer: 'primary',
        desc: 'Lidar terrain flyover mapping canyon and water pathway structures.',
        device: 'Resonance Drone V4',
        tag: 'AERIAL',
        gps: '-45.4144, 167.7181 (Fiordland)',
        hash: 'dfb39c1482de9f018a38a7c2e36b85efe3b0c44298fc982ef0411ab1889b4f981',
        mood: 'Reflective',
        videoUrl: '../assets/video/riverflite.mp4',
        parentEventId: 'fm_vid_03'
    },
    {
        id: 'fm_vid_05',
        title: 'Sean Song Audio-Visual Sync',
        timestamp: new Date('2026-06-20T14:00:00'),
        layer: 'creative',
        desc: 'Original music audio-visual montage mapping waveform envelopes to video overlays.',
        device: 'Synthesizer Interface 01',
        tag: 'MONTAGE',
        gps: '-41.2865, 174.7762 (Wellington)',
        hash: 'ea82f091f090b83cc61a0baf5074ad2bbf82d1c68f18d0999c0ac08a95f9c4ea',
        mood: 'Creative',
        videoUrl: '../assets/video/seansong1.mp4',
        parentEventId: 'evt_03'
    },
    {
        id: 'fm_vid_06',
        title: 'Spirit Motion Grid Decouple',
        timestamp: new Date('2026-06-20T14:10:00'),
        layer: 'creative',
        desc: 'Phase shifts and resonance frequency fluctuations tracking organic animation layers.',
        device: 'Resonance Scanner 09',
        tag: 'SPIRIT',
        gps: '-36.8485, 174.7633 (Auckland)',
        hash: 'ab536e2f18f1a28a38a7c2e36b85ef37a28b49520a221f1d1b01c1ab08f476482',
        mood: 'Reflective',
        videoUrl: '../assets/video/spirtmogd.mp4',
        parentEventId: 'evt_05'
    },
    {
        id: 'fm_vid_07',
        title: 'Stream Flow Reflection',
        timestamp: new Date('2026-06-20T14:20:00'),
        layer: 'primary',
        desc: 'Macro tracking of water ripples and wind currents matching forest environment noise.',
        device: 'Static Optic Probe',
        tag: 'ENVIRONMENT',
        gps: '-41.2865, 174.7762 (Wellington)',
        hash: 'c982ef0411ab1889b4f9810acb7762a4d0f6663d3c0aca28f476482940e3b0c44',
        mood: 'Calm',
        videoUrl: '../assets/video/stream2.mp4',
        parentEventId: 'evt_01'
    },
    {
        id: 'fm_vid_08',
        title: 'UFO 2023 Visual Sighting',
        timestamp: new Date('2026-06-20T14:30:00'),
        layer: 'primary',
        desc: 'Decoded high-altitude dynamic light object tracking from long-range optical arrays.',
        device: 'Night Sky Sensor 02',
        tag: 'UAP',
        gps: '-36.8485, 174.7633 (Auckland)',
        hash: 'ea82d091f090b83cc61a0baf5074ad2bbf82d1c68f18d0999c0ac08a95f9c4ea82',
        mood: 'Energetic',
        videoUrl: '../assets/video/ufo2023.mp4',
        parentEventId: 'evt_04'
    }
];

let loadedEvents = defaultEvents;
try {
    const raw = localStorage.getItem('dragon9_vdo4n6_events');
    if (raw) {
        let parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach(e => {
                e.timestamp = new Date(e.timestamp);
            });
            // Merge defaults if they are missing from parsed loadedEvents
            const existingIds = new Set(parsed.map(e => e.id));
            defaultEvents.forEach(defEvt => {
                if (!existingIds.has(defEvt.id)) {
                    parsed.push(defEvt);
                }
            });
            // Sort by timestamp
            parsed.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            loadedEvents = parsed;
        }
    }
} catch (err) {
    console.error("Failed to load events from localStorage:", err);
}

const state = {
    theme: 'classic',
    soundEnabled: false,
    audioCtx: null,
    events: loadedEvents,
    selectedEventId: null,
    filterLayers: {
        primary: true,
        creative: true
    },
    activeBranch: 'primary', // primary, whatif
    scanning: false
};

function saveEvents() {
    try {
        localStorage.setItem('dragon9_vdo4n6_events', JSON.stringify(state.events));
    } catch (err) {
        console.error("Failed to save events to localStorage:", err);
    }
}

// --- DOM ELEMENTS ---
const dom = {
    uploadZone: document.getElementById('uploadZone'),
    scanProgressBox: document.getElementById('scanProgressBox'),
    scanStatusText: document.getElementById('scanStatusText'),
    scanProgressFill: document.getElementById('scanProgressFill'),
    scanLogText: document.getElementById('scanLogText'),
    injectionForm: document.getElementById('injectionForm'),
    formTitle: document.getElementById('formTitle'),
    formDate: document.getElementById('formDate'),
    formLayer: document.getElementById('formLayer'),
    formDesc: document.getElementById('formDesc'),
    formMood: document.getElementById('formMood'),
    togglePrimaryBtn: document.getElementById('togglePrimaryBtn'),
    toggleCreativeBtn: document.getElementById('toggleCreativeBtn'),
    btnBranchFact: document.getElementById('btn-branch-fact'),
    btnBranchWhatif: document.getElementById('btn-branch-whatif'),
    activeBranchLabel: document.getElementById('active-branch-label'),
    timelineContainer: document.getElementById('timelineContainer'),
    branchSvg: document.getElementById('branchSvg'),
    inspectTitle: document.getElementById('inspect-title'),
    inspectD9Time: document.getElementById('inspect-d9-time'),
    inspectLayer: document.getElementById('inspect-layer'),
    inspectTag: document.getElementById('inspect-tag'),
    inspectHash: document.getElementById('inspect-hash'),
    inspectGps: document.getElementById('inspect-gps'),
    inspectDevice: document.getElementById('inspect-device'),
    inspectMood: document.getElementById('inspect-mood'),
    inspectPurgeBtn: document.getElementById('inspect-purge-btn'),
    hexViewer: document.getElementById('hexViewer'),
    terminalLog: document.getElementById('terminal-log'),
    logCounter: document.getElementById('log-counter'),
    soundToggle: document.getElementById('sound-toggle')
};

// --- TERMINAL LOGGER ---
let logCount = 0;
function log(msg, type = 'system') {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    
    let typeClass = 'log-tag-info';
    if (type === 'scan') typeClass = 'log-tag-scan';
    else if (type === 'branch') typeClass = 'log-tag-branch';

    entry.innerHTML = `<span class="log-time">[${timeStr}]</span><span class="${typeClass}">[${type.toUpperCase()}]</span> ${msg}`;
    dom.terminalLog.appendChild(entry);
    dom.terminalLog.scrollTop = dom.terminalLog.scrollHeight;
    
    logCount++;
    dom.logCounter.innerText = `LOGS: ${logCount}`;
    if (dom.terminalLog.childNodes.length > 150) {
        dom.terminalLog.removeChild(dom.terminalLog.firstChild);
    }
}

// --- WEB AUDIO SYNTH ---
window.toggleSound = function() {
    if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    state.soundEnabled = !state.soundEnabled;
    dom.soundToggle.innerText = state.soundEnabled ? '🔊' : '🔇';
    dom.soundToggle.style.opacity = state.soundEnabled ? '1' : '0.6';

    if (state.soundEnabled) {
        state.audioCtx.resume();
        dom.soundToggle.style.borderColor = 'var(--accent)';
        dom.soundToggle.style.boxShadow = '0 0 10px var(--accent-glow)';
        log("Vdo4n6 analyzer audio synthesizers online.", "system");
    } else {
        dom.soundToggle.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        dom.soundToggle.style.boxShadow = 'none';
        log("Vdo4n6 audio silenced.", "system");
    }
};

function playChime(success = true) {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
        const now = state.audioCtx.currentTime;
        if (success) {
            // Harmonic arpeggio (Major chord)
            const freqs = [523.25, 659.25, 783.99, 1046.50];
            freqs.forEach((freq, idx) => {
                const osc = state.audioCtx.createOscillator();
                const gain = state.audioCtx.createGain();
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.02, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.3);
                osc.connect(gain);
                gain.connect(state.audioCtx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.35);
            });
        } else {
            // Low alert buzz
            const osc = state.audioCtx.createOscillator();
            const gain = state.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
            osc.connect(gain);
            gain.connect(state.audioCtx.destination);
            osc.start();
            osc.stop(now + 0.4);
        }
    } catch (e) {
        console.error(e);
    }
}

function playScanTick() {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
        const osc = state.audioCtx.createOscillator();
        const gain = state.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + Math.random() * 400, state.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.01, state.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + 0.02);
        osc.connect(gain);
        gain.connect(state.audioCtx.destination);
        osc.start();
        osc.stop(state.audioCtx.currentTime + 0.02);
    } catch (e) {}
}

// --- CONVERSION LIBRARY: CALENDAR TO DRAGON 9 ---
function dateToDragonTimeString(date) {
    const d9 = getDragonSync(date);
    if (d9.isRelax) return `RELAX PERIOD (ROOT ${d9.root})`;
    return `HOUR ${String(d9.h).padStart(2, '0')}:${String(d9.m).padStart(2, '0')}:${String(d9.s).padStart(2, '0')} (ROOT ${d9.root})`;
}

// --- SIMULATED DEEP FILE SCANNERS ---
const simulatedMedia = [
    {
        name: 'VDO_SOVEREIGN_REST_014.mov',
        desc: 'Forensic camera footage from local Auckland node, verifying synchronization phase alignment.',
        device: 'Sony A7S III (Node Escort Cam)',
        tag: 'FORENSIC',
        gps: '-36.8485, 174.7633 (Auckland)',
        mood: 'Calm'
    },
    {
        name: 'AUD_MATRIX_CHIME_ Wellington.wav',
        desc: 'Decoded audio file recording local Wellington synth resonance pings during relax mode.',
        device: 'Zoom H6 Field Recorder',
        tag: 'SOUNDING',
        gps: '-41.2865, 174.7762 (Wellington)',
        mood: 'Reflective'
    },
    {
        name: 'IMG_GOSSIP_GRID.png',
        desc: 'Snaphshot mapping peer-to-peer data packets propagated between Sydney and Auckland nodes.',
        device: 'primary_portal_engine',
        tag: 'FABRIC',
        gps: '-33.8688, 151.2093 (Sydney)',
        mood: 'Reflective'
    }
];

window.simulateFileUpload = function() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.click();
};

window.handleFileSelected = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (state.scanning) return;
    state.scanning = true;

    dom.scanProgressBox.style.display = 'block';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        dom.scanProgressFill.style.width = `${progress}%`;
        
        playScanTick();

        // Hex Viewer Stream simulation
        let hexString = '';
        for (let i = 0; i < 4; i++) {
            const offset = (Math.floor(Math.random() * 0xFFFF)).toString(16).padStart(8, '0').toUpperCase();
            const hexArr = Array.from({length: 8}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase());
            hexString += `${offset}: ${hexArr.join(' ')}<br>`;
        }
        dom.hexViewer.innerHTML = hexString;

        if (progress < 25) {
            dom.scanStatusText.innerText = 'READING HEADERS & CODECS...';
            dom.scanLogText.innerText = `Analyzing bits: ${file.name}\nSize: ${(file.size/1024/1024).toFixed(2)} MB\nType: ${file.type || 'unknown'}`;
        } else if (progress < 50) {
            dom.scanStatusText.innerText = 'EXTRACTING MOOD & EXIF METADATA...';
            dom.scanLogText.innerText = `File: ${file.name}\nLast Modified: ${new Date(file.lastModified).toLocaleDateString()}`;
        } else if (progress < 80) {
            dom.scanStatusText.innerText = 'GENERATING CRYPTOGRAPHIC SHA-256 HASH...';
            dom.scanLogText.innerText = `Hashing bytes: block size 4096`;
        } else {
            dom.scanStatusText.innerText = 'CALIBRATING DRAGON 9 CHRONO STAMP...';
            dom.scanLogText.innerText = `Chrono matrix aligning...`;
        }

        if (progress >= 100) {
            clearInterval(interval);
            dom.scanProgressBox.style.display = 'none';
            state.scanning = false;

            // Generate SHA256
            const hash = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');

            // Assemble local Object URL for video play!
            const isVideo = file.type.startsWith('video/');
            const videoUrl = isVideo ? URL.createObjectURL(file) : '';

            // Assemble into timeline database
            const now = new Date();
            
            // Deduce a mood and device based on file details
            const moods = ['Reflective', 'Energetic', 'Calm', 'Creative', 'Reflective'];
            const randomMood = moods[Math.floor(Math.random() * moods.length)];
            
            const newEvent = {
                id: `evt_local_${Date.now()}`,
                title: file.name.substring(0, 30),
                timestamp: now,
                layer: isVideo ? 'creative' : 'primary',
                desc: `Local file scanned & indexed. Size: ${(file.size/1024/1024).toFixed(2)} MB. Content-type: ${file.type || 'unknown'}`,
                device: 'local_sandbox_uploader',
                tag: isVideo ? 'LOCAL_VIDEO' : 'LOCAL_AUDIO',
                gps: '-41.2865, 174.7762 (Wellington Core)',
                hash: hash,
                mood: randomMood,
                videoUrl: videoUrl,
                parentEventId: state.events[state.events.length - 1]?.id || null
            };

            state.events.push(newEvent);
            saveEvents();
            
            log(`Forensic uploader indexed file '${file.name}'. Object URL mounted.`, "scan");
            playChime(true);
            
            // Set quest item complete since they ingested a local file!
            localStorage.setItem('quest_media_ingested', 'completed');
            
            // Re-render
            renderTimeline();
            selectEvent(newEvent.id);
        }
    }, 80);
};

window.importStreamUrl = async function() {
    const urlInput = document.getElementById('reelUrlInput');
    if (!urlInput) return;
    const url = urlInput.value.trim();
    if (!url) {
        log("ERROR: Stream URL input is empty.", "error");
        playChime(false);
        return;
    }

    log(`Initializing capture sequence for URL: ${url.substring(0, 40)}...`, "scan");
    
    // Show scanning progress UI
    dom.scanProgressBox.style.display = 'block';
    dom.scanStatusText.innerText = "CAPTURING SOCIAL STREAM METADATA...";
    dom.scanProgressFill.style.width = '25%';
    dom.scanLogText.innerText = "Calling remote capture transceiver API...";
    
    try {
        const response = await fetch('/api/download-reel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Capture command returned non-zero code.');
        }
        
        const data = await response.json();
        
        if (data.is_collection) {
            dom.scanProgressFill.style.width = '75%';
            dom.scanStatusText.innerText = "CAPTURING COLLECTION...";
            dom.scanLogText.innerText = `Found ${data.reels.length} premium Reels under #fluidmotiontv`;
            
            setTimeout(() => {
                data.reels.forEach((reel, rIdx) => {
                    const hash = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
                    const newEvent = {
                        id: `fb_reel_${reel.id}_${Date.now()}_${rIdx}`,
                        title: reel.title,
                        timestamp: new Date(Date.now() - (rIdx * 3600000 * 2)),
                        layer: 'creative',
                        desc: reel.desc,
                        device: 'fb_reels_collection_extractor',
                        tag: 'FMTV_BEST',
                        gps: reel.gps,
                        hash: hash,
                        mood: reel.mood,
                        parentEventId: state.events[state.events.length - 1]?.id || null,
                        videoUrl: reel.video_url,
                        platform: 'facebook'
                    };
                    state.events.push(newEvent);
                });
                
                saveEvents();
                localStorage.setItem('quest_media_ingested', 'completed');
                renderTimeline();
                selectEvent(state.events[state.events.length - 1].id);
                
                dom.scanProgressFill.style.width = '100%';
                dom.scanStatusText.innerText = "COLLECTION INTEGRATION COMPLETE";
                log(`SUCCESS: Captured #fluidmotiontv premium portfolio collection containing ${data.reels.length} nodes.`, "success");
                playChime(true);
                
                urlInput.value = '';
                setTimeout(() => {
                    dom.scanProgressBox.style.display = 'none';
                }, 3000);
            }, 1500);
            return;
        }

        dom.scanProgressFill.style.width = '75%';
        dom.scanStatusText.innerText = "EXTRACTING FORENSIC STREAMS...";
        dom.scanLogText.innerText = `Stream Capture OK: "${data.title}"`;
        
        setTimeout(() => {
            // Generate SHA256
            const hash = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
            
            // Assemble into timeline database
            const now = new Date();
            const platform = data.extractor || 'generic';
            let devName = 'generic_stream_assembler';
            let tagStr = 'STREAM_IMPORT';
            let descStr = data.desc || `Media stream extracted. Video path: ${data.video_url}`;
            
            if (platform.includes('youtube')) {
                devName = 'youtube_transceiver_node';
                tagStr = 'YOUTUBE_INDEX';
                descStr = `[YouTube Broadcast] ` + (data.desc || `Video ID: ${data.id}`);
            } else if (platform.includes('facebook')) {
                devName = 'fb_reels_assembler';
                tagStr = 'REEL_IMPORT';
            } else if (platform.includes('instagram')) {
                devName = 'instagram_stream_node';
                tagStr = 'IG_REEL';
            } else if (platform.includes('tiktok')) {
                devName = 'tiktok_flow_node';
                tagStr = 'TIKTOK_IMPORT';
            }
            
            const newEvent = {
                id: `stream_${platform}_${data.id}_${Date.now()}`,
                title: data.title || 'Captured Stream Segment',
                timestamp: now,
                layer: 'creative',
                desc: descStr,
                device: devName,
                tag: tagStr,
                gps: data.gps || '-41.2865, 174.7762',
                hash: hash,
                mood: data.mood || 'Reflective',
                parentEventId: state.events[state.events.length - 1]?.id || null,
                videoUrl: data.video_url,
                platform: platform
            };
            
            state.events.push(newEvent);
            saveEvents();
            localStorage.setItem('quest_media_ingested', 'completed');
            
            log(`Assembler integrated ${platform.toUpperCase()} Stream: "${newEvent.title}" (ID: ${data.id}).`, "scan");
            playChime(true);
            
            // Re-render
            renderTimeline();
            selectEvent(newEvent.id);
            
            dom.scanProgressFill.style.width = '100%';
            dom.scanStatusText.innerText = "INTEGRATION SUCCESSFUL";
            
            urlInput.value = '';
            
            setTimeout(() => {
                dom.scanProgressBox.style.display = 'none';
            }, 3000);
        }, 1500);
        
    } catch (err) {
        console.error(err);
        dom.scanProgressFill.style.width = '0%';
        dom.scanStatusText.innerText = "TRANSCEIVER SCAN FAILED";
        dom.scanLogText.innerText = err.message;
        log(`CRITICAL: Capturing stream failed: ${err.message}`, "error");
        playChime(false);
    }
};

window.importFacebookReel = window.importStreamUrl;

window.fillSuggestedUrl = function(val) {
    const urlInput = document.getElementById('reelUrlInput');
    if (urlInput) {
        urlInput.value = val;
        log(`Suggested URL loaded into capture buffer: "${val}"`, "system");
    }
};

// --- MANUAL MEMORY INJECTION FORM SUBMISSION ---
window.injectMemoryEvent = function(event) {
    event.preventDefault();

    const title = dom.formTitle.value.trim();
    const dateVal = dom.formDate.value;
    const layer = dom.formLayer.value;
    const desc = dom.formDesc.value.trim();
    const mood = dom.formMood.value;

    if (!title || !dateVal || !desc) {
        log("ABORT: Injection parameters incomplete.", "error");
        playChime(false);
        return;
    }

    const timestamp = new Date(dateVal);
    const hash = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');

    // Setup coordinate/GPS mock based on mood or location
    const gpsCoords = [
        '-41.2865, 174.7762 (Wellington)',
        '-36.8485, 174.7633 (Auckland)',
        '-33.8688, 151.2093 (Sydney)',
        '35.6762, 139.6503 (Tokyo)',
        '51.5074, -0.1278 (London)'
    ];
    const gps = gpsCoords[Math.floor(Math.random() * gpsCoords.length)];

    const newEvent = {
        id: `evt_manual_${Date.now()}`,
        title: title,
        timestamp: timestamp,
        layer: layer,
        desc: desc,
        device: 'Manual Entry (Memory Injection)',
        tag: layer === 'primary' ? 'INJECTED' : 'WHAT-IF',
        gps: gps,
        hash: hash,
        mood: mood.charAt(0).toUpperCase() + mood.slice(1),
        parentEventId: state.events[state.events.length - 1]?.id || null
    };

    state.events.push(newEvent);
    saveEvents();
    log(`Injected memory anchor '${title}' in ${layer.toUpperCase()} layer.`, layer === 'primary' ? 'scan' : 'branch');
    playChime(true);

    // Reset Form
    dom.injectionForm.reset();

    // Re-render
    renderTimeline();
    selectEvent(newEvent.id);
};

// --- SELECT JOURNAL ANCHOR NODE ---
function selectEvent(id) {
    state.selectedEventId = id;
    
    // Highlight Card
    document.querySelectorAll('.timeline-node').forEach(node => {
        if (node.getAttribute('data-id') === id) {
            node.classList.add('focused-node');
        } else {
            node.classList.remove('focused-node');
        }
    });

    const evt = state.events.find(e => e.id === id);
    if (!evt) return;

    // Update Telemetry Panel
    dom.inspectTitle.innerText = evt.title;
    dom.inspectD9Time.innerText = dateToDragonTimeString(evt.timestamp);
    dom.inspectLayer.innerText = evt.layer.toUpperCase();
    dom.inspectTag.innerText = evt.tag;
    dom.inspectHash.innerText = evt.hash;
    dom.inspectGps.innerText = evt.gps;
    dom.inspectDevice.innerText = evt.device;
    dom.inspectMood.innerText = evt.mood;
    
    dom.inspectPurgeBtn.disabled = false;

    // Video preview management
    const videoContainer = document.getElementById('videoPreviewContainer');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoMockOverlay = document.getElementById('videoMockOverlay');
    const videoMockFilename = document.getElementById('videoMockFilename');

    if (evt.videoUrl) {
        if (videoContainer) videoContainer.style.display = 'block';
        if (evt.videoUrl === 'mock') {
            if (videoPlayer) {
                videoPlayer.style.display = 'none';
                videoPlayer.src = '';
            }
            if (videoMockOverlay) videoMockOverlay.style.display = 'flex';
            
            let mockType = 'SIMULATED STREAM';
            const platform = evt.platform || '';
            const idLower = evt.id.toLowerCase();
            const devLower = evt.device.toLowerCase();
            if (platform.includes('youtube') || idLower.includes('yt') || idLower.includes('youtube')) {
                mockType = 'SIMULATED YOUTUBE BROADCAST';
            } else if (platform.includes('facebook') || idLower.includes('fb') || devLower.includes('fb')) {
                mockType = 'SIMULATED REEL';
            }
            if (videoMockFilename) videoMockFilename.innerText = `${evt.title} (${mockType})`;
        } else {
            if (videoMockOverlay) videoMockOverlay.style.display = 'none';
            if (videoPlayer) {
                videoPlayer.style.display = 'block';
                videoPlayer.src = evt.videoUrl;
            }
        }
    } else {
        if (videoContainer) videoContainer.style.display = 'none';
        if (videoPlayer) {
            videoPlayer.style.display = 'none';
            videoPlayer.src = '';
        }
        if (videoMockOverlay) videoMockOverlay.style.display = 'none';
    }

    // Format theme/color accent for telemetry card
    if (evt.layer === 'creative') {
        dom.inspectTitle.style.color = 'var(--alert)';
    } else {
        dom.inspectTitle.style.color = 'var(--accent)';
    }

    playChime(true);
}

// --- PURGE MEMORY ANCHOR ---
window.purgeSelectedMemory = function() {
    if (state.selectedEventId === null) return;
    const evt = state.events.find(e => e.id === state.selectedEventId);
    if (!evt) return;

    state.events = state.events.filter(e => e.id !== state.selectedEventId);
    saveEvents();
    log(`Purged memory anchor '${evt.title}' from the database.`, "warn");
    playChime(false);

    // Reset Inspector
    state.selectedEventId = null;
    dom.inspectTitle.innerText = 'Select an Anchor Node';
    dom.inspectD9Time.innerText = '--';
    dom.inspectLayer.innerText = '--';
    dom.inspectTag.innerText = '--';
    dom.inspectHash.innerText = '--';
    dom.inspectGps.innerText = '--';
    dom.inspectDevice.innerText = '--';
    dom.inspectMood.innerText = '--';
    dom.inspectPurgeBtn.disabled = true;

    renderTimeline();
};

// --- MULTIVERSAL LAYERING SEGMENTS SWITCH ---
window.switchToBranch = function(branch) {
    state.activeBranch = branch;
    
    // Toggle active segment buttons
    if (branch === 'primary') {
        dom.btnBranchFact.classList.add('active-layer');
        dom.btnBranchWhatif.classList.remove('active-layer');
        dom.activeBranchLabel.innerText = 'PRIMARY PROTOCOL FLOW';
        dom.activeBranchLabel.style.color = 'var(--highlight)';
        log("Browsing Forensic-verified History protocol.", "system");
    } else {
        dom.btnBranchFact.classList.remove('active-layer');
        dom.btnBranchWhatif.classList.add('active-layer');
        dom.activeBranchLabel.innerText = 'ALTERNATIVE TIMELINE LAYERS';
        dom.activeBranchLabel.style.color = 'var(--alert)';
        log("Browsing Alternative Creative branching flows.", "branch");
    }

    renderTimeline();
};

window.toggleLayerFilter = function(layer) {
    state.filterLayers[layer] = !state.filterLayers[layer];
    
    // update button look
    const btn = layer === 'primary' ? dom.togglePrimaryBtn : dom.toggleCreativeBtn;
    if (state.filterLayers[layer]) {
        btn.classList.add('active-layer');
    } else {
        btn.classList.remove('active-layer');
    }

    renderTimeline();
};

// --- RENDER CHRONOLOGY TIMELINE ---
function renderTimeline() {
    // 1. Sort events chronologically
    const sorted = [...state.events].sort((a, b) => a.timestamp - b.timestamp);
    
    // Filter events
    const filtered = sorted.filter(evt => {
        // Filter by layer toggle buttons
        if (evt.layer === 'primary' && !state.filterLayers.primary) return false;
        if (evt.layer === 'creative' && !state.filterLayers.creative) return false;
        
        // Filter by active branch selector segment card
        if (state.activeBranch === 'primary' && evt.layer === 'creative') return false;
        
        return true;
    });

    // Clean container nodes (leaving axis and svg lines)
    const elementsToRemove = dom.timelineContainer.querySelectorAll('.timeline-node');
    elementsToRemove.forEach(el => el.parentNode.removeChild(el));

    // Plot nodes
    filtered.forEach((evt, idx) => {
        const node = document.createElement('div');
        node.className = `timeline-node ${evt.layer}-node ${state.selectedEventId === evt.id ? 'focused-node' : ''}`;
        node.setAttribute('data-id', evt.id);
        node.addEventListener('click', () => selectEvent(evt.id));

        const timeStr = dateToDragonTimeString(evt.timestamp);

        // Calculate custom node style positioning or height offsets for creative branches
        const offsetStyle = evt.layer === 'creative' ? 'margin-left: 45px;' : '';

        node.innerHTML = `
            <div class="timeline-anchor-dot"></div>
            <div class="timeline-card" style="${offsetStyle}">
                <div class="card-header-info">
                    <span class="card-title">
                        ${evt.title}
                        ${evt.layer === 'creative' ? '<span class="branch-badge creative-badge">WHAT-IF</span>' : '<span class="branch-badge">FACT</span>'}
                    </span>
                    <span class="card-time">${timeStr}</span>
                </div>
                <div class="card-desc">${evt.desc}</div>
                <div class="card-footer">
                    <span>MOOD: ${evt.mood.toUpperCase()}</span>
                    <span>TAG: <span class="card-tag">${evt.tag}</span></span>
                </div>
            </div>
        `;
        dom.timelineContainer.appendChild(node);
    });

    // 2. Draw Branch Link lines inside the SVG overlay
    drawBranchSVGConnections(filtered);
}

// Draw physical branching path links splits using SVG
function drawBranchSVGConnections(plottedEvents) {
    dom.branchSvg.innerHTML = '';
    
    if (state.activeBranch === 'primary') return; // no branching overlays needed in facts view
    
    plottedEvents.forEach((evt, idx) => {
        if (evt.layer === 'creative' && evt.parentEventId) {
            // Find parent node coordinates
            const parentNodeEl = dom.timelineContainer.querySelector(`.timeline-node[data-id="${evt.parentEventId}"]`);
            const childNodeEl = dom.timelineContainer.querySelector(`.timeline-node[data-id="${evt.id}"]`);
            
            if (parentNodeEl && childNodeEl) {
                const parentDot = parentNodeEl.querySelector('.timeline-anchor-dot');
                const childDot = childNodeEl.querySelector('.timeline-anchor-dot');
                
                if (parentDot && childDot) {
                    const rect = dom.timelineContainer.getBoundingClientRect();
                    const pRect = parentDot.getBoundingClientRect();
                    const cRect = childDot.getBoundingClientRect();
                    
                    const x1 = pRect.left - rect.left + 6;
                    const y1 = pRect.top - rect.top + 6;
                    const x2 = cRect.left - rect.left + 6;
                    const y2 = cRect.top - rect.top + 6;

                    // Draw curved branch line using Bezier path
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const controlY = y1 + (y2 - y1) / 2;
                    const d = `M ${x1} ${y1} C ${x1} ${controlY}, ${x2} ${controlY}, ${x2} ${y2}`;
                    
                    path.setAttribute('d', d);
                    path.setAttribute('stroke', 'var(--alert)');
                    path.setAttribute('stroke-width', '1.5');
                    path.setAttribute('fill', 'none');
                    path.setAttribute('stroke-dasharray', '3');
                    path.style.opacity = '0.5';

                    dom.branchSvg.appendChild(path);
                }
            }
        }
    });
}

// --- THEME SWEEPER SYSTEM ---
window.setTheme = function(theme) {
    document.body.className = `theme-${theme}`;
    state.theme = theme;
    localStorage.setItem('dragon-theme', theme);

    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.classList.contains(`btn-${theme}`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    log(`Aesthetics recalibrated: Layer Theme: '${theme.toUpperCase()}'`, "system");
    setTimeout(renderTimeline, 20); // redraw branch lines with updated theme colors
};

// --- PREMIUM ARCHIVE SERVICE OFFERINGS ---
const servicesData = {
    restoration: {
        title: "FORENSIC RESTORATION",
        desc: "Deep restoration of corrupted or degraded historical archive files. Reconstruction of lost frames, recovery of metadata boundaries, and stabilization of analog jitter.",
        price: 150,
        options: [
            { text: "Analog Tape (VHS/Betamax/U-matic)", value: "tape" },
            { text: "Digital File Fragment Repair", value: "digital" },
            { text: "EXIF & Metadata Header Reconstruction", value: "exif" }
        ],
        optionLabel: "Archive Format Type"
    },
    upscaling: {
        title: "8K ULTRA-HD UPSCALING",
        desc: "Upscale vintage SD or HD footage to crisp 8K resolution using advanced motion-compensated spatial grids. Restores high-frequency details without visual artifacts.",
        price: 250,
        options: [
            { text: "Cinema Detail Reconstruction", value: "cinema" },
            { text: "Historical Archive Enhancement", value: "archive" },
            { text: "Volumetric High-Frequency Boost", value: "high_freq" }
        ],
        optionLabel: "AI Upscaling Model"
    },
    holographic: {
        title: "HOLOGRAPHIC CONVERSION",
        desc: "Converts flat 2D video timelines into 3D spatial grids for projection and volumetric displays. Calibrates deep stereoscopic parallax offsets based on camera focus.",
        price: 500,
        options: [
            { text: "Standard Parallax Depth Mapping", value: "standard_3d" },
            { text: "Volumetric Vol-Hex Point Cloud", value: "vol_hex" },
            { text: "Holographic Lenticular Grid (Light Field)", value: "lightfield" }
        ],
        optionLabel: "Volumetric Output Protocol"
    }
};

let activeServiceType = null;

window.openServiceModal = function(type) {
    const service = servicesData[type];
    if (!service) return;
    
    activeServiceType = type;
    
    document.getElementById('modalServiceTitle').innerText = service.title;
    document.getElementById('modalServiceDesc').innerText = service.desc;
    document.getElementById('modalServicePrice').innerText = `${service.price} HN`;
    document.getElementById('modalOptionLabel').innerText = service.optionLabel;
    
    const select = document.getElementById('modalOptionSelect');
    select.innerHTML = '';
    service.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.text = opt.text;
        select.appendChild(option);
    });
    
    // Reset form display
    document.getElementById('serviceFormContainer').style.display = 'flex';
    document.getElementById('serviceSuccessContainer').style.display = 'none';
    
    document.getElementById('serviceModal').classList.add('open');
    log(`Opened service quote panel for '${service.title}'`, "system");
};

window.closeServiceModal = function() {
    document.getElementById('serviceModal').classList.remove('open');
};

window.placeServiceOrder = function() {
    const service = servicesData[activeServiceType];
    if (!service) return;
    
    const optionSelect = document.getElementById('modalOptionSelect');
    const selectedOptionText = optionSelect.options[optionSelect.selectedIndex].text;
    const prioritySelect = document.getElementById('modalPrioritySelect');
    const selectedPriorityText = prioritySelect.options[prioritySelect.selectedIndex].text;
    
    let finalPrice = service.price;
    if (prioritySelect.value === 'expedited') finalPrice += 50;
    else if (prioritySelect.value === 'instant') finalPrice += 150;
    
    // Generate simulated SHA-256 TX receipt hash
    const txHash = "0x" + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    // Show success view
    document.getElementById('serviceFormContainer').style.display = 'none';
    document.getElementById('serviceSuccessContainer').style.display = 'block';
    document.getElementById('orderReceiptId').innerText = `TX RECEIPT: ${txHash}`;
    
    log(`SUCCESS: Placed order for '${service.title}' (${selectedOptionText}) via ${selectedPriorityText}. Total debit: ${finalPrice} HN.`, "system");
    log(`TRANSACTION SIGNED: ${txHash}`, "branch");
    
    // Play sound if supported
    if (typeof playScanTick === 'function') {
        playScanTick();
    }
};

// --- INITIALIZE WINDOW ENGINE ---
function init() {
    const savedTheme = localStorage.getItem('dragon-theme') || 'classic';
    window.setTheme(savedTheme);

    // Initial load
    renderTimeline();

    // Resize listener to redraw Bezier curves
    window.addEventListener('resize', () => {
        setTimeout(renderTimeline, 50);
    });

    log("Vdo4n6 indexing modules connected. Ready for memory anchor injection.", "system");
}

init();
