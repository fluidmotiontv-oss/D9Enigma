import * as THREE from '../three.module.min.js';
import { countryNodes, CONFIG } from './data.js';
import { getDragonSync, getLunarDay, getLemniscatePosition } from './math.js';
import { bus } from './bus.js';

const state = {
    lastTotalSeconds: -1,
    lastH: -1,
    userOffset: -(new Date().getTimezoneOffset() / 60),
    focusedOffset: null,
    focusedName: null,
    activeTheme: 'classic',
    soundEnabled: false,
    audioCtx: null,
    mainOsc: null,
    synthNodes: null,
    isRelax: false,
    nodes: [],
    logoMesh: null,
    textures: {},
    starfield: null,
    starfieldVelocities: [],
    infinityLine: null,
    flowParticles: null,
    flowTs: [],
    stationNodes: []
};

const textureLoader = new THREE.TextureLoader();

window.timeDriftOffset = 0;

function syncWithGitHubClockTime() {
    const indicator = document.getElementById('gh-sync-indicator');
    if (indicator) {
        indicator.innerText = "GH-SYNC: RETRIEVING...";
        indicator.style.borderColor = 'var(--highlight)';
        indicator.style.color = 'var(--highlight)';
    }
    fetch('https://fluidmotiontv-oss.github.io/Fluidmotiontv-clock/', { method: 'HEAD', cache: 'no-store' })
        .then(response => {
            const serverDateStr = response.headers.get('Date');
            if (serverDateStr) {
                const serverTime = new Date(serverDateStr).getTime();
                const localTime = Date.now();
                if (!isNaN(serverTime)) {
                    window.timeDriftOffset = serverTime - localTime + 50;
                    console.log(`[GITHUB SYNC] Server-client time drift offset calibrated: ${window.timeDriftOffset}ms`);
                    if (indicator) {
                        indicator.innerText = `GH-SYNC: ${window.timeDriftOffset >= 0 ? '+' : ''}${window.timeDriftOffset}MS`;
                        indicator.style.borderColor = 'var(--accent)';
                        indicator.style.color = 'var(--accent)';
                        indicator.style.opacity = '1';
                    }
                } else {
                    window.timeDriftOffset = 0;
                    console.warn("[GITHUB SYNC] Invalid server date format parsed, using local system clock.");
                    if (indicator) {
                        indicator.innerText = "GH-SYNC: ERR (PARSE)";
                        indicator.style.borderColor = 'var(--alert)';
                        indicator.style.color = 'var(--alert)';
                    }
                }
            } else {
                window.timeDriftOffset = 0;
                console.warn("[GITHUB SYNC] Date response header not exposed/found, using local system clock.");
                if (indicator) {
                    indicator.innerText = "GH-SYNC: ERR (HEADER)";
                    indicator.style.borderColor = 'var(--alert)';
                    indicator.style.color = 'var(--alert)';
                }
            }
        })
        .catch(err => {
            console.warn("GitHub Pages server time sync failed, falling back to local system clock:", err.message);
            window.timeDriftOffset = 0;
            if (indicator) {
                indicator.innerText = "GH-SYNC: OFFLINE";
                indicator.style.borderColor = 'rgba(255,255,255,0.2)';
                indicator.style.color = 'rgba(255,255,255,0.5)';
            }
        });
}
window.triggerGithubTimeSync = syncWithGitHubClockTime;
syncWithGitHubClockTime();
setInterval(syncWithGitHubClockTime, 60000);

window.getCurrentD9State = function() {
    const offset = state.focusedOffset !== null ? state.focusedOffset : state.userOffset;
    const activeDate = new Date(Date.now() + window.timeDriftOffset + (offset * 3600000));
    return getDragonSync(activeDate);
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

function createSparkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
}

