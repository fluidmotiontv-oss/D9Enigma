const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: false });

const dom = {
    uploader: document.getElementById('uploader'),
    startTime: document.getElementById('startTime'),
    endTime: document.getElementById('endTime'),
    scale: document.getElementById('scale'),
    filter: document.getElementById('filter'),
    processButton: document.getElementById('processButton'),
    addClipButton: document.getElementById('addClipButton'),
    player: document.getElementById('player'),
    logger: document.getElementById('logger'),
    statusText: document.getElementById('status-text'),
    progressBar: document.getElementById('progress-bar'),
    downloadLink: document.getElementById('downloadLink')
};

let clips = []; // Array of clip objects: { id, file, fileName, startTime, endTime }
let selectedFileForClip = null;

function log(msg, type = 'SYSTEM') {
    const entry = document.createElement('div');
    entry.textContent = `[${type}] ${msg}`;
    dom.logger.prepend(entry);
}

// Initialize FFmpeg
(async () => {
    log("Initializing Resonance Engine...");
    try {
        await ffmpeg.load();
        if (selectedFileForClip || clips.length > 0) {
            dom.processButton.disabled = false;
        }
        dom.processButton.textContent = "PROCESS RESONANCE";
        log("Resonance Engine Ready.");
    } catch (e) {
        log("Failed to load engine: " + e.message, "ERROR");
    }
})();

ffmpeg.setProgress(({ ratio }) => {
    const pct = (ratio * 100).toFixed(0);
    dom.progressBar.style.width = `${pct}%`;
    dom.statusText.textContent = `RESONATING: ${pct}%`;
});

// Render timeline items dynamically
function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    const badge = document.getElementById('clip-count-badge');
    badge.textContent = `CLIPS: ${clips.length}`;
    
    if (clips.length === 0) {
        container.innerHTML = `
            <div style="font-family: 'Share Tech Mono', monospace; font-size: 0.8rem; text-align: center; width: 100%; opacity: 0.5;" id="timelinePlaceholder">
                Timeline Empty. Load a video file above and click "ADD CLIP TO TIMELINE" to begin sequencing.
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    clips.forEach((clip, index) => {
        const card = document.createElement('div');
        card.className = 'clip-card';
        card.style.cssText = 'background: rgba(255, 255, 255, 0.02); border: 1.5px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px; min-width: 240px; display: flex; flex-direction: column; gap: 10px; position: relative;';
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 4px;">
                <span style="font-family: 'Orbitron', sans-serif; font-size: 0.7rem; font-weight: bold; color: var(--accent);">Clip ${index + 1}</span>
                <span style="font-family: 'Share Tech Mono', monospace; font-size: 0.6rem; color: #aaa; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px;" title="${clip.fileName}">${clip.fileName}</span>
            </div>
            
            <div style="display: flex; gap: 8px; align-items: center;">
                <div style="display: flex; flex-direction: column; gap: 2px; flex: 1;">
                    <label style="font-size: 0.55rem;">In (s)</label>
                    <input type="number" class="clip-start" value="${clip.startTime}" step="0.1" style="padding: 4px 8px; font-size: 0.75rem;" data-index="${index}" />
                </div>
                <div style="display: flex; flex-direction: column; gap: 2px; flex: 1;">
                    <label style="font-size: 0.55rem;">Out (s)</label>
                    <input type="number" class="clip-end" value="${clip.endTime}" step="0.1" style="padding: 4px 8px; font-size: 0.75rem;" data-index="${index}" />
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                <div style="display: flex; gap: 4px;">
                    <button class="clip-move-btn" style="padding: 4px 8px; font-size: 0.6rem; background: rgba(255,255,255,0.05); width: auto;" onclick="moveClip(${index}, -1)">◀</button>
                    <button class="clip-move-btn" style="padding: 4px 8px; font-size: 0.6rem; background: rgba(255,255,255,0.05); width: auto;" onclick="moveClip(${index}, 1)">▶</button>
                </div>
                <button class="clip-delete-btn" style="padding: 4px 8px; font-size: 0.6rem; background: rgba(255, 34, 0, 0.15); border-color: rgba(255, 34, 0, 0.3); color: #ff3333; width: auto;" onclick="deleteClip(${index})">Remove</button>
            </div>
        `;
        
        card.querySelector('.clip-start').addEventListener('change', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'), 10);
            clips[idx].startTime = parseFloat(e.target.value) || 0;
            log(`Clip ${idx + 1} Trim-In updated: ${clips[idx].startTime}s`);
        });
        
        card.querySelector('.clip-end').addEventListener('change', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'), 10);
            clips[idx].endTime = parseFloat(e.target.value) || 0;
            log(`Clip ${idx + 1} Trim-Out updated: ${clips[idx].endTime}s`);
        });
        
        container.appendChild(card);
    });
}

