// Harmonic Home Designer Engine
// Handles SVG/Canvas grids, Feng Shui Bagua solvers, solfeggio audio synthesizers, and eco-materials math

// State variables
let activeTool = 'room';
let activeMaterial = 'hemp';
let rooms = [
    // Pre-populate with a cozy sample master room
    { id: 1, x: 80, y: 80, w: 280, h: 220, label: 'Master Suite', length: 4.5, width: 3.6, height: 2.8, material: 'hemp' }
];
let furniture = [
    { type: 'bed', x: 200, y: 120, emoji: '🛏️', label: 'Hemp Queen Bed' },
    { type: 'desk', x: 120, y: 240, emoji: '💻', label: 'Timber Desk' },
    { type: 'plant', x: 95, y: 95, emoji: '🪴', label: 'Fiddle Leaf Fig' }
];

let showGrid = true;
let showBagua = true;
let isDrawingRoom = false;
let drawStartX = 0;
let drawStartY = 0;
let currentMouseX = 0;
let currentMouseY = 0;
let draggingNode = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Solar sun coordinates tracker
let currentSunPos = { x: 0, y: 350, z: -180 };

// WebAudio variables for calibrating space clear frequency
let audioCtx = null;
let oscillator = null;
let gainNode = null;
let isPlayingTone = false;

// Speed of Sound in dry air at 20°C (m/s)
const SPEED_OF_SOUND = 343;

// Solfeggio scale targets
const SOLFEGGIO_FREQS = [
    { freq: 174, label: "174 Hz // Foundation & Pain Relief" },
    { freq: 285, label: "285 Hz // Acceleration & Tissue Healing" },
    { freq: 396, label: "396 Hz // Liberating Guilt & Fear" },
    { freq: 417, label: "417 Hz // Facilitating Change & Cleansing" },
    { freq: 432, label: "432 Hz // Natural Cosmic Resonance" },
    { freq: 528, label: "528 Hz // Transformation, Love & DNA Repair" },
    { freq: 639, label: "639 Hz // Harmonizing Relationships & Union" },
    { freq: 741, label: "741 Hz // Awakening Intuition & Space Clearing" },
    { freq: 852, label: "852 Hz // Return to Spiritual Order" },
    { freq: 963, label: "963 Hz // Divine Consciousness & Crown Chakra" }
];

// Eco material specifications
const MATERIALS = {
    hemp: { name: "Hempcrete Core", co2: -110, rvalue: 3.5, thermal: "High", color: "rgba(141, 163, 146, 0.45)", border: "#8da392" },
    cob: { name: "Cob / Rammed Earth", co2: -15, rvalue: 1.8, thermal: "Ultra High", color: "rgba(188, 160, 108, 0.45)", border: "#bca06c" },
    wood: { name: "Untreated Timber", co2: -60, rvalue: 2.4, thermal: "Moderate", color: "rgba(223, 213, 198, 0.45)", border: "#dfd5c6" },
    clay: { name: "Clay Plaster", co2: -5, rvalue: 0.8, thermal: "Moderate", color: "rgba(200, 138, 117, 0.45)", border: "#c88a75" },
    cork: { name: "Cork & Bamboo", co2: -80, rvalue: 3.0, thermal: "Low-Moderate", color: "rgba(93, 143, 109, 0.45)", border: "#5d8f6d" }
};

// Canvas references
let canvas, ctx;

// Expose functions to window for onclick bindings
window.setTool = function(toolName) {
    activeTool = toolName;
    document.querySelectorAll('.tool-card').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`tool-${toolName}`);
    if (activeBtn) activeBtn.classList.add('active');
};

window.selectMaterial = function(matKey) {
    activeMaterial = matKey;
    document.querySelectorAll('.material-card').forEach(btn => btn.classList.remove('active'));
    const activeCard = document.getElementById(`mat-${matKey}`);
    if (activeCard) activeCard.classList.add('active');
    
    // Update materials on the first room block for simplicity
    if (rooms.length > 0) {
        rooms[0].material = matKey;
        calculateLedger();
        draw();
    }
};

window.toggleGrid = function() {
    showGrid = !showGrid;
    draw();
};

window.toggleBagua = function() {
    showBagua = !showBagua;
    const btn = document.getElementById('btn-bagua');
    if (showBagua) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
    draw();
};

window.clearCanvas = function() {
    rooms = [];
    furniture = [];
    calculateLedger();
    draw();
};

window.exportBlueprint = function() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ rooms, furniture }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "harmonic_blueprint.json");
    dlAnchorElem.click();
};

// Initial page mount configuration
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('design-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    
    // Initialize room dimensions input fields to match sample room
    const lengthInput = document.getElementById('input-length');
    const widthInput = document.getElementById('input-width');
    const heightInput = document.getElementById('input-height');
    
    if (rooms.length > 0) {
        lengthInput.value = rooms[0].length;
        widthInput.value = rooms[0].width;
        heightInput.value = rooms[0].height;
    }

    // Attach mouse event listeners for drawing and dragging nodes
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    // Run initial diagnostics & ledger summaries
    calculateLedger();
    calculateRoomResonance();
    updateSolarSimulation();
    draw();
});

