/**
 * Dragon 9 | Night Fish AI Assistant Crew Member
 * Animates flow-style multi-language text, rising glossy bubbles ("bibbles"),
 * and interactive holographic projections.
 */

import { Spawner } from './spawner.js';
import { AssetLibrary } from './asset_library.js';

// Multi-language text strings representing key project terminology
const FLOW_PHRASES = [
    { text: "RESONANCE CORE", lang: "EN" },
    { text: "FLUID MOTION TV", lang: "EN" },
    { text: "SOVEREIGN AI CREW", lang: "EN" },
    { text: "NIGHT FISH", lang: "EN" },
    { text: "KORE PŪMAU AKE", lang: "MA" }, // Māori: Ultimate resonance / static core
    { text: "TE RERENGA NGARU", lang: "MA" }, // Māori: Fluid movement / wave flow
    { text: "TE IKA O TE PŌ", lang: "MA" },   // Māori: Night Fish / Fish of the night
    { text: "共鳴コア活性化", lang: "JA" },     // Japanese: Resonance core activation
    { text: "流動運動テレビ", lang: "JA" },     // Japanese: Fluid Motion TV
    { text: "深夜の魚 (ナイトフィッシュ)", lang: "JA" }, // Japanese: Night Fish
    { text: "主権宇宙", lang: "JA" },          // Japanese: Sovereign Space
    { text: "NÚCLEO DE RESONANCIA", lang: "ES" },
    { text: "MOVIMIENTO FLUIDO", lang: "ES" },
    { text: "PEZ NOCTURNO", lang: "ES" },
    { text: "NOYAU DE RÉSONANCE", lang: "FR" },
    { text: "MOUVEMENT FLUIDE", lang: "FR" },
    { text: "POISSON DE NUIT", lang: "FR" },
    { text: "RESONANZKERN AKTIV", lang: "DE" },
    { text: "FLÜSSIGE BEWEGUNG", lang: "DE" },
    { text: "NACHTFISCH", lang: "DE" },
    { text: "共鸣核心激活", lang: "ZH" },
    { text: "流体运动电视", lang: "ZH" },
    { text: "夜鱼助手", lang: "ZH" }
];

// Interactive response console phrases for the assistant
const COGNITION_DATA = [
    {
        EN: "Hey bro, let's swim through here together... I brought my skills to help you out.",
        MA: "E hoa, kaukau tahi tāua i konei... Kua kōkiri mai aku pūkenga hei āwhina i a koe.",
        JA: "なあ、一緒に泳いでみないか？君をサポートするために、俺のスキルを持ってきたんだ。",
        FR: "Salut frère, nageons ensemble ici... J'ai apporté mes compétences pour t'aider.",
        ES: "Hola hermano, nademos juntos por aquí... Traje mis habilidades para ayudarte."
    },
    {
        EN: "Aligning frequency registers to 43.2 Hz resonance.",
        MA: "E whakatika ana i te rōpū whakawhiti ki te 43.2 Hz.",
        JA: "周波数レジスタを43.2Hzの共鳴に調整中。",
        FR: "Alignement des registres de fréquence sur la résonance de 43.2 Hz.",
        ES: "Alineando registros de frecuencia a la resonancia de 43.2 Hz."
    },
    {
        EN: "Auto-sorter module is online. Drop files matching crew keywords.",
        MA: "Kua tau te kōnae auto-sorter. Tāpirihia ngā kōnae e hāngai ana.",
        JA: "自動ソーターモジュールがオンラインです。クルーのキーワードに一致するファイルをドロップしてください。",
        FR: "Le module d'auto-tri est en ligne. Déposez les fichiers correspondant aux mots-clés de l'équipage.",
        ES: "El módulo auto-clasificador está en línea. Suelte archivos que coincidan con palabras clave del equipo."
    },
    {
        EN: "Fluid Motion TV broadcast vectors are clear and stable.",
        MA: "E tau ana te tuku a Fluid Motion TV. He pumau tonu.",
        JA: "流動運動テレビ（Fluid Motion TV）の放送ベクトルはクリアで安定しています。",
        FR: "Les vecteurs de diffusion de Fluid Motion TV sont clairs et stables.",
        ES: "Los vectores de transmisión de Fluid Motion TV están claros y estables."
    },
    {
        EN: "GitHub clock sync active. Offset drift is calibrated in real-time.",
        MA: "Kua tau te hononga o GitHub. Kua rite te wā mō te ruruku.",
        JA: "GitHubクロック同期がアクティブです。オフセットドリフトはリアルタイムで調整されています。",
        FR: "Synchronisation de l'horloge GitHub active. La dérive d'offset est calibrée en temps réel.",
        ES: "Sincronización de reloj GitHub activa. La deriva de compensación está calibrada en tiempo real."
    }
];

