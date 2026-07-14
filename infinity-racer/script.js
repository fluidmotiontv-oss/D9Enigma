import * as THREE from '../three.module.min.js';

// --- GAME STATE ---
const state = {
    // Gameplay
    score: 0,
    highScore: parseInt(localStorage.getItem('d9_racer_highscore') || '0', 10),
    shield: 100,
    speedMultiplier: 1.0,
    baseSpeed: 0.15, // speed increment per frame in t
    tPlayer: 0, // player position along the track (0 to 2*PI)
    playerAngle: 0, // player bank angle around the tube (0 to 2*PI)
    targetAngle: 0, // for smooth interpolation of player movement
    isPlaying: false,
    isGameOver: false,
    
    // Three.js Core
    scene: null,
    camera: null,
    renderer: null,
    trackRadius: 1.5,
    trackScale: 22, // scale of the lemniscate loop
    
    // Three.js Objects
    ship: null,
    trackRails: null,
    trackSleepers: null,
    trackRings: [],
    entities: [], // active orbs and hazards
    particles: [], // active explosion particles
    starfield: null,
    ambientLight: null,
    dirLight: null,
    
    // Theme/Colors (derived from CSS body classes)
    colors: {
        accent: 0xd4af37,
        highlight: 0x00e5ff,
        alert: 0xff0080,
        primary: 0x5d4e75,
        secondary: 0x161020,
        text: 0xf4e4bc
    },
    
    // Audio engine
    audio: {
        ctx: null,
        masterVolume: null,
        sequencerInterval: null,
        step: 0,
        bpm: 125,
        muted: false,
        isPlaying: false
    },
    
    // D9 Time Sync
    d9State: {
        h: 26,
        m: 0,
        s: 0,
        isRelax: false,
        root: 1,
        hue: 184
    }
};

// Keyboard inputs
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    KeyA: false,
    KeyD: false,
    ArrowUp: false,
    ArrowDown: false,
    KeyW: false,
    KeyS: false
};

// --- CORE MATHEMATICS ---
// Pre-allocated vectors for math calculations to avoid garbage collection thrashing in render loop
const _pPrev = new THREE.Vector3();
const _pNext = new THREE.Vector3();
const _ref = new THREE.Vector3();
const _shipPos = new THREE.Vector3();
const _upVector = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _lookPos = new THREE.Vector3();

// Global cached frame objects to avoid object allocation in render loop
const _framePlayer = {
    position: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    binormal: new THREE.Vector3()
};
const _frameCam = {
    position: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    binormal: new THREE.Vector3()
};
const _frameLook = {
    position: new THREE.Vector3(),
    tangent: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    binormal: new THREE.Vector3()
};

// Calculates 3D coordinates along the Lemniscate of Bernoulli (Allocates new Vector3)
function getLemniscatePosition(t, scale = state.trackScale) {
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);
    const denominator = 1 + sinT * sinT;
    const x = (scale * cosT) / denominator;
    const y = (scale * sinT * cosT) / denominator;
    const z = Math.sin(t * 2) * (scale / 4);
    return new THREE.Vector3(x, y, z);
}

// In-place calculation of Lemniscate of Bernoulli (Allocates zero objects)
function getLemniscatePositionTo(t, target, scale = state.trackScale) {
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);
    const denominator = 1 + sinT * sinT;
    target.x = (scale * cosT) / denominator;
    target.y = (scale * sinT * cosT) / denominator;
    target.z = Math.sin(t * 2) * (scale / 4);
    return target;
}

// Compute the Frenet-Serret frame (Allocates new frame object & Vector3s)
function getFrameAt(t) {
    const eps = 0.001;
    const pPrev = getLemniscatePosition(t - eps);
    const pNext = getLemniscatePosition(t + eps);
    const pCurrent = getLemniscatePosition(t);
    const tangent = new THREE.Vector3().subVectors(pNext, pPrev).normalize();
    let ref = new THREE.Vector3(0, 1, 0);
    if (Math.abs(tangent.dot(ref)) > 0.9) {
        ref.set(0, 0, 1);
    }
    const binormal = new THREE.Vector3().crossVectors(tangent, ref).normalize();
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();
    return { position: pCurrent, tangent, normal, binormal };
}

// In-place calculation of Frenet-Serret frame (Allocates zero objects)
function updateFrameAt(t, frame) {
    const eps = 0.001;
    getLemniscatePositionTo(t - eps, _pPrev);
    getLemniscatePositionTo(t + eps, _pNext);
    getLemniscatePositionTo(t, frame.position);
    
    frame.tangent.subVectors(_pNext, _pPrev).normalize();
    
    _ref.set(0, 1, 0);
    if (Math.abs(frame.tangent.dot(_ref)) > 0.9) {
        _ref.set(0, 0, 1);
    }
    
    frame.binormal.crossVectors(frame.tangent, _ref).normalize();
    frame.normal.crossVectors(frame.binormal, frame.tangent).normalize();
}