function init3D() {
    // Adding ambient and point lights for phong shading
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 50);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 8);
    scene.add(dirLight);

    // Procedurally expand countryNodes to 360 nodes representing circle of resonance
    const numReal = countryNodes.length;
    const nodesPerReal = 10; // 360 / 36 = 10
    state.stationNodes = [];

    for (let i = 0; i < numReal; i++) {
        const startNode = countryNodes[i];
        const endNode = countryNodes[(i + 1) % numReal];
        
        for (let j = 0; j < nodesPerReal; j++) {
            const fraction = j / nodesPerReal;
            
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
            
            if (j === 0) {
                state.stationNodes.push(startNode);
            } else {
                state.stationNodes.push({
                    n: `Node ${startNode.n.slice(0, 3).toUpperCase()}-${String(j).padStart(2, '0')}`,
                    o: interpolatedOffset,
                    isVirtual: true
                });
            }
        }
    }

    state.stationNodes.forEach((s, i) => {
        const t = (i / state.stationNodes.length) * Math.PI * 2;
        const pos = getLemniscatePosition(t);
        
        // Auto-scaled sphere geometry to fit 360 nodes nicely
        const geometry = new THREE.SphereGeometry(0.15, 16, 16);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xd4af37, 
            shininess: 90,
            specular: 0xffffff,
            emissive: 0xd4af37,
            emissiveIntensity: 0.25,
            transparent: true, 
            opacity: 0.7 
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(pos.x, pos.y, pos.z);
        sphere.userData = { station: s, originalT: t };

        // Organic translucent aura glow ring (scaled to fit)
        const auraGeo = new THREE.SphereGeometry(0.24, 12, 12);
        const auraMat = new THREE.MeshBasicMaterial({
            color: 0xd4af37,
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
        });
        const auraMesh = new THREE.Mesh(auraGeo, auraMat);
        sphere.add(auraMesh);
        
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
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xd4af37, opacity: 0.15, transparent: true });
    const line = new THREE.LineLoop(lineGeometry, lineMaterial);
    scene.add(line);
    state.infinityLine = line;

    const sparkTexture = createSparkTexture();

    // Flowing particles along the infinity loop
    const flowCount = 180;
    const flowGeo = new THREE.BufferGeometry();
    const flowPositions = new Float32Array(flowCount * 3);
    for (let i = 0; i < flowCount; i++) {
        const t = (i / flowCount) * Math.PI * 2;
        const pos = getLemniscatePosition(t);
        flowPositions[i * 3] = pos.x;
        flowPositions[i * 3 + 1] = pos.y;
        flowPositions[i * 3 + 2] = pos.z;
        state.flowTs.push(t);
    }
    flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));
    const flowMat = new THREE.PointsMaterial({
        color: 0xd4af37,
        size: 0.8,
        map: sparkTexture,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    state.flowParticles = new THREE.Points(flowGeo, flowMat);
    scene.add(state.flowParticles);

    // Starfield Particle System Setup
    const starCount = 150;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 10;

        state.starfieldVelocities.push({
            x: (Math.random() - 0.5) * 0.015,
            y: (Math.random() - 0.5) * 0.015,
            z: (Math.random() - 0.5) * 0.008
        });
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({
        color: 0xd4af37,
        size: 0.5,
        map: sparkTexture,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
    });
    state.starfield = new THREE.Points(starGeo, starMat);
    scene.add(state.starfield);

    // Fluid Logo Mesh
    state.textures.logo = textureLoader.load('assets/newinfiniti4.png');
    const logoGeo = new THREE.PlaneGeometry(12, 12);
    const logoMat = new THREE.MeshBasicMaterial({ map: state.textures.logo, transparent: true, opacity: 0.25 });
    state.logoMesh = new THREE.Mesh(logoGeo, logoMat);
    state.logoMesh.position.z = -5; // Slightly behind the nodes
    scene.add(state.logoMesh);
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
    
    // Toggle active classes on theme selector buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.classList.contains(`btn-${theme}`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Timeout to allow the CSS variables transition to start updating colors
    setTimeout(updateNodeColors, 40);

    // Sync theme to workspace viewport
    setTimeout(window.syncThemeToIframe, 50);
};

// --- WORKSPACE VIEWPORT MANAGER (Consolidates all sub-applications) ---
window.openWorkspace = function(url, title, elementId) {
    const viewport = document.getElementById('workspace-viewport');
    const iframe = document.getElementById('viewport-iframe');
    const titleEl = document.getElementById('viewport-title');
    const vortex = document.getElementById('vortex-container');
    const hud = document.querySelector('.vortex-hud');
    
    if (!viewport || !iframe || !titleEl) return;
    
    // Set active link in nav dock
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.id === elementId) {
            link.classList.add('active-workspace');
        } else {
            link.classList.remove('active-workspace');
        }
    });

    titleEl.innerText = title.toUpperCase();
    iframe.src = url;
    viewport.classList.add('active');
    
    // Scale down & fade background vortex scene
    if (vortex) {
        vortex.style.transform = 'scale(0.85)';
        vortex.style.opacity = '0.35';
        vortex.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        vortex.style.pointerEvents = 'none';
    }
    // Reposition/fade the hud so it doesn't block the workspace
    if (hud) {
        hud.style.opacity = '0.45';
        hud.style.transform = 'translateX(-50%) scale(0.9)';
        hud.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    }
};