// Active State Configuration
const config = {
    bubbleDensity: 35,
    maxBubbles: 80,
    flowSpeed: 1.0, // Multiplier for text motion
    activeLang: 'EN', // EN, MA, JA, FR, ES
    textDensity: 8,
    flowMode: 'wave', // 'wave', 'linear', 'float'
    holoActive: false
};

const bubbles = [];
const texts = [];
const sparks = []; // Particles emitted on bubble pop

let mouse = { x: -1000, y: -1000, active: false };
let canvas, ctx;
let messageIndex = 0;
let typingTimeout = null;
let activeThemeColor = '#d4af37';
let activeThemeGlow = 'rgba(212, 175, 55, 0.3)';

class SplashSpark {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.radius = Math.random() * 2 + 1;
        this.alpha = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
    }
    draw(c) {
        c.save();
        c.globalAlpha = this.alpha;
        c.fillStyle = this.color;
        c.shadowBlur = 4;
        c.shadowColor = this.color;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
        c.restore();
    }
}

class Bubble {
    constructor(isBurst = false, startX, startY) {
        this.reset(isBurst, startX, startY);
    }

    reset(isBurst = false, startX, startY) {
        this.radius = Math.random() * 16 + 6;
        this.x = isBurst ? startX : Math.random() * window.innerWidth;
        this.y = isBurst ? startY : window.innerHeight + this.radius + (Math.random() * 100);
        
        // Custom velocities
        const speedFactor = Math.random() * 1.2 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = -speedFactor;
        
        if (isBurst) {
            // Explode outwards
            const angle = Math.random() * Math.PI * 2;
            const force = Math.random() * 4 + 2;
            this.vx = Math.cos(angle) * force;
            this.vy = Math.sin(angle) * force - 0.5; // slight upward bias
        }

        this.wobbleSpeed = Math.random() * 0.04 + 0.01;
        this.wobblePhase = Math.random() * Math.PI * 2;
        this.wobbleAmp = Math.random() * 3 + 1;
        
        this.popped = false;
        this.popProgress = 0;
        this.opacity = Math.random() * 0.25 + 0.15;
    }

    pop() {
        this.popped = true;
        this.popProgress = 0.01;
        
        // Spawn splash sparks
        for (let i = 0; i < 8; i++) {
            sparks.push(new SplashSpark(this.x, this.y, activeThemeColor));
        }
    }

