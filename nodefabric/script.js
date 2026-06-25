import { getDragonSync } from '../scripts/math.js';
import { countryNodes } from '../scripts/data.js';

// --- CONFIG & GEOGRAPHIC COORDINATES ---
const nodeCoordinates = {
    'Chatham Islands': {x: 895, y: 440},
    'Auckland': {x: 880, y: 410},
    'Okiwi': {x: 883, y: 405},
    'Wellington Harbor': {x: 885, y: 428},
    'Wellington': {x: 882, y: 425},
    'Gisborne': {x: 887, y: 418},
    'Christchurch': {x: 878, y: 435},
    'Sydney': {x: 830, y: 390},
    'Melbourne': {x: 825, y: 405},
    'Tokyo': {x: 780, y: 180},
    'Seoul': {x: 750, y: 160},
    'Singapore': {x: 700, y: 300},
    'Hong Kong': {x: 730, y: 230},
    'Perth': {x: 710, y: 390},
    'Bangkok': {x: 670, y: 260},
    'Jakarta': {x: 690, y: 330},
    'Mumbai': {x: 610, y: 260},
    'Dubai': {x: 560, y: 220},
    'Moscow': {x: 530, y: 120},
    'Nairobi': {x: 520, y: 320},
    'Cairo': {x: 500, y: 220},
    'Cape Town': {x: 470, y: 390},
    'Paris': {x: 440, y: 140},
    'London': {x: 420, y: 120},
    'Casablanca': {x: 410, y: 200},
    'Azores': {x: 350, y: 180},
    'Rio de Janeiro': {x: 320, y: 380},
    'Sao Paulo': {x: 330, y: 375},
    'Buenos Aires': {x: 280, y: 420},
    'Santiago': {x: 230, y: 430},
    'New York': {x: 270, y: 170},
    'Miami': {x: 260, y: 220},
    'Chicago': {x: 210, y: 160},
    'Mexico City': {x: 180, y: 250},
    'Denver': {x: 160, y: 170},
    'Phoenix': {x: 150, y: 190},
    'Seattle': {x: 130, y: 140},
    'Los Angeles': {x: 130, y: 190},
    'Vancouver': {x: 120, y: 130},
    'Anchorage': {x: 80, y: 90},
    'Honolulu': {x: 80, y: 240},
    'Tahiti': {x: 140, y: 370},
    'American Samoa': {x: 930, y: 330},
    'Fiji': {x: 900, y: 370},
    'Brisbane': {x: 840, y: 350},
    'Berlin': {x: 460, y: 130}
};

// --- SYSTEM STATE ---
const state = {
    theme: 'classic',
    soundEnabled: false,
    audioCtx: null,
    oscGroup: null,
    nodes: [],
    links: [],
    selectedNodeIndex: null,
    activePulses: 0,
    packetCounter: 0,
    volumetrics: 0,
    lastTime: null,
    calibrating: false
};

// --- DOM ELEMENTS ---
const dom = {
    masterClock: document.getElementById('master-clock'),
    masterMilli: document.getElementById('master-milli'),
    masterStateBadge: document.getElementById('master-state-badge'),
    statOnlineRatio: document.getElementById('stat-online-ratio'),
    statOnlineBar: document.getElementById('stat-online-bar'),
    statSyncIntegrity: document.getElementById('stat-sync-integrity'),
    statSyncBar: document.getElementById('stat-sync-bar'),
    statVolume: document.getElementById('stat-volume'),
    statVolumeBar: document.getElementById('stat-volume-bar'),
    consensusRoot: document.getElementById('consensus-root'),
    nodeListContainer: document.getElementById('node-list-container'),
    terminalLog: document.getElementById('terminal-log'),
    logCounter: document.getElementById('log-counter'),
    inspectName: document.getElementById('inspect-name'),
    inspectIp: document.getElementById('inspect-ip'),
    inspectD9Time: document.getElementById('inspect-d9-time'),
    inspectPeers: document.getElementById('inspect-peers'),
    inspectLatency: document.getElementById('inspect-latency'),
    inspectDeviation: document.getElementById('inspect-deviation'),
    inspectKillBtn: document.getElementById('inspect-kill-btn'),
    inspectSyncBtn: document.getElementById('inspect-sync-btn'),
    selectedNodeBadge: document.getElementById('selected-node-badge'),
    svg: document.getElementById('fabric-svg'),
    linksGroup: document.getElementById('links-group'),
    nodesGroup: document.getElementById('nodes-group'),
    pulsesGroup: document.getElementById('pulses-group'),
    soundToggle: document.getElementById('sound-toggle'),
    nodeSearch: document.getElementById('node-search')
};

