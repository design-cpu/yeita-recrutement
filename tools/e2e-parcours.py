"""Espace Candidatures, lot 2 : EC1 et EC2 en pleine page, Bilans, carte, feuille de décompte, liens.
Candidats fictifs uniquement.
Lancer :  python3 tools/build.py _site && python3 -m http.server 8765 --directory _site
puis :    python3 tools/e2e-parcours.py"""
import asyncio, json, os, tempfile
from playwright.async_api import async_playwright
B = "http://localhost:8765/"
C = B + "candidatures/"
ok_all = True
def check(label, cond, extra=""):
    global ok_all
    ok_all = ok_all and bool(cond)
    print(("OK  " if cond else "FAIL"), label, extra)

async def get(pg, cid):
    return await pg.evaluate("id => STORE.getCandidate(id)", cid)

# Crée un candidat fictif et l'amène à une étape, par le store (les écrans de l'appel sont testés dans e2e-candidatures.py).
NOUVEAU = """async ([personne, job, jusqua]) => {
  QUI.choisir("Pauline");
  var c = await STORE.createCandidate({personne: personne, job: job, email: "fictif@example.com", recruteurs: ["Pauline"]}, "Pauline");
  c.appel.onePager = {envoyeLe: new Date().toISOString(), par: "Pauline"}; await STORE.saveCandidate(c);
  while(c.parcours.etape !== jusqua){
    if(c.parcours.etape === "ec1"){ c.ec1 = Object.assign(c.ec1 || {}, {percu: "Fictif"}); c.fiches = c.fiches || {}; c.fiches.ec1 = {f: {"f-def": "Fictif"}}; await STORE.saveCandidate(c); }
    if(c.parcours.etape === "ec2"){ c.fiches = c.fiches || {}; c.fiches.ec2 = {s: {"0-0": 2}, n: {}, t: 2, f: {}}; c.ec2 = DOSSIER.emptyEC2(); c.ec2.notes[0] = 2; await STORE.saveCandidate(c); }
    c = await STORE.moveStep(c.id, {par: "Pauline"});
  }
  return c.id;
}"""

