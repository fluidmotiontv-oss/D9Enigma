import * as THREE from '../three.module.min.js';
import { STATIONS, CONFIG } from './data.js';
import { getDragonSync, getLemniscatePosition } from './math.js';

const state = {
    lastTotalSeconds: -1,
    userOffset: -(new Date().getTimezoneOffset() / 60),
    focusedOffset: null,
    focusedName: null,
    activeTheme: 'classic',
    soundEnabled: false,
    audioCtx: null,
    mainOsc: null,
    isRelax: false,
    nodes: []
};

const dom = {
    locationTag: document.getElementById('location-tag'),
    bgCal: document.getElementById('bg-cal'),
    dragonHub: document.getElementById('dragon-hub'),
    hHand: document.getElementById('hHand'),
    mHand: document.getElementById('mHand'),
    sHand: document.getElementById('sHand'),
    digitalSync: document.getElementById('digital-sync'),
    milliSync: document.getElementById('milli-sync'),
    rootDisplay: document.getElementById('root-display'),
    cycleTracker: document.getElementById('cycle-tracker'),
    statusMode: document.getElementById('status-mode'),
    soundToggle: document.getElementById('sound-toggle'),
    container: document.getElementById('vortex-container')
};

// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 25;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
dom.container.appendChild(renderer.domElement);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function init3D() {
    STATIONS.forEach((s, i) => {
        const t = (i / STATIONS.length) * Math.PI * 2;
        const pos = getLemniscatePosition(t);
        
        const geometry = new THREE.SphereGeometry(0.4, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.6 });
        const sphere = new THREE.Mesh(geometry, material);
        
        sphere.position.set(pos.x, pos.y, pos.z);
        sphere.userData = { station: s, originalT: t };
        
        scene.add(sphere);
        state.nodes.push(sphere);
    });

    // Add infinity path line
    const points = [];
    for (let t = 0; t <= Math.PI * 2; t += 0.05) {
        const p = getLemniscatePosition(t);
        points.push(new THREE.Vector3(p.x, p.y, p.z));
    }
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00e5ff, opacity: 0.1, transparent: true });
    const line = new THREE.LineLoop(lineGeometry, lineMaterial);
    scene.add(line);
}

// --- INTERACTION ---
window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('click', () => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(state.nodes);
    
    if (intersects.length > 0) {
        const s = intersects[0].object.userData.station;
        setFocus(s.n, s.o);
    } else {
        setFocus(null, null);
    }
});

function setFocus(name, offset) {
    state.focusedName = name;
    state.focusedOffset = offset;
    dom.locationTag.innerText = name ? `FOCUSED: ${name} (UTC${offset >= 0 ? '+' : ''}${offset})` : 
        `LOCAL OFFSET: UTC${state.userOffset >= 0 ? '+' : ''}${state.userOffset} | 60S / 54M`;
    dom.locationTag.style.color = name ? 'var(--highlight)' : 'var(--accent)';
    state.lastTotalSeconds = -1;
}

// --- AUDIO & THEME (Integrated from previous refactor) ---
window.setTheme = function(theme) {
    document.body.className = `theme-${theme}`;
    state.activeTheme = theme;
    localStorage.setItem('dragon-theme', theme);
    updateNodeColors();
};

function updateNodeColors() {
    const color = getComputedStyle(document.body).getPropertyValue('--accent').trim();
    state.nodes.forEach(node => {
        node.material.color.set(color);
    });
}

window.toggleSound = function() {
    if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        initAudio();
    }
    state.soundEnabled = !state.soundEnabled;
    dom.soundToggle.innerText = state.soundEnabled ? '🔊' : '🔇';
    dom.soundToggle.style.opacity = state.soundEnabled ? '1' : '0.6';
    if (state.soundEnabled) {
        state.audioCtx.resume();
        if (state.mainOsc) state.mainOsc.connect(state.audioCtx.destination);
    } else {
        if (state.mainOsc) state.mainOsc.disconnect();
    }
};

