// --- DRAGON 9 STANDALONE RADIO STATION SCRIPT ---

let currentRoot = 1;
let currentD9Time = "00:00:00";
let activeTheme = 'classic';
let speechEnabled = false;

// Web Audio Context & Resonance Injector Nodes
let audioCtx = null;
let audioSource = null;
let analyserNode = null;
let injectorOsc = null;
let injectorGainNode = null;
let isInjectorActive = false;
let injectorVol = 0.25; // Default 25%

function initAudioPipeline() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;
        
        // Connect Radio Player
        audioSource = audioCtx.createMediaElementSource(radioPlayer);
        audioSource.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);
        
        // Create Injector Gain Node
        injectorGainNode = audioCtx.createGain();
        injectorGainNode.gain.setValueAtTime(0, audioCtx.currentTime); // Start muted
        injectorGainNode.connect(analyserNode);
        
        log("Web Audio engine pipeline connected to broadcast receiver.", "SUCCESS");
    } catch (e) {
        console.error("Failed to initialize Web Audio context:", e);
    }
}

// Global Audio Playlist
const radioPlayer = document.getElementById('dragonRadioPlayer');
const trackLabel = document.getElementById('radioCurrentTrackName');
let radioTracks = [
    { name: "Off-Grid Solfeggio Drift (Loop A)", src: "../assets/music/ambient_drift_432.mp3", artist: "Dragon 9 Core" },
    { name: "Matariki Mycelium Synth (Loop B)", src: "../assets/music/mycelium_loop_528.mp3", artist: "Gino Permaculture" }
];
let currentRadioTrackIdx = 0;

// Logs Panel
const logger = document.getElementById('logger');
function log(msg, type = 'SYSTEM') {
    const entry = document.createElement('div');
    entry.textContent = `[${type}] ${msg}`;
    if (logger) {
        logger.prepend(entry);
    }
}

// Themes Manager
window.setTheme = function(theme) {
    document.body.className = '';
    if (theme !== 'classic') {
        document.body.classList.add('theme-' + theme);
    }
    
    // Update active theme btn state
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.classList.contains('btn-' + theme)) {
            btn.classList.add('active');
        }
    });
    activeTheme = theme;
    log(`Switched broadcast skin to: ${theme.toUpperCase()}`);
};

// Initial theme load
window.setTheme('classic');

// WebSocket Integration
let ws = null;
let reconnectTimeout = null;

function connectWebSocket() {
    if (ws) return;
    const wsUrl = `ws://${window.location.hostname || 'localhost'}:9100`;
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        log("Connected to Dragon 9 Broadcast Network Gateway (WS://localhost:9100)", "SUCCESS");
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
    };
    
    ws.onclose = () => {
        log("WebSocket disconnected. Operating in local-node talkback mode.", "WARNING");
        ws = null;
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
    };
    
    ws.onerror = () => {
        // Suppress print to avoid console pollution
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.action === "RADIO_TALKBACK") {
                appendRadioLine(data.alias, data.message, "🎙️", "var(--highlight)");
            }
        } catch (e) {
            console.error("Error parsing socket frame:", e);
        }
    };
}

// Playlist manager
async function loadRadioSubmissions() {
    try {
        const response = await fetch('/api/get-radio-submissions');
        if (response.ok) {
            const res = await response.json();
            const submissions = Array.isArray(res) ? res : (res.tracks || []);
            if (Array.isArray(submissions)) {
                submissions.forEach(t => {
                    // Only load tracks that are approved or legacy untagged tracks
                    if (t.status === undefined || t.status === 'approved') {
                        const relativeSrc = t.src.startsWith('assets/') ? '../' + t.src : t.src;
                        if (!radioTracks.some(rt => rt.src === relativeSrc)) {
                            radioTracks.push({
                                name: `${t.title} (${t.artist.toUpperCase()})`,
                                src: relativeSrc,
                                artist: t.artist
                            });
                        }
                    }
                });
            }
        }
    } catch (err) {
        log("Using off-grid local playlist cache.", "INFO");
    }
    initRadioPlayer();
}

