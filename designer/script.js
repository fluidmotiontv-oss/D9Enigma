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
            draggingNode = f;
            dragOffsetX = dx;
            dragOffsetY = dy;
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

        furniture.push({
            type: activeTool,
            x: clickX,
            y: clickY,
            emoji: placedEmoji,
            label: placedLabel
        });
        
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
            
            // Calculate meters based on pixel size ratio (60 pixels = 1 meter)
            const length = w / 60;
            const width = h / 60;
            
            rooms.push({
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
            });
            
            // Sync side values to newest room dimensions
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
        
        // Wall area calculations approx (perimeter * height)
        const wallPerimeter = 2 * (room.length + room.width);
        const wallVolume = wallPerimeter * 0.3 * room.height; // assuming 30cm thick walls
        
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

    // Locate doors, windows, beds and desks
    const doors = furniture.filter(f => f.type === 'door');
    const windows = furniture.filter(f => f.type === 'window');
    const beds = furniture.filter(f => f.type === 'bed');
    const desks = furniture.filter(f => f.type === 'desk');
    const fountains = furniture.filter(f => f.type === 'fountain');
    const plants = furniture.filter(f => f.type === 'plant');
    const crystals = furniture.filter(f => f.type === 'crystal');

    // 1. Bed Directly opposite door checks ("Coffin Position")
    beds.forEach(bed => {
        doors.forEach(door => {
            const dx = Math.abs(bed.x - door.x);
            const dy = Math.abs(bed.y - door.y);
            // Check direct linear projection block within 40 pixels width
            if (dx < 40 && bed.y > door.y) {
                alerts.push("⚠️ Coffin Alignment Warning: Bed directly opposite a Door node. Move bed out of straight path of entry to prevent draining vital Chi.");
            }
        });
    });

    // 2. Desk Command Position Check (Back facing Door)
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

    // 3. Elements and Bagua checks
    // Wealth Sector is Top-Left (x < 200, y < 170)
    fountains.forEach(fountain => {
        if (fountain.x < 200 && fountain.y < 170) {
            successes.push("✓ Prosperity Flow: Water Fountain placed in Wealth & Abundance sector (Southeast).");
        }
    });

    plants.forEach(plant => {
        // East Sector (Family & Health) is Mid-Left (x < 200, y >= 170 && y <= 330)
        if (plant.x < 200 && plant.y >= 170 && plant.y <= 330) {
            successes.push("✓ Vitality: Wood Element plant placed in Family & Health sector (East) to boost grounding.");
        }
    });

    // Mirror or direct alignment window-to-door (piercing Chi flow)
    doors.forEach(door => {
        windows.forEach(win => {
            const dx = Math.abs(door.x - win.x);
            if (dx < 20) {
                alerts.push("⚠️ Piercing Chi Leak: Window directly aligns with Door. Energy enters and exits instantly without pooling inside. Use screens or plants to disperse flow.");
            }
        });
    });

    // Build diagnostic readout HTML
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

    // 1. Draw grid background lines
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

    // 2. Draw Bagua Sectors Overlay
    if (showBagua) {
        const segW = canvas.width / 3;
        const segH = canvas.height / 3;
        
        ctx.strokeStyle = "rgba(223, 213, 198, 0.12)";
        ctx.lineWidth = 2.0;
        ctx.setLineDash([6, 6]);

        // Draw 3x3 sectors
        for (let i = 1; i <= 2; i++) {
            // vertical grid line
            ctx.beginPath();
            ctx.moveTo(segW * i, 0);
            ctx.lineTo(segW * i, canvas.height);
            ctx.stroke();
            
            // horizontal line
            ctx.beginPath();
            ctx.moveTo(0, segH * i);
            ctx.lineTo(canvas.width, segH * i);
            ctx.stroke();
        }
        ctx.setLineDash([]); // Reset line dash style

        // Draw text labels for 9 sectors
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

    // 3. Draw Rooms
    rooms.forEach(room => {
        const spec = MATERIALS[room.material] || MATERIALS.hemp;
        ctx.fillStyle = spec.color;
        ctx.fillRect(room.x, room.y, room.w, room.h);
        
        ctx.strokeStyle = spec.border;
        ctx.lineWidth = 3;
        ctx.strokeRect(room.x, room.y, room.w, room.h);

        // Room labels
        ctx.fillStyle = "var(--text-main)";
        ctx.font = "11px 'Comfortaa', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(room.label, room.x + 12, room.y + 24);

        // Dimension indicators
        ctx.fillStyle = "var(--text-muted)";
        ctx.font = "9px 'Share Tech Mono', monospace";
        ctx.fillText(`${room.length}m x ${room.width}m`, room.x + 12, room.y + 40);
    });

    // 4. Draw preview of drawn room during drawing gesture
    if (isDrawingRoom) {
        ctx.fillStyle = "rgba(141, 163, 146, 0.25)";
        ctx.fillRect(drawStartX, drawStartY, currentMouseX - drawStartX, currentMouseY - drawStartY);
        ctx.strokeStyle = "var(--accent-sage)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(drawStartX, drawStartY, currentMouseX - drawStartX, currentMouseY - drawStartY);
        ctx.setLineDash([]);
    }

    // 5. Draw Furniture/Nodes
    furniture.forEach(item => {
        // Draw selection circle glow for clarity
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.beginPath();
        ctx.arc(item.x, item.y, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(item.x, item.y, 16, 0, Math.PI * 2);
        ctx.stroke();

        // Draw node emoji
        ctx.font = "20px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.emoji, item.x, item.y);

        // Draw small label text below emoji
        ctx.font = "8px 'Share Tech Mono', monospace";
        ctx.fillStyle = "var(--text-muted)";
        ctx.fillText(item.type.toUpperCase(), item.x, item.y + 25);
    });
}
