import { getDragonSync } from '../scripts/math.js';

const epochs = [
    {
        title: "Coral Reefs Origins",
        age: "680 Million Years Ago",
        img: "../assets/bridge/204 c coral 680 mill.jpeg",
        desc: "Primitive coral formations arise in Earth's ocean, seeding structural marine ecosystems during the deep Precambrian period.",
        coord: { top: "86%", left: "16%", pinId: 4 } // Fiordland
    },
    {
        title: "Invertebrates & Early Sponges",
        age: "680 - 500 Million Years Ago",
        img: "../assets/bridge/204 b coral sponge 680-500 mill.jpeg",
        desc: "Deep sponge networks and complex non-skeletal invertebrates thrive in the ancient oceans prior to the Cambrian explosion.",
        coord: { top: "86%", left: "16%", pinId: 4 }
    },
    {
        title: "Soft Marine Invertebrata",
        age: "680 - 500 Million Years Ago",
        img: "../assets/bridge/204 d invertibrate 680-500.jpeg",
        desc: "Multicellular soft-bodied organisms establish primitive ecological structures on the sandy seafloor.",
        coord: { top: "72%", left: "33%", pinId: 3 } // Christchurch
    },
    {
        title: "Jellyfish & Early Metazoa",
        age: "680 - 500 Million Years Ago",
        img: "../assets/bridge/204 e jelly fish 205 d catapillar 680-500 mill.jpeg",
        desc: "Jellyfish float in prehistoric seas, showcasing radial symmetry and sensory systems alongside early creeping metazoan species.",
        coord: { top: "72%", left: "33%", pinId: 3 }
    },
    {
        title: "Sea Anemones & Jawless Fish",
        age: "600 - 500 Million Years Ago",
        img: "../assets/bridge/206 a sea anomine 205 e jawless fish 600-500mill.jpeg",
        desc: "The rise of chordates and benthic jawless armor-plated fish. Early marine filters populate coastal shelves.",
        coord: { top: "52%", left: "51%", pinId: 2 } // Wellington
    },
    {
        title: "Molluscs & Early Echinoderms",
        age: "500 - 440 Million Years Ago",
        img: "../assets/bridge/206 b molluscs 206 e echinoderms early kina 500-440 mill.jpeg",
        desc: "Prehistoric echinoderms (early sea urchin 'kina') and hard-shelled molluscs diversify during the Ordovician period.",
        coord: { top: "52%", left: "51%", pinId: 2 }
    },
    {
        title: "Armored Vertebrate Fish",
        age: "500 - 440 Million Years Ago",
        img: "../assets/bridge/207 f hard shell vert fish 207 f early fish 500-440 mill.jpeg",
        desc: "Early jawed fish develop thick bony plates for defense, establishing vertebrate dominance in sea lanes.",
        coord: { top: "52%", left: "51%", pinId: 2 }
    },
    {
        title: "Terrestrial Plants & Cetacean Prototypes",
        age: "395 - 345 Million Years Ago",
        img: "../assets/bridge/208 a early plant 208 e early dolphin look fish 395-345mill.jpeg",
        desc: "Vascular land plants colonize shores, while aquatic vertebrates adapt to swimming profiles reminiscent of modern dolphins.",
        coord: { top: "25%", left: "66%", pinId: 1 } // Auckland
    },
    {
        title: "Prehistoric Ferns & Early Insects",
        age: "395 - 345 Million Years Ago",
        img: "../assets/bridge/208 b fren 208 d insect 395-345 mill.jpeg",
        desc: "Dense humid wetlands of ferns and primitive terrestrial insects shape the Carboniferous coal swamps.",
        coord: { top: "25%", left: "66%", pinId: 1 }
    },
    {
        title: "Primitive Cartilaginous Fish",
        age: "395 - 345 Million Years Ago",
        img: "../assets/bridge/209 g pre fish 209 h pre shark.jpeg",
        desc: "Ancient sharks and ray-finned fish establish predatory lineages that persist across geological time.",
        coord: { top: "25%", left: "66%", pinId: 1 }
    },
    {
        title: "Early Reptiles & Amphibious Transitions",
        age: "395 - 345 Million Years Ago",
        img: "../assets/bridge/209 g pre fish 209 j pre aligator reptile 395-345 mill.jpeg",
        desc: "Sarcopterygians crawl on land, giving rise to primitive alligator-like tetrapods and terrestrial reptiles.",
        coord: { top: "25%", left: "66%", pinId: 1 }
    },
    {
        title: "Early Archosaurs & Gliding Reptiles",
        age: "280 - 225 Million Years Ago",
        img: "../assets/bridge/213 f pre aligator 213 l flying lizard 280-225 mill.jpeg",
        desc: "During the Permian-Triassic transition, early flying lizards and land predators navigate diverse continental landscapes.",
        coord: { top: "15%", left: "80%", pinId: 0 } // Great Barrier Island
    },
    {
        title: "Sauropods & Proto-Turtles",
        age: "225 - 193 Million Years Ago",
        img: "../assets/bridge/215 g long neck dino 215 h pre turtle.jpeg",
        desc: "Massive long-necked sauropods populate lush valleys alongside ancestral armored turtles during the early Jurassic.",
        coord: { top: "15%", left: "80%", pinId: 0 }
    },
    {
        title: "Theropods & Marine Flipper Dinosaurs",
        age: "225 - 193 Million Years Ago",
        img: "../assets/bridge/215 n tauranosaurus 217 i flipper dino.jpeg",
        desc: "The rise of terrestrial apex predators like early theropods and aquatic plesiosaurs with large hydrofoil flippers.",
        coord: { top: "15%", left: "80%", pinId: 0 }
    },
    {
        title: "Avian Pioneers & Coastal Crustaceans",
        age: "Jurassic - Cretaceous Period",
        img: "../assets/bridge/217 o bird 218 c old crab.jpeg",
        desc: "Theropod feathers evolve for flight, and decapod crabs establish successful benthic niches along ancient shorelines.",
        coord: { top: "15%", left: "80%", pinId: 0 }
    },
    {
        title: "Cretaceous Marine Networks",
        age: "Cretaceous Period",
        img: "../assets/bridge/218 f creaceous fish 219 l pre bird.jpeg",
        desc: "Highly developed teleost fish fill shallow warm seas while ancient tooth-billed birds skim coastal horizons.",
        coord: { top: "25%", left: "66%", pinId: 1 }
    },
    {
        title: "Pinnipeds & Cetacean Evolution",
        age: "57 Million Years Ago - Present",
        img: "../assets/bridge/221 j sea lion 221 o whale.jpeg",
        desc: "Mammals return to the sea. The lineages of seals, sea lions, and baleen whales adapt to marine temperature gradients.",
        coord: { top: "52%", left: "51%", pinId: 2 }
    },
    {
        title: "Avian Isolation - The Kiwi",
        age: "57 Million Years Ago - Present",
        img: "../assets/bridge/57 million year kiwi.jpeg",
        desc: "Following New Zealand's continental detachment, flightless ratites like the kiwi fill ground ecological roles in dense temperate forests.",
        coord: { top: "72%", left: "33%", pinId: 3 }
    },
    {
        title: "Ancestral Anthropoids",
        age: "Oligocene - Miocene Epoch",
        img: "../assets/bridge/223 b monkey.jpeg",
        desc: "Early anthropoid primates develop binocular vision and grasping hands in tropical forest canopies.",
        coord: { top: "86%", left: "16%", pinId: 4 }
    }
];

