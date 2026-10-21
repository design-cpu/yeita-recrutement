"""Hub : onglet gardé au retour, liens directs, feuille de décompte vierge.
Lancer :  python3 tools/build.py _site && python3 -m http.server 8765 --directory _site
puis :    python3 tools/e2e-liens.py"""
import asyncio
from playwright.async_api import async_playwright
B="http://localhost:8765/"
ok=True
def check(l,c,x=""):
    global ok; ok = ok and bool(c); print("OK  " if c else "FAIL", l, x)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width":1280,"height":900})
        await ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
        pg = await ctx.new_page(); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        # Bug 1 : Précédent
        await pg.goto(B+"index.html", wait_until="networkidle")
        await pg.click("#tab-guide"); await pg.click("#st-ec2"); await pg.wait_for_timeout(200)
        check("adresse suit l'onglet et l'étape", pg.url.endswith("#ec2"), pg.url)
        await pg.click("#tab-supports"); await pg.wait_for_timeout(100)
        check("adresse suit l'onglet Supports", pg.url.endswith("#supports"), pg.url)
        await pg.click("#tab-guide"); await pg.wait_for_timeout(100)
        check("retour au guide : l'étape revient dans l'adresse", pg.url.endswith("#ec2"), pg.url)
        await pg.locator("#steppanel a[href^='fiche-ec2']").first.click(); await pg.wait_for_load_state("networkidle")
        await pg.go_back(wait_until="networkidle"); await pg.wait_for_timeout(300)
        check("Précédent : guide, étape EC2", await pg.locator("#tab-guide").get_attribute("aria-selected") == "true" and await pg.locator("#st-ec2").get_attribute("aria-selected") == "true", pg.url)
        await pg.goto(B+"index.html", wait_until="networkidle"); await pg.wait_for_timeout(200)
        check("même onglet du navigateur, sans ancre : on retrouve le guide", await pg.locator("#tab-guide").get_attribute("aria-selected") == "true")
        pg2 = await ctx.new_page(); await pg2.goto(B+"index.html", wait_until="networkidle")
        check("nouvel onglet du navigateur : la démarche", await pg2.locator("#tab-demarche").get_attribute("aria-selected") == "true")
        await pg2.close()
        # Bug 3 : liens directs
        for tok, page in [("fiche-ec1","fiche-ec1.html"),("fiche-ec2","fiche-ec2.html"),("carte","carte-identite.html"),("decompte","yeita-match-decompte.html"),("feuille-vierge","yeita-match-decompte.html#vierge"),("candidatures","candidatures.html")]:
            await pg.goto(B+"index.html#"+tok, wait_until="networkidle"); await pg.wait_for_timeout(200)
            check("lien direct #"+tok, pg.url.endswith(page), pg.url)
        await pg.goto(B+"index.html#supports", wait_until="networkidle")
        check("supports : copier le lien direct", await pg.locator("#inv [data-tok]").count() == 7)
        # Bug 2 : feuille vierge
        await pg.goto(B+"yeita-match-decompte.html#vierge", wait_until="networkidle"); await pg.wait_for_timeout(200)
        check("#vierge : focus sur l'impression", await pg.evaluate("document.activeElement.id") == "print-blank")
        await pg.click("#demo"); await pg.wait_for_timeout(200)
        await pg.evaluate("""window.print = function(){ window.__snap = [document.querySelectorAll('.round input:checked').length, document.getElementById('f-cand').value, document.querySelectorAll('.round textarea').length && [...document.querySelectorAll('.round textarea')].map(t=>t.value).join('')]; window.dispatchEvent(new Event('afterprint')); }""")
        await pg.click("#print-blank"); await pg.wait_for_timeout(200)
        snap = await pg.evaluate("window.__snap")
        check("impression : feuille vide", snap == [0, "", ""], str(snap))
        check("après impression : la feuille remplie revient", await pg.locator(".round input:checked").count() == 16 and await pg.locator("#f-cand").input_value() == "Camille Rousseau")
        stored = await pg.evaluate("JSON.parse(localStorage.getItem('yeita-match-decompte')).f.cand")
        check("rien d'effacé dans le navigateur", stored == "Camille Rousseau")
        # sans afterprint : retour au premier geste
        await pg.evaluate("window.print = function(){}")
        await pg.click("#print-blank"); await pg.wait_for_timeout(100)
        check("sans afterprint : vide le temps de l'impression", await pg.locator(".round input:checked").count() == 0)
        await pg.click("#f-host"); await pg.wait_for_timeout(100)
        check("premier geste : la feuille remplie revient", await pg.locator(".round input:checked").count() == 16)
        print("errors", errs); print("ALL OK" if ok and not errs else "FAILED")
        await b.close()
asyncio.run(main())
