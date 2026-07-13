# K.I.T.E. Sovereign Shield Dashboard: Off-Grid User Guide & Best Practices

Welcome to the **K.I.T.E. Sovereign Shield** dashboard (`kiterider/index.html`), a private command escort console designed to assert civil liberties under the New Zealand Bill of Rights Act (NZBORA), record audio telemetry to an offline blackbox vault, and broadcast secure distress payloads to bystanders.

This guide outlines the system architecture, features, and best practices for operational readiness.

---

## 🛡️ Core Capabilities

### 1. Web Speech Rights Broadcaster
Asserts legal rights in real-time using synthesized voice protocols:
- **Right to Silence (NZBORA Section 23)**: Proclaims your choice to remain silent and consult a lawyer.
- **Search Warrant Demand (NZBORA Section 21)**: Proclaims security against unreasonable search and demands legal statutory authority or a warrant.
- **Detention Challenge (Am I Free to Go?)**: Inquires if you are free to leave or requests immediate legal grounds for detention.
- **Traffic Encounter**: States compliance with driver identity requirements under the Land Transport Act, while reserving the right to remain silent on activities or destination.
- **Custom Statement Broadcast**: Text-to-speech option to type custom proclamations and project them onto the "windshield display."

### 2. Blackbox Digital Audio Logs (IndexedDB)
Captures and secures cabin interactions offline without needing network access:
- **Zero-Cloud Security**: Audio files are compressed to `.webm` and stored locally inside the browser's **IndexedDB** database. No data is sent over the internet.
- **Recordings Ledger**: Track recordings by ID, local time, and active location coordinates.
- **Operations**:
  - **Playback**: Play recordings directly inside the console.
  - **Export**: Download files to your device for legal backup.
  - **Delete**: Permanently clear audio files from the off-grid database.

### 3. Station Safety Diagnostics
Monitors threat levels and adjusts emergency operational guidelines:
- 🟢 **SAFE**: Green status. Reminds you to remain calm, keep hands visible, and notify others that you are audio recording.
- 🟡 **WARN**: Amber status. Instructs you to clarify if you are detained ("Officer, am I free to go?") and avoid exiting the vehicle.
- 🔴 **RISK**: Red status. Instructs clear assertion of Section 23 rights and non-consent to search.
- ⚪ **PANIC**: Critical status. Elevates threat levels, logs emergency status, and automatically spawns the **Distress Beacon QR**.

### 4. Distress Beacon QR Broadcast
- Generates a high-integrity offline QR code carrying critical event telemetry (current time, active coordinates, threat levels, and timestamps).
- **Use Case**: In high-confrontation encounters, bystanders can scan the QR code to capture a cryptographic timestamped signature of the event, ensuring evidence is distributed immediately.

---

## ⚙️ How to Operate K.I.T.E.

1. **Activate Audio Context & Permission**:
   - Ensure the browser is granted **Microphone Access**. K.I.T.E. will request permission on clicking **Start Recording**.
2. **Setting the Tone**:
   - Use the slider inputs to adjust **Pitch** and **Rate** to tune the mechanical synthesis voice to your desired speed and authoritativeness.
3. **Muting / Resetting**:
   - Click **Muting K.I.T.E. Synthesis** at any time to instantly terminate speech.

---

## 💡 Operational Best Practices

### 1. Ensure Offline Capability
- Because K.I.T.E. uses IndexedDB, Service Workers, and SpeechSynthesis, the dashboard is **100% offline functional**. 
- **Tip**: Save the K.I.T.E. dashboard as a bookmark or home-screen icon on your phone. In off-grid zones (like remote roads or forests), it will load and operate perfectly.

### 2. Clear Browser Storage Cautiously
- Clearing your browser cache or site data *can* wipe IndexedDB databases. 
- **Best Practice**: Export and download important blackbox files (`.webm`) to your device's local filesystem or cloud backup immediately after an encounter to prevent loss during browser cleanup.

### 3. Maintain Calm Assertions
- Speak politely, adjust the voice parameters to a slow and clear rate (`0.85` velocity is recommended), and let the mechanical voice broadcast your statements clearly to ensure they are captured on recording devices.
- Place your device on a dashboard mount where the screen is visible to you and observers.
