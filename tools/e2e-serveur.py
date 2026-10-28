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
SERVEUR = "Les candidatures sont enregistrées sur le serveur de l'équipe Yeita, accessible aux seuls recruteurs connectés."   # bandeau jaune (1.4)
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

# Fiche du candidat : en haut de l'appel en cours, sinon dans la fenêtre du menu ⋯ (1.6)
async def tel(pg, v):
    if await pg.locator("#i-telephone").count(): await pg.locator("#i-telephone").first.fill(v); return
    await pg.click("#c-side .morebtn"); await pg.click("[data-mc=fiche]"); await pg.wait_for_timeout(300)
    await pg.fill("#mf-telephone", v)

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

# --- Page /admin/deploiement.html (1.9, CA13) : un état d'exemple par cas du verdict, au format de deploy/auto-deploy.sh ---
def iso(minutes=0):
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - minutes * 60))

def commit(h, msg="feat: un commit", auteur="Banc"):
    return {"commit": h * 40, "court": h * 7, "message": msg, "auteur": auteur}

def passage(id_, h, resultat, statuts, motif="", sortie="TOUT OK", msg="feat: un commit"):
    noms = ["test-store", "npm-test", "build", "deploy"]
    return {"id": id_, "debut": iso(30), "fin": iso(29), "declencheur": {"type": "automatique", "par": ""}, "commit": commit(h, msg),
            "branche": "main", "resultat": resultat, "motif": motif,
            "etapes": [{"nom": n, "statut": st, "duree_s": 3, "sortie": sortie if st != "non-lancee" else ""} for n, st in zip(noms, statuts)]}

def etat_deploiement(**k):
    e = {"maj": iso(), "dernier_controle": {"le": iso(), "fetch": "ok"}, "en_ligne": commit("a"), "incertain": False, "dernier_main": commit("a"),
         "pause": None, "echec": None, "retour_ko": None, "en_cours": None,
         "passages": [passage("20261028T120000.000000001Z-1", "a", "deploye", ["ok"] * 4),
                      passage("20261028T110000.000000001Z-1", "b", "deploye", ["ok"] * 4, msg="feat: un ancien commit")]}
    e.update(k)
    return e

