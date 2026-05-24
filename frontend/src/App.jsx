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
      setDevices(res.data.sort((a, b) => a.id - b.id))
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

  const toggleTrust = async (deviceId, isTrusted) => {
    try {
      const action = isTrusted ? "untrust" : "trust"
      await axios.put(`${API}/devices/${deviceId}/${action}`)
      await fetchDevices()
    } catch (err) { console.error(err) }
  }

  const scanPorts = async (deviceId) => {
    try {
      const res = await axios.get(`${API}/devices/${deviceId}/ports`)
      setDevices(prev => prev.map(d =>
        d.id === deviceId ? { ...d, open_ports: res.data.open_ports } : d
      ))
    } catch (err) { console.error(err) }
  }

  const detectOS = async (deviceId) => {
    try {
      const res = await axios.get(`${API}/devices/${deviceId}/os`)
      setDevices(prev => prev.map(d =>
        d.id === deviceId ? { ...d, os: res.data.os } : d
      ))
    } catch (err) { console.error(err) }
  }

  const updateLabel = async (deviceId, label) => {
  try {
    await axios.put(`${API}/devices/${deviceId}/label?label=${label}`)
    await fetchDevices()
  } catch (err) { console.error(err) }
}

const resolveAlert = async (alertId) => {
  try {
    await axios.put(`${API}/alerts/${alertId}/resolve`)
    await fetchAlerts()
  } catch (err) { console.error(err) }
}

const triggerPassiveScan = async (duration = 30) => {
  setScanning(true)
  try {
    await axios.post(`${API}/scan/passive?duration=${duration}`)
    await fetchDevices()
    await fetchAlerts()
    setLastScan(new Date().toLocaleTimeString())
  } catch (err) { console.error(err) }
  setScanning(false)
}

