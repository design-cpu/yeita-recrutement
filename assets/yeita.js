/* Petits outils partagés par toutes les pages du recrutement Yeita :
   logo, pictogrammes des valeurs, radar des diamants, codes EC1/EC2, copie, stockage local. */
(function(){
"use strict";

/* Logo Yeita (mot-symbole de yeita.fr, repris du jeu yeita-match). Dessiné en currentColor. */
var LOGO = [
  "M14.4028 7.84367C14.3969 7.89235 14.3917 7.94239 14.3859 7.99354L14.4124 7.99467C14.2686 14.0303 13.9841 19.3095 12.8855 23.0899C13.4366 23.3218 13.8819 23.534 14.1926 23.6893L12.9024 26.2697C12.6459 26.1414 12.2797 25.9662 11.8269 25.7739C11.3259 26.7125 10.7052 27.5319 9.92486 28.1729C8.77197 29.1198 7.37228 29.5949 5.75907 29.5949C2.94574 29.5949 1.07157 27.7903 1.07157 25.5565C1.07157 23.3226 2.94574 21.518 5.75907 21.518C7.34424 21.518 8.85477 21.7894 10.1581 22.1445C10.4241 21.2028 10.6382 20.1352 10.8117 18.9478C9.92534 19.6521 8.82007 20.0757 7.48984 20.0757C5.84471 20.0757 4.54253 19.4293 3.57476 18.4029C2.64918 17.4213 2.07279 16.1422 1.68906 14.8884C0.934453 12.4228 0.769506 9.44857 0.576904 7.84367L3.44124 7.5C3.66913 9.39895 3.79277 11.9054 4.44747 14.0445C4.76841 15.0931 5.17739 15.8976 5.67343 16.4237C6.12729 16.9051 6.6833 17.1911 7.48984 17.1911C8.29638 17.1911 8.85239 16.9051 9.30625 16.4237C9.80229 15.8976 10.2113 15.0931 10.5322 14.0445C11.1869 11.9054 11.3106 9.39895 11.5384 7.5L14.4028 7.84367ZM5.75907 24.4026C4.97015 24.4026 4.52258 24.6347 4.29028 24.8438C4.05453 25.0559 3.95619 25.3147 3.95619 25.5565C3.95619 25.7982 4.05453 26.057 4.29028 26.2692C4.52258 26.4782 4.97015 26.7103 5.75907 26.7103C6.76787 26.7103 7.50389 26.4285 8.09381 25.9441C8.42881 25.6689 8.74484 25.3036 9.03976 24.8342C8.01812 24.5796 6.89815 24.4026 5.75907 24.4026Z",
  "M24.4944 8.2964C27.4323 7.53834 29.9186 8.80919 30.5571 11.1038C30.8612 12.1968 30.6769 13.3904 29.9898 14.3992C29.3036 15.4062 28.1791 16.1458 26.726 16.5209C25.1268 16.9337 23.2019 16.8994 21.5038 16.7547C21.8033 18.4409 23.237 19.5038 24.9873 19.6039C25.8531 19.6533 27.4516 19.5803 29.3706 19.3796L29.6709 22.249C27.7132 22.4538 25.928 22.547 24.8234 22.484C21.7214 22.3069 18.701 20.0884 18.5657 16.3615C17.9217 16.2263 17.3689 16.0748 17 15.9682L17.8017 13.1969C18.0933 13.2811 18.4838 13.3877 18.9263 13.4876C19.21 12.5097 19.668 11.5966 20.3348 10.799C21.3379 9.59921 22.7376 8.7498 24.4944 8.2964ZM27.7779 11.8768C27.6605 11.4559 27.0191 10.6242 25.215 11.0897C23.9579 11.4142 23.1121 11.9744 22.5478 12.6492C22.2506 13.0048 22.011 13.4174 21.8317 13.8865C23.3604 14.0122 24.8651 14.0225 26.0054 13.7282C26.9234 13.4911 27.3892 13.0922 27.6055 12.7749C27.8204 12.4594 27.8515 12.1414 27.7779 11.8768Z",
  "M37.1984 12.1841C37.3281 16.168 37.563 19.4998 38.0486 22.0577L35.2147 22.5958C34.6847 19.8041 34.4459 16.2831 34.3155 12.2776L37.1984 12.1841Z",
  "M35.7308 6.63461C36.6866 6.63461 37.4615 7.40955 37.4615 8.36538C37.4615 9.32126 36.6866 10.0962 35.7308 10.0962C34.7749 10.0962 34 9.32126 34 8.36538C34.0001 7.40955 34.7749 6.63461 35.7308 6.63461Z",
  "M44.8399 0.865387C44.8785 2.93416 44.9314 4.86613 45.0128 6.64758C47.0539 6.56321 48.8028 6.43093 50.2181 6.20474L50.6733 9.0533C49.1314 9.29973 47.2741 9.44107 45.183 9.52881C45.3478 11.7354 45.5843 13.6433 45.9368 15.2163C45.9563 15.3035 45.977 15.389 45.9971 15.4733C46.966 15.21 48.0106 15.0271 49.0541 15.027C51.5015 15.027 52.9031 16.8998 52.9579 18.7342C52.9851 19.6452 52.6889 20.6071 51.9911 21.3507C51.2762 22.1124 50.2513 22.527 49.0541 22.527C47.3765 22.527 46.0388 21.7797 45.059 20.5185C44.7503 20.121 44.479 19.6741 44.2381 19.1878C43.7561 19.4071 43.3384 19.6165 43.0139 19.7788L41.7237 17.1984C42.0636 17.0284 42.5991 16.7552 43.2685 16.4586C43.2175 16.2578 43.1684 16.054 43.1221 15.8474C42.7273 14.0859 42.4705 11.9855 42.2967 9.61726C41.7618 9.62891 41.2161 9.63952 40.6606 9.64825L40.6155 6.76364C41.1323 6.75551 41.6368 6.74597 42.1288 6.73547C42.0458 4.90984 41.994 2.96266 41.9558 0.919473L44.8399 0.865387ZM49.0541 17.9117C48.3652 17.9117 47.6591 18.0236 46.9752 18.1962C47.0923 18.4041 47.2125 18.5882 47.3369 18.7483C47.8275 19.3799 48.3565 19.6424 49.0541 19.6424C49.567 19.6424 49.7908 19.48 49.8879 19.3765C50.0021 19.2547 50.0817 19.0625 50.0744 18.8199C50.067 18.5749 49.9711 18.3456 49.8203 18.1883C49.6882 18.0505 49.4623 17.9117 49.0541 17.9117Z",
  "M61.6538 8.07692C63.0948 8.07692 64.3413 8.39783 65.3564 9.18738C66.3512 9.96114 66.9514 11.0531 67.3757 12.245C67.7972 13.4294 68.0936 14.8585 68.3858 16.4367C68.6847 18.0505 68.9836 19.8468 69.4124 21.9191L66.5875 22.5039C66.38 21.5012 66.2 20.55 66.0376 19.6616C65.6613 20.195 65.2317 20.6723 64.7378 21.078C63.5849 22.0248 62.1852 22.5 60.572 22.5C57.7587 22.5 55.8845 20.6954 55.8845 18.4615C55.8845 16.2277 57.7587 14.4231 60.572 14.4231C62.2415 14.4231 63.8282 14.7242 65.1773 15.107C65.0145 14.3749 64.8487 13.748 64.6578 13.2118C64.3249 12.2764 63.9694 11.7636 63.5851 11.4647C63.221 11.1815 62.6646 10.9615 61.6538 10.9615C60.3448 10.9615 59.7542 11.3212 59.3416 11.8495L57.0688 10.0736C58.1528 8.68602 59.6813 8.07692 61.6538 8.07692ZM60.572 17.3077C59.7831 17.3077 59.3355 17.5398 59.1032 17.7488C58.8675 17.961 58.7691 18.2198 58.7691 18.4615C58.7691 18.7033 58.8675 18.9621 59.1032 19.1742C59.3355 19.3833 59.7831 19.6154 60.572 19.6154C61.5808 19.6154 62.3168 19.3336 62.9068 18.8492C63.2418 18.574 63.5578 18.2087 63.8527 17.7393C62.8311 17.4847 61.7111 17.3077 60.572 17.3077Z"
];
function logo(h){
  h = h || 26;
  return '<svg class="ylogo" height="'+h+'" width="'+(h*70/30).toFixed(1)+'" viewBox="0 0 70 30" fill="currentColor" role="img" aria-label="Yeita">'
    + LOGO.map(function(d){ return '<path d="'+d+'" fill-rule="evenodd" clip-rule="evenodd"/>'; }).join("") + '</svg>';
}

/* Les icônes du jeu Yeita Match (yeita-match, src/components/Icons.jsx), seules icônes de toute l'expérience.
   Une icône par valeur, pour que la couleur ne porte jamais seule le sens :
   Cœur = Jouer collectif, Cible = Sans chichi, Boussole = Explorateur, Étincelles = Sa meilleure version.
   Dans le jeu, sur les cartes, ces mêmes icônes suivent la position A à D et restent décoratives. */
var ICONS = {
  Check: '<path d="m5 12 4 4L19 6"/>',
  ArrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  ArrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  Download: '<path d="M12 3v12m-4-4 4 4 4-4"/><path d="M4 17v3h16v-3"/>',
  Compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-4 1 1-4z"/>',
  HeartHandshake: '<path d="M12 21s-9-5.5-9-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-9 11-9 11Z"/><path d="M8 13h8"/>',
  Target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  Sparkles: '<path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/>',
  Layers3: '<path d="m12 3 9 5-9 5-9-5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  CircleHelp: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 1c0 2-3 2-3 5M12 18h.01"/>',
  MessageCircle: '<path d="M21 11.5a8.5 8.5 0 0 1-12 7.7L3 21l1.8-6A8.5 8.5 0 1 1 21 11.5z"/>',
  ShieldCheck: '<path d="m12 2 9 4v6c0 5-4 8-9 10-5-2-9-5-9-10V6z"/><path d="m8 12 3 3 5-6"/>',
  /* Interface seulement (sections dépliantes), jamais pour une valeur */
  ChevronRight: '<path d="m9 6 6 6-6 6"/>',
  Phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'
};
var VALUE_ICON = {"collectif":"HeartHandshake", "sans-chichi":"Target", "explorateur":"Compass", "meilleure-version":"Sparkles"};
/* Définition courte de chaque valeur, tirée de son attendu dans le jeu (« On attend que tu… »).
   Elle accompagne la dominante et la seconde sur la fiche #1, la feuille de décompte et la carte d'identité. */
var VALUE_DEF = {
  "collectif":"Rendre l'équipe meilleure, pas seulement son travail.",
  "sans-chichi":"Dire les choses comme elles sont, preuves à l'appui.",
  "explorateur":"Aller voir par soi-même, et revenir avec autre chose que des certitudes.",
  "meilleure-version":"Savoir où on en est, et bouger de là."
};
/* Le résultat de Yeita Match, en petit : la dominante et la seconde, avec leur icône et leur définition.
   Plus de nom de profil. Partagé par la fiche #1, la feuille de décompte et la carte. */
function matchBlock(dom, sec, opts){
  opts = opts || {};
  if(!dom || !sec || !window.YEITA_MATCH) return "";
  var rows = [[dom, "en premier"], [sec, "ensuite"]].map(function(x){
    var v = YEITA_MATCH.value(x[0]);
    return '<div class="ymv" data-v="'+v.id+'"><b>'+picto(v.id, opts.size||16)+esc(v.label)+'<small>'+x[1]+'</small></b><p>'+esc(VALUE_DEF[v.id])+'</p></div>';
  }).join("");
  return '<div class="ym'+(opts.cls ? " "+opts.cls : "")+'">'+(opts.title === false ? "" : '<span class="ymh">'+esc(opts.title || "Yeita Match : les deux valeurs que tu as choisies le plus")+'</span>')+'<div class="ymr">'+rows+'</div></div>';
}
/* Icônes des cartes du jeu, par position A à D (PlayScreen.jsx). */
var CARD_ICONS = ["Compass","HeartHandshake","Target","Sparkles"];
function icon(name, size, stroke){
  return '<svg class="icon" width="'+(size||20)+'" height="'+(size||20)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+(stroke||2)+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[name]||"")+'</svg>';
}
function picto(id, size, stroke){
  id = (window.YEITA_MATCH ? window.YEITA_MATCH.normId(id) : id);
  return icon(VALUE_ICON[id], size||18, stroke||2).replace('class="icon"','class="picto"');
}

function esc(s){ return String(s==null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

var store = {
  get: function(k, fb){ try{ var r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; }catch(e){ return fb; } },
  set: function(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } },
  del: function(k){ try{ localStorage.removeItem(k); }catch(e){} }
};

/* Copie dans le presse-papier, appelée dans le gestionnaire de clic. done(ok) reçoit true ou false. */
function copy(text, done){
  function fallback(){
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly",""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false; try{ ok = document.execCommand("copy"); }catch(e){}
    document.body.removeChild(ta); done && done(ok);
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){ done && done(true); }).catch(fallback);
  } else fallback();
}
/* Retour visible sur le bouton, annoncé aux lecteurs d'écran via une zone live. */
function flash(btn, msg){
  var live = document.getElementById("live");
  if(live) live.textContent = msg;
  if(!btn) return;
  var old = btn.getAttribute("data-label") || btn.textContent;
  btn.setAttribute("data-label", old); btn.textContent = msg;
  clearTimeout(btn.__t); btn.__t = setTimeout(function(){ btn.textContent = old; }, 1800);
}