window.closeViewport = function(e) {
    if (e) e.preventDefault();
    const viewport = document.getElementById('workspace-viewport');
    const iframe = document.getElementById('viewport-iframe');
    const vortex = document.getElementById('vortex-container');
    const hud = document.querySelector('.vortex-hud');
    
    if (!viewport || !iframe) return;
    
    // Clear active links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active-workspace');
    });
    
    viewport.classList.remove('active');
    iframe.src = '';
    
    // Restore vortex scene
    if (vortex) {
        vortex.style.transform = 'scale(1)';
        vortex.style.opacity = '1';
        vortex.style.pointerEvents = 'auto';
    }
    // Restore hud
    if (hud) {
        hud.style.opacity = '1';
        hud.style.transform = 'translateX(-50%) scale(1)';
    }
};

window.refreshViewport = function() {
    const iframe = document.getElementById('viewport-iframe');
    if (iframe) {
        iframe.src = iframe.src;
    }
};

window.popoutViewport = function() {
    const iframe = document.getElementById('viewport-iframe');
    if (iframe && iframe.src) {
        window.open(iframe.src, '_blank');
    }
};

window.syncThemeToIframe = function() {
    const iframe = document.getElementById('viewport-iframe');
    if (!iframe || !iframe.contentWindow) return;
    try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const body = doc.body;
        if (!body) return;
        
        // Remove existing theme classes from iframe body
        body.classList.remove('theme-classic', 'theme-matrix', 'theme-amber', 'theme-cyber', 'theme-fluid');
        
        // Add current theme class from parent body
        const currentTheme = state.activeTheme;
        if (currentTheme && currentTheme !== 'classic') {
            body.classList.add(`theme-${currentTheme}`);
        }
        
        // Also call iframe's internal setTheme function if it exists
        if (iframe.contentWindow.setTheme) {
            iframe.contentWindow.setTheme(currentTheme);
        }
    } catch (e) {
        console.warn("Theme sync to iframe skipped:", e.message);
    }
};

function updateNodeColors() {
    const color = getComputedStyle(document.body).getPropertyValue('--accent').trim();
    const colorThree = new THREE.Color(color);
    state.nodes.forEach(node => {
        node.material.color.copy(colorThree);
        if (node.material.emissive) {
            node.material.emissive.copy(colorThree).multiplyScalar(0.25);
        }
        if (node.children && node.children[0]) {
            node.children[0].material.color.copy(colorThree);
        }
    });
    if (state.starfield) {
        state.starfield.material.color.copy(colorThree);
    }
    if (state.infinityLine) {
        state.infinityLine.material.color.copy(colorThree);
    }
    if (state.flowParticles) {
        state.flowParticles.material.color.copy(colorThree);
    }
    if (state.logoMesh) {
        state.logoMesh.material.color.copy(colorThree);
    }
}

window.toggleSound = function() {
    if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        initAudio();
    }
    if (!state.portalAudio) {
        state.portalAudio = new Audio();
        state.portalAudio.loop = true;
    }
    state.soundEnabled = !state.soundEnabled;
    dom.soundToggle.innerText = state.soundEnabled ? '🔊' : '🔇';
    dom.soundToggle.style.opacity = state.soundEnabled ? '1' : '0.6';
    
    if (state.soundEnabled) {
        localStorage.setItem('quest_audio_tuned', 'completed');
        if (typeof checkQuestProgress === 'function') checkQuestProgress();
        state.audioCtx.resume();
        if (state.activePortalMusic === 'synth' || !state.activePortalMusic) {
            if (state.synthNodes && state.synthNodes.gain) {
                state.synthNodes.gain.connect(state.audioCtx.destination);
            }
        } else {
            state.portalAudio.play().catch(e => console.log("Audio play restriction:", e));
        }
        dom.soundToggle.style.borderColor = 'var(--accent)';
        dom.soundToggle.style.boxShadow = '0 0 10px var(--accent-glow)';
    } else {
        if (state.synthNodes && state.synthNodes.gain) {
            state.synthNodes.gain.disconnect();
        }
        if (state.portalAudio) {
            state.portalAudio.pause();
        }
        dom.soundToggle.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        dom.soundToggle.style.boxShadow = 'none';
    }
};

window.changePortalMusic = function(trackName) {
    if (!state.portalAudio) {
        state.portalAudio = new Audio();
        state.portalAudio.loop = true;
    }
    
    state.portalAudio.pause();
    if (state.audioCtx && state.synthNodes && state.synthNodes.gain) {
        state.synthNodes.gain.disconnect();
    }
    
    state.activePortalMusic = trackName;
    localStorage.setItem('quest_audio_tuned', 'completed');
    if (typeof checkQuestProgress === 'function') checkQuestProgress();
    
    if (trackName === 'synth') {
        if (state.soundEnabled && state.audioCtx) {
            if (state.synthNodes && state.synthNodes.gain) {
                state.synthNodes.gain.connect(state.audioCtx.destination);
            }
        }
    } else {
        let srcFile = '';
        if (trackName === 'beat6') {
            srcFile = 'assets/crew/corey/audio/FUTURE FRWARD beat 6 💎.mp3';
        } else if (trackName === 'darklawd') {
            srcFile = 'assets/crew/corey/audio/DARK LAWD 🦈.mp3';
        } else if (trackName === 'rainbow') {
            srcFile = 'assets/crew/corey/audio/2-Rainbow in the DARK  .mp3';
        } else if (trackName === 'beat2') {
            srcFile = 'assets/crew/corey/audio/FUTURE FRWARD beat 2.mp3';
        } else if (trackName === 'oconnor') {
            srcFile = 'assets/crew/conan/audio/a oconnor - 01 - Track  1.mp3';
        }
        
        state.portalAudio.src = srcFile;
        if (state.soundEnabled) {
            state.portalAudio.play().catch(e => console.log("Audio play error:", e));
        }
    }
};

