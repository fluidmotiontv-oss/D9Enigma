import { getLunarDay } from '../scripts/math.js';

// Lunar Cycle Permaculture Guidance Data
const LUNAR_PHASES_DATA = [
    {
        phase: "Waxing Crescent (Days 1-7)",
        emoji: "🌒",
        desc: "Waxing light pulls fluids upwards. Optimal for leafy greens and seed initiation.",
        details: "During this phase, lunar gravitational pull is starting to increase, and sap flows actively upwards. Focus on sowing above-ground crops, especially leafy greens (cabbage, spinach, lettuce). Tune seedbeds with Kawakawa 528Hz frequency to stimulate cell division and fast shoot development."
    },
    {
        phase: "Waxing Gibbous & Full Moon (Days 8-14)",
        emoji: "🌕",
        desc: "Peak light and moisture alignment. Plant fruiting crops and transplant shoots.",
        details: "Gravis and luminous vectors reach maximum alignment. High moisture levels in soil stimulate rapid seed germination and root adoption. Focus on sowing climbing beans, kamokamo, and transplanting seedlings. Use the Harakeke 639Hz frequency tuner to align cellular connections between roots and soil mycelium grids."
    },
    {
        phase: "Waning Gibbous & Third Quarter (Days 15-21)",
        emoji: "🌗",
        desc: "Gravity pulls sap down. Ideal for root crops, compost, and soil conditioning.",
        details: "Luminous output is decreasing, and gravity pulls moisture and nutrients back down into the soil layers. Focus on planting root crops (Kūmara, carrots, potatoes) and pruning trees. This is the optimal time to tune compost beds and pure humus layers with the 432Hz root expansion and mycorrhizal frequencies."
    },
    {
        phase: "Waning Crescent & Dark Moon (Days 22-28)",
        emoji: "🌑",
        desc: "System rest phase. Weeding, soil prep, and turning biochar mulch.",
        details: "Soil rest and cleaning coordinates are active. Focus on weeding, tilling, turning compost piles, and inoculating biochar grids with fish emulsion and nettle tea. Keep tuner systems on standby or play 852Hz Humus frequency sweeps to cleanse the soil mycelium pathways of negative residue."
    }
];

// Exchange Shop Seed Items
const SHOP_SEEDS = [
    {
        title: "Māori Kamokamo Seeds",
        desc: "Heritage organic New Zealand kamokamo squash seeds. Excellent companion crop for corn.",
        price: "15 Notes",
        img: "../assets/goodtutru.png"
    },
    {
        title: "Heirloom Kūmara Tuber",
        desc: "Traditional red kūmara tuber shoots ready for root bedding and Solfeggio 432Hz tuning.",
        price: "30 Notes",
        img: "../assets/timmeanoctagon5467.png"
    },
    {
        title: "Organic Kawakawa Leaves",
        desc: "Dried organic kawakawa leaves harvested under full moon alignments. Ideal for sustenance teas.",
        price: "20 Notes",
        img: "../assets/timmeanoctagon6766.png"
    },
    {
        title: "Humus Mycelium Inoculant",
        desc: "Pure organic forest humus pre-infused with active mycorrhizal fungal spores to boost carbon pathways.",
        price: "50 Notes",
        img: "../assets/elefantiMaggentic.png"
    }
];

// Gallery Showcase items
const GALLERY_ITEMS = [
    {
        title: "Kūmara Root Sprouting - Day 12",
        date: "2026-06-18 // Root Tuned 432Hz",
        img: "../assets/fmsmooth4.png"
    },
    {
        title: "Active Mycelium Grid Inoculation",
        date: "2026-06-19 // Humus Tuned 852Hz",
        img: "../assets/newinfiniti466.png"
    },
    {
        title: "Three Sisters Companion Shoot",
        date: "2026-06-21 // Solar Alignment Phase",
        img: "../assets/timmeanoctagon75t5t.png"
    }
];