function initRadioPlayer() {
    if (radioTracks.length === 0 || !radioPlayer) return;
    
    // Load first track
    playRadioTrack(0);
    
    radioPlayer.addEventListener('ended', () => {
        currentRadioTrackIdx = (currentRadioTrackIdx + 1) % radioTracks.length;
        playRadioTrack(currentRadioTrackIdx);
    });
}

function playRadioTrack(index) {
    if (!radioPlayer || !trackLabel) return;
    const track = radioTracks[index];
    radioPlayer.src = track.src;
    trackLabel.textContent = `${track.name.toUpperCase()} - ${track.artist.toUpperCase()}`;
    
    // Setup audio nodes on first play interaction
    const startAudio = () => {
        initAudioPipeline();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        radioPlayer.removeEventListener('play', startAudio);
    };
    radioPlayer.addEventListener('play', startAudio);
    
    // Attempts to play (browsers require user interaction first)
    radioPlayer.play().then(() => {
        log(`Streaming track: "${track.name}"`, "PLAYER");
    }).catch(() => {
        log(`Awaiting user permission to auto-play stream. Click Play.`, "PLAYER");
    });
}

// Talkback slideshow rotating show segments
const radioSegments = [
    { title: "Beach Clean Up & Glass Repurposing", desc: "Turning marine garbage into beautiful sandcastles and glass sculptures. Pledges accepted.", emoji: "🧹" },
    { title: "E-Waste Synth Upcycling Lab", desc: "Soldering discarded circuit boards and old computer keyboards into modular synthesizers. Call in to hear the frequency!", emoji: "🖥️" },
    { title: "Kawakawa Rongoā Herb Dryer", desc: "Building solar dehydrators from shipping pallets to dry wild-harvested medicinal herbs.", emoji: "🌿" },
    { title: "Harakeke Word Sculptures & Radio Waves", desc: "Weaving flax ropes and mounting speakers to create community-powered sound sculptures.", emoji: "🌾" },
    { title: "Reclaimed Timber Drum Circle", desc: "Hollowing out fallen pines to craft traditional drums. Live spoken-word transmission.", emoji: "🥁" },
    { title: "Sovereign Solar Broadcast Shed", desc: "Retrofitting an old garden shed with salvaged solar panels to power local community radio.", emoji: "🔋" }
];
let currentRadioSegmentIdx = 0;

function rotateRadioSegment() {
    currentRadioSegmentIdx = (currentRadioSegmentIdx + 1) % radioSegments.length;
    const seg = radioSegments[currentRadioSegmentIdx];
    
    const picEl = document.getElementById('radioPicture');
    const titleEl = document.getElementById('radioSegmentTitle');
    const descEl = document.getElementById('radioSegmentDesc');
    
    if (picEl) {
        picEl.textContent = seg.emoji;
        picEl.style.transform = "scale(1.2) rotate(5deg)";
        picEl.style.transition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
        setTimeout(() => { picEl.style.transform = "scale(1) rotate(0deg)"; }, 400);
    }
    if (titleEl) titleEl.textContent = seg.title;
    if (descEl) descEl.textContent = seg.desc;
    
    appendRadioLine("HOST TIM", `Transitioning show segment to: "${seg.title}". Talk to us!`, "📻", "var(--accent)");
}

// Speech synthesis voice over
window.toggleLiveVoice = function() {
    speechEnabled = !speechEnabled;
    const toggleBtn = document.getElementById('voiceToggle');
    if (toggleBtn) {
        if (speechEnabled) {
            toggleBtn.innerText = "🔊 VOICE ON";
            toggleBtn.classList.add('voice-active');
            log("Speech synthesis voice over enabled.", "SUCCESS");
            speakRapLine("SYSTEM", "Voice over activated.");
        } else {
            toggleBtn.innerText = "🔇 VOICE OFF";
            toggleBtn.classList.remove('voice-active');
            log("Voice over muted.", "INFO");
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        }
    }
};

