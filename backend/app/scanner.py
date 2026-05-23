import scapy.all as scapy
import psutil
import socket
from datetime import datetime

def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def get_network_range():
    """Get the network range to scan e.g 192.168.1.0/24"""
    local_ip = get_local_ip()
    parts = local_ip.split(".")
    network = f"{parts[0]}.{parts[1]}.{parts[2]}.0/24"
    return network

def scan_network():
    """Scan the network and return list of devices"""
    network_range = get_network_range()
    print(f"🔍 Scanning network: {network_range}")
    
    # ARP scan — sends ARP requests to every IP in the range
    arp_request = scapy.ARP(pdst=network_range)
    broadcast = scapy.Ether(dst="ff:ff:ff:ff:ff:ff")
    arp_request_broadcast = broadcast / arp_request
    
    answered_list = scapy.srp(
        arp_request_broadcast, 
        timeout=2, 
        verbose=False
    )[0]
    
    devices = []
    for element in answered_list:
        device = {
            "ip_address": element[1].psrc,
            "mac_address": element[1].hwsrc,
            "hostname": get_hostname(element[1].psrc),
            "last_seen": datetime.now()
        }
        devices.append(device)
    
    print(f"✅ Found {len(devices)} devices")
    return devices

def get_hostname(ip):
    """Try to get hostname from IP"""
    try:
        hostname = socket.gethostbyaddr(ip)[0]
        return hostname
    except:
        return None
    
def save_devices_to_db(devices, db):
    """Save scanned devices to the database"""
    from app.models import Device, Alert
    
    new_devices = []
    
    for device_data in devices:
        # Check if device already exists
        existing = db.query(Device).filter(
            Device.ip_address == device_data["ip_address"]
        ).first()
        
        if existing:
            # Update last seen
            existing.last_seen = device_data["last_seen"]
            existing.is_online = True
        else:
            # New device found — create alert
            new_device = Device(
                ip_address=device_data["ip_address"],
                mac_address=device_data["mac_address"],
                hostname=device_data["hostname"],
                is_online=True,
                is_trusted=False
            )
            db.add(new_device)
            new_devices.append(device_data["ip_address"])
            
            # Create alert for new device
            alert = Alert(
                device_ip=device_data["ip_address"],
                alert_type="NEW_DEVICE",
                message=f"New device detected: {device_data['ip_address']} ({device_data['mac_address']})"
            )
            db.add(alert)
    
    db.commit()
    print(f"✅ Saved {len(new_devices)} new devices to database")
    return new_devices

def scan_ports(ip, ports=[21,22,23,25,53,80,110,143,443,445,3306,3389,5900,8080,8443]):
    """Scan common ports on a device"""
    open_ports = []
    for port in ports:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.5)
            result = s.connect_ex((ip, port))
            if result == 0:
                open_ports.append({
                    "port": port,
                    "service": get_service_name(port)
                })
            s.close()
        except:
            pass
    return open_ports

def get_service_name(port):
    """Get common service name for a port"""
    services = {
        21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
        53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
        443: "HTTPS", 445: "SMB", 3306: "MySQL",
        3389: "RDP", 5900: "VNC", 8080: "HTTP-Alt", 8443: "HTTPS-Alt"
    }
    return services.get(port, "Unknown")

def detect_os(ip):
    """Try to detect OS of a device using nmap"""
    try:
        import nmap
        nm = nmap.PortScanner()
        nm.scan(ip, arguments="-O --osscan-guess")
        if ip in nm.all_hosts():
            os_matches = nm[ip].get('osmatch', [])
            if os_matches:
                return os_matches[0]['name']
        return "Unknown"
    except:
        return "Unknown"