// Resonances calculations
window.updateRoomDimensions = function() {
    const length = parseFloat(document.getElementById('input-length').value) || 4.0;
    const width = parseFloat(document.getElementById('input-width').value) || 3.0;
    const height = parseFloat(document.getElementById('input-height').value) || 2.4;

    if (rooms.length > 0) {
        rooms[0].length = length;
        rooms[0].width = width;
        rooms[0].height = height;
        
        // Scale canvas width & height proportional to dimension ratio
        rooms[0].w = length * 60;
        rooms[0].h = width * 60;
    }
    calculateRoomResonance();
    calculateLedger();
    draw();
};

function calculateRoomResonance() {
    const length = parseFloat(document.getElementById('input-length').value) || 4.5;
    const width = parseFloat(document.getElementById('input-width').value) || 3.6;
    const height = parseFloat(document.getElementById('input-height').value) || 2.8;

    // Calculate fundamental axial modes
    const modeL = SPEED_OF_SOUND / (2 * length);
    const modeW = SPEED_OF_SOUND / (2 * width);
    const modeH = SPEED_OF_SOUND / (2 * height);

    // Primary modal frequency (lowest resonant frequency mode)
    const primaryFreq = Math.min(modeL, modeW, modeH);
    document.getElementById('resonant-frequency').innerText = primaryFreq.toFixed(1);

    // Check Solfeggio Scale match (comparing with primary modal harmonics)
    let bestMatch = null;
    let minDifference = Infinity;

    // We cycle through Solfeggio Scale targets and check multiples (harmonics) of primary modal freq
    for (let target of SOLFEGGIO_FREQS) {
        // Test primary frequency or its closest integer octaves (multiples)
        for (let mult = 1; mult <= 12; mult++) {
            const testFreq = primaryFreq * mult;
            const diff = Math.abs(testFreq - target.freq);
            if (diff < minDifference) {
                minDifference = diff;
                bestMatch = { target, diff };
            }
        }
    }

    const matchEl = document.getElementById('solfeggio-match');
    if (minDifference < 5.0 && bestMatch) {
        matchEl.innerText = `${bestMatch.target.label} (Difference: ${minDifference.toFixed(1)} Hz)`;
        matchEl.style.color = "var(--success)";
    } else {
        matchEl.innerText = "NONE // Resize room width/length to align with Solfeggio resonance.";
        matchEl.style.color = "var(--accent-clay)";
    }

    // Adjust synthesizer tone frequency dynamically if playing
    if (isPlayingTone && oscillator) {
        // Bring frequency up into audible range if too low to hear (e.g. > 100Hz)
        let audibleFreq = primaryFreq;
        while (audibleFreq < 120) {
            audibleFreq *= 2;
        }
        oscillator.frequency.setValueAtTime(audibleFreq, audioCtx.currentTime);
    }
}

// WebAudio calibration synth clears
window.toggleSpaceClearTone = function() {
    const btn = document.getElementById('btn-sound-clear');
    
    if (isPlayingTone) {
        // Stop playing
        if (oscillator) {
            oscillator.stop();
            oscillator.disconnect();
        }
        isPlayingTone = false;
        btn.innerText = "🔊 PLAY TUNING TONE";
        btn.classList.remove('playing');
    } else {
        // Start playing tone
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const length = parseFloat(document.getElementById('input-length').value) || 4.5;
        const modeL = SPEED_OF_SOUND / (2 * length);
        
        // Scale frequency to audible octave
        let soundFreq = modeL;
        while (soundFreq < 120) {
            soundFreq *= 2;
        }
        
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(soundFreq, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime); // keep volume subtle/harmonic
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        isPlayingTone = true;
        btn.innerText = "🔇 STOP TUNING TONE";
        btn.classList.add('playing');
    }
};

import * as THREE from '../three.module.min.js';

let selectedItem = null;
let selectedType = null;

function selectItem(item, type) {
    selectedItem = item;
    selectedType = type;
    
    const nameEl = document.getElementById('inspector-name');
    const lengthInput = document.getElementById('inspect-length');
    const widthInput = document.getElementById('inspect-width');
    const heightInput = document.getElementById('inspect-height');
    
    if (!item) {
        nameEl.innerText = 'Select an item to inspect';
        return;
    }
    
    if (type === 'room') {
        nameEl.innerText = item.label;
        lengthInput.value = item.length;
        widthInput.value = item.width;
        heightInput.value = item.height;
    } else {
        nameEl.innerText = item.label || item.type.toUpperCase();
        if (!item.length) item.length = 1.0;
        if (!item.width) item.width = 1.0;
        if (!item.height) item.height = 1.0;
        
        lengthInput.value = item.length;
        widthInput.value = item.width;
        heightInput.value = item.height;
    }
    
    draw();
    if (show3D) {
        syncThreeScene();
    }
}

window.updateInspectDimensions = function() {
    if (!selectedItem) return;
    
    const length = parseFloat(document.getElementById('inspect-length').value) || 1.0;
    const width = parseFloat(document.getElementById('inspect-width').value) || 1.0;
    const height = parseFloat(document.getElementById('inspect-height').value) || 1.0;
    
    selectedItem.length = length;
    selectedItem.width = width;
    selectedItem.height = height;
    
    if (selectedType === 'room') {
        selectedItem.w = length * 60;
        selectedItem.h = width * 60;
        calculateRoomResonance();
    }
    
    calculateLedger();
    draw();
    if (show3D) {
        syncThreeScene();
    }
};

