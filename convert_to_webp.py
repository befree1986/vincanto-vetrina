import os
from PIL import Image

# Percorso di partenza
root_dir = os.path.join(os.path.dirname(__file__), 'public')

# Estensioni da convertire
exts = ['.jpg', '.jpeg', '.png', '.gif', '.psd']

for subdir, _, files in os.walk(root_dir):
    for file in files:
        ext = os.path.splitext(file)[1].lower()
        if ext in exts:
            src_path = os.path.join(subdir, file)
            dst_path = os.path.splitext(src_path)[0] + '.webp'
            try:
                with Image.open(src_path) as im:
                    im.save(dst_path, 'webp', quality=85)
                print(f'Convertito: {src_path} -> {dst_path}')
            except Exception as e:
                print(f'Errore su {src_path}: {e}')
