"""Zet een kleur in de kledingtekeningen om naar een nieuwe kleur.

- Kleurcodes in de SVG (bijv. fill="#2E4A3B") worden vervangen.
- Ingebouwde PNG-afbeeldingen (de hoodies) worden pixel voor pixel omgekleurd:
  elke pixel schuift evenveel op als de basiskleur, zodat schaduw en naden blijven.

Gebruik: python3 -I recolor.py <oud #hex> <nieuw #hex> <svg-bestand> [...]
"""
import sys, re, zlib, struct, base64
from collections import Counter

def hex2rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def png_decode(data):
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    pos, idat, ihdr = 8, b'', None
    while pos < len(data):
        n = struct.unpack('>I', data[pos:pos+4])[0]; t = data[pos+4:pos+8]; body = data[pos+8:pos+8+n]
        if t == b'IHDR': ihdr = struct.unpack('>IIBBBBB', body)
        elif t == b'IDAT': idat += body
        pos += 12 + n
    w, h, depth, ctype, _, _, interlace = ihdr
    assert depth == 8 and ctype in (2, 6) and interlace == 0, ihdr
    bpp = 4 if ctype == 6 else 3
    raw = zlib.decompress(idat); stride = w * bpp
    out = bytearray(h * stride); prev = bytearray(stride); i = 0
    for y in range(h):
        f = raw[i]; i += 1
        line = bytearray(raw[i:i+stride]); i += stride
        for x in range(stride):
            a = line[x-bpp] if x >= bpp else 0; b = prev[x]; c = prev[x-bpp] if x >= bpp else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + ((a + b) >> 1)) & 255
            elif f == 4:
                p = a + b - c; pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        out[y*stride:(y+1)*stride] = line; prev = line
    return w, h, bpp, out

def png_encode(w, h, bpp, px):
    stride = w * bpp
    raw = b''.join(b'\x00' + bytes(px[y*stride:(y+1)*stride]) for y in range(h))
    def chunk(t, b): return struct.pack('>I', len(b)) + t + b + struct.pack('>I', zlib.crc32(t + b) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6 if bpp == 4 else 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

def recolor_png(b64, target):
    w, h, bpp, px = png_decode(base64.b64decode(b64))
    # basiskleur = meest voorkomende (bijna) ondoorzichtige kleur
    cnt = Counter()
    for i in range(0, len(px), bpp * 7):
        if bpp == 3 or px[i+3] > 200: cnt[(px[i], px[i+1], px[i+2])] += 1
    base = cnt.most_common(1)[0][0]
    # elke pixel schuift evenveel op als de basiskleur; zo blijven lijnen en schaduw neutraal
    shift = [target[k] - base[k] for k in range(3)]
    for i in range(0, len(px), bpp):
        for k in range(3):
            v = px[i+k] + shift[k]
            px[i+k] = 255 if v > 255 else 0 if v < 0 else v
    return base64.b64encode(png_encode(w, h, bpp, px)).decode(), base

old, new = sys.argv[1], sys.argv[2]
target = hex2rgb(new)
for f in sys.argv[3:]:
    s = open(f).read()
    n_hex = len(re.findall(re.escape(old), s, re.I))
    s = re.sub(re.escape(old), new.upper(), s, flags=re.I)
    bases = []
    def rep(m):
        out, base = recolor_png(m.group(1), target); bases.append('#%02X%02X%02X' % base)
        return 'data:image/png;base64,' + out
    s = re.sub(r'data:image/png;base64,([A-Za-z0-9+/=]+)', rep, s)
    open(f, 'w').write(s)
    print(f, 'kleurcodes:', n_hex, 'afbeeldingen:', len(bases), ('basis was ' + ', '.join(bases)) if bases else '')
