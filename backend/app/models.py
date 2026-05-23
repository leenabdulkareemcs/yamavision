from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True)
    mac_address = Column(String, unique=True, index=True)
    hostname = Column(String, nullable=True)
    label = Column(String, nullable=True)
    device_type = Column(String, nullable=True)
    is_trusted = Column(Boolean, default=False)
    is_online = Column(Boolean, default=False)
    first_seen = Column(DateTime, server_default=func.now())
    last_seen = Column(DateTime, onupdate=func.now())

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    device_ip = Column(String, index=True)
    alert_type = Column(String)
    message = Column(String)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())