// --- INITIALIZE NODES & Programmatic Links ---
function initFabricTopology() {
    // 1. Setup Node Objects with 360 nodes representing full circle of resonance
    const numReal = countryNodes.length;
    const nodesPerReal = 10; // 360 / 36 = 10
    state.nodes = [];

    for (let i = 0; i < numReal; i++) {
        const startNode = countryNodes[i];
        const endNode = countryNodes[(i + 1) % numReal];
        
        const coordsStart = nodeCoordinates[startNode.n] || {x: 500, y: 250};
        const coordsEnd = nodeCoordinates[endNode.n] || {x: 500, y: 250};
        
        for (let j = 0; j < nodesPerReal; j++) {
            const fraction = j / nodesPerReal;
            
            // Interpolate coordinates on 2D map
            const x = coordsStart.x + (coordsEnd.x - coordsStart.x) * fraction;
            const y = coordsStart.y + (coordsEnd.y - coordsStart.y) * fraction;
            
            // Interpolate offsets with 24-hour wrap logic matching app.js
            let startO = startNode.o;
            let endO = endNode.o;
            if (Math.abs(endO - startO) > 12) {
                if (startO > endO) endO += 24;
                else startO += 24;
            }
            let interpolatedOffset = startO + (endO - startO) * fraction;
            if (interpolatedOffset > 14) interpolatedOffset -= 24;
            if (interpolatedOffset < -12) interpolatedOffset += 24;
            interpolatedOffset = Math.round(interpolatedOffset * 4) / 4; // nearest 15 mins
            
            const ip = `10.9.${Math.floor(Math.abs(interpolatedOffset))}.${Math.floor(10 + (i * 6.7) + j)}`;
            
            if (j === 0) {
                state.nodes.push({
                    name: startNode.n,
                    offset: startNode.o,
                    x: coordsStart.x,
                    y: coordsStart.y,
                    status: 'online',
                    latency: Math.floor(20 + Math.random() * 40),
                    drift: (Math.random() - 0.5) * 0.008,
                    ip: ip,
                    packetsCount: 0,
                    peers: [],
                    isVirtual: false
                });
            } else {
                state.nodes.push({
                    name: `Node ${startNode.n.slice(0, 3).toUpperCase()}-${String(j).padStart(2, '0')}`,
                    offset: interpolatedOffset,
                    x: x,
                    y: y,
                    status: 'online',
                    latency: Math.floor(30 + Math.random() * 50),
                    drift: (Math.random() - 0.5) * 0.012,
                    ip: ip,
                    packetsCount: 0,
                    peers: [],
                    isVirtual: true
                });
            }
        }
    }

    // 2. Programmatic Mesh Generation (connect to nearest 3 neighbors)
    for (let i = 0; i < state.nodes.length; i++) {
        const nodeA = state.nodes[i];
        const distances = [];
        
        for (let k = 0; k < state.nodes.length; k++) {
            if (k === i) continue;
            const nodeB = state.nodes[k];
            const d = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
            distances.push({ index: k, dist: d });
        }
        
        distances.sort((a, b) => a.dist - b.dist);

        // Connect to nearest 3 peers
        let connectedCount = 0;
        for (let j = 0; j < distances.length && connectedCount < 3; j++) {
            const peerIdx = distances[j].index;
            if (!nodeA.peers.includes(peerIdx)) {
                nodeA.peers.push(peerIdx);
            }
            if (!state.nodes[peerIdx].peers.includes(i)) {
                state.nodes[peerIdx].peers.push(i);
            }

            // Link object creation (avoid duplicates)
            const linkExists = state.links.some(l => 
                (l.source === i && l.target === peerIdx) || 
                (l.source === peerIdx && l.target === i)
            );
            if (!linkExists) {
                state.links.push({ source: i, target: peerIdx });
            }
            connectedCount++;
        }
    }
}

