from PIL import Image
import os, subprocess, sys

SVG_DIR = "newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/01-inputs/images/oficiales"
OUT_DIR = "newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil/09-exports/assets"
os.makedirs(OUT_DIR, exist_ok=True)

# Test if cairosvg available
try:
    import cairosvg
    HAVE_CAIRO = True
except:
    HAVE_CAIRO = False
    print("⚠️ cairosvg not available — trying rsvg-convert...")

# Mapping: (svg_basename, output_png, target_size, change_fill_to_white)
TASKS = [
    ("tarifa-movil-icon.svg",  "icon-tarifa-movil.png",    96,  False),
    ("tarifa-fibra-icon.svg",  "icon-tarifa-fibra.png",    96,  False),
    ("tarifa-fibra-movil-icon.svg", "icon-tarifa-convergente.png", 96, False),
    ("tarifa-tv-icon.svg",     "icon-tarifa-tv.png",       96,  False),
    ("aspecto1.svg",           "icon-aspecto-datos.png",   72,  True),
    ("aspecto2.svg",           "icon-aspecto-cobertura.png", 72, True),
    ("aspecto3.svg",           "icon-aspecto-paquetes.png",72,  True),
    ("aspecto4.svg",           "icon-aspecto-condiciones.png",72, True),
]

def convert_svg(svg_path, png_path, target_size, white_fill=False):
    """Convert SVG to PNG at exact target_size."""
    svg_content = open(svg_path, 'r').read()
    
    if white_fill:
        # Replace fill colors with white for use on purple badges
        import re
        svg_content = re.sub(r'fill="[^"]*"', 'fill="#FFFFFF"', svg_content)
    
    # Write temp SVG
    tmp_svg = "/tmp/_tmp_icon.svg"
    with open(tmp_svg, 'w') as f:
        f.write(svg_content)
    
    if HAVE_CAIRO:
        try:
            import cairosvg
            png_data = cairosvg.svg2png(url=tmp_svg, output_width=target_size, output_height=target_size)
            # Cairo returns bytes, write directly
            with open(png_path, 'wb') as f:
                f.write(png_data)
            return True
        except Exception as e:
            print(f"    cairosvg failed: {e}")
    
    # Fallback: rsvg-convert
    try:
        subprocess.run([
            "rsvg-convert", "-w", str(target_size), "-h", str(target_size),
            "-o", png_path, tmp_svg
        ], check=True, capture_output=True)
        return True
    except Exception as e:
        print(f"    rsvg-convert failed: {e}")
    
    # Second fallback: inkscape
    try:
        subprocess.run([
            "inkscape", "-w", str(target_size), "-h", str(target_size),
            "--export-filename", png_path, tmp_svg
        ], check=True, capture_output=True)
        return True
    except Exception as e:
        print(f"    inkscape failed: {e}")
    
    return False

results = []
for svg, png, size, white in TASKS:
    svg_path = os.path.join(SVG_DIR, svg)
    png_path = os.path.join(OUT_DIR, png)
    
    if not os.path.exists(svg_path):
        print(f"  ❌ {svg}: NOT FOUND")
        continue
    
    ok = convert_svg(svg_path, png_path, size, white)
    if ok:
        kb = os.path.getsize(png_path) / 1024
        results.append((png, kb))
        print(f"  ✅ {png}: {kb:.1f} KB ({size}×{size})")
    else:
        print(f"  ❌ {png}: conversion FAILED")

print("\n=== Summary ===")
for name, kb in results:
    print(f"  {name}: {kb:.1f} KB")

# Check weight range
weights = [kb for _, kb in results]
if weights:
    ratio = max(weights) / min(weights)
    print(f"\nWeight range ratio: max/min = {ratio:.2f}x", "✅" if ratio < 1.5 else "⚠️ >1.5x")