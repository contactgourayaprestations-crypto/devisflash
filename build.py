#!/usr/bin/env python3
"""Assemble les Netlify Functions : core.js + handler -> netlify/functions/<name>.js"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, 'src')
OUT = os.path.join(BASE, 'netlify', 'functions')

MAP = {
    'auth-signup.js': 'h-auth-signup.js',
    'auth-login.js': 'h-auth-login.js',
    'auth-me.js': 'h-auth-me.js',
    'auth-logout.js': 'h-auth-logout.js',
    'devis-save.js': 'h-devis-save.js',
    'devis-list.js': 'h-devis-list.js',
    'devis-get.js': 'h-devis-get.js',
    'devis-delete.js': 'h-devis-delete.js',
    'settings.js': 'h-settings.js',
}

def main():
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(SRC, 'core.js'), encoding='utf-8') as f:
        core = f.read()
    for out_name, handler_name in MAP.items():
        with open(os.path.join(SRC, handler_name), encoding='utf-8') as f:
            handler = f.read()
        with open(os.path.join(OUT, out_name), 'w', encoding='utf-8') as f:
            f.write(core + '\n' + handler)
        print('built', out_name)

if __name__ == '__main__':
    main()