// Canvas drawing events
function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicking near an existing furniture node to drag it
    for (let f of furniture) {
        const dx = clickX - f.x;
        const dy = clickY - f.y;
        if (Math.sqrt(dx*dx + dy*dy) < 25) {
            selectItem(f, 'furniture');
            draggingNode = f;
            dragOffsetX = dx;
            dragOffsetY = dy;
            return;
        }
    }

    // Check if clicking inside a room to select it
    for (let room of rooms) {
        if (clickX >= room.x && clickX <= room.x + room.w &&
            clickY >= room.y && clickY <= room.y + room.h) {
            selectItem(room, 'room');
            return;
        }
    }

    if (activeTool === 'room') {
        isDrawingRoom = true;
        drawStartX = clickX;
        drawStartY = clickY;
    } else {
        // Placing standalone elements
        let placedEmoji = '🚪';
        let placedLabel = '';
        if (activeTool === 'door') { placedEmoji = '🚪'; placedLabel = 'Energy Portal Door'; }
        else if (activeTool === 'window') { placedEmoji = '🪟'; placedLabel = 'Solar Window'; }
        else if (activeTool === 'bed') { placedEmoji = '🛏️'; placedLabel = 'Hemp Mattress'; }
        else if (activeTool === 'desk') { placedEmoji = '💻'; placedLabel = 'Command Desk'; }
        else if (activeTool === 'fountain') { placedEmoji = '⛲'; placedLabel = 'Water Element Fountain'; }
        else if (activeTool === 'plant') { placedEmoji = '🪴'; placedLabel = 'Air Cleansing Fern'; }
        else if (activeTool === 'crystal') { placedEmoji = '🔮'; placedLabel = 'Amethyst Protection Crystal'; }

        const newNode = {
            type: activeTool,
            x: clickX,
            y: clickY,
            emoji: placedEmoji,
            label: placedLabel,
            length: 1.2,
            width: 1.2,
            height: 1.0
        };
        furniture.push(newNode);
        selectItem(newNode, 'furniture');
        
        runDiagnostics();
        draw();
    }
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    currentMouseX = e.clientX - rect.left;
    currentMouseY = e.clientY - rect.top;

    if (draggingNode) {
        draggingNode.x = currentMouseX - dragOffsetX;
        draggingNode.y = currentMouseY - dragOffsetY;
        runDiagnostics();
        draw();
    } else if (isDrawingRoom) {
        draw();
    }
}

function handleMouseUp(e) {
    if (isDrawingRoom) {
        isDrawingRoom = false;
        const rect = canvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;
        
        const w = Math.abs(endX - drawStartX);
        const h = Math.abs(endY - drawStartY);
        
        if (w > 25 && h > 25) {
            const rx = Math.min(drawStartX, endX);
            const ry = Math.min(drawStartY, endY);
            
            const length = w / 60;
            const width = h / 60;
            
            const newRoom = {
                id: Date.now(),
                x: rx,
                y: ry,
                w: w,
                h: h,
                label: `Room Zone #${rooms.length + 1}`,
                length: parseFloat(length.toFixed(1)),
                width: parseFloat(width.toFixed(1)),
                height: 2.8,
                material: activeMaterial
            };
            rooms.push(newRoom);
            selectItem(newRoom, 'room');
            
            document.getElementById('input-length').value = length.toFixed(1);
            document.getElementById('input-width').value = width.toFixed(1);
            
            calculateRoomResonance();
            calculateLedger();
        }
        draw();
    }
    
    if (draggingNode) {
        draggingNode = null;
    }
}

// Energy and material calculations
function calculateLedger() {
    let totalVolume = 0;
    let totalCO2 = 0;
    let baseRValue = 3.5;
    let thermalMass = 'Moderate';

    rooms.forEach(room => {
        const volume = room.length * room.width * room.height;
        totalVolume += volume;
        
        const wallPerimeter = 2 * (room.length + room.width);
        const wallVolume = wallPerimeter * 0.3 * room.height;
        
        const spec = MATERIALS[room.material] || MATERIALS.hemp;
        totalCO2 += wallVolume * spec.co2;
        baseRValue = spec.rvalue;
        thermalMass = spec.thermal;
    });

    document.getElementById('ledger-co2').innerText = `${Math.round(totalCO2)} kg`;
    document.getElementById('ledger-rvalue').innerText = `R-${baseRValue.toFixed(1)}`;
    document.getElementById('ledger-thermal').innerText = thermalMass;
}

