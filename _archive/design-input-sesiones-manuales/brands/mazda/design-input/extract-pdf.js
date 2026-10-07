import sys, os
try:
    import fitz  # PyMuPDF
except ImportError:
    try:
        import pypdf
    except ImportError:
        print("NO_FITZ_NO_PYPDF")
        sys.exit(0)
    out = []
    with open(sys.argv[1], "rb") as f:
        r = pypdf.PdfReader(f)
        for i, p in enumerate(r.pages):
            t = p.extract_text() or ""
            out.append(f"=== PAGE {i+1} ===\n{t}")
    print("\n".join(out)[:20000])
    sys.exit(0)
doc = fitz.open(sys.argv[1])
out = []
for i, page in enumerate(doc):
    out.append(f"=== PAGE {i+1} ===\n{page.get_text()}")
print("\n".join(out)[:40000])