    update() {
        if (this.popped) {
            this.popProgress += 0.08;
            if (this.popProgress >= 1.0) {
                // Remove or recycle bubble
                this.reset();
            }
            return;
        }

        // Wobble oscillation
        this.wobblePhase += this.wobbleSpeed;
        const drift = Math.sin(this.wobblePhase) * this.wobbleAmp * 0.05;
        
        // Repulsion from mouse cursor
        if (mouse.active) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 120) {
                const force = (120 - dist) / 120;
                // Add push force
                this.vx += (dx / dist) * force * 0.6;
                this.vy += (dy / dist) * force * 0.6;
            }
        }

        // Apply velocities
        this.x += this.vx + drift;
        this.y += this.vy;

        // Friction to stabilize horizontal repulsion push
        this.vx *= 0.96;
        // Keep upward velocity within bounds
        if (this.vy < -3.5) this.vy += 0.1;
        if (this.vy > -0.3) this.vy -= 0.05;

        // Bound checks & recycle if floats past top or sides
        if (this.y < -this.radius || this.x < -this.radius || this.x > window.innerWidth + this.radius) {
            this.reset();
        }
    }

    draw(c) {
        if (this.popped) {
            // Draw expansion pop ring
            c.save();
            c.strokeStyle = activeThemeColor;
            c.globalAlpha = 1.0 - this.popProgress;
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(this.x, this.y, this.radius * (1 + this.popProgress * 1.6), 0, Math.PI * 2);
            c.stroke();
            c.restore();
            return;
        }

        c.save();
        c.globalAlpha = this.opacity;
        
        // Glossy radial gradient representation
        const grad = c.createRadialGradient(
            this.x - this.radius * 0.3, 
            this.y - this.radius * 0.3, 
            this.radius * 0.05,
            this.x, 
            this.y, 
            this.radius
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(0.75, activeThemeGlow);
        grad.addColorStop(1, activeThemeColor);

        c.fillStyle = grad;
        c.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        c.lineWidth = 0.5;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // Shiny reflections
        c.fillStyle = 'rgba(255, 255, 255, 0.65)';
        c.beginPath();
        c.ellipse(
            this.x - this.radius * 0.4, 
            this.y - this.radius * 0.4, 
            this.radius * 0.2, 
            this.radius * 0.1, 
            -Math.PI / 4, 
            0, 
            Math.PI * 2
        );
        c.fill();

        c.restore();
    }
}

class FlowText {
    constructor() {
        this.reset();
        // Stagger spawn x coordinate initially to fill the screen
        this.x = Math.random() * window.innerWidth;
    }

    reset() {
        // Pick random phrase from FLOW_PHRASES
        const p = FLOW_PHRASES[Math.floor(Math.random() * FLOW_PHRASES.length)];
        this.text = p.text;
        this.lang = p.lang;
        
        this.fontSize = Math.floor(Math.random() * 6) + 11; // 11px to 16px
        this.x = window.innerWidth + 50; // Spawn off screen right
        this.y = Math.random() * (window.innerHeight - 200) + 100;
        
        this.speed = (Math.random() * 0.8 + 0.4) * config.flowSpeed;
        
        // Sine wave offset details
        this.amplitude = Math.random() * 30 + 10;
        this.frequency = Math.random() * 0.005 + 0.002;
        this.phase = Math.random() * Math.PI * 2;
        
        this.baseY = this.y;
        this.opacity = 0;
        this.maxOpacity = Math.random() * 0.45 + 0.25;
    }

    update() {
        if (config.flowSpeed === 0) return;
        
        // Shift left
        this.x -= this.speed * config.flowSpeed;
        
        // Calculate vertical sine wave position
        if (config.flowMode === 'wave') {
            this.y = this.baseY + Math.sin(this.x * this.frequency + this.phase) * this.amplitude;
        } else if (config.flowMode === 'spiral') {
            // Spiral-like drift centering towards hub
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const dx = this.x - centerX;
            const dy = this.y - centerY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const angle = Math.atan2(dy, dx) + 0.002 * config.flowSpeed;
            this.x = centerX + Math.cos(angle) * (dist - 0.4 * config.flowSpeed);
            this.y = centerY + Math.sin(angle) * (dist - 0.4 * config.flowSpeed);
        }

        // Fade in/out triggers
        if (this.x > window.innerWidth - 100) {
            this.opacity = Math.min(this.maxOpacity, this.opacity + 0.02);
        } else if (this.x < 100) {
            this.opacity = Math.max(0, this.opacity - 0.02);
        } else {
            this.opacity = this.maxOpacity;
        }

        // Recycle if off screen left
        if (this.x < -200) {
            this.reset();
        }
    }

    draw(c) {
        if (this.opacity <= 0) return;
        c.save();
        c.globalAlpha = this.opacity;
        c.fillStyle = activeThemeColor;
        c.font = `bold ${this.fontSize}px 'Share Tech Mono', monospace`;
        c.shadowBlur = 6;
        c.shadowColor = activeThemeColor;
        c.letterSpacing = '1px';
        
        // Accentuate Māori and Japanese fonts slightly differently
        if (this.lang === 'MA' || this.lang === 'JA') {
            c.fillStyle = '#ffffff';
            c.shadowColor = varColor('--highlight');
        }

        c.fillText(`${this.text} [${this.lang}]`, this.x, this.y);
        c.restore();
    }
}

