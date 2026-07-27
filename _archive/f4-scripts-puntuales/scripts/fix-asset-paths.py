import json, os, shutil

campaign = 'newsletters/2026/paraycompara/2026-jul-ahorra-fibra-movil'
data_path = os.path.join(campaign, '06-data/newsletter-data.json')
preview_path = os.path.join(campaign, '06-data/newsletter-data.preview.json')
assets_dir = os.path.abspath(os.path.join(campaign, '09-exports/assets'))

# Copy original to preview
shutil.copy2(data_path, preview_path)

# Read preview copy
with open(preview_path) as f:
    data = json.load(f)

asset_prefix = 'file://' + assets_dir + '/'

def fix_paths(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == 'src' and isinstance(v, str) and v.startswith('assets/'):
                obj[k] = asset_prefix + v.replace('assets/', '')
            else:
                fix_paths(v)
    elif isinstance(obj, list):
        for item in obj:
            fix_paths(item)

fix_paths(data)

with open(preview_path, 'w') as f:
    json.dump(data, f, indent=2)

print(f'✅ Preview JSON created: {preview_path}')
print(f'   Original untouched: {data_path}')
print(f'   Asset prefix: {asset_prefix}')