// --- DYNAMIC THEME SYSTEM ---
// Synchronizes the game colors with the parent dashboard CSS variables
function updateColorsFromTheme() {
    const style = getComputedStyle(document.body);
    
    const extractHex = (varName, defaultVal) => {
        const val = style.getPropertyValue(varName).trim();
        if (!val) return defaultVal;
        // Convert rgb/hex to numbers for Three.js
        if (val.startsWith('#')) {
            return parseInt(val.slice(1), 16);
        }
        return defaultVal;
    };

    state.colors.accent = extractHex('--accent', 0xd4af37);
    state.colors.highlight = extractHex('--highlight', 0x00e5ff);
    state.colors.alert = extractHex('--alert', 0xff0080);
    state.colors.primary = extractHex('--primary', 0x5d4e75);
    state.colors.secondary = extractHex('--secondary', 0x161020);
    state.colors.text = extractHex('--text', 0xf4e4bc);

    // Apply colors to 3D elements
    if (state.trackRails) {
        state.trackRails.children.forEach(child => {
            if (child.material) child.material.color.setHex(state.colors.accent);
        });
    }
    if (state.trackSleepers) {
        state.trackSleepers.material.color.setHex(state.colors.accent);
        state.trackSleepers.material.opacity = 0.4;
    }
    if (state.trackRingsMesh) {
        state.trackRingsMesh.material.color.setHex(state.colors.accent);
    }

    if (state.ship) {
        state.ship.children[0].material.color.setHex(state.colors.highlight); // Cockpit
        state.ship.children[1].material.color.setHex(state.colors.accent); // Wings
        state.ship.children[2].material.color.setHex(state.colors.alert); // Engine flame
    }

    if (state.ambientLight) {
        state.ambientLight.color.setHex(state.colors.accent);
    }
    if (state.dirLight) {
        state.dirLight.color.setHex(state.colors.highlight);
    }

    // Refresh active entities colors
    state.entities.forEach(ent => {
        if (ent.type === 'hazard') {
            ent.mesh.material.color.setHex(state.colors.alert);
        } else if (ent.type === 'orb_gold') {
            ent.mesh.material.color.setHex(0xffd700); // Gold remains gold
        } else {
            ent.mesh.material.color.setHex(state.colors.highlight); // Cyan/Highlight
        }
    });
}

// Watch for body class changes to auto-sync theme
const themeObserver = new MutationObserver(updateColorsFromTheme);
themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

// --- INITIALIZE THREE.JS SCENE ---
function initThree() {
    const canvas = document.getElementById('game-canvas');
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    state.scene = new THREE.Scene();
    // Soft fog for deep cosmic space depth
    state.scene.fog = new THREE.FogExp2(0x050308, 0.006);
    
    state.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    
    state.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    state.renderer.setSize(width, height);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Add Lights
    state.ambientLight = new THREE.AmbientLight(0xd4af37, 0.25);
    state.scene.add(state.ambientLight);
    
    state.dirLight = new THREE.DirectionalLight(0x00e5ff, 0.8);
    state.dirLight.position.set(0, 10, 10);
    state.scene.add(state.dirLight);
    
    // Build Track & Background
    buildTrack();
    buildStarfield();
    
    // Update theme values
    updateColorsFromTheme();
}