// --- TERMINAL LOG SYSTEM ---
let logCount = 0;
function log(msg, type = 'system') {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    
    let typeClass = 'log-system';
    if (type === 'success') typeClass = 'log-success';
    else if (type === 'warn') typeClass = 'log-warn';
    else if (type === 'error') typeClass = 'log-error';

    entry.innerHTML = `<span class="log-time">[${timeStr}]</span><span class="${typeClass}">[${type.toUpperCase()}]</span> ${msg}`;
    dom.terminalLog.appendChild(entry);
    dom.terminalLog.scrollTop = dom.terminalLog.scrollHeight;
    
    logCount++;
    dom.logCounter.innerText = `LOGS: ${logCount}`;

    // Clean up older logs if needed
    if (dom.terminalLog.childNodes.length > 150) {
        dom.terminalLog.removeChild(dom.terminalLog.firstChild);
    }
}

// --- WEB AUDIO SYNTHESIS ---
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
        log("Ambient node transceiver sound synth initialized.", "success");
    } else {
        dom.soundToggle.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        dom.soundToggle.style.boxShadow = 'none';
        log("Synth audio silenced.", "system");
    }
};

function playBeep(freq, type = 'sine', duration = 0.05, volume = 0.03) {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
        const osc = state.audioCtx.createOscillator();
        const gainNode = state.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, state.audioCtx.currentTime);
        gainNode.gain.setValueAtTime(volume, state.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(state.audioCtx.destination);
        osc.start();
        osc.stop(state.audioCtx.currentTime + duration);
    } catch (e) {
        console.error(e);
    }
}

function playCalibrationSweep() {
    if (!state.soundEnabled || !state.audioCtx) return;
    try {
        const osc = state.audioCtx.createOscillator();
        const gainNode = state.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, state.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, state.audioCtx.currentTime + 1.2);
        
        gainNode.gain.setValueAtTime(0.04, state.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.0001, state.audioCtx.currentTime + 1.2);

        osc.connect(gainNode);
        gainNode.connect(state.audioCtx.destination);
        osc.start();
        osc.stop(state.audioCtx.currentTime + 1.2);
    } catch (e) {
        console.error(e);
    }
}

function playFaultTone() {
    if (!state.soundEnabled || !state.audioCtx) return;
    playBeep(180, 'triangle', 0.3, 0.08);
    setTimeout(() => playBeep(120, 'triangle', 0.4, 0.08), 150);
}

// --- RENDER SVG FABRIC GRAPH ---
function renderFabricSVG() {
    // 1. Draw Links
    dom.linksGroup.innerHTML = '';
    state.links.forEach((link, idx) => {
        const s = state.nodes[link.source];
        const t = state.nodes[link.target];
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', s.x);
        line.setAttribute('y1', s.y);
        line.setAttribute('x2', t.x);
        line.setAttribute('y2', t.y);
        line.setAttribute('class', 'svg-link');
        line.setAttribute('id', `link-${idx}`);
        dom.linksGroup.appendChild(line);
    });

    // 2. Draw Nodes
    dom.nodesGroup.innerHTML = '';
    state.nodes.forEach((node, idx) => {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'svg-node');
        group.setAttribute('id', `node-grp-${idx}`);
        group.addEventListener('click', (e) => {
            e.stopPropagation();
            selectNode(idx);
        });

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', node.isVirtual ? '3' : '7');
        circle.setAttribute('id', `node-circle-${idx}`);
        group.appendChild(circle);
        
        dom.nodesGroup.appendChild(group);

        if (!node.isVirtual) {
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', node.x);
            label.setAttribute('y', node.y - 12);
            label.setAttribute('class', 'node-label');
            label.setAttribute('id', `node-lbl-${idx}`);
            label.textContent = node.name.toUpperCase();
            dom.nodesGroup.appendChild(label);
        }
    });
}

