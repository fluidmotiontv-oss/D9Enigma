# Fluidric Spillarkuwaii: 3D Synesthetic Fidget Instrument

Welcome to the **Fluidric Spillarkuwaii** (Lotus Spinner & Sampler Piano), a glassmorphic, audio-reactive 3D fidget synthesizer built for spatial play, ambient composition, and live sound design.

This instrument fuses Web Audio, Three.js 3D physics, real-time frequency analysis, and DAW-style multi-track loop recording to create an immersive, responsive digital playground.

---

## 🌌 Architectural Vibe & Aesthetics
The application is styled with a dark, cybernetic glassmorphism theme:
- **HSL Rainbow Spectrum**: Petals are colored continuously using a circular color wheel to highlight the spiral mathematical layout.
- **Audio-Reactive Fluid Dynamics**: Two organic background blobs scale and drift dynamically based on live audio analysis.
- **Glowing Cybernetic Strikers**: Pointer tools (Wands, Drumsticks, Finger) are constructed from transparent glass materials lit from within by glowing neon point lights.
- **SVG Constellation Overlay**: A connected cybernetic node map that lights up and fills with color as notes and triad combinations are struck.

---

## 🎹 Core Features

1. **Procedural 3D Lotus Piano**: 36 customizable petals mapped to a pentatonic scale across multiple octaves. Support for three different geometric models (Lotus, Rose, Crystal).
2. **4-Track Loop Mixer**: A rolling loop pedal allowing you to layer up to four distinct tracks, mute/unmute individual channels, and clear loops surgically.
3. **Master Output Recording**: Live audio capture directly from the synthesizer's master gain nodes into high-quality, downloadable `.webm` files.
4. **Petal Sampler & Custom Editor**: Map custom `.wav`/`.mp3` files or `.png`/`.jpg` pictures onto specific petals to build custom sound and graphic libraries.
5. **Live Audio-Visualizer**: Web Audio `AnalyserNode` frequency mapping that scales background fluid wraps and pulses the stroke width of background constellation lines live to the music.
6. **Triad Gateway Network Challenge**: A built-in ear training and rhythmic game where players match played triads to sync the cybernetic portal, earning Art Contribution points.

---

## 🕹️ How to Play & Controls

### Striker Tools (Right Sidebar)
- 👆 **Glowing Finger**: Cyan-glowing pointer sphere for light touches.
- 🪄 **Magic Wand**: Gold-glowing crystal rod that extends your reach, plucking petals with smooth angle projections.
- 🥁 **Drumstick**: Translucent deep-blue rod with a hot-pink neon tip for heavy strikes.

### 4-Track Loop Mixer
1. Select your target track (e.g. **Track 1**).
2. Click **Record Loop** and play a sequence (such as a baseline or melody arpeggio). Recording automatically stops and starts loop playback after 8 seconds.
3. Select **Track 2**, click **Record Loop**, and layer a second melody or chord progression on top.
4. Mute tracks using the **Mute** toggles to isolate channels or rearrange your mix on the fly.
5. Click **Clear** next to any track to wipe its events and re-record it without interrupting the other loops!

### Harmony Exchange Feed
- **Load Pre-Loaded Seeds**: Select pre-made loops from the dropdown feed (e.g. *Nebula Echoes* or *Gateway Pulse*) to hear 4-track layering in action.
- **Save Local Jams**: Type a name into the save box and click **Save** to write your loop data directly to browser storage. It will instantly show up in the dropdown feed for future play.
- **Resonance Codes**:
  - Click **Export Code** to copy a Base64 text string of your song. You can paste this in emails, chats, or forums to share it.
  - Click **Import Code** to paste someone else's Resonance Code and instantly rebuild their 4 tracks!

---

## 🎓 Creator Best Practices & Production Workflow

For musicians, sound designers, and visual creators wanting to build tracks with the Spillarkuwaii:

### 1. Multi-Track DAW Integration (Audacity & Ardour)
- To lay down studio-grade tracks using your jams:
  1. Record your loop layers and get a nice mix going.
  2. Click **Record Master Output** to start capturing.
  3. Pluck, spin, or play live arpeggios on top of your backing beats.
  4. Click **Stop Recording** to download the raw audio mix.
  5. Import this WebM file directly into **Audacity**, **Ardour**, or any modern DAW. Because Web Audio bounces are digital-direct, they are noise-free and pre-equalized for maximum clarity.

### 2. Crafting Custom Petal Soundscapes (Soundpacks)
- Click any individual petal to open the **Petal Sampler Editor** in the left panel.
- Upload custom vocal samples, sub-bass hits, or custom synth drops (`.mp3` or `.wav`) to map them to that note.
- Custom samples will trigger during loop cycles, arpeggiator spins, and game strikes! Load up a whole ring of drum hits or sound effects to transform the lotus into a custom drum machine/sampler.

### 3. Harmonic Triad Game Tuning
- Toggle **Show Note Labels** in the right panel to help memorize the positions of notes on the wheel.
- Use the **Auto-Spin Orbit** toggle at a low speed to let the flower rotate slowly. This creates moving targets and lets you play arpeggios by holding your striker still as the petals pass through it!