let activeIndex = 0;
let isDragging = false;

const dom = {
    clockD9: document.getElementById('clockD9'),
    clockMilli: document.getElementById('clockMilli'),
    bridgeMeta: document.getElementById('bridgeMeta'),
    logger: document.getElementById('logger'),
    epochImage: document.getElementById('epochImage'),
    epochTitle: document.getElementById('epochTitle'),
    epochAge: document.getElementById('epochAge'),
    epochDesc: document.getElementById('epochDesc'),
    resonanceFill: document.getElementById('resonanceFill'),
    sliderTrack: document.getElementById('sliderTrack'),
    sliderFill: document.getElementById('sliderFill'),
    sliderHandle: document.getElementById('sliderHandle'),
    sliderTicks: document.getElementById('sliderTicks'),
    hotspotStatus: document.getElementById('hotspot-status'),
    mapPulse: document.getElementById('mapPulse')
};

function log(msg, type = 'SYSTEM') {
    const entry = document.createElement('div');
    entry.textContent = `[${type}] ${msg}`;
    dom.logger.prepend(entry);
}

function selectEpoch(index) {
    if (index < 0 || index >= epochs.length) return;
    activeIndex = index;
    const epoch = epochs[index];

    // Update info fields
    dom.epochTitle.textContent = epoch.title;
    dom.epochAge.textContent = epoch.age;
    dom.epochDesc.textContent = epoch.desc;
    
    // Smooth image transition trigger
    dom.epochImage.classList.add('loading');
    dom.epochImage.src = epoch.img;

    // Preload next and previous images dynamically for instant rendering on timeline moves
    const nextIdx = (index + 1) % epochs.length;
    const prevIdx = (index - 1 + epochs.length) % epochs.length;
    const imgNext = new Image();
    imgNext.src = epochs[nextIdx].img;
    const imgPrev = new Image();
    imgPrev.src = epochs[prevIdx].img;

    // Calculate simulated coefficient based on the time root & index
    const drift = (window.parent && window.parent.timeDriftOffset) ? window.parent.timeDriftOffset : 0;
    const now = new Date(Date.now() + drift - (new Date().getTimezoneOffset() * 60000));
    const d9 = getDragonSync(now);
    const coef = Math.floor(65 + ((d9.root + index) * 3.7) % 30);
    dom.resonanceFill.style.width = `${coef}%`;

    // Update Slider UI
    const pct = (index / (epochs.length - 1)) * 100;
    dom.sliderHandle.style.left = `${pct}%`;
    dom.sliderFill.style.width = `${pct}%`;

    // Highlight ticks
    const ticks = document.querySelectorAll('.slider-tick');
    ticks.forEach((tick, i) => {
        if (i === index) {
            tick.classList.add('active');
        } else {
            tick.classList.remove('active');
        }
    });

    // Highlight spatial pins
    document.querySelectorAll('.map-pin').forEach((pin, i) => {
        if (i === epoch.coord.pinId) {
            pin.classList.add('active');
        } else {
            pin.classList.remove('active');
        }
    });

    // Trigger pulse on the pin
    const pinEl = document.getElementById(`pin-${epoch.coord.pinId}`);
    if (pinEl) {
        dom.mapPulse.style.top = pinEl.style.top;
        dom.mapPulse.style.left = pinEl.style.left;
        dom.mapPulse.style.display = 'block';
    }

    dom.hotspotStatus.innerText = `LINKED: PIN-${epoch.coord.pinId} (${epoch.coord.top}, ${epoch.coord.left})`;
}

