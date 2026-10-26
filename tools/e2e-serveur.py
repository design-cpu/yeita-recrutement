"""Espace Candidatures en mode serveur, de bout en bout : la vraie API (api/), sur une base temporaire, sert aussi le site
construit (DEV_STATIC) ; chaque navigateur porte son identité par X-Forwarded-Email, comme derrière oauth2-proxy.
DEV_EMAIL (Alice) n'identifie que les requêtes sans en-tête : l'envoi de départ (keepalive, après le déchargement de la
page) ne reçoit pas les en-têtes ajoutés par Playwright ; en production, le cookie de session part avec lui.
Équipe de test : Alice et Bob (recruteur), Léa (lecture). Les réponses que l'API ne produit pas (oauth2-proxy, réseau,
lenteur) sont simulées par interception réseau.
Prérequis : Node 22 et `npm ci` dans api/, Playwright Python.
Lancer :  python3 tools/build.py _site && python3 tools/e2e-serveur.py
(Sans Playwright ni Node sur le poste : voir hlyja/technique/conventions.md, § Tests.)"""
import asyncio, json, os, re, shutil, signal, subprocess, sys, tempfile, time, urllib.request
from playwright.async_api import async_playwright

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.environ.get("E2E_SITE", os.path.join(RACINE, "_site"))
PORT = int(os.environ.get("E2E_PORT", "18765"))
B = "http://127.0.0.1:%d/" % PORT
C = B + "candidatures/"
ECHEANCE = 20000      # par vérification (ms) : un blocage échoue avec son message
EQUIPE = [("alice@yeita.fr", "Alice", "recruteur"), ("bob@yeita.fr", "Bob", "recruteur"), ("lea@yeita.fr", "Léa", "lecture")]
ok_all = True
def check(label, cond, extra=""):
    global ok_all
    ok_all = ok_all and bool(cond)
    print(("OK  " if cond else "FAIL"), label, extra)

def lancer_api(base):
    env = dict(os.environ, HOST="127.0.0.1", PORT=str(PORT), DB_PATH=os.path.join(base, "e2e.sqlite"), DEV_STATIC=SITE, NODE_ENV="", DEV_EMAIL="alice@yeita.fr")
    for email, prenom, role in EQUIPE:
        subprocess.run(["node", os.path.join(RACINE, "api", "equipe.js"), "add", email, prenom, role], env=env, check=True, capture_output=True)
    journal = open(os.path.join(base, "api.log"), "w")
    p = subprocess.Popen(["node", os.path.join(RACINE, "api", "server.js")], env=env, stdout=journal, stderr=subprocess.STDOUT)
    fin = time.time() + 10
    while time.time() < fin:
        try:
            if urllib.request.urlopen(B + "api/sante", timeout=1).status == 200: return p
        except Exception: time.sleep(0.2)
    p.kill(); raise SystemExit("FAIL l'API ne répond pas sur %s en 10 s (%s)" % (B, os.path.join(base, "api.log")))

def api(email, methode, chemin, corps=None):
    r = urllib.request.Request(B + "api/" + chemin, method=methode, headers={"X-Forwarded-Email": email, "Content-Type": "application/json", "Accept": "application/json"},
                               data=json.dumps(corps).encode() if corps is not None else None)
    try:
        with urllib.request.urlopen(r, timeout=5) as rep: return rep.status, (json.loads(rep.read() or b"null"))
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b"null")

async def contexte(b, email):
    ctx = await b.new_context(viewport={"width": 1440, "height": 900}, extra_http_headers={"X-Forwarded-Email": email} if email else {})
    ctx.set_default_timeout(ECHEANCE)
    await ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
    return ctx

async def ouvrir(ctx, url):
    pg = await ctx.new_page()
    pg.erreurs = []
    pg.on("pageerror", lambda e: pg.erreurs.append(str(e)))
    await pg.goto(url, wait_until="networkidle")
    return pg

async def bandeau(pg):
    el = pg.locator(".demarrage-bandeau")
    return (await el.inner_text()) if await el.count() else ""

