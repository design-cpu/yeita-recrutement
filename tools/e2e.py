"""Parcours complet avec un candidat fictif : décompte → fiche #1 → report → carte → fiche #2 → code → carte,
puis l'autre ordinateur (import d'un code), la reprise de l'ancienne passation et l'effacement.

Lancer :  python3 tools/build.py _site && python3 -m http.server 8765 --directory _site
puis :    python3 tools/e2e.py      (Playwright pour Python et Chromium requis)"""
import asyncio, json, sys
from playwright.async_api import async_playwright
B = "http://localhost:8765/"
NOM = "Inès Bernard"
ok_all = True
def check(label, cond, extra=""):
    global ok_all
    ok_all = ok_all and bool(cond)
    print(("OK  " if cond else "FAIL"), label, extra)

async def dossiers(pg):
    return await pg.evaluate("JSON.parse(localStorage.getItem('yeita-dossiers')||'{}')")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        errs = []
        def watch(pg):
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("console", lambda m: errs.append(m.text) if m.type=="error" and "fonts.g" not in m.text else None)
        ctx = await b.new_context(viewport={"width":1280,"height":900})
        await ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
        pg = await ctx.new_page(); watch(pg)

        # 1. Feuille de décompte → fiche #1
        await pg.goto(B+"yeita-match-decompte.html", wait_until="networkidle")
        await pg.click("#demo"); await pg.wait_for_timeout(200)
        if await pg.locator("input[name=tb]").count(): await pg.locator("input[name=tb]").first.click(); await pg.wait_for_timeout(200)
        await pg.click("#to-fiche"); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(300)
        check("décompte → fiche #1", pg.url.endswith("fiche-ec1.html") or "fiche-ec1.html" in pg.url, pg.url)
        check("fiche #1 : 8 sections dépliantes", await pg.locator("details.sec").count() == 8)
        check("fiche #1 : dernière section = Questions à creuser en EC2", "Questions à creuser en EC2" in await pg.locator("details.sec").last.locator("summary").inner_text())
        if await pg.locator("#take").count(): await pg.click("#take"); await pg.wait_for_timeout(200)
        st = await pg.locator("#st-yeita-match").inner_text()
        check("fiche #1 : résultat repris, visible section repliée", "›" in st, st)

        # 2. Remplir, reporter
        await pg.fill("#f-nom", NOM)
        await pg.fill("#f-date", "2026-10-22")
        await pg.fill("#f-def", "Va chercher l'utilisateur avant la solution, et le dit simplement.")
        for sid in ("s-diam", "s-vig"):
            if not await pg.locator("#"+sid).evaluate("e=>e.open"): await pg.click("#"+sid+" > summary")
        await pg.locator("#diam .pills").nth(1).locator("button", has_text="Fort").click()
        await pg.fill("#f-vig", "A coupé deux fois l'observateur pour reformuler.")
        await pg.fill("#f-qec2", "Ce qu'elle a mesuré après la mise en production.\nSon rapport aux deadlines imposées.")
        # Critères d'employabilité
        if not await pg.locator("#s-emp").evaluate("e=>e.open"): await pg.click("#s-emp > summary")
        check("employabilité : 8 critères", await pg.locator(".crit").count() == 8)
        await pg.click('.cpills button[data-c="salaire"][data-s="pas-aujourdhui"]')
        ph = await pg.locator("#cp-salaire").input_value()
        check("critère : phrase type écrite", ph.startswith("Pas aujourd'hui, parce que"), ph[:60])
        await pg.check("#ca-salaire")
        await pg.fill("#cp-salaire", "Pas aujourd'hui, parce que tu vises 75 k€ et notre palier 2 s'arrête à 62 k€.")
        await pg.click('.cpills button[data-c="salaire"][data-s="a-discuter"]')
        ph2 = await pg.locator("#cp-salaire").input_value()
        check("critère : phrase ajustée gardée au changement d'état", "75 k€" in ph2)
        check("critère : « Reprendre la phrase type » visible", await pg.locator('[data-reset="salaire"]').is_visible())
        await pg.click('.cpills button[data-c="salaire"][data-s="pas-aujourdhui"]')
        await pg.click('.cpills button[data-c="anglais"][data-s="aligne"]')
        await pg.fill("#cn-anglais", "A répondu en anglais sans hésiter.")
        st_emp = await pg.locator("#st-s-emp").inner_text()
        check("employabilité : état de section", "2 critères sur 8, 1 sur la carte" in st_emp, st_emp)
        check("bouton avant report", (await pg.locator("#report").inner_text()) == "Reporter vers la carte d'identité")
        await pg.click("#report"); await pg.wait_for_timeout(2600)
        rs = await pg.locator("#rstate").inner_text()
        check("report : état « Reporté »", rs.startswith("Reporté le"), rs)
        check("report : bouton devient « Mettre à jour la carte »", (await pg.locator("#report").inner_text()) == "Mettre à jour la carte")
        await pg.fill("#f-vig", "A coupé deux fois l'observateur pour reformuler, sans s'en rendre compte.")
        rs = await pg.locator("#rstate").inner_text()
        check("modification après report : état « Modifiée »", rs.startswith("Modifiée depuis"), rs)
        await pg.click("#report"); await pg.wait_for_timeout(300)
        D = await dossiers(pg)
        check("un seul dossier après deux reports", len(D) == 1, str(len(D)))
        d = list(D.values())[0]
        e1 = d["ec1"]
        check("dossier : nom", d["candidat"]["nom"] == NOM)
        check("dossier : match", e1["match"]["dominante"] and e1["match"]["seconde"], json.dumps(e1["match"], ensure_ascii=False))
        check("dossier : interne (diamants, vigilance, questions)", e1["diamants"][1] == "Fort" and "sans s'en rendre compte" in e1["vigilance"] and "deadlines" in e1["questionsEC2"])
        cr = e1["employabilite"]["criteres"]
        check("dossier : critères reportés", cr.get("salaire",{}).get("afficher") is True and "75 k€" in cr["salaire"]["phrase"] and cr.get("anglais",{}).get("afficher") is False and "anglais" in cr["anglais"]["note"], json.dumps(cr, ensure_ascii=False)[:200])
        check("dossier : observateur repris du décompte", bool(e1["observateur"]), e1["observateur"])
        code1 = (await pg.locator("#code").text_content()).strip()
        check("code EC1 v2 disponible", code1.startswith("YEITA-EC1."), str(len(code1)))
        notion = await pg.evaluate("navigator.clipboard ? 1 : 0")

        # 3. Carte : lit le dossier courant
        await pg.goto(B+"carte-identite.html", wait_until="networkidle"); await pg.wait_for_timeout(300)
        check("carte : nom", (await pg.locator("#who").inner_text()) == NOM)
        check("carte : moitié gauche remplie", "Va chercher l'utilisateur" in await pg.locator("#left").inner_text())
        check("carte : état arrêt après EC1 par défaut", await pg.locator("#state [data-s=ec1]").get_attribute("aria-checked") == "true")
        check("carte : moitié droite vide", (await pg.locator("#right").inner_text()).strip() == "")
        ds = await pg.locator("#dstate").inner_text()
        check("carte : statut EC1 reporté / EC2 pas encore", "EC1 : reporté" in ds and "EC2 : pas encore" in ds, ds.replace("\n"," | "))
        check("carte : l'interne ne s'affiche pas sur la carte", "deadlines" not in await pg.locator("#card").inner_text())

        # 4. Fiche #2 → code (ancien format) → import dans la carte
        await pg.goto(B+"fiche-ec2.html", wait_until="networkidle")
        await pg.click("#demo"); await pg.wait_for_timeout(200)
        await pg.fill("#f-nom", NOM); await pg.wait_for_timeout(200)
        code2 = (await pg.locator("#code").inner_text()).strip()
        await pg.goto(B+"carte-identite.html", wait_until="networkidle"); await pg.wait_for_timeout(300)
        await pg.click("#imp > summary")
        await pg.fill("#code-in", "pas un code"); await pg.click("#import"); await pg.wait_for_timeout(200)
        m = await pg.locator("#imp-msg").inner_text()
        check("import : message d'erreur lisible", "n'est pas un code" in m, m)
        await pg.fill("#code-in", code2); await pg.press("#code-in", "Enter"); await pg.wait_for_timeout(300)
        m = await pg.locator("#imp-msg").inner_text()
        check("import EC2 : rejoint la carte du même candidat", NOM in m and "EC2" in m, m)
        D = await dossiers(pg)
        check("toujours un seul dossier", len(D) == 1, str(len(D)))
        check("carte : passe en arrêt après EC2", await pg.locator("#state [data-s=ec2]").get_attribute("aria-checked") == "true")
        right = await pg.locator("#right").inner_text()
        check("carte : moitié droite remplie (radar, palier)", "Palier discuté" in right)
        await pg.click("#state [data-s=hire]"); await pg.wait_for_timeout(200)
        check("carte : embauche → bandeau", await pg.locator("#start").is_visible())
        D = await dossiers(pg)
        check("état de sortie enregistré dans le dossier", list(D.values())[0]["restitution"]["etat"] == "hire")

        # 5. Report EC1 dans un autre onglet → la carte se met à jour seule
        pg2 = await ctx.new_page(); watch(pg2)
        await pg2.goto(B+"fiche-ec1.html", wait_until="networkidle")
        await pg2.fill("#f-def", "Va chercher l'utilisateur avant la solution. Mis à jour dans un autre onglet.")
        await pg2.click("#report"); await pg2.wait_for_timeout(400)
        await pg.wait_for_timeout(300)
        check("carte : mise à jour par un autre onglet", "autre onglet" in await pg.locator("#left").inner_text())
        await pg2.close()

        # 6. Un autre ordinateur : navigateur vierge, on colle le code EC1
        ctx2 = await b.new_context(viewport={"width":1280,"height":900})
        await ctx2.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
        q = await ctx2.new_page(); watch(q)
        await q.goto(B+"carte-identite.html", wait_until="networkidle"); await q.wait_for_timeout(300)
        check("autre ordinateur : l'exemple s'affiche", "Exemple" in await q.locator("#dstate").inner_text())
        check("autre ordinateur : pas de bouton Effacer sur l'exemple", not await q.locator("#del").is_visible())
        await q.click("#imp > summary"); await q.fill("#code-in", code1); await q.click("#import"); await q.wait_for_timeout(300)
        check("autre ordinateur : carte composée depuis le code", (await q.locator("#who").inner_text()) == NOM)
        D = await dossiers(q)
        e1b = list(D.values())[0]["ec1"]
        check("autre ordinateur : l'interne a voyagé (questions EC2)", "deadlines" in e1b["questionsEC2"])
        # effacer
        await q.click("#del"); await q.wait_for_timeout(100)
        check("effacer : confirmation en page", await q.locator("#del-confirm").is_visible())
        await q.click("#del-yes"); await q.wait_for_timeout(300)
        check("effacer : plus aucun dossier", len(await dossiers(q)) == 0)
        check("effacer : retour à l'exemple", "Exemple" in await q.locator("#dstate").inner_text())

        # 7. Reprise d'un brouillon de l'ancienne fiche de passation
        ctx3 = await b.new_context()
        await ctx3.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
        r = await ctx3.new_page(); watch(r)
        await r.goto(B+"one-pager.html")
        await r.evaluate("""localStorage.setItem('yeita-fiche-passation', JSON.stringify({v:'a', diam:{0:'À creuser',1:'Fort'}, f:{'f-nom':'Hugo Petit','a-q1':'Question un','a-q2':'Question deux','a-att':'Un signal'}}))""")
        await r.goto(B+"fiche-ec1.html", wait_until="networkidle"); await r.wait_for_timeout(200)
        v = await r.evaluate("({n:document.getElementById('f-nom').value, q:document.getElementById('f-qec2').value, g:document.getElementById('f-vig').value})")
        check("passation reprise : nom, questions, vigilance", v["n"] == "Hugo Petit" and v["q"] == "Question un\nQuestion deux" and v["g"] == "Un signal", json.dumps(v, ensure_ascii=False))
        check("passation reprise : diamants", (await r.locator("#st-s-diam").inner_text()) == "2 sur 4")
        await r.click("#clear"); await r.click("#cf-yes"); await r.reload(wait_until="networkidle"); await r.wait_for_timeout(200)
        check("après « Vider », la passation ne revient pas", (await r.locator("#f-qec2").input_value()) == "")
        # nom manquant
        await r.click("#report"); await r.wait_for_timeout(100)
        check("report sans nom : message et focus", "nom du candidat" in await r.locator("#rstate").inner_text() and await r.evaluate("document.activeElement.id") == "f-nom")

        print("errors:", errs)
        print("ALL OK" if ok_all and not errs else "SOMETHING FAILED")
        await b.close()
asyncio.run(main())
