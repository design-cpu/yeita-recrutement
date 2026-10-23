"""Écran de connexion et branchement de la base, avec un faux client Supabase (aucun appel réseau).
Lancer :  python3 tools/build.py _site && python3 -m http.server 8765 --directory _site
puis :    python3 tools/e2e-backend.py"""
import asyncio
from playwright.async_api import async_playwright
B="http://localhost:8765/"
FAKE = """
window.__sent = null;
window.YEITA_BACKEND_CONFIG = {url: "https://x.supabase.co", anonKey: "k", domaine: "yeita.fr"};
window.supabase = {createClient: function(){ return {
  auth: {getSession: function(){ return Promise.resolve({data: {session: window.__session || null}}); },
         signInWithOtp: function(o){ window.__sent = o; return Promise.resolve({error: null}); },
         signOut: function(){ return Promise.resolve({}); }},
  rpc: function(n){ return Promise.resolve({data: window.__moi ? [window.__moi] : [], error: null}); },
  from: function(){ return {select: function(){ return {order: function(){ return Promise.resolve({data: [], error: null}); }, eq: function(){ return {maybeSingle: function(){ return Promise.resolve({data: null, error: null}); }}; }}; }}; },
  channel: function(){ return {on: function(){ return this; }, subscribe: function(){} }; }
}; }};
"""
ok = True
def check(l, c, x=""):
    global ok; ok = ok and bool(c); print("OK  " if c else "FAIL", l, x)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for case in ("anonyme", "hors-equipe", "equipe"):
            ctx = await b.new_context(); await ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
            init = FAKE + ({"hors-equipe": "window.__session = {user: {email: 'intrus@yeita.fr'}};", "equipe": "window.__session = {user: {email: 'thelo@yeita.fr'}}; window.__moi = {email: 'thelo@yeita.fr', prenom: 'Thélo', role: 'recruteur'};"}.get(case, ""))
            await ctx.add_init_script(init)
            pg = await ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto(B+"candidatures/", wait_until="networkidle")
            await pg.add_script_tag(url=B+"assets/adapter-supabase.js"); await pg.add_script_tag(url=B+"assets/backend.js"); await pg.wait_for_timeout(300)
            if case == "anonyme":
                check("sans session : écran de connexion", await pg.locator("#yb-gate").is_visible() and await pg.evaluate("document.activeElement.id") == "yb-mail")
                await pg.fill("#yb-mail", "lena@gmail.com"); await pg.click("#yb-form button"); await pg.wait_for_timeout(100)
                check("adresse hors Yeita : refusée avant envoi", "@yeita.fr" in await pg.locator("#yb-err").inner_text() and await pg.evaluate("window.__sent") is None)
                await pg.fill("#yb-mail", "Thelo@Yeita.fr"); await pg.click("#yb-form button"); await pg.wait_for_timeout(200)
                sent = await pg.evaluate("window.__sent")
                check("adresse Yeita : lien demandé, sans création de compte", sent["email"] == "thelo@yeita.fr" and sent["options"]["shouldCreateUser"] is False and "Regarde tes e-mails" in await pg.locator("#yb-gate").inner_text())
            if case == "hors-equipe":
                check("connecté hors équipe : accès non ouvert", "Accès non ouvert" in await pg.locator("#yb-gate").inner_text())
            if case == "equipe":
                check("équipe : adaptateur branché, prénom du compte", await pg.evaluate("DOSSIER.adapter().name") == "supabase" and await pg.evaluate("STORE.me()") == "Thélo" and await pg.locator("#yb-gate").count() == 0)
            check(case + " : pas d'erreur", not errs, errs)
            await ctx.close()
        print("ALL OK" if ok else "FAILED"); await b.close()
asyncio.run(main())
