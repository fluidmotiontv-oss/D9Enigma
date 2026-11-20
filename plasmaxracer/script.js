import * as THREE from '../three.module.min.js';

// --- PLASMA XRACER 3D AUDIO-PHYSICS ENGINE ---

// Game States
let isGameRunning = false;
let score = 0;
let shield = 100;
let distanceTraveled = 0;
let baseSpeed = 0.0018; // speed along tube path
let playerSpeedMultiplier = 1.0;
let pathProgress = 0;

// Three.js Elements
let scene, camera, renderer;
let tubeGeometry, tubeMesh;
let playerPod;
let plasmaArcs = []; // line objects simulating electrical filaments
let entities = []; // crystals, barriers
let starsParticles;

// Frequencies mapping for chimes
const solfeggioFreqs = [396, 417, 528, 639, 741, 852];
let audioCtx = null;

// Controls State
const keys = { Left: false, Right: false, Up: false, Down: false };
let playerAngle = 0; // Angle around the tube center (radians)
let playerTargetAngle = 0;

// Tube Path Math (Sine Wave curve)
class SinusoidalCurve extends THREE.Curve {
    constructor(scale = 1) {
        super();
        this.scale = scale;
    }
    getPoint(t) {
        const tx = Math.sin(t * Math.PI * 4) * 12;
        const ty = Math.cos(t * Math.PI * 2) * 8;
        const tz = t * 600; // Deep tube tunnel
        return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale);
    }
}

const curveScale = 2.0;
const pathCurve = new SinusoidalCurve(curveScale);
const tubeRadius = 9.0;

