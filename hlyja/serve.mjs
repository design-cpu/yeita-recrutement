#!/usr/bin/env node
// Hlýja — serveur local de la documentation.
// Usage, depuis la racine du dépôt :   node hlyja/serve.mjs   [--port 4321] [--no-open]
// Aucune dépendance. N'écoute que sur la machine locale. Ne modifie aucun fichier.
//
// Routes : /            → index.html
//          /data.json   → toutes les données, relues à chaque appel (Markdown + git)
//          /events      → flux d'événements : "change" quand un fichier de hlyja/ change
//
// Format de /data.json :
// { generatedAt, project, git: GitInfo|null,
//   docs: [File], technique: [File], glossaire: File|null, etonnements: [File], backlog: [File],
//   versions: [{ id, branch: BranchInfo|null, files: { version, bilan, pilote, spec[], challenges[], taches[], revue[], qa[] } }],
//   otherBranches: [BranchInfo] }   ← branches version/* sans dossier sur la branche courante
// File = { path, name, meta, body, human?: { meta, body }, fresh?: { stale, commits, error? } }

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const argPort = args.includes('--port') ? Number(args[args.indexOf('--port') + 1]) : 4321;
const noOpen = args.includes('--no-open');
const KEEP_STRING = new Set(['version', 'maj', 'commit', 'numero', 'versions', 'id', 'planifie_en', 'fait_en']);

/* ---------- Markdown ---------- */
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim().replace(/^["']|["']$/g, '');
    if (/^-?\d+(\.\d+)?$/.test(v) && !/^0\d/.test(v) && !KEEP_STRING.has(kv[1])) v = Number(v);
    meta[kv[1]] = v;
  }
  return { meta, body: text.slice(m[0].length) };
}
function readFile(abs) {
  const { meta, body } = parseFrontmatter(fs.readFileSync(abs, 'utf8'));
  const f = { path: path.relative(root, abs).split(path.sep).join('/'), name: path.basename(abs), meta, body };
  const humanPath = abs.replace(/\.md$/, '.humain.md');
  if (fs.existsSync(humanPath)) f.human = parseFrontmatter(fs.readFileSync(humanPath, 'utf8'));
  return f;
}
function mdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isFile() && d.name.endsWith('.md') && !d.name.endsWith('.humain.md'))
    .map(d => d.name).sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }))
    .map(f => readFile(path.join(dir, f)));
}
function cmpVersion(a, b) {
  const pa = a.split('-')[0].split('.').map(Number), pb = b.split('-')[0].split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pb[i] || 0) - (pa[i] || 0); if (d) return d; }
  return 0;
}

