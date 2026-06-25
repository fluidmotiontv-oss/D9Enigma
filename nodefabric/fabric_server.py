# Dragon 9 Distributed Node Fabric Server (V2)
# Implements the Triad Link Protocol & Node Handshake TCP Listener

import socket
import json
import threading
import os

PORT = 9099
HOST = '0.0.0.0'
MANIFEST_PATH = os.path.join(os.path.dirname(__file__), 'fabric_manifest.json')

# Initialize manifest file if it doesn't exist
if not os.path.exists(MANIFEST_PATH):
    initial_manifest = {
        "master_host": "primary_portal_engine",
        "connected_nodes": [
            {"id": "node_01", "status": "active", "type": "render_unit", "ip": "127.0.0.1"},
            {"id": "node_02", "status": "idle", "type": "compute_unit", "ip": "127.0.0.1"}
        ]
    }
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(initial_manifest, f, indent=4)

def register_node(node_id, ip_address, node_type="compute_unit"):
    print(f"[HANDSHAKE] Integrating Node {node_id} at {ip_address} into the Fabric.")
    
    try:
        with open(MANIFEST_PATH, 'r') as f:
            manifest = json.load(f)
    except Exception:
        manifest = {"master_host": "primary_portal_engine", "connected_nodes": []}

    # Avoid duplicate node entries
    nodes = manifest.get("connected_nodes", [])
    exists = False
    for n in nodes:
        if n["id"] == node_id:
            n["status"] = "active"
            n["ip"] = ip_address
            n["type"] = node_type
            exists = True
            break
            
    if not exists:
        nodes.append({
            "id": node_id,
            "status": "active",
            "type": node_type,
            "ip": ip_address
        })
        
    manifest["connected_nodes"] = nodes
    
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=4)
        
    return {"status": "connected", "node": node_id, "ip": ip_address}

def handle_client(client_socket, client_address):
    print(f"[CONNECTION] New socket link established with client at {client_address}")
    try:
        data = client_socket.recv(1024).decode('utf-8')
        if not data:
            return
            
        print(f"[RECEIVE] Raw Payload: {data}")
        try:
            payload = json.loads(data)
            action = payload.get("action")
            
            if action == "HANDSHAKE" or payload.get("protocol") == "Dragon_9_Triad":
                node_id = payload.get("node_id", f"node_{client_address[1]}")
                node_type = payload.get("node_type", "compute_unit")
                response = register_node(node_id, client_address[0], node_type)
                client_socket.send(json.dumps(response).encode('utf-8'))
            else:
                client_socket.send(json.dumps({"status": "error", "message": "Unknown protocol actions"}).encode('utf-8'))
        except json.JSONDecodeError:
            client_socket.send(json.dumps({"status": "error", "message": "Invalid JSON structure"}).encode('utf-8'))
    except Exception as e:
        print(f"[ERROR] Session error with client {client_address}: {e}")
    finally:
        client_socket.close()

def start_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind((HOST, PORT))
        server.listen(5)
        print(f"[START] Dragon 9 Distributed Node Fabric V2 listening on port {PORT}...")
    except Exception as e:
        print(f"[FATAL] Failed to start socket server: {e}")
        return

    while True:
        try:
            client_socket, client_address = server.accept()
            thread = threading.Thread(target=handle_client, args=(client_socket, client_address))
            thread.daemon = True
            thread.start()
        except KeyboardInterrupt:
            print("[STOP] Shutting down TCP Listener.")
            break
        except Exception as e:
            print(f"[ERROR] Accept socket failure: {e}")

if __name__ == '__main__':
    start_server()
