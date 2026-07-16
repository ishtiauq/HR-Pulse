#!/usr/bin/env python3
"""
HR Pulse ZKTeco Biometric Device Sync Agent
===========================================
This script runs locally on your office server/PC. It connects to your ZKTeco
biometric attendance device over TCP/IP, downloads the punch transactions, 
and synchronizes them in real-time with your Google Drive HR Pulse database.

Requirements:
    pip install pyzk google-api-python-client google-auth-oauthlib google-auth-httplib2

Configuration:
    1. Place your Google Client Secrets JSON file as 'credentials.json' in the same directory.
    2. Configure the ZKTeco IP address and Port in the config section below.
    3. Run this script: Python zkteco_sync_agent.py
"""

import os
import json
import datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaInMemoryUpload

# ==================== CONFIGURATION ====================
DEVICE_IP = '192.168.1.201'  # Change to your ZKTeco IP
DEVICE_PORT = 4370            # Default ZK port
SCOPES = ['https://www.googleapis.com/auth/drive.appdata']
# ========================================================

def get_gdrive_service():
    """Authenticates and returns the Google Drive API service client."""
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    return build('drive', 'v3', credentials=creds)

def fetch_file_from_drive(service, filename):
    """Downloads a file from Google Drive AppFolder or initializes it if not found."""
    try:
        results = service.files().list(
            q=f"name='{filename}'",
            spaces='appDataFolder',
            fields="files(id, name)"
        ).execute()
        files = results.get('files', [])
        
        if not files:
            return None, None
        
        file_id = files[0]['id']
        content = service.files().get_media(fileId=file_id).execute()
        return file_id, json.loads(content.decode('utf-8'))
    except Exception as e:
        print(f"Error fetching from Google Drive: {e}")
        return None, None

def save_file_to_drive(service, file_id, content, filename):
    """Pushes the updated database JSON back to Google Drive."""
    try:
        media = MediaInMemoryUpload(
            json.dumps(content, indent=2).encode('utf-8'),
            mimetype='application/json'
        )
        if file_id:
            service.files().update(fileId=file_id, media_body=media).execute()
            print("Successfully updated database on Google Drive.")
        else:
            file_metadata = {
                'name': filename,
                'parents': ['appDataFolder']
            }
            new_file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id'
            ).execute()
            print(f"Initialized new file on Google Drive with ID: {new_file.get('id')}")
    except Exception as e:
        print(f"Error saving to Google Drive: {e}")

def pull_logs_from_device():
    """Connects to the physical ZKTeco machine and downloads punch logs."""
    from zk import ZK, const
    print(f"Connecting to ZKTeco device at {DEVICE_IP}:{DEVICE_PORT}...")
    zk = ZK(DEVICE_IP, port=DEVICE_PORT, timeout=5)
    conn = None
    punches = []
    try:
        conn = zk.connect()
        print("Connection successful! Disabling device default sleep state...")
        conn.disable_device()
        
        attendance = conn.get_attendance()
        print(f"Fetched {len(attendance)} historical transaction records.")
        
        for record in attendance:
            # record fields: user_id (string), timestamp (datetime), status (int), punch (int)
            punches.append({
                'employeeId': f"EMP-{record.user_id}",
                'timestamp': record.timestamp.isoformat(),
                'type': 'check_in' if record.punch == 0 else 'check_out'
            })
            
        conn.enable_device()
        return punches
    except Exception as e:
        print(f"Device communications failure: {e}")
        return []
    finally:
        if conn:
            conn.disconnect()
            print("Device disconnected.")

def sync_punches_to_database(punches):
    """Merges biometric transaction logs with the Google Drive database."""
    if not punches:
        print("No biometric logs to sync.")
        return
        
    print("Connecting to Google Drive App Storage...")
    service = get_gdrive_service()
    file_id, db = fetch_file_from_drive(service, 'attendance.json')
    
    if not db:
        db = {'leaves': [], 'balances': {}, 'dailyLogs': {}}
        print("No attendance ledger found in Drive. Initializing fresh DB template...")

    daily_logs = db.get('dailyLogs', {})
    updated_dates = set()

    for p in punches:
        # Parse timestamp: e.g. 2026-07-16T09:05:00
        dt = datetime.datetime.fromisoformat(p['timestamp'])
        date_key = dt.strftime('%Y-%m-%d')
        time_str = dt.strftime('%I:%M %p')  # 09:05 AM
        emp_id = p['employeeId']
        
        if date_key not in daily_logs:
            daily_logs[date_key] = {}
            
        if emp_id not in daily_logs[date_key]:
            # Initialize check-in log entry
            daily_logs[date_key][emp_id] = {
                'status': 'Present',
                'checkIn': '--',
                'checkOut': '--',
                'hours': '0.0'
            }
            
        entry = daily_logs[date_key][emp_id]
        
        # Determine check-in vs check-out ordering
        if p['type'] == 'check_in' or entry['checkIn'] == '--':
            entry['checkIn'] = time_str
            # Check if late (past 09:15 AM)
            if dt.hour > 9 or (dt.hour == 9 and dt.minute > 15):
                entry['status'] = 'Late'
            else:
                entry['status'] = 'Present'
        else:
            entry['checkOut'] = time_str
            
        # Calculate working hours if both clockings exist
        if entry['checkIn'] != '--' and entry['checkOut'] != '--':
            try:
                def to_hours(t_str):
                    t = datetime.datetime.strptime(t_str, '%I:%M %p')
                    return t.hour + t.minute / 60
                duration = to_hours(entry['checkOut']) - to_hours(entry['checkIn'])
                entry['hours'] = f"{max(0.0, duration):.1f}"
            except Exception:
                entry['hours'] = '9.0'
                
        daily_logs[date_key][emp_id] = entry
        updated_dates.add(date_key)
        
    db['dailyLogs'] = daily_logs
    save_file_to_drive(service, file_id, db, 'attendance.json')
    print(f"Sync complete. Updated logs for dates: {', '.join(updated_dates)}")

if __name__ == '__main__':
    try:
        punches = pull_logs_from_device()
        sync_punches_to_database(punches)
    except KeyboardInterrupt:
        print("\nSync operations aborted.")