// Initialize Game
function initGame() {
    // 1. Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x010103, 0.006);

    // 2. Camera setup
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.add(camera);

    // 3. Renderer setup
    const canvas = document.getElementById('gameCanvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x1a052e, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00e5ff, 0.6);
    dirLight.position.set(0, 10, 5);
    scene.add(dirLight);

    // 5. Build Plasma Tube Tunnel
    tubeGeometry = new THREE.TubeGeometry(pathCurve, 200, tubeRadius, 18, false);
    
    // Flat-shaded translucent electrical wire look
    const tubeMaterial = new THREE.MeshPhongMaterial({
        color: 0x221155,
        emissive: 0x0c0422,
        transparent: true,
        opacity: 0.35,
        wireframe: false,
        flatShading: true,
        side: THREE.DoubleSide
    });
    
    tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(tubeMesh);

    // Add glowing neon rings wrapping around the tube
    for (let i = 0.05; i < 1.0; i += 0.05) {
        const point = pathCurve.getPoint(i);
        const tangent = pathCurve.getTangent(i);
        
        const ringGeo = new THREE.RingGeometry(tubeRadius - 0.05, tubeRadius + 0.1, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: i % 0.1 === 0 ? 0xbd00ff : 0x00e5ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(point);
        ring.lookAt(point.clone().add(tangent));
        scene.add(ring);
    }

    // 6. Build Player Pod (A glowing orb with small orbiting satellites)
    playerPod = new THREE.Group();
    scene.add(playerPod);

    const coreGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const core = new THREE.Mesh(coreGeo, coreMat);
    playerPod.add(core);

    const auraGeo = new THREE.SphereGeometry(2.0, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.22
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    playerPod.add(aura);

    // Dynamic light emanating from the pod
    const podLight = new THREE.PointLight(0x00e5ff, 1.8, 40);
    playerPod.add(podLight);

    // 7. Initialize Plasma Filaments stretching from pod to tube walls
    initPlasmaArcs();

    // 8. Build Cosmic Background Plankton Stars
    const starCount = 300;
    const starsGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const t = Math.random();
        const pt = pathCurve.getPoint(t);
        const angle = Math.random() * Math.PI * 2;
        const rad = tubeRadius + 10 + Math.random() * 40;
        
        starPositions[i * 3] = pt.x + Math.sin(angle) * rad;
        starPositions[i * 3 + 1] = pt.y + Math.cos(angle) * rad;
        starPositions[i * 3 + 2] = pt.z;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
        color: 0xbd00ff,
        size: 1.2,
        transparent: true,
        opacity: 0.7
    });
    starsParticles = new THREE.Points(starsGeo, starsMat);
    scene.add(starsParticles);

    // 9. Spawn Game Crystals and Barriers
    spawnEntities();

    // 10. Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Create moving plasma filaments wiggling around the pod
function initPlasmaArcs() {
    const arcCount = 4;
    for (let i = 0; i < arcCount; i++) {
        const material = new THREE.LineBasicMaterial({
            color: i % 2 === 0 ? 0x00e5ff : 0xbd00ff,
            transparent: true,
            opacity: 0.8
        });
        const segments = 12;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(segments * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const line = new THREE.Line(geometry, material);
        
        scene.add(line);
        plasmaArcs.push({
            line: line,
            segments: segments,
            targetAngle: Math.random() * Math.PI * 2
        });
    }
}

// Update plasma arc coordinates dynamically to mimic Plasma Globe arcs wiggling
function updatePlasmaArcs() {
    if (!playerPod) return;
    const podPos = playerPod.position;

    // Get current tangent to keep local orientations
    const tangent = pathCurve.getTangent(pathProgress);
    const normal = new THREE.Vector3(0, 1, 0).projectOnPlane(tangent).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    plasmaArcs.forEach(arc => {
        const posAttr = arc.line.geometry.attributes.position;
        const positions = posAttr.array;

        // Arcs wiggle towards random spots on the wall
        arc.targetAngle += (Math.random() - 0.5) * 0.4;
        
        const wallPos = new THREE.Vector3()
            .copy(podPos)
            .add(normal.clone().multiplyScalar(Math.sin(arc.targetAngle) * (tubeRadius - 0.2)))
            .add(binormal.clone().multiplyScalar(Math.cos(arc.targetAngle) * (tubeRadius - 0.2)));

        for (let i = 0; i < arc.segments; i++) {
            const frac = i / (arc.segments - 1);
            
            // Fractal midpoint displacement noise to simulate electric spark branching
            const noiseX = (Math.random() - 0.5) * 1.5 * (1.0 - Math.pow(2 * frac - 1, 2));
            const noiseY = (Math.random() - 0.5) * 1.5 * (1.0 - Math.pow(2 * frac - 1, 2));
            const noiseZ = (Math.random() - 0.5) * 1.5 * (1.0 - Math.pow(2 * frac - 1, 2));

            const interpPos = new THREE.Vector3().lerpVectors(podPos, wallPos, frac);
            
            positions[i * 3] = interpPos.x + noiseX;
            positions[i * 3 + 1] = interpPos.y + noiseY;
            positions[i * 3 + 2] = interpPos.z + noiseZ;
        }
        posAttr.needsUpdate = true;
    });
}

// Spawn collectable gold crystals and laser spark barriers
function spawnEntities() {
    // Clear old ones
    entities.forEach(ent => scene.remove(ent.mesh));
    entities = [];

    const spacing = 0.015; // gap along path progress (0 to 1)
    
    for (let t = 0.08; t < 0.95; t += spacing) {
        const point = pathCurve.getPoint(t);
        const tangent = pathCurve.getTangent(t);
        const normal = new THREE.Vector3(0, 1, 0).projectOnPlane(tangent).normalize();
        const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
        
        const isBarrier = Math.random() < 0.35;
        const angle = Math.random() * Math.PI * 2;
        
        if (isBarrier) {
            // High voltage Spark Barrier Net
            const group = new THREE.Group();
            
            const ringGeo = new THREE.TorusGeometry(tubeRadius - 1.5, 0.25, 8, 24);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xbd00ff, wireframe: true });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            group.add(ring);
            
            // Internal electrical spokes
            const lineMat = new THREE.LineBasicMaterial({ color: 0xff0055 });
            const spokesGeo = new THREE.BufferGeometry();
            const positions = new Float32Array([
                0, 0, 0,  Math.sin(0) * (tubeRadius - 1.5), Math.cos(0) * (tubeRadius - 1.5), 0,
                0, 0, 0,  Math.sin(2.0) * (tubeRadius - 1.5), Math.cos(2.0) * (tubeRadius - 1.5), 0,
                0, 0, 0,  Math.sin(4.0) * (tubeRadius - 1.5), Math.cos(4.0) * (tubeRadius - 1.5), 0
            ]);
            spokesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const spokes = new THREE.LineSegments(spokesGeo, lineMat);
            group.add(spokes);

            group.position.copy(point);
            group.lookAt(point.clone().add(tangent));
            scene.add(group);

            entities.push({
                type: 'barrier',
                progress: t,
                angle: angle,
                mesh: group,
                radius: tubeRadius - 1.5,
                rotSpeed: 0.02 + Math.random() * 0.03
            });
        } else {
            // Solfeggio Golden Crystal (Octahedron)
            const crystalGeo = new THREE.OctahedronGeometry(1.3, 0);
            const crystalMat = new THREE.MeshPhongMaterial({
                color: 0xd4af37,
                emissive: 0x3d2b00,
                flatShading: true,
                shininess: 100
            });
            const mesh = new THREE.Mesh(crystalGeo, crystalMat);
            
            // Offset positioning on the inner walls of the tube
            const offsetDist = tubeRadius - 1.8;
            const targetPos = point.clone()
                .add(normal.clone().multiplyScalar(Math.sin(angle) * offsetDist))
                .add(binormal.clone().multiplyScalar(Math.cos(angle) * offsetDist));
            
            mesh.position.copy(targetPos);
            scene.add(mesh);

            entities.push({
                type: 'crystal',
                progress: t,
                angle: angle,
                mesh: mesh,
                radius: 1.6
            });
        }
    }
}

// Audio Synthesis Engines (Metronomes and sound chimes)
function initAudio() {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
}

function playChime(freq) {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Golden chime sound
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(now + 1.0);
}

function playShockSound() {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    const noiseGain = audioCtx.createGain();
    
    // Buzz spark sound
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
    
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.6, now + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    
    osc.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(now + 0.35);
}

// Window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Keyboard Bindings
window.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.Left = true;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.Right = true;
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.Up = true;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.Down = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.Left = false;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.Right = false;
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.Up = false;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.Down = false;
});