// Build the futuristic double-rail lemniscate track
function buildTrack() {
    const steps = 300;
    const railLeftPoints = [];
    const railRightPoints = [];
    const crossbarPoints = [];
    const ringPoints = [];
    
    for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const frame = getFrameAt(t);
        
        // Left and Right rails offset along normal vector
        const pLeft = new THREE.Vector3().copy(frame.position).addScaledVector(frame.normal, -state.trackRadius);
        const pRight = new THREE.Vector3().copy(frame.position).addScaledVector(frame.normal, state.trackRadius);
        
        railLeftPoints.push(pLeft);
        railRightPoints.push(pRight);
        
        // Build sleepers every few steps
        if (i % 2 === 0) {
            crossbarPoints.push(pLeft, pRight);
        }
        
        // Build glowing circular rings along the tube every 15 steps
        if (i % 15 === 0 && i < steps) {
            const ringSegments = 24;
            const pts = [];
            for (let j = 0; j < ringSegments; j++) {
                const angle = (j / ringSegments) * Math.PI * 2;
                const ringPt = new THREE.Vector3()
                    .copy(frame.position)
                    .addScaledVector(frame.normal, Math.cos(angle) * state.trackRadius)
                    .addScaledVector(frame.binormal, Math.sin(angle) * state.trackRadius);
                pts.push(ringPt);
            }
            // Connect points to form segments
            for (let j = 0; j < ringSegments; j++) {
                ringPoints.push(pts[j]);
                ringPoints.push(pts[(j + 1) % ringSegments]);
            }
        }
    }
    
    // Left & Right Rails
    const railLeftGeo = new THREE.BufferGeometry().setFromPoints(railLeftPoints);
    const railRightGeo = new THREE.BufferGeometry().setFromPoints(railRightPoints);
    const railMat = new THREE.LineBasicMaterial({
        color: state.colors.accent,
        linewidth: 2,
        transparent: true,
        opacity: 0.9
    });
    
    state.trackRails = new THREE.Group();
    state.trackRails.add(new THREE.LineLoop(railLeftGeo, railMat));
    state.trackRails.add(new THREE.LineLoop(railRightGeo, railMat));
    state.scene.add(state.trackRails);
    
    // Sleeper Crossbars
    const crossbarGeo = new THREE.BufferGeometry().setFromPoints(crossbarPoints);
    const crossbarMat = new THREE.LineBasicMaterial({
        color: state.colors.accent,
        transparent: true,
        opacity: 0.4
    });
    state.trackSleepers = new THREE.LineSegments(crossbarGeo, crossbarMat);
    state.scene.add(state.trackSleepers);

    // Glowing Rings (Combined single LineSegments mesh)
    const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
    const ringMat = new THREE.LineBasicMaterial({
        color: state.colors.accent,
        transparent: true,
        opacity: 0.35
    });
    state.trackRingsMesh = new THREE.LineSegments(ringGeo, ringMat);
    state.scene.add(state.trackRingsMesh);
}

// Generate circular particle texture for glows
function createSparkTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    
    return new THREE.CanvasTexture(canvas);
}

// Create starfield in the background
function buildStarfield() {
    const count = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        // Place stars in a huge sphere around the center
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const radius = 100 + (Math.random() * 80);
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const texture = createSparkTexture();
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.8,
        map: texture,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    state.starfield = new THREE.Points(geometry, material);
    state.scene.add(state.starfield);
}