// --- RENDERING UPDATE (PER FRAME) ---
function updateGlowTheme() {
    state.nodes.forEach((node, idx) => {
        const circle = document.getElementById(`node-circle-${idx}`);
        if (!circle) return;

        if (node.status === 'offline') {
            circle.style.stroke = '#555';
            circle.style.fill = '#111';
        } else if (node.status === 'desynced') {
            circle.style.stroke = 'var(--alert)';
            circle.style.fill = 'rgba(255, 0, 128, 0.1)';
        } else {
            const syncTime = getMasterSyncTime();
            if (syncTime.isRelax) {
                circle.style.stroke = 'var(--amber-glow)';
                circle.style.fill = 'rgba(255, 170, 0, 0.08)';
            } else {
                circle.style.stroke = `hsl(${syncTime.hue}, 90%, 55%)`;
                circle.style.fill = `hsla(${syncTime.hue}, 90%, 55%, 0.05)`;
            }
        }

        if (state.selectedNodeIndex === idx) {
            circle.style.stroke = 'var(--highlight)';
            circle.style.strokeWidth = '3px';
        } else {
            circle.style.strokeWidth = '2px';
        }
    });

    state.links.forEach((link, idx) => {
        const line = document.getElementById(`link-${idx}`);
        if (!line) return;
        const s = state.nodes[link.source];
        const t = state.nodes[link.target];

        if (s.status === 'offline' || t.status === 'offline') {
            line.style.stroke = 'rgba(255,255,255,0.04)';
            line.classList.remove('active-pulse');
        } else {
            const syncTime = getMasterSyncTime();
            if (syncTime.isRelax) {
                line.style.stroke = 'var(--amber-glow)';
                line.style.strokeOpacity = '0.2';
                line.classList.remove('active-pulse');
            } else {
                line.style.stroke = 'var(--primary)';
                line.style.strokeOpacity = '0.35';
            }
        }
    });
}

