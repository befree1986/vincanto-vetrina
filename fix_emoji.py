#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os

files_to_fix = [
    'src/components/admin/AdminDashboard.tsx',
    'src/components/AdminPanelBasic.tsx',
    'src/pages/AdminPanelPro.tsx'
]

emoji_replacements = {
    'ðŸ"Š': '📊',
    'ðŸ"ˆ': '📈',
    'â‚¬': '€',
    'ðŸ'°': '💰',
    'ðŸ"…': '📅',
    'ðŸ"†': '📆',
    'ðŸ›Žï¸': '🛎️',
    'ðŸ›Ž': '🛎️',
    'ðŸ"': '🔄',
    'ðŸŽ¯': '🎯',
    'âœ…': '✅',
    'âš ï¸': '⚠️',
    'â�': '❌',
    'ðŸ"§': '🔧',
    'ðŸ"¥': '🔥',
    'ðŸŸ¡': '🟡',
    'ðŸ' ': '🏠',
    'ðŸ¨': '🏨',
    'ðŸ¡': '🏡',
    'ðŸ"¤': '📤',
    'ðŸ"�': '📋',
    'ðŸ§ª': '🧪',
    'ðŸ"�': '📄',
    'ðŸ"Œ': '📌',
    'â­�': '⭐',
    'ðŸ"±': '📱',
    'ðŸ'¼': '💼',
    'ðŸŽ¨': '🎨',
    'ðŸ"'': '🔑',
    'ðŸš€': '🚀',
    'ðŸŽ‰': '🎉',
    'ðŸ"Ž': '🔎',
    'ðŸ"': '🔒',
    'â�Œ': '❌',
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ã�': 'à',
}

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        print(f"⚠️  File not found: {file_path}")
        continue
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        for old, new in emoji_replacements.items():
            content = content.replace(old, new)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed: {file_path}")
        else:
            print(f"ℹ️  No changes needed: {file_path}")
            
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")

print("\n🎉 Emoji fix completed!")