/* ---------- Git ---------- */
function git(cwd, ...a) {
  try { return execFileSync('git', a, { cwd, encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
}
function gitInfo() {
  const top = git(root, 'rev-parse', '--show-toplevel');
  if (!top) return null;
  const has = b => git(top, 'show-ref', '--verify', '--quiet', 'refs/heads/' + b) !== null;
  const main = has('main') ? 'main' : has('master') ? 'master' : null;
  const current = git(top, 'rev-parse', '--abbrev-ref', 'HEAD');
  const head = git(top, 'rev-parse', '--short', 'HEAD');
  const dirty = (git(top, 'status', '--porcelain') || '').split('\n').filter(Boolean).length;
  const branches = (git(top, 'for-each-ref', '--format=%(refname:short)|%(committerdate:short)|%(objectname:short)', 'refs/heads/version/') || '')
    .split('\n').filter(Boolean).map(l => {
      const [name, date, sha] = l.split('|');
      const merged = main ? git(top, 'merge-base', '--is-ancestor', name, main) !== null : false;
      const ahead = main ? Number(git(top, 'rev-list', '--count', main + '..' + name) || 0) : null;
      return { name, id: name.replace(/^version\//, ''), date, sha, merged, ahead, current: name === current };
    });
  const merges = main ? (git(top, 'log', main, '--merges', '--first-parent', '--date=short', '--format=%h|%ad|%s', '-n', '30') || '').split('\n').filter(Boolean).map(l => { const [sha, date, ...s] = l.split('|'); return { sha, date, subject: s.join('|') }; }) : [];
  return { top, main, current, head, dirty, branches, merges };
}
function freshness(g, f) {
  const c = f.meta && f.meta.commit, src = f.meta && f.meta.sources;
  if (!g || !c || !src) return undefined;
  if (git(g.top, 'cat-file', '-e', c + '^{commit}') === null) return { stale: true, commits: null, error: 'commit inconnu' };
  const paths = String(src).split(',').map(s => s.trim()).filter(Boolean);
  const out = git(g.top, 'log', '--format=%h', c + '..HEAD', '--', ...paths);
  const commits = out ? out.split('\n').filter(Boolean).length : 0;
  return { stale: commits > 0, commits };
}

/* ---------- Données ---------- */
const SPEC_RANK = { 'cadrage.md': -2, 'verifications.md': -1, 'spec-finale.md': 1 };
function collect() {
  const g = gitInfo();
  const versionsDir = path.join(root, 'versions');
  const ids = fs.existsSync(versionsDir) ? fs.readdirSync(versionsDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort(cmpVersion) : [];
  const versions = ids.map(id => {
    const dir = path.join(versionsDir, id);
    const opt = f => (fs.existsSync(path.join(dir, f)) ? readFile(path.join(dir, f)) : null);
    const version = opt('version.md');
    const branchName = version && version.meta.branche;
    const branch = g ? (g.branches.find(b => b.name === branchName || b.id === id) || null) : null;
    return {
      id, branch,
      files: {
        version, bilan: opt('bilan.md'), pilote: opt('pilote.md'),
        spec: mdFiles(path.join(dir, 'spec')).sort((a, b) => (SPEC_RANK[a.name] || 0) - (SPEC_RANK[b.name] || 0) || (a.meta.n || 0) - (b.meta.n || 0)),
        challenges: mdFiles(path.join(dir, 'challenges')).sort((a, b) => (a.meta.tour || 0) - (b.meta.tour || 0)),
        taches: mdFiles(path.join(dir, 'taches')),
        revue: mdFiles(path.join(dir, 'revue')),
        qa: mdFiles(path.join(dir, 'qa')),
      },
    };
  });
  const withFresh = list => list.map(f => { const fr = freshness(g, f); if (fr) f.fresh = fr; return f; });
  const glossairePath = path.join(root, 'glossaire.md');
  return {
    generatedAt: new Date().toISOString(),
    project: g ? path.basename(g.top) : path.basename(path.dirname(root)),
    git: g ? { main: g.main, current: g.current, head: g.head, dirty: g.dirty, merges: g.merges } : null,
    docs: withFresh([...mdFiles(path.join(root, 'doc', 'produit')), ...mdFiles(path.join(root, 'doc'))]),
    technique: withFresh(mdFiles(path.join(root, 'technique'))),
    glossaire: fs.existsSync(glossairePath) ? readFile(glossairePath) : null,
    etonnements: mdFiles(path.join(root, 'etonnements')).sort((a, b) => cmpVersion(a.name.replace(/\.md$/, ''), b.name.replace(/\.md$/, ''))),
    backlog: mdFiles(path.join(root, 'backlog')).filter(f => f.meta.type === 'backlog'),
    versions,
    otherBranches: g ? g.branches.filter(b => !ids.includes(b.id)).sort((a, b) => cmpVersion(a.id, b.id)) : [],
  };
}

/* ---------- Surveillance des fichiers ---------- */
const clients = new Set();
let timer = null;
function notify() {
  clearTimeout(timer);
  timer = setTimeout(() => { for (const res of clients) res.write('event: change\ndata: ' + Date.now() + '\n\n'); }, 250);
}
function watch() {
  try { fs.watch(root, { recursive: true }, (_, f) => { if (!f || /\.md$|index\.html$/.test(String(f))) notify(); }); return 'direct'; }
  catch {
    let last = '';
    const sign = () => { const out = []; const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.md')) out.push(p + ':' + fs.statSync(p).mtimeMs); } }; walk(root); return out.join('|'); };
    last = sign();
    setInterval(() => { const s = sign(); if (s !== last) { last = s; notify(); } }, 1500);
    return 'interrogation régulière';
  }
}
// La branche courante peut changer sans qu'un .md de hlyja/ change : on surveille aussi HEAD.
function watchHead() {
  const top = git(root, 'rev-parse', '--show-toplevel'); if (!top) return;
  const gitDir = git(top, 'rev-parse', '--absolute-git-dir'); if (!gitDir) return;
  let last = git(top, 'rev-parse', 'HEAD');
  setInterval(() => { const h = git(top, 'rev-parse', 'HEAD'); if (h && h !== last) { last = h; notify(); } }, 2000);
}

/* ---------- Serveur ---------- */
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(fs.readFileSync(path.join(root, 'index.html')));
    }
    if (url.pathname === '/data.json') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify(collect()));
    }
    if (url.pathname === '/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
      res.write('retry: 2000\n\n');
      clients.add(res);
      const ping = setInterval(() => res.write(': ping\n\n'), 25000);
      req.on('close', () => { clearInterval(ping); clients.delete(res); });
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Introuvable');
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Erreur : ' + e.message);
  }
});

function openBrowser(u) {
  if (noOpen) return;
  const cmd = process.platform === 'darwin' ? ['open', [u]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '', u]] : ['xdg-open', [u]];
  try { spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).unref(); } catch {}
}
function listen(port, tries) {
  server.once('error', e => {
    if (e.code === 'EADDRINUSE' && tries > 0) return listen(port + 1, tries - 1);
    console.error('Impossible de démarrer le serveur : ' + e.message); process.exit(1);
  });
  server.listen(port, '127.0.0.1', () => {
    const u = 'http://localhost:' + port;
    const mode = watch(); watchHead();
    const d = collect();
    console.log('\n  Hlýja — documentation de ' + d.project);
    console.log('  ' + u + '\n');
    console.log('  ' + d.versions.length + ' version(s), ' + d.docs.length + ' page(s) produit, ' + d.technique.length + ' page(s) techniques' + (d.git ? ', branche ' + d.git.current : ', hors dépôt git'));
    console.log('  Mise à jour en direct (' + mode + '). Ctrl+C pour arrêter.\n');
    openBrowser(u);
  });
}
listen(argPort, 20);