// Build the player's 3D ship
function buildShip() {
    const shipGroup = new THREE.Group();
    
    // Central hull
    const cockpitGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const cockpitMat = new THREE.MeshPhongMaterial({ color: state.colors.highlight, flatShading: true, shininess: 80 });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    shipGroup.add(cockpit);
    
    // Wings
    const wingGeo = new THREE.ConeGeometry(0.18, 0.6, 3);
    wingGeo.rotateX(Math.PI / 2); // align forward
    wingGeo.translate(0, 0, -0.1);
    const wingMat = new THREE.MeshPhongMaterial({ color: state.colors.accent, flatShading: true, shininess: 40 });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.scale.set(3.0, 0.5, 1.0);
    shipGroup.add(wings);
    
    // Engine plume
    const flameGeo = new THREE.ConeGeometry(0.1, 0.4, 4);
    flameGeo.rotateX(-Math.PI / 2); // points backward
    flameGeo.translate(0, 0, -0.4);
    const flameMat = new THREE.MeshBasicMaterial({ color: state.colors.alert, transparent: true, opacity: 0.8 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    shipGroup.add(flame);
    
    state.scene.add(shipGroup);
    state.ship = shipGroup;
}

// --- GAMEPLAY MECHANICS ---

// Spawns items (orbs/hazards) at random locations further ahead on the track
function spawnEntityAhead() {
    // Determine a position t ahead of the player
    // Random t offset between 0.6 and 1.8 radians
    const tOffset = 0.6 + Math.random() * 1.2;
    const targetT = (state.tPlayer + tOffset) % (Math.PI * 2);
    
    // Random angle around the track tube (multiples of PI/3 for grid alignment)
    const angle = Math.floor(Math.random() * 6) * (Math.PI / 3);
    
    // Select type: 65% cyan orb, 15% gold bonus orb, 20% danger hazard
    const rand = Math.random();
    let type = 'orb_cyan';
    if (rand < 0.20) {
        type = 'hazard';
    } else if (rand < 0.35) {
        type = 'orb_gold';
    }
    
    // Create Mesh
    let geo, mat;
    if (type === 'hazard') {
        // Red double pyramid (octahedron)
        geo = new THREE.OctahedronGeometry(0.3, 0);
        mat = new THREE.MeshPhongMaterial({ color: state.colors.alert, flatShading: true, shininess: 30 });
    } else if (type === 'orb_gold') {
        // Gold icosahedron
        geo = new THREE.IcosahedronGeometry(0.22, 0);
        mat = new THREE.MeshPhongMaterial({ color: 0xffd700, flatShading: true, shininess: 100 });
    } else {
        // Cyan sphere
        geo = new THREE.IcosahedronGeometry(0.18, 1);
        mat = new THREE.MeshPhongMaterial({ color: state.colors.highlight, flatShading: true, shininess: 100 });
    }
    
    const mesh = new THREE.Mesh(geo, mat);
    
    // Position mesh around tube
    const frame = getFrameAt(targetT);
    const position = new THREE.Vector3()
        .copy(frame.position)
        .addScaledVector(frame.normal, Math.cos(angle) * state.trackRadius)
        .addScaledVector(frame.binormal, Math.sin(angle) * state.trackRadius);
    
    mesh.position.copy(position);
    state.scene.add(mesh);
    
    state.entities.push({
        t: targetT,
        angle: angle,
        type: type,
        mesh: mesh,
        collected: false
    });
}

// Clean up passed entities and keep target density
function manageEntities() {
    // Remove entities behind player
    for (let i = state.entities.length - 1; i >= 0; i--) {
        const ent = state.entities[i];
        
        // Calculate difference along loop
        let diff = ent.t - state.tPlayer;
        // Wrap diff to interval [-PI, PI]
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        
        // If player passed it, remove it
        if (diff < -0.15 || ent.collected) {
            state.scene.remove(ent.mesh);
            ent.mesh.geometry.dispose();
            ent.mesh.material.dispose();
            state.entities.splice(i, 1);
        }
    }
    
    // Maintain 12 items on track
    while (state.entities.length < 12) {
        spawnEntityAhead();
    }
}

// Particle explosion
function createExplosion(pos, colorHex, count = 20) {
    const positions = [];
    const velocities = [];
    
    const geom = new THREE.BufferGeometry();
    const posArray = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
        posArray[i * 3] = pos.x;
        posArray[i * 3 + 1] = pos.y;
        posArray[i * 3 + 2] = pos.z;
        
        positions.push(new THREE.Vector3().copy(pos));
        
        // Spherical explosion velocities
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const velocity = 0.05 + (Math.random() * 0.08);
        
        velocities.push(new THREE.Vector3(
            velocity * Math.sin(phi) * Math.cos(theta),
            velocity * Math.sin(phi) * Math.sin(theta),
            velocity * Math.cos(phi)
        ));
    }
    
    geom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const texture = createSparkTexture();
    const mat = new THREE.PointsMaterial({
        color: colorHex,
        size: 0.7,
        map: texture,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const points = new THREE.Points(geom, mat);
    state.scene.add(points);
    
    state.particles.push({
        mesh: points,
        velocities: velocities,
        age: 0,
        maxAge: 35 // frames
    });
}

function updateParticles() {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.age++;
        
        const posAttr = p.mesh.geometry.attributes.position;
        for (let j = 0; j < posAttr.count; j++) {
            posAttr.setX(j, posAttr.getX(j) + p.velocities[j].x);
            posAttr.setY(j, posAttr.getY(j) + p.velocities[j].y);
            posAttr.setZ(j, posAttr.getZ(j) + p.velocities[j].z);
            
            // Decelerate gravity friction
            p.velocities[j].multiplyScalar(0.95);
        }
        posAttr.needsUpdate = true;
        
        // Fade out
        p.mesh.material.opacity = 1.0 - (p.age / p.maxAge);
        
        if (p.age >= p.maxAge) {
            state.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
            state.particles.splice(i, 1);
        }
    }
}

// Check player overlaps with entities
function checkCollisions() {
    const playerShipPos = state.ship.position;
    
    state.entities.forEach(ent => {
        if (ent.collected) return;
        
        // 1. Check distance along track coordinate t
        let diffT = ent.t - state.tPlayer;
        if (diffT > Math.PI) diffT -= Math.PI * 2;
        if (diffT < -Math.PI) diffT += Math.PI * 2;
        
        // If player is extremely close on the loop curve
        if (Math.abs(diffT) < 0.05) {
            // Check distance in 3D space between ship and entity (using squared distance to avoid square roots)
            const distSq = playerShipPos.distanceToSquared(ent.mesh.position);
            
            if (distSq < 0.4225) { // 0.65 * 0.65 = 0.4225
                ent.collected = true;
                handleCollection(ent);
            }
        }
    });
}

function handleCollection(ent) {
    if (ent.type === 'hazard') {
        // Damage hazard
        state.shield = Math.max(0, state.shield - 20);
        document.getElementById('shield-bar').style.width = `${state.shield}%`;
        document.getElementById('shield-txt').innerText = `${state.shield}%`;
        
        createExplosion(ent.mesh.position, state.colors.alert, 25);
        playSFX('damage');
        
        // Flash screen red/alert
        document.body.style.background = 'rgba(255, 0, 128, 0.4)';
        setTimeout(() => {
            document.body.style.background = '';
        }, 120);

        if (state.shield <= 0) {
            triggerGameOver();
        }
    } else {
        // Gold or Cyan Resonance Orb
        let points = 10;
        let color = state.colors.highlight;
        let sfxType = 'collect';
        
        if (ent.type === 'orb_gold') {
            points = 35;
            color = 0xffd700;
            sfxType = 'bonus';
        }
        
        // Apply multiplier (based on thrust speed)
        const currentThrust = parseFloat(document.getElementById('speed-slider').value);
        const speedBonus = Math.floor(currentThrust / 10);
        const finalPoints = points * (state.d9State.isRelax ? 1 : speedBonus);
        
        state.score += finalPoints;
        document.getElementById('score-display').innerText = String(state.score).padStart(4, '0');
        
        createExplosion(ent.mesh.position, color, 15);
        playSFX(sfxType);
    }
}

// Game Over triggers
function triggerGameOver() {
    state.isPlaying = false;
    state.isGameOver = true;
    
    // Stop sequencer
    stopAudioSequencer();
    playSFX('gameover');
    
    // Save High Score
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('d9_racer_highscore', state.highScore);
    }
    
    document.getElementById('final-score').innerText = String(state.score).padStart(4, '0');
    
    // Evaluate operational rank
    let rank = "Level 1 Cadet";
    if (state.score >= 500) rank = "Level 3 Grand Master 💎";
    else if (state.score >= 250) rank = "Level 2 Resonance Operator 🚀";
    else if (state.score >= 100) rank = "Level 1 System Calibrator";
    
    document.getElementById('final-level').innerText = rank;
    
    // Unveil Operator Code if score >= 250
    const rewardBox = document.getElementById('reward-box');
    if (state.score >= 250) {
        rewardBox.classList.remove('hidden');
    } else {
        rewardBox.classList.add('hidden');
    }
    
    document.getElementById('game-over-screen').classList.remove('hidden');
}

// Reset state to replay
function resetGame() {
    // Clear existing entities
    state.entities.forEach(ent => {
        state.scene.remove(ent.mesh);
        ent.mesh.geometry.dispose();
        ent.mesh.material.dispose();
    });
    state.entities = [];
    
    state.score = 0;
    state.shield = 100;
    state.tPlayer = 0;
    state.playerAngle = 0;
    state.targetAngle = 0;
    state.isGameOver = false;
    state.isPlaying = true;
    
    document.getElementById('score-display').innerText = '0000';
    document.getElementById('shield-bar').style.width = '100%';
    document.getElementById('shield-txt').innerText = '100%';
    
    document.getElementById('game-over-screen').classList.add('hidden');
    
    // Resume audio
    initAudioContext();
    startAudioSequencer();
}

// --- PROCEDURAL WEB AUDIO SYNTHESIZER ---
function initAudioContext() {
    if (state.audio.ctx) return;
    state.audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    state.audio.masterVolume = state.audio.ctx.createGain();
    state.audio.masterVolume.gain.setValueAtTime(state.audio.muted ? 0 : 0.25, state.audio.ctx.currentTime);
    state.audio.masterVolume.connect(state.audio.ctx.destination);
}

// Play synthesizer procedural SFX
function playSFX(type) {
    if (!state.audio.ctx || state.audio.muted) return;
    
    const ctx = state.audio.ctx;
    const now = ctx.currentTime;
    
    if (type === 'collect') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        
        osc.connect(gain);
        gain.connect(state.audio.masterVolume);
        osc.start(now);
        osc.stop(now + 0.13);
    } 
    else if (type === 'bonus') {
        // High arpeggio chord blip
        const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5 major arpeggio
        frequencies.forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + idx * 0.04);
            
            gain.gain.setValueAtTime(0.25, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.04 + 0.15);
            
            osc.connect(gain);
            gain.connect(state.audio.masterVolume);
            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.16);
        });
    }
    else if (type === 'damage') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.25);
        
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        
        osc.connect(gain);
        gain.connect(state.audio.masterVolume);
        osc.start(now);
        osc.stop(now + 0.26);
    }
    else if (type === 'gameover') {
        // Descending detuned chords
        const bases = [150, 148, 140];
        bases.forEach((base, idx) => {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc1.type = 'sawtooth';
            osc2.type = 'triangle';
            osc1.frequency.setValueAtTime(base, now + idx * 0.25);
            osc2.frequency.setValueAtTime(base * 1.02, now + idx * 0.25);
            
            gain.gain.setValueAtTime(0.35, now + idx * 0.25);
            gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.25 + 0.5);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(state.audio.masterVolume);
            
            osc1.start(now + idx * 0.25);
            osc2.start(now + idx * 0.25);
            osc1.stop(now + idx * 0.25 + 0.5);
            osc2.stop(now + idx * 0.25 + 0.5);
        });
    }
}