const loadDemoData = () => {
  setDevices([
    { id: 1, ip_address: "192.168.1.1", mac_address: "a4:91:b1:2c:3d:4e", hostname: "router.local", label: "Router", is_online: true, is_trusted: true },
    { id: 2, ip_address: "192.168.1.5", mac_address: "f8:4d:89:ab:cd:ef", hostname: "iPhone-Leen", label: "iPhone", is_online: true, is_trusted: true },
    { id: 3, ip_address: "192.168.1.8", mac_address: "3c:22:fb:12:34:56", hostname: "MacBook-Pro", label: "MacBook", is_online: true, is_trusted: true },
    { id: 4, ip_address: "192.168.1.12", mac_address: "00:11:22:33:44:55", hostname: "Samsung-TV", label: "Smart TV", is_online: true, is_trusted: true },
    { id: 5, ip_address: "192.168.1.15", mac_address: "dc:a6:32:78:90:ab", hostname: "RaspberryPi", label: "Pi Server", is_online: true, is_trusted: false },
    { id: 6, ip_address: "192.168.1.19", mac_address: "b8:27:eb:cd:ef:12", hostname: null, label: "", is_online: false, is_trusted: false },
    { id: 7, ip_address: "192.168.1.22", mac_address: "44:65:0d:34:56:78", hostname: "Android-Phone", label: "Android", is_online: true, is_trusted: false },
    { id: 8, ip_address: "192.168.1.31", mac_address: "18:fe:34:90:ab:cd", hostname: null, label: "", is_online: true, is_trusted: false },
  ])
  setAlerts([
    { id: 1, alert_type: "NEW_DEVICE", message: "New device detected: 192.168.1.19 (b8:27:eb:cd:ef:12)", is_resolved: false, created_at: "2026-05-22 10:30:00" },
    { id: 2, alert_type: "NEW_DEVICE", message: "New device detected: 192.168.1.31 (18:fe:34:90:ab:cd)", is_resolved: false, created_at: "2026-05-22 11:15:00" },
  ])
}

  useEffect(() => {
    fetchDevices()
    fetchAlerts()
  }, [])

  useEffect(() => {
    if (!autoScan) return
    const interval = setInterval(() => {
      triggerScan()
    }, scanInterval * 1000)
    return () => clearInterval(interval)
  }, [autoScan, scanInterval])

  useEffect(() => {
    let ws
    let reconnectTimer

    const connect = () => {
      ws = new WebSocket("ws://localhost:8000/ws")
      ws.onopen = () => console.log("WebSocket connected")
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setDevices(data.devices.sort((a, b) => a.id - b.id))
        setAlerts(data.alerts)
      }
      ws.onerror = (err) => console.error("WebSocket error:", err)
      ws.onclose = () => {
        console.log("WebSocket disconnected — reconnecting in 3s")
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimer)
      if (ws) ws.close()
    }
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: "#090b10", color: "#c9c3d4", fontFamily: "monospace", padding: "2rem" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", borderBottom: "0.5px solid #1e1b2e", paddingBottom: "1.5rem" }}>
        <div>
          <div style={{ fontSize: "24px", fontWeight: "300", letterSpacing: "8px", color: "#e8e4f0", fontFamily: "Rajdhani, monospace" }}>
            YAMA<span style={{ color: "#9d6fff", fontWeight: "600" }}>VISION</span>
          </div>
          <div style={{ fontSize: "11px", color: "#3d3556", letterSpacing: "3px", marginTop: "4px" }}>
            NETWORK MONITOR
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <button
            onClick={triggerScan}
            disabled={scanning}
            style={{ background: scanning ? "#9d6fff" : "transparent", border: "0.5px solid #9d6fff", color: scanning ? "#090b10" : "#9d6fff", padding: "10px 24px", fontSize: "12px", letterSpacing: "2px", cursor: "pointer", fontFamily: "monospace", transition: "all 0.2s" }}
          >
            {scanning ? "SCANNING..." : "SCAN NETWORK"}
          </button>
            <button
              onClick={() => triggerPassiveScan(60)}
              disabled={scanning}
              style={{ background: "transparent", border: "0.5px solid #f87171", color: "#f87171", padding: "10px 24px", fontSize: "12px", letterSpacing: "2px", cursor: "pointer", fontFamily: "monospace", transition: "all 0.2s", marginLeft: "8px" }}
            >
              {scanning ? "SCANNING..." : "PASSIVE SCAN"}
            </button>
            <button
              onClick={loadDemoData}
              style={{ background: "transparent", border: "0.5px solid #fbbf24", color: "#fbbf24", padding: "10px 24px", fontSize: "12px", letterSpacing: "2px", cursor: "pointer", fontFamily: "monospace", transition: "all 0.2s", marginLeft: "8px" }}
            >
              DEMO MODE
            </button>
          {lastScan && <div style={{ fontSize: "10px", color: "#3d3556", marginTop: "6px", letterSpacing: "1px" }}>LAST SCAN {lastScan}</div>}
          <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end" }}>
            <span style={{ fontSize: "10px", color: "#3d3556", letterSpacing: "1px" }}>AUTO SCAN</span>
            <div
              onClick={() => setAutoScan(!autoScan)}
              style={{ width: "36px", height: "18px", background: autoScan ? "#9d6fff" : "#1e1b2e", borderRadius: "9px", cursor: "pointer", position: "relative", transition: "background 0.2s" }}
            >
              <div style={{ position: "absolute", top: "2px", left: autoScan ? "18px" : "2px", width: "14px", height: "14px", background: "#e8e4f0", borderRadius: "50%", transition: "left 0.2s" }} />
            </div>
            <select
              value={scanInterval}
              onChange={e => setScanInterval(Number(e.target.value))}
              style={{ background: "#090b10", border: "0.5px solid #1e1b2e", color: "#3d3556", fontSize: "10px", padding: "3px 6px", fontFamily: "monospace", letterSpacing: "1px" }}
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "2.5rem" }}>
        {[
          { label: "TOTAL DEVICES", value: devices.length, color: "#9d6fff" },
          { label: "ONLINE", value: devices.filter(d => d.is_online).length, color: "#4ade80" },
          { label: "ALERTS", value: alerts.length, color: "#f87171" },
        ].map((stat, i) => (
          <div key={i} style={{ background: "#0e1018", border: "0.5px solid #1e1b2e", padding: "1.25rem", borderRadius: "4px" }}>
            <div style={{ fontSize: "10px", color: "#3d3556", letterSpacing: "2px" }}>{stat.label}</div>
            <div style={{ fontSize: "36px", fontWeight: "500", color: stat.color, marginTop: "6px" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Devices */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "10px", color: "#3d3556", letterSpacing: "3px", marginBottom: "1rem" }}>— DEVICES</div>
        {devices.map(device => (
          <div key={device.id} style={{ background: "#0e1018", border: "0.5px solid #1e1b2e", borderRadius: "4px", padding: "1rem 1.25rem", marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", color: "#e8e4f0", letterSpacing: "1px" }}>{device.ip_address}</div>
                <div style={{ fontSize: "11px", color: "#3d3556", marginTop: "3px" }}>{device.mac_address}</div>
                <div style={{ fontSize: "11px", color: "#5a5272", marginTop: "2px" }}>{device.hostname || "unknown"}</div>
                <div style={{ marginTop: "6px", display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  defaultValue={device.label || ""}
                  placeholder="add label..."
                  onBlur={(e) => updateLabel(device.id, e.target.value)}
                  style={{ background: "transparent", border: "none", borderBottom: "0.5px solid #3d3556", color: "#9d6fff", fontSize: "11px", fontFamily: "monospace", letterSpacing: "1px", outline: "none", width: "120px", padding: "2px 0" }}
                />
              </div>    
              </div>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "1px", padding: "3px 10px", border: `0.5px solid ${device.is_online ? "#4ade80" : "#1e1b2e"}`, color: device.is_online ? "#4ade80" : "#3d3556" }}>
                  {device.is_online ? "ONLINE" : "OFFLINE"}
                </div>
                <div
                  onClick={(e) => { e.stopPropagation(); toggleTrust(device.id, device.is_trusted) }}
                  style={{ fontSize: "10px", letterSpacing: "1px", cursor: "pointer", padding: "3px 10px", border: `0.5px solid ${device.is_trusted ? "#4ade80" : "#1e1b2e"}`, color: device.is_trusted ? "#4ade80" : "#3d3556" }}
                >
                  {device.is_trusted ? "TRUSTED" : "MARK TRUSTED"}
                </div>
                <div
                  onClick={() => scanPorts(device.id)}
                  style={{ fontSize: "10px", letterSpacing: "1px", cursor: "pointer", padding: "3px 10px", border: "0.5px solid #9d6fff", color: "#9d6fff" }}
                >
                  SCAN PORTS
                </div>
                <div
                  onClick={() => detectOS(device.id)}
                  style={{ fontSize: "10px", letterSpacing: "1px", cursor: "pointer", padding: "3px 10px", border: "0.5px solid #38bdf8", color: "#38bdf8" }}
                >
                  DETECT OS
                </div>
              </div>
            </div>
            {device.open_ports && device.open_ports.length > 0 && (
              <div style={{ marginTop: "12px", borderTop: "0.5px solid #1e1b2e", paddingTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {device.open_ports.map(p => (
                  <div key={p.port} style={{ fontSize: "10px", padding: "3px 8px", border: "0.5px solid #9d6fff", color: "#9d6fff", letterSpacing: "1px" }}>
                    {p.port} {p.service}
                  </div>
                ))}
              </div>
            )}
            {device.open_ports && device.open_ports.length === 0 && (
              <div style={{ marginTop: "8px", fontSize: "10px", color: "#3d3556", letterSpacing: "1px" }}>NO OPEN PORTS FOUND</div>
            )}
            {device.os && (
              <div style={{ marginTop: "8px", fontSize: "10px", color: "#38bdf8", letterSpacing: "1px" }}>
                OS: {device.os}
              </div>
            )}
          </div>
        ))}
      </div>

        {/* Alerts */}
        <div>
          <div style={{ fontSize: "10px", color: "#3d3556", letterSpacing: "3px", marginBottom: "1rem" }}>— ALERTS</div>
          {alerts.filter(a => !a.is_resolved).length === 0 && (
            <div style={{ fontSize: "11px", color: "#3d3556", letterSpacing: "1px" }}>NO ACTIVE ALERTS</div>
          )}
          {alerts.filter(a => !a.is_resolved).map(alert => (
            <div key={alert.id} style={{ background: "#0e1018", border: "0.5px solid #2d1515", borderRadius: "4px", padding: "1rem 1.25rem", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#f87171", letterSpacing: "2px" }}>{alert.alert_type}</div>
                <div style={{ fontSize: "12px", color: "#5a5272", marginTop: "6px" }}>{alert.message}</div>
              </div>
              <div
                onClick={() => resolveAlert(alert.id)}
                style={{ fontSize: "10px", letterSpacing: "1px", cursor: "pointer", padding: "3px 10px", border: "0.5px solid #4ade80", color: "#4ade80", whiteSpace: "nowrap", marginLeft: "12px" }}
              >
                RESOLVE
              </div>
            </div>
          ))}
        </div>
    </div>
  )
}