function initAudio() {
    const osc = state.audioCtx.createOscillator();
    const osc2 = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    const filter = state.audioCtx.createBiquadFilter();
    
    const lfo = state.audioCtx.createOscillator();
    const lfoGain = state.audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(43.2, state.audioCtx.currentTime); // 43.2 Hz resonance
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(86.4, state.audioCtx.currentTime); // Octave detune
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, state.audioCtx.currentTime);
    filter.Q.setValueAtTime(4, state.audioCtx.currentTime);
    
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, state.audioCtx.currentTime); // LFO slow sweep
    lfoGain.gain.setValueAtTime(45, state.audioCtx.currentTime);
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    
    gain.gain.setValueAtTime(0.015, state.audioCtx.currentTime);
    
    osc.start();
    osc2.start();
    lfo.start();
    
    state.mainOsc = gain;
    state.synthNodes = { osc, osc2, lfo, filter, gain };
    
    if (!state.soundEnabled) {
        gain.disconnect();
    } else {
        gain.connect(state.audioCtx.destination);
    }
}

function playTick(isRelax) {
    if (!state.soundEnabled || !state.audioCtx) return;
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    
    osc.type = 'sine';
    
    // Theme-based Solfeggio frequencies
    let baseFreq = 440;
    if (state.activeTheme === 'classic') baseFreq = 432;      // Solfeggio 432Hz
    else if (state.activeTheme === 'matrix') baseFreq = 528;  // Solfeggio 528Hz
    else if (state.activeTheme === 'amber') baseFreq = 396;   // Solfeggio 396Hz
    else if (state.activeTheme === 'cyber') baseFreq = 639;   // Solfeggio 639Hz
    else if (state.activeTheme === 'fluid') baseFreq = 852;   // Solfeggio 852Hz
    
    osc.frequency.setValueAtTime(isRelax ? baseFreq / 2 : baseFreq, state.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, state.audioCtx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.03, state.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, state.audioCtx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.start();
    osc.stop(state.audioCtx.currentTime + 0.08);
}

function playTransition(enteringRelax) {
    if (!state.soundEnabled || !state.audioCtx) return;
    const freqs = enteringRelax ? [220, 275, 330, 412.5] : [440, 550, 660, 825]; // Chord stack
    const now = state.audioCtx.currentTime;
    
    freqs.forEach((f, i) => {
        const osc = state.audioCtx.createOscillator();
        const gain = state.audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.06); // Staggered arpeggiated entry
        osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + 1.2 + i * 0.06);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.02, now + 0.1 + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
        
        osc.connect(gain);
        gain.connect(state.audioCtx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + 1.6);
    });
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
    
    // Raycasting for interactive mouse hover
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(state.nodes);
    const tooltip = document.getElementById('tooltip');
    let hoveredNode = null;
    if (intersects.length > 0) {
        hoveredNode = intersects[0].object;
    }

    // Animate Nodes & auric shells
    state.nodes.forEach((node, i) => {
        const t = node.userData.originalT + time * 0.2;
        const pos = getLemniscatePosition(t);
        node.position.set(pos.x, pos.y, pos.z);
        
        const auraMesh = node.children[0];
        if (auraMesh) {
            auraMesh.rotation.y += 0.01;
            // Pulsing scale factor for the aura mesh
            const pulse = 1.0 + Math.sin(time * 6 + i) * 0.12;
            auraMesh.scale.setScalar(pulse);
        }

        // Dynamic scale & opacity calculation based on focus & hover
        if (node === hoveredNode) {
            node.scale.set(1.6, 1.6, 1.6);
            node.material.opacity = 1.0;
            if (auraMesh) {
                auraMesh.material.opacity = 0.6;
                auraMesh.scale.setScalar(1.5);
            }
        } else if (state.focusedName === node.userData.station.n) {
            node.scale.set(1.3, 1.3, 1.3);
            node.material.opacity = 0.95;
            if (auraMesh) auraMesh.material.opacity = 0.45;
        } else {
            node.scale.set(1.0, 1.0, 1.0);
            node.material.opacity = 0.55;
            if (auraMesh) auraMesh.material.opacity = 0.25;
        }
    });

    // Tooltip rendering and projection
    if (hoveredNode) {
        const station = hoveredNode.userData.station;
        tooltip.innerHTML = `<strong>${station.n}</strong><br>Offset: UTC${station.o >= 0 ? '+' : ''}${station.o}`;
        
        const tempV = new THREE.Vector3();
        hoveredNode.getWorldPosition(tempV);
        tempV.project(camera);
        
        const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
        const y = (tempV.y * -0.5 + 0.5) * window.innerHeight;
        
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        tooltip.classList.add('visible');
        document.body.style.cursor = 'pointer';
    } else {
        tooltip.classList.remove('visible');
        document.body.style.cursor = 'default';
    }

    // Animate infinity flow particles moving along the lemniscate
    if (state.flowParticles && state.flowTs.length > 0) {
        const positions = state.flowParticles.geometry.attributes.position.array;
        for (let i = 0; i < state.flowTs.length; i++) {
            state.flowTs[i] = (state.flowTs[i] + 0.0025) % (Math.PI * 2);
            const pos = getLemniscatePosition(state.flowTs[i]);
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y;
            positions[i * 3 + 2] = pos.z;
        }
        state.flowParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Rotate starfield particle system galaxy elegantly
    if (state.starfield) {
        state.starfield.rotation.y += 0.0002;
        state.starfield.rotation.x += 0.0001;
    }

    // Logo Pulsing & Visibility for different themes
    if (state.logoMesh) {
        let targetOpacity = 0.25;
        if (state.activeTheme === 'fluid') targetOpacity = 0.75;
        else if (state.activeTheme === 'cyber') targetOpacity = 0.45;
        else if (state.activeTheme === 'matrix') targetOpacity = 0.35;
        else if (state.activeTheme === 'amber') targetOpacity = 0.3;

        if (state.logoMesh.material.opacity < targetOpacity) {
            state.logoMesh.material.opacity = Math.min(state.logoMesh.material.opacity + 0.01, targetOpacity);
        } else {
            state.logoMesh.material.opacity = Math.max(state.logoMesh.material.opacity - 0.01, targetOpacity);
        }

        const pulse = 1.0 + Math.sin(time * 1.5) * 0.04;
        state.logoMesh.scale.set(pulse, pulse, pulse);
        state.logoMesh.rotation.z += 0.003;
    }

    scene.rotation.y += 0.001; // Gentle scene rotation
    scene.rotation.x = Math.sin(time * 0.15) * 0.05; // Complex 3D space movement
    
    const now = new Date();
    const totalSeconds = Math.floor(now.getTime() / 1000);
    const micro = Math.floor((performance.now() % 1000) * 1000).toString().padStart(6, '0');
    dom.milliSync.innerText = `.${micro}`;

    // Update standard clock inside header
    const standardClock = document.getElementById('header-standard-clock');
    if (standardClock) {
        const offset = state.focusedOffset !== null ? state.focusedOffset : state.userOffset;
        const targetTime = new Date(Date.now() + window.timeDriftOffset + (offset * 3600000));
        const hour = String(targetTime.getUTCHours()).padStart(2, '0');
        const min = String(targetTime.getUTCMinutes()).padStart(2, '0');
        const sec = String(targetTime.getUTCSeconds()).padStart(2, '0');
        const tzLabel = state.focusedName ? state.focusedName.toUpperCase() : 'LOCAL';
        standardClock.innerText = `${hour}:${min}:${sec} | ${tzLabel} (UTC${offset >= 0 ? '+' : ''}${offset})`;
    }

    // Sweeping clock hands update
    const offset = state.focusedOffset !== null ? state.focusedOffset : state.userOffset;
    const activeDate = new Date(Date.now() + window.timeDriftOffset + (offset * 3600000));
    const vCurrent = getDragonSync(activeDate);
    const ms = (Date.now() + window.timeDriftOffset) % 1000;
    
    const smoothS = vCurrent.s + ms / 1000;
    const smoothM = vCurrent.isRelax ? 0 : vCurrent.m + smoothS / 60;
    const smoothH = vCurrent.isRelax ? 0 : (vCurrent.h % 13) + (smoothM / 54);

    const sDeg = (smoothS / 60) * 360;
    const mDeg = (smoothM / 54) * 360;
    const hDeg = (smoothH / 13) * 360;

    dom.hHand.style.transform = `rotate(${hDeg}deg)`;
    dom.mHand.style.transform = `rotate(${mDeg}deg)`;
    dom.sHand.style.transform = `rotate(${sDeg}deg)`;

    if (totalSeconds !== state.lastTotalSeconds) {
        state.lastTotalSeconds = totalSeconds;
        const activeDateSec = new Date(Date.now() + window.timeDriftOffset + (offset * 3600000));
        const v = getDragonSync(activeDateSec);

        // Emit standard tick event
        bus.emit('d9_tick', v);

        if (v.isRelax !== state.isRelax) {
            playTransition(v.isRelax);
            state.isRelax = v.isRelax;
            bus.emit('d9_relax_change', v.isRelax);
        }

        if (v.h !== state.lastH) {
            state.lastH = v.h;
            bus.emit('d9_hour_change', v.h);
        }

        playTick(v.isRelax);
        updateUI(v, now);

        // Highlight active lunar calendar day Phase
        const currentLunarDay = getLunarDay(activeDateSec);
        for (let idx = 1; idx <= 28; idx++) {
            const cell = document.getElementById(`cal-day-${idx}`);
            if (cell) {
                if (idx === currentLunarDay) {
                    cell.classList.add('active-day');
                } else {
                    cell.classList.remove('active-day');
                }
            }
        }

        // Update all station cells in the matrix panel ONLY if panel is open for performance
        const panel = document.getElementById('network-panel');
        if (panel && panel.classList.contains('open')) {
            const currentMs = Date.now() + window.timeDriftOffset;
            state.stationNodes.forEach((s, i) => {
                const el = document.getElementById(`c-${i}`);
                if (el && el.style.display !== 'none') {
                    const zTime = new Date(currentMs + (3600000 * s.o));
                    const zv = getDragonSync(zTime);
                    
                    if (state.focusedName === s.n) {
                        el.classList.add('active-focus');
                    } else {
                        el.classList.remove('active-focus');
                    }
                    const color = zv.isRelax ? 'var(--amber-glow)' : `hsl(${zv.hue}, 90%, 55%)`;
                    el.style.color = color;
                    el.style.borderColor = zv.root % 3 === 0 ? color : 'rgba(255,255,255,0.06)';
                    
                    const labelText = s.isVirtual ? `<span style="font-size:0.5rem;opacity:0.6;">⚡ ${s.n}</span>` : `<span>${s.n}</span>`;
                    
                    el.innerHTML = `<div class="station-cell-info">
                                        ${labelText}
                                        ${zv.root % 3 === 0 ? `<span style="font-weight:900;">${zv.root}</span>` : ''}
                                    </div>
                                    <div class="vortex-time">
                                        ${zv.isRelax ? 'RELAX' : String(zv.h).padStart(2,'0')+':'+String(zv.m).padStart(2,'0')}
                                    </div>`;
                }
            });
        }
    }

    renderer.render(scene, camera);
}

