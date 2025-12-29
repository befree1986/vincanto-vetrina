# -*- coding: utf-8 -*-
import codecs

files_to_fix = [
    r'src\components\admin\AdminDashboard.tsx',
    r'src\components\AdminPanelBasic.tsx',
]

for file_path in files_to_fix:
    try:
        # Leggi come bytes
        with open(file_path, 'rb') as f:
            content_bytes = f.read()
        
        # Decodifica come latin-1 (preserva tutti i byte)
        content = content_bytes.decode('latin-1')
        
        # Sostituisci le emoji corrotte (sequenze specifiche)
        replacements = [
            ('Ã°Å¸â€œÅ ', '📊'),  # dashboard icon
            ('Ã°Å¸â€œË†', '📈'),  # chart increasing
            ('Ã¢â€šÂ¬', '€'),     # euro sign
            ('Ã°Å¸â€™Â°', '💰'),  # money bag
            ('Ã°Å¸â€œâ€¦', '📅'),  # calendar
            ('Ã°Å¸â€œâ€ ', '📆'),  # tear-off calendar
            ('Ã°Å¸â€ºÅ½', '🛎'),  # bellhop bell
            ('Ã°Å¸â€�â€�', '🔄'),  # counterclockwise arrows
            ('Ã°Å¸ÂÅ¾', '🎯'),    # direct hit
            ('Ã¢Å"â€¦', '✅'),    # check mark
            ('Ã¢Å¡ï¸', '⚠️'),    # warning
            ('Ã¢Ë†â€™', '❌'),    # cross mark
            ('Ã°Å¸â€�Â§', '🔧'),  # wrench
            ('Ã°Å¸â€�Â¥', '🔥'),  # fire
            ('Ã°Å¸ÅŸÂ¡', '🟡'),  # yellow circle
            ('Ã°Å¸Â Â ', '🏠'),  # house
            ('Ã°Å¸Â¨', '🏨'),    # hotel
            ('Ã°Å¸Â¡', '🏡'),    # house with garden
            ('Ã°Å¸â€œÂ¤', '📤'),  # outbox tray
        ]
        
        for old, new in replacements:
            content = content.replace(old, new)
        
        # Scrivi come UTF-8
        with codecs.open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Fixed: {file_path}")
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

print("Done!")