function speakRapLine(speaker, text) {
    if (!speechEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop current speech
    
    const cleanText = text.replace(/[*_#~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Choose voice parameters
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    
    if (speaker === 'Night Fish') { utterance.pitch = 0.75; utterance.rate = 1.1; }
    else if (speaker === 'Misaki') { utterance.pitch = 1.25; }
    else if (speaker === 'HOST TIM' || speaker === 'TIMOTHY DWEN (YOU)') { utterance.pitch = 1.0; }
    
    window.speechSynthesis.speak(utterance);
}

function appendRadioLine(speaker, text, avatar = '📻', color = 'var(--accent)') {
    const feed = document.getElementById('radioTalkbackFeed');
    if (!feed) return;
    
    const div = document.createElement('div');
    div.style.marginBottom = '6px';
    div.innerHTML = `<span style="color: ${color}; font-weight: bold;">${avatar} [${speaker.toUpperCase()}]:</span> "${text}"`;
    feed.appendChild(div);
    feed.scrollTop = feed.scrollHeight;
    
    if (speaker !== 'SYSTEM' && speaker !== 'DEPOT' && speaker !== 'RADIO') {
        speakRapLine(speaker, text);
    }
}

// Caller simulated replies
const mockCallersList = [
    { name: "Gino", avatar: "🍄", color: "var(--highlight)", lines: [
        "Beach glass is pure sand restoration! Love the project.",
        "Just harvested kawakawa leaves. Solar dehydrators are perfect.",
        "The soil frequencies are in tune today.",
        "Off-grid loops sound so crisp on harakeke wood cones."
    ]},
    { name: "Misaki", avatar: "🎨", color: "var(--alert)", lines: [
        "Volumetric display models look gorgeous in Kiterider's shield HUD.",
        "Spitting some real talkback frequencies here.",
        "Visualizing modular synth designs right now.",
        "The timeline sweep parameters are locked."
    ]},
    { name: "Conan", avatar: "📡", color: "#ffcc00", lines: [
        "Real-time packet logs are syncing. Zero packet loss on on-air waves.",
        "Gossip broadcast successfully registered on node Auckland 01.",
        "Submitting test audio stream from Christchurch offset gateway.",
        "Link confirmed. Ready to export transcript script."
    ]},
    { name: "Corey", avatar: "🎧", color: "var(--accent)", lines: [
        "Booming sub bass is active in my off-grid shed. Keep the loops spinning!",
        "Upcycled three keyboards into a procedural looper.",
        "The rhythm is in sync. Clean clean cleanup!",
        "Live audio signal verified."
    ]}
];

function triggerMockCallerResponse() {
    const caller = mockCallersList[Math.floor(Math.random() * mockCallersList.length)];
    const text = caller.lines[Math.floor(Math.random() * caller.lines.length)];
    appendRadioLine(caller.name, text, caller.avatar, caller.color);
}

// Send talkback on-air
window.sendRadioTalkback = function() {
    const inputEl = document.getElementById('radioUserInput');
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;
    
    inputEl.value = '';
    
    // Get active user identity alias
    let alias = "TIMOTHY DWEN (YOU)";
    const rawId = localStorage.getItem('dragon-sovereign-id');
    if (rawId) {
        try {
            const id = JSON.parse(rawId);
            alias = id.alias;
        } catch (e) {}
    }
    
    // Display locally
    appendRadioLine(alias, text, "📢", "#ffffff");
    
    // Broadcast via Websocket
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            action: "RADIO_TALKBACK",
            alias: alias,
            message: text
        }));
    }
    
    // Trigger mock response after 2 seconds
    setTimeout(() => {
        if (Math.random() < 0.5) {
            triggerMockCallerResponse();
        }
    }, 2000);
};