// --- INIT ---
function init() {
    if (typeof initQuests === 'function') initQuests();
    const savedTheme = localStorage.getItem('dragon-theme') || 'classic';
    window.setTheme(savedTheme);

    const moonSymbols = {
        0: '🌑', 1: '🌒', 2: '🌒', 3: '🌒', 4: '🌒', 5: '🌒', 6: '🌒',
        7: '🌓', 8: '🌔', 9: '🌔', 10: '🌔', 11: '🌔', 12: '🌔', 13: '🌔',
        14: '🌕', 15: '🌖', 16: '🌖', 17: '🌖', 18: '🌖', 19: '🌖', 20: '🌖',
        21: '🌗', 22: '🌘', 23: '🌘', 24: '🌘', 25: '🌘', 26: '🌘', 27: '🌘'
    };

    for(let i=1; i<=28; i++) { 
        const d = document.createElement('div'); 
        d.id = `cal-day-${i}`;
        
        const numSpan = document.createElement('span');
        numSpan.className = 'lunar-day-num';
        numSpan.innerText = String(i).padStart(2, '0');
        
        const phaseSpan = document.createElement('span');
        phaseSpan.className = 'lunar-moon-phase';
        phaseSpan.innerText = moonSymbols[i - 1];
        
        d.appendChild(numSpan);
        d.appendChild(phaseSpan);
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

    // Build network grid from procedurally expanded 360 nodes
    const networkGrid = document.getElementById('network-grid');
    if (networkGrid) {
        state.stationNodes.forEach((s, i) => {
            const d = document.createElement('div');
            d.className = 'station-cell';
            d.id = `c-${i}`;
            if (s.isVirtual) {
                d.classList.add('virtual-node');
                d.style.opacity = '0.5'; // Dim virtual nodes slightly to emphasize real cities
            }
            d.onclick = (e) => {
                e.stopPropagation();
                setFocus(s.n, s.o);
            };
            networkGrid.appendChild(d);
        });
    }

    // Connect Station Search Input filter to search across 360 stations
    const searchInput = document.getElementById('station-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            state.stationNodes.forEach((s, i) => {
                const el = document.getElementById(`c-${i}`);
                if (el) {
                    if (s.n.toLowerCase().includes(query)) {
                        el.style.display = 'flex';
                    } else {
                        el.style.display = 'none';
                    }
                }
            });
        });
    }

    // App4: Event Bus Demo Subscribers
    bus.on('d9_hour_change', (h) => {
        console.log(`[EVENT BUS] Hour changed to: ${h}`);
    });
    bus.on('d9_relax_change', (isRelax) => {
        console.log(`[EVENT BUS] Relax mode: ${isRelax ? 'ON' : 'OFF'}`);
    });

    // --- SETUP NAVIGATION DOCK WORKSPACE INTERCEPTORS ---
    const navLinks = [
        { id: 'dial-link', title: 'Dragon Dial Interface' },
        { id: 'grid-link', title: 'Global Network Grid' },
        { id: 'album-link', title: 'Fluid Crate Album' },
        { id: 'stemcrate-link', title: 'Stem Crate Downloader' },
        { id: 'bridge-link', title: 'Universal Bridge' },
        { id: 'exchange-link', title: 'Harmony Exchange' },
        { id: 'exhibition-link', title: 'Fluid Exhibition' },
        { id: 'kiterider-link', title: 'Kite Rider Shield' },
        { id: 'fabric-link', title: 'Node Fabric V2' },
        { id: 'vdo4n6-link', title: 'Vdo4n6 Forensic Chronology' },
        { id: 'editor-link', title: 'Dragon 8 Editor' },
        { id: 'racer-link', title: 'Infinity Rider' },
        { id: 'artist-gallery-link', title: 'Artist Curation Gallery' },
        { id: 'garden-link', title: 'Resonance Garden & Sustenance Tuner' },
        { id: 'apps-link', title: 'Sovereign App Store & Download Center' }
    ];
    
    navLinks.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                if (el.classList.contains('active-workspace')) {
                    window.closeViewport();
                } else {
                    const url = el.getAttribute('href');
                    window.openWorkspace(url, item.title, item.id);
                }
            });
        }
    });

    animate();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.toggleNetworkGrid = function() {
    const panel = document.getElementById('network-panel');
    const toggleBtn = document.getElementById('grid-toggle');
    if (panel) {
        const isOpen = panel.classList.toggle('open');
        if (isOpen) {
            toggleBtn.style.borderColor = 'var(--accent)';
            toggleBtn.style.boxShadow = '0 0 8px var(--accent-glow)';
            toggleBtn.style.opacity = '1';
        } else {
            toggleBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            toggleBtn.style.boxShadow = 'none';
            toggleBtn.style.opacity = '0.6';
        }
    }
};

