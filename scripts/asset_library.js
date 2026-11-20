// asset_library.js
// Centralized Asset Manager for Dragon 9

export const AssetLibrary = {
    assets: {},
    loadedImages: {},

    // Preload all assets into memory so they spawn instantly
    async preloadAll() {
        try {
            console.log("Dragon 9: Fetching Auto-Sorted Asset Registry...");
            const response = await fetch('assets/asset_registry.json');
            this.assets = await response.json();
            
            let loadCount = 0;
            // Preload only the first 500 images to prevent browser crashing, 
            // the rest will load on-demand when summoned.
            const keysToPreload = Object.keys(this.assets).slice(0, 500);
            
            for (const name of keysToPreload) {
                const img = new Image();
                img.src = this.assets[name].src;
                this.loadedImages[name] = img;
                loadCount++;
            }
            console.log(`Dragon 9: Asset Library Preloaded ${loadCount} items (out of ${Object.keys(this.assets).length}).`);
        } catch (e) {
            console.error("Dragon 9: Failed to load asset registry.", e);
        }
    },

    getAsset(name) {
        if (!this.assets[name]) return null;
        
        // Lazy load if not preloaded
        if (!this.loadedImages[name]) {
            const img = new Image();
            img.src = this.assets[name].src;
            this.loadedImages[name] = img;
        }
        
        return {
            img: this.loadedImages[name],
            config: this.assets[name]
        };
    },
    
    getRandomAssetKey() {
        const keys = Object.keys(this.assets);
        if (keys.length === 0) return null;
        return keys[Math.floor(Math.random() * keys.length)];
    }
};
