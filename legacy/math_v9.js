import { CONFIG } from './data.js';

export function getDragonSync(date) {
    const h24 = date.getHours();
    const m24 = date.getMinutes();
    const s24 = date.getSeconds();
    const totalSeconds = (h24 * 3600) + (m24 * 60) + s24;
    
    const { RELAX_WINDOW, MIDDAY, DAY_END, SEC_PER_HOUR } = CONFIG.DRAGON;
    
    const isRelax = (totalSeconds < RELAX_WINDOW) || 
                    (totalSeconds >= MIDDAY - RELAX_WINDOW && totalSeconds < MIDDAY + RELAX_WINDOW) || 
                    (totalSeconds >= DAY_END - RELAX_WINDOW);
    
    let h = 26, m = 0;
    if (totalSeconds >= RELAX_WINDOW && totalSeconds < MIDDAY - RELAX_WINDOW) {
        const adj = totalSeconds - RELAX_WINDOW;
        h = Math.floor(adj / SEC_PER_HOUR);
        m = Math.floor((adj % SEC_PER_HOUR) / 60);
    } else if (totalSeconds >= MIDDAY + RELAX_WINDOW && totalSeconds < DAY_END - RELAX_WINDOW) {
        const adj = totalSeconds - (MIDDAY + RELAX_WINDOW);
        h = Math.floor(adj / SEC_PER_HOUR) + 13;
        m = Math.floor((adj % SEC_PER_HOUR) / 60);
    }

    const root = (((h || 26) - 1) % 9) + 1;
    const hue = (184.5 - (totalSeconds / 86400) * 360 + 360) % 360;
    
    return { h, m, s: s24, isRelax, root, hue, totalSeconds };
}

export function getLemniscatePosition(t, scale = 15) {
    const denominator = 1 + Math.sin(t) * Math.sin(t);
    const x = (scale * Math.cos(t)) / denominator;
    const y = (scale * Math.sin(t) * Math.cos(t)) / denominator;
    return { x: x, y: y, z: Math.sin(t * 2) * (scale / 4) }; // Added a bit of Z for 3D depth
}