# Une partie exportée par le jeu en ligne : Explorateur puis Jouer collectif, sans égalité.
SESSION = """() => {
  var Y = YEITA_MATCH, cards = Object.keys(Y.valueOfCard), ans = {};
  function carte(s, v){ return cards.filter(function(c){ return c.indexOf(s + "-") === 0 && Y.valueOfCard[c] === v; })[0]; }
  Y.SITUATIONS.forEach(function(s, i){ ans[s.id] = [carte(s.id, "explorateur"), carte(s.id, i < 6 ? "collectif" : "sans-chichi")].filter(Boolean); });
  return {format: "yeita-match-session", version: 2, candidateName: "Fictif", hostName: "Pauline", date: "2026-10-23", answers: ans, tiebreaks: [], notes: {}};
}"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        errs = []
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        await ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "fonts.g" not in m.text and not (m.location or {}).get("url", "").endswith("/api/moi") else None)   # /api/moi : 404 attendu sans API (mode navigateur, v1.3)
        await pg.goto(C, wait_until="networkidle")
        await pg.evaluate("localStorage.clear()"); await pg.goto(C, wait_until="networkidle")

        # 1. Parcours complet jusqu'à la Proposition
        ines = await pg.evaluate(NOUVEAU, ["Inès Roche", "PM / PO", "appel"])
        await pg.goto(C + "candidat.html?id=" + ines, wait_until="networkidle"); await pg.wait_for_timeout(300)
        await pg.click("#next"); await pg.wait_for_url("**/ec1.html?id=*"); await pg.wait_for_timeout(400)
        check("appel → EC1 : la fiche s'ouvre en pleine page, sans écran intermédiaire", "ec1.html?id=" + ines in pg.url and await pg.locator("#sheet").is_visible())
        check("EC1 : Échange libre en tête, puis Yeita Match, présentiel ou visio", await pg.evaluate("[...document.querySelectorAll('#sheet > .sec')].slice(0, 2).map(s => s.id).join()") == "s-echange,yeita-match" and await pg.locator("input[name=ym-fmt]").count() == 2)
        check("EC1 : « Non communiqué au candidat » / « Visible sur la carte du candidat », plus d'« Interne »", "Non communiqué au candidat" in await pg.locator("#sheet").inner_text() and "Visible sur la carte du candidat" in await pg.locator("#sheet").inner_text() and "Interne" not in str(await pg.locator("#sheet .tag").all_inner_texts()))
        check("EC1 : l'import JSON n'apparaît qu'en visio", not await pg.locator("#yeita-match .importer").is_visible())
        check("EC1 : une seule action principale, « Passer au bilan »", await pg.locator(".exits .btn.primary").count() == 1 and "Passer au bilan" in await pg.locator("#next").inner_text() and await pg.locator("#refuse").count() == 0)
        check("EC1 : plus de rappels de méthode, d'aide ni d'« À remplir »", await pg.locator("#sheet p.hint, #sheet .sec-aide, #sheet .tip, #sheet .state, .refs, details.ref").count() == 0)
        check("en-tête : « Guide de l'étape » sans numéro", (await pg.locator("#c-guide").inner_text()).strip() == "Guide de l'étape")
        # Panneau Notes : ouvert depuis l'Échange libre, sans perdre le défilement
        await pg.evaluate("window.scrollTo(0, 400)"); y0 = await pg.evaluate("scrollY")
        await pg.click("#np-toggle"); await pg.wait_for_timeout(200)
        await pg.fill("#np-text", "Pitch écouté, questions sur le staffing."); await pg.wait_for_timeout(900)
        check("Notes : panneau à droite, le défilement ne bouge pas", await pg.locator("#np").is_visible() and await pg.evaluate("scrollY") == y0 and "EC1" in await pg.locator("#np-t").inner_text())
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        check("Notes : Échap ferme, focus sur le bouton Notes", not await pg.locator("#np").is_visible() and await pg.evaluate("document.activeElement.id") == "np-toggle")
        c = await get(pg, ines)
        check("Notes de l'EC1 enregistrées sur la candidature", c["notesLibres"].get("ec1") == "Pitch écouté, questions sur le staffing.")
        # Employabilité : visible sur la carte dès qu'un état est choisi, « Masquer sur la carte »
        if not await pg.locator("#s-emp").evaluate("e => e.open"): await pg.click("#s-emp > summary")
        await pg.click('.cpills button[data-c="poste"][data-s="aligne"]'); await pg.wait_for_timeout(700)
        c = await get(pg, ines)
        check("Employabilité : un état choisi → visible sur la carte, interrupteur « Masquer sur la carte » décoché", c["ec1"]["employabilite"]["criteres"]["poste"]["afficher"] is True and not await pg.locator("#ca-poste").is_checked() and "Masquer sur la carte" in await pg.locator('.crit[data-c="poste"]').inner_text())
        await pg.click("label:has(#ca-poste)"); await pg.wait_for_timeout(700)
        c = await get(pg, ines)
        check("Employabilité : « Masquer sur la carte » retire le critère", c["ec1"]["employabilite"]["criteres"]["poste"]["afficher"] is False)
        await pg.click('.vbtn[data-r="dom"][data-v="explorateur"]'); await pg.click('.vbtn[data-r="sec"][data-v="collectif"]')
        if not await pg.locator("#s-percu").evaluate("e => e.open"): await pg.click("#s-percu > summary")
        await pg.fill("#f-def", "Part du terrain avant la méthode."); await pg.wait_for_timeout(700)
        c = await get(pg, ines)
        check("EC1 saisie à la main : Dominante et Seconde sur la candidature", c["ec1"]["match"]["dominante"] == "explorateur" and c["ec1"]["match"]["seconde"] == "collectif" and c["ec1"]["match"]["source"] == "saisie")
        await pg.click("#next"); await pg.wait_for_url("**/candidat.html?id=*etape=bilan-ec1"); await pg.wait_for_timeout(300)
        check("passage confirmé : « EC1 validé → Bilan EC1 »", "EC1 validé → Bilan EC1" in await pg.locator("#notice").inner_text(), await pg.locator("#notice").inner_text())
        await pg.wait_for_timeout(800)
        fr = pg.frame_locator("#carte-frame")
        rec = await fr.locator("#card").inner_text()
        check("Bilan EC1 : la carte d'identité dans la page, pleine largeur, avec Imprimer", "Part du terrain" in rec and "Explorateur" in rec and "imprimer=1" in await pg.locator("#panel a.print").get_attribute("href") and await pg.locator("#carte-frame").evaluate("f => f.offsetWidth >= f.parentElement.offsetWidth - 2"))
        check("carte : mention RGPD (6 mois)", "6 mois après la fin de ton recrutement" in rec)
        check("Bilan EC1 : Continuer, Non retenu, Mettre en attente", await pg.locator("#next").count() == 1 and await pg.locator("#refuse").count() == 1 and "Mettre en attente (retour à faire)" in await pg.locator("#reflexion").inner_text())
        await pg.click("#next"); await pg.wait_for_url("**/ec2.html?id=*"); await pg.wait_for_timeout(400)
        check("Bilan EC1 → EC2 en pleine page", "ec2.html?id=" + ines in pg.url and await pg.locator("#diamonds").is_visible())
        await pg.locator(".scale button").nth(3).click()
        check("EC2 : rôle en lecture seule, repris du Job", (await pg.locator("#role-v").inner_text()) == "Product Manager" and await pg.locator(".controls [role=radio]:has-text('Product Designer')").count() == 0)
        check("EC2 : pas de souhait de rémunération → palier vide, non suggéré", await pg.locator("#tierSeg [aria-checked=true]").count() == 0 and await pg.locator("#tier-sugg").is_hidden())
        check("EC2 : plus de « point d'appui », de matrice ni de trame dans la fiche", await pg.locator("#verdict, #matrix, .trame, #f-libres, #fold").count() == 0 and "Point d'appui" not in await pg.locator("main").inner_text())
        await pg.click("#np-toggle"); await pg.fill("#np-text", "Piste de mission santé."); await pg.wait_for_timeout(900)
        c = await get(pg, ines)
        check("EC2 : notes dans le panneau Notes (notesLibres.ec2)", c["notesLibres"].get("ec2") == "Piste de mission santé.")
        check("EC2 : les notes de l'EC1 se relisent dans le panneau", "Pitch écouté" in await pg.locator("#np").text_content())
        await pg.click("#np-x")
        hrefs = await pg.eval_on_selector_all("#liens-in a", "l => l.map(a => a.textContent + ' ' + a.getAttribute('href'))")
        check("EC2 : liens scorecard, grille de salaire, guide, carte du candidat", len(hrefs) == 4 and any("carte.html?id=" + ines in h for h in hrefs), str(hrefs))
        await pg.click("#next"); await pg.wait_for_url("**/candidat.html?id=*etape=bilan-ec2"); await pg.wait_for_timeout(300)
        imp = pg.locator("#panel a.print")
        check("Bilan EC2 : Imprimer la carte, en action secondaire", await imp.count() == 1 and "carte.html?id=" + ines + "&imprimer=1" in await imp.get_attribute("href") and "primary" not in await imp.get_attribute("class"))
        await pg.click("#next"); await pg.wait_for_timeout(400)
        check("EC3 : la carte complète, Imprimer, Notes", await pg.locator("#carte-frame").count() == 1 and await pg.locator("#panel a.print").count() == 1 and await pg.locator("[data-open-notes]").count() == 1)
        check("EC3 : une seule action, pas de refus", "EC3" in await pg.locator("#panel h2").inner_text() and await pg.locator("#refuse").count() == 0 and "Envoyer en décision" in await pg.locator("#next").inner_text())
        await pg.click("[data-open-notes]"); await pg.fill("#np-text", "Échange sur la carte, rien à corriger."); await pg.wait_for_timeout(700); await pg.click("#np-x")
        await pg.click("#next"); await pg.wait_for_timeout(400)
        check("Décision : notes de l'EC3 reprises du panneau, plus d'« Appel au candidat »", "rien à corriger" in await pg.locator("#panel").inner_text() and await pg.locator("#dec-call").count() == 0)
        await pg.click("#dec-go"); await pg.wait_for_timeout(150)
        check("Décision : un choix est demandé", await pg.locator("#dec-err").is_visible())
        await pg.check("input[name=dec][value=proposition]"); await pg.click("#dec-go"); await pg.wait_for_timeout(150)
        check("Décision : un commentaire court est demandé", await pg.locator("#dec-err").is_visible())
        await pg.fill("#dec-com", "Palier 2, démarrage en novembre."); await pg.click("#dec-go"); await pg.wait_for_timeout(400)
        c = await get(pg, ines)
        check("Proposition d'embauche : étape et commentaire", c["parcours"]["etape"] == "proposition" and c["decision"]["commentaire"].startswith("Palier 2"))
        check("Proposition : « Arrivée confirmée » mène à l'Onboarding", "Arrivée confirmée" in await pg.locator("#next").inner_text())
        check("Proposition : l'appel au candidat est ici", await pg.locator("#dec-call").count() == 1)
        await pg.check("#dec-call"); await pg.wait_for_timeout(600)
        check("Proposition : appel fait, enregistré", (await get(pg, ines))["decision"]["appelFaitLe"] is not None)
        await pg.click("#next"); await pg.wait_for_timeout(500)
        fin = await pg.locator(".fin").inner_text()
        check("Arrivée confirmée : écran de fin (succès, parcours, export de la carte)", "Inès rejoint Yeita" in fin and "Bilan EC2" in fin and "imprimer=1" in await pg.locator(".fin a.print").get_attribute("href") and "Exporter la carte" in await pg.locator(".fin a.print").inner_text())
        await pg.goto(C + "candidat.html?id=" + ines + "&etape=proposition", wait_until="networkidle"); await pg.wait_for_timeout(300)
        await pg.goto(C + "ec1.html?id=" + ines, wait_until="networkidle"); await pg.wait_for_timeout(300)
        check("EC1 revue plus tard : « Retour au parcours » vers l'étape en cours", "Retour au parcours" in await pg.locator("#exits").inner_text() and "etape=onboarding" in await pg.locator("#exits a").get_attribute("href"))

        # 2. Feuille de décompte → fiche EC1 du même candidat (bug 1)
        hugo = await pg.evaluate(NOUVEAU, ["Hugo Lenoir", "PrD", "ec1"])
        lena = await pg.evaluate(NOUVEAU, ["GARNIER Léna", "PrD", "ec1"])
        await pg.goto(C + "ec1.html?id=" + hugo, wait_until="networkidle"); await pg.wait_for_timeout(300)
        await pg.click("#liens > summary")
        dec = pg.locator("#liens-in a", has_text="Feuille de décompte")
        check("EC1 : la feuille de décompte s'ouvre pour ce candidat", await dec.get_attribute("href") == "decompte.html?id=" + hugo)
        await dec.click(); await pg.wait_for_url("**/decompte.html?id=*"); await pg.wait_for_timeout(300)
        check("décompte : nom du candidat repris, en lecture seule", await pg.locator("#f-cand").input_value() == "Hugo Lenoir" and await pg.locator("#f-cand").get_attribute("readonly") is not None)
        sess = await pg.evaluate(SESSION)
        boxes = [cid for s in sess["answers"].values() for cid in s]
        for cid in boxes: await pg.locator(f'.round input[value="{cid}"]').check()
        await pg.wait_for_timeout(200)
        check("décompte : le bouton nomme le candidat", "Hugo Lenoir" in await pg.locator("#to-fiche").inner_text())
        await pg.click("#to-fiche"); await pg.wait_for_url("**/ec1.html?id=*"); await pg.wait_for_timeout(700)
        c = await get(pg, hugo)
        check("décompte → EC1 : le résultat met la fiche à jour, sans nom à faire correspondre", pg.url.endswith("ec1.html?id=" + hugo) and c["ec1"]["match"]["dominante"] == "explorateur" and c["ec1"]["match"]["source"] == "decompte", str(c["ec1"]["match"]))
        check("décompte : la feuille est gardée sur la candidature", len((c.get("fiches") or {}).get("decompte", {}).get("answers", {})) == 8)
        l = await get(pg, lena)
        check("décompte : l'autre candidat n'est pas touché", not (l.get("ec1") or {}).get("match", {}).get("dominante"))
        await pg.goto(C + "decompte.html", wait_until="networkidle"); await pg.wait_for_timeout(200)
        check("décompte sans candidat : rien à reporter, rien de gardé", await pg.locator("#sans-cand").is_visible() and await pg.locator("#to-fiche").count() == 0 and await pg.evaluate("localStorage.getItem('yeita-match-decompte')") is None)

        # 3. Résultat importé en JSON (visio)
        await pg.goto(C + "ec1.html?id=" + lena, wait_until="networkidle"); await pg.wait_for_timeout(300)
        await pg.click("label:has(input[name=ym-fmt][value=visio])"); await pg.wait_for_timeout(150)
        check("EC1 en visio : l'import du jeu en ligne apparaît", await pg.locator("#yeita-match .importer").is_visible())
        f = os.path.join(tempfile.mkdtemp(), "partie.json"); open(f, "w").write(json.dumps(sess))
        await pg.set_input_files("#f-json", f); await pg.wait_for_timeout(800)
        l = await get(pg, lena)
        check("EC1 : partie JSON importée", l["ec1"]["match"]["dominante"] == "explorateur" and l["ec1"]["match"]["source"] == "jeu-en-ligne" and l["fiches"]["ec1"]["f"]["f-fmt"] == "visio")

        # 4. Non retenu au Bilan EC1
        yanis = await pg.evaluate(NOUVEAU, ["Yanis Brun", "Ops", "bilan-ec1"])
        await pg.goto(C + "candidat.html?id=" + yanis, wait_until="networkidle"); await pg.wait_for_timeout(300)
        await pg.click("#refuse"); await pg.wait_for_timeout(200)
        exp = pg.locator("#panel .refus a", has_text="Exporter la carte")
        check("Non retenu au bilan : appel de refus, export de la carte de ce candidat", await exp.count() == 1 and await exp.get_attribute("href") == "carte.html?id=" + yanis + "&imprimer=1")
        await pg.select_option("#rf-motif", index=1); await pg.fill("#rf-detail", "Pas de match sur le rythme."); await pg.click("#rf-go"); await pg.wait_for_timeout(400)
        c = await get(pg, yanis)
        check("Non retenu : parcours clos depuis le Bilan EC1", c["parcours"]["etape"] == "non-retenu" and c["parcours"]["cloture"]["depuis"] == "bilan-ec1" and c["etat"] == "non-retenu")

        # 4 bis. Mise en attente au Bilan EC1
        zoe = await pg.evaluate(NOUVEAU, ["Zoé Marchal", "PM / PO", "bilan-ec1"])
        await pg.goto(C + "candidat.html?id=" + zoe, wait_until="networkidle"); await pg.wait_for_timeout(300)
        await pg.click("#reflexion"); await pg.wait_for_timeout(400)
        c = await get(pg, zoe)
        check("Mise en attente : retour à faire, la carte reste au Bilan EC1", c["parcours"]["etape"] == "bilan-ec1" and c["etat"] == "retour-a-faire" and "Mis en attente" in await pg.locator("#notice").inner_text())

        # 4 ter. Palier suggéré depuis le souhait de rémunération
        sam = await pg.evaluate(NOUVEAU, ["Sam Perrin", "PM / PO", "ec2"])
        await pg.evaluate("""async id => { var c = await STORE.getCandidate(id); c.appel.reponses.remuneration = "Autour de 64 k€"; c.fiches = {}; c.ec2 = null; await STORE.saveCandidate(c); }""", sam)
        await pg.goto(C + "ec2.html?id=" + sam, wait_until="networkidle"); await pg.wait_for_timeout(400)
        check("EC2 : palier suggéré depuis 64 k€ (Je structure / diffuse), marqué « suggéré »", await pg.locator("#tierSeg [data-tier='3']").get_attribute("aria-checked") == "true" and await pg.locator("#tier-sugg").is_visible() and "suggéré" in await pg.locator("#tier-sugg").inner_text())
        await pg.click("#tierSeg [data-tier='2']"); await pg.wait_for_timeout(700)
        check("EC2 : le palier se change ; la mention « suggéré » disparaît", await pg.locator("#tier-sugg").is_hidden() and (await get(pg, sam))["fiches"]["ec2"]["t"] == 2)

        # 5. Vivier depuis la Décision
        nora = await pg.evaluate(NOUVEAU, ["Nora Vidal", "PM / PO", "decision"])
        await pg.goto(C + "candidat.html?id=" + nora, wait_until="networkidle"); await pg.wait_for_timeout(300)
        await pg.check("input[name=dec][value=vivier]"); await pg.fill("#dec-com", "À recontacter en septembre."); await pg.click("#dec-go"); await pg.wait_for_timeout(400)
        c = await get(pg, nora)
        check("Vivier : étape, commentaire, carte dans la colonne masquée", c["parcours"]["etape"] == "vivier" and c["decision"]["commentaire"].startswith("À recontacter"))

        # 6. Carte d'identité : un lien, un candidat
        await pg.goto(C + "carte.html?id=" + hugo, wait_until="networkidle"); await pg.wait_for_timeout(400)
        check("carte : celle du candidat demandé", await pg.locator("#who").inner_text() == "Hugo Lenoir" and "Hugo Lenoir" in await pg.locator("#carte-t").inner_text())
        check("carte : pas de liste pour passer à un autre candidat", not await pg.locator("#sel").is_visible() and not await pg.locator("#imp").is_visible())
        check("carte : « Retour au parcours »", await pg.locator("#retour").is_visible() and await pg.locator("#retour").get_attribute("href") == "candidat.html?id=" + hugo)
        await pg.goto(C + "carte.html", wait_until="networkidle"); await pg.wait_for_timeout(300)
        check("carte sans identifiant : l'exemple fictif, jamais le dernier candidat ouvert", "Camille Rousseau" in await pg.locator("#who").inner_text() and not await pg.locator("#retour").is_visible())
        await pg.goto(C + "carte.html?id=cand-inconnu", wait_until="networkidle"); await pg.wait_for_timeout(300)
        check("carte d'un identifiant inconnu : rien d'affiché", await pg.locator("#missing").is_visible() and not await pg.locator(".stage").is_visible())
        await pg.goto(C + "ec2.html?id=cand-inconnu", wait_until="networkidle"); await pg.wait_for_timeout(200)
        check("EC2 d'un identifiant inconnu : rien d'affiché", await pg.locator("#missing").is_visible() and not await pg.locator("#body").is_visible())

        # 7. Anciennes adresses
        for old, want in [("fiche-ec1.html#c-" + hugo, "candidatures/ec1.html?id=" + hugo), ("fiche-ec2.html#c-" + hugo, "candidatures/ec2.html?id=" + hugo),
                          ("carte-identite.html#p-" + hugo, "candidatures/carte.html?id=" + hugo + "&imprimer=1"), ("carte-identite.html#embauche", "candidatures/carte.html?exemple=embauche"),
                          ("yeita-match-decompte.html#vierge", "candidatures/decompte.html?vierge=1"), ("fiche-ec1.html", "candidatures/")]:
            await pg.goto(B + old, wait_until="networkidle"); await pg.wait_for_timeout(150)
            check("ancienne adresse " + old.split("#")[0] + ("#" + old.split("#")[1][:2] if "#" in old else ""), pg.url.endswith(want), pg.url)
        await pg.goto(B + "index.html#debrief-ec1", wait_until="networkidle"); await pg.wait_for_timeout(300)
        check("hub : #debrief-ec1 ouvre l'étape Bilan EC1 du guide", "Bilan EC1" in await pg.locator("#guide").inner_text())

        # 8. Tous les liens de l'espace, pour un candidat : ceux qui le concernent portent son identifiant
        bad = []
        for page in ["candidat.html?id=" + hugo, "ec1.html?id=" + hugo, "ec2.html?id=" + ines, "carte.html?id=" + hugo, "decompte.html?id=" + hugo]:
            await pg.goto(C + page, wait_until="networkidle"); await pg.wait_for_timeout(300)
            want = ines if ines in page else hugo
            hs = await pg.eval_on_selector_all("a[href]", "l => l.map(a => a.getAttribute('href'))")
            for h in hs:
                if any(k in h for k in ["ec1.html", "ec2.html", "carte.html", "decompte.html", "candidat.html"]) and "vierge" not in h and "exemple" not in h:
                    if "id=" + want not in h: bad.append(page.split("?")[0] + " → " + h)
        check("liens de l'espace : chacun propre au candidat", not bad, str(bad[:6]))

        # 9. Téléphone
        m = await b.new_context(viewport={"width": 390, "height": 844}, color_scheme="dark")
        await m.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
        mp = await m.new_page(); mp.on("pageerror", lambda e: errs.append(str(e)))
        await mp.goto(C, wait_until="networkidle")
        st = await pg.evaluate("localStorage.getItem('yeita-dossiers')")
        await mp.evaluate("s => localStorage.setItem('yeita-dossiers', s)", st)
        wide = []
        for page in ["ec1.html?id=" + hugo, "ec2.html?id=" + ines, "carte.html?id=" + hugo, "decompte.html?id=" + hugo, "candidat.html?id=" + yanis]:
            await mp.goto(C + page, wait_until="networkidle"); await mp.wait_for_timeout(300)
            if not await mp.evaluate("document.documentElement.scrollWidth <= innerWidth"): wide.append(page.split("?")[0])
        check("téléphone : pas de défilement horizontal (EC1, EC2, carte, décompte, candidat)", not wide, str(wide))
        await m.close()

        print("errors:", errs)
        print("ALL OK" if ok_all and not errs else "SOMETHING FAILED")
        await b.close()
asyncio.run(main())
