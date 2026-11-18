"""Kopieert de uitgepakte tekeningen naar public/img/p/ met namen per product, kleur en kant.
Gebruik: python3 -I copy_images.py <map met uitgepakte svg's> <public/img/p>"""
import sys, os, shutil
raw, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
plan = []
def pair(board, i, name): plan.append((f"{board}-{i:02d}.svg", f"{name}-voor.svg")); plan.append((f"{board}-{i+1:02d}.svg", f"{name}-achter.svg"))
# Longsleeves A, B, J: beige uit het keuze-bord, overige kleuren uit het kleuren-bord
for r, d in enumerate(["stuiterend", "echo", "stempel"]):
    pair("LongsleevesKeuze", r*2, f"ls-{d}-beige")
    for c, col in enumerate(["navy", "bordeaux", "wit", "groen"]):
        pair("LongsleevesKleuren", r*8 + c*2, f"ls-{d}-{col}")
for c, col in enumerate(["navy", "groen", "grijs"]):
    pair("StreepKleuren", c*2, f"streep-{col}")
for i, (d, col) in enumerate([("holle-letters","beige"),("nummer","espresso"),("verticaal","zwart"),("poster","bordeaux-beige")]):
    pair("HoodiesKeuze", i*2, f"hoodie-{d}-{col}")
for kind, board in [("hoodie","HoodiesKleuren2"),("zip","ZipHoodiesKleuren")]:
    for r, d in enumerate(["holle-letters","nummer","verticaal","poster"]):
        for c, col in enumerate(["navy","bordeaux","grijs","groen"]):
            pair(board, r*8 + c*2, f"{kind}-{d}-{col}")
for a, b in plan: shutil.copyfile(os.path.join(raw, a), os.path.join(out, b))
print(len(plan), "bestanden")