// Background dynamic music sequencer
function startAudioSequencer() {
    stopAudioSequencer();
    
    state.audio.isPlaying = true;
    const intervalTime = (60 / state.audio.bpm) / 4 * 1000; // sixteenth notes
    
    state.audio.sequencerInterval = setInterval(() => {
        if (!state.audio.isPlaying || state.audio.muted || !state.audio.ctx) return;
        
        const now = state.audio.ctx.currentTime;
        const step = state.audio.step;
        
        // Sequencer notes grid based on current Zen Relax state vs Active state
        const isRelax = state.d9State.isRelax;
        
        // 1. Bassline (Triangles/Sines)
        if (step % 4 === 0) {
            // Kick trigger
            const kickOsc = state.audio.ctx.createOscillator();
            const kickGain = state.audio.ctx.createGain();
            kickOsc.frequency.setValueAtTime(150, now);
            kickOsc.frequency.exponentialRampToValueAtTime(0.01, now + 0.15);
            kickGain.gain.setValueAtTime(isRelax ? 0.08 : 0.35, now);
            kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            kickOsc.connect(kickGain);
            kickGain.connect(state.audio.masterVolume);
            kickOsc.start(now);
            kickOsc.stop(now + 0.16);
            
            // Bass melody
            const bassOsc = state.audio.ctx.createOscillator();
            const bassGain = state.audio.ctx.createGain();
            bassOsc.type = 'triangle';
            
            const bassNotes = isRelax ? [55.0, 55.0, 65.4, 65.4] : [55.0, 65.4, 73.4, 82.4]; // A1, C2, D2, E2
            const noteIdx = Math.floor(step / 4) % bassNotes.length;
            
            bassOsc.frequency.setValueAtTime(bassNotes[noteIdx], now);
            bassGain.gain.setValueAtTime(0.2, now);
            bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            
            bassOsc.connect(bassGain);
            bassGain.connect(state.audio.masterVolume);
            bassOsc.start(now);
            bassOsc.stop(now + 0.26);
        }
        
        // 2. High Hat (White Noise / High pass filter pulse)
        if (!isRelax && (step % 4 === 2 || step % 8 === 7)) {
            // Play a synthetic hihat using high frequency sine waves
            const hatOsc = state.audio.ctx.createOscillator();
            const hatGain = state.audio.ctx.createGain();
            hatOsc.type = 'triangle';
            hatOsc.frequency.setValueAtTime(8000, now);
            hatGain.gain.setValueAtTime(0.04, now);
            hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            hatOsc.connect(hatGain);
            hatGain.connect(state.audio.masterVolume);
            hatOsc.start(now);
            hatOsc.stop(now + 0.07);
        }
        
        // 3. Arpeggiator Lead
        // Cyberpunk synth line arpeggios
        if (step % 2 === 0) {
            const leadNotes = isRelax 
                ? [220.0, 261.63, 329.63, 392.00] // A3 minor 7 chord (soft ambient)
                : [440.0, 523.25, 659.25, 587.33, 783.99, 880.0]; // A4 minor pentatonic arpeggio
            
            const leadOsc = state.audio.ctx.createOscillator();
            const leadGain = state.audio.ctx.createGain();
            leadOsc.type = 'sine';
            
            const noteIdx = step % leadNotes.length;
            leadOsc.frequency.setValueAtTime(leadNotes[noteIdx], now);
            
            leadGain.gain.setValueAtTime(isRelax ? 0.07 : 0.12, now);
            leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            
            leadOsc.connect(leadGain);
            leadGain.connect(state.audio.masterVolume);
            leadOsc.start(now);
            leadOsc.stop(now + 0.16);
        }
        
        state.audio.step = (state.audio.step + 1) % 16;
    }, intervalTime);
}

