"""Haalt de kledingtekeningen uit de Aikelo-ontwerpbestanden (.dc.html) en schrijft elk als los SVG-bestand.
Gebruik: python3 -I extract.py <map met .dc.html> <uitvoermap>"""
import re, sys, os, json
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
boards = ["LongsleevesKeuze","LongsleevesKleuren","StreepKleuren","HoodiesKeuze","HoodiesKleuren2","ZipHoodiesKleuren"]
index = {}
for b in boards:
    s = open(os.path.join(src, b + ".dc.html")).read()
    svgs, depth, start = [], 0, None
    for m in re.finditer(r'<svg\b[^>]*>|</svg>', s):
        if m.group(0).startswith('<svg'):
            if depth == 0: start = m.start()
            depth += 1
        else:
            depth -= 1
            if depth == 0: svgs.append(s[start:m.end()])
    styles = re.findall(r'<style>(.*?)</style>', s, re.S)
    names = []
    for i, svg in enumerate(svgs):
        if 'xmlns="http://www.w3.org/2000/svg"' not in svg[:400]:
            svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"', 1)
        if 'xmlns:xlink' not in svg[:600] and 'xlink:' in svg:
            svg = svg.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"', 1)
        svg = re.sub(r'^<svg([^>]*?)\swidth="[^"]*"', r'<svg\1', svg, count=1)
        svg = re.sub(r'^<svg([^>]*?)\sheight="[^"]*"', r'<svg\1', svg, count=1)
        name = f"{b}-{i:02d}.svg"
        open(os.path.join(out, name), "w").write(svg)
        names.append((name, len(svg)))
    index[b] = names
    print(b, len(svgs), "styles:", [st[:80] for st in styles])
json.dump(index, open(os.path.join(out, "_index.json"), "w"), indent=1)
