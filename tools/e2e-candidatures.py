"""Module Candidatures, de bout en bout, avec des candidats fictifs.
Lancer :  python3 tools/build.py _site && python3 -m http.server 8765 --directory _site
puis :    python3 tools/e2e-candidatures.py"""
import asyncio, json, sys
from playwright.async_api import async_playwright
B = "http://localhost:8765/"
ok_all = True
def check(label, cond, extra=""):
    global ok_all
    ok_all = ok_all and bool(cond)
    print(("OK  " if cond else "FAIL"), label, extra)

async def cands(pg):
    d = await pg.evaluate("JSON.parse(localStorage.getItem('yeita-dossiers')||'{}')")
    return list(d.values())

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        errs = []
        ctx = await b.new_context(viewport={"width":1440,"height":900})
        await ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type=="error" and "fonts.g" not in m.text else None)

        # Hub → Candidatures
        await pg.goto(B+"index.html", wait_until="networkidle")
        check("hub : entrée Candidatures à côté des onglets", await pg.locator(".views-row .views-cta[href='candidatures.html']").count() == 1)
        await pg.click(".views-cta"); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(300)
        check("état vide", await pg.locator("#empty").is_visible())

        # Ajout : erreurs, puis ajout réussi
        await pg.click("#add-open")
        await pg.click("#add-form button[type=submit]"); await pg.wait_for_timeout(100)
        check("ajout sans nom : message", "prénom et le nom" in await pg.locator("#a-err").inner_text())
        await pg.fill("#a-prenom", "Léna"); await pg.fill("#a-nom", "Garnier"); await pg.fill("#a-email", "lena.garnier@example.com"); await pg.fill("#a-tel", "01 99 00 55 55")
        await pg.click("label:has(input[name=a-prov][value=wttj])")
        await pg.click("#add-form button[type=submit]"); await pg.wait_for_timeout(300)
        C = await cands(pg)
        check("candidat ajouté à l'appel de découverte", len(C) == 1 and C[0]["parcours"]["etape"] == "appel" and C[0]["identite"]["provenance"] == "wttj")
        card = pg.locator(".kcol:first-child .kc")
        check("carte : nom, étape, provenance, Démarrer", await card.count() == 1 and "Démarrer" in await card.inner_text() and "Welcome to the Jungle" in await card.inner_text())

        # Démarrer sans prénom de recruteur : on le demande
        await card.locator("button").click(); await pg.wait_for_timeout(200)
        check("Démarrer sans « Tu es » : le prénom est demandé", await pg.evaluate("document.activeElement.id") == "me")
        await pg.select_option("#me", "Thélo")
        await card.locator("button").click(); await pg.wait_for_timeout(400)
        check("fiche candidat ouverte sur l'appel", "Appel de découverte" in await pg.locator("#panel h2").inner_text())
        check("stepper : EC1 désactivée", await pg.locator("#steps button[data-step=ec1]").is_disabled())
        check("appel pré-rempli : date et recruteur", (await pg.locator("#ap-par").input_value()) == "Thélo" and len(await pg.locator("#ap-date").input_value()) == 10)
        await pg.fill("#ap-parcours", "Trois ans PO dans une scale-up santé. A mené la refonte du parcours patient.")
        await pg.fill("#ap-conditions", "Vise 52 k€. Disponible en janvier."); await pg.wait_for_timeout(600)
        C = await cands(pg)
        check("notes de l'appel enregistrées", "scale-up santé" in C[0]["appel"]["blocs"]["parcours"])
        check("EC1 bloquée tant que le one-pager n'est pas coché", await pg.locator("#next").is_disabled() and "One-pager" in await pg.locator("#why").inner_text())
        href = await pg.locator(".onepager a.btn").get_attribute("href")
        check("brouillon Gmail : adresse, objet, lien du one-pager", "mail.google.com" in href and "lena.garnier%40example.com" in href and "one-pager.html" in href)
        await pg.check("#op-sent"); await pg.wait_for_timeout(300)
        check("One-pager envoyé : EC1 débloquée", not await pg.locator("#next").is_disabled())
        await pg.click("#next"); await pg.wait_for_timeout(400)
        check("passage à l'EC1, avec annulation possible", "EC1" in await pg.locator("#panel h2").inner_text() and await pg.locator("#undo").count() == 1)
        check("appel en lecture dans le stepper", await pg.locator("#steps li.done button[data-step=appel]").count() == 1)
        await pg.click("#steps button[data-step=appel]"); await pg.wait_for_timeout(200)
        check("étape passée : en lecture seule", await pg.locator("#ap-parcours").is_disabled() and "en lecture" in await pg.locator(".readonly").inner_text())
        await pg.click("#steps button[data-step=ec1]"); await pg.wait_for_timeout(200)
        links = await pg.locator("#panel .links a").all_inner_texts()
        check("EC1 : présentiel et visio, décompte vierge", any("Kit" in l for l in links) and any("en ligne" in l for l in links) and sum("vierge" in l for l in links) == 2)

        # Fiche #1 branchée sur le candidat
        await pg.click("a[href^='fiche-ec1.html#c-']"); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(500)
        check("fiche #1 : barre du candidat", "Léna Garnier" in await pg.locator("#candbar").inner_text())
        check("fiche #1 : nom verrouillé, pré-rempli", (await pg.locator("#f-nom").input_value()) == "Léna Garnier" and await pg.locator("#f-nom").evaluate("e=>e.readOnly"))
        check("fiche #1 : pas d'exemple en mode candidat", not await pg.locator("#demo").is_visible())
        await pg.click('#picker [data-r=dom][data-v=explorateur]'); await pg.click('#picker [data-r=sec][data-v=collectif]')
        await pg.fill("#f-def", "Tu pars des patients avant de parler solution.")
        await pg.fill("#f-qec2", "Ce qu'elle a mesuré après la refonte."); await pg.wait_for_timeout(700)
        check("fiche #1 : enregistré sur la candidature", "Enregistré à" in await pg.locator("#candbar").inner_text())
        C = await cands(pg)
        check("candidature : lecture EC1 et brouillon de fiche", C[0]["ec1"]["match"]["dominante"] == "explorateur" and "patients" in C[0]["ec1"]["percu"] and C[0]["fiches"]["ec1"]["dom"] == "explorateur")
        check("brouillon de la fiche seule intact", await pg.evaluate("localStorage.getItem('yeita-fiche-ec1')") in (None, "null") or "Léna" not in (await pg.evaluate("localStorage.getItem('yeita-fiche-ec1')") or ""))
        await pg.reload(wait_until="networkidle"); await pg.wait_for_timeout(500)
        check("fiche #1 : rouverte telle qu'on l'a laissée", (await pg.locator("#f-def").input_value()).startswith("Tu pars des patients"))
        await pg.click("#candbar a"); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(500)
        check("retour au parcours, sur l'EC1", "EC1" in await pg.locator("#panel h2").inner_text() and "Enregistrée" in await pg.locator("#panel .status").first.inner_text())

        # Passation EC1
        await pg.click("#next"); await pg.wait_for_timeout(400)
        prev = await pg.locator("#panel .carteprev").inner_text()
        check("passation : aperçu de la carte et des remarques", "Explorateur › Jouer collectif" in prev and "mesuré après la refonte" in prev)
        check("passation : rappel du call de 15 min", "15 min" in await pg.locator("#panel .onepager h3").inner_text())
        exp = await pg.locator("#panel a[href^='carte-identite.html#p-']").first.get_attribute("href")
        await pg.click("label:has(input[name=pm-mode][value=asynchrone])")
        await pg.click("#next"); await pg.wait_for_timeout(400)
        C = await cands(pg)
        check("passation faite → EC2, mode asynchrone noté", C[0]["parcours"]["etape"] == "ec2" and C[0]["passations"]["ec1"]["mode"] == "asynchrone" and C[0]["passations"]["ec1"]["par"] == "Thélo")
        check("historique : 3 passages avec l'auteur", len(C[0]["historique"]) == 4 and all(h["par"] == "Thélo" for h in C[0]["historique"][1:]))

        # Carte : #c- et #p-
        await pg.goto(B+exp, wait_until="networkidle"); await pg.wait_for_timeout(500)
        check("export : carte de la candidature, invitation PDF", (await pg.locator("#who").inner_text()) == "Léna Garnier" and "PDF" in await pg.locator("#frompar").inner_text())

        # EC2 → onboarding, sur la même candidature
        lid = C[0]["id"]
        await pg.goto(B+"candidatures.html#c-"+lid, wait_until="networkidle"); await pg.wait_for_timeout(400)
        check("EC2 : ce que l'EC1 demande d'aller chercher", "mesuré après la refonte" in await pg.locator("#panel .onepager").inner_text())
        links = await pg.locator("#panel .links a").all_inner_texts()
        check("EC2 : grille de salaire et référentiel", any("Grille" in l for l in links) and any("Référentiel" in l for l in links))
        check("EC2 : fiche #2 vide signalée", "fiche #2 est encore vide" in await pg.locator("#why").inner_text())
        await pg.click("a[href^='fiche-ec2.html#c-']"); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(500)
        check("fiche #2 : barre du candidat, nom verrouillé", "Léna Garnier" in await pg.locator("#candbar").inner_text() and await pg.locator("#f-nom").evaluate("e=>e.readOnly"))
        check("fiche #2 : pas d'exemple ni de bouton Reporter", not await pg.locator("#demo").is_visible() and not await pg.locator("#report-top").is_visible())
        check("fiche #2 : l'EC1 de la candidature affichée", "mesuré après la refonte" in await pg.locator("#from1").inner_text())
        await pg.click('.scale button[data-k="0-0"][data-v="3"]'); await pg.click('.scale button[data-k="1-0"][data-v="2"]')
        await pg.fill("#ex-0-0", "A chiffré l'impact de la refonte sur les rendez-vous manqués.")
        await pg.click('#tierSeg button[data-tier="2"]')
        await pg.fill("#p-questions", "Son envie de cadrer la stratégie\nSa mobilité sur Paris")
        await pg.fill("#p-conditions", "Prétentions à confirmer dans la grille."); await pg.wait_for_timeout(700)
        check("fiche #2 : enregistré sur la candidature", "Enregistré à" in await pg.locator("#candbar").inner_text())
        C = {c["id"]: c for c in await cands(pg)}
        e2 = C[lid]["ec2"]
        check("candidature : lecture EC2 (notes, exemples, suspens)", e2 and e2["notes"][0] == 3 and e2["notes"][3] == 2 and "rendez-vous" in e2["exemples"][0] and "Paris" in e2["suspens"]["questions"])
        check("fiche #2 seule intacte", "Léna" not in (await pg.evaluate("localStorage.getItem('yeita-fiche-ec2')") or ""))
        await pg.reload(wait_until="networkidle"); await pg.wait_for_timeout(500)
        check("fiche #2 : rouverte telle qu'on l'a laissée", (await pg.locator("#ex-0-0").input_value()).startswith("A chiffré") and await pg.locator('.scale button[data-k="0-0"][data-v="3"]').get_attribute("aria-pressed") == "true")
        await pg.click("#candbar a"); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(500)
        check("retour sur l'EC2, fiche enregistrée", "Enregistrée" in await pg.locator("#panel .status").first.inner_text() and "2 étapes notées" in await pg.locator("#panel .status").first.inner_text())
        await pg.click("#next"); await pg.wait_for_timeout(400)
        check("passation EC2 : points en suspens et export pour l'EC3", "Sa mobilité sur Paris" in await pg.locator("#panel .carteprev").inner_text() and await pg.locator("#panel a", has_text="pour l'EC3").count() == 1)
        await pg.click("#next"); await pg.wait_for_timeout(400)
        C = {c["id"]: c for c in await cands(pg)}
        check("passation EC2 faite → EC3, en appel par défaut", C[lid]["parcours"]["etape"] == "ec3" and C[lid]["passations"]["ec2"]["mode"] == "appel")
        check("EC3 : questions ouvertes en tête", "Son envie de cadrer" in await pg.locator("#panel .ask3").inner_text())
        check("EC3 : pas de Non retenu, une seule sortie", await pg.locator("#refuse").count() == 0 and (await pg.locator("#next").inner_text()) == "Envoyer en décision")
        await pg.fill("#e3-par", "Mattéo"); await pg.fill("#e3-notes", "Confirme le cadrage. Mobilité : OK trois jours par semaine."); await pg.wait_for_timeout(600)
        C = {c["id"]: c for c in await cands(pg)}
        check("EC3 : bloc-notes enregistré", "trois jours" in C[lid]["ec3"]["notes"] and C[lid]["ec3"]["par"] == "Mattéo")
        await pg.click("#next"); await pg.wait_for_timeout(400)
        check("décision : rappel de l'appel, notes de l'EC3", "Appel au candidat" in await pg.locator("#panel .onepager h3").inner_text() and "trois jours" in await pg.locator("#panel .carteprev").inner_text())
        check("décision : Non retenu possible", await pg.locator("#refuse").count() == 1)
        await pg.check("#dec-call"); await pg.wait_for_timeout(300)
        await pg.click("#next"); await pg.wait_for_timeout(400)
        C = {c["id"]: c for c in await cands(pg)}
        check("onboarding : fin du parcours, carte en « embauche »", C[lid]["parcours"]["etape"] == "onboarding" and C[lid]["restitution"]["etat"] == "hire" and C[lid]["decision"]["appelFaitLe"])
        rec = await pg.locator("#panel .recap").inner_text()
        check("onboarding : récapitulatif des passages", "Passation EC1" in rec and "en asynchrone" in rec and "Thélo" in rec)
        check("onboarding : pas de barre de sorties", await pg.locator(".exits").count() == 0)
        check("historique complet : l'entrée et 7 passages, avec l'auteur", len(C[lid]["historique"]) == 8 and all(h["par"] == "Thélo" for h in C[lid]["historique"][1:]))

        # Refus en EC1, puis annulation, puis refus confirmé
        await pg.goto(B+"candidatures.html", wait_until="networkidle"); await pg.wait_for_timeout(300)
        await pg.click("#add-open"); await pg.fill("#a-prenom", "Noé"); await pg.fill("#a-nom", "Faure"); await pg.click("#add-form button[type=submit]"); await pg.wait_for_timeout(300)
        await pg.locator(".kc", has_text="Noé Faure").locator("button").click(); await pg.wait_for_timeout(400)
        await pg.check("#op-sent"); await pg.wait_for_timeout(200); await pg.click("#next"); await pg.wait_for_timeout(400)
        await pg.click("#refuse"); await pg.wait_for_timeout(200)
        check("Appel de refus : rappel téléphone, motif", "par téléphone" in await pg.locator(".refus .rappel").inner_text())
        await pg.click("#rf-go"); await pg.wait_for_timeout(200)
        check("clore sans motif : message", "motif" in await pg.locator("#rf-err").inner_text())
        await pg.select_option("#rf-motif", "poste"); await pg.fill("#rf-detail", "Cherche un poste de PO pur.")
        await pg.click("#rf-go"); await pg.wait_for_timeout(400)
        check("refus en EC1 : arrêt visible dans le stepper", await pg.locator("#steps li.stop").count() == 1 and "Pas aujourd'hui" in await pg.locator("#steps").inner_text())
        await pg.click("#undo"); await pg.wait_for_timeout(300)
        C = {c["candidat"]["nom"]: c for c in await cands(pg)}
        check("refus annulé : retour en EC1", C["Noé Faure"]["parcours"]["etape"] == "ec1")
        await pg.click("#refuse"); await pg.select_option("#rf-motif", "poste"); await pg.click("#rf-go"); await pg.wait_for_timeout(300)
        await pg.click("#back"); await pg.wait_for_timeout(400)
        clos = await pg.locator(".kcol.clos").inner_text()
        check("tableau : colonne « Pas aujourd'hui » avec le motif", "Noé Faure" in clos and "Type de poste" in clos)
        check("tableau : Léna en onboarding", "Léna Garnier" in await pg.locator(".kcol", has_text="Onboarding").first.inner_text())

        # Liste, recherche
        await pg.click("#mode [data-m=liste]"); await pg.wait_for_timeout(200)
        rows = await pg.locator("#rows tr").count()
        check("vue liste : une ligne par candidat", rows == 2)
        await pg.fill("#q", "garnier"); await pg.wait_for_timeout(200)
        check("recherche", await pg.locator("#rows tr").count() == 1)
        await pg.fill("#q", "")

        # Export / import JSON
        await pg.click("#save > summary"); await pg.click("#exp"); await pg.wait_for_timeout(300)
        txt = await pg.locator("#exp-text").input_value()
        check("export JSON", json.loads(txt)["schema"] == "yeita-candidatures" and len(json.loads(txt)["candidats"]) == 2)
        ctx2 = await b.new_context(); await ctx2.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
        q = await ctx2.new_page(); q.on("pageerror", lambda e: errs.append(str(e)))
        await q.goto(B+"candidatures.html", wait_until="networkidle")
        await q.click("#save > summary"); await q.fill("#imp-text", txt); await q.click("#imp-go"); await q.wait_for_timeout(400)
        check("import sur un autre navigateur", "2 ajoutés" in await q.locator("#imp-msg").inner_text() and await q.locator(".kc").count() == 2)
        await q.fill("#imp-text", "pas du json"); await q.click("#imp-go"); await q.wait_for_timeout(200)
        check("import illisible : message", "lisible" in await q.locator("#imp-msg").inner_text())

        # Exemples
        await q.click("#demo-load"); await q.wait_for_timeout(400)
        check("exemples : 5 de plus, marqués", await q.locator(".chip.demo").count() == 5)
        check("exemple en retard signalé", await q.locator(".late").count() >= 1)
        await q.click("#demo-clear"); await q.wait_for_timeout(300)
        check("exemples retirés, vrais candidats gardés", await q.locator(".kc").count() == 2)

        # Suppression
        await q.locator(".kc", has_text="Noé Faure").locator("a").first.click(); await q.wait_for_timeout(300)
        await q.click("#coords > summary"); await q.click("#del"); await q.click("#del-yes"); await q.wait_for_timeout(300)
        check("suppression d'un candidat", await q.locator(".kc").count() == 1)

        # Clavier
        await pg.goto(B+"candidatures.html", wait_until="networkidle"); await pg.wait_for_timeout(300)
        await pg.focus("#mode [aria-checked=true]"); await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(150)
        check("clavier : flèche dans Kanban / Liste", await pg.locator("#mode [data-m=liste]").get_attribute("aria-checked") == "true" and await pg.evaluate("document.activeElement.dataset.m") == "liste")
        check("clavier : un seul arrêt de tabulation dans Kanban / Liste", await pg.locator("#mode [tabindex='0']").count() == 1)
        await pg.click("#mode [data-m=kanban]")
        await pg.click("#add-open"); await pg.keyboard.press("Escape"); await pg.wait_for_timeout(100)
        check("clavier : Échap referme l'ajout, retour au bouton", await pg.locator("#add").is_hidden() and await pg.evaluate("document.activeElement.id") == "add-open")
        await pg.click("#add-open"); await pg.click("#add-form button[type=submit]"); await pg.wait_for_timeout(100)
        check("ajout en erreur : champ marqué invalide et relié au message", await pg.locator("#a-prenom").get_attribute("aria-invalid") == "true" and await pg.locator("#a-prenom").get_attribute("aria-describedby") == "a-err")
        await pg.keyboard.press("Escape")
        await pg.click("#add-open"); await pg.fill("#a-prenom", "Clavier"); await pg.fill("#a-nom", "Test"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(400)
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(400)
        check("clavier : Entrée sur Démarrer ouvre la candidature", "Appel de découverte" in await pg.locator("#panel h2").inner_text())
        await pg.focus("#op-sent"); await pg.keyboard.press("Space"); await pg.wait_for_timeout(300)
        await pg.focus("#next"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(400)
        check("après un passage : le focus est sur le titre de l'étape", await pg.evaluate("document.activeElement.tagName + ' ' + document.activeElement.textContent") == "H2 EC1")
        await pg.focus("#refuse"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(200)
        check("refus : le focus va au titre", await pg.evaluate("document.activeElement.id") == "rf-t")
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        check("clavier : Échap referme le refus, retour au bouton", await pg.locator(".refus").count() == 0 and await pg.evaluate("document.activeElement.id") == "refuse")
        check("stepper : les étapes pilotent le panneau", await pg.locator("#steps button[aria-controls=panel]").count() == 8 and await pg.locator("#steps button[aria-current=step]").count() == 1)

        print("errors:", errs)
        print("ALL OK" if ok_all and not errs else "SOMETHING FAILED")
        await b.close()
asyncio.run(main())
