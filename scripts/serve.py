"""Lokale testserver met nette URL's (/shop -> shop.html), net als Firebase Hosting.
Gebruik: python3 scripts/serve.py  ->  http://localhost:8080"""
import http.server, os, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def send_head(self):
        path = self.path.split('?', 1)[0].split('#', 1)[0]
        fs = os.path.join(ROOT, path.lstrip('/'))
        if path != '/' and not os.path.exists(fs) and os.path.exists(fs + '.html'):
            self.path = path + '.html' + (self.path[len(path):])
        elif path != '/' and not os.path.exists(fs):
            self.send_response(404); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.end_headers()
            return open(os.path.join(ROOT, '404.html'), 'rb')
        return super().send_head()
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
print(f'aikelo draait op http://localhost:{port}')
http.server.ThreadingHTTPServer(('127.0.0.1', port), H).serve_forever()
