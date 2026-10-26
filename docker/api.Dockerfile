# Image du service api : l'API de stockage (api/), jointe seulement par oauth2-proxy sur le réseau back.
# Construite depuis la racine du dépôt (compose.yaml : context: .). Base figée par le digest de l'index
# multi-architecture (linux/amd64 et arm64) de node:22.23.4-slim, publiée le 2026-10-21 (correctif de sécurité).
FROM node:22.23.4-slim@sha256:de170b39439eb0e5a3444ad7d60b015614a381e10fecae2e30ec9e735122f38d
LABEL fr.yeita.projet=recrutement

# Dépendances d'abord, dans le dossier de package.json : .npmrc (ignore-scripts=true) n'est lu que là.
WORKDIR /app/api
COPY api/package.json api/package-lock.json api/.npmrc ./
RUN npm ci --omit=dev && npm cache clean --force
COPY api/ ./

# La base vit dans le volume monté sur /data : propriétaire node, lisible par lui seul.
RUN mkdir -p /data && chown node:node /data && chmod 700 /data
USER node
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8000 DB_PATH=/data/recrutement.sqlite
EXPOSE 8000

# Sain seulement si /api/sante rend 200 en moins de 4 s (503 quand la base ne répond pas). Pas de curl dans l'image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:8000/api/sante', {signal: AbortSignal.timeout(4000)}).then(r => process.exit(r.status === 200 ? 0 : 1), () => process.exit(1))"]

# docker compose exec api node api/equipe.js … : même dossier, même DB_PATH que l'API.
CMD ["node", "api/server.js"]
