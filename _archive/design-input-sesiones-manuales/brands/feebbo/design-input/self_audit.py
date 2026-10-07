#!/usr/bin/env python3
"""Autoauditoría programática de la newsletter de Feebbo Digital (checklist del brief)."""
import re
from collections import Counter

with open('/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/feebbo-newsletter.html', 'r') as f:
    html = f.read()

print("=" * 60)
print("AUTOAUDITORÍA — feebbo-newsletter.html")
print("=" * 60)

# 1. Balance de tablas/td/tr
for tag in ['table', 'td', 'tr', 'a']:
    opens = len(re.findall(f'<{tag}[ >]', html))
    closes = len(re.findall(f'</{tag}>', html))
    status = "OK" if opens == closes else "FIX!"
    print(f"[{status}] <{tag}> balance: {opens} open / {closes} close")

# 2. Nombre de marca (máx 3)
brand = 'Feebbo Digital'
count = len(re.findall(re.escape(brand), html))
print(f"[{'OK' if count <= 3 else 'FIX!'}] Marca '{brand}': {count} apariciones (máx 3)")
for m in re.finditer(re.escape(brand), html):
    start = max(0, m.start() - 60)
    print(f"    → ...{html[start:m.end()+30].strip()[:90]}...")

# 3. CTAs únicos
print("\n--- CTAs (2x en fuente = VML + HTML fallback, correcto) ---")
for cta in ['Descubrir el método', 'Hablar con el equipo']:
    c = html.count(cta)
    print(f"[{'OK' if c == 2 else 'FIX!'}] '{cta}': {c}x en fuente (esperado 2: VML+HTML)")

# 4. Bloques de texto: conteo de palabras
print("\n--- Conteo de palabras por bloque de texto corrido (máx 40) ---")
texts = re.findall(r'<p[^>]*>(.*?)</p>', html, re.DOTALL)
clean = []
for t in texts:
    txt = re.sub(r'<[^>]+>', '', t).strip()
    if len(txt) > 15:
        clean.append(txt)
over = False
for i, t in enumerate(clean):
    words = len(t.split())
    flag = " **OVER 40**" if words > 40 else ""
    if flag: over = True
    print(f"  Bloque {i+1}: {words} palabras{flag}  | {t[:60]}...")
print(f"[{'OK' if not over else 'FIX!'}] Todos ≤ 40 palabras")

# 5. Duplicados entre bloques
dupes = [t for t, c in Counter(clean).items() if c > 1]
print(f"[{'OK' if not dupes else 'FIX!'}] Bloques duplicados: {len(dupes)} {dupes if dupes else ''}")

# 6. Placeholders
placeholders = re.findall(r'\[(?!if mso|endif\])(.*?)\]', html)
lorem = re.findall(r'lorem', html, re.I)
tokens = re.findall(r'\{\{', html)
print(f"[{'OK' if not placeholders else 'FIX!'}] Placeholders [...] : {placeholders if placeholders else 'limpio'}")
print(f"[{'OK' if not lorem else 'FIX!'}] Lorem: {'FIX' if lorem else 'limpio'}")
print(f"[{'OK' if not tokens else 'FIX!'}] Tokens dobles llaves: {'FIX' if tokens else 'limpio'}")

# 7. Logo real
imgs = re.findall(r'<img[^>]*>', html)
logo_imgs = [i for i in imgs if 'data:image' in i and ('alt="Feebbo' in i)]
print(f"[{'OK' if logo_imgs else 'FIX!'}] Logo como imagen real: {len(logo_imgs)} img con alt de marca")
css_logo = re.findall(r'<span[^>]*>FEBBO|FEEBBO\s*\{', html)
print(f"[{'OK' if not css_logo else 'FIX!'}] Logo simulado con CSS: {'FIX' if css_logo else 'limpio'}")

# 8. Escenas
scenes = len(re.findall(r'ESCENA \d', html))
print(f"[{'OK' if scenes <= 5 else 'FIX!'}] Escenas: {scenes} (rango 3-5)")

# 9. Datos sueltos sin verbo (patrones de cifras aisladas)
bare = re.findall(r'(?:·|&middot;|–|—)\s*(?:165|12|32)[^<]{0,20}', html)
print(f"[{'OK' if not bare else 'FIX!'}] Cifras sueltas en barras: {bare if bare else 'limpio'}")

# 10. URLs externas e imágenes
ext_imgs = re.findall(r'src="(https?://[^"]+)"', html)
print(f"[{'OK' if not ext_imgs else 'FIX!'}] Imágenes externas sin base64: {ext_imgs if ext_imgs else 'todas embebidas (data URI)'}")
links = re.findall(r'href="([^"]+)"', html)
print("Enlaces:")
for l in links:
    print(f"    - {l}")

print("\n" + "=" * 60)
