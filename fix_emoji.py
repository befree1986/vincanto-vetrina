#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script per riparare emoji e caratteri speciali corrotti nei file del progetto."""
import os
import re

files_to_fix = [
    'src/components/admin/AdminDashboard.tsx',
    'src/components/AdminPanelBasic.tsx',
    'src/pages/AdminPanelPro.tsx',
    'src/pages/AdminPanelPro.css'
]

# Mappa di sostituzione diretta per casi noti
direct_replacements = {
    # Euro symbol
    '\u20ac': '€',
    'â\x82¬': '€',
    
    # Common emoji fixes - usando unicode corretti
    '\U0001f4ca': '📊',  # Chart
    '\U0001f4c8': '📈',  # Trending up
    '\U0001f4b0': '💰',  # Money bag
    '\U0001f4c5': '📅',  # Calendar
    '\U0001f4c6': '📆',  # Calendar torn
    '\U0001f6ce': '🛎️',  # Bellhop bell
    '\U0001f504': '🔄',  # Refresh
    '\U0001f3af': '🎯',  # Target
    '\u2705': '✅',      # Check mark
    '\u26a0': '⚠️',      # Warning
    '\u274c': '❌',      # Cross mark
    '\U0001f527': '🔧',  # Wrench
    '\U0001f525': '🔥',  # Fire
    '\U0001f7e1': '🟡',  # Yellow circle
    '\U0001f3e0': '🏠',  # House
    '\U0001f3e8': '🏨',  # Hotel
    '\U0001f3e1': '🏡',  # House with garden
    '\U0001f4e4': '📤',  # Outbox
    '\U0001f4cb': '📋',  # Clipboard
    '\U0001f9ea': '🧪',  # Test tube
    '\U0001f4c4': '📄',  # Page
    '\U0001f4cc': '📌',  # Pushpin
    '\u2b50': '⭐',      # Star
    '\U0001f4f1': '📱',  # Mobile
    '\U0001f4bc': '💼',  # Briefcase
    '\U0001f3a8': '🎨',  # Artist palette
    '\U0001f511': '🔑',  # Key
    '\U0001f680': '🚀',  # Rocket
    '\U0001f389': '🎉',  # Party
    '\U0001f50e': '🔎',  # Magnifying glass
    '\U0001f512': '🔒',  # Lock
    
    # Italian accented characters
    '\u00e9': 'é',
    '\u00e8': 'è',
    '\u00e0': 'à',
    '\u00f2': 'ò',
    '\u00f9': 'ù',
    '\u00ec': 'ì'
}

def fix_corrupted_text(text):
    """Ripara testo corrotto usando sostituzioni dirette."""
    result = text
    
    # Applica sostituzioni dirette
    for old, new in direct_replacements.items():
        result = result.replace(old, new)
    
    return result

def main():
    """Processa tutti i file specificati."""
    fixed_count = 0
    error_count = 0
    
    print("🔧 Avvio riparazione emoji e caratteri speciali...\n")
    
    for file_path in files_to_fix:
        if not os.path.exists(file_path):
            print(f"⚠️  File non trovato: {file_path}")
            error_count += 1
            continue
        
        try:
            # Leggi file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Ripara contenuto
            original_content = content
            fixed_content = fix_corrupted_text(content)
            
            # Salva se modificato
            if fixed_content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)
                
                changes = sum(1 for a, b in zip(original_content, fixed_content) if a != b)
                print(f"✅ Riparato: {file_path} ({changes} caratteri modificati)")
                fixed_count += 1
            else:
                print(f"ℹ️  Nessuna modifica necessaria: {file_path}")
                
        except Exception as e:
            print(f"❌ Errore processando {file_path}: {e}")
            error_count += 1
    
    # Riepilogo
    print(f"\n{'='*60}")
    print(f"🎉 Riparazione completata!")
    print(f"   File riparati: {fixed_count}")
    print(f"   Errori: {error_count}")
    print(f"   Totale file processati: {len(files_to_fix)}")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    main()