// Setup Touch Screen Event Bindings
function bindTouchControls() {
    const setupBtn = (id, keyName) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyName] = true; });
        el.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyName] = false; });
        el.addEventListener('touchcancel', (e) => { e.preventDefault(); keys[keyName] = false; });
    };
    
    setupBtn('touch-left', 'Left');
    setupBtn('touch-right', 'Right');
    setupBtn('touch-boost', 'Up');
    setupBtn('touch-slow', 'Down');
}

// Collisions check
function checkCollisions() {
    const pVec = playerPod.position;
    
    for (let i = entities.length - 1; i >= 0; i--) {
        const ent = entities[i];
        
        // Compute distance from player to entity mesh
        const dist = pVec.distanceTo(ent.mesh.position);
        
        if (ent.type === 'crystal') {
            if (dist < ent.radius + 1.8) {
                // Collect crystal
                score += 100;
                
                // Audio chime feedback
                const freq = solfeggioFreqs[Math.floor(Math.random() * solfeggioFreqs.length)];
                playChime(freq);
                
                // Visual spark flash
                scene.remove(ent.mesh);
                entities.splice(i, 1);
                
                updateHUD();
            }
        } else if (ent.type === 'barrier') {
            // Check angular intersection on slice
            const progressDelta = Math.abs(pathProgress - ent.progress);
            if (progressDelta < 0.005) {
                // Compare angles
                const playerModAngle = ((playerAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                const barrierModAngle = ((ent.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                const angleDiff = Math.abs(playerModAngle - barrierModAngle);
                
                if (angleDiff < 1.1 || angleDiff > (Math.PI * 2 - 1.1)) {
                    // Shock collision!
                    shield -= 25;
                    playShockSound();
                    
                    // Shake camera effect
                    camera.position.x += (Math.random() - 0.5) * 3;
                    camera.position.y += (Math.random() - 0.5) * 3;

                    // Remove barrier
                    scene.remove(ent.mesh);
                    entities.splice(i, 1);

                    if (shield <= 0) {
                        endGame();
                    }
                    
                    updateHUD();
                }
            }
        }
    }
}

// Update HUD Interface
function updateHUD() {
    document.getElementById('hud-crystals').textContent = score / 100;
    document.getElementById('hud-shield').textContent = `${shield}%`;
    document.getElementById('shield-fill').style.width = `${shield}%`;
    document.getElementById('hud-distance').textContent = `${Math.floor(distanceTraveled)}m`;
    
    const displaySpeed = Math.floor(150 * playerSpeedMultiplier);
    document.getElementById('hud-speed').textContent = `${displaySpeed} Tw`;
}

// Game Loop
function gameLoop() {
    if (!isGameRunning) return;
    requestAnimationFrame(gameLoop);

    // 1. Move player forward along path curve
    let targetSpeedMultiplier = 1.0;
    if (keys.Up) targetSpeedMultiplier = 1.7; // boost
    if (keys.Down) targetSpeedMultiplier = 0.5; // slow
    
    playerSpeedMultiplier += (targetSpeedMultiplier - playerSpeedMultiplier) * 0.1;
    pathProgress += baseSpeed * playerSpeedMultiplier;
    distanceTraveled += playerSpeedMultiplier * 1.5;

    // Loop course progress
    if (pathProgress >= 0.98) {
        pathProgress = 0.01;
        // respawn items
        spawnEntities();
    }

    // 2. Adjust Camera position following the curve
    const currentPoint = pathCurve.getPoint(pathProgress);
    const aheadPoint = pathCurve.getPoint(pathProgress + 0.005);
    
    const tangent = pathCurve.getTangent(pathProgress);
    const normal = new THREE.Vector3(0, 1, 0).projectOnPlane(tangent).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    // 3. User Banking movement around tube wall slice
    let bankDirection = 0;
    if (keys.Left) bankDirection = -0.06;
    if (keys.Right) bankDirection = 0.06;
    
    playerTargetAngle += bankDirection;
    playerAngle += (playerTargetAngle - playerAngle) * 0.15;

    // Player position offset from center core based on angle
    const offsetDistance = tubeRadius - 2.8;
    const offsetVector = normal.clone().multiplyScalar(Math.sin(playerAngle) * offsetDistance)
        .add(binormal.clone().multiplyScalar(Math.cos(playerAngle) * offsetDistance));
    
    const targetPlayerPos = currentPoint.clone().add(offsetVector);
    playerPod.position.copy(targetPlayerPos);

    // Align camera slightly behind player pod
    const camPoint = pathCurve.getPoint(Math.max(0.001, pathProgress - 0.012));
    const camOffset = normal.clone().multiplyScalar(Math.sin(playerAngle) * (offsetDistance * 0.7))
        .add(binormal.clone().multiplyScalar(Math.cos(playerAngle) * (offsetDistance * 0.7)));
        
    camera.position.copy(camPoint.clone().add(camOffset));
    camera.lookAt(playerPod.position.clone().add(tangent.clone().multiplyScalar(15)));

    // Rotate player core mesh
    playerPod.rotation.z += 0.04;

    // 4. Update dynamic electrical filaments
    updatePlasmaArcs();

    // 5. Spin crystals and barriers
    entities.forEach(ent => {
        if (ent.type === 'crystal') {
            ent.mesh.rotation.y += 0.02;
            ent.mesh.rotation.x += 0.015;
        } else if (ent.type === 'barrier') {
            ent.mesh.rotation.z += ent.rotSpeed;
        }
    });

    // 6. Check Collisions
    checkCollisions();

    // 7. Render Frame
    renderer.render(scene, camera);

    // Distance increment HUD update
    if (Math.floor(distanceTraveled) % 10 === 0) {
        updateHUD();
    }
}

// Start game
function startGame() {
    isGameRunning = true;
    score = 0;
    shield = 100;
    distanceTraveled = 0;
    pathProgress = 0.01;
    playerAngle = 0;
    playerTargetAngle = 0;

    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    updateHUD();
    gameLoop();
}

function endGame() {
    isGameRunning = false;
    document.getElementById('final-crystals').textContent = score / 100;
    document.getElementById('final-distance').textContent = `${Math.floor(distanceTraveled)}m`;
    
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// Page Startup Initialization
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);

initGame();
bindTouchControls();

// Render single pre-start frame
const previewPoint = pathCurve.getPoint(pathProgress);
playerPod.position.copy(previewPoint);
camera.position.copy(pathCurve.getPoint(0.001));
camera.lookAt(playerPod.position);
renderer.render(scene, camera);