// Build ticks dynamically
function initSlider() {
    dom.sliderTicks.innerHTML = '';
    epochs.forEach((epoch, i) => {
        const tick = document.createElement('div');
        tick.className = 'slider-tick';
        const pct = (i / (epochs.length - 1)) * 100;
        tick.style.left = `${pct}%`;

        const label = document.createElement('div');
        label.className = 'tick-label';
        // Short labels to avoid clutter
        const ageYear = epoch.age.split(' ')[0];
        label.textContent = ageYear;
        
        tick.appendChild(label);
        dom.sliderTicks.appendChild(tick);
    });

    // Mouse slider drag logic
    const moveHandler = (e) => {
        if (!isDragging) return;
        const rect = dom.sliderTrack.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let pct = (clientX - rect.left) / rect.width;
        pct = Math.max(0, Math.min(1, pct));
        const index = Math.round(pct * (epochs.length - 1));
        if (index !== activeIndex) {
            selectEpoch(index);
            log(`Manual resonance adjust: Index ${index}`);
        }
    };

    const stopHandler = () => {
        isDragging = false;
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', stopHandler);
        document.removeEventListener('touchmove', moveHandler);
        document.removeEventListener('touchend', stopHandler);
    };

    dom.sliderHandle.addEventListener('mousedown', () => {
        isDragging = true;
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', stopHandler);
    });

    dom.sliderHandle.addEventListener('touchstart', () => {
        isDragging = true;
        document.addEventListener('touchmove', moveHandler);
        document.addEventListener('touchend', stopHandler);
    });

    // Track click
    dom.sliderTrack.addEventListener('click', (e) => {
        if (e.target === dom.sliderHandle) return;
        const rect = dom.sliderTrack.getBoundingClientRect();
        let pct = (e.clientX - rect.left) / rect.width;
        pct = Math.max(0, Math.min(1, pct));
        const index = Math.round(pct * (epochs.length - 1));
        selectEpoch(index);
        log(`Jump resonance sweep to index ${index}`);
    });
}