function initAudio() {
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(43.2, state.audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, state.audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.start();
    state.mainOsc = gain;
    if (!state.soundEnabled) gain.disconnect();
}

function playTick(isRelax) {
    if (!state.soundEnabled || !state.audioCtx) return;
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isRelax ? 220 : 440, state.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1, state.audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.05, state.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.start();
    osc.stop(state.audioCtx.currentTime + 0.05);
}

function playTransition(enteringRelax) {
    if (!state.soundEnabled || !state.audioCtx) return;
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(enteringRelax ? 440 : 220, state.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(enteringRelax ? 110 : 880, state.audioCtx.currentTime + 1);
    gain.gain.setValueAtTime(0.1, state.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, state.audioCtx.currentTime + 1);
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.start();
    osc.stop(state.audioCtx.currentTime + 1);
}

// --- UPDATE LOOP ---
function updateUI(v, now) {
    dom.digitalSync.innerText = v.isRelax ? "RELAX" : 
        `${String(v.h).padStart(2,'0')}:${String(v.m).padStart(2,'0')}:${String(v.s).padStart(2,'0')}`;
    dom.rootDisplay.innerText = `ROOT: ${v.root}`;
    for(let i=1; i<=9; i++) {
        const dot = document.getElementById(`root-${i}`);
        if (dot) dot.className = `cycle-dot${i === v.root ? ' active' : ''}`;
    }

    const hDeg = (((v.h % 13) + (v.m / 54)) / 13) * 360;
    const mDeg = (v.m / 54) * 360;
    const sDeg = (v.s / 60) * 360;

    dom.hHand.style.transform = `rotate(${hDeg}deg)`;
    dom.mHand.style.transform = `rotate(${mDeg}deg)`;
    dom.sHand.style.transform = `rotate(${sDeg}deg)`;

    if(v.isRelax) {
        dom.dragonHub.style.borderColor = 'var(--amber-glow)';
        dom.statusMode.innerText = 'RELAX MODE';
        dom.statusMode.style.color = 'var(--amber-glow)';
    } else {
        dom.dragonHub.style.borderColor = 'var(--primary)';
        dom.statusMode.innerText = 'LOCAL SYNC ACTIVE';
        dom.statusMode.style.color = 'var(--accent)';
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.0005;
    
    // Animate Nodes
    state.nodes.forEach((node, i) => {
        const t = node.userData.originalT + time * 0.2;
        const pos = getLemniscatePosition(t);
        node.position.set(pos.x, pos.y, pos.z);
        
        // Highlight focused node
        if (state.focusedName === node.userData.station.n) {
            node.scale.set(1.5, 1.5, 1.5);
            node.material.opacity = 1;
        } else {
            node.scale.set(1, 1, 1);
            node.material.opacity = 0.6;
        }
    });

    scene.rotation.y += 0.001; // Gentle scene rotation
    
    const now = new Date();
    const totalSeconds = Math.floor(now.getTime() / 1000);
    const micro = Math.floor((performance.now() % 1000) * 1000).toString().padStart(6, '0');
    dom.milliSync.innerText = `.${micro}`;

    if (totalSeconds !== state.lastTotalSeconds) {
        state.lastTotalSeconds = totalSeconds;
        let activeDate = now;
        if (state.focusedOffset !== null) {
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            activeDate = new Date(utc + (3600000 * state.focusedOffset));
        }
        const v = getDragonSync(activeDate);
        if (v.isRelax !== state.isRelax) {
            playTransition(v.isRelax);
            state.isRelax = v.isRelax;
        }
        playTick(v.isRelax);
        updateUI(v, now);
    }

    renderer.render(scene, camera);
}

// --- INIT ---
function init() {
    const savedTheme = localStorage.getItem('dragon-theme') || 'classic';
    window.setTheme(savedTheme);

    for(let i=1; i<=28; i++) { 
        const d = document.createElement('div'); 
        d.innerText = i; 
        dom.bgCal.appendChild(d); 
    }

    for(let i=1; i<=9; i++) {
        const d = document.createElement('div');
        d.className = 'cycle-dot';
        d.id = `root-${i}`;
        dom.cycleTracker.appendChild(d);
    }

    for (let i = 0; i < 13; i++) {
        const m = document.createElement('div'); 
        m.className = 'marker-pair';
        const angle = i * (360 / 13); 
        m.style.transform = `rotate(${angle}deg)`;
        const tN = i === 0 ? "13/0" : i; 
        const bN = i === 0 ? "26" : (i + 13);
        m.innerHTML = `<div class="label-wrap" style="transform: rotate(-${angle}deg);">
                            <div class="hour-top">${tN}</div>
                            <div class="hour-bottom">${bN}</div>
                        </div>`;
        dom.dragonHub.appendChild(m);
    }

    init3D();
    animate();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