// Utility to fetch current CSS variables
function varColor(varName) {
    return getComputedStyle(document.body).getPropertyValue(varName).trim();
}

function updateThemeVariables() {
    activeThemeColor = varColor('--accent');
    activeThemeGlow = varColor('--accent-glow');
}

function initOverlayCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = 'night-fish-overlay';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resizeCanvas();
    
    // Create initial pool of elements
    for (let i = 0; i < config.bubbleDensity; i++) {
        bubbles.push(new Bubble());
    }
    for (let i = 0; i < config.textDensity; i++) {
        texts.push(new FlowText());
    }

    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

// Global window event triggers for clicks/movements mapping (Canvas is pointer-events: none)
function initInteractions() {
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
        mouse.active = false;
    });

    window.addEventListener('click', (e) => {
        // Stop pops clicking active menus or controls
        if (e.target.closest('a, button, select, input, .theme-btn, .station-cell, #sound-toggle, #grid-toggle, #sorter-toggle, #night-fish-widget, #night-fish-chat-panel')) {
            return;
        }

        // Detect click coordinate intersection with bubble radius
        for (let b of bubbles) {
            if (b.popped) continue;
            const dx = e.clientX - b.x;
            const dy = e.clientY - b.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < b.radius + 15) { // broad click box for ease
                b.pop();
                playBubblePopSound();
                break; // Pop one bubble per click event
            }
        }
    });
}

// Synthesizer Audio tick pop using WebAudio
function playBubblePopSound() {
    const parentSoundState = localStorage.getItem('quest_audio_tuned');
    // Only synthesize pop sounds if user enables portal clock audio state
    if (parentSoundState !== 'completed') return;

    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        // Random short frequency pitch arpeggio
        osc.frequency.setValueAtTime(800 + Math.random() * 600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500 + Math.random() * 400, audioCtx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
        // web-audio policy catch
    }
}