// --- QUEST CONTROLLER LOGIC ---
window.toggleQuestHud = function() {
    const body = document.getElementById('quest-hud-body');
    const hud = document.getElementById('quest-hud');
    if (body && hud) {
        const isCollapsed = body.style.display === 'none';
        body.style.display = isCollapsed ? 'flex' : 'none';
        if (isCollapsed) {
            hud.style.height = 'auto';
        } else {
            hud.style.height = '35px'; // height of header
        }
    }
};

window.closeQuestWelcome = function() {
    const modal = document.getElementById('quest-welcome-modal');
    if (modal) modal.style.display = 'none';
    localStorage.setItem('quest_welcome_closed', 'true');
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
    }
};

window.closeQuestReward = function() {
    const modal = document.getElementById('quest-reward-modal');
    if (modal) modal.style.display = 'none';
    localStorage.setItem('quest_reward_claimed', 'true');
};

window.spreadTheLove = function() {
    const shareText = "Align the core matrix, capture social streams, and tune the resonance of original art and beats in the Dragon 9 Multiversal Portal! 🚀 " + window.location.origin + "/";
    navigator.clipboard.writeText(shareText).then(() => {
        const btn = document.querySelector('button[onclick="spreadTheLove()"]');
        if (btn) {
            const oldText = btn.innerText;
            btn.innerText = "💖 COPIED TO CLIPBOARD!";
            btn.style.borderColor = "#00e5ff";
            btn.style.boxShadow = "0 0 15px rgba(0, 229, 255, 0.4)";
            setTimeout(() => {
                btn.innerText = oldText;
                btn.style.borderColor = "var(--highlight)";
                btn.style.boxShadow = "none";
            }, 3000);
        }
    }).catch(err => {
        console.error("Failed to copy text: ", err);
    });
};

