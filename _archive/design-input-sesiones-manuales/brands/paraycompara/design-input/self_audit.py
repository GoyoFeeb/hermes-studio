#!/usr/bin/env python3
"""Autoauditoría programática (checklist punto 5) sobre el HTML final."""
import re
from collections import Counter

with open("/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/paraycompara-newsletter.html", "r") as f:
    html = f.read()

print("=== ESTRUCTURA ===")
for tag in ["table", "td", "tr"]:
    opens = len(re.findall(rf"<{tag}[ >]", html))
    closes = len(re.findall(rf"</{tag}>", html))
    print(f"{tag}: {opens} open / {closes} close -> {'OK' if opens == closes else 'ROTO!'}")

print("\n=== MARCA (max 3) ===")
brand = "Para y Compara"
count = len(re.findall(re.escape(brand), html))
print(f"Ocurrencias visibles+alt de '{brand}': {count}")
print("alt con marca:", re.findall(r'alt="[^"]*Para y Compara[^"]*"', html))
print("URL paraycompara.com como texto:", len(re.findall(r'>paraycompara\.com<', html)))

print("\n=== CTAs (con MSO = 2 esperado por botón bulletproof) ===")
for cta in ["Ver cómo funciona", "Comparar tarifas", "Elegir mi tarifa"]:
    n = html.count(cta)
    mso_stripped = re.sub(r"<!--\[if mso\]>.*?<!\[endif\]-->", "", html, flags=re.S)
    print(f"'{cta}': {n}x en fuente (esperado 2), {mso_stripped.count(cta)}x renderizado (esperado 1)")

print("\n=== TEXTO DUPLICADO (bloques > 20 chars) ===")
texts = re.findall(r'<td[^>]*style="[^"]*font-family[^"]*"[^>]*>(.*?)</td>', html, re.DOTALL)
cleaned = [re.sub(r"<[^>]+>", "", t).strip() for t in texts if len(re.sub(r"<[^>]+>", "", t).strip()) > 20]
dupes = [t for t, c in Counter(cleaned).items() if c > 1]
print("Duplicados:", dupes if dupes else "(limpio)")

print("\n=== PLACEHOLDERS / LOREM ===")
placeholders = re.findall(r"\[(?!if mso|endif\]|if !mso)(.*?)\]", html)
print("Corchetes de contenido:", placeholders if placeholders else "(limpio, solo comentarios MSO)")
print("Lorem:", "¡ROTO!" if re.search(r"lorem", html, re.I) else "(limpio)")
print("Tokens {{ sin resolver:", "¡ROTO!" if "{{" in html else "(limpio)")

print("\n=== LOGO ===")
logo_imgs = re.findall(r'<img[^>]*alt="Para y Compara"[^>]*>', html)
print("img con alt='Para y Compara' (logo real):", len(logo_imgs))
css_logo = re.findall(r'<span[^>]*>Para y Compara|Para y Compara\s*\{', html)
print("Logo simulado con CSS/texto:", css_logo if css_logo else "(limpio)")
print("Base64 logo presente:", "data:image/png;base64,iVBORw0KGgo" in html)

print("\n=== PALABRAS POR BLOQUE (max 40) ===")
over = False
for i, block in enumerate(cleaned):
    words = len(block.split())
    flag = " **OVER 40**" if words > 40 else ""
    if flag: over = True
    print(f"  Bloque {i+1}: {words} palabras{flag}")
print("Todos <= 40:", "PASS" if not over else "FIX!")

print("\n=== ESCENAS ===")
scenes = re.findall(r"ESCENA (\d) · ([A-ZÁÉÍÓÚÑ ]+)", html)
print(f"{len(scenes)} escenas:", scenes)

print("\n=== NÚMEROS SUELTOS (dígito fuera de frase con verbo, heurístico) ===")
# Buscar secuencias de párrafos que empiecen o consistan solo en cifras + unidad
bare = re.findall(r">\s*[\d.,]+(?:€|%|GB|MB|€/mes)?\s*<", html)
print("Cifras aisladas entre etiquetas:", bare if bare else "(limpio)")