// Time ticking loop
function tick() {
    const drift = (window.parent && window.parent.timeDriftOffset) ? window.parent.timeDriftOffset : 0;
    const now = new Date(Date.now() + drift - (new Date().getTimezoneOffset() * 60000));
    const v = getDragonSync(now);
    const micro = Math.floor((performance.now() % 1000) * 1000).toString().padStart(6, '0');

    dom.clockD9.innerText = v.isRelax ? "RELAX" : 
        `${String(v.h).padStart(2,'0')}:${String(v.m).padStart(2,'0')}:${String(v.s).padStart(2,'0')}`;
    dom.clockMilli.innerText = `.${micro}`;
    dom.bridgeMeta.innerText = `SYNC STABLE - ROOT VALUE: ${v.root} | GRID SYNCED`;

    requestAnimationFrame(tick);
}

// Global functions
window.triggerResonanceSweep = function() {
    const sweepBtn = document.getElementById('sweepBtn');
    if (sweepBtn.disabled) return;
    sweepBtn.disabled = true;
    log("Initializing sweep: sweeping spatial-temporal matrix...");
    
    let currentIdx = 0;
    const interval = setInterval(() => {
        selectEpoch(currentIdx);
        currentIdx++;
        if (currentIdx >= epochs.length) {
            clearInterval(interval);
            setTimeout(() => {
                const targetIdx = Math.floor(Math.random() * epochs.length);
                selectEpoch(targetIdx);
                log(`Sweep complete. Localized resonance synchronized to ${epochs[targetIdx].title}!`, "SUCCESS");
                sweepBtn.disabled = false;
            }, 250);
        }
    }, 60);
};

window.selectMapHotspot = function(id) {
    const hotspots = [
        { name: "Great Barrier Island Gateway", index: 11 }, // Archosaurs
        { name: "Auckland Resonance Center", index: 7 },    // Dolphin look fish
        { name: "Wellington Gateway", index: 4 },           // Sea anemone
        { name: "Christchurch Offset Node", index: 17 },     // Kiwi
        { name: "Fiordland Deep Resonance", index: 0 }       // Coral Reefs
    ];
    const spot = hotspots[id];
    if (spot) {
        selectEpoch(spot.index);
        dom.hotspotStatus.innerText = `ACTIVE NODE: ${spot.name.toUpperCase()}`;
        log(`Linked spatial hotspot: ${spot.name}`);
    }
};

// Remove image loading class once fully downloaded
dom.epochImage.addEventListener('load', () => {
    dom.epochImage.classList.remove('loading');
});

// --- WORKSPACE & SOVEREIGN DIGITAL ID SYSTEM ---

window.switchWorkspace = function(workspace) {
    const resWorkspace = document.getElementById('resonance-workspace');
    const sovWorkspace = document.getElementById('sovereign-id-workspace');
    const tabResonance = document.getElementById('tab-resonance');
    const tabSovereignId = document.getElementById('tab-sovereign-id');
    
    if (workspace === 'resonance') {
        resWorkspace.style.display = 'grid';
        sovWorkspace.style.display = 'none';
        tabResonance.classList.add('active-tab');
        tabSovereignId.classList.remove('active-tab');
        
        tabResonance.style.background = 'rgba(255, 255, 255, 0.05)';
        tabResonance.style.borderColor = 'var(--accent)';
        tabResonance.style.color = 'var(--accent)';
        tabResonance.style.boxShadow = '0 0 10px var(--accent-glow)';
        
        tabSovereignId.style.background = 'rgba(255, 255, 255, 0.03)';
        tabSovereignId.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        tabSovereignId.style.color = 'var(--text)';
        tabSovereignId.style.boxShadow = 'none';
    } else {
        resWorkspace.style.display = 'none';
        sovWorkspace.style.display = 'flex';
        tabResonance.classList.remove('active-tab');
        tabSovereignId.classList.add('active-tab');
        
        tabSovereignId.style.background = 'rgba(255, 255, 255, 0.05)';
        tabSovereignId.style.borderColor = 'var(--accent)';
        tabSovereignId.style.color = 'var(--accent)';
        tabSovereignId.style.boxShadow = '0 0 10px var(--accent-glow)';
        
        tabResonance.style.background = 'rgba(255, 255, 255, 0.03)';
        tabResonance.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        tabResonance.style.color = 'var(--text)';
        tabResonance.style.boxShadow = 'none';
    }
    log(`Switched workspace context to: ${workspace.toUpperCase()}`);
};

