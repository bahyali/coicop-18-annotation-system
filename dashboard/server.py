#!/usr/bin/env python3
"""
Simple HTTP server for COICOP Dashboard
Serves the dashboard on port 7896
"""

import http.server
import socketserver
import os

PORT = 7896
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == '__main__':
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"")
        print(f"╔═══════════════════════════════════════════════╗")
        print(f"║    COICOP Dashboard Server                    ║")
        print(f"╠═══════════════════════════════════════════════╣")
        print(f"║  Dashboard: http://localhost:{PORT}            ║")
        print(f"║  Status: Running ✓                            ║")
        print(f"╚═══════════════════════════════════════════════╝")
        print(f"")
        print(f"Press Ctrl+C to stop the server")
        print(f"")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nShutting down dashboard server...")
            httpd.shutdown()
