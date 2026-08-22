import subprocess
import time
import re
import sys

def run_tunnel():
    cmd = [
        "ssh",
        "-o", "StrictHostKeyChecking=no",
        "-o", "ServerAliveInterval=30",
        "-o", "ServerAliveCountMax=3",
        "-R", "80:127.0.0.1:8000",
        "serveo.net"
    ]
    print("[Tunnel] Starting Serveo tunnel connection...")
    while True:
        try:
            p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
            for line in iter(p.readline, ''):
                sys.stdout.write(line)
                sys.stdout.flush()
            p.wait()
            print("[Tunnel] Connection dropped. Reconnecting in 3 seconds...")
            time.sleep(3)
        except Exception as e:
            print(f"[Tunnel Error] {e}. Retrying in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    run_tunnel()
