# Restaurer la base des candidatures

Les copies de la base sont faites chaque nuit par `deploy/backup.sh` (voir `deploy/README.md`, « Sauvegardes »), chiffrées avec age et gardées 30 jours dans `/var/backups/recrutement`, **sur le serveur seulement**. Elles ne se déchiffrent **que sur un Mac**, jamais sur le serveur : la clé privée n'y est pas (créer et garder la clé : `deploy/CLE-SAUVEGARDE.md`).

> **Si le serveur est perdu, les sauvegardes le sont aussi** : il n'existe pas de copie ailleurs.

Dans les commandes, remplacer `SERVEUR` par l'adresse du serveur (accès SSH `deploy`, par exemple `51.75.252.121`) et `DOMAINE` par `recrutement.yeita.fr`.

## Quel cas ?

| Situation | Que faire |
|---|---|
| Un dossier perdu ou abîmé, le reste va bien | [Ouvrir une copie](#ouvrir-une-copie-sur-un-mac) et ressaisir le dossier dans l'interface. Jamais une restauration complète : elle effacerait la journée de toute l'équipe. Jamais pour un dossier supprimé à la demande du candidat. |
| Base abîmée ou vidée, volume Docker intact (moins de 3 jours) | [Restaurer](#restaurer-la-base) en partant de la copie déjà dans le volume (`/data/sauvegardes`, pas de déchiffrement) : étapes 1 bis puis 4 à 8. |
| Volume `recrutement_data` perdu, ou copie plus ancienne nécessaire | [Restaurer](#restaurer-la-base), étapes 1 à 8. |
| Serveur perdu | Pas de restauration possible : les copies étaient sur le serveur. Voir [Serveur perdu](#serveur-perdu). |

## Avant de commencer (Mac)

- Un Mac au disque chiffré (FileVault), avec `age` et `sqlite3` : `brew install age sqlite`.
- Le fichier de la clé privée (`cle-sauvegarde-recrutement.txt`, `deploy/CLE-SAUVEGARDE.md`).
- Tout se fait dans un dossier temporaire, hors des dossiers synchronisés (Bureau, Documents, iCloud, Drive), lisible par toi seul, effacé à la fin. Lancer la première commande **depuis le dossier du dépôt** (pour `tools/check-site.sh` à l'étape 8) :

```bash
depot=$(pwd); umask 077; d=$(mktemp -d); cd "$d"; echo "$d"
```

Copier le fichier de la clé dans ce dossier (remplacer le chemin par celui où il est gardé), puis la contrôler : la clé publique affichée doit être exactement `AGE_RECIPIENT` du `.env` du serveur.

```bash
cp ~/chemin/vers/cle-sauvegarde-recrutement.txt "$d/cle.txt"; age-keygen -y "$d/cle.txt"
```

Trois petits programmes servent sur le serveur ; les créer dans le dossier :

```bash
cat > "$d/controle.mjs" <<'EOF'
// Contrôle d'une base dans le volume : integrity_check, version du schéma, comptes, dernière date du journal.
import Database from "/app/api/node_modules/better-sqlite3/lib/index.js";
const db = new Database(process.env.FICHIER, { readonly: true, fileMustExist: true });
const n = t => db.prepare(`SELECT count(*) n FROM ${t}`).get().n;
console.log(`integrity_check=${db.pragma("integrity_check", { simple: true })} user_version=${db.pragma("user_version", { simple: true })} candidats=${n("candidats")} equipe=${n("equipe")} journal=${n("journal")} dernier=${db.prepare("SELECT max(le) m FROM journal").get().m}`);
EOF
cat > "$d/suppressions.mjs" <<'EOF'
// Sans IDS : liste les suppressions du journal (id, date, auteur). Avec IDS : dit lesquels sont encore dans la base.
import Database from "/app/api/node_modules/better-sqlite3/lib/index.js";
const db = new Database("/data/recrutement.sqlite", { readonly: true, fileMustExist: true });
if (!process.env.IDS) {
  for (const l of db.prepare("SELECT candidat_id, le, par FROM journal WHERE action = 'suppression' ORDER BY le").all()) console.log(l.candidat_id, l.le, l.par);
} else {
  const un = db.prepare("SELECT 1 FROM candidats WHERE id = ?");
  for (const id of process.env.IDS.split(/\s+/).filter(Boolean)) console.log(un.get(id) ? `À SUPPRIMER https://${process.env.DOMAINE}/candidatures/candidat.html?id=${encodeURIComponent(id)}` : `rien à faire : ${id}`);
}
EOF
cat > "$d/remplacer.mjs" <<'EOF'
// Remplace la base par /data/restauration.tmp, seulement si son empreinte et son contrôle sont bons ; sinon la retire.
import fs from "node:fs";
import crypto from "node:crypto";
import Database from "/app/api/node_modules/better-sqlite3/lib/index.js";
const tmp = "/data/restauration.tmp", base = "/data/recrutement.sqlite";
function refus(m) { fs.rmSync(tmp, { force: true }); console.error(`REFUS : ${m} La base actuelle n'est pas touchée.`); process.exit(1); }
if (!fs.existsSync(tmp)) refus("copie absente.");
const empreinte = crypto.createHash("sha256").update(fs.readFileSync(tmp)).digest("hex");
if (empreinte !== process.env.EMPREINTE) refus(`empreinte ${empreinte} au lieu de ${process.env.EMPREINTE} (transfert coupé ?).`);
try {
  const db = new Database(tmp, { readonly: true, fileMustExist: true });
  const ok = db.pragma("integrity_check", { simple: true }), v = db.pragma("user_version", { simple: true });
  db.close();
  if (ok !== "ok" || v !== 1) refus(`contrôle : integrity_check=${ok} user_version=${v}.`);
} catch (e) { refus(`copie illisible (${e.message}).`); }
for (const s of ["", "-wal", "-shm"]) fs.rmSync(base + s, { force: true });
fs.renameSync(tmp, base);
console.log("Base remplacée.");
EOF
```

## Restaurer la base

1. **Récupérer une copie** (Mac). Lister les copies du serveur, puis prendre la plus récente **antérieure à l'incident** :

   ```bash
   ssh deploy@SERVEUR 'ls -l /var/backups/recrutement'
   scp deploy@SERVEUR:/var/backups/recrutement/recrutement-AAAA-MM-JJTHHMMSSZ.db.age "$d/"
   ```

2. **Déchiffrer** (Mac) :

   ```bash
   age -d -i "$d/cle.txt" -o "$d/copie.db" "$d/recrutement-AAAA-MM-JJTHHMMSSZ.db.age"
   ```

3. **Contrôler** (Mac) : `ok`, `1`, des comptes plausibles, une dernière date du journal juste avant la date du nom. Noter l'empreinte.

   ```bash
   sqlite3 -readonly "$d/copie.db" "PRAGMA integrity_check; PRAGMA user_version; SELECT 'candidats', count(*) FROM candidats; SELECT 'equipe', count(*) FROM equipe; SELECT 'journal', count(*) FROM journal; SELECT 'dernier', max(le) FROM journal;"
   EMPREINTE=$(shasum -a 256 "$d/copie.db" | cut -d' ' -f1); echo "$EMPREINTE"
   ```

   Une copie vide (0 candidat) ou trop ancienne : en prendre une autre.

1 bis. **Volume intact, copie de `/data/sauvegardes`** (à la place de 1 à 3, et avant l'étape 4, qui remplacerait la copie du jour) : mettre la copie de côté dans le volume, la contrôler, noter son empreinte.

   ```bash
   EMPREINTE=$(ssh deploy@SERVEUR 'cd /opt/recrutement && docker compose run --rm --no-deps -T api sh -c "umask 077 && cp /data/sauvegardes/recrutement-AAAA-MM-JJ.db /data/restauration.tmp && sha256sum /data/restauration.tmp"' | cut -d' ' -f1); echo "$EMPREINTE"
   ssh deploy@SERVEUR 'cd /opt/recrutement && docker compose run --rm --no-deps -T -e FICHIER=/data/restauration.tmp api node --input-type=module' < "$d/controle.mjs"
   ```

4. **Garder l'état actuel** (si l'api est saine) : une sauvegarde chiffrée, avec son propre nom ; noter ce nom. Pour annuler la restauration, refaire la procédure avec cette copie.

   ```bash
   ssh deploy@SERVEUR 'cd /opt/recrutement && deploy/backup.sh'
   ```

   Base actuelle illisible : sauter cette étape et la liste de l'étape 5 ; les suppressions faites depuis la date de la copie sont à refaire d'après les demandes reçues.

5. **Arrêter l'api, lister les suppressions** de la base actuelle : elles reviendront avec la copie et seront refaites à l'étape 8.

   ```bash
   ssh deploy@SERVEUR 'cd /opt/recrutement && docker compose stop api'
   ssh deploy@SERVEUR 'cd /opt/recrutement && docker compose run --rm --no-deps -T api node --input-type=module' < "$d/suppressions.mjs" > "$d/suppressions.txt"; cat "$d/suppressions.txt"
   ```

6. **Remplacer la base** : la copie passe par SSH directement dans le volume (aucun fichier en clair sur le disque du serveur), puis n'est mise en place que si son empreinte et son contrôle sont bons. En cas de refus, la base actuelle n'est pas touchée et le fichier transféré est retiré ; recommencer l'étape. Volume intact (1 bis) : seulement la seconde commande.

   ```bash
   ssh deploy@SERVEUR 'cd /opt/recrutement && docker compose run --rm --no-deps -T api sh -c "umask 077 && cat > /data/restauration.tmp"' < "$d/copie.db"
   ssh deploy@SERVEUR "cd /opt/recrutement && docker compose run --rm --no-deps -T -e EMPREINTE=$EMPREINTE api node --input-type=module" < "$d/remplacer.mjs"
   ```

   Attendu : `Base remplacée.`

7. **Redémarrer** :

   ```bash
   ssh deploy@SERVEUR 'cd /opt/recrutement && docker compose start api && sleep 20 && docker inspect -f "{{.State.Health.Status}}" $(docker compose ps -q api) && docker compose run --rm --no-deps -T api ls -A /data'
   ```

   Attendu : `healthy`, puis seulement `recrutement.sqlite`, éventuellement `recrutement.sqlite-wal`, `recrutement.sqlite-shm`, `sauvegardes` et `etat` (l'état des sauvegardes, que la restauration ne touche pas ; sur un volume neuf, il réapparaît à la sauvegarde suivante et la page d'état est « en retard » d'ici là). Un `restauration.tmp` restant : `ssh deploy@SERVEUR 'cd /opt/recrutement && docker compose run --rm --no-deps -T api rm -f /data/restauration.tmp'`.

8. **Vérifier et refaire les suppressions** :

   ```bash
   ssh deploy@SERVEUR 'cd /opt/recrutement && docker compose exec -T -e FICHIER=/data/recrutement.sqlite api node --input-type=module' < "$d/controle.mjs"
   "$depot/tools/check-site.sh" https://DOMAINE
   IDS=$(cut -d' ' -f1 "$d/suppressions.txt" | grep -E '^cand-[a-z0-9]{1,16}-[a-z0-9]{1,16}$' | tr '\n' ' ')
   if [ -n "$IDS" ]; then ssh deploy@SERVEUR "cd /opt/recrutement && docker compose exec -T -e IDS='$IDS' -e DOMAINE=DOMAINE api node --input-type=module" < "$d/suppressions.mjs"; else echo "Aucune suppression à refaire."; fi
   ```

   - Les comptes sont ceux de l'étape 3 (ou 1 bis) ; `check-site.sh` finit par `Tout est OK`.
   - Un membre de l'équipe se connecte et ouvre un dossier connu.
   - Chaque ligne `À SUPPRIMER <adresse>` : un recruteur ouvre l'adresse et supprime le dossier dans l'interface. Relancer la dernière commande : il ne doit rester que des `rien à faire`.

9. **Effacer le Mac** : copie et copie de la clé (le fichier d'origine de la clé reste où il est gardé).

   ```bash
   cd / && rm -rf "$d"; unset EMPREINTE
   ```

## Serveur perdu

Les copies étant **sur le serveur**, elles disparaissent avec lui : il n'y a rien à restaurer. Reconstruire le serveur (`deploy/README.md` § 1 à 9 et § 14) donne une base vide. C'est la limite acceptée de cette version ; une copie hors du serveur pourra être ajoutée plus tard.

Si le serveur est seulement **en panne** (disque encore lisible), récupérer d'abord `/var/backups/recrutement` (par exemple en le copiant depuis le disque, avec l'aide de l'hébergeur), puis suivre [Restaurer la base](#restaurer-la-base) depuis l'étape 2.

## Ouvrir une copie sur un Mac

Étapes 1 à 3, puis lecture seule :

```bash
sqlite3 -readonly "$d/copie.db" "SELECT id, json_extract(data, '$.candidat.nom'), json_extract(data, '$.parcours.etape'), modifie_le FROM candidats ORDER BY modifie_le DESC;"
sqlite3 -readonly "$d/copie.db" "SELECT data FROM candidats WHERE id = 'cand-…';"
```

Puis l'étape 9. Ne jamais garder ni envoyer la copie en clair.