// --- NODE SELECTION & DETAIL INSPECTION ---
function selectNode(index) {
    state.selectedNodeIndex = index;
    
    // Highlight Row in List
    const rows = document.querySelectorAll('.node-row');
    rows.forEach(r => r.classList.remove('active-row'));
    const activeRow = document.getElementById(`row-${index}`);
    if (activeRow) {
        activeRow.classList.add('active-row');
        activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Highlight Node in SVG Graph
    const nodes = document.querySelectorAll('.svg-node');
    nodes.forEach(n => n.classList.remove('focused'));
    const activeSvg = document.getElementById(`node-grp-${index}`);
    if (activeSvg) {
        activeSvg.classList.add('focused');
    }

    // Update Telemetry Panel
    const node = state.nodes[index];
    dom.selectedNodeBadge.innerText = node.name.substring(0, 8).toUpperCase();
    dom.inspectName.innerText = node.name;
    dom.inspectIp.innerText = node.ip;
    dom.inspectPeers.innerText = `${node.peers.length} Nodes`;
    dom.inspectLatency.innerText = `${node.latency} ms`;
    dom.inspectDeviation.innerText = `${node.drift >= 0 ? '+' : ''}${node.drift.toFixed(4)}s`;
    
    // Set Status Color
    if (node.status === 'offline') {
        dom.inspectName.style.color = '#555';
    } else if (node.status === 'desynced') {
        dom.inspectName.style.color = 'var(--alert)';
    } else {
        dom.inspectName.style.color = 'var(--accent)';
    }

    // Update Action Buttons State
    dom.inspectKillBtn.disabled = false;
    dom.inspectSyncBtn.disabled = node.status === 'offline';
    dom.inspectKillBtn.innerText = node.status === 'offline' ? '🚀 RESTORE' : '💥 SHUTDOWN';
    dom.inspectKillBtn.style.borderColor = node.status === 'offline' ? 'var(--highlight)' : 'var(--alert)';

    playBeep(440, 'sine', 0.04);
}

window.toggleSelectedNodeState = function() {
    if (state.selectedNodeIndex === null) return;
    const node = state.nodes[state.selectedNodeIndex];
    if (node.status === 'offline') {
        node.status = 'online';
        node.drift = (Math.random() - 0.5) * 0.012; // starts slightly desynced
        log(`Node '${node.name}' booted up. Connection handshakes complete. IP: ${node.ip}`, "success");
        playBeep(660, 'sine', 0.15, 0.05);
    } else {
        node.status = 'offline';
        node.drift = 0;
        log(`CRITICAL: Connection lost with Node '${node.name}'. Terminated routing threads.`, "error");
        playFaultTone();
    }
    
    // Refresh inspector UI & list
    selectNode(state.selectedNodeIndex);
    updateNodeListDOM();
};

window.triggerSingleNodeGossip = function() {
    if (state.selectedNodeIndex === null) return;
    const node = state.nodes[state.selectedNodeIndex];
    log(`Manually triggering gossip alignment sequence from '${node.name}'...`, "system");
    triggerPulseGossipAtNode(state.selectedNodeIndex);
};

// --- DYNAMIC LOGIC CLOCK RULES ---
function getMasterSyncTime() {
    return getDragonSync(new Date());
}

// --- REBUILD NODE LIST ---
function updateNodeListDOM() {
    const query = dom.nodeSearch ? dom.nodeSearch.value.trim().toLowerCase() : '';
    dom.nodeListContainer.innerHTML = '';
    state.nodes.forEach((node, idx) => {
        // Search filter: matching name or ip
        if (query && !node.name.toLowerCase().includes(query) && !node.ip.toLowerCase().includes(query)) {
            return;
        }

        const row = document.createElement('div');
        row.className = `node-row ${state.selectedNodeIndex === idx ? 'active-row' : ''} ${node.isVirtual ? 'virtual-node' : ''}`;
        row.id = `row-${idx}`;
        row.addEventListener('click', () => selectNode(idx));

        // Get local time for node
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const zTime = new Date(utc + (3600000 * node.offset));
        const zv = getDragonSync(zTime);

        // State Badge Dot
        let dotClass = 'status-online';
        if (node.status === 'offline') dotClass = 'status-offline';
        else if (node.status === 'desynced') dotClass = 'status-desynced';
        else if (zv.isRelax) dotClass = 'status-relax';

        const timeString = zv.isRelax ? "RELAX" : 
            `${String(zv.h).padStart(2,'0')}:${String(zv.m).padStart(2,'0')}`;

        row.innerHTML = `
            <div class="node-row-info">
                <div class="node-row-name">
                    <span class="status-dot ${dotClass}"></span>${node.name}
                </div>
                <div class="node-row-meta">UTC${node.offset >= 0 ? '+' : ''}${node.offset} | IP: ${node.ip}</div>
            </div>
            <div class="node-row-time" style="color: ${zv.isRelax ? 'var(--amber-glow)' : 'inherit'}">
                ${timeString}
            </div>
        `;
        dom.nodeListContainer.appendChild(row);
    });
}

// --- UPDATE LOOP MAIN ---
function mainTick() {
    const now = new Date();
    const v = getMasterSyncTime();
    const micro = Math.floor((performance.now() % 1000) * 1000).toString().padStart(6, '0');

    // Update Core Clock HUD
    dom.masterClock.innerText = v.isRelax ? "RELAX" : 
        `${String(v.h).padStart(2,'0')}:${String(v.m).padStart(2,'0')}:${String(v.s).padStart(2,'0')}`;
    dom.masterMilli.innerText = `.${micro}`;
    dom.consensusRoot.innerText = `CONSENSUS ROOT HASH: SHA-D9:${v.root}-${v.h}-${state.nodes.filter(n => n.status === 'online').length}`;

    // Periodic state updates (every second)
    const currentSec = now.getSeconds();
    if (state.lastTime !== currentSec) {
        state.lastTime = currentSec;
        
        // Randomly drift/jitter online nodes
        state.nodes.forEach(node => {
            if (node.status === 'online') {
                node.drift += (Math.random() - 0.5) * 0.0002;
                node.latency = Math.max(10, Math.min(150, node.latency + Math.floor((Math.random() - 0.5) * 10)));
                
                // If drift is too large, label as desynced
                if (Math.abs(node.drift) > 0.005 && node.status === 'online') {
                    node.status = 'desynced';
                    log(`WARNING: Node '${node.name}' drift variance exceeded threshold (+-0.005s). Entering desynced state.`, "warn");
                    playBeep(290, 'triangle', 0.15, 0.02);
                }
            }
        });

        // Compute global metrics
        const onlineCount = state.nodes.filter(n => n.status === 'online').length;
        const desyncedCount = state.nodes.filter(n => n.status === 'desynced').length;
        const offlineCount = state.nodes.filter(n => n.status === 'offline').length;

        // Ratio online
        dom.statOnlineRatio.innerText = `${onlineCount + desyncedCount} / ${state.nodes.length} ONLINE`;
        const onlinePct = ((onlineCount + desyncedCount) / state.nodes.length) * 100;
        dom.statOnlineBar.style.width = `${onlinePct}%`;
        dom.statOnlineBar.style.backgroundColor = onlinePct > 80 ? 'var(--highlight)' : (onlinePct > 50 ? 'var(--amber-glow)' : 'var(--alert)');

        // Integrity Pct
        const sumAbsDrift = state.nodes.reduce((sum, node) => sum + (node.status !== 'offline' ? Math.abs(node.drift) : 0), 0);
        const avgDrift = sumAbsDrift / Math.max(1, onlineCount + desyncedCount);
        const integrity = Math.max(0, Math.min(100, 100 - (avgDrift * 1500)));
        dom.statSyncIntegrity.innerText = `${integrity.toFixed(3)}%`;
        dom.statSyncBar.style.width = `${integrity}%`;
        dom.statSyncBar.style.backgroundColor = integrity > 98 ? 'var(--highlight)' : (integrity > 94 ? 'var(--amber-glow)' : 'var(--alert)');

        // Update active badge state
        if (v.isRelax) {
            dom.masterStateBadge.innerText = 'RELAX ACTIVE';
            dom.masterStateBadge.style.color = 'var(--amber-glow)';
        } else if (offlineCount > 12) {
            dom.masterStateBadge.innerText = 'SPLIT-BRAIN ERROR';
            dom.masterStateBadge.style.color = 'var(--alert)';
        } else if (desyncedCount > 6 || offlineCount > 4) {
            dom.masterStateBadge.innerText = 'INTEGRITY WARN';
            dom.masterStateBadge.style.color = 'var(--amber-glow)';
        } else {
            dom.masterStateBadge.innerText = 'SYNC STABLE';
            dom.masterStateBadge.style.color = 'var(--highlight)';
        }

        // Update volumetrics display
        const activePacketsCount = dom.pulsesGroup.childElementCount;
        state.volumetrics = Math.floor(activePacketsCount * 1.5 + (Math.random() * 5));
        dom.statVolume.innerText = `${state.volumetrics} P/S`;
        dom.statVolumeBar.style.width = `${Math.min(100, (state.volumetrics / 80) * 100)}%`;

        // Inspector values live update
        if (state.selectedNodeIndex !== null) {
            const sn = state.nodes[state.selectedNodeIndex];
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const zTime = new Date(utc + (3600000 * sn.offset));
            const zv = getDragonSync(zTime);
            dom.inspectD9Time.innerText = zv.isRelax ? "RELAX" : 
                `${String(zv.h).padStart(2,'0')}:${String(zv.m).padStart(2,'0')}:${String(zv.s).padStart(2,'0')}`;
            dom.inspectLatency.innerText = `${sn.latency} ms`;
            dom.inspectDeviation.innerText = `${sn.drift >= 0 ? '+' : ''}${sn.drift.toFixed(4)}s`;
        }

        // Refresh dynamic listing columns
        updateNodeListDOM();
    }

    // Refresh glowing maps lines
    updateGlowTheme();

    requestAnimationFrame(mainTick);
}

// --- BROADCAST SYNC GOSSIP INTERACTIVE ANIMATION ---
window.triggerGossipPulse = function() {
    let originIdx = state.selectedNodeIndex;
    if (originIdx === null) {
        // Pick an online node at random as fallback origin
        const onlineIndices = state.nodes
            .map((n, i) => n.status === 'online' ? i : null)
            .filter(n => n !== null);
        if (onlineIndices.length === 0) {
            log("ABORT: Cannot start gossip protocol. All nodes are offline.", "error");
            playFaultTone();
            return;
        }
        originIdx = onlineIndices[Math.floor(Math.random() * onlineIndices.length)];
    }
    
    const node = state.nodes[originIdx];
    if (node.status === 'offline') {
        log(`ABORT: Selected node '${node.name}' is offline. Gossip channel blocked.`, "error");
        playFaultTone();
        return;
    }

    log(`Initializing consensus gossip sweep from origin: '${node.name}' (IP: ${node.ip})`, "system");
    triggerPulseGossipAtNode(originIdx);
};

function triggerPulseGossipAtNode(originIdx) {
    const visited = new Set();
    const queue = [{ nodeIdx: originIdx, delay: 0 }];
    visited.add(originIdx);
    
    let totalTransmissions = 0;
    
    // Gossip flood logic
    while (queue.length > 0) {
        const current = queue.shift();
        const node = state.nodes[current.nodeIdx];
        
        // Schedule local visual trigger & transmission to peer neighbors
        setTimeout(() => {
            if (node.status === 'offline') return;

            // Increment local node packet metrics
            node.packetsCount++;
            
            // Sync calibration: slightly nudge drift closer to 0 when sync gossiped
            node.drift = node.drift * 0.45;
            if (node.status === 'desynced' && Math.abs(node.drift) <= 0.003) {
                node.status = 'online';
                log(`Consensus achieved: Node '${node.name}' clock calibrated. State: ONLINE.`, "success");
            }

            // Visual feedback ring on node
            const circle = document.getElementById(`node-circle-${current.nodeIdx}`);
            if (circle) {
                const prevRadius = circle.getAttribute('r');
                circle.setAttribute('r', '15');
                circle.style.strokeWidth = '4px';
                setTimeout(() => {
                    circle.setAttribute('r', prevRadius);
                    circle.style.strokeWidth = state.selectedNodeIndex === current.nodeIdx ? '3px' : '2px';
                }, 300);
            }

            playBeep(350 + (current.nodeIdx % 36) * 12, 'sine', 0.05, 0.02);

            // Gossip to unvisited peers
            node.peers.forEach(peerIdx => {
                const peer = state.nodes[peerIdx];
                if (peer.status === 'offline' || visited.has(peerIdx)) return;
                
                visited.add(peerIdx);
                totalTransmissions++;

                // Trigger packet visual animation along link path
                animatePacketGossip(current.nodeIdx, peerIdx);

                // Add peer to gossip processing queue with a delay based on connection latency
                const latencyDelay = node.latency + peer.latency;
                queue.push({ nodeIdx: peerIdx, delay: current.delay + latencyDelay });
            });
        }, current.delay);
    }
}

// Animate a glowing packet dot sliding along connection line
function animatePacketGossip(fromIdx, toIdx) {
    const from = state.nodes[fromIdx];
    const to = state.nodes[toIdx];

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', from.x);
    circle.setAttribute('cy', from.y);
    circle.setAttribute('r', '3.5');
    
    const themeColor = getComputedStyle(document.body).getPropertyValue('--accent').trim();
    circle.setAttribute('fill', themeColor || '#d4af37');
    circle.setAttribute('style', `filter: drop-shadow(0 0 4px ${themeColor}); opacity: 0.9;`);

    dom.pulsesGroup.appendChild(circle);

    const startTime = performance.now();
    const duration = from.latency + to.latency + 200; // time in ms

    function anim(nowTime) {
        const elapsed = nowTime - startTime;
        const t = Math.min(1, elapsed / duration);

        const cx = from.x + (to.x - from.x) * t;
        const cy = from.y + (to.y - from.y) * t;
        
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);

        if (t < 1) {
            requestAnimationFrame(anim);
        } else {
            if (circle.parentNode) {
                circle.parentNode.removeChild(circle);
            }
        }
    }
    requestAnimationFrame(anim);
}

