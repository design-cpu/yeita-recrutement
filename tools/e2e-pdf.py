"""Exports PDF : carte d'identité (#p-<id>) et feuille de décompte vierge, vérifiés au texte (pdftotext, pdfinfo).
Lancer :  python3 tools/build.py _site && python3 -m http.server 8765 --directory _site
puis :    python3 tools/e2e-pdf.py"""
import asyncio, subprocess
from playwright.async_api import async_playwright
import os, tempfile
ROOT = tempfile.mkdtemp(prefix="yeita-pdf-"); os.makedirs(ROOT+"/renders", exist_ok=True)
B = "http://localhost:8765/"
ok = True
def check(l, c, x=""):
    global ok; ok = ok and bool(c); print("OK  " if c else "FAIL", l, x)
def text(pdf): return subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True).stdout
def pages(pdf): return int([l for l in subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout.splitlines() if l.startswith("Pages")][0].split()[-1])
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context()
        await ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
        await ctx.add_init_script("window.print = function(){ window.__printed = (window.__printed||0) + 1; }")
        pg = await ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(B+"candidatures/", wait_until="networkidle")
        await pg.evaluate("localStorage.setItem('yeita-recruteur', JSON.stringify('Thélo'))"); await pg.reload(wait_until="networkidle")
        await pg.click("#empty-demo"); await pg.wait_for_timeout(400)
        ids = await pg.evaluate("Object.fromEntries(Object.values(JSON.parse(localStorage.getItem('yeita-dossiers'))).map(c=>[c.identite.prenom, c.id]))")
        # Carte de Hugo (EC3 : EC1 + EC2), export #p-
        await pg.goto(B+"carte-identite.html#p-"+ids["Hugo"], wait_until="networkidle"); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(700)
        check("#p- : impression lancée d'elle-même", await pg.evaluate("window.__printed") == 1)
        await pg.emulate_media(media="print"); await pg.pdf(path=ROOT+"/renders/carte-hugo.pdf", prefer_css_page_size=True, print_background=True)
        t = text(ROOT+"/renders/carte-hugo.pdf")
        check("carte Hugo : une page, son nom, sa lecture EC2", pages(ROOT+"/renders/carte-hugo.pdf") == 1 and "Hugo Petit" in t, f"{pages(ROOT+'/renders/carte-hugo.pdf')} page(s)")
        check("carte Hugo : la partie interne ne s'imprime pas", "binôme les premières semaines" not in t and "dire non à un sponsor" not in t)
        await pg.emulate_media(media="screen")
        # Carte de Chloé (arrêt après l'appel)
        await pg.goto(B+"carte-identite.html#p-"+ids["Yanis"], wait_until="networkidle"); await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(700)
        await pg.emulate_media(media="print"); await pg.pdf(path=ROOT+"/renders/carte-yanis.pdf", prefer_css_page_size=True, print_background=True)
        t = text(ROOT+"/renders/carte-yanis.pdf")
        check("carte Yanis (après EC1) : une page, son nom", pages(ROOT+"/renders/carte-yanis.pdf") == 1 and "Yanis Morel" in t)
        await pg.emulate_media(media="screen")
        # Feuille de décompte vierge alors que l'écran est rempli
        await pg.goto(B+"yeita-match-decompte.html#vierge", wait_until="networkidle"); await pg.click("#demo"); await pg.wait_for_timeout(300)
        await pg.click("#print-blank"); await pg.wait_for_timeout(300)
        await pg.emulate_media(media="print"); await pg.pdf(path=ROOT+"/renders/feuille-vierge.pdf", prefer_css_page_size=True, print_background=True)
        t = text(ROOT+"/renders/feuille-vierge.pdf")
        check("feuille vierge : pas de nom, pas de note, 2 pages", "Camille" not in t and "Pauline" not in t and "problème du client" not in t and pages(ROOT+"/renders/feuille-vierge.pdf") == 2, f"{pages(ROOT+'/renders/feuille-vierge.pdf')} page(s)")
        await pg.emulate_media(media="screen"); await pg.evaluate("window.dispatchEvent(new Event('afterprint'))"); await pg.wait_for_timeout(200)
        check("feuille : l'écran retrouve la partie en cours", await pg.locator("#f-cand").input_value() == "Camille Rousseau")
        check("pas d'erreur", not errs, errs)
        print("ALL OK" if ok else "FAILED"); await b.close()
asyncio.run(main())