// Real-time Feng Shui diagnostics and alerts solver
function runDiagnostics() {
    const listEl = document.getElementById('diagnostic-checklist');
    if (!listEl) return;

    listEl.innerHTML = '';
    let alerts = [];
    let successes = [];

    const doors = furniture.filter(f => f.type === 'door');
    const windows = furniture.filter(f => f.type === 'window');
    const beds = furniture.filter(f => f.type === 'bed');
    const desks = furniture.filter(f => f.type === 'desk');
    const fountains = furniture.filter(f => f.type === 'fountain');
    const plants = furniture.filter(f => f.type === 'plant');

    beds.forEach(bed => {
        doors.forEach(door => {
            const dx = Math.abs(bed.x - door.x);
            if (dx < 40 && bed.y > door.y) {
                alerts.push("⚠️ Coffin Alignment Warning: Bed directly opposite a Door node. Move bed out of straight path of entry to prevent draining vital Chi.");
            }
        });
    });

    desks.forEach(desk => {
        let backedByDoor = false;
        doors.forEach(door => {
            if (desk.y < door.y && Math.abs(desk.x - door.x) < 80) {
                backedByDoor = true;
            }
        });
        if (backedByDoor) {
            alerts.push("⚠️ Vulnerability Flag: Workspace Desk is backed directly to an entry Door. Place desk in the command position (facing entry with a solid wall behind you).");
        } else {
            successes.push("✓ Command position: Desk has protected backing relative to entry vectors.");
        }
    });

    fountains.forEach(fountain => {
        if (fountain.x < 200 && fountain.y < 170) {
            successes.push("✓ Prosperity Flow: Water Fountain placed in Wealth & Abundance sector (Southeast).");
        }
    });

    plants.forEach(plant => {
        if (plant.x < 200 && plant.y >= 170 && plant.y <= 330) {
            successes.push("✓ Vitality: Wood Element plant placed in Family & Health sector (East) to boost grounding.");
        }
    });

    doors.forEach(door => {
        windows.forEach(win => {
            const dx = Math.abs(door.x - win.x);
            if (dx < 20) {
                alerts.push("⚠️ Piercing Chi Leak: Window directly aligns with Door. Energy enters and exits instantly without pooling inside. Use screens or plants to disperse flow.");
            }
        });
    });

    if (alerts.length === 0 && successes.length === 0) {
        listEl.innerHTML = `<div class="check-item success-item">
            <span class="check-icon">✓</span>
            <div class="check-text">Place Bed, Doors, and Plants on the drawing grid to scan Feng Shui properties.</div>
        </div>`;
        return;
    }

    alerts.forEach(alertText => {
        const item = document.createElement('div');
        item.className = 'check-item alert-item';
        item.innerHTML = `<span class="check-icon">⚠️</span><div class="check-text">${alertText}</div>`;
        listEl.appendChild(item);
    });

    successes.forEach(successText => {
        const item = document.createElement('div');
        item.className = 'check-item success-item';
        item.innerHTML = `<span class="check-icon">✓</span><div class="check-text">${successText}</div>`;
        listEl.appendChild(item);
    });
}