// --- ITERATIVE NETWORK CALIBRATION SWEEP ---
window.runCalibrationSweep = function() {
    if (state.calibrating) return;
    state.calibrating = true;
    
    const btn = document.getElementById('calib-btn');
    btn.disabled = true;

    log("LAUNCH: Calibrate sequence initiated. Broad-spectrum phase realignment...", "system");
    playCalibrationSweep();

    let nodeIdx = 0;
    const interval = setInterval(() => {
        // Find next online/desynced node to calibrate
        while (nodeIdx < state.nodes.length && state.nodes[nodeIdx].status === 'offline') {
            nodeIdx++;
        }

        if (nodeIdx < state.nodes.length) {
            const node = state.nodes[nodeIdx];
            const oldDrift = node.drift;
            node.drift = 0; // zero drift
            if (node.status === 'desynced') {
                node.status = 'online';
            }

            // Graphic ring ripple
            const circle = document.getElementById(`node-circle-${nodeIdx}`);
            if (circle) {
                circle.setAttribute('r', '18');
                circle.style.stroke = 'var(--highlight)';
                const targetR = node.isVirtual ? '3' : '7';
                setTimeout(() => {
                    circle.setAttribute('r', targetR);
                }, 400);
            }

            log(`Calibrated Node [${node.name}]: drift corrected from ${oldDrift >= 0 ? '+' : ''}${oldDrift.toFixed(5)}s to +0.00000s.`, "success");
            playBeep(300 + (nodeIdx % 40) * 15, 'triangle', 0.08, 0.03);
            
            nodeIdx++;
        } else {
            clearInterval(interval);
            state.calibrating = false;
            btn.disabled = false;
            log("SUCCESS: Calibration protocols successfully integrated across active fabric.", "success");
            playBeep(880, 'sine', 0.3, 0.05);
            updateNodeListDOM();
        }
    }, Math.max(10, Math.floor(4000 / state.nodes.length)));
};

