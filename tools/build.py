# Construit le site publiable (GitHub Pages) à partir des fichiers de l'artefact.
# index.html est un fragment d'artefact : on l'enveloppe dans un document complet.
# Les autres pages sont déjà des documents complets et sont copiées telles quelles.
import os, shutil, sys

SRC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(SRC, "_site"))
SKIP = {".git", ".github", "tools", "_site", "dist", "renders", "README.md", ".gitignore"}

if os.path.exists(DST):
    shutil.rmtree(DST)
shutil.copytree(SRC, DST, ignore=lambda d, names: [n for n in names if d == SRC and n in SKIP])

frag = open(os.path.join(SRC, "index.html"), encoding="utf8").read()
head = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'body{margin:0}[hidden]{display:none!important}</style>\n')
# le <title>, les liens et le premier <style> du fragment vont dans <head>, le reste dans <body>
i = frag.find("</style>") + len("</style>")
page = head + frag[:i] + "\n</head>\n<body>\n" + frag[i:] + "\n</body>\n</html>\n"
open(os.path.join(DST, "index.html"), "w", encoding="utf8").write(page)
open(os.path.join(DST, ".nojekyll"), "w").close()
print("site ->", DST)