// Main canvas redraw loop
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2D Solar Angle & Rays Projection from physical currentSunPos coordinates
    const sx = currentSunPos.x;
    const sy = currentSunPos.y;
    const sz = currentSunPos.z;
    const len = Math.sqrt(sx*sx + sy*sy + sz*sz);
    
    const rx = -sx / len;
    const ry = -sy / len;
    const rz = -sz / len;

    // Draw projected window light beams if sun is above horizon
    if (sy > 5) {
        const wy = 45; 
        const t = -wy / ry;
        const rayOffsetX = rx * t;
        const rayOffsetY = rz * t;
        
        furniture.forEach(item => {
            if (item.type === 'window') {
                ctx.fillStyle = `rgba(255, 230, 128, ${0.18 * (sy / 350)})`;
                ctx.beginPath();
                ctx.moveTo(item.x - 15, item.y);
                ctx.lineTo(item.x + 15, item.y);
                ctx.lineTo(item.x + 15 + rayOffsetX, item.y + rayOffsetY);
                ctx.lineTo(item.x - 15 + rayOffsetX, item.y + rayOffsetY);
                ctx.closePath();
                ctx.fill();
            }
        });
    }

    // Cardinal Direction Guidelines (NZ Sun orientation: North is Up/Top of screen)
    ctx.font = "bold 9px 'Share Tech Mono', monospace";
    ctx.fillStyle = "rgba(141, 163, 146, 0.45)";
    ctx.textAlign = "center";
    ctx.fillText("▲ N (NORTH SKY tilt)", canvas.width / 2, 18);
    ctx.fillText("▼ S (SOUTH)", canvas.width / 2, canvas.height - 10);
    ctx.fillText("E ▶", canvas.width - 25, canvas.height / 2);
    ctx.fillText("◀ W", 25, canvas.height / 2);

    if (showGrid) {
        ctx.strokeStyle = "rgba(141, 163, 146, 0.05)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    if (showBagua) {
        const segW = canvas.width / 3;
        const segH = canvas.height / 3;
        
        ctx.strokeStyle = "rgba(223, 213, 198, 0.12)";
        ctx.lineWidth = 2.0;
        ctx.setLineDash([6, 6]);

        for (let i = 1; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(segW * i, 0);
            ctx.lineTo(segW * i, canvas.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, segH * i);
            ctx.lineTo(canvas.width, segH * i);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        const sectors = [
            { name: "WEALTH (SE)", x: segW*0.5, y: segH*0.15 },
            { name: "FAME (S)", x: segW*1.5, y: segH*0.15 },
            { name: "LOVE (SW)", x: segW*2.5, y: segH*0.15 },
            { name: "FAMILY (E)", x: segW*0.5, y: segH*1.15 },
            { name: "TAI CHI (HEALTH)", x: segW*1.5, y: segH*1.15 },
            { name: "CREATIVE (W)", x: segW*2.5, y: segH*1.15 },
            { name: "WISDOM (NE)", x: segW*0.5, y: segH*2.15 },
            { name: "CAREER (N)", x: segW*1.5, y: segH*2.15 },
            { name: "HELPFUL (NW)", x: segW*2.5, y: segH*2.15 }
        ];

        ctx.font = "8px 'Share Tech Mono', monospace";
        ctx.fillStyle = "rgba(223, 213, 198, 0.35)";
        ctx.textAlign = "center";
        sectors.forEach(s => {
            ctx.fillText(s.name, s.x, s.y);
        });
    }

    rooms.forEach(room => {
        const spec = MATERIALS[room.material] || MATERIALS.hemp;
        ctx.fillStyle = spec.color;
        ctx.fillRect(room.x, room.y, room.w, room.h);
        
        ctx.strokeStyle = spec.border;
        ctx.lineWidth = 3;
        ctx.strokeRect(room.x, room.y, room.w, room.h);

        // Selection highlight
        if (selectedItem === room) {
            ctx.strokeStyle = "var(--accent-clay)";
            ctx.lineWidth = 4;
            ctx.strokeRect(room.x - 2, room.y - 2, room.w + 4, room.h + 4);
        }

        ctx.fillStyle = "var(--text-main)";
        ctx.font = "11px 'Comfortaa', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(room.label, room.x + 12, room.y + 24);

        ctx.fillStyle = "var(--text-muted)";
        ctx.font = "9px 'Share Tech Mono', monospace";
        ctx.fillText(`${room.length}m x ${room.width}m`, room.x + 12, room.y + 40);
    });

    if (isDrawingRoom) {
        ctx.fillStyle = "rgba(141, 163, 146, 0.25)";
        ctx.fillRect(drawStartX, drawStartY, currentMouseX - drawStartX, currentMouseY - drawStartY);
        ctx.strokeStyle = "var(--accent-sage)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(drawStartX, drawStartY, currentMouseX - drawStartX, currentMouseY - drawStartY);
        ctx.setLineDash([]);
    }

    furniture.forEach(item => {
        // Selection highlight ring
        if (selectedItem === item) {
            ctx.fillStyle = "rgba(200, 138, 117, 0.15)";
            ctx.beginPath();
            ctx.arc(item.x, item.y, 22, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = "var(--accent-clay)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(item.x, item.y, 22, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.beginPath();
            ctx.arc(item.x, item.y, 16, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(item.x, item.y, 16, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.font = "20px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.emoji, item.x, item.y);

        ctx.font = "8px 'Share Tech Mono', monospace";
        ctx.fillStyle = "var(--text-muted)";
        ctx.fillText(item.type.toUpperCase(), item.x, item.y + 25);
    });
}

// Three.js 3D Viewport Setup
let show3D = false;
let scene, camera, renderer;
let animationFrameId = null;
let cameraRotation = { theta: Math.PI / 4, phi: Math.PI / 6, radius: 550 };
let isDragging3D = false;
let prevMouse3D = { x: 0, y: 0 };
let threeMeshes = [];
let mouseDownPos = { x: 0, y: 0 };

let dirLight = null;
let ambientLight = null;
let solarPlayInterval = null;
let isSolarPlaying = false;

const raycaster = new THREE.Raycaster();
const mouse3D = new THREE.Vector2();

window.toggle3DView = function() {
    show3D = !show3D;
    const canvasEl = document.getElementById('design-canvas');
    const container3D = document.getElementById('three-container');
    const btn = document.getElementById('btn-3d-toggle');
    
    if (show3D) {
        canvasEl.style.display = 'none';
        container3D.style.display = 'block';
        btn.classList.add('active');
        initThree();
    } else {
        canvasEl.style.display = 'block';
        container3D.style.display = 'none';
        btn.classList.remove('active');
        stopThree();
        draw();
    }
};

function initThree() {
    const container = document.getElementById('three-container');
    container.innerHTML = '';
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c100d);
    
    camera = new THREE.PerspectiveCamera(40, 600 / 500, 1, 2000);
    updateCameraPosition();
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 500);
    container.appendChild(renderer.domElement);
    
    ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);
    
    dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(250, 450, 200);
    scene.add(dirLight);
    
    const gridHelper = new THREE.GridHelper(600, 20, 0x8da392, 0x1f2621);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);
    
    // Calibrate solar lights immediately
    updateSolarSimulation();
    
    syncThreeScene();
    
    container.addEventListener('mousedown', handleThreeMouseDown);
    container.addEventListener('mousemove', handleThreeMouseMove);
    container.addEventListener('mouseup', handleThreeMouseUp);
    container.addEventListener('mouseleave', handleThreeMouseUp);
    
    animateThree();
}

function updateCameraPosition() {
    camera.position.x = cameraRotation.radius * Math.sin(cameraRotation.theta) * Math.cos(cameraRotation.phi);
    camera.position.y = cameraRotation.radius * Math.sin(cameraRotation.phi);
    camera.position.z = cameraRotation.radius * Math.cos(cameraRotation.theta) * Math.cos(cameraRotation.phi);
    camera.lookAt(0, 0, 0);
}

function handleThreeMouseDown(e) {
    isDragging3D = true;
    prevMouse3D.x = e.clientX;
    prevMouse3D.y = e.clientY;
    
    mouseDownPos.x = e.clientX;
    mouseDownPos.y = e.clientY;
}

function handleThreeMouseMove(e) {
    if (!isDragging3D) return;
    const deltaX = e.clientX - prevMouse3D.x;
    const deltaY = e.clientY - prevMouse3D.y;
    
    cameraRotation.theta -= deltaX * 0.007;
    cameraRotation.phi += deltaY * 0.007;
    cameraRotation.phi = Math.max(0.05, Math.min(Math.PI / 2.05, cameraRotation.phi));
    
    prevMouse3D.x = e.clientX;
    prevMouse3D.y = e.clientY;
    
    updateCameraPosition();
}

function handleThreeMouseUp(e) {
    isDragging3D = false;
    
    const dx = e.clientX - mouseDownPos.x;
    const dy = e.clientY - mouseDownPos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < 6) {
        handleThreeClick(e);
    }
}