// Botanical Rongoā Pharmacopoeia Data
const APOTHECARY_PLANTS = [
    {
        name: "Kawakawa",
        botanical: "Piper excelsum",
        properties: "Anti-inflammatory, antimicrobial, circulatory stimulant. Contains myristicin and diayangambin which support healing and tissue repair.",
        preparations: "Infusion (Tea): Brew fresh leaves to support digestion and general health. Salve (Balm): Infuse dried leaves in base oil with beeswax for eczema, insect bites, and dry skin. Decoction: Boil leaves and stems for baths to soothe skin irritations and toothache.",
        cautions: "Generally very safe. Avoid excessive ingestion during pregnancy. Traditionally, leaves with caterpillar holes are selected, as the plant increases its active bio-compounds when responding to insect bites."
    },
    {
        name: "Harakeke",
        botanical: "Phormium tenax",
        properties: "Antiseptic, cooling, highly mucilaginous (sap), skin-softening, and mildly purgative.",
        preparations: "Gel (Rēpia): Scraped from the base of the leaf, applied directly to burns, sunburns, boils, and acne. Root Decoction: Boiled roots used as an external skin wash. Leaf Poultice: Scraped leaf fibers applied as warm dressings to ease joint sprains and inflammation.",
        cautions: "Internal preparations of the root are highly purgative and should be avoided or used under expert guidance. Sap is primarily for topical use."
    },
    {
        name: "Kōwhai",
        botanical: "Sophora microphylla",
        properties: "Antiparasitic, antiseptic, traditional skin toner, and wound healer.",
        preparations: "Decoction: Boil inner bark for skin problems, scabies, and shingles. Poultice: Crushed bark applied topically to wounds and bruises. Leaf Wash: Mild infusion for scalp and dandruff care.",
        cautions: "HIGHLY TOXIC IF INGESTED: Kowhai seeds and foliage contain the toxic alkaloid cytisine. Use exclusively for external topical applications. Keep out of reach of children."
    },
    {
        name: "Mānuka",
        botanical: "Leptospermum scoparium",
        properties: "Highly antibacterial, antifungal, antiviral, and anti-inflammatory. Rich in leptospermone.",
        preparations: "Raw Honey: Applied topically to cuts, burns, and wounds to support sterile healing. Essential Oil: Diluted in a carrier oil for fungal infections. Decoction: Boil leaves for steam inhalation to soothe respiratory pathways or as a mouthwash for sore gums.",
        cautions: "Always dilute the pure essential oil before skin contact. For open wounds, ensure honey is raw and medical-grade (high UMF/MGO rating)."
    },
    {
        name: "Comfrey",
        botanical: "Symphytum officinale",
        properties: "Cell proliferant (allantoin), anti-inflammatory, and astringent. Accelerates bone, joint, and skin healing.",
        preparations: "Poultice: Warm mashed roots or leaves applied to closed sprains, fractures, and bruises (known as 'knitbone'). Salve: Olive oil infusion mixed with beeswax to soothe joint stiffness. Liquid Fertilizer: Fermented leaves brew high-potassium garden tea.",
        cautions: "Contains pyrrolizidine alkaloids. Strictly for external application on intact skin. Do not apply to open wounds, and do not ingest."
    },
    {
        name: "Nettle",
        botanical: "Urtica dioica",
        properties: "Rich in iron, silica, and vitamins A, C, K. Natural antihistamine, diuretic, and blood purifier.",
        preparations: "Infusion (Tea): Steeping dried nettle leaves to support allergy relief, joint health, and iron levels. Decoction: Boiled root used as a nutrient-rich hair and scalp rinse. Culinary: Young spring shoots cooked (steamed or boiled) as mineral-rich greens.",
        cautions: "Always wear thick gloves when harvesting. Cooking, drying, or blending completely neutralizes the stinging hairs."
    }
];

// State variables
let audioCtx = null;
let oscillatorNode = null;
let gainNode = null;
let analyserNode = null;
let lfoNode = null;
let lfoGainNode = null;
let tunerActive = false;
let canvas, canvasCtx;
let flowCanvas, flowCtx;
let flowAnimFrameId = null;

// Breathing state variables
let breathingActive = false;
let breathOscillatorNode = null;
let breathLfoNode = null;
let breathLfoGainNode = null;
let breathGainNode = null;
let breathingInterval = null;
let breathingPhaseIndex = 0; // 0: Inhale, 1: Hold, 2: Exhale, 3: Hold

// DOM Elements
const dom = {
    lunarTracker: document.getElementById('lunar-tracker'),
    lunarEmoji: document.getElementById('header-lunar-emoji'),
    lunarText: document.getElementById('header-lunar-text'),
    tunerAudioBtn: document.getElementById('tuner-audio-btn'),
    tunerRange: document.getElementById('tuner-range'),
    freqVal: document.getElementById('freq-val'),
    statTarget: document.getElementById('stat-target'),
    statEffect: document.getElementById('stat-effect'),
    statAudioStatus: document.getElementById('stat-audio-status'),
    lunarSidebar: document.getElementById('lunar-sidebar'),
    guideTitle: document.getElementById('guide-active-title'),
    guideText: document.getElementById('guide-active-text'),
    journalForm: document.getElementById('journal-form'),
    journalList: document.getElementById('journal-list'),
    beeSpeech: document.getElementById('bee-speech'),
    btnBeeSeasonal: document.getElementById('btn-bee-seasonal'),
    btnBeeLunar: document.getElementById('btn-bee-lunar'),
    btnBeeSoil: document.getElementById('btn-bee-soil'),
    shopMatrix: document.getElementById('shop-matrix-box'),
    galleryGrid: document.getElementById('gallery-grid-box'),
    remedyPlantList: document.getElementById('remedy-plant-list'),
    remedyDetailsBox: document.getElementById('remedy-details-box'),
    breathingCircle: document.getElementById('breathing-circle-node'),
    breathingPhaseLabel: document.getElementById('breathing-phase-label'),
    btnToggleBreathing: document.getElementById('btn-toggle-breathing')
};

