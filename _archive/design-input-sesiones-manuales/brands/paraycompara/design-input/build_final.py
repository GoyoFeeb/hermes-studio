#!/usr/bin/env python3
"""Interpola las imágenes base64 en la plantilla y genera el HTML final en la raíz del proyecto."""
import base64, os, sys

ROOT = "/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final"
SRC_DIR = os.path.join(ROOT, "brands/paraycompara/design-input")
OUT = os.path.join(ROOT, "paraycompara-newsletter.html")

def b64(path, mime):
    with open(path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode("ascii")

tokens = {
    "{{LOGO_B64}}": b64(os.path.join(SRC_DIR, "logo-paraycompara-clear.png"), "image/png"),
    "{{FAMILIA_B64}}": b64(os.path.join(SRC_DIR, "familia-600.jpg"), "image/jpeg"),
    "{{CHICOS_B64}}": b64(os.path.join(SRC_DIR, "chicos-600.jpg"), "image/jpeg"),
}

with open(os.path.join(SRC_DIR, "PLANTILLA-con-tokens-NO-ABRIR.html"), "r", encoding="utf-8") as f:
    html = f.read()

for token, value in tokens.items():
    assert token in html, f"token no encontrado: {token}"
    html = html.replace(token, value)

assert "{{" not in html, "quedan tokens sin resolver"
assert "/9j/" in html, "falta cabecera JPEG"
assert "iVBORw0KGgo" in html, "falta cabecera PNG"

with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

print(f"OK -> {OUT} ({os.path.getsize(OUT)/1024:.0f} KB)")