function checkQuestProgress() {
    const audioTuned = localStorage.getItem('quest_audio_tuned') === 'completed';
    const mediaIngested = localStorage.getItem('quest_media_ingested') === 'completed';
    const projectorCalibrated = localStorage.getItem('quest_projector_calibrated') === 'completed';
    
    let count = 0;
    
    const audioItem = document.getElementById('quest-audio-item');
    const chkAudio = document.getElementById('chk-quest-audio');
    if (audioItem && chkAudio) {
        if (audioTuned) {
            audioItem.classList.add('completed');
            chkAudio.innerText = '⬢';
            count++;
        } else {
            audioItem.classList.remove('completed');
            chkAudio.innerText = '⬡';
        }
    }
    
    const mediaItem = document.getElementById('quest-media-item');
    const chkMedia = document.getElementById('chk-quest-media');
    if (mediaItem && chkMedia) {
        if (mediaIngested) {
            mediaItem.classList.add('completed');
            chkMedia.innerText = '⬢';
            count++;
        } else {
            mediaItem.classList.remove('completed');
            chkMedia.innerText = '⬡';
        }
    }
    
    const projectorItem = document.getElementById('quest-projector-item');
    const chkProjector = document.getElementById('chk-quest-projector');
    if (projectorItem && chkProjector) {
        if (projectorCalibrated) {
            projectorItem.classList.add('completed');
            chkProjector.innerText = '⬢';
            count++;
        } else {
            projectorItem.classList.remove('completed');
            chkProjector.innerText = '⬡';
        }
    }
    
    const progressEl = document.getElementById('quest-hud-progress');
    if (progressEl) {
        progressEl.innerText = `${count}/3`;
    }
    
    if (count === 3) {
        const rewardClaimed = localStorage.getItem('quest_reward_claimed') === 'true';
        if (!rewardClaimed) {
            const rewardModal = document.getElementById('quest-reward-modal');
            if (rewardModal && rewardModal.style.display !== 'flex') {
                rewardModal.style.display = 'flex';
            }
        }
    }
}

