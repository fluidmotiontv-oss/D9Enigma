import { getDragonSync } from '../scripts/math.js';

let vault = [];
let shortcodeMap = {};
let currentRoot = 1;
let currentD9Time = "00:00:00";

const dom = {
    clockD9: document.getElementById('clockD9'),
    clockMilli: document.getElementById('clockMilli'),
    rootDisplay: document.getElementById('rootDisplay'),
    vaultContainer: document.getElementById('vaultContainer'),
    vaultTotal: document.getElementById('vaultTotal'),
    mintVal: document.getElementById('mintVal'),
    mintCreator: document.getElementById('mintCreator'),
    mintKeyphrase: document.getElementById('mintKeyphrase'),
    mintQrBox: document.getElementById('mintQrBox'),
    qrCanvas: document.getElementById('qrCanvas'),
    shortcodeText: document.getElementById('shortcodeText'),
    uploader: document.getElementById('uploader'),
    uploadLabel: document.getElementById('uploadLabel'),
    depositShortcode: document.getElementById('depositShortcode'),
    logger: document.getElementById('logger')
};

function log(msg, type = 'SYSTEM') {
    const entry = document.createElement('div');
    entry.textContent = `[${type}] ${msg}`;
    dom.logger.prepend(entry);
}

// Load vault and shortcodes
function loadVault() {
    try {
        const savedVault = localStorage.getItem('harmony-vault');
        if (savedVault) {
            vault = JSON.parse(savedVault);
        } else {
            // Seed a few notes to make the app feel alive on first load
            vault = [
                {
                    id: 'HN-473921',
                    value: 50,
                    creator: 'Misaki Core',
                    keyphrase: '',
                    mintDate: new Date(Date.now() - 3600000 * 24).toISOString(),
                    rootVal: 9,
                    d9Time: "13:12:44"
                },
                {
                    id: 'HN-849302',
                    value: 108,
                    creator: 'Okiwi Gateway',
                    keyphrase: 'ocean-waves',
                    mintDate: new Date(Date.now() - 3600000 * 3).toISOString(),
                    rootVal: 3,
                    d9Time: "04:32:01"
                }
            ];
            localStorage.setItem('harmony-vault', JSON.stringify(vault));
        }

        const savedMap = localStorage.getItem('shortcode-map');
        if (savedMap) {
            shortcodeMap = JSON.parse(savedMap);
        }
    } catch (e) {
        log("Error initializing storage vault: " + e.message, "ERROR");
    }
    updateVaultUI();
    updateReserveUI();
}

