import { useState, useEffect } from "react"
import axios from "axios"

const API = "http://localhost:8000"

export default function App() {
  const [devices, setDevices] = useState([])
  const [alerts, setAlerts] = useState([])
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState(null)
  const [autoScan, setAutoScan] = useState(false)
  const [scanInterval, setScanInterval] = useState(30)

  const fetchDevices = async () => {
    try {
      const res = await axios.get(`${API}/devices`)
      setDevices(res.data)
    } catch (err) { console.error(err) }
  }

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API}/alerts`)
      setAlerts(res.data)
    } catch (err) { console.error(err) }
  }

  const triggerScan = async () => {
    setScanning(true)
    try {
      await axios.post(`${API}/scan`)
      await fetchDevices()
      await fetchAlerts()
      setLastScan(new Date().toLocaleTimeString())
    } catch (err) { console.error(err) }
    setScanning(false)
  }

  useEffect(() => {
    fetchDevices()
    fetchAlerts()
  }, [])

// ADD THIS RIGHT HERE
useEffect(() => {
  if (!autoScan) return
  
  const interval = setInterval(() => {
    triggerScan()
  }, scanInterval * 1000)

  return () => clearInterval(interval)
}, [autoScan, scanInterval])

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0eb", color: "#1a1a2e", fontFamily: "monospace", padding: "2rem" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", borderBottom: "0.5px solid #d1d1e0", paddingBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: "24px", fontWeight: "300", letterSpacing: "8px", color: "#1a1a2e" }}>
            YAMA<span style={{ color: "#6d4aad", fontWeight: "600" }}>VISION</span>
          </div>
          <div style={{ fontSize: "11px", color: "#9e8f8f", letterSpacing: "3px", marginTop: "4px" }}>
            NETWORK MONITOR
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <button
            onClick={triggerScan}
            disabled={scanning}
            style={{ background: scanning ? "#6d4aad" : "transparent", border: "0.5px solid #7c3aed", color: scanning ? "faf7f4" : "#6d4aad", padding: "10px 24px", fontSize: "12px", letterSpacing: "2px", cursor: "pointer", fontFamily: "monospace", transition: "all 0.2s" }}
          >
            {scanning ? "SCANNING..." : "SCAN NETWORK"}
          </button>
          {lastScan && <div style={{ fontSize: "10px", color: "#9e8f8f", marginTop: "6px", letterSpacing: "1px" }}>LAST SCAN {lastScan}</div>}
        </div>
      </div>

<div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
  <span style={{ fontSize: "10px", color: "#9e8f8f", letterSpacing: "1px" }}>AUTO SCAN</span>
  <div
    onClick={() => setAutoScan(!autoScan)}
    style={{ width: "36px", height: "18px", background: autoScan ? "#6d4aad" : "#e0d8d0", borderRadius: "9px", cursor: "pointer", position: "relative", transition: "background 0.2s" }}
  >
    <div style={{ position: "absolute", top: "2px", left: autoScan ? "18px" : "2px", width: "14px", height: "14px", background: "#fff", borderRadius: "50%", transition: "left 0.2s" }} />
  </div>
  <select
    value={scanInterval}
    onChange={e => setScanInterval(Number(e.target.value))}
    style={{ background: "transparent", border: "0.5px solid #e0d8d0", color: "#9e8f8f", fontSize: "10px", padding: "3px 6px", fontFamily: "monospace", letterSpacing: "1px" }}
  >
    <option value={10}>10s</option>
    <option value={30}>30s</option>
    <option value={60}>1m</option>
    <option value={300}>5m</option>
  </select>
</div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "2.5rem" }}>
        {[
          { label: "TOTAL DEVICES", value: devices.length, color: "#6d4aad" },
          { label: "ONLINE", value: devices.filter(d => d.is_online).length, color: "#059669" },
          { label: "ALERTS", value: alerts.length, color: "#dc2626" },
        ].map((stat, i) => (
          <div key={i} style={{ background: "#faf7f4", border: "0.5px solid #e0d8d0", padding: "1.25rem", borderRadius: "4px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: "10px", color: "#9e8f8f", letterSpacing: "2px" }}>{stat.label}</div>
            <div style={{ fontSize: "36px", fontWeight: "500", color: stat.color, marginTop: "6px" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Devices */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "10px", color: "#9e8f8f", letterSpacing: "3px", marginBottom: "1rem" }}>— DEVICES</div>
        {devices.map(device => (
          <div key={device.id} style={{ background: "#faf7f4", border: "0.5px solid #e0d8d0", borderRadius: "4px", padding: "1rem 1.25rem", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div>
              <div style={{ fontSize: "14px", color: "#2d2438", letterSpacing: "1px" }}>{device.ip_address}</div>
              <div style={{ fontSize: "11px", color: "#9e8f8f", marginTop: "3px" }}>{device.mac_address}</div>
              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{device.hostname || "unknown"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", letterSpacing: "1px", padding: "3px 10px", border: `0.5px solid ${device.is_online ? "#059669" : "#d1d1e0"}`, color: device.is_online ? "#059669" : "#a0a0b8" }}>
                {device.is_online ? "ONLINE" : "OFFLINE"}
              </div>
              <div style={{ fontSize: "10px", color: "#9e8f8f", marginTop: "6px", letterSpacing: "1px" }}>
                {device.is_trusted ? "TRUSTED" : "UNTRUSTED"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div>
        <div style={{ fontSize: "10px", color: "#9e8f8f", letterSpacing: "3px", marginBottom: "1rem" }}>— ALERTS</div>
        {alerts.map(alert => (
          <div key={alert.id} style={{ background: "faf7f4", border: "0.5px solid #fecaca", borderRadius: "4px", padding: "1rem 1.25rem", marginBottom: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: "10px", color: "#dc2626", letterSpacing: "2px" }}>{alert.alert_type}</div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>{alert.message}</div>
          </div>
        ))}
      </div>

    </div>
  )
}