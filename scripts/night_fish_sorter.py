import os
import json
from pathlib import Path

# Base paths
PROJECT_ROOT = Path("/home/tim/Desktop/dragon9 site frm laptop/dragon9")
ASSETS_DIR = PROJECT_ROOT / "assets"
REGISTRY_PATH = ASSETS_DIR / "asset_registry.json"

# Supported extensions
VALID_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.tif', '.bmp', '.webp'}

def classify_asset(filepath):
    """Simple heuristic to classify an asset as character, prop, or scene based on path/name."""
    lower_path = str(filepath).lower()
    
    if 'fish' in lower_path or 'surfer' in lower_path or 'character' in lower_path or 'crew' in lower_path:
        return 'character', 0.8
    elif 'map' in lower_path or 'scene' in lower_path or 'background' in lower_path:
        return 'scene', 1.0
    else:
        return 'prop', 1.0

def build_registry():
    print(f"[*] Night Fish Auto-Sorter Initializing...")
    print(f"[*] Scanning {ASSETS_DIR}")
    
    registry = {}
    count = 0
    
    # Traverse all directories in assets/
    for root, dirs, files in os.walk(ASSETS_DIR):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in VALID_EXTENSIONS:
                full_path = Path(root) / file
                # Create a relative path from the project root (e.g. 'assets/fish cartoon pngs/fish1.png')
                rel_path = full_path.relative_to(PROJECT_ROOT)
                
                # Use a clean name as the key (filename without extension, spaces to underscores)
                name_key = os.path.splitext(file)[0].replace(" ", "_").lower()
                
                # Handle duplicate names by appending a counter
                final_key = name_key
                dedupe_counter = 1
                while final_key in registry:
                    final_key = f"{name_key}_{dedupe_counter}"
                    dedupe_counter += 1
                
                asset_type, scale = classify_asset(full_path)
                
                registry[final_key] = {
                    "src": str(rel_path).replace("\\", "/"), # Ensure forward slashes for web
                    "type": asset_type,
                    "scale": scale
                }
                count += 1

    print(f"[*] Scanned {count} valid image assets.")
    
    # Write to JSON
    with open(REGISTRY_PATH, 'w', encoding='utf-8') as f:
        json.dump(registry, f, indent=4)
        
    print(f"[*] Registry successfully written to {REGISTRY_PATH}")

if __name__ == "__main__":
    build_registry()