// Export transcripts
window.exportRadioTranscript = function() {
    const feed = document.getElementById('radioTalkbackFeed');
    if (!feed) return;
    
    const lines = [];
    feed.querySelectorAll('div').forEach(div => {
        lines.push(div.innerText || div.textContent);
    });
    
    const textContent = "--- DRAGON 9 OFF-GRID TALKBACK RADIO TRANSCRIPT ---\n" + 
                        "Generated: " + new Date().toLocaleString() + "\n" +
                        "Use this script inside Ardour / Kdenlive for your remix!\n\n" + 
                        lines.join("\n");
                        
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `radio_talkback_remix_script_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    log("Exported radio talkback remix script!", "SUCCESS");
};

// Sovereign Reserve point system
window.optInToSovereignReserve = function() {
    const rawId = localStorage.getItem('dragon-sovereign-id');
    if (!rawId) {
        log("ABORT: No Sovereign Digital ID found in this browser context. Please go to the Bridge dashboard first to generate your keys!", "WARN");
        return;
    }
    
    localStorage.setItem('dragon-reserve-opted-in', 'true');
    if (!localStorage.getItem('dragon-reserve-balance')) {
        localStorage.setItem('dragon-reserve-balance', '0');
    }
    
    updateReserveUI();
    log("SUCCESS: Opted-in to the Sovereign Reserve point system. Your off-grid earnings are secured!", "SUCCESS");
};

function updateReserveUI() {
    const badge = document.getElementById('reserve-badge');
    const desc = document.getElementById('reserve-desc');
    const didDisplay = document.getElementById('linked-did-display');
    const optinBtn = document.getElementById('btn-optin-reserve');
    
    if (!badge || !desc || !didDisplay || !optinBtn) return;
    
    const optedIn = localStorage.getItem('dragon-reserve-opted-in') === 'true';
    const rawId = localStorage.getItem('dragon-sovereign-id');
    
    if (optedIn && rawId) {
        try {
            const id = JSON.parse(rawId);
            const reserveBal = parseFloat(localStorage.getItem('dragon-reserve-balance') || '0');
            
            badge.innerText = "ACTIVE";
            badge.style.background = "rgba(0, 229, 255, 0.15)";
            badge.style.color = "var(--highlight)";
            
            desc.innerHTML = `Sovereign Reserve Linked: <strong>'${id.alias.toUpperCase()}'</strong>.<br/>Pending Launch Balance: <strong>${reserveBal} HN</strong>. Off-grid earnings are synced and preserved for launch.`;
            
            didDisplay.style.display = "block";
            didDisplay.innerText = `DID: ${id.did}`;
            
            optinBtn.innerText = "⚡ RE-SYNC RESERVE BALANCE";
            optinBtn.style.background = "rgba(0, 229, 255, 0.04)";
        } catch (e) {
            console.error("Error updating reserve UI:", e);
        }
    } else {
        badge.innerText = "INACTIVE";
        badge.style.background = "rgba(255, 0, 128, 0.15)";
        badge.style.color = "var(--alert)";
        
        desc.innerText = "Opt-in to the Sovereign Reserve to save your earnings from radio caller rewards, junk submissions, and cleanup pledges ready for note launch.";
        didDisplay.style.display = "none";
        
        optinBtn.innerText = "⚡ LINK SOVEREIGN DID";
        optinBtn.style.background = "rgba(0, 229, 255, 0.08)";
    }
}

function addEarningsToReserve(amount) {
    if (localStorage.getItem('dragon-reserve-opted-in') === 'true') {
        let reserveBal = parseFloat(localStorage.getItem('dragon-reserve-balance') || '0');
        reserveBal += amount;
        localStorage.setItem('dragon-reserve-balance', reserveBal);
        updateReserveUI();
        log(`Reserve account accumulated +${amount} HN (Reserve Total: ${reserveBal} HN)`, "RESERVE");
    }
}

// Depot Upcycling Junk Donations
window.donateJunk = function() {
    const junkItem = prompt("Enter the upcyclable junk you wish to donate to the community depot (e.g. rusty tools, glass bottles, broken electronics):");
    if (!junkItem) return;
    
    const reward = 5;
    addEarningsToReserve(reward);
    
    log(`Donated "${junkItem}" to the depot. Rewarded with 5 H-Notes!`, "SUCCESS");
    appendRadioLine("DEPOT", `Received junk donation: "${junkItem}"! Mapped to off-grid ledger. Reward note issued.`, "🎁", "var(--highlight)");
};

// Restorative Ecology cleanup pledges
window.pledgeCleanup = function() {
    const cost = 5;
    const optedIn = localStorage.getItem('dragon-reserve-opted-in') === 'true';
    const reserveBal = parseFloat(localStorage.getItem('dragon-reserve-balance') || '0');
    
    if (!optedIn) {
        log("Pledge failed: Link your Sovereign DID to participate in cleanup pledges.", "WARN");
        return;
    }
    
    if (reserveBal < cost) {
        log(`Pledge failed: Insufficient Reserve balance (5 HN required).`, "WARN");
        appendRadioLine("RADIO", "Your reserve balance is too low to fund a cleanup pledge. Go donate some junk!", "📻", "var(--alert)");
        return;
    }
    
    // Deduct
    const newBal = reserveBal - cost;
    localStorage.setItem('dragon-reserve-balance', newBal);
    updateReserveUI();
    
    log(`Pledged 5 HN to the Matariki Beach Clean Up Fund!`, "SUCCESS");
    appendRadioLine("TIMOTHY DWEN", `Pledging 5 HN to help cleanup and restore the local ecosystem. Keep it pure!`, "🧹", "#ffffff");
    
    setTimeout(() => {
        appendRadioLine("HOST TIM", `Mīharo! (Amazing!) Cleanup pledge received. 5 HN routed to the restoration wallet.`, "📻", "var(--highlight)");
    }, 1500);
};

// --- SOLFEGGIO RESONANCE INJECTOR AUDIO ENGINE ---

window.toggleResonanceInjector = function() {
    initAudioPipeline();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const select = document.getElementById('injector-freq-select');
    const toggleBtn = document.getElementById('btn-toggle-injector');
    const statusEl = document.getElementById('injector-status');
    if (!select || !toggleBtn || !statusEl) return;
    
    const freq = parseInt(select.value);
    
    if (isInjectorActive) {
        // Fade out and disconnect oscillator
        if (injectorGainNode) {
            injectorGainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
        }
        setTimeout(() => {
            if (injectorOsc) {
                injectorOsc.stop();
                injectorOsc.disconnect();
                injectorOsc = null;
            }
        }, 350);
        
        isInjectorActive = false;
        toggleBtn.innerText = "INJECT WAVE";
        toggleBtn.style.background = "rgba(212,175,55,0.08)";
        statusEl.innerText = "OFF-LINE";
        statusEl.style.background = "rgba(255,255,255,0.05)";
        statusEl.style.color = "var(--text)";
        log("Solfeggio Resonance Wave injection terminated.", "SYSTEM");
    } else {
        // Start oscillator
        if (injectorOsc) {
            injectorOsc.stop();
            injectorOsc.disconnect();
        }
        
        injectorOsc = audioCtx.createOscillator();
        injectorOsc.type = 'sine';
        injectorOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        injectorOsc.connect(injectorGainNode);
        
        injectorOsc.start();
        injectorGainNode.gain.linearRampToValueAtTime(injectorVol, audioCtx.currentTime + 0.3);
        
        isInjectorActive = true;
        toggleBtn.innerText = "MUTE WAVE";
        toggleBtn.style.background = "rgba(0, 229, 255, 0.15)";
        statusEl.innerText = "INJECTING ON-AIR";
        statusEl.style.background = "rgba(0, 229, 255, 0.15)";
        statusEl.style.color = "var(--highlight)";
        log(`Solfeggio Injection active: +${freq}Hz frequency wave mixed into broadcast feed.`, "CRYPT");
    }
};

window.updateInjectorFrequency = function() {
    if (!isInjectorActive || !injectorOsc || !audioCtx) return;
    const select = document.getElementById('injector-freq-select');
    if (!select) return;
    const freq = parseInt(select.value);
    injectorOsc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    log(`Solfeggio frequency shifted to: ${freq}Hz on-air`, "CRYPT");
};

window.updateInjectorGain = function(val) {
    injectorVol = parseFloat(val) / 100;
    const label = document.getElementById('injector-gain-label');
    if (label) label.innerText = `${val}%`;
    
    if (isInjectorActive && injectorGainNode && audioCtx) {
        injectorGainNode.gain.linearRampToValueAtTime(injectorVol, audioCtx.currentTime + 0.1);
    }
};

function loadPersonalSpiritualFrequency() {
    const rawId = localStorage.getItem('dragon-sovereign-id');
    if (!rawId) return;
    try {
        const id = JSON.parse(rawId);
        if (id.resonance) {
            const cleanFreq = id.resonance.replace('Hz', '').trim();
            const select = document.getElementById('injector-freq-select');
            if (select) {
                select.value = cleanFreq;
                log(`Sovereign DID detected. Pre-selected personal spiritual frequency: ${cleanFreq}Hz.`, "SUCCESS");
            }
        }
    } catch (e) {}
}

// Canvas Waveform Visualizer
function setupWaveformVisualizer() {
    const canvas = document.getElementById('waveformCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = activeTheme === 'matrix' ? '#00ff41' : 
                          activeTheme === 'cyber' ? '#ff0080' : 
                          activeTheme === 'amber' ? '#ffaa00' : '#d4af37';
                          
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        if (analyserNode && audioCtx && audioCtx.state === 'running') {
            const bufferLength = analyserNode.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserNode.getByteTimeDomainData(dataArray);
            
            const sliceWidth = canvas.width / bufferLength;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * (canvas.height / 2);
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                x += sliceWidth;
            }
        } else {
            // Fallback simulation
            const sliceWidth = canvas.width / 100;
            let x = 0;
            for (let i = 0; i < 100; i++) {
                const factor = radioPlayer && !radioPlayer.paused ? Math.sin(i * 0.15 + performance.now() * 0.012) * Math.cos(i * 0.05 + performance.now() * 0.008) : Math.sin(i * 0.05 + performance.now() * 0.002);
                const amplitude = radioPlayer && !radioPlayer.paused ? 22 : 4;
                const y = (canvas.height / 2) + factor * amplitude;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                x += sliceWidth;
            }
        }
        ctx.stroke();
        requestAnimationFrame(draw);
    }
    
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 60;
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    draw();
}

// Dragon 9 Temporal Clock Ticker
function tick() {
    const now = new Date();
    
    // Simulated Māori Lunar 26h timing sweep or Standard drift sweep
    const formatTime = (d) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    const micro = Math.floor((performance.now() % 1000) * 1000).toString().padStart(6, '0');
    
    if (document.getElementById('clockReal')) {
        document.getElementById('clockReal').innerText = formatTime(now);
    }
    if (document.getElementById('clockMilli')) {
        document.getElementById('clockMilli').innerText = `.${micro}`;
    }
    
    // D9 Time (Rotates around standard root calibration)
    const root = Math.floor((now.getMinutes() / 15) % 10) + 1;
    if (document.getElementById('clockD9')) {
        document.getElementById('clockD9').innerText = formatTime(now);
    }
    if (document.getElementById('rootDisplay')) {
        document.getElementById('rootDisplay').innerText = `ROOT: ${root}`;
    }
    
    currentRoot = root;
    currentD9Time = formatTime(now);
    
    requestAnimationFrame(tick);
}

// Setup radio callers
function tickMockCaller() {
    // 35% chance to post every 18 seconds
    if (Math.random() < 0.35) {
        triggerMockCallerResponse();
    }
}

// Start
loadRadioSubmissions();
connectWebSocket();
updateReserveUI();
loadPersonalSpiritualFrequency();
setupWaveformVisualizer();
tick();

// Rotating radio segments every 30 seconds
setInterval(rotateRadioSegment, 30000);
// Caller simulations checking every 18 seconds
setInterval(tickMockCaller, 18000);

log("Broadcast wave receiver initialized. Waveform tuner active.", "SYSTEM");
