import re, os, shutil

campaign = 'newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil'
export_dir = os.path.join(campaign, '09-exports')
html_path = os.path.join(export_dir, 'final.html')
inline_path = os.path.join(export_dir, 'final-inline.html')
assets_dir = os.path.abspath(os.path.join(export_dir, 'assets'))

for label, path in [('HTML', html_path), ('inline', inline_path)]:
    with open(path) as f:
        html = f.read()
    
    # Replace 'assets/' with absolute file:// path
    html_fixed = re.sub(r'(src=")assets/', r'\1file://' + assets_dir + '/', html)
    
    fixed_path = path.replace('.html', '-preview.html')
    with open(fixed_path, 'w') as f:
        f.write(html_fixed)
    
    count = html_fixed.count('file://')
    print(f'✅ {label} preview: {fixed_path} ({count} file:// paths)')

# Verify originals are clean
for label, path in [('HTML', html_path), ('inline', inline_path)]:
    with open(path) as f:
        content = f.read()
    has_file = 'file://' in content
    has_user = '/Users/javifeebbo' in content
    print(f'   Original {label}: file://={has_file} /Users=⛔{"⚠️" if has_user else "✅"}')