function stopAudioSequencer() {
    state.audio.isPlaying = false;
    if (state.audio.sequencerInterval) {
        clearInterval(state.audio.sequencerInterval);
        state.audio.sequencerInterval = null;
    }
}

// --- CLOCK & TIMING STATE SYNC ---
// Auto retrieves D9 time alignment details from parent state
function syncWithParentD9Clock() {
    let parentState = null;
    if (window.parent && window.parent !== window) {
        try {
            if (typeof window.parent.getCurrentD9State === 'function') {
                parentState = window.parent.getCurrentD9State();
            }
        } catch (e) {
            // Cross-origin safety
        }
    }
    
    // Fallback if not inside D9 parent viewport (calculate local D9 time)
    if (!parentState) {
        const totalSeconds = (new Date().getHours() * 3600) + (new Date().getMinutes() * 60) + new Date().getSeconds();
        const isRelax = (totalSeconds < 540) || (totalSeconds >= 43200 - 540 && totalSeconds < 43200 + 540) || (totalSeconds >= 86400 - 540);
        let h = Math.floor(totalSeconds / 3240) % 27;
        let m = Math.floor((totalSeconds % 3240) / 60);
        let s = totalSeconds % 60;
        let root = ((h - 1) % 9) + 1;
        parentState = { h, m, s, isRelax, root, hue: 184 };
    }
    
    state.d9State = parentState;
    
    // Update HUD clock elements
    document.getElementById('d9-h').innerText = String(parentState.h).padStart(2, '0');
    document.getElementById('d9-m').innerText = String(parentState.m).padStart(2, '0');
    document.getElementById('d9-s').innerText = String(parentState.s).padStart(2, '0');
    document.getElementById('d9-milli').innerText = '.' + String(Math.floor(performance.now() % 1000 * 1000)).padStart(6, '0');
    document.getElementById('d9-root').innerText = parentState.root;
    
    // Handle Relax phase logic
    const relaxIndicator = document.getElementById('relax-indicator');
    if (parentState.isRelax) {
        relaxIndicator.classList.remove('hidden');
        // Slow down gameplay speeds and calm colors during relax period
        state.speedMultiplier = 0.55;
    } else {
        relaxIndicator.classList.add('hidden');
        state.speedMultiplier = 1.0;
    }
}
setInterval(syncWithParentD9Clock, 40); // 25 fps updates on clocks