// 1. LUNAR STATE CALCULATION & ALIGNMENT
function initLunarTracker() {
    const localDate = new Date();
    const lDay = getLunarDay(localDate);
    
    // Select matching emoji and label
    let phaseText = "NEW MOON";
    let emoji = "🌑";
    let index = 3; // default to rest phase (Dark moon)
    
    if (lDay >= 1 && lDay < 7) {
        phaseText = "WAXING CRESCENT";
        emoji = "🌒";
        index = 0;
    } else if (lDay >= 7 && lDay < 15) {
        phaseText = "FULL MOON PHASE";
        emoji = "🌕";
        index = 1;
    } else if (lDay >= 15 && lDay < 22) {
        phaseText = "WANING GIBBOUS";
        emoji = "🌗";
        index = 2;
    } else if (lDay >= 22) {
        phaseText = "DARK MOON / REST";
        emoji = "🌑";
        index = 3;
    }

    dom.lunarEmoji.innerText = emoji;
    dom.lunarText.innerText = `DAY ${String(lDay).padStart(2, '0')} // ${phaseText}`;
    
    // Highlight matching lunar sidebar guide
    renderGuideSidebar(index);
}

// 2. TABS SWITCHER
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const targetPanel = document.getElementById(`panel-${btn.dataset.tab}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            
            // Trigger animation start or resize canvas if needed
            if (btn.dataset.tab === 'flow') {
                initFlowAnimation();
            } else {
                if (flowAnimFrameId) cancelAnimationFrame(flowAnimFrameId);
            }
        });
    });
}

// 3. AUDIO FREQUENCY TUNER SYSTEM
function initAudioTuner() {
    // Seed selectors
    document.querySelectorAll('.seed-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.seed-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            
            const freq = parseFloat(opt.dataset.freq);
            dom.tunerRange.value = freq;
            dom.freqVal.innerText = `${freq.toFixed(1)} Hz`;
            
            dom.statTarget.innerText = opt.dataset.name;
            dom.statEffect.innerText = opt.dataset.effect;
            
            if (tunerActive && oscillatorNode) {
                oscillatorNode.frequency.setValueAtTime(freq, audioCtx.currentTime);
            }
        });
    });

    // Slider listener
    dom.tunerRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        dom.freqVal.innerText = `${val.toFixed(1)} Hz`;
        
        // Remove selection from grid since frequency has shifted
        document.querySelectorAll('.seed-option').forEach(o => {
            if (parseFloat(o.dataset.freq) !== val) {
                o.classList.remove('selected');
            } else {
                o.classList.add('selected');
            }
        });

        dom.statTarget.innerText = "Custom Coordinate Frequency";
        dom.statEffect.innerText = "Custom Frequency Sweep Resonance";

        if (tunerActive && oscillatorNode) {
            oscillatorNode.frequency.setValueAtTime(val, audioCtx.currentTime);
        }
    });

    // Toggle Audio button
    dom.tunerAudioBtn.addEventListener('click', toggleTunerAudio);

    canvas = document.getElementById('oscilloscope');
    canvasCtx = canvas.getContext('2d');
    resizeTunerCanvas();
    window.addEventListener('resize', resizeTunerCanvas);
}

function resizeTunerCanvas() {
    if (canvas) {
        canvas.width = canvas.parentElement.clientWidth - 32;
        canvas.height = 200;
    }
}

function toggleTunerAudio() {
    if (tunerActive) {
        stopTunerAudio();
    } else {
        startTunerAudio();
    }
}

function startTunerAudio() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const frequency = parseFloat(dom.tunerRange.value);

        // Main oscillator
        oscillatorNode = audioCtx.createOscillator();
        oscillatorNode.type = 'sine';
        oscillatorNode.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        // LFO detune (creates a natural organic vibration sweep)
        lfoNode = audioCtx.createOscillator();
        lfoNode.type = 'sine';
        lfoNode.frequency.setValueAtTime(0.2, audioCtx.currentTime); // 0.2Hz slow sweep
        
        lfoGainNode = audioCtx.createGain();
        lfoGainNode.gain.setValueAtTime(1.8, audioCtx.currentTime); // 1.8Hz detune sweep

        lfoNode.connect(lfoGainNode);
        lfoGainNode.connect(oscillatorNode.frequency);

        // Analyser node for drawing oscilloscope
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 1024;

        // Gain node to protect ears
        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);

        // Connections
        oscillatorNode.connect(analyserNode);
        analyserNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Start
        lfoNode.start();
        oscillatorNode.start();

        tunerActive = true;
        dom.tunerAudioBtn.innerText = "🛑 STOP FREQUENCY TUNER";
        dom.tunerAudioBtn.classList.add('active');
        dom.statAudioStatus.innerText = "ACTIVE RESONANCE";
        dom.statAudioStatus.style.color = "var(--accent)";

        drawOscilloscope();
    } catch (e) {
        console.error("Audio Context initialization failed:", e);
        alert("Web Audio sweep failed to start. Ensure permissions are allowed.");
    }
}

function stopTunerAudio() {
    if (oscillatorNode) {
        try {
            oscillatorNode.stop();
            oscillatorNode.disconnect();
            lfoNode.stop();
            lfoNode.disconnect();
            gainNode.disconnect();
        } catch (e) {}
        oscillatorNode = null;
        lfoNode = null;
    }
    tunerActive = false;
    dom.tunerAudioBtn.innerText = "🔊 INITIATE FREQUENCY TUNER";
    dom.tunerAudioBtn.classList.remove('active');
    dom.statAudioStatus.innerText = "STANDBY";
    dom.statAudioStatus.style.color = "var(--alert)";
}

function drawOscilloscope() {
    if (!tunerActive || !analyserNode) {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw standard flatline
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = varColor('--accent') || '#4caf50';
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, canvas.height / 2);
        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
        return;
    }

    requestAnimationFrame(drawOscilloscope);

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserNode.getByteTimeDomainData(dataArray);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2.5;
    canvasCtx.strokeStyle = varColor('--accent') || '#4caf50';
    canvasCtx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}

function varColor(varName) {
    return getComputedStyle(document.body).getPropertyValue(varName).trim();
}

// 4. LUNAR GUIDE SYSTEM
function renderGuideSidebar(activeIdx) {
    if (!dom.lunarSidebar) return;
    dom.lunarSidebar.innerHTML = "";

    LUNAR_PHASES_DATA.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = `lunar-phase-card${index === activeIdx ? ' active-phase' : ''}`;
        card.innerHTML = `
            <div class="phase-card-header">
                <span>${item.phase}</span>
                <span class="lunar-emoji">${item.emoji}</span>
            </div>
            <div class="phase-card-desc">${item.desc}</div>
        `;
        
        card.onclick = () => {
            document.querySelectorAll('.lunar-phase-card').forEach(c => c.classList.remove('active-phase'));
            card.classList.add('active-phase');
            showGuideDetails(item);
        };

        dom.lunarSidebar.appendChild(card);
    });

    // Load initial detailed guide
    showGuideDetails(LUNAR_PHASES_DATA[activeIdx]);
}

function showGuideDetails(item) {
    dom.guideTitle.innerHTML = `<span>${item.phase} Guide</span> <span class="lunar-emoji">${item.emoji}</span>`;
    dom.guideText.innerHTML = `<p>${item.details}</p>`;
}

// 5. SOIL & DEVELOPMENT JOURNAL
let journalData = [];

function initJournal() {
    const saved = localStorage.getItem('garden-journal');
    if (saved) {
        journalData = JSON.parse(saved);
    } else {
        // Seed initial log
        journalData = [
            {
                id: 'G-109283',
                plant: 'Organic Kūmara Seedbed',
                action: 'Tuned 432Hz Root Sweep',
                notes: 'Inoculated humus layer with biochar compost tea. Sub-root sprouts starting to emerge. Mycelium mesh visible in grid sector 3.',
                date: new Date(Date.now() - 3600000 * 48).toLocaleString(),
                phase: '🌕 FULL MOON'
            }
        ];
        localStorage.setItem('garden-journal', JSON.stringify(journalData));
    }

    renderJournalList();

    // Bind form submit
    dom.journalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const plantVal = document.getElementById('j-plant').value.trim();
        const actionVal = document.getElementById('j-action').value.trim();
        const notesVal = document.getElementById('j-notes').value.trim();
        
        const localDate = new Date();
        const lDay = getLunarDay(localDate);
        let phaseLabel = "🌑 DARK MOON";
        if (lDay >= 1 && lDay < 7) phaseLabel = "🌒 WAXING CRES.";
        else if (lDay >= 7 && lDay < 15) phaseLabel = "🌕 FULL MOON";
        else if (lDay >= 15 && lDay < 22) phaseLabel = "🌗 WANING GIBB.";

        const entry = {
            id: `G-${Math.floor(Math.random() * 900000 + 100000)}`,
            plant: plantVal,
            action: actionVal,
            notes: notesVal,
            date: localDate.toLocaleString(),
            phase: phaseLabel
        };

        journalData.unshift(entry);
        localStorage.setItem('garden-journal', JSON.stringify(journalData));
        
        renderJournalList();
        
        // Reset form
        dom.journalForm.reset();
        
        // Play click tick pop
        playBubblePopSound();
    });
}

function renderJournalList() {
    if (!dom.journalList) return;
    dom.journalList.innerHTML = "";

    if (journalData.length === 0) {
        dom.journalList.innerHTML = `<div class="empty-state">NO JOURNAL ENTRIES RECORDED IN SOIL ARCHIVES.</div>`;
        return;
    }

    journalData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'journal-card';
        card.innerHTML = `
            <button class="delete-journal-btn" title="Delete Log">&times;</button>
            <div class="journal-card-header">
                <span class="journal-card-title">${item.plant}</span>
                <span class="journal-card-meta">${item.date}</span>
            </div>
            <div class="journal-card-body">${item.notes}</div>
            <div class="journal-card-badges">
                <span class="j-badge j-badge-green">${item.action}</span>
                <span class="j-badge j-badge-cyan">${item.phase}</span>
            </div>
        `;
        
        // Bind delete action
        card.querySelector('.delete-journal-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm("Delete this soil journal entry?")) {
                journalData = journalData.filter(j => j.id !== item.id);
                localStorage.setItem('garden-journal', JSON.stringify(journalData));
                renderJournalList();
            }
        });

        dom.journalList.appendChild(card);
    });
}

// Click sound sweep helper
function playBubblePopSound() {
    try {
        const ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctxAudio.createOscillator();
        const gain = ctxAudio.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(528, ctxAudio.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctxAudio.currentTime + 0.08);
        gain.gain.setValueAtTime(0.03, ctxAudio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctxAudio.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctxAudio.destination);
        osc.start();
        osc.stop(ctxAudio.currentTime + 0.08);
    } catch (e) {}
}

// 6. HUMBLE BEE ASSISTANT
function initAssistant() {
    dom.btnBeeSeasonal.addEventListener('click', () => {
        speakBeeAdvice("Buzz... June is mid-winter in NZ. Focus on pruning deciduous fruit trees, planting garlic layers, and prepping soil humus beds with nettle compost tea.");
    });
    
    dom.btnBeeLunar.addEventListener('click', () => {
        const localDate = new Date();
        const lDay = getLunarDay(localDate);
        let tip = "Buzz... Dark moon cycles are optimal for weed clearing, compost aeration, and biochar conditioning. Avoid planting seeds.";
        if (lDay >= 1 && lDay < 7) {
            tip = "Buzz... Waxing crescent coordinates are active. Perfect for seed germination and spraying Kawakawa 528Hz mist sweeps on seedbeds.";
        } else if (lDay >= 7 && lDay < 15) {
            tip = "Buzz... Full Moon coordinates. High moisture pull is active. Transplant seedlings and tune roots to 639Hz immediately.";
        } else if (lDay >= 15 && lDay < 22) {
            tip = "Buzz... Waning Moon active. Gravity is pulling sap downwards. Ideal for root crop planting (Kūmara) and tuning compost beds to 432Hz.";
        }
        speakBeeAdvice(tip);
    });

    dom.btnBeeSoil.addEventListener('click', () => {
        speakBeeAdvice("Buzz... Soil check: Maintain a 30:1 Carbon-to-Nitrogen ratio. Mix woody forest mulch with green compost weeds. Tune seedbed layers to 852Hz Humus frequency to stimulate mycorrhizal fungal grids.");
    });

    const input = document.getElementById('bee-query');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                queryHumbleBee();
            }
        });
    }
}

function queryHumbleBee() {
    const input = document.getElementById('bee-query');
    if (!input) return;
    const query = input.value.trim().toLowerCase();
    if (!query) return;

    let response = "Buzz... Analyzing frequencies... I don't see that specific cultivation sequence in my local database. Try asking me about: Kawakawa, Harakeke, Kūmara, Pruning, Compost, or Companion Guilds!";

    if (query.includes("kawakawa")) {
        response = "Buzz... Kawakawa is a sacred Māori medicinal plant. Cultivate in rich compost with partial shade. Tune seedbeds to 528Hz Solfeggio frequency to align molecular cell structure during planting.";
    } else if (query.includes("harakeke") || query.includes("flax")) {
        response = "Buzz... Harakeke (NZ Flax) grows best in moist soil profiles. Always harvest outer leaves first, leaving the baby shoot (rito) and parent leaves untouched. Tune with 639Hz to support growth structures.";
    } else if (query.includes("kumara") || query.includes("kūmara") || query.includes("sweet potato")) {
        response = "Buzz... Kūmara sweet potatoes love sandy loam soil. Transplant sprouts (tupu) during a waning moon to encourage deep root energy. Tune composting beds to 432Hz to stimulate earthworms.";
    } else if (query.includes("prun") || query.includes("cut") || query.includes("arbor")) {
        response = "Buzz... Mid-winter pruning of fruit trees (June/July in NZ) should be done with sharp, sanitized tools at a 45-degree angle. This keeps cuts dry and disease-free while tree sap is dormant.";
    } else if (query.includes("compost") || query.includes("soil") || query.includes("humus")) {
        response = "Buzz... Maintain a carbon-to-nitrogen ratio of 30:1. Turn piles regularly to oxygenate. Tune composting beds to 852Hz (Humus resonance) to attract positive microbial activity.";
    } else if (query.includes("guild") || query.includes("companion")) {
        response = "Buzz... Create self-sustaining companion guilds! Plant nitrogen-fixers (like clover or beans) next to heavy feeders. Use tall crops to shield shade-loving herbs (like Kawakawa) from midday rays.";
    } else if (query.includes("lunar") || query.includes("moon")) {
        response = "Buzz... Waxing crescent moon (Days 1-7) boosts above-ground leafy growth. Full moon (Days 8-14) is prime for transplanting. Waning phases (Days 15-28) direct energy to root formation.";
    } else if (query.includes("hello") || query.includes("hi") || query.includes("buzz") || query.includes("help")) {
        response = "Buzz... Greetings, cultivator! I am the Humble Bee assistant. Ask me questions about Kawakawa, Harakeke, Kūmara, Composting, Pruning, or Companion planting guilds.";
    }

    speakBeeAdvice(response);
    input.value = "";
}

function triggerBeeSuggestion(topic) {
    const input = document.getElementById('bee-query');
    if (input) {
        input.value = topic;
        queryHumbleBee();
    }
}

let typingTimeout = null;
function speakBeeAdvice(phrase) {
    if (typingTimeout) clearTimeout(typingTimeout);
    dom.beeSpeech.innerText = "";
    let charIdx = 0;
    
    function type() {
        if (charIdx < phrase.length) {
            dom.beeSpeech.innerText += phrase.charAt(charIdx);
            charIdx++;
            typingTimeout = setTimeout(type, 18);
        }
    }
    
    type();
}

// 7. WHOLEFOOD EXCHANGE & SHOP MATRIX
function initExchangeShop() {
    if (!dom.shopMatrix) return;
    dom.shopMatrix.innerHTML = "";

    SHOP_SEEDS.forEach(item => {
        const card = document.createElement('div');
        card.className = 'shop-item-card';
        card.innerHTML = `
            <div class="shop-item-img">
                <img src="${item.img}" alt="${item.title}">
            </div>
            <div class="shop-item-title">${item.title}</div>
            <div class="shop-item-desc">${item.desc}</div>
            <div class="shop-item-footer">
                <span class="shop-item-price">${item.price}</span>
                <button class="trade-btn">MINT SWAP</button>
            </div>
        `;
        
        card.querySelector('.trade-btn').addEventListener('click', () => {
            alert(`Swapping matrix coordinate initiated for: ${item.title}.\nConfirming transaction with Harmony Exchange Vault.`);
            playBubblePopSound();
        });

        dom.shopMatrix.appendChild(card);
    });
}

// 8. PROGRESS TIMELINE SHOWCASE (GALLERY)
function initShowcaseGallery() {
    if (!dom.galleryGrid) return;
    dom.galleryGrid.innerHTML = "";

    GALLERY_ITEMS.forEach(item => {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.innerHTML = `
            <div class="gallery-img-box">
                <img src="${item.img}" alt="${item.title}">
            </div>
            <div class="gallery-card-title">${item.title}</div>
            <div class="gallery-card-date">${item.date}</div>
        `;
        dom.galleryGrid.appendChild(card);
    });
}

// 9. ANIMATED FLUID CYCLES FLOW CANVAS
function initFlowAnimation() {
    flowCanvas = document.getElementById('flow-canvas');
    if (!flowCanvas) return;
    flowCtx = flowCanvas.getContext('2d');
    
    // Fit canvas bounds
    flowCanvas.width = flowCanvas.parentElement.clientWidth - 32;
    flowCanvas.height = 300;

    let time = 0;

    function renderCycles() {
        flowAnimFrameId = requestAnimationFrame(renderCycles);
        time += 0.015;

        flowCtx.clearRect(0, 0, flowCanvas.width, flowCanvas.height);
        flowCtx.fillStyle = 'rgba(7, 9, 6, 0.4)';
        flowCtx.fillRect(0, 0, flowCanvas.width, flowCanvas.height);

        const accentColor = varColor('--accent') || '#4caf50';

        // 1. Water fluid wave loop (blue wave)
        flowCtx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
        flowCtx.lineWidth = 3;
        flowCtx.beginPath();
        for (let x = 0; x < flowCanvas.width; x++) {
            const y = 80 + Math.sin(x * 0.01 + time) * 15 + Math.cos(x * 0.005 + time * 0.5) * 8;
            if (x === 0) flowCtx.moveTo(x, y);
            else flowCtx.lineTo(x, y);
        }
        flowCtx.stroke();

        // 2. Lunar alignment line (gold wave)
        flowCtx.strokeStyle = 'rgba(255, 170, 0, 0.5)';
        flowCtx.lineWidth = 2.5;
        flowCtx.beginPath();
        for (let x = 0; x < flowCanvas.width; x++) {
            const y = 150 + Math.cos(x * 0.008 + time * 0.7) * 20 + Math.sin(x * 0.004 + time) * 10;
            if (x === 0) flowCtx.moveTo(x, y);
            else flowCtx.lineTo(x, y);
        }
        flowCtx.stroke();

        // 3. Carbon / Nitrogen loop particles (green spirals/drifts)
        flowCtx.fillStyle = accentColor;
        const particleCount = 24;
        for (let i = 0; i < particleCount; i++) {
            const px = (i * (flowCanvas.width / particleCount) + time * 25) % (flowCanvas.width + 40) - 20;
            const py = 220 + Math.sin(px * 0.02 + time * 1.5 + i) * 18;
            flowCtx.beginPath();
            flowCtx.arc(px, py, Math.abs(Math.sin(time + i)) * 3.5 + 2, 0, Math.PI * 2);
            flowCtx.fill();
        }

        // 4. Seed resonance impulse waves (pink sweeps)
        const pulseProgress = (time * 0.6) % 1.0;
        flowCtx.strokeStyle = `rgba(255, 0, 128, ${1.0 - pulseProgress})`;
        flowCtx.lineWidth = 1.5;
        flowCtx.beginPath();
        flowCtx.arc(flowCanvas.width / 2, flowCanvas.height / 2, pulseProgress * 130 + 10, 0, Math.PI * 2);
        flowCtx.stroke();
    }

    renderCycles();
}

// Observes body class changes to update canvas colors
const themeObserver = new MutationObserver(() => {
    resizeTunerCanvas();
    if (flowCanvas) {
        flowCanvas.width = flowCanvas.parentElement.clientWidth - 32;
    }
});
themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

// 10. BOTANICAL APOTHECARY & VITALITY BREATHING TUNER
function initApothecary() {
    if (!dom.remedyPlantList || !dom.remedyDetailsBox) return;

    // Render Pharmacopoeia buttons
    dom.remedyPlantList.innerHTML = "";
    APOTHECARY_PLANTS.forEach((plant, index) => {
        const btn = document.createElement('button');
        btn.className = `remedy-tab-btn${index === 0 ? ' active' : ''}`;
        btn.innerText = plant.name;
        btn.onclick = () => {
            document.querySelectorAll('.remedy-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderRemedyDetails(plant);
            playBubblePopSound();
        };
        dom.remedyPlantList.appendChild(btn);
    });

    // Render initial plant details
    renderRemedyDetails(APOTHECARY_PLANTS[0]);

    // Bind breathing visualizer toggle
    if (dom.btnToggleBreathing) {
        dom.btnToggleBreathing.addEventListener('click', toggleBreathingTuner);
    }
}

function renderRemedyDetails(plant) {
    if (!dom.remedyDetailsBox) return;
    dom.remedyDetailsBox.innerHTML = `
        <h4 style="font-family:'Orbitron',sans-serif;color:var(--accent);font-size:0.8rem;margin-bottom:8px;letter-spacing:0.5px;">
            ${plant.name} 
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.65rem;color:var(--highlight);margin-left:6px;font-style:italic;">
                (${plant.botanical})
            </span>
        </h4>
        <div class="remedy-section-title" style="font-family:'Share Tech Mono',monospace;font-size:0.65rem;color:var(--highlight);margin-top:10px;text-transform:uppercase;">Active Properties</div>
        <p style="margin-top:4px; opacity:0.85; font-size: 0.72rem; line-height: 1.4;">${plant.properties}</p>
        <div class="remedy-section-title" style="font-family:'Share Tech Mono',monospace;font-size:0.65rem;color:var(--highlight);margin-top:10px;text-transform:uppercase;">Preparation &amp; Forms</div>
        <p style="margin-top:4px; opacity:0.85; font-size: 0.72rem; line-height: 1.4;">${plant.preparations}</p>
        <div class="remedy-section-title" style="font-family:'Share Tech Mono',monospace;font-size:0.65rem;color:var(--alert);margin-top:10px;text-transform:uppercase;">Cautions &amp; Safety</div>
        <p style="margin-top:4px; opacity:0.85; font-size: 0.72rem; line-height: 1.4; color: var(--alert);">${plant.cautions}</p>
    `;
}

// Breathing alignment phase array (Inhale 4s, Hold 4s, Exhale 4s, Hold 4s)
const BREATHING_PHASES = [
    { label: "💨 INHALE (4s)", scale: "scale(1.5)", volume: 0.05, opacity: "1" },
    { label: "🌀 HOLD (4s)", scale: "scale(1.5)", volume: 0.05, opacity: "1" },
    { label: "💨 EXHALE (4s)", scale: "scale(0.6)", volume: 0.015, opacity: "0.5" },
    { label: "🌀 HOLD (4s)", scale: "scale(0.6)", volume: 0.015, opacity: "0.5" }
];

function toggleBreathingTuner() {
    if (breathingActive) {
        stopBreathingTuner();
    } else {
        startBreathingTuner();
    }
}

function startBreathingTuner() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        breathingActive = true;
        dom.btnToggleBreathing.innerText = "🛑 STOP BREATH ALIGNMENT";
        dom.btnToggleBreathing.classList.add('active');
        dom.btnToggleBreathing.style.background = "var(--alert)";
        dom.btnToggleBreathing.style.color = "#fff";
        dom.btnToggleBreathing.style.boxShadow = "0 0 15px var(--alert)";

        // Initialize Web Audio oscillator detuned by slow 0.2Hz LFO for breathing
        breathOscillatorNode = audioCtx.createOscillator();
        breathOscillatorNode.type = 'sine';
        breathOscillatorNode.frequency.setValueAtTime(432, audioCtx.currentTime); // 432Hz Solfeggio

        breathLfoNode = audioCtx.createOscillator();
        breathLfoNode.type = 'sine';
        breathLfoNode.frequency.setValueAtTime(0.2, audioCtx.currentTime); // 0.2Hz detune modulation

        breathLfoGainNode = audioCtx.createGain();
        breathLfoGainNode.gain.setValueAtTime(2.5, audioCtx.currentTime); // 2.5Hz detuning sweep

        breathLfoNode.connect(breathLfoGainNode);
        breathLfoGainNode.connect(breathOscillatorNode.frequency);

        breathGainNode = audioCtx.createGain();
        // Start volume low
        breathGainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);

        breathOscillatorNode.connect(breathGainNode);
        breathGainNode.connect(audioCtx.destination);

        breathLfoNode.start();
        breathOscillatorNode.start();

        // Start breathing cycles loop
        breathingPhaseIndex = 0;
        runBreathingCycle(); // execute immediately
        breathingInterval = setInterval(runBreathingCycle, 4000); // cycle every 4s
    } catch (e) {
        console.error("Failed to start breathing tuner audio:", e);
        alert("Audio context failed to start breathing sweep.");
    }
}

function runBreathingCycle() {
    if (!breathingActive) return;

    const phase = BREATHING_PHASES[breathingPhaseIndex];
    
    // Update visual label
    if (dom.breathingPhaseLabel) {
        dom.breathingPhaseLabel.innerText = phase.label;
    }

    // Apply scale & opacity transform to breathing circle
    if (dom.breathingCircle) {
        dom.breathingCircle.style.transform = phase.scale;
        dom.breathingCircle.style.opacity = phase.opacity;
        
        // Add subtle shadow transition
        if (phase.opacity === "1") {
            dom.breathingCircle.style.boxShadow = "0 0 25px var(--accent), inset 0 0 15px var(--accent)";
        } else {
            dom.breathingCircle.style.boxShadow = "0 0 10px var(--accent-glow), inset 0 0 5px var(--accent-glow)";
        }
    }

    // Smoothly sweep the audio gain over 4 seconds
    if (breathGainNode && audioCtx) {
        breathGainNode.gain.linearRampToValueAtTime(phase.volume, audioCtx.currentTime + 3.8);
    }

    // Increment phase index
    breathingPhaseIndex = (breathingPhaseIndex + 1) % BREATHING_PHASES.length;
}

function stopBreathingTuner() {
    breathingActive = false;
    
    // Clear loop intervals
    if (breathingInterval) {
        clearInterval(breathingInterval);
        breathingInterval = null;
    }

    // Reset button
    if (dom.btnToggleBreathing) {
        dom.btnToggleBreathing.innerText = "🚀 START BREATH ALIGNMENT";
        dom.btnToggleBreathing.classList.remove('active');
        dom.btnToggleBreathing.style.background = "";
        dom.btnToggleBreathing.style.color = "";
        dom.btnToggleBreathing.style.boxShadow = "";
    }

    // Reset visuals to standby state
    if (dom.breathingPhaseLabel) {
        dom.breathingPhaseLabel.innerText = "STANDBY";
    }
    if (dom.breathingCircle) {
        dom.breathingCircle.style.transform = "scale(0.6)";
        dom.breathingCircle.style.opacity = "0.85";
        dom.breathingCircle.style.boxShadow = "0 0 15px var(--accent-glow), inset 0 0 10px var(--accent-glow)";
    }

    // Stop and clean up audio
    if (breathOscillatorNode) {
        try {
            breathOscillatorNode.stop();
            breathOscillatorNode.disconnect();
            breathLfoNode.stop();
            breathLfoNode.disconnect();
            breathLfoGainNode.disconnect();
            breathGainNode.disconnect();
        } catch (e) {}
        breathOscillatorNode = null;
        breathLfoNode = null;
        breathLfoGainNode = null;
        breathGainNode = null;
    }
}

// Init Entry
function init() {
    initLunarTracker();
    initTabs();
    initAudioTuner();
    initJournal();
    initAssistant();
    initExchangeShop();
    initShowcaseGallery();
    initApothecary();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