let ws = null;
let reconnectTimeout = null;
let globalIdentities = {}; // In-memory database of registered DIDs
let currentKeyPair = null; // Stores private/public keys of generated ID

function connectWebSocket() {
    if (ws) return;
    const wsUrl = `ws://${window.location.hostname || 'localhost'}:9100`;
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        log("Connected to Dragon 9 Identity Ledger Backend (WS://localhost:9100)", "SUCCESS");
        const statusEl = document.getElementById('passport-meta-status');
        if (statusEl) {
            statusEl.innerText = "STATUS: SYNCHRONIZED";
            statusEl.style.color = "var(--highlight)";
        }
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
    };
    
    ws.onclose = () => {
        log("Identity Ledger Backend Offline. Running in standalone local database mode.", "WARNING");
        const statusEl = document.getElementById('passport-meta-status');
        if (statusEl) {
            statusEl.innerText = "STATUS: STANDALONE";
            statusEl.style.color = "var(--accent)";
        }
        ws = null;
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
    };
    
    ws.onerror = () => {
        // Suppress console error to avoid spamming
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleSocketMessage(data);
        } catch (e) {
            console.error("Error parsing message payload:", e);
        }
    };
}

function handleSocketMessage(data) {
    switch (data.action) {
        case "SYNC_STATE":
            if (data.registered_identities) {
                globalIdentities = data.registered_identities;
                rebuildLedgerTable();
            }
            break;
        case "IDENTITY_REGISTERED":
            if (data.did && data.identity) {
                globalIdentities[data.did] = data.identity;
                log(`New identity confirmed on shared ledger: '${data.identity.alias}' [${data.did.substring(0, 15)}...]`, "LEDGER");
                rebuildLedgerTable();
            }
            break;
    }
}

// Helper function for dummy SHA-256 hash generation
function sha256Mock(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const val1 = Math.abs(hash).toString(16).padStart(8, '0');
    const val2 = Math.abs(hash * 3).toString(16).padStart(8, '0');
    const val3 = Math.abs(hash * 7).toString(16).padStart(8, '0');
    return val1 + val2 + val3;
}

window.generateSovereignID = function() {
    const aliasInput = document.getElementById('id-alias');
    const alias = aliasInput ? aliasInput.value.trim() : "GUEST OPERATOR";
    const node = document.getElementById('id-node').value;
    const resonance = document.getElementById('id-frequency').value;
    
    const randomSeed = Math.random().toString(36).substring(2);
    const privateKey = "prv_" + sha256Mock(randomSeed + "_priv");
    const publicKey = "pub_" + sha256Mock(privateKey + "_pub");
    const did = `did:d9:sha256:${sha256Mock(publicKey).substring(0, 32)}`;
    
    currentKeyPair = {
        privateKey: privateKey,
        publicKey: publicKey,
        did: did,
        alias: alias || "GUEST OPERATOR",
        node: node,
        resonance: resonance
    };
    localStorage.setItem('dragon-sovereign-id', JSON.stringify(currentKeyPair));
    
    // Update Passport Preview Card
    document.getElementById('passport-name').innerText = (alias || "GUEST OPERATOR").toUpperCase();
    document.getElementById('passport-did').innerText = did;
    document.getElementById('passport-meta-res').innerText = resonance;
    document.getElementById('passport-meta-node').innerText = node.split(' ')[0].toUpperCase();
    
    // Regenerate avatar colors
    const avatarColor = `#${sha256Mock(did).substring(0, 6)}`;
    const avatarSvg = document.getElementById('passport-avatar-svg');
    if (avatarSvg) {
        avatarSvg.innerHTML = `
            <circle cx="30" cy="20" r="12" fill="${avatarColor}"/>
            <path d="M10,50 Q30,30 50,50" fill="none" stroke="${avatarColor}" stroke-width="3"/>
        `;
    }
    
    // Highlight passport card border
    const card = document.getElementById('passport-card');
    if (card) {
        card.style.borderColor = "var(--highlight)";
        card.style.boxShadow = "0 15px 35px rgba(0, 229, 255, 0.15)";
    }
    
    // Enable claims signer panel and register button
    const claimsPanel = document.getElementById('claims-signer-panel');
    if (claimsPanel) {
        claimsPanel.style.opacity = "1";
        claimsPanel.style.pointerEvents = "auto";
    }
    const registerBtn = document.getElementById('register-id-btn');
    if (registerBtn) {
        registerBtn.style.display = "block";
    }
    
    log(`Generated sovereign keys and DID address: ${did.substring(0,25)}...`, "CRYPT");
};

