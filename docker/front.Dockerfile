# Image du service front : le site construit, servi par oauth2-proxy derrière la connexion Google.
# Construite depuis la racine du dépôt (compose.yaml : context: .).

# Étape 1 : construction du site (tools/build.py enveloppe index.html et écarte ce qui ne se publie pas).
FROM python:3.12-slim AS build
WORKDIR /src
COPY . .
RUN python3 tools/build.py /site

# Étape 2 : oauth2-proxy sert /srv/site (configuration : deploy/oauth2-proxy.cfg, montée par compose.yaml).
FROM quay.io/oauth2-proxy/oauth2-proxy:v7.15.5
LABEL fr.yeita.projet=recrutement
COPY --from=build /site /srv/site