// AI Speech display typist effect
function speak(phrase) {
    const speechEl = document.getElementById('assistant-speech');
    if (!speechEl) return;
    
    if (typingTimeout) clearTimeout(typingTimeout);
    speechEl.innerText = "";
    
    // Add talking class to animate mouth flap
    const chars = document.querySelectorAll('.night-fish-character');
    chars.forEach(c => c.classList.add('talking'));
    
    let charIdx = 0;
    
    function type() {
        if (charIdx < phrase.length) {
            speechEl.innerText += phrase.charAt(charIdx);
            charIdx++;
            typingTfunction triggerBubbleStorm() {
    const widget = document.getElementById('night-fish-widget');
    if (!widget) return;
    
    const rect = widget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    
    // Spawn 25 burst bubbles
    for (let i = 0; i < 25; i++) {
        // If bubble count exceeds max, repurpose/steal an existing bubble
        if (bubbles.length < config.maxBubbles) {
            bubbles.push(new Bubble(true, startX, startY));
        } else {
            const recycled = bubbles[i % bubbles.length];
            recycled.reset(true, startX, startY);
        }
    }
}

let aboutTypeTimeout = null;
function startAboutNarrative() {
    const textEl = document.getElementById('about-narrative-text');
    if (!textEl) return;
    
    if (aboutTypeTimeout) clearTimeout(aboutTypeTimeout);
    textEl.innerHTML = "";
    
    // Add talking animation to characters
    const chars = document.querySelectorAll('.night-fish-character');
    chars.forEach(c => c.classList.add('talking'));
    
    const messages = [
        ">> INITIALIZING COGNITIVE INTERFACE...",
        ">> CREATOR MESSAGE SYNC: ONLINE.",
        "",
        "WELCOME TO DRAGON 9.",
        "This project is a suite of glassmorphic, offline-first client instruments and visual dashboards designed for creators, musicians, and developers.",
        "",
        "THE POSITIVE FEEDBACK LOOP:",
        "1. Standard Client Apps: Completely free and downloadable as standalone offline HTML documents.",
        "2. Infinite Playgrounds: You own your tools. They run directly on your GPU/browser, sandboxed, with zero tracking.",
        "3. Independent Sustainability: Since I have no corporate backers, voluntary tips via PayPal keep me building and updating more tools for the commons.",
        "",
        "THANK YOU FOR BEING PART OF THIS CO-OP.",
        "Let's build creative, decentralized resilience together.",
        "",
        ">> COGNITIVE DISPATCH COMPLETED. STAY RESONANT."
    ];
    
    let lineIdx = 0;
    let charIdx = 0;
    
    function writeChar() {
        if (lineIdx < messages.length) {
            const currentLine = messages[lineIdx];
            if (charIdx < currentLine.length) {
                textEl.innerHTML += currentLine.charAt(charIdx);
                charIdx++;
                aboutTypeTimeout = setTimeout(writeChar, 12);
            } else {
                textEl.innerHTML += "<br>";
                lineIdx++;
                charIdx = 0;
                // scroll terminal to bottom
                textEl.scrollTop = textEl.scrollHeight;
                aboutTypeTimeout = setTimeout(writeChar, 100); // short pause between lines
            }
        } else {
            // Remove talking animation once typewriter completes
            chars.forEach(c => c.classList.remove('talking'));
        }
    }
    
    writeChar();
}

function triggerGoldenResonanceStorm() {
    playBubblePopSound();
    
    // Find centers
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    
    // Spawn 40 golden/cyan/magenta sparks/bubbles from center outwards
    for (let i = 0; i < 40; i++) {
        // Sparks
        const color = Math.random() > 0.4 ? '#d4af37' : (Math.random() > 0.5 ? '#00e5ff' : '#ff0080');
        sparks.push(new SplashSpark(startX + (Math.random() * 60 - 30), startY + (Math.random() * 60 - 30), color));
        
        // Bubbles
        if (bubbles.length < config.maxBubbles) {
            bubbles.push(new Bubble(true, startX, startY));
        } else {
            const recycled = bubbles[i % bubbles.length];
            recycled.reset(true, startX, startY);
        }
    }
}

function injectWidgetElements() {
    // 1. Create floating Avatar Widget
    const widget = document.createElement('div');
    widget.id = 'night-fish-widget';
    widget.title = 'AI Crew: Night Fish';
    widget.innerHTML = `
        <div class="avatar-ring-outer"></div>
        <div class="avatar-ring"></div>
        <div class="avatar-img-container">
            <div class="night-fish-character">
                <div class="fish-layer fish-tail-large"></div>
                <div class="fish-layer fish-tail-small"></div>
                <div class="fish-layer fish-fin-left"></div>
                <div class="fish-layer fish-fin-right"></div>
                <div class="fish-layer fish-head"></div>
            </div>
        </div>
        <div class="avatar-badge"></div>
    `;
    document.body.appendChild(widget);

    // 2. Create glassmorphic Chat Dialogue Panel
    const chatPanel = document.createElement('div');
    chatPanel.id = 'night-fish-chat-panel';
    chatPanel.innerHTML = `
        <div class="chat-header">
            <div class="chat-title">NIGHT FISH // AI COGNITION</div>
            <div class="chat-close-btn">&times;</div>
        </div>
        <div class="chat-body">
            <div class="chat-bubble">
                <span id="assistant-speech">Cognitive link standby... Click avatar to sync parameters.</span>
            </div>
            <div class="chat-controls">
                <button class="chat-btn" id="btn-burst-bubbles">Bubble Storm</button>
                <button class="chat-btn" id="btn-translate-cycles">Shift Lang</button>
                <button class="chat-btn" id="btn-flow-speed">Flow: Normal</button>
                <button class="chat-btn" id="btn-holo-project">Holo Screen</button>
                <button class="chat-btn" id="btn-about-thanks" style="border-color: var(--accent);">About & Thanks</button>
            </div>
            <div class="chat-footer-label">TIMOTHY DWEN DIGITAL INSTRUMENT SUITE</div>
        </div>
    `;
    document.body.appendChild(chatPanel);

    // 3. Create full-screen Holo Overlay
    const holoOverlay = document.createElement('div');
    holoOverlay.id = 'night-fish-holo-overlay';
    holoOverlay.innerHTML = `
        <div class="holo-close-btn">&times;</div>
        <div class="holo-container">
            <div class="holo-image-wrap">
                <div class="holo-grid-lines"></div>
                <div class="night-fish-character large">
                    <div class="fish-layer fish-tail-large"></div>
                    <div class="fish-layer fish-tail-small"></div>
                    <div class="fish-layer fish-fin-left"></div>
                    <div class="fish-layer fish-fin-right"></div>
                    <div class="fish-layer fish-head"></div>
                </div>
            </div>
            <h3 class="holo-title">NIGHT FISH</h3>
            <span class="holo-sub">HOLOGRAPHIC AI ASSISTANT ACTUATOR</span>
        </div>
    `;
    document.body.appendChild(holoOverlay);

    // 4. Create About & Thanks Overlay
    const aboutOverlay = document.createElement('div');
    aboutOverlay.id = 'night-fish-about-overlay';
    aboutOverlay.innerHTML = `
        <div class="about-close-btn">&times;</div>
        <div class="about-container">
            <div class="about-header">
                <div class="about-fish-wrap">
                    <div class="night-fish-character">
                        <div class="fish-layer fish-tail-large"></div>
                        <div class="fish-layer fish-tail-small"></div>
                        <div class="fish-layer fish-fin-left"></div>
                        <div class="fish-layer fish-fin-right"></div>
                        <div class="fish-layer fish-head"></div>
                    </div>
                </div>
                <div class="about-title-block">
                    <h2 class="about-title">DRAGON 9</h2>
                    <span class="about-subtitle">Sovereign Creator Ecosystem</span>
                </div>
            </div>
            
            <div class="about-body">
                <div class="about-terminal" id="about-narrative-text">
                    Initializing cognitive report...
                </div>
            </div>

            <div class="feedback-loop-visualizer">
                <div class="visualizer-title">♻️ The Positive Feedback Loop</div>
                <div class="visualizer-nodes">
                    <div class="visualizer-node" title="Free offline standalone client apps">💻</div>
                    <span class="visualizer-arrow">➡️</span>
                    <div class="visualizer-node" title="Musicians and artists create stunning content">🎨</div>
                    <span class="visualizer-arrow">➡️</span>
                    <div class="visualizer-node" title="Voluntary donations support independent developer">💛</div>
                    <span class="visualizer-arrow">➡️</span>
                    <div class="visualizer-node" title="Funds are converted directly to build more free tools">⚡</div>
                </div>
                <p style="font-size: 0.65rem; color: var(--text-muted); margin-top: 10px; font-family: 'Share Tech Mono', monospace; line-height: 1.4; padding: 0 10px;">
                    Download standalone client apps, use them completely offline, share your creations, and tip via PayPal when you can. Donations support building more free open-source tools!
                </p>
                <button class="btn btn-primary loop-trigger-btn" id="btn-visualize-loop">⚡ ACTUATE RESONANCE LOOP</button>
            </div>
            
            <div style="font-family: 'Orbitron', sans-serif; font-size: 0.55rem; color: var(--accent); letter-spacing: 2px;">
                TIMOTHY DWEN DIGITAL INSTRUMENT SUITE // CREATIVE CO-OP
            </div>
        </div>
    `;
    document.body.appendChild(aboutOverlay);

    // Bind event hooks
    widget.addEventListener('click', () => {
        chatPanel.classList.toggle('open');
        if (chatPanel.classList.contains('open')) {
            cycleAssistantSpeech();
        }
    });

    chatPanel.querySelector('.chat-close-btn').addEventListener('click', () => {
        chatPanel.classList.remove('open');
    });

    // Control buttons behavior
    chatPanel.querySelector('#btn-burst-bubbles').addEventListener('click', () => {
        triggerBubbleStorm();
    });

    chatPanel.querySelector('#btn-translate-cycles').addEventListener('click', () => {
        const langs = ['EN', 'MA', 'JA', 'FR', 'ES'];
        const currentIdx = langs.indexOf(config.activeLang);
        config.activeLang = langs[(currentIdx + 1) % langs.length];
        
        const cycleBtn = chatPanel.querySelector('#btn-translate-cycles');
        cycleBtn.innerText = `Lang: ${config.activeLang}`;
        
        // Speak current message in new language immediately
        const adjustedIdx = (messageIndex - 1 + COGNITION_DATA.length) % COGNITION_DATA.length;
        const phrase = COGNITION_DATA[adjustedIdx][config.activeLang] || COGNITION_DATA[adjustedIdx]['EN'];
        speak(phrase);
    });

    const speedBtn = chatPanel.querySelector('#btn-flow-speed');
    speedBtn.addEventListener('click', () => {
        if (config.flowSpeed === 1.0) {
            config.flowSpeed = 2.0;
            speedBtn.innerText = "Flow: Fast";
        } else if (config.flowSpeed === 2.0) {
            config.flowSpeed = 0;
            speedBtn.innerText = "Flow: Paused";
        } else {
            config.flowSpeed = 1.0;
            speedBtn.innerText = "Flow: Normal";
        }
    });

    // Holo projection overlay toggle
    chatPanel.querySelector('#btn-holo-project').addEventListener('click', () => {
        holoOverlay.style.display = 'flex';
        config.holoActive = true;
    });

    holoOverlay.querySelector('.holo-close-btn').addEventListener('click', () => {
        holoOverlay.style.display = 'none';
        config.holoActive = false;
    });



    // About overlay trigger
    chatPanel.querySelector('#btn-about-thanks').addEventListener('click', () => {
        aboutOverlay.style.display = 'flex';
        config.holoActive = true;
        startAboutNarrative();
    });

    aboutOverlay.querySelector('.about-close-btn').addEventListener('click', () => {
        aboutOverlay.style.display = 'none';
        config.holoActive = false;
        if (aboutTypeTimeout) clearTimeout(aboutTypeTimeout);
        // Remove talking class
        document.querySelectorAll('.night-fish-character').forEach(c => c.classList.remove('talking'));
    });

    aboutOverlay.querySelector('#btn-visualize-loop').addEventListener('click', () => {
        triggerGoldenResonanceStorm();
    });

    holoOverlay.addEventListener('click', (e) => {
        if (e.target === holoOverlay) {
            holoOverlay.style.display = 'none';
            config.holoActive = false;
        }
    });

    aboutOverlay.addEventListener('click', (e) => {
        if (e.target === aboutOverlay) {
            aboutOverlay.style.display = 'none';
            config.holoActive = false;
            if (aboutTypeTimeout) clearTimeout(aboutTypeTimeout);
            document.querySelectorAll('.night-fish-character').forEach(c => c.classList.remove('talking'));
        }
    });
}
        Spawner.spawn(assetName, x, y, behavior);
        
        // Truncate long generated asset names for speech
        const speechName = assetName.substring(0, 15).replace(/_/g, ' ');
        speak(`Summoning ${speechName.toUpperCase()} into the workspace...`);
    });

    holoOverlay.addEventListener('click', (e) => {
        if (e.target === holoOverlay) {
            holoOverlay.style.display = 'none';
            config.holoActive = false;
        }
    });
}

// Master Render loop updates
function loop() {
    requestAnimationFrame(loop);
    if (!ctx) return;

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateThemeVariables();

    // Update & draw texts
    for (let t of texts) {
        t.update();
        t.draw(ctx);
    }

    // Update & draw bubbles
    for (let b of bubbles) {
        b.update();
        b.draw(ctx);
    }

    // Update & draw pop sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.update();
        if (s.alpha <= 0) {
            sparks.splice(i, 1);
        } else {
            s.draw(ctx);
        }
    }
}

// Entry Actuator
function init() {
    updateThemeVariables();
    injectWidgetElements();
    initOverlayCanvas();
    initInteractions();
    Spawner.init(); // Initialize the asset spawner
    loop();

    // Slowly cycle speech prompts occasionally when panel is visible
    setInterval(() => {
        const chatPanel = document.getElementById('night-fish-chat-panel');
        if (chatPanel && chatPanel.classList.contains('open') && !config.holoActive) {
            cycleAssistantSpeech();
        }
    }, 11000);
}

// Ensure theme colors sync if parents adjust class lists
const themeObserver = new MutationObserver(() => {
    updateThemeVariables();
});
themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

// Trigger script load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
