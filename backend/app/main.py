from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.database import engine, Base, get_db
from app.models import Device, Alert
from app.scanner import scan_network, save_devices_to_db, scan_ports

Base.metadata.create_all(bind=engine)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

app = FastAPI(
    title="YamaVision",
    description="Real-time network scanner that maps, monitors, and detects threats before anyone else does.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "YamaVision is watching your network!"}

@app.get("/health")
def health():
    return {"status": "online"}

@app.post("/scan")
async def trigger_scan(db: Session = Depends(get_db)):
    devices = scan_network()
    new_devices = save_devices_to_db(devices, db)
    all_devices = db.query(Device).all()
    all_alerts = db.query(Alert).all()
    await manager.broadcast({
        "devices": [{"id": d.id, "ip_address": d.ip_address, "mac_address": d.mac_address, "hostname": d.hostname, "is_online": d.is_online, "is_trusted": d.is_trusted} for d in all_devices],
        "alerts": [{"id": a.id, "alert_type": a.alert_type, "message": a.message, "created_at": str(a.created_at)} for a in all_alerts]
    })
    return {
        "status": "scan complete",
        "total_devices": len(devices),
        "new_devices": len(new_devices)
    }

@app.get("/devices")
def get_devices(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    return devices

@app.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).all()
    return alerts

@app.put("/devices/{device_id}/trust")
def trust_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        return {"error": "Device not found"}
    device.is_trusted = True
    db.commit()
    return {"message": f"{device.ip_address} marked as trusted"}

@app.put("/devices/{device_id}/untrust")
def untrust_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        return {"error": "Device not found"}
    device.is_trusted = False
    db.commit()
    return {"message": f"{device.ip_address} marked as untrusted"}

@app.get("/devices/{device_id}/ports")
def scan_device_ports(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        return {"error": "Device not found"}
    ports = scan_ports(device.ip_address)
    return {
        "device_ip": device.ip_address,
        "open_ports": ports
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/devices/{device_id}/os")
async def detect_device_os(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        return {"error": "Device not found"}
    from app.scanner import detect_os
    os_name = detect_os(device.ip_address)
    return {
        "device_ip": device.ip_address,
        "os": os_name
    }

@app.put("/devices/{device_id}/label")
def update_device_label(device_id: int, label: str, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        return {"error": "Device not found"}
    device.label = label
    db.commit()
    return {"message": f"Label updated to {label}"}

@app.put("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return {"error": "Alert not found"}
    alert.is_resolved = True
    db.commit()
    return {"message": "Alert resolved"}

@app.post("/scan/passive")
async def passive_scan_endpoint(duration: int = 15, db: Session = Depends(get_db)):
    """Passively monitor network traffic to discover devices"""
    from app.scanner import passive_scan
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as pool:
        devices = await loop.run_in_executor(pool, passive_scan, duration)
    new_devices = save_devices_to_db(devices, db)
    all_devices = db.query(Device).all()
    all_alerts = db.query(Alert).all()
    await manager.broadcast({
        "devices": [{"id": d.id, "ip_address": d.ip_address, "mac_address": d.mac_address, "hostname": d.hostname, "is_online": d.is_online, "is_trusted": d.is_trusted} for d in all_devices],
        "alerts": [{"id": a.id, "alert_type": a.alert_type, "message": a.message, "created_at": str(a.created_at)} for a in all_alerts]
    })
    return {
        "status": "passive scan complete",
        "total_devices": len(devices),
        "new_devices": len(new_devices)
    }