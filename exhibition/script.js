import { getDragonSync } from '../scripts/math.js';
import * as THREE from '../three.module.min.js';

let feeds = [];
let channels = [];
let acquiredItems = [];
let currentRoot = 1;
let currentD9Time = "00:00:00";
let currentChannel = "all";
let viewMode = "theater"; // theater, grid, filmstrip, 3dflow

// Three.js 3D Infinity Flow variables
let scene3d, camera3d, renderer3d, cardsGroup;
let isThreeInitialized = false;
let animationFrameId = null;
let tOffset = -Math.PI / 2; // Default aligns first card to front
let targetTOffset = -Math.PI / 2;
let dragSpeed = 0;
let isDragging3d = false;
let startPointerX = 0;
let lastPointerX = 0;
let dragAccumulator = 0;
let cardMeshes = [];

const shopItems = [
    {
        id: "item-infiniti",
        title: "The Fluid Motion Poster",
        price: 40,
        img: "../assets/newinfiniti4.png",
        desc: "Premium canvas digital print of the custom Dragon 9 Infinity Resonance logo.",
        artist: "Timothy Dwen",
        payment: "fluidmotion.tv@gmail.com"
    },
    {
        id: "item-dolphin",
        title: "Matariki Dolphin Print",
        price: 100,
        img: "../assets/Dolphin-logo.jpg",
        desc: "Limited physical print of the sacred Dolphin logo representing oceanic fluid harmony.",
        artist: "Timothy Dwen",
        payment: "fluidmotion.tv@gmail.com"
    },
    {
        id: "item-whale",
        title: "Whale & Tim Conceptual Print",
        price: 150,
        img: "../assets/crew/tim/images/whale_tim_concept.jpg",
        desc: "Authentic conceptual art sketching the whale and Tim resonance pathways.",
        artist: "Timothy Dwen",
        payment: "fluidmotion.tv@gmail.com"
    },
    {
        id: "item-plant",
        title: "Evolutionary Sea-Dolphin Print",
        price: 200,
        img: "../assets/bridge/208 a early plant 208 e early dolphin look fish 395-345mill.jpeg",
        desc: "Earth timeline print showcasing early vascular plant growth and cetacean prototypes.",
        artist: "Timothy Dwen",
        payment: "fluidmotion.tv@gmail.com"
    },
    {
        id: "item-butterfly",
        title: "Orange Lovely Butterfly Sticker",
        price: 20,
        img: "../assets/shop/orange-lovely.png",
        desc: "Ginos NZ custom orange lovely butterfly vector sticker.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-bee",
        title: "Humble Bee Badge Stamp",
        price: 30,
        img: "../assets/shop/bee-humble-bee.png",
        desc: "Fluid motion humble Matariki bee badge stamp.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-seaslug",
        title: "Organic Pink Seaslug Icon",
        price: 50,
        img: "../assets/shop/pink-seaslug.png",
        desc: "Ginos custom organic pink seaslug creature avatar.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-blakruffie",
        title: "Black Ruffie Marine Badge",
        price: 35,
        img: "../assets/shop/blakruffie.png",
        desc: "Fluid motion marine signature badge representing black ruffie.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-blue-buttfly",
        title: "Blue Butterfly Sticker",
        price: 25,
        img: "../assets/shop/blue-buttfly-right.png",
        desc: "Ginos NZ custom blue butterfly right-facing sticker.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-kiwis",
        title: "Kiwis in the Middle Sticker",
        price: 45,
        img: "../assets/shop/kiwis-in-midle.png",
        desc: "Special fluid motion Kiwi birds centered badge.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-palm-left",
        title: "Left Palm Tree Sticker",
        price: 30,
        img: "../assets/shop/palmtree-left.png",
        desc: "Ginos tropical palm tree left sticker configuration.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-palm-right",
        title: "Right Palm Tree Sticker",
        price: 30,
        img: "../assets/shop/palmtree-right.png",
        desc: "Ginos tropical palm tree right sticker configuration.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-welcome",
        title: "Welcome Screen Blueprint",
        price: 80,
        img: "../assets/shop/homeand-welcome.png",
        desc: "4:3 retro menu layout welcome screen blueprint.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-network",
        title: "Network Grid Layout Blueprint",
        price: 90,
        img: "../assets/shop/networkhome1.png",
        desc: "Dynamic network node distribution layout map.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-shoppage",
        title: "Gift Shop Layout Blueprint",
        price: 95,
        img: "../assets/shop/shopPage1.png",
        desc: "Interactive shop interface layout mockup preview.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-stamp-blue",
        title: "Blue Stamp Badge",
        price: 15,
        img: "../assets/shop/bluestamp.png",
        desc: "Calibration badge in fluid blue hue.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-stamp-red",
        title: "Red Stamp Badge",
        price: 15,
        img: "../assets/shop/redstamp.png",
        desc: "Calibration badge in fluid red hue.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-stamp-white",
        title: "White Stamp Badge",
        price: 15,
        img: "../assets/shop/whitestamp.png",
        desc: "Calibration badge in neutral white hue.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    },
    {
        id: "item-stamp-yellow",
        title: "Yellow Stamp Badge",
        price: 15,
        img: "../assets/shop/yellowstamp.png",
        desc: "Calibration badge in fluid yellow hue.",
        artist: "Ginos NZ",
        payment: "ginos.nz@gmail.com"
    }
];

const dom = {
    clockD9: document.getElementById('clockD9'),
    clockMilli: document.getElementById('clockMilli'),
    rootDisplay: document.getElementById('rootDisplay'),
    reelsContainer: document.getElementById('reelsContainer'),
    channelTabs: document.getElementById('channelTabs'),
    theaterPlayerBox: document.getElementById('theaterPlayerBox'),
    theaterIframe: document.getElementById('theaterIframe'),
    theaterTitle: document.getElementById('theaterTitle'),
    theaterMeta: document.getElementById('theaterMeta'),
    shopContainer: document.getElementById('shopContainer'),
    shopVaultBalance: document.getElementById('shopVaultBalance'),
    acquiredCollectionContainer: document.getElementById('acquiredCollectionContainer'),
    uplinkUrl: document.getElementById('uplinkUrl'),
    uplinkType: document.getElementById('uplinkType'),
    uplinkTitle: document.getElementById('uplinkTitle'),
    uplinkChannel: document.getElementById('uplinkChannel'),
    logger: document.getElementById('logger'),
    
    // Modals
    addChannelModal: document.getElementById('addChannelModal'),
    newChannelName: document.getElementById('newChannelName'),
    newChannelDesc: document.getElementById('newChannelDesc'),
    
    receiptModal: document.getElementById('receiptModal'),
    receiptTxId: document.getElementById('receiptTxId'),
    receiptTimestamp: document.getElementById('receiptTimestamp'),
    receiptItemTitle: document.getElementById('receiptItemTitle'),
    receiptItemId: document.getElementById('receiptItemId'),
    receiptPrice: document.getElementById('receiptPrice'),
    receiptBalance: document.getElementById('receiptBalance'),
    
    hdViewerModal: document.getElementById('hdViewerModal'),
    hdViewerTitle: document.getElementById('hdViewerTitle'),
    hdViewerImg: document.getElementById('hdViewerImg'),
    hdViewerDesc: document.getElementById('hdViewerDesc'),
    hdViewerAssetId: document.getElementById('hdViewerAssetId'),
    hdViewerAcquireDate: document.getElementById('hdViewerAcquireDate')
};

function log(msg, type = 'SYSTEM') {
    const entry = document.createElement('div');
    entry.textContent = `[${type}] ${msg}`;
    dom.logger.prepend(entry);
}

// Extract Video ID and generate responsive embed URL
function getEmbedUrl(url, type) {
    if (type === 'youtube') {
        let videoId = '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            videoId = match[2];
        } else if (url.includes('shorts/')) {
            const parts = url.split('shorts/');
            if (parts.length > 1) {
                videoId = parts[1].split('?')[0].split('/')[0];
            }
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
    } else if (type === 'facebook') {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&t=0&autoplay=true`;
    }
    return url;
}

// Generate static poster/thumbnail matching modern dashboard aesthetic
function getThumbnailUrl(url, type) {
    if (type === 'youtube') {
        let videoId = '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            videoId = match[2];
        } else if (url.includes('shorts/')) {
            const parts = url.split('shorts/');
            if (parts.length > 1) {
                videoId = parts[1].split('?')[0].split('/')[0];
            }
        }
        return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '../assets/newinfiniti4.png';
    }
    // Return standard vector logos for Facebook to maintain professional offline design
    return '../assets/vuddfiniti2.png';
}

let artworkSales = {};

async function fetchArtworkSales() {
    try {
        const response = await fetch('/api/get-artwork-sales');
        if (response.ok) {
            const res = await response.json();
            artworkSales = res.sales || {};
        }
    } catch (err) {
        console.log("Offline mode: using local artwork sales counter.");
    }
    // Merge with localStorage local sales fallback
    const localSales = JSON.parse(localStorage.getItem('d9_local_artwork_sales') || '{}');
    for (let key in localSales) {
        artworkSales[key] = Math.max(artworkSales[key] || 0, localSales[key]);
    }
}

// Load databases from localStorage
async function loadDatabases() {
    await fetchArtworkSales();
    try {
        // 1. Load Channels
        const savedChannels = localStorage.getItem('exhibition-channels');
        if (savedChannels) {
            channels = JSON.parse(savedChannels);
        } else {
            channels = [
                { id: "all", name: "All Streams", desc: "All uplink frequencies" },
                { id: "youtube", name: "YouTube", desc: "YouTube alignments" },
                { id: "facebook", name: "Facebook Reels", desc: "FB short reels and streams" },
                { id: "ocean", name: "Ocean Resonance", desc: "Water and marine alignments" }
            ];
            localStorage.setItem('exhibition-channels', JSON.stringify(channels));
        }

        // 2. Load Feeds
        const savedFeeds = localStorage.getItem('exhibition-feeds');
        if (savedFeeds) {
            feeds = JSON.parse(savedFeeds);
        } else {
            feeds = [
                {
                    id: "feed-intro",
                    title: "The Time is Now - Exhibition Intro",
                    url: "https://youtu.be/Myu96B_x8os",
                    type: "youtube",
                    channel: "ocean",
                    d9Time: "13:00:00",
                    root: 9
                },
                {
                    id: "feed-fluid",
                    title: "Fluid Motion Logo Presentation Reel",
                    url: "https://www.facebook.com/reel/1029384729103",
                    type: "facebook",
                    channel: "facebook",
                    d9Time: "04:32:00",
                    root: 3
                }
            ];
            localStorage.setItem('exhibition-feeds', JSON.stringify(feeds));
        }

        // 3. Load Acquired library items
        const savedAcquired = localStorage.getItem('exhibition-acquired');
        if (savedAcquired) {
            acquiredItems = JSON.parse(savedAcquired);
        }
    } catch (e) {
        log("Database initialization error: " + e.message, "ERROR");
    }
    
    updateVaultUI();
    renderChannels();
    updateFeedUI();
    updateShopUI();
}

function updateVaultUI() {
    let balance = 0;
    try {
        const savedVault = localStorage.getItem('harmony-vault');
        if (savedVault) {
            const vault = JSON.parse(savedVault);
            balance = vault.reduce((sum, note) => sum + note.value, 0);
        }
    } catch (e) {
        console.error(e);
    }
    dom.shopVaultBalance.textContent = `BAL: ${balance} HN`;

    // Render Acquired Collection badges
    dom.acquiredCollectionContainer.innerHTML = '';
    if (acquiredItems.length === 0) {
        dom.acquiredCollectionContainer.textContent = 'NO ASSETS ACQUIRED YET';
        return;
    }
    acquiredItems.forEach(item => {
        const badge = document.createElement('span');
        badge.style.border = '1px solid var(--highlight)';
        badge.style.padding = '4px 8px';
        badge.style.borderRadius = '4px';
        badge.style.background = 'rgba(0, 229, 255, 0.05)';
        badge.style.cursor = 'pointer';
        badge.style.display = 'inline-flex';
        badge.style.alignItems = 'center';
        badge.style.gap = '4px';
        badge.innerHTML = `🎟️ ${item.title.toUpperCase()}`;
        badge.title = "Click to inspect high-definition digital asset";
        badge.onclick = () => window.openHdViewerModal(item.id);
        dom.acquiredCollectionContainer.appendChild(badge);
    });
}

// Render the channels tabs layout
function renderChannels() {
    dom.channelTabs.innerHTML = '';
    
    // Render Channel Selection Tabs
    channels.forEach(ch => {
        const tab = document.createElement('div');
        tab.className = `channel-tab ${currentChannel === ch.id ? 'active' : ''}`;
        
        let deleteBtnHtml = '';
        if (ch.id !== 'all' && ch.id !== 'youtube' && ch.id !== 'facebook' && ch.id !== 'ocean') {
            deleteBtnHtml = `<span style="margin-left: 6px; font-weight: bold; font-size: 0.75rem; opacity: 0.6; cursor: pointer;" onclick="event.stopPropagation(); window.deleteChannel('${ch.id}')">×</span>`;
        }
        
        tab.innerHTML = `<span>📁 ${ch.name}</span>${deleteBtnHtml}`;
        tab.onclick = () => {
            currentChannel = ch.id;
            renderChannels();
            updateFeedUI();
        };
        dom.channelTabs.appendChild(tab);
    });

    // Add channel creation button at the end
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add-channel';
    addBtn.textContent = '+ Add Channel';
    addBtn.onclick = window.openChannelModal;
    dom.channelTabs.appendChild(addBtn);

    // Update select dropdown inside uplink form
    dom.uplinkChannel.innerHTML = '';
    channels.forEach(ch => {
        if (ch.id === 'all') return;
        const opt = document.createElement('option');
        opt.value = ch.id;
        opt.textContent = ch.name.toUpperCase();
        dom.uplinkChannel.appendChild(opt);
    });
}

// Change video list layouts
window.setViewMode = function(mode) {
    viewMode = mode;
    
    // Update active button indicators
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (mode === 'theater') document.getElementById('btnViewTheater').classList.add('active');
    if (mode === 'grid') document.getElementById('btnViewGrid').classList.add('active');
    if (mode === 'filmstrip') document.getElementById('btnViewFilmstrip').classList.add('active');
    if (mode === '3dflow') document.getElementById('btnView3d').classList.add('active');

    updateFeedUI();
};

function selectVideo(feedId) {
    const feed = feeds.find(f => f.id === feedId);
    if (!feed) return;

    activeVideoId = feedId;
    dom.theaterIframe.src = getEmbedUrl(feed.url, feed.type);
    dom.theaterTitle.textContent = feed.title;
    dom.theaterMeta.textContent = `${feed.type.toUpperCase()} Stream | Sync D9: ${feed.d9Time} | Root Signature: ${feed.root}`;
    
    // Highlight currently playing card
    document.querySelectorAll('.video-card').forEach(card => {
        if (card.dataset.id === feedId) {
            card.classList.add('active-play');
        } else {
            card.classList.remove('active-play');
        }
    });

    log(`Selected stream alignment: '${feed.title}' (Root ${feed.root})`);
}

function updateFeedUI() {
    // Filter feeds by active channel
    const filteredFeeds = feeds.filter(f => currentChannel === 'all' || f.channel === currentChannel);

    if (viewMode === '3dflow') {
        dom.theaterPlayerBox.style.display = 'none';
        dom.reelsContainer.style.display = 'none';
        document.getElementById('canvas3dContainer').style.display = 'block';

        if (!isThreeInitialized) {
            initThree();
        }
        build3dTrain(filteredFeeds);
        
        if (!animationFrameId) {
            animate3d();
        }
        return;
    }

    // Stop 3D loops and hide container when in standard view modes
    document.getElementById('canvas3dContainer').style.display = 'none';
    dom.reelsContainer.style.display = 'flex';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    dom.reelsContainer.innerHTML = '';

    // Handle view modes display adjustments
    if (viewMode === 'theater') {
        dom.theaterPlayerBox.style.display = 'flex';
        dom.reelsContainer.className = 'reels-feed';
        
        if (filteredFeeds.length > 0) {
            const inFilter = filteredFeeds.some(f => f.id === activeVideoId);
            if (!activeVideoId || !inFilter) {
                selectVideo(filteredFeeds[0].id);
            }
        } else {
            dom.theaterIframe.src = '';
            dom.theaterTitle.textContent = 'No stream selected';
            dom.theaterMeta.textContent = 'Channel empty.';
        }
    } else {
        dom.theaterPlayerBox.style.display = 'none';
        if (viewMode === 'grid') {
            dom.reelsContainer.className = 'reels-feed layout-grid';
        } else if (viewMode === 'filmstrip') {
            dom.reelsContainer.className = 'reels-feed layout-filmstrip';
        }
    }

    if (filteredFeeds.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.gridColumn = 'span 2';
        emptyMsg.style.padding = '40px 10px';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.opacity = '0.6';
        emptyMsg.style.fontFamily = 'Share Tech Mono', 'monospace';
        emptyMsg.textContent = 'AWAITING RESONANCE STREAM PLACEMENT...';
        dom.reelsContainer.appendChild(emptyMsg);
        return;
    }

    filteredFeeds.forEach(feed => {
        if (viewMode === 'theater' && feed.id === activeVideoId) return;

        const thumb = getThumbnailUrl(feed.url, feed.type);
        const card = document.createElement('div');
        card.className = `video-card ${activeVideoId === feed.id ? 'active-play' : ''}`;
        card.dataset.id = feed.id;
        
        card.innerHTML = `
            <div class="video-wrapper">
                <img src="${thumb}" style="width: 100%; height: 100%; object-fit: cover;" alt="Preview" />
                <div class="video-overlay-play">
                    <div class="play-icon">▶</div>
                </div>
            </div>
            <div class="video-info">
                <span class="video-tag">
                    <span>${feed.type} stream</span>
                    <span style="color: var(--accent);">root: ${feed.root}</span>
                </span>
                <div class="video-title">${feed.title}</div>
            </div>
        `;
        
        card.onclick = () => {
            if (viewMode === 'theater') {
                selectVideo(feed.id);
            } else {
                setViewMode('theater');
                selectVideo(feed.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        dom.reelsContainer.appendChild(card);
    });
}

function updateShopUI() {
    dom.shopContainer.innerHTML = '';
    
    shopItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'shop-card';
        
        const isAcquired = acquiredItems.some(i => i.id === item.id);
        const btnHtml = isAcquired 
            ? `<button class="shop-card-btn acquired" onclick="window.openHdViewerModal('${item.id}')">VIEW HD PRINT</button>`
            : `<button class="shop-card-btn" onclick="window.acquireShopItem('${item.id}')">ACQUIRE</button>`;

        card.innerHTML = `
            <div class="shop-card-img-box">
                <img class="shop-card-img" src="${item.img}" alt="${item.title}" />
            </div>
            <div class="shop-card-title" title="${item.title}">${item.title}</div>
            <div style="font-size:0.65rem; opacity:0.75; height: 32px; overflow:hidden; line-height: 1.35;">${item.desc}</div>
            <div class="shop-card-footer">
                <span class="shop-card-price">${item.price} HN</span>
                ${btnHtml}
            </div>
        `;
        dom.shopContainer.appendChild(card);
    });
}

// ----------------------------------------------------
// THREE.JS 3D INFINITY FLOW CAROUSEL ENGINE (Lemniscate Track)
// ----------------------------------------------------

function getAccentHexColor() {
    const bodyClass = document.body.className;
    if (bodyClass.includes('theme-matrix')) return 0x00ff41;
    if (bodyClass.includes('theme-amber')) return 0xffaa00;
    if (bodyClass.includes('theme-cyber')) return 0x00e5ff;
    if (bodyClass.includes('theme-fluid')) return 0x00e5ff;
    return 0xd4af37; // Classic gold theme
}

// Create Canvas Texture loaded with cybernetic metadata to bypass CORS issues on direct thumbnails
function createCardTexture(item) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 288; // 16:9
    const ctx = canvas.getContext('2d');

    // Cyber background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#110a20');
    grad.addColorStop(1, '#020105');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glowing border outline
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

    // Tech brackets in corners
    ctx.fillStyle = '#00e5ff';
    const bLen = 25;
    ctx.fillRect(10, 10, bLen, 5); ctx.fillRect(10, 10, 5, bLen); // Top-left
    ctx.fillRect(canvas.width - 10 - bLen, 10, bLen, 5); ctx.fillRect(canvas.width - 15, 10, 5, bLen); // Top-right
    ctx.fillRect(10, canvas.height - 15, bLen, 5); ctx.fillRect(10, canvas.height - 10 - bLen, 5, bLen); // Bottom-left
    ctx.fillRect(canvas.width - 10 - bLen, canvas.height - 15, bLen, 5); ctx.fillRect(canvas.width - 15, canvas.height - 10 - bLen, 5, bLen); // Bottom-right

    // Title text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Orbitron", sans-serif';
    let titleText = item.title || "Resonance Stream";
    if (titleText.length > 25) titleText = titleText.substring(0, 23) + '...';
    ctx.fillText(titleText.toUpperCase(), 35, 75);

    // Platform and Type values
    ctx.fillStyle = '#ffaa00';
    ctx.font = '16px "Share Tech Mono", monospace';
    ctx.fillText(`CHANNEL: ${(item.channel || 'GENERAL').toUpperCase()}`, 35, 115);

    ctx.fillStyle = '#00ff41';
    ctx.font = '16px "Share Tech Mono", monospace';
    const typeStr = item.type ? item.type.toUpperCase() : (item.price ? `${item.price} HN` : "ITEM");
    ctx.fillText(`TYPE: ${typeStr}`, 35, 145);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '13px "Inter", sans-serif';
    ctx.fillText(`D9 SYNC: ${item.d9Time || 'ONLINE'} | ROOT: ${item.root || 9}`, 35, 195);
    
    ctx.fillStyle = 'rgba(0, 229, 255, 0.7)';
    ctx.font = '12px "Orbitron", sans-serif';
    ctx.fillText("▶ DOUBLE CLICK TO ACTIVATE", 35, 245);

    const texture = new THREE.CanvasTexture(canvas);
    
    // Draw local print image onto canvas if it is a local path
    if (item.img && !item.img.startsWith('http')) {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 290, 85, 185, 165);
            texture.needsUpdate = true;
        };
        img.src = item.img;
    }
    return texture;
}

// Visual layout of lemniscate track path
function createLemniscateTrack() {
    const points = [];
    const scale = 10;
    const count = 120;
    for (let i = 0; i < count; i++) {
        const t = (i / count) * 2 * Math.PI;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const x = (scale * Math.cos(t)) / denom;
        const z = (scale * Math.sin(t) * Math.cos(t)) / denom;
        const y = Math.sin(t * 2) * (scale / 5.5);
        points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Glow particles texture on the track
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = 16;
    dotCanvas.height = 16;
    const ctx = dotCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, '#00e5ff');
    grad.addColorStop(0.3, 'rgba(0, 229, 255, 0.8)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    
    const texture = new THREE.CanvasTexture(dotCanvas);
    const material = new THREE.PointsMaterial({
        size: 0.6,
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    return new THREE.Points(geometry, material);
}

// Drift particles in spatial background
function createBackgroundParticles() {
    const points = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
        points.push(new THREE.Vector3(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 25,
            (Math.random() - 0.5) * 40
        ));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 16;
    particleCanvas.height = 16;
    const ctx = particleCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    
    const texture = new THREE.CanvasTexture(particleCanvas);
    const material = new THREE.PointsMaterial({
        size: 0.3,
        map: texture,
        transparent: true,
        opacity: 0.45,
        depthWrite: false
    });
    
    return new THREE.Points(geometry, material);
}

function initThree() {
    const canvas = document.getElementById('flowCanvas');
    if (!canvas) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    scene3d = new THREE.Scene();

    camera3d = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera3d.position.set(0, 3.5, 17.5);
    camera3d.lookAt(0, 0, 0);

    renderer3d = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer3d.setSize(w, h, false);
    renderer3d.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    cardsGroup = new THREE.Group();
    scene3d.add(cardsGroup);

    // Glowing lemniscate wireframe particles
    const track = createLemniscateTrack();
    scene3d.add(track);

    // Cosmic dust back particles
    const particles = createBackgroundParticles();
    scene3d.add(particles);
    window.backgroundParticles = particles;

    // Direct and ambient glowing lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene3d.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.45);
    dirLight.position.set(0, 12, 12);
    scene3d.add(dirLight);

    // Drag, Swipe, Touch Event Listeners
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onPointerDown(e);
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        onPointerMove(e);
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        onPointerUp(e);
    }, { passive: false });

    // Handle Resize response
    window.addEventListener('resize', () => {
        if (renderer3d && camera3d && isThreeInitialized) {
            const canvasEl = document.getElementById('flowCanvas');
            if (canvasEl) {
                const width = canvasEl.clientWidth;
                const height = canvasEl.clientHeight;
                renderer3d.setSize(width, height, false);
                camera3d.aspect = width / height;
                camera3d.updateProjectionMatrix();
            }
        }
    });

    isThreeInitialized = true;
    log("Three.js 3D Infinity Flow Engine initialized.");
}

function build3dTrain(items) {
    // Reset meshes group
    while (cardsGroup.children.length > 0) {
        const child = cardsGroup.children[0];
        cardsGroup.remove(child);
        child.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
    }
    cardMeshes = [];

    // Fallback if no streams exist in the channel
    const displayItems = items.length > 0 ? items : [
        {
            id: "empty-msg",
            title: "Awaiting Resonance Uplinks",
            channel: "EMPTY",
            type: "INFO",
            d9Time: "00:00:00"
        }
    ];

    displayItems.forEach((item, index) => {
        const cardTexture = createCardTexture(item);
        
        // Card mesh face
        const cardGeo = new THREE.PlaneGeometry(4.8, 2.7);
        const cardMat = new THREE.MeshBasicMaterial({
            map: cardTexture,
            side: THREE.DoubleSide,
            transparent: true
        });
        const cardMesh = new THREE.Mesh(cardGeo, cardMat);
        
        // Slightly larger outline border
        const borderGeo = new THREE.PlaneGeometry(4.95, 2.85);
        const accentColor = getAccentHexColor();
        const borderMat = new THREE.MeshBasicMaterial({
            color: accentColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const borderMesh = new THREE.Mesh(borderGeo, borderMat);
        borderMesh.position.z = -0.015;

        // Group cards components
        const cardGroup = new THREE.Group();
        cardGroup.add(cardMesh);
        cardGroup.add(borderMesh);
        cardGroup.userData = { id: item.id, item: item, index: index };
        
        cardsGroup.add(cardGroup);
        cardMeshes.push(cardGroup);
    });

    // Reset offsets to starting point
    tOffset = -Math.PI / 2;
    targetTOffset = tOffset;
}

// Drag swiper handlers
function onPointerDown(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    isDragging3d = true;
    startPointerX = clientX;
    lastPointerX = clientX;
    dragSpeed = 0;
    dragAccumulator = 0;
    
    const canvas = document.getElementById('flowCanvas');
    if (canvas) canvas.style.cursor = 'grabbing';
}

function onPointerMove(e) {
    if (!isDragging3d) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const dx = clientX - lastPointerX;
    
    dragAccumulator += Math.abs(clientX - lastPointerX);
    
    dragSpeed = dx * 0.007; // rotational drag speed scaling
    tOffset += dragSpeed;
    targetTOffset = tOffset;
    lastPointerX = clientX;
}

function onPointerUp(e) {
    if (!isDragging3d) return;
    isDragging3d = false;
    const canvas = document.getElementById('flowCanvas');
    if (canvas) canvas.style.cursor = 'grab';
    
    // If movement displacement was tiny, trigger click raycasting select
    if (dragAccumulator < 5) {
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        handleCanvasClick(clientX, clientY);
    }
}

function handleCanvasClick(clientX, clientY) {
    const canvas = document.getElementById('flowCanvas');
    if (!canvas || !renderer3d) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera3d);

    const intersects = raycaster.intersectObjects(cardsGroup.children, true);

    if (intersects.length > 0) {
        let parent = intersects[0].object;
        while (parent && !parent.userData.id) {
            parent = parent.parent;
        }

        if (parent && parent.userData) {
            const data = parent.userData;
            const N = cardMeshes.length;
            
            const closestMesh = getClosestCardToCamera();
            if (closestMesh && closestMesh.userData.id === data.id) {
                // Clicking active front card triggers direct launch/acquire
                triggerCardAction(data.item);
            } else {
                // Clicking off-center card spins it to the front focal area
                spinCardToFront(data.index, N);
            }
        }
    }
}

function getClosestCardToCamera() {
    let minDistance = Infinity;
    let closest = null;
    cardMeshes.forEach(mesh => {
        const dist = mesh.position.distanceTo(camera3d.position);
        if (dist < minDistance) {
            minDistance = dist;
            closest = mesh;
        }
    });
    return closest;
}

function spinCardToFront(index, N) {
    // Aligns parameters t = (index/N)*2PI + tOffset to front spot (-Math.PI/2)
    let target = -Math.PI / 2 - (index / N) * 2 * Math.PI;
    
    // Select shortest rotation path using modulos
    const diff = target - tOffset;
    const turns = Math.round(diff / (2 * Math.PI));
    targetTOffset = target - (turns * 2 * Math.PI);
}

function triggerCardAction(item) {
    if (item.id === 'empty-msg') return;
    if (item.url) {
        log(`Activating selected stream: '${item.title}'`, "SUCCESS");
        setViewMode('theater');
        selectVideo(item.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (item.price) {
        window.acquireShopItem(item.id);
    }
}

function animate3d() {
    if (viewMode !== '3dflow') return;

    animationFrameId = requestAnimationFrame(animate3d);

    // Apply smooth slide rotation dampings
    if (isDragging3d) {
        dragSpeed *= 0.92;
    } else {
        // Linear interpolation slides toward target alignment
        tOffset += (targetTOffset - tOffset) * 0.085;
    }

    const scale = 9.8;
    const N = cardMeshes.length;
    
    if (N > 0) {
        cardMeshes.forEach((mesh, index) => {
            const t = ((index / N) * 2 * Math.PI) + tOffset;
            
            // X-Z horizontal figure-8 lemniscate formulas
            const denom = 1 + Math.sin(t) * Math.sin(t);
            const x = (scale * Math.cos(t)) / denom;
            const z = (scale * Math.sin(t) * Math.cos(t)) / denom;
            const y = Math.sin(t * 2) * (scale / 5.2);
            
            mesh.position.set(x, y, z);
            mesh.lookAt(camera3d.position);

            // Distance scaling for magnification closer to focal center front
            const dist = mesh.position.distanceTo(camera3d.position);
            const maxDist = 24;
            const minDist = 8;
            let scaleFactor = 1;
            if (dist < maxDist) {
                scaleFactor = 1.35 - 0.35 * ((dist - minDist) / (maxDist - minDist));
                scaleFactor = Math.max(1, Math.min(1.4, scaleFactor));
            }
            mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        });

        // Update the HUD overlay based on the current front focal item
        const activeCard = getClosestCardToCamera();
        if (activeCard && activeCard.userData && activeCard.userData.item) {
            const item = activeCard.userData.item;
            document.getElementById('flowActiveTitle').textContent = item.title;
            const typeStr = item.type ? `${item.type.toUpperCase()} STREAM` : (item.price ? `${item.price} HN PRINT` : "ASSET");
            document.getElementById('flowActiveMeta').textContent = `FOCAL FRONT | ${typeStr} | CHANNEL: ${(item.channel || 'GENERAL').toUpperCase()} | D9 SYNC: ${item.d9Time || 'ONLINE'}`;
        }
    }

    // Slowly rotate background particle space
    if (window.backgroundParticles) {
        window.backgroundParticles.rotation.y += 0.0008;
    }

    renderer3d.render(scene3d, camera3d);
}

// ----------------------------------------------------
// GENERAL APP CONTROLS
// ----------------------------------------------------

// Create custom channel
window.openChannelModal = function() {
    dom.addChannelModal.classList.add('open');
};
window.closeChannelModal = function() {
    dom.addChannelModal.classList.remove('open');
};
window.createChannel = function() {
    const name = dom.newChannelName.value.trim();
    const desc = dom.newChannelDesc.value.trim() || "Custom resonance channel";
    
    if (!name) {
        log("Channel name is required.", "WARN");
        alert("Please enter a channel name.");
        return;
    }

    const chId = "ch-" + Math.floor(1000 + Math.random() * 9000);
    const newCh = { id: chId, name, desc };
    
    channels.push(newCh);
    localStorage.setItem('exhibition-channels', JSON.stringify(channels));
    
    dom.newChannelName.value = '';
    dom.newChannelDesc.value = '';
    window.closeChannelModal();
    
    log(`Initialized new stream channel: '${name}'`, "SUCCESS");
    
    currentChannel = chId;
    renderChannels();
    updateFeedUI();
};

window.deleteChannel = function(chId) {
    if (confirm("Are you sure you want to delete this custom channel? Streams inside will be archived.")) {
        feeds.forEach(f => {
            if (f.channel === chId) {
                f.channel = 'ocean'; // Fallback channel
            }
        });
        localStorage.setItem('exhibition-feeds', JSON.stringify(feeds));

        channels = channels.filter(ch => ch.id !== chId);
        localStorage.setItem('exhibition-channels', JSON.stringify(channels));
        
        if (currentChannel === chId) {
            currentChannel = 'all';
        }
        
        log(`Archived channel: '${chId}'`, "SYSTEM");
        renderChannels();
        updateFeedUI();
    }
};

// Uplink new video feed
window.uplinkMedia = function() {
    const url = dom.uplinkUrl.value.trim();
    const type = dom.uplinkType.value;
    const title = dom.uplinkTitle.value.trim() || "Untitled Exhibition Media";
    const ch = dom.uplinkChannel.value;

    if (!url) {
        log("Media URL cannot be empty.", "WARN");
        alert("Please enter a media stream URL.");
        return;
    }

    const newFeed = {
        id: "feed-" + Math.floor(100000 + Math.random() * 900000),
        title: title,
        url: url,
        type: type,
        channel: ch,
        d9Time: currentD9Time,
        root: currentRoot
    };

    feeds.push(newFeed);
    localStorage.setItem('exhibition-feeds', JSON.stringify(feeds));
    
    dom.uplinkUrl.value = '';
    dom.uplinkTitle.value = '';
    
    log(`Uplink successful: stream '${title}' routed to channel [${ch}].`, "SUCCESS");
    
    currentChannel = ch;
    renderChannels();
    setViewMode('theater');
    selectVideo(newFeed.id);
};

// Shop purchase acquisitions
window.acquireShopItem = function(id) {
    const item = shopItems.find(i => i.id === id);
    if (!item) return;

    let vaultLedger = [];
    try {
        const savedVault = localStorage.getItem('harmony-vault');
        if (savedVault) vaultLedger = JSON.parse(savedVault);
    } catch(e) {}
    const balance = vaultLedger.reduce((sum, note) => sum + note.value, 0);

    const salesCount = artworkSales[item.id] || 0;
    const hasFee = salesCount >= 54;
    const platformCut = hasFee ? item.price * 0.01 : 0;
    const artistCut = hasFee ? item.price * 0.99 : item.price;

    // Populate dynamic split details in checkout modal
    document.getElementById('art-split-item-name').innerText = item.title;
    document.getElementById('art-split-item-artist').innerText = item.artist || 'Timothy Dwen';
    document.getElementById('art-split-item-price').innerText = `${item.price} HN / $${item.price.toFixed(2)} USD`;

    const labelArtist = hasFee ? "99% Direct Payout to Artist" : "100% Direct Payout to Artist (Intro Wave)";
    const labelPlatform = hasFee ? "1% Co-op Commission" : "0% Co-op Commission (Waived for first 54 sales!)";
    
    document.getElementById('art-label-artist-split').innerText = labelArtist;
    document.getElementById('art-label-platform-split').innerText = labelPlatform;

    if (hasFee) {
        document.getElementById('art-split-artist-amount').innerText = `${artistCut.toFixed(1)} HN / $${artistCut.toFixed(2)} USD`;
        document.getElementById('art-split-platform-amount').innerText = `${platformCut.toFixed(1)} HN / $${platformCut.toFixed(2)} USD`;
        document.getElementById('art-split-checkout-note').innerText = "By completing this purchase, you support off-grid local nodes directly while routing 1% to the platform node framework.";
    } else {
        document.getElementById('art-split-artist-amount').innerText = `${artistCut.toFixed(1)} HN / $${artistCut.toFixed(2)} USD`;
        document.getElementById('art-split-platform-amount').innerText = "0.0 HN / $0.00 USD";
        document.getElementById('art-split-checkout-note').innerText = `By completing this purchase, 100% goes directly to the artist. The 1% platform commission is waived (Artwork sales: ${salesCount}/54).`;
    }

    // Attach event listeners for H-Notes and PayPal payment options
    const payHNotesBtn = document.getElementById('art-btn-pay-hnotes');
    const payPaypalBtn = document.getElementById('art-btn-pay-paypal');

    payHNotesBtn.onclick = () => {
        if (balance < item.price) {
            log(`Vault alert: insufficient resonance balance for '${item.title}' (Requires ${item.price} HN).`, "WARN");
            alert(`Insufficient Balance!\nYour balance: ${balance} HN\nRequired: ${item.price} HN\n\nPlease navigate to the EXCHANGE terminal in the top header and mint or scan QR notes to increase balance.`);
            return;
        }

        executeAcquisition('HNOTES', item, balance, vaultLedger, artistCut, platformCut, hasFee, salesCount);
    };

    payPaypalBtn.onclick = () => {
        executeAcquisition('PAYPAL', item, balance, vaultLedger, artistCut, platformCut, hasFee, salesCount);
    };

    const modal = document.getElementById('art-checkout-split-modal');
    if (modal) modal.style.display = 'flex';
};

function executeAcquisition(method, item, balance, vaultLedger, artistCut, platformCut, hasFee, salesCount) {
    // Record sale counter to server
    fetch('/api/record-artwork-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id })
    }).then(async res => {
        if (res.ok) {
            const data = await res.json();
            artworkSales[item.id] = data.sales_count;
            console.log(`Artwork sale recorded on server. Current sales count: ${data.sales_count}`);
        }
    }).catch(() => {
        console.log("Recorded artwork sale offline.");
    });

    // Offline local update fallback
    const localSales = JSON.parse(localStorage.getItem('d9_local_artwork_sales') || '{}');
    localSales[item.id] = (localSales[item.id] || 0) + 1;
    localStorage.setItem('d9_local_artwork_sales', JSON.stringify(localSales));
    artworkSales[item.id] = Math.max(artworkSales[item.id] || 0, localSales[item.id]);

    const dateAcquired = new Date().toLocaleString();
    const txId = 'HN-' + Math.floor(100000 + Math.random() * 900000);

    if (method === 'HNOTES') {
        const debitNote = {
            id: txId,
            value: -item.price,
            creator: 'Resonance Shop',
            keyphrase: `DEBIT-ACQUISITION: ${item.id}`,
            mintDate: new Date().toISOString(),
            rootVal: currentRoot,
            d9Time: currentD9Time
        };

        vaultLedger.push(debitNote);
        localStorage.setItem('harmony-vault', JSON.stringify(vaultLedger));

        if (hasFee) {
            alert(`💳 Double-Entry Ledger Transaction:\n\nRouted ${artistCut.toFixed(1)} H-Notes to artist wallet address: ${item.payment || 'D9_LOVE'}.\nRouted ${platformCut.toFixed(1)} H-Notes (1% Co-op fee) to Dragon 9 Co-op.`);
        } else {
            alert(`💳 Double-Entry Ledger Transaction (Intro Wave):\n\nRouted ${artistCut.toFixed(1)} H-Notes (100% payout) to artist wallet address: ${item.payment || 'D9_LOVE'}.\n0% platform commission applied (Artwork sales: ${salesCount}/54).`);
        }

        const acquiredMeta = {
            ...item,
            txId: txId,
            dateAcquired: dateAcquired
        };
        acquiredItems.push(acquiredMeta);
        localStorage.setItem('exhibition-acquired', JSON.stringify(acquiredItems));

        updateVaultUI();
        updateShopUI();
        
        log(`Acquisition node success: '${item.title}' acquired! Deducted ${item.price} HN.`, "SUCCESS");

        const newBal = balance - item.price;
        window.openReceiptModal(txId, debitNote.mintDate, item.title, item.id, item.price, newBal);
    } else {
        // PayPal checkout split or waived commission
        const artistEmail = item.payment || 'fluidmotion.tv@gmail.com';
        const paypalArtist = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(artistEmail)}&item_name=Artwork+Purchase+for+${encodeURIComponent(item.title)}&amount=${artistCut.toFixed(2)}&currency_code=USD`;

        if (hasFee) {
            const paypalCoop = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=fluidmotion.tv%40gmail.com&item_name=Artwork+Coop+Commission+for+${encodeURIComponent(item.title)}&amount=${platformCut.toFixed(2)}&currency_code=USD`;

            alert(`🔗 Open PayPal Checkout Split:\n\nFirst transaction: $${artistCut.toFixed(2)} USD goes to the artist (${item.artist || 'Timothy Dwen'}).\nSecond transaction: $${platformCut.toFixed(2)} USD (1% platform fee) supports Dragon 9 maintenance.\n\nPress OK to open the artist transaction.`);
            window.open(paypalArtist, '_blank');
            setTimeout(() => {
                window.open(paypalCoop, '_blank');
            }, 1000);
        } else {
            alert(`🔗 Open PayPal Checkout (Intro Wave):\n\n100% of payment ($${artistCut.toFixed(2)} USD) goes directly to the artist. Platform fee is waived.\n\nPress OK to proceed to PayPal.`);
            window.open(paypalArtist, '_blank');
        }

        const acquiredMeta = {
            ...item,
            txId: 'PP-' + Math.floor(100000 + Math.random() * 900000),
            dateAcquired: dateAcquired
        };
        acquiredItems.push(acquiredMeta);
        localStorage.setItem('exhibition-acquired', JSON.stringify(acquiredItems));

        updateVaultUI();
        updateShopUI();

        log(`USD Acquisition logged: '${item.title}' acquired! direct support to ${item.artist || 'Timothy Dwen'}.`, "SUCCESS");
        
        setTimeout(() => {
            window.openHdViewerModal(item.id);
        }, 1500);
    }

    closeArtCheckoutSplitModal();
}

// Receipt Modal Controls
window.openReceiptModal = function(txId, timestamp, itemTitle, itemId, price, balance) {
    dom.receiptTxId.textContent = txId;
    dom.receiptTimestamp.textContent = new Date(timestamp).toLocaleString();
    dom.receiptItemTitle.textContent = itemTitle;
    dom.receiptItemId.textContent = itemId;
    dom.receiptPrice.textContent = `-${price} HN`;
    dom.receiptBalance.textContent = `${balance} HN`;
    dom.receiptModal.classList.add('open');
};
window.closeReceiptModal = function() {
    dom.receiptModal.classList.remove('open');
};

// HD Print Modal Controls
window.openHdViewerModal = function(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    const meta = acquiredItems.find(i => i.id === itemId);
    if (!item) return;

    dom.hdViewerTitle.textContent = `SECURED ARCHIVE: ${item.title.toUpperCase()}`;
    dom.hdViewerImg.src = item.img;
    dom.hdViewerDesc.textContent = item.desc;
    
    if (meta) {
        dom.hdViewerAssetId.textContent = `ACQUISITION ID: ${meta.txId || 'N/A'}`;
        dom.hdViewerAcquireDate.textContent = `ACQUIRED: ${meta.dateAcquired || 'N/A'}`;
    } else {
        dom.hdViewerAssetId.textContent = 'PREVIEW SYSTEM DEMO';
        dom.hdViewerAcquireDate.textContent = 'NOT IN LOCAL LEDGER';
    }

    dom.hdViewerModal.classList.add('open');
    log(`Inspected print file: ${item.title}`);
};
window.closeHdViewerModal = function() {
    dom.hdViewerModal.classList.remove('open');
};

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

// Initialize on page load
(async () => {
    await loadDatabases();
    tick();
    log("Exhibition and shop systems synchronized with local ledger. Awaiting frequency signals...");
})();