// --- MULTIPLE NODE PACKET FLOOD TEST ---
window.floodNetworkPackets = function() {
    log("FLOOD: Injecting high-density routing packets to test channel bandwidth...", "warn");
    playBeep(600, 'sawtooth', 0.15, 0.04);
    setTimeout(() => playBeep(800, 'sawtooth', 0.15, 0.04), 100);

    // Run 5 random gossip pulses with offset delays
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            const onlineNodes = state.nodes
                .map((n, idx) => n.status === 'online' ? idx : null)
                .filter(n => n !== null);
            if (onlineNodes.length > 0) {
                const randOrigin = onlineNodes[Math.floor(Math.random() * onlineNodes.length)];
                log(`Flood burst source ${i+1}: Node '${state.nodes[randOrigin].name}'`, "system");
                triggerPulseGossipAtNode(randOrigin);
            }
        }, i * 400);
    }
};

// --- HEAL ALL FAULTS ---
window.healAllFaults = function() {
    log("HEAL: Healing network fabric topology. Resetting failure buffers...", "system");
    playBeep(520, 'sine', 0.25, 0.06);

    state.nodes.forEach((node, idx) => {
        if (node.status === 'offline' || node.status === 'desynced') {
            node.status = 'online';
            node.drift = 0;
            
            // ripple flash
            const circle = document.getElementById(`node-circle-${idx}`);
            if (circle) {
                circle.setAttribute('r', '15');
                const targetR = node.isVirtual ? '3' : '7';
                setTimeout(() => circle.setAttribute('r', targetR), 300);
            }
            log(`Healed & Reconnected: Node '${node.name}'`, "success");
        }
    });

    // Refresh selected inspect detail if any
    if (state.selectedNodeIndex !== null) {
        selectNode(state.selectedNodeIndex);
    }
    
    updateNodeListDOM();
};