function initQuests() {
    const welcomeClosed = localStorage.getItem('quest_welcome_closed') === 'true';
    const rewardClaimed = localStorage.getItem('quest_reward_claimed') === 'true';
    const welcomeModal = document.getElementById('quest-welcome-modal');
    
    if (welcomeModal) {
        if (!welcomeClosed && !rewardClaimed) {
            welcomeModal.style.display = 'flex';
        } else {
            welcomeModal.style.display = 'none';
        }
    }
    checkQuestProgress();
    
    // Sync periodically
    setInterval(checkQuestProgress, 1000);
}

window.toggleSorterModal = function() {
    const modal = document.getElementById('sorter-modal');
    if (modal) {
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    }
};

window.runPortalSorter = async function() {
    const input = document.getElementById('sorter-path-input');
    const output = document.getElementById('sorter-output-box');
    const runBtn = document.getElementById('sorter-run-btn');
    if (!input || !output || !runBtn) return;
    
    const path = input.value.trim();
    if (!path) {
        alert("Please specify a folder path first.");
        return;
    }
    
    output.style.display = 'block';
    output.innerHTML = `<div style="color: var(--accent);">[SYSTEM] Initializing ingest sequence for source: ${path}...</div>`;
    runBtn.disabled = true;
    runBtn.innerText = "SORTER ACTIVE...";
    runBtn.style.opacity = '0.5';
    
    try {
        const response = await fetch('/api/auto-sort', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ source_dir: path })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Auto-sort command failed.');
        }
        
        const data = await response.json();
        output.innerHTML += `<div style="color: var(--highlight); margin-top: 10px;">[SUCCESS] Sorting completed. Processed ${data.count} crew assets.</div>`;
        
        if (data.count > 0) {
            data.sorted.forEach(item => {
                const sizeKB = (item.size / 1024).toFixed(1);
                output.innerHTML += `<div style="color: #ccc; margin-left: 10px;">➔ [${item.crew.toUpperCase()}] Sorted ${item.file} into ${item.type} (${sizeKB} KB)</div>`;
            });
        } else {
            output.innerHTML += `<div style="color: var(--text-muted); margin-left: 10px;">No files matching crew names (Corey, Freddy, Conan, Tim, Misaki, Night Fish) were found.</div>`;
        }
        
        if (data.count > 0) {
            localStorage.setItem('quest_media_ingested', 'completed');
            if (typeof checkQuestProgress === 'function') checkQuestProgress();
            output.innerHTML += `<div style="color: var(--highlight); font-weight: bold; margin-top: 5px;">🏆 [QUEST ALIGNED] Media segment ingestion checkmark active!</div>`;
        }
        
    } catch (err) {
        output.innerHTML += `<div style="color: #ff3366; margin-top: 10px;">[ERROR] Ingest failed: ${err.message}</div>`;
    } finally {
        runBtn.disabled = false;
        runBtn.innerText = "⚡ RUN AUTO-SORTER";
        runBtn.style.opacity = '1';
    }
};

init();
