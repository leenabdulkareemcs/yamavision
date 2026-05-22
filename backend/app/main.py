from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, Base, get_db
from app.models import Device, Alert
from app.scanner import scan_network, save_devices_to_db

# Create all tables
Base.metadata.create_all(bind=engine)

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
def trigger_scan(db: Session = Depends(get_db)):
    """Trigger a network scan and save results to database"""
    devices = scan_network()
    new_devices = save_devices_to_db(devices, db)
    return {
        "status": "scan complete",
        "total_devices": len(devices),
        "new_devices": len(new_devices)
    }

@app.get("/devices")
def get_devices(db: Session = Depends(get_db)):
    """Get all devices from database"""
    devices = db.query(Device).all()
    return devices

@app.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    """Get all alerts from database"""
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