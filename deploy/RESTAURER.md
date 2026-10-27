# Restaurer la base des candidatures

Les copies de la base sont faites chaque nuit par `deploy/backup.sh` (voir `deploy/README.md`, « Sauvegardes »), chiffrées avec age, gardées 30 jours dans `/var/backups/recrutement` sur le serveur et 30 jours sur OVH Object Storage. Elles ne se déchiffrent **que sur un poste**, jamais sur le serveur : la clé privée n'y est pas.

Dans les commandes, remplacer `SERVEUR` par l'adresse du serveur (accès SSH `deploy`), `BUCKET` par le nom du bucket et `DOMAINE` par `recrutement.yeita.fr`.

## Quel cas ?

| Situation | Que faire |
|---|---|
| Un dossier perdu ou abîmé, le reste va bien | [Ouvrir une copie](#ouvrir-une-copie-sur-un-poste) et ressaisir le dossier dans l'interface. Jamais une restauration complète : elle effacerait la journée de toute l'équipe. Jamais pour un dossier supprimé à la demande du candidat. |
| Base abîmée ou vidée, volume Docker intact (moins de 3 jours) | [Restaurer](#restaurer-la-base) en partant de la copie déjà dans le volume (`/data/sauvegardes`, pas de déchiffrement) : étapes 1 bis puis 4 à 8. |
| Volume `recrutement_data` perdu, ou copie plus ancienne nécessaire | [Restaurer](#restaurer-la-base), étapes 1 à 8. |
| Serveur perdu | [Serveur perdu](#serveur-perdu). |

## Avant de commencer (poste)

- Un poste au disque chiffré (FileVault sur macOS), avec `age`, `rclone` et `sqlite3` : `brew install age rclone sqlite`.
- La clé privée age et les identifiants S3 « restauration » (lecture seule), dans le coffre de mots de passe de Yeita.
- Tout se fait dans un dossier temporaire, hors des dossiers synchronisés (Bureau, Documents, iCloud, Drive), lisible par vous seul, effacé à la fin :

```bash
umask 077; d=$(mktemp -d); cd "$d"; echo "$d"
```

Coller la clé privée du coffre (la ligne `AGE-SECRET-KEY-…`) dans un fichier de ce dossier, puis la contrôler : la clé publique affichée doit être exactement `AGE_RECIPIENT` du `.env` du serveur.

```bash
pbpaste > "$d/cle.txt"; pbcopy </dev/null; age-keygen -y "$d/cle.txt"
```

(`pbcopy </dev/null` vide le presse-papiers : la clé n'y reste pas. Désactiver aussi tout historique du presse-papiers pendant la procédure.)

Identifiants « restauration » (rien n'est écrit sur le disque ; `read -s` ne les affiche pas ; ces lignes marchent sous zsh, le shell par défaut de macOS, comme sous bash) :

```bash
printf "Clé d'accès S3 (restauration) : "; read -r RCLONE_CONFIG_RESTAU_ACCESS_KEY_ID; printf "Secret S3 : "; read -r -s RCLONE_CONFIG_RESTAU_SECRET_ACCESS_KEY; echo
export RCLONE_CONFIG_RESTAU_ACCESS_KEY_ID RCLONE_CONFIG_RESTAU_SECRET_ACCESS_KEY RCLONE_CONFIG_RESTAU_TYPE=s3 RCLONE_CONFIG_RESTAU_PROVIDER=Other RCLONE_CONFIG_RESTAU_ENDPOINT=https://s3.gra.io.cloud.ovh.net RCLONE_CONFIG_RESTAU_REGION=gra
```

(Endpoint et région : ceux du bucket, rangés au coffre avec les identifiants ; `gra` ici.)

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

1. **Récupérer une copie** (poste). Lister les copies, puis prendre la plus récente **antérieure à l'incident** :

   ```bash
   rclone lsl restau:BUCKET/recrutement
   rclone copy restau:BUCKET/recrutement/recrutement-AAAA-MM-JJTHHMMSSZ.db.age "$d/"
   ```

   Serveur encore là : `scp deploy@SERVEUR:/var/backups/recrutement/recrutement-AAAA-MM-JJTHHMMSSZ.db.age "$d/"`.

2. **Déchiffrer** (poste) :

   ```bash
   age -d -i "$d/cle.txt" -o "$d/copie.db" "$d/recrutement-AAAA-MM-JJTHHMMSSZ.db.age"
   ```

3. **Contrôler** (poste) : `ok`, `1`, des comptes plausibles, une dernière date du journal juste avant la date du nom. Noter l'empreinte.

   ```bash
   sqlite3 -readonly "$d/copie.db" "PRAGMA integrity_check; PRAGMA user_version; SELECT 'candidats', count(*) FROM candidats; SELECT 'equipe', count(*) FROM equipe; SELECT 'journal', count(*) FROM journal; SELECT 'dernier', max(le) FROM journal;"
   EMPREINTE=$(shasum -a 256 "$d/copie.db" | cut -d' ' -f1); echo "$EMPREINTE"
   ```

   Une copie vide (0 candidat) ou trop ancienne : en prendre une autre.

1 bis. **Volume intact, copie de `/data/sauvegardes`** (à la place de 1 à 3, et avant l'étape 4, qui remplacerait la copie du jour) : mettre la copie de côté dans le volume, la contrôler, noter son empreinte.

   ```bash
   ssh deploy@SERVEUR 'cd /opt/recrutement && docker compose run --rm --no-deps -T api sh -c "umask 077 && cp /data/sauvegardes/recrutement-AAAA-MM-JJ.db /data/restauration.tmp && sha256sum /data/restauration.tmp"'
   ssh deploy@SERVEUR 'cd /opt/recrutement && docker compose run --rm --no-deps -T -e FICHIER=/data/restauration.tmp api node --input-type=module' < "$d/controle.mjs"
   EMPREINTE=<l'empreinte affichée par sha256sum>
   ```

4. **Garder l'état actuel** (si l'api est saine) : une sauvegarde chiffrée, avec son propre nom ; noter ce nom. Pour annuler la restauration, refaire la procédure avec cette copie.

   ```bash
   ssh deploy@SERVEUR 'cd /opt/recrutement && deploy/backup.sh'
   ```

   Base actuelle illisible : sauter cette étape et la liste de l'étape 5 ; les suppressions sont à refaire d'après les demandes reçues (comme pour « Serveur perdu »).

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

   Attendu : `healthy`, puis seulement `recrutement.sqlite`, éventuellement `recrutement.sqlite-wal`, `recrutement.sqlite-shm`, et `sauvegardes`. Un `restauration.tmp` restant : `ssh deploy@SERVEUR 'cd /opt/recrutement && docker compose run --rm --no-deps -T api rm -f /data/restauration.tmp'`.

8. **Vérifier et refaire les suppressions** :

   ```bash
   ssh deploy@SERVEUR 'cd /opt/recrutement && docker compose exec -T -e FICHIER=/data/recrutement.sqlite api node --input-type=module' < "$d/controle.mjs"
   tools/check-site.sh https://DOMAINE
   IDS=$(cut -d' ' -f1 "$d/suppressions.txt" | grep -E '^cand-[a-z0-9]{1,16}-[a-z0-9]{1,16}$' | tr '\n' ' ')
   ssh deploy@SERVEUR "cd /opt/recrutement && docker compose exec -T -e IDS='$IDS' -e DOMAINE=DOMAINE api node --input-type=module" < "$d/suppressions.mjs"
   ```

   - Les comptes sont ceux de l'étape 3 (ou 1 bis) ; `check-site.sh` finit par `Tout est OK`.
   - Un membre de l'équipe se connecte et ouvre un dossier connu.
   - Chaque ligne `À SUPPRIMER <adresse>` : un recruteur ouvre l'adresse et supprime le dossier dans l'interface. Relancer la dernière commande : il ne doit rester que des `rien à faire`.

9. **Effacer le poste** : copie, clé, identifiants.

   ```bash
   cd / && rm -rf "$d"; pbcopy </dev/null; unset RCLONE_CONFIG_RESTAU_ACCESS_KEY_ID RCLONE_CONFIG_RESTAU_SECRET_ACCESS_KEY EMPREINTE
   ```

## Serveur perdu

1. Nouveau serveur : `deploy/README.md` § 1 à 9 (préparation, `.env` recréé avec de nouvelles valeurs — il n'est pas sauvegardé —, déploiement : l'api démarre sur une base vide).
2. Remote rclone de `deploy` et unités systemd : `deploy/README.md`, « Sauvegardes ». Ne pas activer les timers avant la fin de la restauration.
3. Restaurer : étapes 1 à 3, puis 5 (arrêt seulement, pas de liste : la base est vide), 6, 7, 8 sans la partie suppressions, 9.
4. **Limite** : les suppressions faites entre la copie et la perte du serveur sont inconnues (au plus une journée). Les refaire d'après les demandes d'effacement reçues.
5. Activer les timers, lancer `deploy/backup.sh` une fois.

## Ouvrir une copie sur un poste

Étapes 1 à 3, puis lecture seule :

```bash
sqlite3 -readonly "$d/copie.db" "SELECT id, json_extract(data, '$.candidat.nom'), json_extract(data, '$.parcours.etape'), modifie_le FROM candidats ORDER BY modifie_le DESC;"
sqlite3 -readonly "$d/copie.db" "SELECT data FROM candidats WHERE id = 'cand-…';"
```

Puis l'étape 9. Ne jamais garder ni envoyer la copie en clair.
