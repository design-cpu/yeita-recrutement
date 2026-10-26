import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { lireConfig, cheminBase, ErreurConfig } from "../src/config.js";
import { dossierTemporaire, siteConstruit } from "./aide.js";

function refuse(env, dossierApi, motif) {
  assert.throws(() => lireConfig(env, dossierApi), e => e instanceof ErreurConfig && motif.test(e.message), `refus attendu : ${motif}`);
}

test("valeurs par défaut", t => {
  const api = dossierTemporaire(t);
  const c = lireConfig({}, api);
  assert.equal(c.port, 8000);
  assert.equal(c.host, "127.0.0.1");
  assert.equal(c.local, true);
  assert.equal(c.dbPath, path.join(api, "data/recrutement.sqlite"));
  assert.equal(c.devEmail, null);
  assert.equal(c.devStatic, null);
});

test("PORT : vide vaut absent, valeurs absurdes refusées", t => {
  const api = dossierTemporaire(t);
  assert.equal(lireConfig({ PORT: "" }, api).port, 8000);
  assert.equal(lireConfig({ PORT: "8123" }, api).port, 8123);
  for (const v of ["abc", "0", "70000", "8000 # x", " 8000", "80.5", "-1", "# x"]) refuse({ PORT: v }, api, /^PORT refusé/);
});

test("HOST : avec espace refusé", t => {
  const api = dossierTemporaire(t);
  assert.equal(lireConfig({ HOST: "0.0.0.0" }, api).local, false);
  refuse({ HOST: "127.0.0.1 # local" }, api, /^HOST refusé/);
});

test("DB_PATH : relatif résolu depuis api/, valeurs absurdes refusées", t => {
  const api = dossierTemporaire(t);
  assert.equal(cheminBase({ DB_PATH: "x/base.sqlite" }, api), path.join(api, "x/base.sqlite"));
  assert.equal(cheminBase({ DB_PATH: "/tmp/abs.sqlite" }, api), "/tmp/abs.sqlite");
  fs.mkdirSync(path.join(api, "un-dossier"));
  for (const v of [":memory:", "x.sqlite # base", "\"x.sqlite\"", "'x.sqlite'", "un-dossier"]) refuse({ DB_PATH: v }, api, /^DB_PATH refusé/);
});

test("NODE_ENV production : mode local refusé, casse et espaces ignorés", t => {
  const api = dossierTemporaire(t);
  siteConstruit(api);
  for (const ne of ["production", " Production ", "PRODUCTION"]) {
    refuse({ NODE_ENV: ne, DEV_EMAIL: "moi@yeita.fr" }, api, /^DEV_EMAIL refusé : interdit quand NODE_ENV/);
    refuse({ NODE_ENV: ne, DEV_STATIC: "_site" }, api, /^DEV_STATIC refusé : interdit quand NODE_ENV/);
  }
  assert.equal(lireConfig({ NODE_ENV: "production" }, api).production, true);
});

test("DEV_EMAIL : accepté en local, refusé hors bouclage ou invalide", t => {
  const api = dossierTemporaire(t);
  assert.equal(lireConfig({ DEV_EMAIL: " Moi@Yeita.FR " }, api).devEmail, "moi@yeita.fr");
  assert.equal(lireConfig({ DEV_EMAIL: "moi@yeita.fr", HOST: "::1" }, api).devEmail, "moi@yeita.fr");
  refuse({ DEV_EMAIL: "moi@yeita.fr", HOST: "0.0.0.0" }, api, /^DEV_EMAIL refusé : interdit quand HOST/);
  for (const v of ["moi@gmail.com", "moi@yeita.fr.evil.com", "moi", "a@yeita.fr, b@yeita.fr"]) refuse({ DEV_EMAIL: v }, api, /^DEV_EMAIL refusé : « /);
});

test("DEV_STATIC : site construit accepté, dossiers dangereux refusés", t => {
  const racine = dossierTemporaire(t);
  const api = path.join(racine, "api");
  fs.mkdirSync(api);
  const site = siteConstruit(racine);
  assert.equal(lireConfig({ DEV_STATIC: "../_site" }, api).devStatic, site);
  refuse({ DEV_STATIC: "../_site", HOST: "0.0.0.0" }, api, /^DEV_STATIC refusé : interdit quand HOST/);
  refuse({ DEV_STATIC: "../absent" }, api, /n'est pas un dossier existant/);
  fs.mkdirSync(path.join(racine, "vide"));
  refuse({ DEV_STATIC: "../vide" }, api, /ne contient pas index.html/);
  fs.writeFileSync(path.join(racine, "index.html"), "x");
  refuse({ DEV_STATIC: ".." }, api, /contient la base ou le dossier api/);
  /* api/ servi même quand la base est ailleurs. */
  const ailleurs = path.join(dossierTemporaire(t), "base.sqlite");
  refuse({ DEV_STATIC: "..", DB_PATH: ailleurs }, api, /contient la base ou le dossier api/);
  refuse({ DEV_STATIC: "../_site", DB_PATH: "../_site/base.sqlite" }, api, /contient la base/);
  refuse({ DEV_STATIC: "../_site # x" }, api, /contient « # »/);
  /* Un lien symbolique vers la racine ne contourne pas le contrôle. */
  fs.symlinkSync(racine, path.join(racine, "lien"));
  refuse({ DEV_STATIC: "../lien" }, api, /contient la base ou le dossier api/);
});

test("valeurs absurdes : valeur vide suivie d'un commentaire, guillemets (QA)", t => {
  const racine = dossierTemporaire(t);
  const api = path.join(racine, "api");
  fs.mkdirSync(api);
  siteConstruit(racine);
  for (const v of [" # x", "\"8000\"", "'8000'"]) refuse({ PORT: v }, api, /^PORT refusé/);
  refuse({ HOST: " # x" }, api, /^HOST refusé/);
  refuse({ DB_PATH: " # base" }, api, /^DB_PATH refusé : .* contient « # »/);
  for (const v of [" # x", "\"../_site\"", "'../_site'"]) refuse({ DEV_STATIC: v }, api, /^DEV_STATIC refusé : « /);
  for (const v of ["moi@yeita.fr # x", "\"moi@yeita.fr\"", " # moi@yeita.fr"]) refuse({ DEV_EMAIL: v }, api, /^DEV_EMAIL refusé : « /);
});
