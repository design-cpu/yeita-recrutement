"""Espace Candidatures v3, de bout en bout, avec des candidats fictifs.
Lancer :  python3 tools/build.py _site && python3 -m http.server 8765 --directory _site
puis :    python3 tools/e2e-candidatures.py"""
import asyncio, json
from playwright.async_api import async_playwright
B = "http://localhost:8765/"
C = B + "candidatures/"
ok_all = True
def check(label, cond, extra=""):
    global ok_all
    ok_all = ok_all and bool(cond)
    print(("OK  " if cond else "FAIL"), label, extra)

async def cands(pg):
    d = await pg.evaluate("JSON.parse(localStorage.getItem('yeita-dossiers')||'{}')")
    return list(d.values())
async def by_name(pg, nom):
    return [c for c in await cands(pg) if c["candidat"]["nom"] == nom][0]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        errs = []
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        await ctx.grant_permissions(["clipboard-read", "clipboard-write"], origin="http://localhost:8765")
        await ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "fonts.g" not in m.text and not (m.location or {}).get("url", "").endswith("/api/moi") else None)   # /api/moi : 404 attendu sans API (mode navigateur, v1.3)

        # Entrées dans l'espace
        await pg.goto(B + "index.html", wait_until="networkidle")
        check("hub : l'entrée Candidatures mène à l'espace", await pg.locator(".views-cta").get_attribute("href") == "candidatures/")
        await pg.goto(B + "candidatures.html#c-cand-inconnu", wait_until="networkidle"); await pg.wait_for_timeout(300)
        check("ancienne adresse : redirigée vers la page du candidat", "candidatures/candidat.html?id=cand-inconnu" in pg.url and await pg.locator("#missing").is_visible())
        await pg.goto(C + "candidat.html", wait_until="networkidle")
        check("page candidat sans identifiant : aucun candidat affiché", await pg.locator("#missing").is_visible() and not await pg.locator("#body").is_visible())
        await pg.goto(C, wait_until="networkidle"); await pg.wait_for_timeout(200)
        check("état vide", await pg.locator("#empty").is_visible())
        fict = await pg.locator(".fict").inner_text(); vide = await pg.locator("#empty p").inner_text()
        check("mode navigateur : bandeau « Tout reste dans ce navigateur », tableau vide avec ses exemples, « Retirer les exemples » présent (1.4, R7)",
              "Tout reste dans ce navigateur" in fict and "serveur de l'équipe" not in fict and "charge des exemples fictifs" in vide
              and await pg.locator("#empty-demo").is_visible() and await pg.locator("#demo-load").count() == 1 and not await pg.evaluate("document.getElementById('demo-clear').hidden"), f"{fict} / {vide}")

        # Qui es-tu
        await pg.click("#add-open"); await pg.fill("#a-personne", "Test"); await pg.click("#add-form button[value=ouvrir]"); await pg.wait_for_timeout(200)
        check("ajout sans « Qui es-tu » : le prénom est demandé", await pg.evaluate("document.activeElement.id") == "qui-sel")
        await pg.select_option("#qui-sel", "__autre"); await pg.fill("#qui-nouveau", "Samia"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(200)
        check("Qui es-tu : un nom libre s'ajoute à la liste", await pg.locator("#qui-sel").input_value() == "Samia")
        await pg.select_option("#qui-sel", "Thélo"); await pg.wait_for_timeout(100)

        # Ajout : formulaire court, champs facultatifs repliés
        await pg.click("#add-open")
        check("ajout : champs facultatifs repliés", not await pg.locator("#a-xp").is_visible())
        await pg.click("#add-form button[value=ouvrir]"); await pg.wait_for_timeout(150)
        check("ajout sans nom : message et champ marqué", await pg.locator("#a-personne").get_attribute("aria-invalid") == "true" and "nom" in await pg.locator("#a-err").inner_text())
        await pg.fill("#a-personne", "GARNIER Léna"); await pg.select_option("#a-job", "PrD")
        await pg.click("label:has(input[name=a-prov][value=WTTJ])"); await pg.click("label:has(input[name=a-prov][value=LinkedIn])")
        await pg.fill("#a-email", "lena.garnier@example.com"); await pg.fill("#a-tel", "01 99 00 55 55")
        await pg.click("#a-plus summary"); await pg.fill("#a-xp", "4"); await pg.select_option("#a-dispo", "1 mois")
        await pg.fill("#a-rec", "Andrea"); await pg.keyboard.press("Enter")
        recs = await pg.locator('[data-tags="a-rec"] .tg').all_inner_texts()
        check("Recruteurs : moi par défaut, puis un nom ajouté à la Notion", [r.replace("×", "").strip() for r in recs] == ["Thélo", "Andrea"], str(recs))
        await pg.click("#add-form button[value=ouvrir]"); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(400)
        check("création : l'appel de découverte s'ouvre aussitôt", "candidat.html?id=" in pg.url and "etape=appel" in pg.url and "Appel de découverte" in await pg.locator("#panel h2").inner_text())
        lena = await by_name(pg, "GARNIER Léna")
        check("fiche v3 enregistrée", lena["version"] == 3 and lena["identite"]["job"] == "PrD" and lena["identite"]["xp"] == 4 and lena["identite"]["provenances"] == ["WTTJ", "LinkedIn"] and lena["identite"]["recruteurs"] == ["Thélo", "Andrea"] and lena["identite"]["disponibilite"] == "1 mois")
        check("Infos candidat en haut de l'appel", await pg.locator("#panel .infos #i-personne").input_value() == "GARNIER Léna")
        check("question 3 : le libellé suit le Job", "Product Designer" in await pg.locator('label[for="q-role"]').inner_text())
        await pg.select_option("#i-job", "PM / PO"); await pg.wait_for_timeout(200)
        check("question 3 : changer le Job change la question", "PM / PO" in await pg.locator('label[for="q-role"]').inner_text() and "PM / PO" in await pg.locator("#c-meta").inner_text())
        check("pas de question sur le parcours ou le CV", await pg.locator(".q").count() == 10 and "parcours" not in (await pg.locator(".qlist").inner_text()).lower())
        await pg.fill("#q-recherche", "Un rôle de PM avec de la discovery."); await pg.fill("#q-ia", "Tous les jours : synthèses d'entretiens.")
        await pg.select_option("#q-dispo", "Immédiatement"); await pg.fill("#q-lieu", "Lyon"); await pg.wait_for_timeout(700)
        lena = await by_name(pg, "GARNIER Léna")
        check("réponses de l'appel enregistrées, une par question", lena["appel"]["reponses"]["recherche"].startswith("Un rôle") and "synthèses" in lena["appel"]["reponses"]["ia"])
        check("disponibilité et lieu alimentent la fiche", lena["identite"]["disponibilite"] == "Immédiatement" and lena["identite"]["adresse"] == "Lyon" and await pg.locator("#i-disponibilite").input_value() == "Immédiatement" and await pg.locator("#i-adresse").input_value() == "Lyon")
        await pg.fill("#i-email", "pas-un-mail"); await pg.wait_for_timeout(200)
        check("Infos : e-mail invalide signalé, rien d'écrasé", await pg.locator("#i-err").is_visible() and (await by_name(pg, "GARNIER Léna"))["identite"]["email"] == "lena.garnier@example.com")
        await pg.fill("#i-email", "lena.garnier@example.com"); await pg.wait_for_timeout(500)

        # One-pager, passage en EC1
        href = await pg.locator(".onepager a.btn").get_attribute("href")
        from urllib.parse import unquote
        body = unquote(href)
        check("mail du one-pager : adresse, page parcours, pas de créneau", "lena.garnier@example.com" in body and "one-pager.html" in body and "créneau" not in body and "Bonjour Léna" in body)
        check("EC1 bloquée tant que le one-pager n'est pas envoyé", await pg.locator("#next").is_disabled())
        await pg.check("#op-sent"); await pg.wait_for_timeout(300)
        check("« One-pager envoyé le … par … »", "par Thélo" in await pg.locator(".onepager").inner_text())
        await pg.click("#next"); await pg.wait_for_url("**/ec1.html?id=*"); await pg.wait_for_timeout(400)
        check("passage à l'EC1 : la fiche en pleine page, focus sur le nom", await pg.locator("#sheet").is_visible() and await pg.evaluate("document.activeElement.id") == "c-name" and "Appel de découverte" in await pg.locator("#notice").inner_text())
        check("EC1 : pas de Non retenu, une seule action principale", await pg.locator("#refuse").count() == 0 and await pg.locator(".exits .btn.primary").count() == 1)
        await pg.click('#steps button[data-step="appel"]'); await pg.wait_for_url("**/candidat.html?id=*etape=appel"); await pg.wait_for_timeout(300)
        check("étape passée : en lecture, la fiche dans le menu ⋯", await pg.locator("#q-recherche").is_disabled() and await pg.locator("#c-side .morebtn").is_visible() and await pg.locator("#panel .infos").count() == 0)
        check("fin de page : plus d'Historique, de Fiche ni de Supprimer dépliants (1.6)", await pg.locator("#hist, #fiche-b, #danger").count() == 0)

        # Menu ⋯ : Historique et Fiche du candidat en fenêtre, au clavier
        await pg.click("#c-side .morebtn"); await pg.wait_for_timeout(150)
        items = await pg.locator(".mcmenu [role=menuitem]").all_inner_texts()
        check("menu ⋯ : Fiche du candidat, Historique, Copier le lien, Supprimer ; focus sur la première entrée", items == ["Fiche du candidat", "Historique", "Copier le lien", "Supprimer"] and await pg.evaluate("document.activeElement.dataset.mc") == "fiche", str(items))
        await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(300)
        check("Historique : fenêtre modale, entrée et passage à l'EC1", await pg.locator("dialog.mdlg[open] .histlist li").count() >= 2 and "Appel de découverte → EC1" in await pg.locator("dialog.mdlg").inner_text())
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        check("Échap ferme la fenêtre, le focus revient sur ⋯", await pg.locator("dialog.mdlg").count() == 0 and await pg.evaluate("document.activeElement.classList.contains('morebtn')"))
        await pg.click("#c-side .morebtn"); await pg.click("[data-mc=fiche]"); await pg.wait_for_timeout(300)
        await pg.fill("#mf-telephone", "01 99 00 66 66"); await pg.wait_for_timeout(700)
        await pg.click(".mdlg-a [data-mc-close]"); await pg.wait_for_timeout(400)
        check("Fiche du candidat en fenêtre : modifiée, enregistrée", (await by_name(pg, "GARNIER Léna"))["identite"]["telephone"] == "01 99 00 66 66" and await pg.locator("dialog.mdlg").count() == 0)

        # Copier le lien d'une étape, et l'ouvrir
        await pg.click("#c-side .morebtn"); await pg.click("[data-mc=lien]"); await pg.wait_for_timeout(200)
        link = await pg.evaluate("navigator.clipboard.readText()")
        check("Copier le lien : adresse unique, sans le nom", "candidat.html?id=cand-" in link and "etape=appel" in link and "GARNIER" not in link and "L%C3%A9na" not in link, link)
        p2 = await ctx.new_page(); await p2.goto(link, wait_until="networkidle"); await p2.wait_for_timeout(300)
        check("le lien ouvre ce candidat à cette étape", "Appel de découverte" in await p2.locator("#panel h2").inner_text() and await p2.locator("#c-name").inner_text() == "GARNIER Léna")
        await p2.close()

        # Tableau : carte, État à la main, glisser bloqué
        await pg.goto(C, wait_until="networkidle"); await pg.wait_for_timeout(300)
        card = pg.locator('.kcol:has(h2#col-ec1) .kc')
        txt = await card.inner_text()
        check("carte : Nom, Job · XP, Disponibilité, État, Recruteurs", "GARNIER Léna" in txt and "PM / PO · 4 ans" in txt and "Immédiatement" in txt and "À planifier" in txt and "Thélo, Andrea" in txt)
        await card.locator(".etat").click(); await pg.wait_for_timeout(150)
        check("menu de l'État : 7 états, focus sur l'état actuel", await pg.locator(".menu [role=menuitemradio]").count() == 7 and await pg.evaluate("document.activeElement.getAttribute('aria-checked')") == "true")
        await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(300)
        lena = await by_name(pg, "GARNIER Léna")
        check("État changé à la main, noté dans l'historique", lena["etat"] == "planifie" and lena["historique"][-1]["type"] == "etat" and lena["historique"][-1]["par"] == "Thélo")
        check("la carte reste dans sa colonne", await pg.locator('.kcol:has(h2#col-ec1) .kc').count() == 1 and "Planifié" in await pg.locator('.kcol:has(h2#col-ec1) .kc .etat').inner_text())
        box = await card.bounding_box()
        await pg.mouse.move(box["x"] + 60, box["y"] + 60); await pg.mouse.down(); await pg.mouse.move(box["x"] + 400, box["y"] + 80, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(200)
        check("glisser une carte : bloqué, avec une explication", await pg.locator("#floattip").is_visible() and "actions de son étape" in await pg.locator("#floattip").inner_text())

        await card.locator(".morebtn").click(); await pg.wait_for_timeout(150)
        check("carte : menu ⋯ (4 entrées)", await pg.locator(".mcmenu [role=menuitem]").count() == 4)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(100)
        check("menu ⋯ : Échap le ferme, focus sur ⋯", await pg.locator(".mcmenu").count() == 0 and await pg.evaluate("document.activeElement.classList.contains('morebtn')"))
        await card.click(position={"x": 30, "y": 62}); await pg.wait_for_load_state("networkidle")
        check("toute la carte ouvre la candidature", "id=" + lena["id"] in pg.url, pg.url)
        await pg.goto(C, wait_until="networkidle"); await pg.wait_for_timeout(300)

        # Enregistrer et revenir à la liste
        await pg.click("#add-open"); await pg.fill("#a-personne", "Noé Faure"); await pg.click("#add-form button[value=liste]"); await pg.wait_for_timeout(400)
        check("Enregistrer et revenir : reste sur le tableau", pg.url.rstrip("/").endswith("candidatures") and await pg.locator('.kcol:has(h2#col-appel) .kc', has_text="Noé Faure").count() == 1)

        # Exemples, colonnes masquées, liste triable
        await pg.click("#save > summary"); await pg.click("#demo-load"); await pg.wait_for_timeout(400)
        check("mode navigateur : exemples chargés, « Retirer les exemples » visible (1.4, R7)", await pg.locator("#demo-clear").is_visible())
        check("colonnes : 9 visibles, 3 masquées par défaut", await pg.locator(".kcol").count() == 9 and await pg.locator("#col-vivier").count() == 0)
        await pg.click("#more"); await pg.wait_for_timeout(200)
        check("Afficher plus : Go sur mission, Vivier, Non retenu", await pg.locator(".kcol").count() == 12 and await pg.locator('.kcol:has(h2#col-vivier) .kc').count() == 1)
        await pg.click("#more")
        await pg.click("#mode [data-m=liste]"); await pg.wait_for_timeout(150)
        check("liste : mêmes infos, plus l'étape et le début du process", await pg.locator("#list-head th").count() == 9 and await pg.locator("#rows tr").count() == 6)
        await pg.click('[data-sort="xp"]'); await pg.wait_for_timeout(100)
        first_asc = await pg.locator("#rows tr td:nth-child(3)").first.inner_text()
        await pg.click('[data-sort="xp"]'); await pg.wait_for_timeout(100)
        first_desc = await pg.locator("#rows tr td:nth-child(3)").first.inner_text()
        check("liste : tri par colonne", await pg.locator('th[aria-sort="descending"]').count() == 1 and first_asc != first_desc, f"{first_asc} / {first_desc}")
        await pg.click("#mode [data-m=kanban]")

        # Export / import JSON vers un autre navigateur
        await pg.click("#exp"); await pg.wait_for_timeout(300)
        txt = await pg.locator("#exp-text").input_value()
        check("export JSON v3", json.loads(txt)["version"] == 3 and len(json.loads(txt)["candidats"]) == 8)
        ctx2 = await b.new_context(); await ctx2.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
        q = await ctx2.new_page(); q.on("pageerror", lambda e: errs.append(str(e)))
        await q.goto(C, wait_until="networkidle")
        await q.click("#save > summary"); await q.fill("#imp-text", txt); await q.click("#imp-go"); await q.wait_for_timeout(400)
        check("import sur un autre navigateur", "8 ajouté" in await q.locator("#imp-msg").inner_text())
        await ctx2.close()

        # Suppression
        noe = await by_name(pg, "Noé Faure")
        await pg.goto(C + "candidat.html?id=" + noe["id"], wait_until="networkidle"); await pg.wait_for_timeout(300)
        await pg.click("#c-side .morebtn"); await pg.click("[data-mc=supprimer]"); await pg.wait_for_timeout(200)
        check("Supprimer : confirmation en fenêtre, focus sur Garder", "Supprimer Noé Faure ?" in await pg.locator("dialog.mdlg").inner_text() and await pg.evaluate("document.activeElement.textContent") == "Garder")
        await pg.click("[data-mc-del]"); await pg.wait_for_url("**/candidatures/index.html"); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(500)
        check("suppression d'un candidat", len([c for c in await cands(pg) if c["candidat"]["nom"] == "Noé Faure"]) == 0)

        # Téléphone
        m = await b.new_context(viewport={"width": 390, "height": 844}, color_scheme="dark")
        await m.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
        mp = await m.new_page(); mp.on("pageerror", lambda e: errs.append(str(e)))
        await mp.goto(C, wait_until="networkidle"); await mp.click("#empty-demo"); await mp.wait_for_timeout(300)
        sw1 = await mp.evaluate("document.documentElement.scrollWidth <= innerWidth")
        await mp.locator("a[href*='candidat.html']:visible").first.click(); await mp.wait_for_load_state("networkidle"); await mp.wait_for_timeout(300)
        sw2 = await mp.evaluate("document.documentElement.scrollWidth <= innerWidth")
        check("téléphone : pas de défilement horizontal (tableau, candidat)", sw1 and sw2)
        await m.close()

        print("errors:", errs)
        print("ALL OK" if ok_all and not errs else "SOMETHING FAILED")
        await b.close()
asyncio.run(main())
