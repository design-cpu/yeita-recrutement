/* Yeitigai : contenu officiel du jeu (dépôt Yeichati/yeita-match, src/data), recopié tel quel.
   Une seule source pour la feuille de décompte, le kit physique, la fiche #1 et la carte d'identité.
   Pour changer une carte ou un profil : modifier le jeu, puis régénérer ce fichier. */
(function(){
"use strict";
var VALUES = [
 {
  "id": "collectif",
  "label": "Jouer collectif",
  "short": "Collectif",
  "color": "#199363",
  "tint": "#d2f1e3",
  "ink": "#12764f",
  "inkDark": "#4cc993",
  "tintDark": "#11352a",
  "verb": "joue collectif",
  "expectation": "On attend que tu rendes l’équipe meilleure, pas seulement ton travail.",
  "behaviors": [
   {
    "id": "tisser",
    "label": "Tisser",
    "description": "Tu connais du monde, et ce monde te rappelle.",
    "softSkills": "Networking & Relationship"
   },
   {
    "id": "tenir-ensemble",
    "label": "Tenir ensemble",
    "description": "Quand ça tangue, tu restes dans le bateau et tu rames avec les autres.",
    "softSkills": "Team work & Resilience"
   },
   {
    "id": "se-faire-comprendre",
    "label": "Se faire comprendre",
    "description": "Tu parles pour être compris, pas pour avoir raison.",
    "softSkills": "Communication & Empathy"
   }
  ]
 },
 {
  "id": "sans-chichi",
  "label": "Sans chichi",
  "short": "Sans chichi",
  "color": "#4f3fed",
  "tint": "#e7e1fe",
  "ink": "#4f3fed",
  "inkDark": "#a397ff",
  "tintDark": "#26214d",
  "verb": "ne s'embarrasse pas de chichis",
  "expectation": "On attend que tu dises les choses comme elles sont, preuves à l’appui, sans emballage.",
  "behaviors": [
   {
    "id": "appui-reel",
    "label": "S’appuyer sur du réel",
    "description": "Tu préfères un chiffre moyen à une intuition brillante.",
    "softSkills": "Data driven & By the book"
   },
   {
    "id": "aller-verifier",
    "label": "Aller vérifier",
    "description": "Tu ouvres le fichier avant d’en parler.",
    "softSkills": "Detailed focus & Investigator"
   },
   {
    "id": "faire-droit",
    "label": "Faire droit",
    "description": "Tu fais les choses bien même quand personne ne regarde.",
    "softSkills": "Ethical & Inclusive"
   }
  ]
 },
 {
  "id": "explorateur",
  "label": "Explorateur",
  "short": "Explorateur",
  "color": "#9f671a",
  "tint": "#faeaca",
  "ink": "#86550f",
  "inkDark": "#e3a64f",
  "tintDark": "#3a2b14",
  "verb": "va voir ailleurs",
  "expectation": "On attend que tu ailles voir par toi-même, et que tu reviennes avec autre chose que des certitudes.",
  "behaviors": [
   {
    "id": "ouvrir-le-capot",
    "label": "Ouvrir le capot",
    "description": "Tu veux comprendre comment ça marche avant de dire ce qu’il faut changer.",
    "softSkills": "Curiosity & Problem solving"
   },
   {
    "id": "truc-a-cote",
    "label": "Proposer le truc d’à côté",
    "description": "Tu sors l’idée que personne n’ose formuler, et tu la défends.",
    "softSkills": "Creativity & Boldness"
   },
   {
    "id": "changer-avis",
    "label": "Changer d’avis proprement",
    "description": "Le terrain te contredit, tu bouges — et tu dis pourquoi.",
    "softSkills": "Adaptability & Iteration"
   }
  ]
 },
 {
  "id": "meilleure-version",
  "label": "Sa meilleure version",
  "short": "Meilleure version",
  "color": "#d23157",
  "tint": "#ffdfe6",
  "ink": "#b8234a",
  "inkDark": "#ff7f9c",
  "tintDark": "#3d1d29",
  "verb": "se pousse",
  "expectation": "On attend que tu saches où tu en es, et que tu bouges de là.",
  "behaviors": [
   {
    "id": "porter-au-bout",
    "label": "Porter jusqu’au bout",
    "description": "Ce que tu prends, tu le finis, et tu le défends en réunion.",
    "softSkills": "Motivation & Advocacy"
   },
   {
    "id": "trancher",
    "label": "Trancher",
    "description": "Tu décides avec ce que tu as, et tu l’assumes devant tout le monde.",
    "softSkills": "Strategy & Decision making"
   },
   {
    "id": "regarder-en-face",
    "label": "Se regarder en face",
    "description": "Tu sais nommer ce que tu ne sais pas encore faire, sans te flageller ni te survendre.",
    "softSkills": "Apprentissage de soi"
   }
  ]
 }
];
var PROFILES = [
 {
  "id": "fil-conducteur",
  "dominant": "collectif",
  "second": "sans-chichi",
  "label": "Fil conducteur",
  "description": "Fait tenir le groupe ensemble, et dit les choses sans les emballer.",
  "presentation": [
   "Tu es le fil qui relie les gens et les sujets. Là où tu passes, l’équipe se parle, et elle se parle franchement.",
   "Ta force, c’est de faire avancer le groupe sans laisser les non-dits s’installer. Tu prends soin de la relation, mais pas au prix de la vérité : quand quelque chose cloche, tu le dis, avec les faits et avec tact.",
   "À explorer ensemble : comment tu fais quand l’envie de garder le groupe uni et le besoin de dire les choses tirent dans deux sens opposés."
  ]
 },
 {
  "id": "passerelle",
  "dominant": "collectif",
  "second": "explorateur",
  "label": "Passerelle",
  "description": "Ramène des idées d’ailleurs et fait traverser les autres avec.",
  "presentation": [
   "Tu fais traverser les idées. Tu vas les chercher ailleurs, et tu t’assures que personne ne reste sur la rive.",
   "Curieux de ce qui se fait à côté, tu ramènes des pistes neuves, sans les imposer : tu prends le temps de les partager, de les expliquer et d’embarquer l’équipe. Avec toi, le changement se fait à plusieurs.",
   "À explorer ensemble : ce que tu fais quand une idée que tu portes ne prend pas dans le groupe. Tu ralentis pour attendre tout le monde, ou tu cherches un autre chemin ?"
  ]
 },
 {
  "id": "second-souffle",
  "dominant": "collectif",
  "second": "meilleure-version",
  "label": "Second souffle",
  "description": "Progresse en tirant l’équipe, pas en avançant seul.",
  "presentation": [
   "Tu progresses, et tu fais progresser les autres avec toi. Quand l’équipe fatigue, c’est souvent toi qui relances.",
   "Tu sais où tu en es et tu veux aller plus loin, mais jamais seul. Tu tiens tes engagements, tu reconnais ce que tu as encore à apprendre, et tu en fais un moteur collectif plutôt qu’une course personnelle.",
   "À explorer ensemble : comment tu concilies ton envie d’avancer avec le rythme du groupe, et ce que tu fais quand les deux ne s’accordent pas."
  ]
 },
 {
  "id": "point-d-appui",
  "dominant": "sans-chichi",
  "second": "collectif",
  "label": "Point d’appui",
  "description": "On construit dessus. Franc, fiable, zéro poudre aux yeux.",
  "presentation": [
   "On peut construire sur toi. Tu dis les choses comme elles sont, et l’équipe sait qu’elle peut compter sur ta parole.",
   "Tu t’appuies sur des faits, tu vérifies avant de parler et tu fais les choses bien, même quand personne ne regarde. Cette rigueur, tu la mets au service du groupe : ta franchise rassure plus qu’elle ne blesse.",
   "À explorer ensemble : comment tu fais passer un message difficile sans abîmer la relation, et ce que tu fais quand tes faits contredisent l’avis du groupe."
  ]
 },
 {
  "id": "lampe-frontale",
  "dominant": "sans-chichi",
  "second": "explorateur",
  "label": "Lampe frontale",
  "description": "Va chercher ce qui cloche, et dit exactement ce qu’il a trouvé.",
  "presentation": [
   "Tu éclaires ce que les autres ne voient pas encore. Tu vas chercher ce qui cloche, et tu reviens avec des faits.",
   "Curieux et exigeant, tu ne te contentes pas des apparences : tu ouvres le capot, tu vérifies, et tu dis exactement ce que tu as trouvé, même si ça dérange. Tes découvertes sont solides parce qu’elles sont étayées.",
   "À explorer ensemble : jusqu’où tu creuses avant de décider qu’il est temps de conclure, et comment tu partages une mauvaise nouvelle."
  ]
 },
 {
  "id": "niveau-a-bulle",
  "dominant": "sans-chichi",
  "second": "meilleure-version",
  "label": "Niveau à bulle",
  "description": "Exigeant sur le détail, et d’abord avec lui-même.",
  "presentation": [
   "Tu vérifies que tout est droit, à commencer par toi. Exigeant sur le détail, tu l’es d’abord avec toi-même.",
   "Tu t’appuies sur le réel et tu fais les choses proprement. Tu sais aussi te regarder en face : tu reconnais tes limites sans te flageller, et tu travailles à les dépasser. C’est cette honnêteté qui rend ton travail fiable.",
   "À explorer ensemble : comment tu évites que l’exigence devienne du perfectionnisme, et comment tu décides qu’un travail est « assez bien »."
  ]
 },
 {
  "id": "tete-chercheuse",
  "dominant": "explorateur",
  "second": "collectif",
  "label": "Tête chercheuse",
  "description": "Part devant, revient avec la carte, et la partage.",
  "presentation": [
   "Tu pars devant, tu explores, et tu reviens avec la carte pour la partager.",
   "Tu aimes comprendre comment les choses marchent et proposer ce que personne n’a encore osé. Mais tu n’explores pas pour toi seul : tu ramènes ce que tu as trouvé à l’équipe, et tu fais en sorte que chacun puisse s’en servir.",
   "À explorer ensemble : comment tu gardes le lien avec l’équipe quand tu es loin devant, et ce que tu fais quand le groupe n’est pas prêt à te suivre."
  ]
 },
 {
  "id": "pied-de-biche",
  "dominant": "explorateur",
  "second": "sans-chichi",
  "label": "Pied de biche",
  "description": "Ouvre ce qui est fermé et regarde vraiment dedans.",
  "presentation": [
   "Tu ouvres ce qui est fermé, et tu regardes vraiment dedans.",
   "Les sujets bloqués ou opaques t’attirent. Tu n’as pas peur de bousculer les habitudes, et tu le fais avec des faits : tu démontes, tu vérifies, et tu dis franchement ce que tu as trouvé. Tes idées audacieuses reposent sur du concret.",
   "À explorer ensemble : comment tu choisis les portes à forcer, et comment tu embarques ceux qui préféraient qu’elles restent fermées."
  ]
 },
 {
  "id": "pas-de-cote",
  "dominant": "explorateur",
  "second": "meilleure-version",
  "label": "Pas de côté",
  "description": "Apprend en allant voir là où personne ne regarde.",
  "presentation": [
   "Tu apprends en allant voir là où personne ne regarde.",
   "Tu fais volontiers un pas de côté pour sortir des sentiers battus, et chaque détour est pour toi une occasion d’apprendre. Tu changes d’avis quand le terrain te contredit, et tu sais nommer ce que tu ne maîtrises pas encore : c’est comme ça que tu avances.",
   "À explorer ensemble : comment tu décides qu’une exploration doit s’arrêter, et comment tu transformes ce que tu apprends en résultats."
  ]
 },
 {
  "id": "cordee",
  "dominant": "meilleure-version",
  "second": "collectif",
  "label": "Cordée",
  "description": "Monte vite, et vérifie que tout le monde suit.",
  "presentation": [
   "Tu montes vite, et tu vérifies que tout le monde suit.",
   "Tu prends des engagements et tu les tiens jusqu’au bout ; tu sais trancher et assumer. Mais ta progression n’a de sens que si l’équipe avance aussi : tu tends la main, tu tires le groupe, et tu ne laisses personne derrière.",
   "À explorer ensemble : ce que tu fais quand ton rythme et celui de l’équipe ne sont pas les mêmes, et comment tu réagis quand un collègue décroche."
  ]
 },
 {
  "id": "pierre-a-aiguiser",
  "dominant": "meilleure-version",
  "second": "sans-chichi",
  "label": "Pierre à aiguiser",
  "description": "Travaille son geste sans se raconter d’histoires sur son niveau.",
  "presentation": [
   "Tu travailles ton geste, sans te raconter d’histoires sur ton niveau.",
   "Tu veux progresser, et pour ça tu regardes les faits en face, les tiens d’abord. Tu sais ce que tu fais bien et ce que tu dois encore apprendre, tu demandes des retours francs et tu t’en sers. Ce que tu commences, tu le finis proprement.",
   "À explorer ensemble : le dernier retour difficile que tu as reçu, et ce que tu en as fait."
  ]
 },
 {
  "id": "marche-d-apres",
  "dominant": "meilleure-version",
  "second": "explorateur",
  "label": "Marche d’après",
  "description": "Cherche sa prochaine marche en allant voir ailleurs.",
  "presentation": [
   "Tu cherches ta prochaine marche, en allant voir ailleurs.",
   "Tu sais où tu en es et tu veux aller plus loin. Pour grandir, tu explores : nouveaux sujets, nouvelles façons de faire, idées que personne n’ose formuler. Tu décides vite et tu assumes, quitte à corriger le tir en route.",
   "À explorer ensemble : ce que tu cherches dans ta prochaine étape, et comment tu choisis entre approfondir et explorer."
  ]
 }
];
var SITUATIONS = [
 {
  "id": "s17",
  "title": "Une demande manque de clarté",
  "context": "On te demande de résoudre un problème sans préciser l’attente.",
  "cards": [
   {
    "id": "s17-a",
    "label": "En parler avec l’équipe avant de commencer",
    "behavior": "tenir-ensemble"
   },
   {
    "id": "s17-b",
    "label": "Faire les choses bien malgré le flou",
    "behavior": "faire-droit"
   },
   {
    "id": "s17-c",
    "label": "Remonter au problème d’origine",
    "behavior": "ouvrir-le-capot"
   },
   {
    "id": "s17-d",
    "label": "Choisir une interprétation et l’annoncer",
    "behavior": "trancher"
   }
  ]
 },
 {
  "id": "s01",
  "title": "Un désaccord ralentit l’équipe",
  "context": "Tu dois avancer malgré deux propositions opposées.",
  "cards": [
   {
    "id": "s01-b",
    "label": "Comparer les deux propositions point par point",
    "behavior": "aller-verifier"
   },
   {
    "id": "s01-c",
    "label": "Accepter de revoir sa position",
    "behavior": "changer-avis"
   },
   {
    "id": "s01-d",
    "label": "Prendre en charge la suite, quelle qu’elle soit",
    "behavior": "porter-au-bout"
   },
   {
    "id": "s01-a",
    "label": "Demander l’avis de quelqu’un d’extérieur",
    "behavior": "tisser"
   }
  ]
 },
 {
  "id": "s09",
  "title": "Le plan change au dernier moment",
  "context": "La priorité du jour n’est plus celle d’hier.",
  "cards": [
   {
    "id": "s09-c",
    "label": "Voir ce que ce changement rend possible",
    "behavior": "truc-a-cote"
   },
   {
    "id": "s09-d",
    "label": "Dire franchement que ça déstabilise",
    "behavior": "regarder-en-face"
   },
   {
    "id": "s09-a",
    "label": "Expliquer le changement à ceux qui l’ignorent",
    "behavior": "se-faire-comprendre"
   },
   {
    "id": "s09-b",
    "label": "Demander ce qui justifie ce changement",
    "behavior": "appui-reel"
   }
  ]
 },
 {
  "id": "s25",
  "title": "Le délai est très court",
  "context": "Tu dois choisir sans avoir tous les éléments.",
  "cards": [
   {
    "id": "s25-d",
    "label": "Assumer le choix jusqu’à la livraison",
    "behavior": "porter-au-bout"
   },
   {
    "id": "s25-a",
    "label": "Solliciter quelqu’un qui a déjà fait ce choix",
    "behavior": "tisser"
   },
   {
    "id": "s25-b",
    "label": "Vérifier les deux éléments qui comptent le plus",
    "behavior": "aller-verifier"
   },
   {
    "id": "s25-c",
    "label": "Décider en sachant qu’on pourra corriger",
    "behavior": "changer-avis"
   }
  ]
 },
 {
  "id": "s44",
  "title": "Tu découvres un problème discret",
  "context": "Personne ne semble encore l’avoir remarqué.",
  "cards": [
   {
    "id": "s44-a",
    "label": "Alerter l’équipe pour le traiter ensemble",
    "behavior": "tenir-ensemble"
   },
   {
    "id": "s44-b",
    "label": "Le corriger, même si personne ne le verra",
    "behavior": "faire-droit"
   },
   {
    "id": "s44-c",
    "label": "Comprendre d’où il vient",
    "behavior": "ouvrir-le-capot"
   },
   {
    "id": "s44-d",
    "label": "Décider de le corriger tout de suite",
    "behavior": "trancher"
   }
  ]
 },
 {
  "id": "s33",
  "title": "Un retour est difficile à entendre",
  "context": "Une personne critique une proposition sur laquelle tu as travaillé.",
  "cards": [
   {
    "id": "s33-b",
    "label": "Demander des exemples précis",
    "behavior": "appui-reel"
   },
   {
    "id": "s33-c",
    "label": "Y voir une piste d’amélioration inattendue",
    "behavior": "truc-a-cote"
   },
   {
    "id": "s33-d",
    "label": "Reconnaître ce qui est juste dans la critique",
    "behavior": "regarder-en-face"
   },
   {
    "id": "s33-a",
    "label": "Reformuler pour être sûr de comprendre",
    "behavior": "se-faire-comprendre"
   }
  ]
 },
 {
  "id": "s13",
  "title": "Une expérimentation échoue",
  "context": "L’essai ne donne pas le résultat espéré.",
  "cards": [
   {
    "id": "s13-c",
    "label": "Abandonner l’idée et dire pourquoi",
    "behavior": "changer-avis"
   },
   {
    "id": "s13-d",
    "label": "Terminer le bilan avant de passer à autre chose",
    "behavior": "porter-au-bout"
   },
   {
    "id": "s13-a",
    "label": "Partager l’échec avec d’autres équipes",
    "behavior": "tisser"
   },
   {
    "id": "s13-b",
    "label": "Analyser précisément ce qui n’a pas marché",
    "behavior": "aller-verifier"
   }
  ]
 },
 {
  "id": "s38",
  "title": "Une tension se crée en réunion",
  "context": "Le ton monte entre deux participants.",
  "cards": [
   {
    "id": "s38-d",
    "label": "Suspendre la réunion",
    "behavior": "trancher"
   },
   {
    "id": "s38-a",
    "label": "Calmer le jeu pour garder le groupe uni",
    "behavior": "tenir-ensemble"
   },
   {
    "id": "s38-b",
    "label": "Rappeler les règles du respect",
    "behavior": "faire-droit"
   },
   {
    "id": "s38-c",
    "label": "Chercher ce qui oppose vraiment les deux",
    "behavior": "ouvrir-le-capot"
   }
  ]
 }
];
var TIEBREAKS = [
 {
  "id": "s45",
  "title": "Une tâche est bloquée",
  "context": "Tu dépends d’une réponse qui tarde à arriver.",
  "cards": [
   {
    "id": "s45-a",
    "label": "Reformuler clairement ce dont tu as besoin",
    "behavior": "se-faire-comprendre"
   },
   {
    "id": "s45-b",
    "label": "Faire le point sur ce qui bloque vraiment",
    "behavior": "appui-reel"
   },
   {
    "id": "s45-c",
    "label": "Trouver un moyen de contourner l’attente",
    "behavior": "truc-a-cote"
   },
   {
    "id": "s45-d",
    "label": "Reconnaître que tu aurais pu anticiper",
    "behavior": "regarder-en-face"
   }
  ]
 },
 {
  "id": "s46",
  "title": "Une amélioration te paraît évidente",
  "context": "Ce n’est pas dans les priorités pour l’instant.",
  "cards": [
   {
    "id": "s46-b",
    "label": "Chiffrer son intérêt réel",
    "behavior": "aller-verifier"
   },
   {
    "id": "s46-c",
    "label": "Accepter d’attendre si les priorités sont justes",
    "behavior": "changer-avis"
   },
   {
    "id": "s46-d",
    "label": "La défendre jusqu’à la faire inscrire",
    "behavior": "porter-au-bout"
   },
   {
    "id": "s46-a",
    "label": "Trouver des alliés pour la porter",
    "behavior": "tisser"
   }
  ]
 }
];

var valueOfBehavior = {};
VALUES.forEach(function(v){ v.behaviors.forEach(function(b){ valueOfBehavior[b.id] = v.id; }); });
var valueOfCard = {};
SITUATIONS.concat(TIEBREAKS).forEach(function(s){ s.cards.forEach(function(c){ c.value = valueOfBehavior[c.behavior]; valueOfCard[c.id] = c.value; }); });

/* Anciens identifiants (codes EC1 émis avant octobre 2026). */
var LEGACY = {"chichi":"sans-chichi","version":"meilleure-version"};
function normId(id){ return LEGACY[id] || id; }

function value(id){ id = normId(id); for(var i=0;i<VALUES.length;i++) if(VALUES[i].id===id) return VALUES[i]; return null; }
function profileFor(dom, sec){ dom = normId(dom); sec = normId(sec); for(var i=0;i<PROFILES.length;i++){ var p = PROFILES[i]; if(p.dominant===dom && p.second===sec) return p; } return null; }

/* Une carte choisie = 1 point pour sa valeur. answers : { situationId: [cardId, cardId] } */
function count(answers){
  var t = {}; VALUES.forEach(function(v){ t[v.id] = 0; });
  SITUATIONS.forEach(function(s){ (answers[s.id]||[]).forEach(function(c){ if(valueOfCard[c]) t[valueOfCard[c]] += 1; }); });
  return t;
}

/* Classe les deux premières valeurs. tiebreaks : [{between:[valueId], chosen:cardId}] dans l'ordre joué.
   Rend {dominant, second} ou {pending:[valueId], place:1|2} quand un départage est nécessaire. */
function resolve(totals, tiebreaks){
  var queue = (tiebreaks||[]).slice(), ranked = [], remaining = Object.keys(totals);
  while(ranked.length < 2){
    var best = Math.max.apply(null, remaining.map(function(id){ return totals[id]; }));
    var tied = remaining.filter(function(id){ return totals[id] === best; });
    var winner = tied[0];
    if(tied.length > 1){
      if(!queue.length) return {pending: tied, place: ranked.length + 1, ranked: ranked.slice()};
      var tb = queue.shift();
      winner = valueOfCard[tb.chosen];
      if(tied.indexOf(winner) < 0) return {error: "Le départage ne correspond pas aux valeurs à égalité."};
    }
    ranked.push(winner);
    remaining = remaining.filter(function(id){ return id !== winner; });
  }
  return {dominant: ranked[0], second: ranked[1]};
}

/* Fichier exporté par le jeu en ligne (format yeita-match-session, version 2). */
function readSession(obj){
  if(!obj || obj.format !== "yeita-match-session" || obj.version !== 2 || !obj.answers) throw new Error("Ce fichier n'est pas une partie Yeitigai exportée par le jeu en ligne.");
  var totals = count(obj.answers);
  var tbs = (obj.tiebreaks||[]).map(function(t){ return {between: t.between, chosen: t.chosen}; });
  var r = resolve(totals, tbs);
  if(r.error || r.pending) throw new Error("La partie importée est incomplète : le profil ne peut pas être recalculé.");
  return {candidate: obj.candidateName, host: obj.hostName, date: obj.date, totals: totals, dominant: r.dominant, second: r.second, notes: obj.notes || {}};
}

window.YEITIGAI = {VALUES: VALUES, PROFILES: PROFILES, SITUATIONS: SITUATIONS, TIEBREAKS: TIEBREAKS,
  value: value, normId: normId, profileFor: profileFor, valueOfCard: valueOfCard, count: count, resolve: resolve, readSession: readSession,
  GAME_URL: "https://yeichati.github.io/yeita-match/"};
})();
