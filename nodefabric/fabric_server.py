# Dragon 9 Distributed Node Fabric Server (V2)
# Implements the Triad Link Protocol & Node Handshake TCP & WebSocket Listeners

import asyncio
import json
import os
import websockets

PORT_TCP = 9099
PORT_WS = 9100
HOST = '0.0.0.0'
MANIFEST_PATH = os.path.join(os.path.dirname(__file__), 'fabric_manifest.json')

# In-memory states
websocket_clients = set()
# We track node overrides (e.g. which node indices are offline/desynced)
node_states = {} # maps node index (str) to state (e.g. "offline", "desynced")
# We track registered identities
registered_identities = {} # maps did (str) to identity metadata dict

def init_manifest():
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
        if os.path.exists(MANIFEST_PATH):
            with open(MANIFEST_PATH, 'r') as f:
                manifest = json.load(f)
        else:
            manifest = {"master_host": "primary_portal_engine", "connected_nodes": []}
    except Exception:
        manifest = {"master_host": "primary_portal_engine", "connected_nodes": []}

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

# Broadcast message to all WebSocket clients
async def broadcast_ws(msg_dict):
    if not websocket_clients:
        return
    msg_str = json.dumps(msg_dict)
    # Create list to avoid modification during iteration
    for ws in list(websocket_clients):
        try:
            await ws.send(msg_str)
        except Exception:
            websocket_clients.remove(ws)

# TCP Client Handler (asyncio)
async def handle_tcp_client(reader, writer):
    address = writer.get_extra_info('peername')
    print(f"[TCP CONNECTION] New socket link from {address}")
    try:
        data = await reader.read(1024)
        if not data:
            return
        
        payload_str = data.decode('utf-8')
        print(f"[TCP RECEIVE] Raw Payload: {payload_str}")
        try:
            payload = json.loads(payload_str)
            action = payload.get("action")
            
            if action == "HANDSHAKE" or payload.get("protocol") == "Dragon_9_Triad":
                node_id = payload.get("node_id", f"node_{address[1]}")
                node_type = payload.get("node_type", "compute_unit")
                response = register_node(node_id, address[0], node_type)
                writer.write(json.dumps(response).encode('utf-8'))
                await writer.drain()
                
                # Broadcast this join to all web dashboards
                await broadcast_ws({
                    "action": "NODE_JOINED",
                    "node_id": node_id,
                    "ip": address[0],
                    "type": node_type
                })
            else:
                writer.write(json.dumps({"status": "error", "message": "Unknown protocol actions"}).encode('utf-8'))
                await writer.drain()
        except json.JSONDecodeError:
            writer.write(json.dumps({"status": "error", "message": "Invalid JSON structure"}).encode('utf-8'))
            await writer.drain()
    except Exception as e:
        print(f"[TCP ERROR] Session error with client {address}: {e}")
    finally:
        writer.close()
        try:
            await writer.wait_closed()
        except Exception:
            pass
        print(f"[TCP CLOSED] Connection with {address} closed")

# WebSocket Handler
async def handle_ws_client(websocket):
    print(f"[WS CONNECTION] Client connected: {websocket.remote_address}")
    websocket_clients.add(websocket)
    try:
        # Send initial state synchronization (offline nodes list & registered identities)
        await websocket.send(json.dumps({
            "action": "SYNC_STATE",
            "node_states": node_states,
            "registered_identities": registered_identities
        }))
        
        async for message in websocket:
            try:
                data = json.loads(message)
                action = data.get("action")
                print(f"[WS RECEIVE] Action: {action} from {websocket.remote_address}")
                
                if action in ["GOSSIP_PULSE", "CALIBRATE", "TEST_FLOOD", "HEAL", "RADIO_TALKBACK"]:
                    # Broadcast the action to all other clients
                    await broadcast_ws(data)
                elif action == "SET_NODE_STATUS":
                    index = data.get("index")
                    status = data.get("status")
                    if status == "online":
                        node_states.pop(str(index), None)
                    else:
                        node_states[str(index)] = status
                    # Broadcast status change to everyone
                    await broadcast_ws({
                        "action": "NODE_STATUS_CHANGE",
                        "index": index,
                        "status": status
                    })
                elif action == "REGISTER_IDENTITY":
                    did = data.get("did")
                    alias = data.get("alias")
                    node = data.get("node")
                    resonance = data.get("resonance")
                    pubkey = data.get("pubkey")
                    
                    if did:
                        identity_info = {
                            "alias": alias,
                            "node": node,
                            "resonance": resonance,
                            "pubkey": pubkey
                        }
                        registered_identities[did] = identity_info
                        print(f"[IDENTITY] Registered DID: {did} for '{alias}'")
                        
                        # Broadcast join to all connected dashboards
                        await broadcast_ws({
                            "action": "IDENTITY_REGISTERED",
                            "did": did,
                            "identity": identity_info
                        })
            except Exception as e:
                print(f"[WS ERROR] Failed to parse message: {e}")
    except websockets.exceptions.ConnectionClosed:
        print(f"[WS DISCONNECT] Client disconnected: {websocket.remote_address}")
    finally:
        if websocket in websocket_clients:
            websocket_clients.remove(websocket)

async def main():
    init_manifest()
    
    # Start TCP Server on 9099
    tcp_server = await asyncio.start_server(handle_tcp_client, HOST, PORT_TCP)
    print(f"[START] TCP socket server listening on port {PORT_TCP}...")
    
    # Start WebSocket Server on 9100
    async with websockets.serve(handle_ws_client, HOST, PORT_WS):
        print(f"[START] WebSocket server listening on port {PORT_WS}...")
        # Keep running
        await asyncio.gather(
            tcp_server.serve_forever(),
        )

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("[STOP] Shutting down Node Fabric servers.")