def derniers_put(base, n=4):
    lignes = [json.loads(l) for l in open(os.path.join(base, "api.log")) if l.startswith("{")]
    ids = {l["reqId"]: l["req"]["method"] for l in lignes if "req" in l}
    return " ".join(str(l["res"]["statusCode"]) for l in lignes if "res" in l and ids.get(l["reqId"]) == "PUT")[-4 * n:]

async def stockage(pg):
    return await pg.evaluate("JSON.stringify(Object.assign({}, localStorage)) + JSON.stringify(Object.assign({}, sessionStorage))")

async def principal():
    base = tempfile.mkdtemp(prefix="e2e-serveur-")
    proc = lancer_api(base)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            alice, bob, lea = await contexte(b, "alice@yeita.fr"), await contexte(b, "bob@yeita.fr"), await contexte(b, "lea@yeita.fr")

            # --- Démarrage : attendre /api/moi avant toute lecture (CA1) ---
            pg = await alice.new_page(); vus = []
            pg.on("request", lambda r: vus.append((time.time(), r.url)))
            moi_t = {}
            async def lent(route):
                await asyncio.sleep(2); moi_t["t"] = time.time(); await route.continue_()
            await pg.route("**/api/moi", lent)
            await pg.goto(C, wait_until="networkidle")
            avant = [u for t, u in vus if "/api/candidats" in u and t < moi_t.get("t", 0)]
            check("démarrage : /api/moi retardé de 2 s, aucune requête /api/candidats avant sa réponse", moi_t and not avant, str(avant))
            check("démarrage : mode serveur", await pg.evaluate("DEMARRAGE.mode()") == "serveur")
            await pg.close()

            # --- Prénom sans liste (CA10) ---
            pg = await ouvrir(alice, C)
            qui = await pg.locator("#qui").inner_text()
            check("prénom sans liste : « Connecté·e : Alice », aucun sélecteur", "Connecté·e : Alice" in qui and await pg.locator("#qui-sel").count() == 0, qui)
            pl = await ouvrir(lea, C)
            check("lecteur : « Connecté·e : Léa · lecture seule »", "Connecté·e : Léa · lecture seule" in await pl.locator("#qui").inner_text())
            check("import en mode serveur : pas d'option « Remplacer tout » (CA14)", await pg.locator('input[name="imp-mode"][value="remplacement"]').count() == 0
                  and await pg.locator('input[name="imp-mode"][value="fusion"]').count() == 1)

            # --- Création puis rechargement (CA4) ---
            await pg.click("#add-open"); await pg.fill("#a-personne", "Repère Zéphyrin")
            await pg.click('#add-form button[value="liste"]'); await pg.wait_for_timeout(600)
            await pg.reload(wait_until="networkidle")
            check("création puis rechargement : la candidature est là", await pg.locator(".kc", has_text="Repère Zéphyrin").count() == 1)
            st, liste = api("alice@yeita.fr", "GET", "candidats")
            cible = [x for x in liste if x["data"]["candidat"]["nom"] == "Repère Zéphyrin"]
            check("création : lue depuis l'API, au nom d'Alice dans l'historique (CA10)", st == 200 and len(cible) == 1 and cible[0]["data"]["historique"][0]["par"] == "Alice")
            cid = cible[0]["id"] if cible else ""
            check("import en mode serveur : texte d'export « copie » (CA14)", "Un export est une copie" in (await pg.locator("#lastexp").text_content() or ""))
            check("création : rien dans yeita-dossiers", await pg.evaluate("localStorage.getItem('yeita-dossiers')") is None)
            options = await pg.evaluate("QUI.equipe()")
            check("champ Recruteurs : les prénoms de /api/equipe (CA10)", options[:3] == ["Alice", "Bob", "Léa"], str(options))

            # --- Options de disponibilité (CA11) ---
            await pg.evaluate("STORE.addDispo('Fin 2027')"); await pg.wait_for_timeout(300)
            pb = await ouvrir(bob, C)
            check("options : ajoutée par Alice, proposée à Bob", "Fin 2027" in await pb.evaluate("STORE.dispos()"))
            check("options : rien dans yeita-options-disponibilite", await pg.evaluate("localStorage.getItem('yeita-options-disponibilite')") is None)

            # --- Retour sur l'onglet (CA12) ---
            await pg.evaluate("document.querySelector('.kc').dataset.repere = '1'")
            await pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(500)
            check("retour sur l'onglet sans changement : le tableau n'est pas redessiné", await pg.evaluate("!!document.querySelector('.kc[data-repere]')"))
            st, d = api("bob@yeita.fr", "GET", "candidats/" + cid); d["data"]["identite"]["personne"] = "Repère Zéphyrin Bis"; d["data"]["meta"]["modifieLe"] = "2030-01-01T00:00:00.000Z"
            api("bob@yeita.fr", "PUT", "candidats/" + cid, {"version": d["version"], "data": d["data"]})
            await pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(500)
            check("retour sur l'onglet : la modification de Bob apparaît sans rechargement (CA12)", await pg.locator(".kc", has_text="Zéphyrin Bis").count() == 1)

            # --- Conflit entre deux navigateurs (CA5) ---
            pa = await ouvrir(alice, C + "candidat.html?id=" + cid); pb2 = await ouvrir(bob, C + "candidat.html?id=" + cid)
            await pb2.locator("#i-email").first.fill("bob@example.com"); await pb2.wait_for_timeout(900)
            await pa.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await pa.locator("#i-telephone").first.fill("0611111111"); await pa.wait_for_timeout(900)
            txt = await bandeau(pa)
            check("conflit : refus, bandeau avec le message et la saisie non enregistrée", "modifiée par quelqu'un d'autre" in txt and "copie-le avant de recharger" in txt and "Recharger" in txt, txt[:120])
            boite = await pa.locator(".demarrage-bandeau").bounding_box()
            check("conflit : bandeau visible page défilée en bas", boite is not None and boite["y"] >= 0 and boite["y"] < 200, str(boite))
            check("conflit : « Non enregistré », saisie toujours à l'écran", "Non enregistré" in await pa.locator("#saved").first.inner_text() and await pa.locator("#i-telephone").first.input_value() == "0611111111")
            st, d = api("alice@yeita.fr", "GET", "candidats/" + cid)
            check("conflit : la base garde la version de Bob", d["data"]["identite"]["email"] == "bob@example.com" and d["data"]["identite"]["telephone"] != "0611111111")
            await pa.close(); await pb2.close()

            # --- Pas de conflit avec soi-même, réponses lentes (CA6) ---
            pa = await ouvrir(alice, C + "candidat.html?id=" + cid)
            async def put_lent(route):
                if route.request.method != "PUT": return await route.continue_()
                rep = await route.fetch(); await asyncio.sleep(1); await route.fulfill(response=rep)
            await pa.route("**/api/candidats/*", put_lent)
            for i in range(3):
                await pa.locator("#i-telephone").first.fill("07000000%02d" % i); await pa.wait_for_timeout(500)
            await pa.wait_for_timeout(3000)
            st, d = api("alice@yeita.fr", "GET", "candidats/" + cid)
            check("pas de conflit avec soi-même : PUT lents, saisie continue, aucun bandeau, dernière valeur en base", await bandeau(pa) == "" and d["data"]["identite"]["telephone"] == "0700000002", d["data"]["identite"]["telephone"])

            # --- Départ de la page (CA8) ---
            await pa.locator("#i-telephone").first.fill("0799999999")
            await pa.wait_for_timeout(450)                        # un PUT part, sa réponse revient 1 s plus tard
            await pa.locator("#i-telephone").first.fill("0788888888")
            await pa.wait_for_timeout(100); await pa.goto(C, wait_until="networkidle"); await asyncio.sleep(1.5)
            st, d = api("alice@yeita.fr", "GET", "candidats/" + cid)
            check("départ de la page (candidat.html), PUT précédent lent : la dernière frappe est en base", d["data"]["identite"]["telephone"] == "0788888888", d["data"]["identite"]["telephone"] + " · PUT : " + derniers_put(base))
            await pa.close()

            # --- Départ de la fiche EC1 (CA8), sans autre page ouverte ---
            p1 = await ouvrir(alice, C + "ec1.html?id=" + cid)
            await p1.fill("#f-def", "Perçu repère 0"); await p1.wait_for_timeout(700)
            await p1.fill("#f-def", "Perçu au départ"); await p1.wait_for_timeout(80); await p1.goto(C, wait_until="networkidle"); await asyncio.sleep(1)
            st, d = api("alice@yeita.fr", "GET", "candidats/" + cid)
            check("départ de la page (ec1.html) : la dernière frappe est en base", "Perçu au départ" in json.dumps(d["data"]["fiches"].get("ec1"), ensure_ascii=False), "PUT : " + derniers_put(base))
            await p1.close()

            # --- Fiches ensemble : EC1 et décompte (CA7) ---
            p1 = await ouvrir(alice, C + "ec1.html?id=" + cid); p2 = await ouvrir(alice, C + "decompte.html?id=" + cid)
            await p1.fill("#f-def", "Perçu repère A"); await p1.wait_for_timeout(700)
            await p2.locator("textarea[data-n]").first.fill("Note décompte B"); await p2.wait_for_timeout(700)
            await p1.fill("#f-def", "Perçu repère C"); await p1.wait_for_timeout(700)
            await p2.locator("textarea[data-n]").first.fill("Note décompte D"); await p2.wait_for_timeout(700)
            st, d = api("alice@yeita.fr", "GET", "candidats/" + cid)
            dec = json.dumps(d["data"]["fiches"].get("decompte"), ensure_ascii=False); ec1 = json.dumps(d["data"]["fiches"].get("ec1"), ensure_ascii=False)
            check("fiches ensemble : EC1 et décompte alternés, chaque partie en base, aucun bandeau",
                  "Perçu repère C" in ec1 and "Note décompte D" in dec and await bandeau(p1) == "" and await bandeau(p2) == "")
            await p1.close(); await p2.close()
            # Deux onglets EC2 : même partie changée ailleurs → refus
            e1 = await ouvrir(alice, C + "ec2.html?id=" + cid); e2 = await ouvrir(bob, C + "ec2.html?id=" + cid)
            await e1.fill("#f-libres", "Notes EC2 d'Alice"); await e1.wait_for_timeout(800)
            puts = []; e2.on("request", lambda r: puts.append(r) if r.method == "PUT" else None)
            await e2.fill("#f-libres", "Notes EC2 périmées"); await e2.wait_for_timeout(800)
            st, d = api("alice@yeita.fr", "GET", "candidats/" + cid)
            check("deux onglets EC2 : refus avec bandeau, aucun PUT du second, notes du premier en base (CA7)",
                  "modifiée par quelqu'un d'autre" in await bandeau(e2) and not puts and "Notes EC2 d'Alice" in json.dumps(d["data"]["fiches"].get("ec2"), ensure_ascii=False))
            await e1.close(); await e2.close()

            # --- Rôle lecture (CA9) ---
            pl2 = await ouvrir(lea, C + "candidat.html?id=" + cid)
            await pl2.locator("#i-telephone").first.fill("0100000000"); await pl2.wait_for_timeout(900)
            txt = await bandeau(pl2)
            check("lecteur : écriture refusée, « Lecture seule », sans bouton", "Lecture seule : tu ne peux pas modifier." in txt and await pl2.locator(".demarrage-bandeau button").count() == 0, txt)
            await pl2.close()

            # --- Suppression de bout en bout (CA21) ---
            st, d = api("alice@yeita.fr", "GET", "candidats/" + cid)
            bc = await ouvrir(bob, C + "candidat.html?id=" + cid); be = await ouvrir(bob, C + "ec1.html?id=" + cid)
            pa = await ouvrir(alice, C + "candidat.html?id=" + cid)
            await pa.click("#danger summary"); await pa.click("#del"); await pa.click("#del-yes"); await pa.wait_for_timeout(800)
            check("suppression : DELETE, plus dans l'API", api("alice@yeita.fr", "GET", "candidats/" + cid)[0] == 404)
            await bc.locator("#i-telephone").first.fill("0655555555"); await be.fill("#f-def", "Après suppression"); await bc.wait_for_timeout(1000)
            check("suppression : saisie chez Bob → aucune recréation, bandeau", api("bob@yeita.fr", "GET", "candidats/" + cid)[0] == 404 and "modifiée" in await bandeau(bc) and "modifiée" in await bandeau(be))
            tb = await ouvrir(bob, C)
            check("suppression : au tableau de Bob, la candidature a disparu", await tb.locator(".kc", has_text="Repère Zéphyrin").count() == 0)
            tout = (await stockage(pa)) + (await stockage(bc)) + (await stockage(tb))
            check("suppression : le repère n'est dans aucun stockage des navigateurs (CA1, CA21)", "Zéphyrin" not in tout and "Perçu repère" not in tout)
            journal = open(os.path.join(base, "api.log")).read()
            check("suppression : le repère n'est pas dans le journal de l'API", "Zéphyrin" not in journal and "Perçu repère" not in journal)
            bruts = b"".join(open(os.path.join(base, f), "rb").read() for f in os.listdir(base) if f.startswith("e2e.sqlite"))
            check("suppression : le repère n'est plus dans les fichiers de la base (sans VACUUM)", "Zéphyrin".encode() not in bruts and b"Perc" not in bruts)

            # --- Réponses simulées au démarrage (CA2, CA3) ---
            async def demarrage(route_fn, attente=1500):
                ctx = await contexte(b, "alice@yeita.fr"); pg = await ctx.new_page(); req = []
                pg.on("request", lambda r: req.append(r.url))
                await pg.route("**/api/moi", route_fn)
                await pg.goto(C, wait_until="domcontentloaded"); await pg.wait_for_timeout(attente)
                return ctx, pg, req
            for nom, fn, attendu in [
                ("502 HTML", lambda r: r.fulfill(status=502, body="<html>Bad Gateway</html>", content_type="text/html"), "La base ne répond pas"),
                ("200 non JSON", lambda r: r.fulfill(status=200, body="<!doctype html>", content_type="text/html"), "La base ne répond pas"),
                ("403 JSON", lambda r: r.fulfill(status=403, body=json.dumps({"erreur": "Tu ne fais pas partie de l'équipe.", "code": "hors-equipe"}), content_type="application/json"), "Tu ne fais pas partie de l'équipe."),
                ("réseau coupé", lambda r: r.abort(), "La base ne répond pas")]:
                ctx, pg, req = await demarrage(fn)
                check("démarrage %s : bandeau, aucune lecture" % nom, attendu in await bandeau(pg) and not any("/api/candidats" in u for u in req) and await pg.evaluate("DEMARRAGE.mode()") == "bloque")
                if nom == "502 HTML":
                    await pg.click("#add-open"); await pg.fill("#a-personne", "Pendant Panne"); await pg.click('#add-form button[value="liste"]'); await pg.wait_for_timeout(500)
                    check("mode bloqué : « Nouvelle candidature » n'écrit rien, ni API ni yeita-dossiers (CA3)",
                          await pg.evaluate("localStorage.getItem('yeita-dossiers')") is None and not any(x["data"]["candidat"]["nom"] == "Pendant Panne" for x in api("alice@yeita.fr", "GET", "candidats")[1]))
                await ctx.close()
            ctx, pg, req = await demarrage(lambda r: r.fulfill(status=404, body="<html>404</html>", content_type="text/html"))
            check("démarrage 404 text/html (pas d'API sur ce site) → mode navigateur, liste « Qui es-tu ? »", await pg.evaluate("DEMARRAGE.mode()") == "navigateur" and await pg.locator("#qui-sel").count() == 1)
            await ctx.close()
            ctx, pg, req = await demarrage(lambda r: r.fulfill(status=401, body="{}", content_type="application/json"), 2500)
            n_moi = len([u for u in req if u.endswith("/api/moi")])
            check("démarrage 401 : un rechargement, puis bandeau de session sans nouveau rechargement", n_moi == 2 and "Ta session n'a pas pu être vérifiée" in await bandeau(pg), "appels /api/moi : %d" % n_moi)
            await ctx.close()

            for x in (alice, bob, lea): await x.close()
            await b.close()
    finally:
        proc.send_signal(signal.SIGTERM)
        try: proc.wait(timeout=5)
        except subprocess.TimeoutExpired: proc.kill()
        shutil.rmtree(base, ignore_errors=True)
    print("TOUT OK" if ok_all else "ÉCHECS")
    sys.exit(0 if ok_all else 1)

asyncio.run(principal())