function saveVault() {
    localStorage.setItem('harmony-vault', JSON.stringify(vault));
    localStorage.setItem('shortcode-map', JSON.stringify(shortcodeMap));
    updateVaultUI();
}

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
            
            const creatorInput = document.getElementById('mintCreator');
            if (creatorInput) {
                creatorInput.value = id.alias;
            }
        } catch (e) {
            console.error("Error updating reserve UI:", e);
        }
    } else {
        badge.innerText = "INACTIVE";
        badge.style.background = "rgba(255, 0, 128, 0.15)";
        badge.style.color = "var(--alert)";
        
        desc.innerText = "Earning tokens is currently pre-launch. Opt-in with your Sovereign DID to accumulate and secure your balances ready for Note launch.";
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

// Update the list of notes
function updateVaultUI() {
    dom.vaultContainer.innerHTML = '';
    if (vault.length === 0) {
        dom.vaultContainer.innerHTML = '<div class="no-notes">Awaiting Note uplinks...</div>';
        dom.vaultTotal.textContent = 'TOTAL BALANCE: 0 H-NOTES';
        return;
    }

    let total = 0;
    vault.forEach(note => {
        total += note.value;
        const card = document.createElement('div');
        card.className = 'note-card';
        card.onclick = () => {
            log(`Inspected note ${note.id} minted by ${note.creator} (D9: ${note.d9Time}, Root: ${note.rootVal})`);
        };

        const dt = new Date(note.mintDate).toLocaleDateString();
        card.innerHTML = `
            <div class="note-card-header">
                <span class="note-id">${note.id}</span>
                <span class="note-value">${note.value} HN</span>
            </div>
            <div class="note-meta">
                <span>MINTED BY: ${note.creator}</span>
                <span>ROOT: ${note.rootVal} | ${dt}</span>
            </div>
        `;
        dom.vaultContainer.appendChild(card);
    });

    dom.vaultTotal.textContent = `TOTAL BALANCE: ${total} H-NOTES`;
}

// Minting logic
window.mintHarmonyNote = function() {
    const val = parseFloat(dom.mintVal.value);
    if (isNaN(val) || val <= 0) {
        log("Invalid denomination value. Must be greater than 0.", "WARN");
        return;
    }
    const creator = dom.mintCreator.value.trim() || 'Anonymous';
    const keyphrase = dom.mintKeyphrase.value.trim();

    // Create Note Payload
    const note = {
        id: 'HN-' + Math.floor(100000 + Math.random() * 900000),
        value: val,
        creator: creator,
        keyphrase: keyphrase,
        mintDate: new Date().toISOString(),
        rootVal: currentRoot,
        d9Time: currentD9Time
    };

    // Serialize & encode to base64
    const jsonStr = JSON.stringify(note);
    const base64Payload = btoa(unescape(encodeURIComponent(jsonStr)));

    // Generate local transaction short-code
    const shortcode = `${currentRoot}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Store mapping locally for P2P emulation
    shortcodeMap[shortcode] = base64Payload;
    
    // Save to ledger
    vault.push(note);
    saveVault();
    addEarningsToReserve(note.value);

    // Render QR Code
    dom.qrCanvas.style.display = 'block';
    const qr = new QRious({
        element: dom.qrCanvas,
        value: base64Payload,
        size: 180,
        background: '#ffffff',
        foreground: '#000000',
        level: 'H'
    });

    dom.shortcodeText.textContent = shortcode;
    dom.mintQrBox.style.display = 'flex';

    log(`Minted new Harmony Note: ${note.id} (${note.value} HN) signed by ${note.creator}`, "SUCCESS");
};

window.closeMintResult = function() {
    dom.mintQrBox.style.display = 'none';
};

window.clearVault = function() {
    if (confirm("Are you sure you want to clear your local vault ledger? This action is irreversible.")) {
        vault = [];
        saveVault();
        log("Local vault cleared.", "SUCCESS");
    }
};

// Deposit note
window.depositHarmonyNote = function() {
    const shortcode = dom.depositShortcode.value.trim();
    if (shortcode) {
        const payload = shortcodeMap[shortcode];
        if (payload) {
            importNotePayload(payload);
            dom.depositShortcode.value = '';
        } else {
            log("Invalid short-code or transaction mapping expired.", "ERROR");
        }
        return;
    }
    log("Awaiting QR scan or short-code input.", "WARN");
};

function importNotePayload(payload) {
    try {
        const jsonStr = decodeURIComponent(escape(atob(payload)));
        const note = JSON.parse(jsonStr);

        // Validate structure
        if (!note.id || !note.value || !note.creator) {
            throw new Error("Invalid note schema.");
        }

        // Prevent double deposit (duplicate IDs)
        if (vault.some(n => n.id === note.id)) {
            log(`Rejected duplicate Note deposit: ${note.id} already in vault.`, "WARN");
            return;
        }

        // Add to vault
        vault.push(note);
        saveVault();
        addEarningsToReserve(note.value);
        log(`Successfully deposited Note ${note.id} (${note.value} HN) minted by ${note.creator}!`, "SUCCESS");
    } catch (e) {
        log("Resonance failure decoding note payload: " + e.message, "ERROR");
    }
}

// Upload and decode QR
dom.uploader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    dom.uploadLabel.textContent = file.name.toUpperCase();
    log(`Reading QR Code image: ${file.name}`);

    const reader = new FileReader();
    reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
            // Draw to offscreen canvas to extract pixel data
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imgData.data, imgData.width, imgData.height);
            
            if (qrCode) {
                log("QR Code read successful.", "SUCCESS");
                importNotePayload(qrCode.data);
            } else {
                log("Failed to detect QR Code in the uploaded image.", "ERROR");
            }
        };
        img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
});

// --- DEDUCTION TRANSACTION FUNCTION ---
function getVaultTotal() {
    return vault.reduce((sum, n) => sum + n.value, 0);
}

function deductVaultBalance(amount) {
    if (getVaultTotal() < amount) return false;
    let remaining = amount;
    for (let i = vault.length - 1; i >= 0; i--) {
        if (vault[i].value <= remaining) {
            remaining -= vault[i].value;
            vault.splice(i, 1);
        } else {
            vault[i].value -= remaining;
            remaining = 0;
            break;
        }
    }
    saveVault();
    return true;
}

// --- GIFTSHOP BUSINESS LOGIC ---
let purchasedInventory = JSON.parse(localStorage.getItem('d9_purchased_inventory') || '[]');

function updateShopUI() {
    const invEl = document.getElementById('shopInventory');
    if (!invEl) return;
    if (purchasedInventory.length === 0) {
        invEl.innerHTML = '<div style="opacity: 0.6;">No items purchased yet.</div>';
    } else {
        invEl.innerHTML = '';
        invEl.style.display = 'flex';
        invEl.style.flexWrap = 'wrap';
        invEl.style.gap = '6px';
        invEl.style.background = 'transparent';
        invEl.style.padding = '0';
        
        const itemImages = {
            'Orange Lovely Butterfly': '../assets/shop/orange-lovely.png',
            'Humble Bee Stamp': '../assets/shop/bee-humble-bee.png',
            'Pink Seaslug Icon': '../assets/shop/pink-seaslug.png',
            'Black Ruffie Badge': '../assets/shop/blakruffie.png',
            'Retro Welcome Screen': '../assets/shop/homeand-welcome.png',
            'Blue Butterfly': '../assets/shop/blue-buttfly-right.png',
            'Kiwis in the Middle': '../assets/shop/kiwis-in-midle.png',
            'Left Palm Tree': '../assets/shop/palmtree-left.png',
            'Right Palm Tree': '../assets/shop/palmtree-right.png',
            'Network Grid Blueprint': '../assets/shop/networkhome1.png',
            'Gift Shop Blueprint': '../assets/shop/shopPage1.png',
            'Blue Stamp Badge': '../assets/shop/bluestamp.png',
            'Red Stamp Badge': '../assets/shop/redstamp.png',
            'White Stamp Badge': '../assets/shop/whitestamp.png',
            'Yellow Stamp Badge': '../assets/shop/yellowstamp.png'
        };
        
        purchasedInventory.forEach(item => {
            const imgPath = itemImages[item] || '../assets/shop/bluestamp.png';
            const badge = document.createElement('div');
            badge.style.display = 'inline-flex';
            badge.style.alignItems = 'center';
            badge.style.gap = '6px';
            badge.style.background = 'rgba(255, 255, 255, 0.05)';
            badge.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            badge.style.padding = '4px 8px';
            badge.style.borderRadius = '4px';
            
            badge.innerHTML = `
                <img src="${imgPath}" style="width: 14px; height: 14px; object-fit: contain;" />
                <span style="font-size: 0.55rem; color: #fff; font-family: 'Share Tech Mono', monospace;">${item.toUpperCase()}</span>
            `;
            invEl.appendChild(badge);
        });
    }
}

window.buyShopItem = function(itemName, cost) {
    if (getVaultTotal() < cost) {
        log(`Failed purchase of ${itemName}: Insufficient Harmony Note balance (${cost} HN required).`, "WARN");
        return;
    }
    if (deductVaultBalance(cost)) {
        purchasedInventory.push(itemName);
        localStorage.setItem('d9_purchased_inventory', JSON.stringify(purchasedInventory));
        updateShopUI();
        log(`Successfully purchased ${itemName} for ${cost} HN! Token unlocked in inventory.`, "SUCCESS");
    }
};

// --- TRADER BUSINESS LOGIC ---
let balanceD9 = parseFloat(localStorage.getItem('d9_trader_credits') || '0.0');
let balanceCrystals = parseFloat(localStorage.getItem('d9_trader_crystals') || '0.0');
let rateD9 = 7.7;
let rateCrystals = 0.067;

function updateWalletUI() {
    const elD9 = document.getElementById('balD9');
    const elCry = document.getElementById('balCrystals');
    if (elD9) elD9.innerText = balanceD9.toFixed(2);
    if (elCry) elCry.innerText = balanceCrystals.toFixed(3);
}

function fluctuateRates() {
    rateD9 = Math.max(5.0, Math.min(10.0, rateD9 + (Math.random() - 0.5) * 0.2));
    rateCrystals = Math.max(0.03, Math.min(0.12, rateCrystals + (Math.random() - 0.5) * 0.003));
    
    const elD9 = document.getElementById('rateD9');
    const elCry = document.getElementById('rateCrystals');
    if (elD9) elD9.innerText = rateD9.toFixed(2) + ' D9C';
    if (elCry) elCry.innerText = rateCrystals.toFixed(4) + ' CRY';
}
setInterval(fluctuateRates, 3500);

window.tradeCurrency = function(target) {
    const inputAmt = parseFloat(document.getElementById('tradeAmount').value);
    if (isNaN(inputAmt) || inputAmt <= 0) {
        log("Please enter a valid amount of HN to sell.", "WARN");
        return;
    }
    if (getVaultTotal() < inputAmt) {
        log(`Trade failed: Insufficient HN in vault.`, "WARN");
        return;
    }
    
    if (deductVaultBalance(inputAmt)) {
        if (target === 'd9') {
            const earned = inputAmt * rateD9;
            balanceD9 += earned;
            localStorage.setItem('d9_trader_credits', balanceD9);
            log(`Sold ${inputAmt} HN at rate ${rateD9.toFixed(2)}: Received ${earned.toFixed(2)} D9 Credits!`, "SUCCESS");
        } else {
            const earned = inputAmt * rateCrystals;
            balanceCrystals += earned;
            localStorage.setItem('d9_trader_crystals', balanceCrystals);
            log(`Sold ${inputAmt} HN at rate ${rateCrystals.toFixed(4)}: Received ${earned.toFixed(3)} Resonance Crystals!`, "SUCCESS");
        }
        updateWalletUI();
    }
};

window.combineNotes = function() {
    if (vault.length < 2) {
        log("Note Combine requires at least 2 separate notes in the vault.", "WARN");
        return;
    }
    const total = getVaultTotal();
    vault = [{
        id: 'HN-' + Math.floor(100000 + Math.random() * 900000),
        value: total,
        creator: 'Vault Combiner',
        keyphrase: 'combined-ledger',
        mintDate: new Date().toISOString(),
        rootVal: currentRoot,
        d9Time: currentD9Time
    }];
    saveVault();
    log(`Successfully combined all vault notes into a single note of ${total} HN!`, "SUCCESS");
};

window.splitNotesPrompt = function() {
    let largest = null;
    let largestIdx = -1;
    vault.forEach((n, idx) => {
        if (!largest || n.value > largest.value) {
            largest = n;
            largestIdx = idx;
        }
    });
    if (!largest || largest.value <= 1) {
        log("No splittable notes found (valuation must be > 1 HN).", "WARN");
        return;
    }
    
    const val1 = Math.floor(largest.value / 2);
    const val2 = largest.value - val1;
    
    vault.splice(largestIdx, 1);
    
    vault.push({
        id: 'HN-' + Math.floor(100000 + Math.random() * 900000),
        value: val1,
        creator: largest.creator,
        keyphrase: largest.keyphrase,
        mintDate: new Date().toISOString(),
        rootVal: currentRoot,
        d9Time: currentD9Time
    }, {
        id: 'HN-' + Math.floor(100000 + Math.random() * 900000),
        value: val2,
        creator: largest.creator,
        keyphrase: largest.keyphrase,
        mintDate: new Date().toISOString(),
        rootVal: currentRoot,
        d9Time: currentD9Time
    });
    
    saveVault();
    log(`Split Note ${largest.id} (${largest.value} HN) into two notes of ${val1} HN and ${val2} HN!`, "SUCCESS");
};

// --- RAFFLE BUSINESS LOGIC ---
let raffleTickets = 0;

window.buyRaffleTicket = function() {
    const cost = 5;
    if (getVaultTotal() < cost) {
        log(`Raffle ticket purchase failed: Insufficient HN in vault.`, "WARN");
        return;
    }
    if (deductVaultBalance(cost)) {
        raffleTickets++;
        document.getElementById('ticketCount').innerText = raffleTickets;
        document.getElementById('btnDrawRaffle').disabled = false;
        log(`Purchased a time-matrix raffle ticket! Active tickets: ${raffleTickets}`, "SUCCESS");
    }
};

window.runRaffleDraw = function() {
    if (raffleTickets <= 0) return;
    raffleTickets--;
    document.getElementById('ticketCount').innerText = raffleTickets;
    if (raffleTickets === 0) {
        document.getElementById('btnDrawRaffle').disabled = true;
    }
    
    const spinner = document.getElementById('raffleSpinner');
    spinner.style.display = 'block';
    
    let counter = 0;
    const phrases = ["EVOLVING TIME MATRIX...", "SCANNING OFF-GRID SECTORS...", "LOCALIZING RESONANCE...", "VERIFYING BLOCK HASH..."];
    const interval = setInterval(() => {
        spinner.innerText = phrases[counter % phrases.length];
        counter++;
    }, 450);
    
    setTimeout(() => {
        clearInterval(interval);
        spinner.style.display = 'none';
        
        const rand = Math.random();
        if (rand < 0.10) {
            // 1st prize (50 HN)
            const prizenote = {
                id: 'HN-' + Math.floor(100000 + Math.random() * 900000),
                value: 50,
                creator: 'Raffle Matrix',
                keyphrase: 'raffle-jackpot-prize',
                mintDate: new Date().toISOString(),
                rootVal: currentRoot,
                d9Time: currentD9Time
            };
            vault.push(prizenote);
            saveVault();
            addEarningsToReserve(prizenote.value);
            log("JACKPOT! You won the 1st Raffle Prize of 50 HN!", "SUCCESS");
        } else if (rand < 0.35) {
            // 2nd prize (10 HN)
            const prizenote = {
                id: 'HN-' + Math.floor(100000 + Math.random() * 900000),
                value: 10,
                creator: 'Raffle Matrix',
                keyphrase: 'raffle-minor-prize',
                mintDate: new Date().toISOString(),
                rootVal: currentRoot,
                d9Time: currentD9Time
            };
            vault.push(prizenote);
            saveVault();
            addEarningsToReserve(prizenote.value);
            log("CONGRATULATIONS! You won the 2nd Raffle Prize of 10 HN!", "SUCCESS");
        } else {
            log("Matrix draw decoupled. No prize won this time. Better luck next alignment!", "INFO");
        }
    }, 2200);
};

// --- CHANNEL 9: LIVE RAP BATTLE & ART AUCTION CHANNEL LOGIC ---
const auctionArtworks = [
    { title: "Whale Lightfield Horizon", artist: "Misaki Core", initialBid: 15, avatar: "🐋", desc: "3D volumetric lightfield path" },
    { title: "Matariki Mycelium Loop", artist: "Gino Permaculture", initialBid: 25, avatar: "🍄", desc: "Mycelium root connectivity map" },
    { title: "Tasman Packet Glitch", artist: "Conan Net", initialBid: 20, avatar: "📡", desc: "Packet delay line visualization" },
    { title: "Matauranga Time-Warp", artist: "Timothy Dwen", initialBid: 35, avatar: "🌀", desc: "Off-grid temporal helix canvas" },
    { title: "Kūmara Root Frequencies", artist: "Gino Permaculture", initialBid: 30, avatar: "🍠", desc: "Solfeggio wave resonance pattern" }
];

const crewDisses = {
    'Night Fish': {
        avatar: "🐠",
        bars: [
            "Your beats are running lagging behind my flow / I'm off-grid cruising while you're moving too slow!",
            "I'm bidding higher notes on this beautiful art / You're holding empty bags while I play my part!",
            "My waves are detuned, my frequency is deep / While you are counting credits I'm awake, you sleep!",
            "You call that a system? It's just a local loop / I'll sweep this auction clean with one single swoop!"
        ]
    },
    'Corey': {
        avatar: "🎧",
        bars: [
            "I make the sub-bass rumble, shake the floor / Bidding fifty notes, then I'll add some more!",
            "You're just a floating bubble in a digital tank / I'm cashing out my notes, heading straight to the bank!",
            "Step back, little fish, my rhythm's too tight / I'll outbid you now and win the whole fight!",
            "Your code is copy-paste, your logic is dry / My bids go off the chart, sailing up to the sky!"
        ]
    },
    'Conan': {
        avatar: "📡",
        bars: [
            "Section 21 rights, I protect this whole grid / I'm locking down this art with a sovereign bid!",
            "You rappers talk a lot but your network is down / I'm the real administrator of this off-grid town!",
            "I block your packet flows and I throttle your speed / This artwork's coming home, it is just what I need!",
            "I outbid your wallet, I trace your IP / Your diss is desynced, you can't stand next to me!"
        ]
    },
    'Misaki': {
        avatar: "🎨",
        bars: [
            "I render standard models in high specular gloss / You're just a flat sprite, I'm the ultimate boss!",
            "Your vertex coordinates are completely askew / I'm bidding eighty notes, leaving zero for you!",
            "My camera perspective is a three-point view / You're looking retro low-res, nothing is new!",
            "I paint the horizon with a neon bright glow / Your wallet's run dry, time for you to go!"
        ]
    }
};

const userDisses = [
    "I'm the system operator, I control your CPU / I'll wipe your RAM and compile a diss on you!",
    "Your frequency is drifting, your oscillator is flat / My bids are sovereign, step back from that!",
    "You're running antiX but your kernel's out of date / I'm winning this auction, it's written in fate!",
    "I run on Gemini, my response is too quick / Outbidding you crew members, checkmate, that's the trick!"
];

let speechEnabled = false;

function speakRapLine(speaker, text) {
    if (!speechEnabled || !window.speechSynthesis) return;
    
    // Cancel any current speaking to keep sync
    window.speechSynthesis.cancel();
    
    const cleanText = text.replace(/['"“”]/g, '').replace(/[/]/g, ' '); // strip quotes and clean slashes
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Assign different speech parameters based on crew member/caller personality
    if (speaker === 'Night Fish') {
        utterance.pitch = 1.4;
        utterance.rate = 1.15;
    } else if (speaker === 'Corey') {
        utterance.pitch = 0.75;
        utterance.rate = 0.85;
    } else if (speaker === 'Conan') {
        utterance.pitch = 0.95;
        utterance.rate = 0.95;
    } else if (speaker === 'Misaki') {
        utterance.pitch = 1.25;
        utterance.rate = 1.05;
    } else if (speaker === 'TIMOTHY DWEN (YOU)') {
        utterance.pitch = 1.1;
        utterance.rate = 1.0;
    } else if (speaker === 'Gino') {
        utterance.pitch = 0.8;
        utterance.rate = 0.9;
    } else if (speaker === 'HOST TIM') {
        utterance.pitch = 1.0;
        utterance.rate = 1.05;
    } else if (speaker === 'Kawa Ranger') {
        utterance.pitch = 1.15;
        utterance.rate = 0.95;
    } else if (speaker === 'Sovereign Soul') {
        utterance.pitch = 0.9;
        utterance.rate = 1.0;
    }
    
    // Choose voice based on speaker gender/style if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        if (speaker === 'Night Fish' || speaker === 'Misaki' || speaker === 'Kawa Ranger') {
            const femaleVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google us english') || v.name.toLowerCase().includes('zira'));
            if (femaleVoice) utterance.voice = femaleVoice;
        } else {
            const maleVoice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('microsoft'));
            if (maleVoice) utterance.voice = maleVoice;
        }
    }
    
    window.speechSynthesis.speak(utterance);
}

window.toggleLiveVoice = function() {
    speechEnabled = !speechEnabled;
    const buttons = document.querySelectorAll('.voice-toggle-btn');
    buttons.forEach(btn => {
        if (speechEnabled) {
            btn.textContent = "🔊 VOICE ON";
            btn.style.borderColor = "var(--highlight)";
            btn.style.color = "var(--highlight)";
            btn.style.opacity = "1";
        } else {
            btn.textContent = "🔇 VOICE OFF";
            btn.style.borderColor = "rgba(255,255,255,0.1)";
            btn.style.color = "inherit";
            btn.style.opacity = "0.6";
        }
    });
    if (speechEnabled) {
        log("Speech synthesis voice over enabled.", "SUCCESS");
        // Speak a welcome message to confirm it works
        speakRapLine("SYSTEM", "Voice over activated.");
    } else {
        log("Voice over muted.", "INFO");
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
};

let liveArtworkIdx = 0;
let liveBid = 15;
let liveBidder = "Corey";
let liveTimer = 45;
let activeRappers = ["Night Fish", "Corey"];
let userDissIdx = 0;
let liveTimerInterval = null;
let liveRapInterval = null;

function setupLiveArena() {
    const art = auctionArtworks[liveArtworkIdx];
    liveBid = art.initialBid;
    liveTimer = 45;
    
    // Choose two random rappers
    const names = Object.keys(crewDisses);
    const r1 = names[Math.floor(Math.random() * names.length)];
    let r2 = names[Math.floor(Math.random() * names.length)];
    while (r1 === r2) {
        r2 = names[Math.floor(Math.random() * names.length)];
    }
    activeRappers = [r1, r2];
    liveBidder = r2; // Start with one bidding

    // Update UI
    document.getElementById('liveArtTitle').textContent = art.title.toUpperCase();
    document.getElementById('liveArtArtist').textContent = `BY ${art.artist.toUpperCase()}`;
    document.getElementById('liveArtImage').textContent = art.avatar;
    document.getElementById('liveArtBid').textContent = `${liveBid} HN`;
    document.getElementById('liveArtBidder').textContent = liveBidder.toUpperCase();

    document.getElementById('rapperLeftName').textContent = r1;
    document.getElementById('rapperLeftAvatar').textContent = crewDisses[r1].avatar;
    document.getElementById('rapperRightName').textContent = r2;
    document.getElementById('rapperRightAvatar').textContent = crewDisses[r2].avatar;

    const feed = document.getElementById('liveRapFeed');
    if (feed) {
        feed.innerHTML = `<div style="color: var(--accent); font-weight: bold;">[SYSTEM] Auction started: "${art.title}" (${art.desc}). Base bid is ${liveBid} HN. Battle on!</div>`;
    }
    
    document.getElementById('userLiveBalance').textContent = `${getVaultTotal()} HN`;
    
    if (liveTimerInterval) clearInterval(liveTimerInterval);
    if (liveRapInterval) clearInterval(liveRapInterval);

    liveTimerInterval = setInterval(tickLiveTimer, 1000);
    liveRapInterval = setInterval(tickLiveRap, 3800);
}

function tickLiveTimer() {
    liveTimer--;
    document.getElementById('auctionTimer').textContent = `${liveTimer}s`;
    
    const percentage = (liveTimer / 45) * 100;
    const bar = document.getElementById('auctionProgress');
    if (bar) {
        bar.style.width = `${percentage}%`;
    }

    // Update user balance UI display in live tab
    document.getElementById('userLiveBalance').textContent = `${getVaultTotal()} HN`;

    if (liveTimer <= 0) {
        clearInterval(liveTimerInterval);
        clearInterval(liveRapInterval);
        endAuction();
    }
}

function tickLiveRap() {
    // Randomly choose spitting rapper
    const speaking = activeRappers[Math.floor(Math.random() * activeRappers.length)];
    const disses = crewDisses[speaking].bars;
    const lyric = disses[Math.floor(Math.random() * disses.length)];
    
    // 40% chance the AI rapper bids higher
    const isBid = Math.random() < 0.40;
    if (isBid) {
        liveBid += Math.floor(Math.random() * 4) + 2;
        liveBidder = speaking;
        document.getElementById('liveArtBid').textContent = `${liveBid} HN`;
        document.getElementById('liveArtBidder').textContent = speaking.toUpperCase();
    }

    appendRapLine(speaking, lyric, isBid ? `(Bids ${liveBid} HN!)` : '');
}

function appendRapLine(speaker, text, suffix = '') {
    const feed = document.getElementById('liveRapFeed');
    if (!feed) return;
    
    const line = document.createElement('div');
    line.style.marginBottom = '6px';
    
    let color = 'var(--text)';
    let avatar = '🎙️';
    
    if (speaker === 'Night Fish') { color = 'var(--highlight)'; avatar = '🐠'; }
    else if (speaker === 'Corey') { color = 'var(--accent)'; avatar = '🎧'; }
    else if (speaker === 'Conan') { color = '#ffcc00'; avatar = '📡'; }
    else if (speaker === 'Misaki') { color = 'var(--alert)'; avatar = '🎨'; }
    else if (speaker === 'TIMOTHY DWEN (YOU)') { color = '#ffffff'; avatar = '🚀'; }
    
    const suffHtml = suffix ? ` <span style="color: var(--highlight); font-weight: bold;">${suffix}</span>` : '';
    line.innerHTML = `<span style="color: ${color}; font-weight: bold;">${avatar} [${speaker.toUpperCase()}]:</span> "${text}"${suffHtml}`;
    
    feed.appendChild(line);
    feed.scrollTop = feed.scrollHeight;

    // Speak the line if voice is enabled
    if (speaker !== 'SYSTEM') {
        speakRapLine(speaker, text);
    }
}

window.placeLiveBid = function() {
    const totalHN = getVaultTotal();
    const minRequiredBid = liveBid + 5;
    
    if (totalHN < minRequiredBid) {
        log(`Live Bid Failed: Insufficient Harmony Notes in vault (need ${minRequiredBid} HN).`, "WARN");
        appendRapLine("SYSTEM", "You do not have enough H-Notes in your vault to outbid!", "");
        return;
    }
    
    liveBid = minRequiredBid;
    liveBidder = "TIMOTHY DWEN (YOU)";
    
    document.getElementById('liveArtBid').textContent = `${liveBid} HN`;
    document.getElementById('liveArtBidder').textContent = "TIMOTHY DWEN (YOU)";
    
    appendRapLine("TIMOTHY DWEN (YOU)", "This piece is legendary, I'm locking down the zone!", `(Bids ${liveBid} HN!)`);
};

window.spitUserDiss = function() {
    const lyric = userDisses[userDissIdx % userDisses.length];
    userDissIdx++;
    
    // Automatically bids and spits a diss!
    window.placeLiveBid();
    
    // Speed up countdown slightly to add pressure
    liveTimer = Math.max(3, liveTimer - 3);
    document.getElementById('auctionTimer').textContent = `${liveTimer}s`;
    
    appendRapLine("TIMOTHY DWEN (YOU)", lyric, "");
};

function endAuction() {
    const art = auctionArtworks[liveArtworkIdx];
    const feed = document.getElementById('liveRapFeed');
    
    if (liveBidder === "TIMOTHY DWEN (YOU)") {
        if (deductVaultBalance(liveBid)) {
            // Add item to purchased inventory
            purchasedInventory.push(art.title);
            localStorage.setItem('d9_purchased_inventory', JSON.stringify(purchasedInventory));
            updateShopUI();
            
            if (feed) feed.innerHTML += `<div style="color: var(--highlight); font-weight: bold; margin-top: 10px;">🏆 [SYSTEM] SOLD! Timothy Dwen wins "${art.title}" for ${liveBid} HN! Art piece synced to Inventory.</div>`;
            log(`Won Live Auction: "${art.title}" for ${liveBid} HN!`, "SUCCESS");
        } else {
            if (feed) feed.innerHTML += `<div style="color: var(--alert); margin-top: 10px;">❌ [SYSTEM] Transaction failed: Insufficient HN at closure.</div>`;
        }
    } else {
        if (feed) feed.innerHTML += `<div style="color: var(--accent); margin-top: 10px;">🎭 [SYSTEM] SOLD! ${liveBidder} wins "${art.title}" for ${liveBid} HN!</div>`;
        log(`Auction ended: ${liveBidder} won "${art.title}" for ${liveBid} HN.`, "INFO");
    }
    
    // Transition to next artwork
    liveArtworkIdx = (liveArtworkIdx + 1) % auctionArtworks.length;
    
    setTimeout(setupLiveArena, 4000);
}
window.launchLocalRemixer = function(app) {
    log(`Initiating launch sequence for local editor: ${app}...`, "SYSTEM");
    
    const url = `/api/open-${app}`;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.message || 'Server error'); });
        }
        return response.json();
    })
    .then(data => {
        log(`${app.toUpperCase()} initialized successfully. Check your Linux desktop workspace!`, "SUCCESS");
        if (data.files && data.files.length > 0) {
            log(`Imported files: ${data.files.map(f => f.split('/').pop()).join(', ')}`, "INFO");
        }
    })
    .catch(error => {
        log(`Failed to launch ${app}: ${error.message}`, "ERROR");
    });
};

// --- COMMUNITY CHALLENGES ARENA LOGIC ---
let communityChallenges = [];

function loadChallenges() {
    const saved = localStorage.getItem('d9_community_challenges');
    if (saved) {
        communityChallenges = JSON.parse(saved);
    } else {
        communityChallenges = [
            {
                id: "CH-84920",
                challenger: "Auckland Octagon",
                opponent: "Wellington Harbor",
                project: "Upcycled Synth Case",
                term: "Upcycling & Repurpose",
                challengerPledge: 120,
                opponentPledge: 95,
                status: "active"
            },
            {
                id: "CH-39104",
                challenger: "Harakeke Weavers",
                opponent: "Kawa Germinators",
                project: "Resonance Poem Tapestry",
                term: "Practical & Word Sculptures",
                challengerPledge: 140,
                opponentPledge: 80,
                status: "active"
            }
        ];
        localStorage.setItem('d9_community_challenges', JSON.stringify(communityChallenges));
    }
    updateChallengesUI();
}

function saveChallenges() {
    localStorage.setItem('d9_community_challenges', JSON.stringify(communityChallenges));
    updateChallengesUI();
}

function updateChallengesUI() {
    const container = document.getElementById('challengesContainer');
    if (!container) return;
    container.innerHTML = '';
    
    if (communityChallenges.length === 0) {
        container.innerHTML = '<div style="opacity:0.5; font-family:\'Share Tech Mono\', monospace; font-size:0.75rem; text-align:center; padding: 20px;">No challenges active in the arena.</div>';
        return;
    }
    
    communityChallenges.forEach(ch => {
        const card = document.createElement('div');
        card.style.border = '1px solid rgba(255,255,255,0.06)';
        card.style.background = 'rgba(255,255,255,0.02)';
        card.style.borderRadius = '6px';
        card.style.padding = '10px 14px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '6px';
        card.style.fontFamily = "'Share Tech Mono', monospace";
        card.style.marginBottom = '6px';
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--highlight); font-weight:bold; font-size:0.65rem;">${ch.id} (${ch.term.toUpperCase()})</span>
                <span style="font-size:0.55rem; color:var(--accent); font-weight:bold; border: 1.5px solid var(--accent); border-radius: 4px; padding: 1px 4px;">ACTIVE CHALLENGE</span>
            </div>
            <div style="font-size:0.75rem; color:#fff; font-family:'Orbitron', sans-serif; font-weight:700; text-transform:uppercase;">
                ${ch.challenger} vs ${ch.opponent}
            </div>
            <div style="font-size:0.65rem; opacity:0.8;">
                GOAL: <span style="color:var(--text);">${ch.project}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.25); padding:6px; border-radius:4px; font-size:0.65rem; margin-top:2px;">
                <div>
                    <div>${ch.challenger}: <strong style="color:var(--highlight);">${ch.challengerPledge} HN</strong></div>
                    <button onclick="window.pledgeToChallenge('${ch.id}', 'challenger')" style="width:auto; padding:2px 6px; font-size:0.55rem; margin-top:4px; background:rgba(0,229,255,0.1); border-color:var(--highlight); color:var(--highlight); box-shadow:none;">PLEDGE +5 HN</button>
                </div>
                <div style="text-align:right;">
                    <div>${ch.opponent}: <strong style="color:var(--highlight);">${ch.opponentPledge} HN</strong></div>
                    <button onclick="window.pledgeToChallenge('${ch.id}', 'opponent')" style="width:auto; padding:2px 6px; font-size:0.55rem; margin-top:4px; background:rgba(0,229,255,0.1); border-color:var(--highlight); color:var(--highlight); box-shadow:none;">PLEDGE +5 HN</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

window.pledgeToChallenge = function(id, group) {
    const cost = 5;
    if (getVaultTotal() < cost) {
        log(`Pledge failed: Insufficient HN in vault.`, "WARN");
        return;
    }
    
    const ch = communityChallenges.find(c => c.id === id);
    if (!ch) return;
    
    if (deductVaultBalance(cost)) {
        if (group === 'challenger') {
            ch.challengerPledge += cost;
            log(`Pledged 5 HN to ${ch.challenger} for the "${ch.project}" project!`, "SUCCESS");
        } else {
            ch.opponentPledge += cost;
            log(`Pledged 5 HN to ${ch.opponent} for the "${ch.project}" project!`, "SUCCESS");
        }
        saveChallenges();
    }
};

window.issueCommunityChallenge = function() {
    const challenger = document.getElementById('challengeChallenger').value.trim() || 'Auckland Octagon';
    const opponent = document.getElementById('challengeOpponent').value.trim();
    const project = document.getElementById('challengeProject').value.trim();
    const term = document.getElementById('challengeTerm').value;
    const pledge = parseInt(document.getElementById('challengePledge').value);
    
    if (!opponent || !project) {
        log("Arena error: Target Group and Project Goal are required.", "WARN");
        return;
    }
    
    if (isNaN(pledge) || pledge <= 0) {
        log("Arena error: Pledge amount must be greater than 0.", "WARN");
        return;
    }
    
    if (getVaultTotal() < pledge) {
        log(`Arena error: Insufficient Harmony Notes to open the pledge fund (${pledge} HN required).`, "WARN");
        return;
    }
    
    if (deductVaultBalance(pledge)) {
        const newCh = {
            id: "CH-" + Math.floor(10000 + Math.random() * 90000),
            challenger: challenger,
            opponent: opponent,
            project: project,
            term: term,
            challengerPledge: pledge,
            opponentPledge: 0,
            status: "active"
        };
        
        communityChallenges.push(newCh);
        saveChallenges();
        log(`Posted new Arena challenge: ${challenger} vs ${opponent} for "${project}"! Pledged ${pledge} HN.`, "SUCCESS");
        
        // Clear fields
        document.getElementById('challengeOpponent').value = '';
        document.getElementById('challengeProject').value = '';
        document.getElementById('challengePledge').value = '10';
    }
};



// Ticker loop
function tick() {
    const drift = (window.parent && window.parent.timeDriftOffset) ? window.parent.timeDriftOffset : 0;
    const now = new Date(Date.now() + drift - (new Date().getTimezoneOffset() * 60000));
    const v = getDragonSync(now);
    const micro = Math.floor((performance.now() % 1000) * 1000).toString().padStart(6, '0');

    currentRoot = v.root;
    currentD9Time = v.isRelax ? "RELAX" : 
        `${String(v.h).padStart(2,'0')}:${String(v.m).padStart(2,'0')}:${String(v.s).padStart(2,'0')}`;

    dom.clockD9.innerText = currentD9Time;
    dom.clockMilli.innerText = `.${micro}`;
    dom.rootDisplay.innerText = `ROOT: ${v.root}`;

    requestAnimationFrame(tick);
}

// Start
loadVault();
updateShopUI();
updateWalletUI();
loadChallenges();
setupLiveArena();
tick();
log("Exchange Terminal Active. Listening on local port 8080.");