window.registerSovereignIDOnLedger = function() {
    if (!currentKeyPair) return;
    
    const payload = {
        action: "REGISTER_IDENTITY",
        did: currentKeyPair.did,
        alias: currentKeyPair.alias,
        node: currentKeyPair.node,
        resonance: currentKeyPair.resonance,
        pubkey: currentKeyPair.publicKey
    };
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
        log("Transmitted DID payload to the distributed consensus network...", "SYSTEM");
    } else {
        // Local fallback
        globalIdentities[currentKeyPair.did] = {
            alias: currentKeyPair.alias,
            node: currentKeyPair.node,
            resonance: currentKeyPair.resonance,
            pubkey: currentKeyPair.publicKey
        };
        log(`Registered DID locally: '${currentKeyPair.alias}'`, "LOCAL");
        rebuildLedgerTable();
    }
    
    const registerBtn = document.getElementById('register-id-btn');
    if (registerBtn) {
        registerBtn.style.display = "none";
    }
};

window.signClaimPayload = function() {
    if (!currentKeyPair) return;
    const claimInput = document.getElementById('claim-text');
    const claimText = claimInput ? claimInput.value.trim() : "";
    if (!claimText) {
        log("ABORT: Cannot sign empty claim payload.", "ERROR");
        return;
    }
    
    const timestamp = new Date().toISOString();
    const signInput = `${currentKeyPair.did}:${claimText}:${timestamp}:${currentKeyPair.privateKey}`;
    const signature = sha256Mock(signInput);
    
    const signatureBlock = document.getElementById('signature-block');
    if (signatureBlock) {
        signatureBlock.innerHTML = `
            <strong>VERIFIABLE CLAIM BLOCK</strong><br/>
            DID: ${currentKeyPair.did}<br/>
            CLAIM: "${claimText}"<br/>
            TIMESTAMP: ${timestamp}<br/>
            SIGNATURE (HEX): ${signature.substring(0, 48)}...<br/>
            STATUS: <span style="color: var(--highlight);">CRYPTOGRAPHICALLY SIGNED</span>
        `;
        signatureBlock.style.display = "block";
    }
    log(`Verifiable claim signed using private key seed: ${signature.substring(0, 16)}...`, "CRYPT");
};

function rebuildLedgerTable() {
    const body = document.getElementById('ledger-directory-body');
    if (!body) return;
    body.innerHTML = '';
    
    const dids = Object.keys(globalIdentities);
    if (dids.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 20px; text-align: center; opacity: 0.5;">NO REGISTERED IDENTITIES ON LEDGER</td>
            </tr>
        `;
        return;
    }
    
    dids.forEach(did => {
        const id = globalIdentities[did];
        const row = document.createElement('tr');
        row.style.borderBottom = "1px solid rgba(255, 255, 255, 0.05)";
        row.innerHTML = `
            <td style="padding: 10px; font-weight: 700;">${id.alias.toUpperCase()}</td>
            <td style="padding: 10px; color: var(--highlight); font-size: 0.65rem;">${did}</td>
            <td style="padding: 10px;">${id.node.toUpperCase()}</td>
            <td style="padding: 10px;">${id.resonance}</td>
            <td style="padding: 10px; text-align: right; color: var(--accent);">VERIFIED</td>
        `;
        body.appendChild(row);
    });
}

function initHoloCardEffect() {
    const card = document.getElementById('passport-card');
    const holo = document.getElementById('holo-foil');
    if (!card || !holo) return;
    
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const pctX = (x / rect.width) * 100;
        const pctY = (y / rect.height) * 100;
        
        holo.style.background = `linear-gradient(${pctX + pctY}deg, rgba(255,255,255,0) 0%, rgba(0, 229, 255, 0.08) ${pctX}%, rgba(255, 0, 128, 0.05) ${pctY}%, rgba(255,255,255,0) 100%)`;
        
        const rotateY = ((x / rect.width) - 0.5) * 8;
        const rotateX = (0.5 - (y / rect.height)) * 8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    card.addEventListener('mouseleave', () => {
        holo.style.background = 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%)';
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    });
}

// Start
initSlider();
selectEpoch(0);
tick();
connectWebSocket();
initHoloCardEffect();
log("Systems active. Resonance parameters locked.");