// --- ANIMATION LOOP ---
let lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);
    
    const delta = (time - lastTime) / 1000;
    lastTime = time;
    
    if (state.isPlaying && !state.isGameOver) {
        // 1. Process movement inputs
        const currentThrust = parseFloat(document.getElementById('speed-slider').value);
        // speed along lemniscate loop
        const flowVelocity = (currentThrust * 0.0006) * state.speedMultiplier;
        
        state.tPlayer = (state.tPlayer + flowVelocity) % (Math.PI * 2);
        
        // Banking input handling
        let angleDelta = 0;
        if (keys.ArrowLeft || keys.KeyA) angleDelta = 0.07;
        if (keys.ArrowRight || keys.KeyD) angleDelta = -0.07;
        
        state.playerAngle = (state.playerAngle + angleDelta + (Math.PI * 2)) % (Math.PI * 2);
        
        // Manual Speed thrust via keyboard
        if (keys.ArrowUp || keys.KeyW) {
            const slider = document.getElementById('speed-slider');
            slider.value = Math.min(parseFloat(slider.max), parseFloat(slider.value) + 0.5);
        }
        if (keys.ArrowDown || keys.KeyS) {
            const slider = document.getElementById('speed-slider');
            slider.value = Math.max(parseFloat(slider.min), parseFloat(slider.value) - 0.5);
        }
        
        // 2. Position player ship
        if (state.ship) {
            updateFrameAt(state.tPlayer, _framePlayer);
            
            _shipPos.copy(_framePlayer.position)
                .addScaledVector(_framePlayer.normal, Math.cos(state.playerAngle) * state.trackRadius)
                .addScaledVector(_framePlayer.binormal, Math.sin(state.playerAngle) * state.trackRadius);
            
            state.ship.position.copy(_shipPos);
            
            // Align ship rotation with Frenet-Serret frame
            // tangent = forward, outward vector = up
            _upVector.copy(_framePlayer.normal).multiplyScalar(Math.cos(state.playerAngle))
                .addScaledVector(_framePlayer.binormal, Math.sin(state.playerAngle))
                .normalize();
                
            _lookTarget.copy(_shipPos).add(_framePlayer.tangent);
            state.ship.lookAt(_lookTarget);
            
            // Apply bank roll manually
            state.ship.up.copy(_upVector);
            
            // Pulsate exhaust flame
            state.ship.children[2].scale.set(1.0, 1.0, 0.7 + Math.sin(time * 0.05) * 0.4);
        }
        
        // 3. Move and follow Camera
        // Camera positioned behind player along curve
        const camT = (state.tPlayer - 0.15 + (Math.PI * 2)) % (Math.PI * 2);
        updateFrameAt(camT, _frameCam);
        _camPos.copy(_frameCam.position)
            // Offset camera slightly outer of the tube track for visibility
            .addScaledVector(_frameCam.normal, Math.cos(state.playerAngle) * (state.trackRadius + 1.8))
            .addScaledVector(_frameCam.binormal, Math.sin(state.playerAngle) * (state.trackRadius + 1.8));
            
        state.camera.position.lerp(_camPos, 0.15);
        
        // Camera looks slightly ahead of player ship
        const lookT = (state.tPlayer + 0.08) % (Math.PI * 2);
        updateFrameAt(lookT, _frameLook);
        _lookPos.copy(_frameLook.position)
            .addScaledVector(_frameLook.normal, Math.cos(state.playerAngle) * state.trackRadius)
            .addScaledVector(_frameLook.binormal, Math.sin(state.playerAngle) * state.trackRadius);
            
        state.camera.lookAt(_lookPos);
        
        // 4. Update elements
        manageEntities();
        checkCollisions();
        
        // Rotate entities for visuals
        state.entities.forEach(ent => {
            ent.mesh.rotation.x += 0.015;
            ent.mesh.rotation.y += 0.025;
            
            // Hover scale bounce
            const scale = 1.0 + Math.sin(time * 0.005 + ent.t * 100) * 0.12;
            ent.mesh.scale.set(scale, scale, scale);
        });
    }
    
    // Ambient rotating starfield background
    if (state.starfield) {
        state.starfield.rotation.y += 0.0003;
        state.starfield.rotation.z += 0.0001;
    }
    
    // Update particle calculations
    updateParticles();
    
    // Render Frame
    if (state.renderer && state.scene && state.camera) {
        state.renderer.render(state.scene, state.camera);
    }
}