// --- THEME SYNC SYSTEM ---
window.setTheme = function(theme) {
    document.body.className = `theme-${theme}`;
    state.theme = theme;
    localStorage.setItem('dragon-theme', theme);
    
    // Toggle active theme button UI
    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.classList.contains(`btn-${theme}`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    log(`Interface configuration adjusted: Theme: '${theme.toUpperCase()}'`, "system");
    
    // Sync SVG packet colors immediately
    setTimeout(updateGlowTheme, 30);
};

// --- WINDOW INITIALIZATION ---
function init() {
    // 1. Sync theme configuration with browser cache
    const savedTheme = localStorage.getItem('dragon-theme') || 'classic';
    window.setTheme(savedTheme);

    // 2. Build model topology structure & draw on screen
    initFabricTopology();
    renderFabricSVG();
    
    // 3. Initialize nodes tables listing
    updateNodeListDOM();

    if (dom.nodeSearch) {
        dom.nodeSearch.addEventListener('input', () => {
            updateNodeListDOM();
        });
    }

    // 4. Start main animation ticking frames
    mainTick();

    log("Fabric coupled. Waiting for clock pulse handshakes...", "success");
}

window.addEventListener('resize', () => {
    // Redraw or clean boundaries if needed (viewBox handles scaling automatically)
});

// Run Init
init();
