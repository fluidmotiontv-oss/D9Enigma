// spawner.js
// Handles the lifecycle, physics, and injection of Dragon 9 visual assets

import { AssetLibrary } from './asset_library.js';

export const Spawner = {
    container: null,
    activeEntities: [],

    init(containerId) {
        this.container = document.getElementById(containerId) || document.body;
        AssetLibrary.preloadAll();
        
        // Start physics loop
        requestAnimationFrame(() => this.physicsLoop());
    },

    spawn(assetName, x, y, behavior = 'drift') {
        const asset = AssetLibrary.getAsset(assetName);
        if (!asset) {
            console.error(`Dragon 9 Spawner: Asset "${assetName}" not found.`);
            return null;
        }

        const el = document.createElement('img');
        el.src = asset.img.src;
        el.className = `dragon-entity type-${asset.config.type} behavior-${behavior}`;
        
        // Apply styling
        el.style.position = 'fixed';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = `scale(${asset.config.scale})`;
        el.style.zIndex = '50';
        el.style.pointerEvents = 'none'; // Let clicks pass through by default
        
        // Add to DOM and tracking array
        this.container.appendChild(el);
        
        const entity = {
            element: el,
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 1, // Velocity X
            vy: (Math.random() - 0.5) * 1, // Velocity Y
            behavior: behavior,
            angle: Math.random() * Math.PI * 2,
            radius: 100 + Math.random() * 100
        };
        
        this.activeEntities.push(entity);
        return entity;
    },

    physicsLoop() {
        const time = Date.now() * 0.001;
        
        this.activeEntities.forEach(entity => {
            if (entity.behavior === 'drift') {
                // Subtle fluid floating
                entity.x += entity.vx;
                entity.y += entity.vy + Math.sin(time + entity.x) * 0.5;
                
                // Gently bounce off screen edges
                if (entity.x < -200 || entity.x > window.innerWidth + 200) entity.vx *= -1;
                if (entity.y < -200 || entity.y > window.innerHeight + 200) entity.vy *= -1;
                
                entity.element.style.left = `${entity.x}px`;
                entity.element.style.top = `${entity.y}px`;
                
            } else if (entity.behavior === 'orbit') {
                // Orbit around the center of the screen
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                
                entity.x = centerX + Math.cos(time * 0.5 + entity.angle) * entity.radius;
                entity.y = centerY + Math.sin(time * 0.5 + entity.angle) * entity.radius;
                
                entity.element.style.left = `${entity.x}px`;
                entity.element.style.top = `${entity.y}px`;
            }
        });
        
        requestAnimationFrame(() => this.physicsLoop());
    },
    
    clearAll() {
        this.activeEntities.forEach(e => e.element.remove());
        this.activeEntities = [];
    }
};