window.moveClip = function(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= clips.length) return;
    
    // Swap
    const temp = clips[index];
    clips[index] = clips[target];
    clips[target] = temp;
    
    log(`Moved Clip ${index + 1} to position ${target + 1}`);
    renderTimeline();
};

window.deleteClip = function(index) {
    const removed = clips.splice(index, 1);
    log(`Removed clip: ${removed[0].fileName}`);
    renderTimeline();
    
    if (clips.length === 0 && !selectedFileForClip) {
        dom.processButton.disabled = true;
    }
};

// Add to timeline button listener
dom.addClipButton.addEventListener('click', () => {
    if (!selectedFileForClip) return;
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    clips.push({
        id,
        file: selectedFileForClip,
        fileName: selectedFileForClip.name,
        startTime: parseFloat(dom.startTime.value) || 0,
        endTime: parseFloat(dom.endTime.value) || 5
    });
    log(`Added Clip ${clips.length}: ${selectedFileForClip.name} [${dom.startTime.value}s - ${dom.endTime.value}s]`);
    renderTimeline();
    dom.processButton.disabled = false;
});

dom.processButton.addEventListener('click', async () => {
    // Check if timeline is populated, if so we process sequencing
    if (clips.length > 0) {
        dom.processButton.disabled = true;
        dom.downloadLink.style.display = 'none';
        dom.progressBar.style.width = '0%';
        dom.statusText.textContent = "PROCESSING...";
        log(`Timeline Sequencing started with ${clips.length} clips.`);
        
        try {
            const scale = dom.scale.value;
            const filter = dom.filter.value;
            
            // Step 1: Process each clip individually and transcode it to a standardized output
            for (let i = 0; i < clips.length; i++) {
                const clip = clips[i];
                log(`[1/${clips.length + 1}] Processing Clip ${i + 1}: ${clip.fileName}`);
                
                ffmpeg.FS('writeFile', `input_${i}`, await fetchFile(clip.file));
                const duration = clip.endTime - clip.startTime;
                
                const clipArgs = ['-i', `input_${i}`, '-ss', clip.startTime.toString(), '-t', duration.toString()];
                
                let vf = [];
                // Standardize size to ensure smooth concatenation
                if (scale === 'none' || scale === '1280:720') {
                    vf.push('scale=1280:720');
                } else if (scale === 'square') {
                    vf.push('crop=ih:ih,scale=600:600');
                } else {
                    vf.push(`scale=${scale}`);
                }
                
                if (filter === 'matrix') vf.push('hue=h=120:s=2,curves=preset=color_negative');
                else if (filter === 'amber') vf.push('hue=h=30:s=1.5,curves=preset=increase_contrast');
                else if (filter === 'blur') vf.push('boxblur=2:1');
                else if (filter === 'mono') vf.push('hue=s=0');
                
                if (vf.length > 0) clipArgs.push('-vf', vf.join(','));
                
                // Remove audio stream (-an) for compatibility and fast merging
                clipArgs.push('-c:v', 'libx264', '-preset', 'ultrafast', '-an', `clip_${i}.mp4`);
                
                log(`Running FFmpeg on Clip ${i + 1}...`);
                await ffmpeg.run(...clipArgs);
            }
            
            // Step 2: Concatenate all processed clips
            log(`[2/${clips.length + 1}] Concatenating all processed clips...`);
            const concatArgs = [];
            for (let i = 0; i < clips.length; i++) {
                concatArgs.push('-i', `clip_${i}.mp4`);
            }
            
            let filterComplex = '';
            for (let i = 0; i < clips.length; i++) {
                filterComplex += `[${i}:v]`;
            }
            filterComplex += `concat=n=${clips.length}:v=1:a=0[v]`;
            
            concatArgs.push('-filter_complex', filterComplex, '-map', '[v]', '-c:v', 'libx264', '-preset', 'ultrafast', 'output.mp4');
            
            log(`Running concatenation filter...`);
            await ffmpeg.run(...concatArgs);
            
            // Read output
            const data = ffmpeg.FS('readFile', 'output.mp4');
            const blob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            
            dom.player.src = url;
            dom.downloadLink.href = url;
            dom.downloadLink.download = `dragon9_sequence_${Date.now()}.mp4`;
            dom.downloadLink.style.display = 'block';
            
            log("Timeline sequencing capture complete.", "SUCCESS");
            dom.statusText.textContent = "CAPTURE SUCCESSFUL";
            
            // Clean up files in virtual FS
            for (let i = 0; i < clips.length; i++) {
                try {
                    ffmpeg.FS('unlink', `input_${i}`);
                    ffmpeg.FS('unlink', `clip_${i}.mp4`);
                } catch(err) {}
            }
            try {
                ffmpeg.FS('unlink', 'output.mp4');
            } catch(err) {}
            
        } catch (e) {
            log("Sequencing failure: " + e.message, "ERROR");
            dom.statusText.textContent = "SYSTEM FAILURE";
        } finally {
            dom.processButton.disabled = false;
        }
        return;
    }

    // Default single-file processing
    const file = dom.uploader.files[0];
    if (!file) {
        log("No source asset detected.", "WARN");
        return;
    }

    dom.processButton.disabled = true;
    dom.downloadLink.style.display = 'none';
    dom.progressBar.style.width = '0%';
    log(`Loading asset: ${file.name}`);
    
    const start = dom.startTime.value;
    const duration = dom.endTime.value - start;
    const scale = dom.scale.value;
    const filter = dom.filter.value;

    try {
        ffmpeg.FS('writeFile', 'input', await fetchFile(file));
        
        const args = ['-i', 'input', '-ss', start.toString(), '-t', duration.toString()];
        
        let vf = [];
        if (scale !== 'none') {
            if (scale === 'square') vf.push('crop=ih:ih,scale=600:600');
            else vf.push(`scale=${scale}`);
        }
        
        if (filter === 'matrix') vf.push('hue=h=120:s=2,curves=preset=color_negative');
        else if (filter === 'amber') vf.push('hue=h=30:s=1.5,curves=preset=increase_contrast');
        else if (filter === 'blur') vf.push('boxblur=2:1');
        else if (filter === 'mono') vf.push('hue=s=0');
        
        if (vf.length > 0) args.push('-vf', vf.join(','));
        
        args.push('-c:v', 'libx264', '-preset', 'ultrafast', 'output.mp4');
        
        log(`Resonating with args: ${args.join(' ')}`);
        await ffmpeg.run(...args);
        
        const data = ffmpeg.FS('readFile', 'output.mp4');
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        
        dom.player.src = url;
        dom.downloadLink.href = url;
        dom.downloadLink.download = `dragon9_${file.name}`;
        dom.downloadLink.style.display = 'block';
        
        log("Resonance capture complete.", "SUCCESS");
        dom.statusText.textContent = "CAPTURE SUCCESSFUL";
    } catch (e) {
        log("Resonance failure: " + e.message, "ERROR");
        dom.statusText.textContent = "SYSTEM FAILURE";
    } finally {
        dom.processButton.disabled = false;
    }
});

dom.uploader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const uploadLabel = document.getElementById('uploadLabel');
    const previewContainer = document.getElementById('previewContainer');
    
    if (file) {
        selectedFileForClip = file;
        dom.player.src = URL.createObjectURL(file);
        dom.statusText.textContent = "ASSET LOADED";
        if (uploadLabel) uploadLabel.textContent = file.name.toUpperCase();
        if (previewContainer) previewContainer.classList.add('has-asset');
        log(`Previewing: ${file.name}`);
        
        dom.processButton.disabled = false;
        dom.addClipButton.disabled = false;
    } else {
        selectedFileForClip = null;
        if (uploadLabel) uploadLabel.textContent = "SELECT VIDEO FILE...";
        if (previewContainer) previewContainer.classList.remove('has-asset');
        dom.addClipButton.disabled = true;
        if (clips.length === 0) {
            dom.processButton.disabled = true;
        }
    }
});