function handleThreeClick(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse3D.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse3D.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse3D, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        const handleHit = intersects.find(hit => hit.object.userData && hit.object.userData.isHandle);
        if (handleHit) {
            const handle = handleHit.object;
            const item = handle.userData.ref;
            const axis = handle.userData.axis;
            const dir = handle.userData.dir;
            const type = handle.userData.type;
            
            if (axis === 'x') {
                item.length = Math.max(0.4, parseFloat((item.length + 0.2 * dir).toFixed(1)));
            } else if (axis === 'y') {
                item.width = Math.max(0.4, parseFloat((item.width + 0.2 * dir).toFixed(1)));
            } else if (axis === 'z') {
                item.height = Math.max(0.4, parseFloat((item.height + 0.2 * dir).toFixed(1)));
            }
            
            if (type === 'room') {
                item.w = item.length * 60;
                item.h = item.width * 60;
                calculateRoomResonance();
            }
            
            calculateLedger();
            selectItem(item, type);
            return;
        }
        
        const meshHit = intersects.find(hit => hit.object.userData && hit.object.userData.ref);
        if (meshHit) {
            const hitItem = meshHit.object.userData.ref;
            const hitType = meshHit.object.userData.type;
            selectItem(hitItem, hitType);
        }
    }
}

function drawAdjustmentHandles(item, type) {
    const mx = item.x + (type === 'room' ? item.w/2 : 0) - 300;
    const mz = item.y + (type === 'room' ? item.h/2 : 0) - 250;
    
    const fLength = (type === 'room' ? item.w : (item.length || 1.2) * 35);
    const fWidth = (type === 'room' ? item.h : (item.width || 1.2) * 35);
    const fHeight = (type === 'room' ? item.height * 30 : (item.height || 1.0) * 35);
    
    const boxGeom = new THREE.BoxGeometry(fLength + 4, fHeight + 4, fWidth + 4);
    const boxMat = new THREE.MeshBasicMaterial({
        color: 0xc88a75,
        wireframe: true
    });
    const selectBox = new THREE.Mesh(boxGeom, boxMat);
    selectBox.position.set(mx, fHeight / 2, mz);
    scene.add(selectBox);
    threeMeshes.push(selectBox);
    
    function createHandle(axis, dir, color, px, py, pz) {
        const sphereGeom = new THREE.SphereGeometry(6, 8, 8);
        const sphereMat = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3
        });
        const sphere = new THREE.Mesh(sphereGeom, sphereMat);
        sphere.position.set(px, py, pz);
        sphere.userData = {
            isHandle: true,
            axis: axis,
            dir: dir,
            ref: item,
            type: type
        };
        scene.add(sphere);
        threeMeshes.push(sphere);
    }
    
    createHandle('x', 1, 0xff3333, mx + fLength/2 + 20, fHeight/2, mz);
    createHandle('x', -1, 0xaa2222, mx - fLength/2 - 20, fHeight/2, mz);
    
    createHandle('y', 1, 0x33ff33, mx, fHeight/2, mz + fWidth/2 + 20);
    createHandle('y', -1, 0x22aa22, mx, fHeight/2, mz - fWidth/2 - 20);
    
    createHandle('z', 1, 0x3333ff, mx, fHeight + 20, mz);
    createHandle('z', -1, 0x2222aa, mx, Math.max(10, fHeight - 20), mz);
}

window.updateSolarSimulation = function() {
    const season = document.getElementById('solar-season').value;
    const timeVal = parseFloat(document.getElementById('solar-time').value);
    
    const hours = Math.floor(timeVal);
    const mins = (timeVal % 1 === 0) ? "00" : "30";
    const ampm = hours >= 12 ? "PM" : "AM";
    const dispHours = hours > 12 ? hours - 12 : hours;
    document.getElementById('solar-time-label').innerText = `${dispHours}:${mins} ${ampm}`;
    
    const angle = ((timeVal - 6) / 12) * Math.PI;
    const sunX = 350 * Math.cos(angle);
    
    let sinZenith = 0.7;
    let sunZ = -180;
    if (season === 'summer') {
        sinZenith = 0.92;
        sunZ = -70;
    } else if (season === 'winter') {
        sinZenith = 0.42;
        sunZ = -280;
    }
    
    const sunY = 350 * Math.sin(angle) * sinZenith;
    
    if (dirLight && ambientLight) {
        dirLight.position.set(sunX, sunY, sunZ);
        
        const dayScale = Math.sin(angle);
        dirLight.intensity = 0.15 + 0.9 * dayScale;
        ambientLight.intensity = 0.1 + 0.35 * dayScale;
        
        const rColor = 1.0;
        const gColor = 0.75 + 0.25 * dayScale;
        const bColor = 0.5 + 0.5 * dayScale;
        dirLight.color.setRGB(rColor, gColor, bColor);
    }
    
    draw();
    if (show3D && scene) {
        syncThreeScene();
    }
};

window.toggleSolarAnimation = function() {
    isSolarPlaying = !isSolarPlaying;
    const btn = document.getElementById('btn-solar-play');
    if (isSolarPlaying) {
        btn.innerText = "⏸ PAUSE CYCLE";
        btn.classList.add('playing');
        solarPlayInterval = setInterval(() => {
            const slider = document.getElementById('solar-time');
            let nextVal = parseFloat(slider.value) + 0.25;
            if (nextVal > 18) nextVal = 6;
            slider.value = nextVal;
            updateSolarSimulation();
        }, 150);
    } else {
        btn.innerText = "▶ PLAY DAY CYCLE";
        btn.classList.remove('playing');
        if (solarPlayInterval) {
            clearInterval(solarPlayInterval);
            solarPlayInterval = null;
        }
    }
};

