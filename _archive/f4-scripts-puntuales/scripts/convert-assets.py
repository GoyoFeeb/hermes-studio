"""Download SVGs and convert to PNG using Playwright (already installed)."""
import json, os, urllib.request
from playwright.sync_api import sync_playwright

ASSETS_DIR = "/Users/javifeebbo/Desktop/newsletter-system-reutilizable/sistema-final/newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/09-exports/assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

ASSETS = [
    ("logo-paraycompara", "https://paraycompara.com/assets/img/logo-paraycompara.svg", 400, 200, 55, "Logo header"),
    ("tarifa-movil-icon", "https://paraycompara.com/assets/img/tarifa-movil-icon.svg", 96, 48, 48, "Servicios - Móvil"),
    ("tarifa-fibra-icon", "https://paraycompara.com/assets/img/tarifa-fibra-icon.svg", 96, 48, 48, "Servicios - Fibra"),
    ("tarifa-fibra-movil-icon", "https://paraycompara.com/assets/img/tarifa-fibra-movil-icon.svg", 96, 48, 48, "Servicios - Fibra+Móvil"),
    ("tarifa-tv-icon", "https://paraycompara.com/assets/img/tarifa-tv-icon.svg", 96, 48, 48, "Servicios - TV"),
    ("aspecto1", "https://paraycompara.com/assets/img/aspecto1.svg", 80, 40, 40, "Educativo - Datos"),
    ("aspecto2", "https://paraycompara.com/assets/img/aspecto2.svg", 80, 40, 40, "Educativo - Cobertura"),
    ("aspecto3", "https://paraycompara.com/assets/img/aspecto3.svg", 80, 40, 40, "Educativo - Paquetes"),
    ("aspecto4", "https://paraycompara.com/assets/img/aspecto4.svg", 80, 40, 40, "Educativo - Precio"),
]

results = []

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    
    # First, inspect the logo SVG on a purple background to check contrast
    print("=== Inspecting logo SVG ===")
    resp = urllib.request.urlopen("https://paraycompara.com/assets/img/logo-paraycompara.svg")
    logo_svg = resp.read().decode("utf-8")
    print(f"Size: {len(logo_svg)} bytes")
    
    # Render logo on purple background
    page.set_content(f"""
    <html><body style="margin:0;background:#792771;display:flex;align-items:center;justify-content:center;height:200px">
      <img src="https://paraycompara.com/assets/img/logo-paraycompara.svg" style="width:400px;height:110px" />
    </body></html>
    """)
    page.screenshot(path=os.path.join(ASSETS_DIR, "_logo-on-purple.png"))
    print("✅ Logo on purple background captured: _logo-on-purple.png")

    # Now convert each SVG to PNG via Playwright screenshot
    print("\n=== Converting assets to PNG ===")
    for name, url, source_w, display_w, display_h, purpose in ASSETS:
        try:
            # Create an HTML page containing just the SVG scaled to desired pixel size
            svg_content = f"""
            <html><body style="margin:0;background:transparent;display:flex;align-items:center;justify-content:center;width:{source_w}px;height:{source_w}px">
              <img src="{url}" style="width:{source_w}px;height:{source_w}px" />
            </body></html>
            """
            page.set_content(svg_content)
            
            output_path = os.path.join(ASSETS_DIR, f"{name}.png")
            page.set_viewport_size({"width": source_w, "height": source_w})
            page.screenshot(path=output_path, clip={"x": 0, "y": 0, "width": source_w, "height": source_w})
            
            file_size = os.path.getsize(output_path)
            status = "✅" if file_size > 200 else "⚠️ small"
            print(f"  {status} {name}.png ({file_size} bytes, {source_w}x{source_w}, display {display_w}x{display_h})")
            
            results.append({"name": name, "purpose": purpose, "png_bytes": file_size, 
                          "display_w": display_w, "display_h": display_h, "path": output_path})
        except Exception as e:
            print(f"  ❌ {name}: {e}")
    
    browser.close()

# Save metadata
meta = {"created": "2026-07-09", "tool": "Playwright headless", "assets": results}
with open(os.path.join(ASSETS_DIR, "assets-metadata.json"), "w") as f:
    json.dump(meta, f, indent=2)

print(f"\n=== Done ===")
print(f"Total: {len(results)} assets converted")
print(f"Assets in: {ASSETS_DIR}")
