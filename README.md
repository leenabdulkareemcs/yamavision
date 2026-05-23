# YamaVision 

> Real-time network scanner that maps, monitors, and detects threats before anyone else does.

Inspired by **Zarqaa Al Yamamah** — the legendary Arabian woman who could see enemies from miles away. YamaVision does the same for your network.

---

## What it does

YamaVision is a full-stack network security monitoring system that:

- Scans your local network and discovers all connected devices
- Detects open ports on each device
- Identifies operating systems using Nmap fingerprinting
- Alerts you instantly when an unknown device joins your network
- Updates your dashboard in real-time via WebSockets
- Lets you label, trust, and manage every device on your network

---

## Tech Stack

**Backend**
- Python + FastAPI
- PostgreSQL + SQLAlchemy
- Scapy (ARP network scanning)
- Nmap (OS detection + port scanning)
- WebSockets (real-time updates)

**Frontend**
- React + Vite
- Axios
- Tailwind CSS

---

## Features

| Feature | Description |
|---|---|
| Network Scanner | ARP-based discovery of all devices on the network |
| Port Scanner | TCP connect scan on 15 common ports per device |
| OS Detection | Nmap TCP/IP fingerprinting to identify device OS |
| Real-time Updates | WebSocket connection pushes live data to dashboard |
| Device Trust | Mark devices as trusted or flag as suspicious |
| Device Labels | Name your devices for easy identification |
| Auto Scan | Automatically scan at configurable intervals |
| Alert System | Instant alerts when new devices join the network |
| Resolve Alerts | Mark alerts as resolved to keep dashboard clean |

---

## Screenshots

> Dashboard showing live network devices, port scan results, and alerts.
> Coming soon — run the app on your network to see live device discovery in action.
---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 22+
- PostgreSQL
- Nmap
- Npcap (Windows only)

### Backend Setup

Create a `.env` file in the backend folder:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/yamavision
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/devices` | Get all discovered devices |
| POST | `/scan` | Trigger a network scan |
| GET | `/devices/{id}/ports` | Scan ports on a device |
| GET | `/devices/{id}/os` | Detect OS of a device |
| PUT | `/devices/{id}/trust` | Mark device as trusted |
| PUT | `/devices/{id}/untrust` | Mark device as untrusted |
| PUT | `/devices/{id}/label` | Add label to a device |
| GET | `/alerts` | Get all alerts |
| PUT | `/alerts/{id}/resolve` | Resolve an alert |
| WS | `/ws` | WebSocket for real-time updates |

---

## Security Note

YamaVision is designed for use on networks you own or have explicit permission to scan. Always use responsibly.

---

## Author

Built by **Leen Abdulkareem** — CS student passionate about network security and AI.

- GitHub: [@leenabdulkareemcs](https://github.com/leenabdulkareemcs)

---

*"She could see what others couldn't. So can YamaVision."*
