# Dragon 9 Forensic Assembler - Video/Reels capture backend
# Serves static files and provides endpoint /api/download-reel running yt-dlp

import http.server
import json
import subprocess
import os
import time

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Dragon9BackendHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "OK")
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/list-crew-assets'):
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            crew = query_params.get('crew', [''])[0].strip().lower()
            
            base_crew_dir = os.path.join(DIRECTORY, 'assets', 'crew')
            
            if not os.path.exists(base_crew_dir):
                self.send_success_response({"status": "success", "audio": [], "video": [], "images": []})
                return
                
            if not crew:
                # Return list of all available crews
                crews = []
                for d in os.listdir(base_crew_dir):
                    if os.path.isdir(os.path.join(base_crew_dir, d)):
                        crews.append(d)
                self.send_success_response({"status": "success", "crews": crews})
                return
                
            crew_path = os.path.join(base_crew_dir, crew)
            if not os.path.exists(crew_path) or not os.path.isdir(crew_path):
                self.send_success_response({"status": "success", "crew": crew, "audio": [], "video": [], "images": []})
                return
                
            # Scan directories
            response_data = {
                "status": "success",
                "crew": crew,
                "audio": [],
                "video": [],
                "images": []
            }
            
            for m_type in ['audio', 'video', 'images']:
                sub_dir = os.path.join(crew_path, m_type)
                if os.path.exists(sub_dir) and os.path.isdir(sub_dir):
                    for file in os.listdir(sub_dir):
                        if not file.startswith('.'):
                            file_path = os.path.join(sub_dir, file)
                            if os.path.isfile(file_path):
                                size = os.path.getsize(file_path)
                                # Relative web URL path
                                web_path = f"assets/crew/{crew}/{m_type}/{file}"
                                response_data[m_type].append({
                                    "name": file,
                                    "path": web_path,
                                    "size": size
                                })
            self.send_success_response(response_data)
        elif self.path.startswith('/api/get-radio-submissions'):
            filepath = os.path.join(DIRECTORY, 'radio_submissions.json')
            if os.path.exists(filepath):
                try:
                    with open(filepath, 'r') as f:
                        data = json.load(f)
                    self.send_success_response({"status": "success", "tracks": data})
                    return
                except:
                    pass
            self.send_success_response({"status": "success", "tracks": []})
            return
            
        elif self.path.startswith('/api/get-shop-albums'):
            filepath = os.path.join(DIRECTORY, 'registered_albums.json')
            if os.path.exists(filepath):
                try:
                    with open(filepath, 'r') as f:
                        data = json.load(f)
                    self.send_success_response({"status": "success", "albums": data})
                    return
                except:
                    pass
            self.send_success_response({"status": "success", "albums": []})
            return

        elif self.path.startswith('/api/get-artwork-sales'):
            filepath = os.path.join(DIRECTORY, 'artwork_sales.json')
            data = {}
            if os.path.exists(filepath):
                try:
                    with open(filepath, 'r') as f:
                        data = json.load(f)
                except:
                    pass
            self.send_success_response({"status": "success", "sales": data})
            return

        elif self.path.startswith('/api/get-artist-earnings'):
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            crew = query_params.get('crew', [''])[0].strip().lower()
            
            filepath = os.path.join(DIRECTORY, 'artist_ledgers.json')
            ledger = {}
            if os.path.exists(filepath):
                try:
                    with open(filepath, 'r') as f:
                        ledger = json.load(f)
                except:
                    pass
                    
            artist_data = ledger.get(crew, {"earnings": 0, "withdrawals": 0})
            self.send_success_response({
                "status": "success",
                "crew": crew,
                "earnings": artist_data.get("earnings", 0),
                "withdrawals": artist_data.get("withdrawals", 0),
                "balance": artist_data.get("earnings", 0) - artist_data.get("withdrawals", 0)
            })
            return
            
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/download-reel':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                params = json.loads(post_data.decode('utf-8'))
                url = params.get('url', '').strip()
                
                if not url:
                    self.send_error_response("URL parameter is missing.")
                    return
                
                # Check for fluidmotiontv query
                if '#fluidmotiontv' in url.lower() or url.lower() == 'fluidmotiontv':
                    self.send_success_response({
                        "status": "success",
                        "is_collection": True,
                        "reels": [
                            {
                                "video_url": "mock",
                                "title": "FM-TV: Auckland Octagon Resonance Grid",
                                "desc": "Captured Auckland Sovereign Node running Octagon phase-locked loops.",
                                "id": "fmtv_01",
                                "duration": 15,
                                "gps": "-36.8485, 174.7633 (Auckland)",
                                "mood": "Energetic"
                            },
                            {
                                "video_url": "mock",
                                "title": "FM-TV: Wellington Midday Relax Phase",
                                "desc": "Acoustic field recording of Wellington Harbor master clock relax synchronization.",
                                "id": "fmtv_02",
                                "duration": 18,
                                "gps": "-41.2865, 174.7762 (Wellington)",
                                "mood": "Calm"
                            },
                            {
                                "video_url": "mock",
                                "title": "FM-TV: Sydney Fabric Overlap Scan",
                                "desc": "Chronological mapping of peer-to-peer data packets sliding along the Tasman grid line.",
                                "id": "fmtv_03",
                                "duration": 12,
                                "gps": "-33.8688, 151.2093 (Sydney)",
                                "mood": "Reflective"
                            },
                            {
                                "video_url": "mock",
                                "title": "FM-TV: Whale Volumetric Lightfield",
                                "desc": "3D lightfield parallax reconstruction of whale paths near sovereign reef grids.",
                                "id": "fmtv_04",
                                "duration": 22,
                                "gps": "-17.6509, -149.4260 (Tahiti)",
                                "mood": "Creative"
                            }
                        ]
                    })
                    return

                # Check for mock trigger
                if url.lower() == 'mock':
                    self.send_success_response({
                        "status": "success",
                        "video_url": "mock",
                        "title": "Captured Segment - FB Reel 99",
                        "desc": "Chronological segment decoded successfully from virtual memory streams.",
                        "id": "reel_mock_99",
                        "duration": 15,
                        "gps": "-36.8485, 174.7633 (Auckland)",
                        "mood": "Energetic"
                    })
                    return

                # Create output folder inside assets
                out_dir = os.path.join(DIRECTORY, 'assets', 'reels')
                os.makedirs(out_dir, exist_ok=True)

                print(f"[REELS] Decoding metadata for video: {url}")
                
                # Query metadata via yt-dlp
                meta_cmd = ['yt-dlp', '--dump-json', '--no-warnings', '--no-playlist', url]
                meta_res = subprocess.run(meta_cmd, capture_output=True, text=True, timeout=30)
                
                # If metadata extraction fails entirely (e.g. invalid URL)
                if meta_res.returncode != 0:
                    # Check if it looks like a YouTube link to make a highly realistic mock
                    if 'youtube.com' in url.lower() or 'youtu.be' in url.lower():
                        self.send_success_response({
                            "status": "success",
                            "video_url": "mock",
                            "title": "YouTube Broadcast - Timeline Node",
                            "desc": f"Direct stream capture from YouTube node. URL: {url}",
                            "id": "yt_capture_fallback",
                            "duration": 45,
                            "gps": "35.6762, 139.6503 (Tokyo)",
                            "mood": "Calm",
                            "extractor": "youtube"
                        })
                        return
                    else:
                        error_msg = meta_res.stderr.strip() or "Failed to extract metadata."
                        self.send_error_response(f"Metadata extract failed: {error_msg}")
                        return

                meta = json.loads(meta_res.stdout)
                video_id = meta.get('id', 'video_id')
                title = meta.get('title', meta.get('description', f'Captured Video {video_id}'))
                duration = meta.get('duration', 0)
                thumbnail = meta.get('thumbnail', '')
                extractor = meta.get('extractor', 'generic')
                
                # Clean title for layout
                if len(title) > 60:
                    title = title[:57] + "..."

                # Download video stream
                print(f"[REELS] Pulling stream: {url} -> {video_id}.mp4")
                
                # If video is longer than 60 seconds, download only first 10 seconds
                if duration > 60:
                    dl_cmd = [
                        'yt-dlp',
                        '-f', 'mp4/best',
                        '--download-sections', '*00:00-00:10',
                        '--force-keyframes-at-cuts',
                        '-o', os.path.join(out_dir, f'{video_id}.mp4'),
                        '--no-warnings',
                        '--no-playlist',
                        url
                    ]
                else:
                    dl_cmd = [
                        'yt-dlp',
                        '-f', 'mp4/best',
                        '-o', os.path.join(out_dir, f'{video_id}.mp4'),
                        '--no-warnings',
                        '--no-playlist',
                        url
                    ]

                dl_res = subprocess.run(dl_cmd, capture_output=True, text=True, timeout=15)

                # Fallback to simulated playback if download step fails but metadata was verified
                if dl_res.returncode != 0:
                    print(f"[REELS WARN] Download failed but metadata exists. Falling back to mock player.")
                    video_url = "mock"
                else:
                    video_url = f"/assets/reels/{video_id}.mp4"
                
                # Setup coordinate/GPS mock based on some random local coordinates
                import random
                gps_coords = [
                    '-36.8485, 174.7633 (Auckland)',
                    '-41.2865, 174.7762 (Wellington)',
                    '-33.8688, 151.2093 (Sydney)',
                    '35.6762, 139.6503 (Tokyo)'
                ]
                gps = random.choice(gps_coords)

                self.send_success_response({
                    "status": "success",
                    "video_url": video_url,
                    "title": title,
                    "desc": meta.get('description', 'Decoded stream from captured video node.')[:150],
                    "id": video_id,
                    "duration": duration,
                    "thumbnail": thumbnail,
                    "gps": gps,
                    "mood": "Chaotic" if duration < 10 else "Calm",
                    "extractor": extractor
                })
            except Exception as e:
                import traceback
                traceback.print_exc()
                self.send_error_response(f"Backend Exception: {str(e)}")
        elif self.path == '/api/auto-sort':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                params = json.loads(post_data.decode('utf-8'))
                source_dir = params.get('source_dir', '').strip()
                
                if not source_dir:
                    self.send_error_response("Source directory path is required.")
                    return
                
                if not os.path.exists(source_dir) or not os.path.isdir(source_dir):
                    self.send_error_response(f"Directory '{source_dir}' does not exist or is not a directory.")
                    return
                
                import shutil
                import re
                
                media_types = {
                    'audio': ['.wav', '.mp3', '.ogg', '.flac', '.m4a', '.aac', '.wma'],
                    'video': ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.flv'],
                    'images': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff']
                }
                
                base_crew_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'crew')
                sorted_files = []
                
                for root, dirs, files in os.walk(source_dir):
                    for file in files:
                        lower_name = file.lower()
                        
                        # Find matched media type
                        ext = os.path.splitext(lower_name)[1]
                        matched_type = None
                        for m_type, extensions in media_types.items():
                            if ext in extensions:
                                matched_type = m_type
                                break
                                
                        if not matched_type:
                            continue

                        # Determine crew name from folder structure relative to source_dir
                        rel_path = os.path.relpath(root, source_dir)
                        if rel_path == '.' or not rel_path:
                            crew_name = os.path.basename(source_dir.rstrip(os.sep))
                        else:
                            parts = rel_path.split(os.sep)
                            first_folder = parts[0].lower().strip()
                            if first_folder in ['images', 'audio', 'video', 'reels']:
                                crew_name = os.path.basename(source_dir.rstrip(os.sep))
                            else:
                                crew_name = parts[0]

                        # Clean crew member folder name
                        crew_name = crew_name.lower().strip()
                        crew_name = re.sub(r'[^a-z0-9_]', '_', crew_name)
                        if not crew_name:
                            crew_name = 'unknown_crew'

                        # Determine destination filename (rename with folder/crew name prefix)
                        if not file.lower().startswith(crew_name + '_'):
                            dest_filename = f"{crew_name}_{file}"
                        else:
                            dest_filename = file
                            
                        # Construct paths
                        target_dir = os.path.join(base_crew_dir, crew_name, matched_type)
                        os.makedirs(target_dir, exist_ok=True)
                        
                        src_path = os.path.join(root, file)
                        dst_path = os.path.join(target_dir, dest_filename)
                        
                        try:
                            shutil.copy2(src_path, dst_path)
                            size_bytes = os.path.getsize(dst_path)
                            sorted_files.append({
                                "file": file,
                                "renamed": dest_filename,
                                "crew": crew_name,
                                "type": matched_type,
                                "size": size_bytes
                            })
                        except Exception as copy_err:
                            print(f"[SORTER ERROR] Failed to copy {file} to {dest_filename}: {copy_err}")
                
                self.send_success_response({
                    "status": "success",
                    "source": source_dir,
                    "count": len(sorted_files),
                    "sorted": sorted_files
                })
            except Exception as e:
                self.send_error_response(f"Internal sorter error: {str(e)}")
        elif self.path == '/api/open-kdenlive':
            try:
                # Find all reels or video files to pass as import list
                video_dir = os.path.join(DIRECTORY, 'assets', 'reels')
                video_files = []
                if os.path.exists(video_dir):
                    for f in os.listdir(video_dir):
                        if f.lower().endswith(('.mp4', '.avi', '.mov', '.webm')):
                            video_files.append(os.path.join(video_dir, f))
                
                # Launch kdenlive as detached background process
                cmd = ['kdenlive'] + video_files[:3] # Import up to 3 recent videos
                print(f"[BACKEND] Launching Kdenlive with: {cmd}")
                subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                self.send_success_response({"status": "success", "message": "Kdenlive launched successfully.", "files": video_files[:3]})
            except Exception as e:
                self.send_error_response(f"Failed to launch Kdenlive: {str(e)}")
                
        elif self.path == '/api/open-ardour':
            try:
                # Launch ardour as detached background process
                cmd = ['ardour']
                print(f"[BACKEND] Launching Ardour: {cmd}")
                subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                self.send_success_response({"status": "success", "message": "Ardour launched successfully."})
            except Exception as e:
                self.send_error_response(f"Failed to launch Ardour: {str(e)}")
        elif self.path == '/api/submit-to-radio':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                params = json.loads(post_data.decode('utf-8'))
                title = params.get('title', '').strip()
                url = params.get('url', '').strip()
                desc = params.get('desc', '').strip()
                artist = params.get('artist', 'Unknown').strip()
                price = int(params.get('price', 5))
                payment = params.get('payment', '').strip()
                
                if not title or not url:
                    self.send_error_response("Title and path/URL are required.")
                    return
                
                filepath = os.path.join(DIRECTORY, 'radio_submissions.json')
                data = []
                if os.path.exists(filepath):
                    try:
                        with open(filepath, 'r') as f:
                            data = json.load(f)
                    except:
                        pass
                
                # Check for duplicates
                if not any(t.get('src') == url for t in data):
                    data.append({
                        "title": title,
                        "src": url,
                        "desc": desc,
                        "artist": artist,
                        "price": price,
                        "payment": payment,
                        "status": params.get('status', 'pending'),
                        "timestamp": int(params.get('timestamp', 0))
                    })
                    with open(filepath, 'w') as f:
                        json.dump(data, f, indent=4)
                        
                self.send_success_response({"status": "success", "message": "Track submitted successfully."})
            except Exception as e:
                self.send_error_response(f"Submission failed: {str(e)}")
                
        elif self.path == '/api/triage-radio-track':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                params = json.loads(post_data.decode('utf-8'))
                url = params.get('src', '').strip()
                status = params.get('status', '').strip()
                
                if not url or not status:
                    self.send_error_response("Track src and status are required.")
                    return
                
                filepath = os.path.join(DIRECTORY, 'radio_submissions.json')
                if not os.path.exists(filepath):
                    self.send_error_response("Submissions file not found.")
                    return
                
                with open(filepath, 'r') as f:
                    data = json.load(f)
                
                updated = False
                new_data = []
                for t in data:
                    if t.get('src') == url:
                        updated = True
                        if status == 'deleted':
                            # Remove track from list
                            continue
                        else:
                            t['status'] = status
                    new_data.append(t)
                
                if updated:
                    with open(filepath, 'w') as f:
                        json.dump(new_data, f, indent=4)
                    self.send_success_response({"status": "success", "message": f"Track status updated to {status}."})
                else:
                    self.send_error_response("Track not found in submissions.")
            except Exception as e:
                self.send_error_response(f"Triage update failed: {str(e)}")
                
        elif self.path == '/api/record-purchase':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                params = json.loads(post_data.decode('utf-8'))
                artist = params.get('artist', '').strip().lower()
                amount = int(params.get('amount', 0))
                
                if not artist or amount <= 0:
                    self.send_error_response("Artist and amount are required.")
                    return
                    
                filepath = os.path.join(DIRECTORY, 'artist_ledgers.json')
                ledger = {}
                if os.path.exists(filepath):
                    try:
                        with open(filepath, 'r') as f:
                            ledger = json.load(f)
                    except:
                        pass
                
                if artist not in ledger:
                    ledger[artist] = {"earnings": 0, "withdrawals": 0}
                    
                ledger[artist]["earnings"] += amount
                
                with open(filepath, 'w') as f:
                    json.dump(ledger, f, indent=4)
                    
                self.send_success_response({"status": "success", "balance": ledger[artist]["earnings"] - ledger[artist]["withdrawals"]})
            except Exception as e:
                self.send_error_response(f"Record purchase failed: {str(e)}")
                
        elif self.path == '/api/artist-cashout':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                params = json.loads(post_data.decode('utf-8'))
                artist = params.get('artist', '').strip().lower()
                amount = int(params.get('amount', 0))
                
                if not artist or amount <= 0:
                    self.send_error_response("Artist and amount are required.")
                    return
                    
                filepath = os.path.join(DIRECTORY, 'artist_ledgers.json')
                ledger = {}
                if os.path.exists(filepath):
                    try:
                        with open(filepath, 'r') as f:
                            ledger = json.load(f)
                    except:
                        pass
                        
                if artist not in ledger or (ledger[artist]["earnings"] - ledger[artist]["withdrawals"] < amount):
                    self.send_error_response("Insufficient balance for withdrawal.")
                    return
                    
                ledger[artist]["withdrawals"] += amount
                
                with open(filepath, 'w') as f:
                    json.dump(ledger, f, indent=4)
                    
                self.send_success_response({"status": "success", "balance": ledger[artist]["earnings"] - ledger[artist]["withdrawals"]})
            except Exception as e:
                self.send_error_response(f"Withdrawal failed: {str(e)}")
        elif self.path == '/api/register-shop-album':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                params = json.loads(post_data.decode('utf-8'))
                title = params.get('title', '').strip()
                artist = params.get('artist', '').strip()
                url = params.get('url', '').strip()
                price = params.get('price', '').strip()
                payment = params.get('payment', '').strip()
                description = params.get('description', '').strip()
                
                if not title or not url or not artist:
                    self.send_error_response("Title, Artist, and Cloud URL are required.")
                    return
                    
                filepath = os.path.join(DIRECTORY, 'registered_albums.json')
                data = []
                if os.path.exists(filepath):
                    try:
                        with open(filepath, 'r') as f:
                            data = json.load(f)
                    except:
                        pass
                
                # Check for duplicate URLs
                if not any(a.get('url') == url for a in data):
                    data.append({
                        "title": title,
                        "artist": artist,
                        "url": url,
                        "price": price,
                        "payment": payment,
                        "description": description,
                        "timestamp": int(time.time()),
                        "sales_count": 0
                    })
                    with open(filepath, 'w') as f:
                        json.dump(data, f, indent=4)
                    self.send_success_response({"status": "success", "message": "Album registered successfully to the shop catalog."})
                else:
                    self.send_error_response("This album URL is already registered.")
            except Exception as e:
                self.send_error_response(f"Registration failed: {str(e)}")
        elif self.path == '/api/record-album-sale':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                params = json.loads(post_data.decode('utf-8'))
                url = params.get('url', '').strip()
                if not url:
                    self.send_error_response("Album URL is required.")
                    return
                filepath = os.path.join(DIRECTORY, 'registered_albums.json')
                data = []
                if os.path.exists(filepath):
                    try:
                        with open(filepath, 'r') as f:
                            data = json.load(f)
                    except:
                        pass
                updated = False
                for album in data:
                    if album.get('url') == url:
                        album['sales_count'] = album.get('sales_count', 0) + 1
                        updated = True
                        break
                if updated:
                    with open(filepath, 'w') as f:
                        json.dump(data, f, indent=4)
                    self.send_success_response({"status": "success", "message": "Album sale counter incremented."})
                else:
                    self.send_error_response("Album not found in registry.")
            except Exception as e:
                self.send_error_response(f"Record album sale failed: {str(e)}")
        elif self.path == '/api/record-artwork-sale':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                params = json.loads(post_data.decode('utf-8'))
                artwork_id = params.get('id', '').strip()
                if not artwork_id:
                    self.send_error_response("Artwork ID is required.")
                    return
                filepath = os.path.join(DIRECTORY, 'artwork_sales.json')
                data = {}
                if os.path.exists(filepath):
                    try:
                        with open(filepath, 'r') as f:
                            data = json.load(f)
                    except:
                        pass
                data[artwork_id] = data.get(artwork_id, 0) + 1
                with open(filepath, 'w') as f:
                    json.dump(data, f, indent=4)
                self.send_success_response({"status": "success", "message": "Artwork sale counter incremented.", "sales_count": data[artwork_id]})
            except Exception as e:
                self.send_error_response(f"Record artwork sale failed: {str(e)}")
        else:
            self.send_response(404)
            self.end_headers()

    def send_error_response(self, message):
        self.send_response(400)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"status": "error", "message": message}).encode('utf-8'))

    def send_success_response(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

if __name__ == '__main__':
    server_address = ('', PORT)
    httpd = http.server.HTTPServer(server_address, Dragon9BackendHandler)
    print(f"[START] Dragon 9 Dynamic Backend active on port {PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("[STOP] Shutting down backend.")