// --- WINDOW & EVENT BINDINGS ---
window.addEventListener('resize', () => {
    if (!state.renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    state.camera.aspect = width / height;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(width, height);
});

// Event Listeners for Keyboard control
window.addEventListener('keydown', (e) => {
    if (e.code in keys) {
        keys[e.code] = true;
        // Avoid browser scroll behavior on arrows
        if (e.code.startsWith('Arrow')) e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code in keys) {
        keys[e.code] = false;
    }
});

// Start button click
document.getElementById('btn-start').addEventListener('click', () => {
    document.getElementById('start-screen').classList.add('hidden');
    initAudioContext();
    startAudioSequencer();
    
    buildShip();
    state.isPlaying = true;
});

// Retry button click
document.getElementById('btn-retry').addEventListener('click', () => {
    resetGame();
});

// Audio mute toggle
document.getElementById('btn-audio').addEventListener('click', () => {
    state.audio.muted = !state.audio.muted;
    const btn = document.getElementById('btn-audio');
    
    if (state.audio.muted) {
        btn.innerText = "🔇 Audio: OFF";
        btn.style.borderColor = "var(--alert)";
        btn.style.color = "var(--alert)";
        if (state.audio.masterVolume) {
            state.audio.masterVolume.gain.setValueAtTime(0, state.audio.ctx.currentTime);
        }
    } else {
        btn.innerText = "🔊 Audio: ON";
        btn.style.borderColor = "var(--accent)";
        btn.style.color = "var(--accent)";
        initAudioContext();
        if (state.audio.masterVolume) {
            state.audio.masterVolume.gain.setValueAtTime(0.25, state.audio.ctx.currentTime);
        }
    }
});

// Bind Mobile Touch Control Buttons
function setupMobileControls() {
    const bindBtn = (id, keyCode) => {
        const el = document.getElementById(id);
        if (!el) return;

        const onPress = (e) => {
            e.preventDefault();
            keys[keyCode] = true;
        };
        const onRelease = (e) => {
            e.preventDefault();
            keys[keyCode] = false;
        };

        // Touch events
        el.addEventListener('touchstart', onPress, { passive: false });
        el.addEventListener('touchend', onRelease, { passive: false });
        el.addEventListener('touchcancel', onRelease, { passive: false });

        // Mouse fallbacks
        el.addEventListener('mousedown', onPress);
        el.addEventListener('mouseup', onRelease);
        el.addEventListener('mouseleave', onRelease);
    };

    bindBtn('ctrl-left', 'ArrowLeft');
    bindBtn('ctrl-right', 'ArrowRight');
    bindBtn('ctrl-down', 'ArrowDown');
    bindBtn('ctrl-up', 'ArrowUp');
}

// Start initialization
window.addEventListener('DOMContentLoaded', () => {
    initThree();
    setupMobileControls();
    
    // Pre-sync D9 alignment state
    syncWithParentD9Clock();
    
    // Start drawing loop
    requestAnimationFrame(animate);
});