async def deploiement(b, base, env):
    subprocess.run(["node", os.path.join(RACINE, "api", "equipe.js"), "add", "adm@yeita.fr", "Sacha", "admin"], env=env, check=True, capture_output=True)
    dossier = os.path.join(base, "etat"); os.makedirs(dossier, exist_ok=True)
    fichier, demandes = os.path.join(dossier, "deploiement.json"), os.path.join(base, "demandes", "deploiement.demande")
    def ecrire(e):
        if e is None:
            if os.path.exists(fichier): os.remove(fichier)
        else: open(fichier, "w").write(e if isinstance(e, str) else json.dumps(e))
    adm = await contexte(b, "adm@yeita.fr")
    async def page(e):
        ecrire(e); pg = await ouvrir(adm, B + "admin/deploiement.html"); await pg.wait_for_selector("#verdict h2:not(:text('Chargement'))")
        return pg
    async def verdict(pg):
        return (await pg.locator("#verdict").get_attribute("class")).replace("verdict ", ""), await pg.locator("#verdict h2").inner_text()
    hostile = "ligne 1\n\"guillemets\" \\ </pre><b>x</b><img src=x onerror=alert(1)>"
    cas = [
        ("absent", None, "neutre", "Aucun passage enregistré"),
        ("illisible", "{ pas du JSON", "neutre", "L'état du déploiement est illisible."),
        ("à jour", etat_deploiement(), "vert", "À jour : le dernier commit de main est en ligne."),
        ("main a avancé", etat_deploiement(dernier_main=commit("c")), "neutre", "main a avancé : test au prochain passage (10 min au plus)."),
        ("en pause", etat_deploiement(pause={"depuis": iso(60), "par": "adm@yeita.fr", "commit": "bbbbbbb"}), "neutre", "En pause : les nouveaux commits de main ne sont pas mis en ligne."),
        ("dernier de main en échec", etat_deploiement(dernier_main=commit("c"), echec=commit("c"), passages=[passage("20261028T130000.000000001Z-1", "c", "tests-ko", ["ok", "ko", "non-lancee", "non-lancee"], sortie=hostile)] + etat_deploiement()["passages"]),
         "rouge", "Le dernier commit de main a échoué (Tests en échec : pas mis en ligne) : il ne sera pas mis en ligne tant que main n'avance pas."),
        ("ne vérifie plus", etat_deploiement(dernier_controle={"le": iso(30), "fetch": "ok"}), "rouge", "Le serveur ne vérifie plus main (dernière vérification il y a 30 min)"),
        ("passage en cours depuis 40 min", etat_deploiement(dernier_controle={"le": iso(30), "fetch": "ok"}, dernier_main=commit("c"),
         en_cours={"depuis": iso(40), "etape": "npm-test", "etape_depuis": iso(10), "commit": commit("c"), "declencheur": {"type": "automatique", "par": ""}}), "neutre", "Passage en cours."),
        ("GitHub injoignable", etat_deploiement(dernier_controle={"le": iso(), "fetch": "echec"}), "rouge", "Le serveur ne joint pas GitHub"),
        ("retour raté", etat_deploiement(incertain=True, retour_ko={"type": "retour-ko", "le": iso(), "etape": "retour", "commit": commit("c"), "avant": commit("a")}),
         "rouge", "Retour arrière raté : le site est peut-être hors service. En SSH : deploy/deploy.sh aaaaaaa"),
        ("interrompu", etat_deploiement(incertain=True, retour_ko={"type": "interrompu", "le": iso(), "etape": "deploy", "commit": commit("c"), "avant": commit("a")}),
         "rouge", "Mise en ligne interrompue pendant mise en ligne : le site est peut-être hors service. En SSH : deploy/deploy.sh aaaaaaa"),
        ("incertain", etat_deploiement(incertain=True), "rouge", "Commit en ligne : incertain (une mise en ligne n'a pas abouti)."),
    ]
    for nom, e, classe, titre in cas:
        pg = await page(e); v = await verdict(pg)
        check("page déploiement, %s : verdict %s « %s »" % (nom, classe, titre[:50]), v[0] == classe and v[1].startswith(titre), str(v))
        if nom == "en pause":
            check("page déploiement, en pause : « Reprendre » visible ; actif : caché", await pg.locator("#reprendre").is_visible())
        if nom == "à jour":
            check("page déploiement, actif : « Reprendre » caché, « Déployer maintenant » visible", not await pg.locator("#reprendre").is_visible() and await pg.locator("#maintenant").is_visible())
            n = await pg.locator("#passages button:text('Déployer ce commit')").count()
            check("« Déployer ce commit » : sur le passage aux tests OK qui n'est pas en ligne, pas sur le commit en ligne", n == 1, str(n))
        if nom == "dernier de main en échec":
            ouverts = await pg.evaluate("[...document.querySelectorAll('#passages details.etape[open] summary')].map(s => s.textContent)")
            check("passage en échec : ouvert, étape KO ouverte par défaut, elle seule", ouverts == ["Tests de l'API : en échec · 3 s"], str(ouverts))
            texte = await pg.locator("#passages details.etape[open] pre.sortie").first.text_content()
            check("sortie hostile affichée comme texte (aucun élément créé)", "<b>x</b>" in texte and await pg.locator("#passages b, #passages img").count() == 0, texte[-40:])
            n = await pg.locator("#passages details.passage").first.locator("button").count()
            check("« Déployer ce commit » absent d'un passage aux tests KO", n == 0)
        if nom == "passage en cours depuis 40 min":
            t = await pg.locator("#bandeaux").inner_text()
            check("passage en cours : bandeau « … — Tests de l'API (2/4) »", "ccccccc — Tests de l'API (2/4)" in t, t)
        await pg.close()

    # Accessibilité (QA 1.9) : verdict et réponse annoncés (role=status), passages au clavier (Tab jusqu'au résumé,
    # Entrée l'ouvre et le referme), contour de focus visible, étape et « Déployer ce commit » atteints au clavier.
    pg = await page(etat_deploiement())
    roles = await pg.evaluate("['verdict', 'retour'].map(i => [document.getElementById(i).getAttribute('role'), document.getElementById(i).getAttribute('aria-live')])")
    check("accessibilité : #verdict et #retour en role=status, aria-live=polite", roles == [["status", "polite"], ["status", "polite"]], str(roles))
    arbre = await pg.locator("#verdict").aria_snapshot()
    check("accessibilité : le lecteur d'écran lit le verdict dans la zone d'état", arbre.startswith("- status:") and "À jour : le dernier commit de main est en ligne." in arbre, arbre)
    async def tab_jusqu_a(selecteur, n=20):
        vus = []
        for _ in range(n):
            await pg.keyboard.press("Tab")
            vus.append(await pg.evaluate("(document.activeElement.id || document.activeElement.tagName) + ':' + (document.activeElement.textContent || '').trim().slice(0, 20)"))
            if await pg.evaluate("(s) => document.activeElement.matches(s)", selecteur): return True, vus
        return False, vus
    await pg.locator("body").focus()
    atteint, vus = await tab_jusqu_a("#passages details.passage > summary")
    check("clavier : Tab atteint le premier passage après « Déployer maintenant » et « Actualiser »", atteint and vus[0].startswith("maintenant:") and any(v.startswith("relire:") for v in vus), str(vus))
    premier = pg.locator("#passages details.passage").first
    contour = await pg.evaluate("getComputedStyle(document.activeElement).outlineStyle")
    check("clavier : contour de focus visible sur le résumé du passage", contour == "solid", contour)
    await pg.keyboard.press("Enter"); ouvert = await premier.evaluate("d => d.open")
    await pg.keyboard.press("Enter"); referme = not await premier.evaluate("d => d.open")
    check("clavier : Entrée ouvre le passage, puis le referme", ouvert and referme, "ouvert=%s refermé=%s" % (ouvert, referme))
    await pg.keyboard.press("Enter")
    atteint, vus = await tab_jusqu_a("#passages details.etape > summary", 3)
    await pg.keyboard.press("Enter")
    check("clavier : Tab atteint l'étape du passage ouvert, Entrée montre sa sortie", atteint and await premier.locator("details.etape pre.sortie").first.is_visible(), str(vus))
    second = pg.locator("#passages details.passage").nth(1)
    await second.locator(":scope > summary").focus(); await pg.keyboard.press("Enter")
    atteint, vus = await tab_jusqu_a("#passages button[data-demande=commit]", 6)
    check("clavier : « Déployer ce commit » atteint au clavier dans le passage ouvert", atteint, str(vus))
    await pg.close()

    # Demande en attente : neutre récente, rouge au-delà de 5 min sans passage, neutre pendant un passage.
    os.makedirs(os.path.dirname(demandes), exist_ok=True)
    for nom, minutes, en_cours, rouge, attendu in [("récente", 1, None, False, "Demande en attente : déployer le dernier commit de main par adm2@yeita.fr"),
                                                  ("de 6 min sans passage", 6, None, True, "La demande n'a pas été prise en charge : sudo systemctl status recrutement-deploy.path"),
                                                  ("de 6 min pendant un passage", 6, {"depuis": iso(8), "etape": "build", "etape_depuis": iso(1), "commit": commit("c"), "declencheur": {"type": "automatique"}}, False, "Elle sera traitée à la fin du passage en cours.")]:
        open(demandes, "w").write("action=deployer\ncommit=main\npar=adm2@yeita.fr\nle=%s\n" % iso(minutes))
        pg = await page(etat_deploiement(en_cours=en_cours))
        b0 = pg.locator("#bandeaux .bandeau").first
        check("demande %s : bandeau %s" % (nom, "rouge" if rouge else "neutre"), attendu in await b0.inner_text() and ("rouge" in await b0.get_attribute("class")) == rouge, await b0.inner_text())
        await pg.close()

    # Confirmations exactes, annulation sans envoi, envoi, double clic pendant un POST ralenti.
    open(demandes, "w").write("action=deployer\ncommit=main\npar=adm2@yeita.fr\nle=%s\n" % iso(1))
    pg = await page(etat_deploiement(pause={"depuis": iso(60), "par": "adm@yeita.fr", "commit": "bbbbbbb"}, echec=commit("a")))
    messages, posts = [], []
    reponse = {"accepter": False}
    async def dialogue(d):
        messages.append(d.message)
        await (d.accept() if reponse["accepter"] else d.dismiss())
    pg.on("dialog", lambda d: asyncio.ensure_future(dialogue(d)))
    pg.on("request", lambda r: posts.append(r.url) if r.method == "POST" else None)
    await pg.click("#maintenant"); await pg.wait_for_timeout(300)
    check("confirmation « Déployer maintenant » : texte exact (déjà en ligne, échec, pause, demande remplacée)", messages[-1:] == [
        "Le dernier commit de main (aaaaaaa feat: un commit) sera testé puis mis en ligne.\nIl est déjà en ligne : il sera retesté et redéployé.\nIl a échoué la dernière fois.\n"
        "L'automatisme reste en pause : utilisez Reprendre pour le relancer.\nRemplace la demande de adm2@yeita.fr."], str(messages[-1:]))
    check("annulée : aucune requête envoyée", posts == [], str(posts))
    await pg.click("#reprendre"); await pg.wait_for_timeout(300)
    check("confirmation « Reprendre » : texte exact", messages[-1] == "L'automatisme reprend : le dernier commit de main (aaaaaaa) sera testé puis mis en ligne s'il ne l'est pas déjà.\nRemplace la demande de adm2@yeita.fr.", messages[-1])
    await pg.locator("#passages details.passage").nth(1).locator(":scope > summary").click()
    await pg.click("#passages button:text('Déployer ce commit')"); await pg.wait_for_timeout(300)
    check("confirmation « Déployer ce commit » (pas le dernier de main) : texte exact", messages[-1] == "Les tests seront relancés.\nL'automatisme sera mis en pause.\nRemplace la demande de adm2@yeita.fr.", messages[-1])
    async def lent(route):
        await asyncio.sleep(1.5); await route.continue_()
    await pg.route("**/api/deploiement/demande", lent)
    reponse["accepter"] = True
    await pg.click("#passages button:text('Déployer ce commit')")
    await pg.wait_for_timeout(200)
    desactive = await pg.locator("#maintenant").is_disabled()
    await pg.evaluate("document.querySelector('#passages button[data-demande]').click(); document.getElementById('maintenant').click()")
    await pg.wait_for_selector("#retour:not([hidden])")
    check("pendant l'envoi : boutons désactivés ; double clic → une seule demande", desactive and len(posts) == 1, "posts : %s" % posts)
    check("réponse 202 : « Demande envoyée … »", await pg.locator("#retour").inner_text() == "Demande envoyée : le serveur la prend en charge dans quelques secondes.")
    contenu = open(demandes).read()
    check("demande écrite par l'API : commit du passage, par l'admin connecté", contenu.startswith("action=deployer\ncommit=" + "b" * 40 + "\npar=adm@yeita.fr\n"), contenu)
    await pg.close()
    # Relecture automatique (passage en cours) : focus clavier gardé, verdict non réécrit s'il ne change pas, étape en minuscules (QA 1.9 : B1, B2, B4)
    if os.path.exists(demandes): os.remove(demandes)
    interrompu = passage("20261028T131000.000000001Z-1", "c", "interrompu", ["ok", "ko", "non-lancee", "non-lancee"], motif="interrompu pendant npm-test")
    pg = await page(etat_deploiement(dernier_main=commit("c"), en_cours={"depuis": iso(2), "etape": "build", "etape_depuis": iso(1), "commit": commit("c"), "declencheur": {"type": "automatique"}},
                                     passages=[interrompu] + etat_deploiement()["passages"]))
    texte = await pg.locator("#passages details.passage").first.locator(":scope > summary").inner_text()
    check("passage interrompu : « Interrompu pendant tests de l'API » (première lettre seule en minuscule)", "Interrompu pendant tests de l'API" in texte, texte[:80])
    await pg.evaluate("window.__mutations = 0; new MutationObserver(m => window.__mutations += m.length).observe(document.getElementById('verdict'), {childList: true, subtree: true, characterData: true, attributes: true})")
    await pg.locator("#passages details.passage").nth(1).locator(":scope > summary").focus()
    await pg.wait_for_timeout(11500)
    focus = await pg.evaluate("(() => { const a = document.activeElement; const d = a && a.closest('details[data-cle]'); return [a && a.tagName, d && d.getAttribute('data-cle')]; })()")
    check("relecture automatique : le focus clavier reste sur le même passage", focus == ["SUMMARY", "20261028T120000.000000001Z-1"], str(focus))
    check("relecture automatique : le verdict inchangé n'est pas réécrit (lecteur d'écran)", await pg.evaluate("window.__mutations") == 0, str(await pg.evaluate("window.__mutations")))
    check("bandeaux annoncés (role=status)", await pg.locator("#bandeaux").get_attribute("role") == "status")
    await pg.close()
    lec = await contexte(b, "lea@yeita.fr")
    pg = await ouvrir(lec, B + "admin/deploiement.html"); await pg.wait_for_timeout(500)
    check("page déploiement, rôle lecture : « Réservé aux admins de l'équipe. », aucun bouton", (await verdict(pg))[1] == "Réservé aux admins de l'équipe." and not await pg.locator("#maintenant").is_visible())
    await lec.close(); await adm.close()

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
            f = await pg.locator(".fict").inner_text()
            check("bandeau jaune index.html : texte du serveur de l'équipe, « Connecté·e : Alice » gardé, plus « Tout reste dans ce navigateur » (1.4, CA1)",
                  SERVEUR in f and "Connecté·e : Alice" in f and "Tout reste dans ce navigateur" not in f, f)
            # --- Exemples hors de la base partagée, base vide (1.4, CA3) ---
            vide = await pg.locator("#empty p").inner_text()
            check("exemples, base vide : ni « Charger des exemples » ni bouton du tableau vide, texte sans exemples, « Retirer les exemples » caché (1.4, CA3)",
                  await pg.locator("#demo-load").count() == 0 and await pg.locator("#empty-demo").count() == 0
                  and vide == "Ajoute la première personne avec qui tu as un appel de découverte." and await pg.evaluate("document.getElementById('demo-clear').hidden"), vide)
            pd = await alice.new_page()
            async def equipe_lente(route):
                await asyncio.sleep(2); await route.continue_()
            await pd.route("**/api/equipe", equipe_lente)
            await pd.goto(C, wait_until="domcontentloaded")
            pendant = await pd.evaluate("(function(){ var m = DEMARRAGE.mode(); document.getElementById('demo-load').click(); document.getElementById('empty-demo').click(); return m; })()")
            check("exemples : « Retirer les exemples » caché pendant l'attente du démarrage (1.4, R6)",
                  pendant == "attente" and await pd.evaluate("document.getElementById('demo-clear').hidden"), "mode : %s" % pendant)
            await pd.wait_for_timeout(3500)
            st, liste = api("alice@yeita.fr", "GET", "candidats")
            check("exemples : clic sur « Charger des exemples » pendant l'attente du démarrage → rien dans la base (1.4, CA3)",
                  pendant == "attente" and st == 200 and not any(x["data"]["meta"].get("demo") for x in liste) and await pd.evaluate("DEMARRAGE.mode()") == "serveur",
                  "mode au clic : %s · dossiers : %d" % (pendant, len(liste)))
            await pd.close()
            pl = await ouvrir(lea, C)
            check("lecteur : « Connecté·e : Léa · lecture seule »", "Connecté·e : Léa · lecture seule" in await pl.locator("#qui").inner_text())
            check("import en mode serveur : pas d'option « Remplacer tout » (CA14)", await pg.locator('input[name="imp-mode"][value="remplacement"]').count() == 0
                  and await pg.locator('input[name="imp-mode"][value="fusion"]').count() == 1)

            # --- Création puis rechargement (CA4) ---
            await pg.click("#add-open"); await pg.fill("#mf-personne", "Repère Zéphyrin")
            await pg.click('[data-mc-creer="liste"]'); await pg.wait_for_timeout(600)
            await pg.reload(wait_until="networkidle")
            check("création puis rechargement : la candidature est là", await pg.locator(".kc", has_text="Repère Zéphyrin").count() == 1)
            st, liste = api("alice@yeita.fr", "GET", "candidats")
            cible = [x for x in liste if x["data"]["candidat"]["nom"] == "Repère Zéphyrin"]
            check("création : lue depuis l'API, au nom d'Alice dans l'historique (CA10)", st == 200 and len(cible) == 1 and cible[0]["data"]["historique"][0]["par"] == "Alice")
            cid = cible[0]["id"] if cible else ""

            # --- CV en fichier, portfolio en lien (1.10) ---
            pf = await ouvrir(alice, C + "candidat.html?id=" + cid + "&etape=appel")
            if not await pf.locator('#panel [data-doc="cv"]').count():
                await pf.click("#c-side .morebtn"); await pf.click("[data-mc=fiche]"); await pf.wait_for_timeout(300)
            zone = '[data-doc="cv"]'
            check("dépôt : « Déposer un fichier » et « Coller un lien » dans le champ CV", await pf.locator(zone + ' [data-doc-act="fichier"]').first.is_visible() and await pf.locator(zone + ' [data-doc-act="lien"]').first.is_visible())
            dpdf = tempfile.mkdtemp(); fpdf = os.path.join(dpdf, "CV Zéphyrin <final>.pdf"); open(fpdf, "wb").write(b"%PDF-1.4\nMARQUEUR-CV-ZEPHYRIN " + b"x" * 5000)
            await pf.locator(zone + " [data-doc-file]").first.set_input_files(fpdf); await pf.wait_for_timeout(1200)
            st, fl = api("alice@yeita.fr", "GET", "candidats/" + cid + "/fichiers")
            txt = await pf.locator(zone).first.inner_text()
            check("dépôt du CV : dans l'API (nom nettoyé), affiché avec son nom, sa taille, Ouvrir et Retirer", st == 200 and len(fl) == 1 and fl[0]["nom"] == "CV Zéphyrin final.pdf" and "CV Zéphyrin final.pdf" in txt and "Ko" in txt and "Ouvrir" in txt and "Retirer" in txt, str(fl))
            href = await pf.locator(zone + " a.btn").first.get_attribute("href")
            ouvert = await pf.evaluate("u => fetch(u).then(r => [r.status, r.headers.get('content-type'), r.headers.get('x-content-type-options')])", href)
            check("Ouvrir : le fichier est servi par l'API, en PDF, nosniff", ouvert == [200, "application/pdf", "nosniff"], str(ouvert))
            st, d = api("alice@yeita.fr", "GET", "candidats/" + cid)
            check("dépôt : tracé dans l'historique du dossier, fichier noté sur la fiche", d["data"]["identite"]["fichiers"]["cv"]["nom"] == "CV Zéphyrin final.pdf" and any(h.get("type") == "fichier" and h.get("action") == "depot" for h in d["data"]["historique"]))
            await pf.locator('[data-doc="portfolio"] [data-doc-act="lien"]').first.click(); await pf.locator('[data-doc="portfolio"] [data-doc-url]').fill("https://zephyrin.design")
            await pf.keyboard.press("Enter"); await pf.wait_for_timeout(900)
            if await pf.locator("dialog.mdlg").count(): await pf.click(".mdlg-a [data-mc-close]"); await pf.wait_for_timeout(600)
            st, d = api("alice@yeita.fr", "GET", "candidats/" + cid)
            check("portfolio en lien : enregistré, tracé", d["data"]["identite"]["portfolio"] == "https://zephyrin.design" and any(h.get("action") == "lien" for h in d["data"]["historique"]))
            await pf.close()
            await pg.reload(wait_until="networkidle")
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
            await e1.fill("#f-asp", "Notes EC2 d'Alice"); await e1.wait_for_timeout(800)
            puts = []; e2.on("request", lambda r: puts.append(r) if r.method == "PUT" else None)
            await e2.fill("#f-asp", "Notes EC2 périmées"); await e2.wait_for_timeout(800)
            st, d = api("alice@yeita.fr", "GET", "candidats/" + cid)
            check("deux onglets EC2 : refus avec bandeau, aucun PUT du second, notes du premier en base (CA7)",
                  "modifiée par quelqu'un d'autre" in await bandeau(e2) and not puts and "Notes EC2 d'Alice" in json.dumps(d["data"]["fiches"].get("ec2"), ensure_ascii=False))
            check("deux onglets EC2 : « Non enregistré » dans l'indicateur de la fiche EC2 refusée (R11b)", "Non enregistré" in (await e2.locator("#exits .saved").text_content() or ""))
            await e1.close(); await e2.close()

            # --- Rôle lecture (CA9) ---
            pl2 = await ouvrir(lea, C + "candidat.html?id=" + cid)
            await tel(pl2, "0100000000"); await pl2.wait_for_timeout(900)
            txt = await bandeau(pl2)
            check("lecteur : écriture refusée, « Lecture seule », sans bouton", "Lecture seule : tu ne peux pas modifier." in txt and await pl2.locator(".demarrage-bandeau button").count() == 0, txt)
            await pl2.close()

            # --- Suppression de bout en bout (CA21) ---
            st, d = api("alice@yeita.fr", "GET", "candidats/" + cid)
            bc = await ouvrir(bob, C + "candidat.html?id=" + cid); be = await ouvrir(bob, C + "ec1.html?id=" + cid)
            pa = await ouvrir(alice, C + "candidat.html?id=" + cid)
            await pa.click("#c-side .morebtn"); await pa.click("[data-mc=supprimer]"); await pa.click("[data-mc-del]"); await pa.wait_for_timeout(800)
            check("suppression : DELETE, plus dans l'API", api("alice@yeita.fr", "GET", "candidats/" + cid)[0] == 404)
            check("suppression : ses fichiers partent avec lui (1.10)", api("alice@yeita.fr", "GET", "candidats/" + cid + "/fichiers")[0] == 404)
            await tel(bc, "0655555555"); await be.fill("#f-def", "Après suppression"); await bc.wait_for_timeout(1000)
            check("suppression : saisie chez Bob → aucune recréation, bandeau", api("bob@yeita.fr", "GET", "candidats/" + cid)[0] == 404 and "modifiée" in await bandeau(bc) and "modifiée" in await bandeau(be))
            tb = await ouvrir(bob, C)
            check("suppression : au tableau de Bob, la candidature a disparu", await tb.locator(".kc", has_text="Repère Zéphyrin").count() == 0)
            tout = (await stockage(pa)) + (await stockage(bc)) + (await stockage(tb))
            check("suppression : le repère n'est dans aucun stockage des navigateurs (CA1, CA21)", "Zéphyrin" not in tout and "Perçu repère" not in tout)
            journal = open(os.path.join(base, "api.log")).read()
            check("suppression : le repère n'est pas dans le journal de l'API", "Zéphyrin" not in journal and "Perçu repère" not in journal)
            bruts = b"".join(open(os.path.join(base, f), "rb").read() for f in os.listdir(base) if f.startswith("e2e.sqlite"))
            check("suppression : le repère n'est plus dans les fichiers de la base (sans VACUUM)", "Zéphyrin".encode() not in bruts and b"Perc" not in bruts and b"MARQUEUR-CV-ZEPHYRIN" not in bruts)

            # --- Bandeau jaune des autres pages, sur un dossier existant (1.4, CA1) ---
            ti = await ouvrir(alice, C)
            bid = await ti.evaluate("STORE.createCandidate({personne: 'Bandeau Jaune', job: 'PM / PO'}, 'Alice').then(function(c){ return c.id; })")
            for nom in ("candidat", "ec1", "ec2", "decompte", "carte"):
                pj = await ouvrir(alice, C + nom + ".html?id=" + bid)
                f = await pj.locator(".fict").first.inner_text()
                check("bandeau jaune %s.html : texte du serveur de l'équipe, plus « Tout reste dans ce navigateur » (1.4, CA1)" % nom,
                      SERVEUR in f and "Tout reste dans ce navigateur" not in f and await pj.evaluate("DEMARRAGE.mode()") == "serveur", f)
                await pj.close()
            # --- Retirer les exemples déjà dans la base (1.4, CA4) ---
            check("exemples : un dossier ordinaire seul → « Retirer les exemples » caché (1.4, CA4)", await ti.evaluate("document.getElementById('demo-clear').hidden"))
            await ti.evaluate("(function(){ var c = DOSSIER.blank('Exemple Ancien'); c.meta.demo = true; return DOSSIER.save(c); })()")
            await ti.reload(wait_until="networkidle")
            check("exemples : un exemple dans la base → « Retirer les exemples » visible (1.4, CA4)", not await ti.evaluate("document.getElementById('demo-clear').hidden"))
            await ti.click("#save > summary"); await ti.click("#demo-clear"); await ti.wait_for_timeout(800)
            st, liste = api("alice@yeita.fr", "GET", "candidats")
            check("exemples : clic → l'exemple n'est plus dans l'API, le dossier ordinaire reste, bouton caché (1.4, CA4)",
                  st == 200 and not any(x["data"]["meta"].get("demo") for x in liste) and any(x["id"] == bid for x in liste) and await ti.evaluate("document.getElementById('demo-clear').hidden"),
                  "dossiers : %d" % len(liste))
            await ti.close()

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
                    await pg.click("#add-open"); await pg.wait_for_timeout(200)
                    if await pg.locator("#mf-personne").count(): await pg.fill("#mf-personne", "Pendant Panne"); await pg.click('[data-mc-creer="liste"]'); await pg.wait_for_timeout(500)
                    check("mode bloqué : « Nouvelle candidature » n'écrit rien, ni API ni yeita-dossiers (CA3)",
                          await pg.evaluate("localStorage.getItem('yeita-dossiers')") is None and not any(x["data"]["candidat"]["nom"] == "Pendant Panne" for x in api("alice@yeita.fr", "GET", "candidats")[1]))
                    await pg.evaluate("document.getElementById('demo-load').click(); document.getElementById('empty-demo').click()"); await pg.wait_for_timeout(800)
                    check("mode bloqué : clic sur « Charger des exemples » → rien dans l'API ni dans yeita-dossiers, « Retirer les exemples » caché (1.4, R4, R6)",
                          await pg.evaluate("localStorage.getItem('yeita-dossiers')") is None and not any(x["data"]["meta"].get("demo") for x in api("alice@yeita.fr", "GET", "candidats")[1])
                          and await pg.evaluate("document.getElementById('demo-clear').hidden"))
                await ctx.close()
            ctx, pg, req = await demarrage(lambda r: r.fulfill(status=404, body="<html>404</html>", content_type="text/html"))
            check("démarrage 404 text/html (pas d'API sur ce site) → mode navigateur, liste « Qui es-tu ? »", await pg.evaluate("DEMARRAGE.mode()") == "navigateur" and await pg.locator("#qui-sel").count() == 1)
            await ctx.close()
            ctx, pg, req = await demarrage(lambda r: r.fulfill(status=401, body="{}", content_type="application/json"), 2500)
            n_moi = len([u for u in req if u.endswith("/api/moi")])
            check("démarrage 401 : un rechargement, puis bandeau de session sans nouveau rechargement", n_moi == 2 and "Ta session n'a pas pu être vérifiée" in await bandeau(pg), "appels /api/moi : %d" % n_moi)
            await ctx.close()

            await deploiement(b, base, dict(os.environ, DB_PATH=os.path.join(base, "e2e.sqlite")))

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