function syncThreeScene() {
    threeMeshes.forEach(mesh => scene.remove(mesh));
    threeMeshes = [];
    
    // Compass Billboard Labels
    function createCompassLabel(text, px, pz) {
        const canvasLabel = document.createElement('canvas');
        canvasLabel.width = 64;
        canvasLabel.height = 64;
        const ctxLabel = canvasLabel.getContext('2d');
        ctxLabel.font = "bold 28px 'Share Tech Mono', monospace";
        ctxLabel.fillStyle = "#8da392";
        ctxLabel.textAlign = "center";
        ctxLabel.fillText(text, 32, 40);
        
        const texture = new THREE.CanvasTexture(canvasLabel);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(px, 15, pz);
        sprite.scale.set(40, 40, 1);
        scene.add(sprite);
        threeMeshes.push(sprite);
    }
    
    createCompassLabel("N", 0, -280);
    createCompassLabel("S", 0, 280);
    createCompassLabel("E", 280, 0);
    createCompassLabel("W", -280, 0);
    
    // Draw rooms
    rooms.forEach(room => {
        const spec = MATERIALS[room.material] || MATERIALS.hemp;
        const roomW = room.w;
        const roomH = room.h;
        const roomZ = room.height * 30;
        
        const geom = new THREE.BoxGeometry(roomW, roomZ, roomH);
        const mat = new THREE.MeshPhongMaterial({
            color: new THREE.Color(spec.border),
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.userData = { ref: room, type: 'room' };
        
        const mx = room.x + roomW / 2 - 300;
        const mz = room.y + roomH / 2 - 250;
        mesh.position.set(mx, roomZ / 2, mz);
        
        scene.add(mesh);
        threeMeshes.push(mesh);
        
        const floorGeom = new THREE.BoxGeometry(roomW, 3, roomH);
        const floorMat = new THREE.MeshPhongMaterial({
            color: new THREE.Color(spec.border),
            opacity: 0.7,
            transparent: true
        });
        const floorMesh = new THREE.Mesh(floorGeom, floorMat);
        floorMesh.userData = { ref: room, type: 'room' };
        floorMesh.position.set(mx, 1.5, mz);
        scene.add(floorMesh);
        threeMeshes.push(floorMesh);
    });
    
    // Draw furniture & Volumetric Window lights
    furniture.forEach(item => {
        const mx = item.x - 300;
        const mz = item.y - 250;
        const group = new THREE.Group();
        group.userData = { ref: item, type: 'furniture' };
        
        const fLength = (item.length || 1.2) * 35;
        const fWidth = (item.width || 1.2) * 35;
        const fHeight = (item.height || 1.0) * 35;
        
        if (item.type === 'bed') {
            const mattressGeom = new THREE.BoxGeometry(fLength, fHeight * 0.7, fWidth);
            const mattressMat = new THREE.MeshPhongMaterial({ color: 0xdfd5c6 });
            const mattress = new THREE.Mesh(mattressGeom, mattressMat);
            mattress.userData = { ref: item, type: 'furniture' };
            mattress.position.y = (fHeight * 0.7) / 2;
            group.add(mattress);
            
            const pillowGeom = new THREE.BoxGeometry(fLength * 0.25, fHeight * 0.15, fWidth * 0.8);
            const pillowMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
            const pillow = new THREE.Mesh(pillowGeom, pillowMat);
            pillow.userData = { ref: item, type: 'furniture' };
            pillow.position.set(-fLength * 0.3, fHeight * 0.7 + (fHeight * 0.15)/2, 0);
            group.add(pillow);
        }
        else if (item.type === 'desk') {
            const desktopGeom = new THREE.BoxGeometry(fLength, 4, fWidth);
            const desktopMat = new THREE.MeshPhongMaterial({ color: 0x9c7454 });
            const desktop = new THREE.Mesh(desktopGeom, desktopMat);
            desktop.userData = { ref: item, type: 'furniture' };
            desktop.position.y = fHeight - 2;
            group.add(desktop);
            
            const legGeom = new THREE.BoxGeometry(3, fHeight - 4, 3);
            const legMat = new THREE.MeshPhongMaterial({ color: 0x3a2e2b });
            const legPositions = [
                [-fLength/2 + 3, -fWidth/2 + 3],
                [fLength/2 - 3, -fWidth/2 + 3],
                [-fLength/2 + 3, fWidth/2 - 3],
                [fLength/2 - 3, fWidth/2 - 3]
            ];
            legPositions.forEach(pos => {
                const leg = new THREE.Mesh(legGeom, legMat);
                leg.userData = { ref: item, type: 'furniture' };
                leg.position.set(pos[0], (fHeight - 4)/2, pos[1]);
                group.add(leg);
            });
        }
        else if (item.type === 'plant') {
            const potGeom = new THREE.CylinderGeometry(fLength*0.3, fLength*0.2, fHeight*0.4, 8);
            const potMat = new THREE.MeshPhongMaterial({ color: 0xc88a75 });
            const pot = new THREE.Mesh(potGeom, potMat);
            pot.userData = { ref: item, type: 'furniture' };
            pot.position.y = (fHeight * 0.4) / 2;
            group.add(pot);
            
            const plantGeom = new THREE.SphereGeometry(fLength*0.45, 8, 8);
            const plantMat = new THREE.MeshPhongMaterial({ color: 0x5d8f6d });
            const foliage = new THREE.Mesh(plantGeom, plantMat);
            foliage.userData = { ref: item, type: 'furniture' };
            foliage.position.y = fHeight*0.4 + fLength*0.3;
            group.add(foliage);
        }
        else if (item.type === 'fountain') {
            const basinGeom = new THREE.CylinderGeometry(fLength*0.4, fLength*0.4, fHeight*0.5, 12);
            const basinMat = new THREE.MeshPhongMaterial({ color: 0xa8a8aa });
            const basin = new THREE.Mesh(basinGeom, basinMat);
            basin.userData = { ref: item, type: 'furniture' };
            basin.position.y = (fHeight*0.5) / 2;
            group.add(basin);
            
            const waterGeom = new THREE.CylinderGeometry(fLength*0.25, fLength*0.25, fHeight*0.6, 12);
            const waterMat = new THREE.MeshPhongMaterial({ color: 0x4c8fa6, transparent: true, opacity: 0.8 });
            const water = new THREE.Mesh(waterGeom, waterMat);
            water.userData = { ref: item, type: 'furniture' };
            water.position.y = fHeight*0.5 + (fHeight*0.6)/2;
            group.add(water);
        }
        else if (item.type === 'crystal') {
            const shapeGeom = new THREE.ConeGeometry(fLength*0.35, fHeight, 4);
            const shapeMat = new THREE.MeshPhongMaterial({ color: 0x8a2be2, transparent: true, opacity: 0.75 });
            const crystalMesh1 = new THREE.Mesh(shapeGeom, shapeMat);
            crystalMesh1.userData = { ref: item, type: 'furniture' };
            crystalMesh1.position.y = fHeight / 2;
            group.add(crystalMesh1);
            
            const crystalMesh2 = new THREE.Mesh(shapeGeom, shapeMat);
            crystalMesh2.userData = { ref: item, type: 'furniture' };
            crystalMesh2.rotation.z = Math.PI;
            crystalMesh2.position.y = fHeight / 2;
            group.add(crystalMesh2);
        }
        else if (item.type === 'door') {
            const slabGeom = new THREE.BoxGeometry(8, fHeight, fWidth);
            const slabMat = new THREE.MeshPhongMaterial({ color: 0x7c533c });
            const door = new THREE.Mesh(slabGeom, slabMat);
            door.userData = { ref: item, type: 'furniture' };
            door.position.y = fHeight / 2;
            group.add(door);
        }
        else if (item.type === 'window') {
            const glassGeom = new THREE.BoxGeometry(4, fHeight, fWidth);
            const glassMat = new THREE.MeshPhongMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.6 });
            const glass = new THREE.Mesh(glassGeom, glassMat);
            glass.userData = { ref: item, type: 'furniture' };
            glass.position.y = fHeight / 2;
            group.add(glass);
            
            // Volumetric Sunlight projection path math derived from currentSunPos
            const sx = currentSunPos.x;
            const sy = currentSunPos.y;
            const sz = currentSunPos.z;
            
            if (sy > 5) {
                const len = Math.sqrt(sx*sx + sy*sy + sz*sz);
                const rx = -sx / len;
                const ry = -sy / len;
                const rz = -sz / len;
                
                const wy = fHeight / 2;
                const t = -wy / ry;
                
                const px = mx + rx * t;
                const pz = mz + rz * t;
                
                // Floor patch mesh
                const patchGeom = new THREE.PlaneGeometry(fWidth, fWidth * 1.5);
                const patchMat = new THREE.MeshBasicMaterial({
                    color: 0xffdf80,
                    transparent: true,
                    opacity: 0.3 * (sy / 350),
                    side: THREE.DoubleSide
                });
                const patch = new THREE.Mesh(patchGeom, patchMat);
                patch.rotation.x = -Math.PI / 2;
                patch.position.set(px, 0.6, pz);
                scene.add(patch);
                threeMeshes.push(patch);
                
                // Volumetric beam box mesh
                const beamDist = Math.sqrt((px - mx)**2 + (pz - mz)**2 + wy**2);
                const beamGeom = new THREE.BoxGeometry(4, fWidth, beamDist);
                const beamMat = new THREE.MeshBasicMaterial({
                    color: 0xffe680,
                    transparent: true,
                    opacity: 0.1 * (sy / 350),
                    side: THREE.DoubleSide
                });
                const beam = new THREE.Mesh(beamGeom, beamMat);
                beam.position.set((mx + px)/2, wy/2, (mz + pz)/2);
                beam.lookAt(px, 0.5, pz);
                scene.add(beam);
                threeMeshes.push(beam);
            }
        }
        
        group.position.set(mx, 0, mz);
        scene.add(group);
        threeMeshes.push(group);
    });
    
    if (selectedItem) {
        drawAdjustmentHandles(selectedItem, selectedType);
    }
}

function animateThree() {
    if (!show3D) return;
    animationFrameId = requestAnimationFrame(animateThree);
    renderer.render(scene, camera);
}

function stopThree() {
    show3D = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
}

window.updateSolarPreset = function() {
    const locVal = document.getElementById('solar-location').value;
    const customContainer = document.getElementById('custom-lat-container');
    const latInput = document.getElementById('solar-latitude');
    
    if (locVal === 'custom') {
        customContainer.style.display = 'block';
    } else {
        customContainer.style.display = 'none';
        latInput.value = parseFloat(locVal);
    }
    updateSolarSimulation();
};