function b64e(obj){ return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
function b64d(s){ var b = s.replace(/-/g,"+").replace(/_/g,"/"); while(b.length % 4) b += "="; return JSON.parse(decodeURIComponent(escape(atob(b)))); }

/* Code EC1 : ce qui part sur la carte d'identité, et rien d'autre. */
function readEC1(raw){
  var s = (raw||"").trim(); if(!s) return null;
  var m = s.match(/YEITA-EC1\.([A-Za-z0-9\-_]+)/); if(!m) return false;
  try{
    var o = b64d(m[1]); if(!o || typeof o !== "object") return false;
    if(o.p && o.p !== "partial" && window.YEITA_MATCH){ var k = o.p.split("|"); o.p = YEITA_MATCH.normId(k[0]) + "|" + YEITA_MATCH.normId(k[1]); }
    return o;
  }catch(e){ return false; }
}
/* Code EC2 : les douze notes, le palier et le rôle. Accepte aussi l'ancien format compact EC2|PM|t2|… */
function readEC2(raw){
  var s = (raw||"").trim(); if(!s) return null;
  var m = s.match(/YEITA-EC2\.([A-Za-z0-9\-_]+)/);
  if(m){
    try{
      var o = b64d(m[1]), t = parseInt(o && o.t, 10);
      if(!o || !Array.isArray(o.s) || o.s.length !== 12 || !(t>=1 && t<=4)) return false;
      return {role:o.role||"PM", tier:t, steps:o.s.map(function(v){ return (v===null||v===undefined||v==="") ? null : Number(v); }), n:o.n||"", d:o.d||"", par:o.par||"", legacy:false};
    }catch(e){ return false; }
  }
  var p = s.split("|");
  if(p.length < 4 || p[0] !== "EC2") return false;
  var tier = parseInt((p[2]||"").replace(/[^0-9]/g,""), 10); if(!(tier>=1 && tier<=4)) return false;
  var raws = (p[3]||"").split(","); if(raws.length !== 12 && raws.length !== 4) return false;
  var vals = raws.map(function(x){ x = x.trim(); return (x==="-"||x==="") ? null : parseFloat(x); });
  if(vals.some(function(v){ return typeof v === "number" && isNaN(v); })) return false;
  var steps = raws.length === 12 ? vals : vals.reduce(function(a,v){ return a.concat([v,v,v]); }, []);
  return {role:p[1]||"PM", tier:tier, steps:steps, n:"", d:"", par:"", legacy:raws.length === 4};
}

/* Radar des 12 étapes : un quartier par diamant, le pointillé est l'attendu du palier.
   Monochrome : la couleur est réservée aux valeurs Yeita. */
function radar(steps, tier, o){
  o = o || {};
  var Dm = window.DIAMANTS, W = o.w || 560, H = o.h || 404, CX = W/2, CY = H/2, R = o.r || 148;
  var names = Dm.stepNames(), v = steps.map(function(x){ return x==null ? 0 : x; });
  function polar(a,r){ return [CX + r*Math.cos(a), CY + r*Math.sin(a)]; }
  function pt(i,val){ return polar(-Math.PI/2 + i*(Math.PI/6), R*(val/4)); }
  function f(p){ return p[0].toFixed(1)+","+p[1].toFixed(1); }
  var g = '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o.label || "Radar des douze étapes, un quartier par diamant")+'">';
  for(var di=0; di<4; di++){
    var a0 = -Math.PI/2 + (di*3)*(Math.PI/6) - Math.PI/12, a1 = a0 + Math.PI/2, p0 = polar(a0,R), p1 = polar(a1,R);
    g += '<path d="M'+CX+' '+CY+' L'+f(p0).replace(","," ")+' A '+R+' '+R+' 0 0 1 '+f(p1).replace(","," ")+' Z" fill="'+(di%2 ? "var(--quarter-b)" : "var(--quarter-a)")+'"></path>';
    var mid = polar(a0 + Math.PI/4, R + (o.diamondLabelGap || 54));
    if(o.diamondLabels) g += '<text x="'+mid[0].toFixed(1)+'" y="'+mid[1].toFixed(1)+'" text-anchor="middle" font-family="DM Mono, ui-monospace, monospace" font-size="11" fill="var(--muted)">'+Dm.D[di].n+' '+Dm.D[di].name+'</text>';
  }
  for(var lv=1; lv<=4; lv++) g += '<polygon points="'+v.map(function(_,i){ return f(pt(i,lv)); }).join(" ")+'" fill="none" stroke="var(--grid)" stroke-width="1"></polygon>';
  v.forEach(function(_,i){ var p = pt(i,4); g += '<line x1="'+CX+'" y1="'+CY+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'" stroke="var(--grid)" stroke-width="1"></line>'; });
  for(var lv2=1; lv2<=4; lv2++){ var q = polar(-Math.PI/2 - Math.PI/12, R*lv2/4); g += '<text x="'+q[0].toFixed(1)+'" y="'+(q[1]+4).toFixed(1)+'" text-anchor="middle" font-family="DM Mono, ui-monospace, monospace" font-size="10" fill="var(--muted)">'+lv2+'</text>'; }
  if(tier) g += '<polygon points="'+v.map(function(_,i){ return f(pt(i, Dm.expAt(tier,i))); }).join(" ")+'" fill="none" stroke="var(--ink-2)" stroke-width="1.8" stroke-dasharray="5 4" stroke-linejoin="round"></polygon>';
  g += '<polygon points="'+v.map(function(x,i){ return f(pt(i,x)); }).join(" ")+'" fill="var(--violet)" fill-opacity="0.16" stroke="var(--violet)" stroke-width="2.4" stroke-linejoin="round"></polygon>';
  names.forEach(function(name,i){
    var ang = -Math.PI/2 + i*(Math.PI/6), p = pt(i, v[i]), l = polar(ang, R + 15), ca = Math.cos(ang);
    var anchor = ca > 0.25 ? "start" : (ca < -0.25 ? "end" : "middle");
    if(steps[i] != null) g += '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="4" fill="var(--violet)" stroke="var(--surface)" stroke-width="1.8"></circle>';
    g += '<text x="'+l[0].toFixed(1)+'" y="'+(l[1]+4).toFixed(1)+'" text-anchor="'+anchor+'" font-family="Bricolage Grotesque, system-ui, sans-serif" font-size="12.5" font-weight="600" fill="'+(steps[i]==null ? "var(--muted)" : "var(--ink)")+'">'+name+'</text>';
    g += '<text x="'+l[0].toFixed(1)+'" y="'+(l[1]+18).toFixed(1)+'" text-anchor="'+anchor+'" font-family="DM Mono, ui-monospace, monospace" font-size="11" fill="var(--muted)">'+(steps[i]==null ? "—" : steps[i])+(tier ? ' / '+Dm.expAt(tier,i) : '')+'</text>';
  });
  return g + '</svg>';
}

/* Une page publiée dans un artefact ne peut pas ouvrir l'impression : le bouton n'apparaît qu'hors cadre (GitHub Pages). */
function inFrame(){ try{ return window.self !== window.top; }catch(e){ return true; } }
/* L'adresse du site GitHub Pages du recrutement. À changer si le dépôt passe chez Yeichati. */
var SITE = "https://leofuster-story.github.io/yeita-recrutement/";
/* L'adresse du hub dans Claude. Un lien direct vers une page passe par lui : HUB_URL + "#fiche-ec1", par exemple. */
var HUB_URL = "https://claude.ai/artifact/XHFqCUicW1LboUFN9qSx1d";
function wirePrint(){
  var btns = document.querySelectorAll("[data-print]");
  btns.forEach(function(b){
    if(inFrame()){
      b.hidden = true;
      var n = document.querySelector("[data-print-note]");
      if(n && n.hidden){
        n.hidden = false;
        var page = (location.pathname.split("/").pop() || "");
        if(!/\.html$/.test(page)) page = "";
        n.insertAdjacentHTML("beforeend", ' <a href="'+SITE+page+'" target="_blank" rel="noopener">Ouvrir sur le site</a>');
      }
    }
    else if(!b.hasAttribute("data-print-own")) b.addEventListener("click", function(){ window.print(); });
  });
}

/* Nombre à la française : 2,3 */
function fr(n, d){ return Number(n).toFixed(d==null ? 1 : d).replace(".", ","); }

function autogrow(el){ el.style.height = "auto"; el.style.height = (el.scrollHeight + 2) + "px"; }

/* Barre de navigation commune : flèches et Origine/Fin pour les listes d'onglets (ARIA tabs). */
function tabs(list, onSelect){
  var items = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
  list.addEventListener("keydown", function(e){
    var i = items.indexOf(document.activeElement); if(i < 0) return;
    var horizontal = list.getAttribute("aria-orientation") !== "vertical";
    var next = null;
    if(e.key === (horizontal ? "ArrowRight" : "ArrowDown")) next = (i+1) % items.length;
    else if(e.key === (horizontal ? "ArrowLeft" : "ArrowUp")) next = (i-1+items.length) % items.length;
    else if(e.key === "Home") next = 0;
    else if(e.key === "End") next = items.length - 1;
    if(next === null) return;
    e.preventDefault(); items[next].focus(); onSelect(items[next]);
  });
  items.forEach(function(t){ t.addEventListener("click", function(){ onSelect(t); }); });
}

window.YEITA = {logo:logo, picto:picto, icon:icon, CARD_ICONS:CARD_ICONS, VALUE_ICON:VALUE_ICON, VALUE_DEF:VALUE_DEF, matchBlock:matchBlock, esc:esc, store:store, copy:copy, flash:flash, b64e:b64e, b64d:b64d,
  readEC1:readEC1, readEC2:readEC2, radar:radar, inFrame:inFrame, wirePrint:wirePrint, autogrow:autogrow, fr:fr, tabs:tabs,
  HUB:"index.html", SITE:SITE, HUB_URL:HUB_URL};
})();
