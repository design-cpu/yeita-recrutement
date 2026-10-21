/* L'employabilité en critères : ce qu'on vérifie en EC1, et la phrase que la personne peut lire sur sa carte.
   Repris de la fiche Employabilité dans Notion (trois axes et critères éliminatoires).
   Chaque critère se lit en interne. Il n'apparaît sur la carte d'identité que si on le coche « Sur la carte ».
   Les phrases sont des modèles : on les ajuste à la personne avant de cocher.
   Partagé par la fiche d'entretien candidat #1 et la carte d'identité. */
(function(){
"use strict";
var STATUTS = [
  {id:"aligne",         label:"Aligné"},
  {id:"a-discuter",     label:"À discuter"},
  {id:"pas-aujourdhui", label:"Pas aujourd'hui"}
];
var AXES = ["Parcours et posture", "Nos missions et nos rôles", "Souhaits de projets"];
var CRITERES = [
  {id:"salaire", axe:2, label:"Salaire et grille",
   question:"Ses prétentions tombent-elles dans la fourchette du palier qu'on peut viser ?",
   phrases:{
     "aligne":"Tes attentes de salaire tombent dans la fourchette du palier dont on a parlé.",
     "a-discuter":"Tes attentes de salaire sont en haut de la fourchette du palier dont on a parlé. On en reparle, grille en main.",
     "pas-aujourdhui":"Pas aujourd'hui, parce que tes attentes de salaire dépassent la fourchette du palier où on peut te placer. Notre grille est publique : c'est elle qui fixe le salaire, pas la négociation."}},
  {id:"localisation", axe:3, label:"Localisation et présentiel",
   question:"Un pied-à-terre à Paris ? Trois jours par semaine sur place chez le client, c'est tenable ?",
   phrases:{
     "aligne":"Trois jours par semaine sur place chez le client, à Paris : ça te va.",
     "a-discuter":"Le rythme de trois jours par semaine chez le client, à Paris, reste à caler avec ton organisation.",
     "pas-aujourdhui":"Pas aujourd'hui, parce que nos missions demandent trois jours par semaine chez le client, à Paris, et ce n'est pas possible pour toi en ce moment."}},
  {id:"poste", axe:2, label:"Product Owner ou Product Manager",
   question:"Le rôle tenu et le rôle cherché : un Product Owner centré sur le backlog, ou un Product Manager qui porte le problème et la stratégie ?",
   phrases:{
     "aligne":"Le rôle que tu cherches est celui qu'on tient en mission : Product Manager, du problème jusqu'à l'impact.",
     "a-discuter":"Ton expérience est surtout côté Product Owner, près du backlog. Chez Yeita, on porte aussi le cadrage et la stratégie : on en parle.",
     "pas-aujourdhui":"Pas aujourd'hui, parce que tu cherches un poste de Product Owner centré sur le backlog, et nos missions demandent un Product Manager, de la stratégie jusqu'à l'impact."}},
  {id:"discovery", axe:2, label:"Discovery ou delivery",
   question:"Où passe-t-elle son temps : à explorer le problème (interviews, données, hypothèses) ou à livrer (backlog, rituels, mise en production) ?",
   phrases:{
     "aligne":"Tu passes autant de temps à comprendre le problème qu'à livrer la solution : c'est l'équilibre qu'on cherche.",
     "a-discuter":"Tes exemples portent surtout sur la livraison. On aimerait voir comment tu explores un problème avant de le résoudre.",
     "pas-aujourdhui":"Pas aujourd'hui, parce que ton expérience est surtout côté livraison, et nos missions commencent presque toujours par l'exploration du problème : interviews, données, hypothèses."}},
  {id:"projets", axe:3, label:"Adéquation avec nos projets",
   question:"Ses secteurs, ses contextes et ses no-go collent-ils aux missions qu'on a, ou qui arrivent ?",
   phrases:{
     "aligne":"Les secteurs et les contextes qui t'intéressent sont ceux de nos missions en ce moment.",
     "a-discuter":"Tes envies de projets sont précises. On regarde ensemble ce qu'on a en ce moment, et ce qui arrive.",
     "pas-aujourdhui":"Pas aujourd'hui, parce que les projets que tu cherches ne sont pas ceux qu'on a en ce moment. Si ça change, on te le dira."}},
  {id:"parcours", axe:1, label:"Cohérence du parcours",
   question:"Pour chaque expérience : le contexte, l'équipe, son rôle exact, un résultat concret. Le récit colle-t-il au CV ?",
   phrases:{
     "aligne":"Ton parcours se raconte clairement : pour chaque expérience, ton rôle et ce que tu as obtenu.",
     "a-discuter":"Sur certaines expériences, on a eu du mal à distinguer ta part de celle de l'équipe. On aimerait l'entendre plus précisément.",
     "pas-aujourdhui":"Pas aujourd'hui, parce qu'on n'a pas réussi à voir ce que tu as porté toi-même dans tes dernières expériences, ni ce que ça a donné."}},
  {id:"posture", axe:1, label:"Posture face au client",
   question:"Écoute active, récits concrets, assume ses choix et ses erreurs, s'adapte, parle de valeur et de résultats.",
   phrases:{
     "aligne":"Tu écoutes, tu reformules, tu assumes tes choix et tes erreurs : c'est ce qu'on attend face à un client.",
     "a-discuter":"Tu parles volontiers de méthode, moins de ce qu'elle a changé. Face à un client, c'est le résultat qui compte : on en reparle.",
     "pas-aujourdhui":"Pas aujourd'hui, parce que dans tes exemples on a beaucoup entendu la méthode, et peu ce qu'elle a changé pour les utilisateurs. Face à un client, c'est ce qu'on attend en premier."}},
  {id:"anglais", axe:1, label:"Anglais",
   question:"Peut-elle mener une réunion en anglais avec une équipe ou un client ?",
   phrases:{
     "aligne":"Ton anglais te permet de travailler avec une équipe ou un client anglophone.",
     "a-discuter":"On n'a pas pu juger ton anglais pendant l'entretien : on le vérifiera à l'étape suivante.",
     "pas-aujourdhui":"Pas aujourd'hui, parce qu'une partie de nos missions se mène en anglais, et tu n'y serais pas encore à l'aise."}}
];
function critere(id){ return CRITERES.filter(function(c){ return c.id === id; })[0] || null; }
function statut(id){ return STATUTS.filter(function(s){ return s.id === id; })[0] || null; }
/* Les critères cochés « Sur la carte », dans l'ordre de la liste, avec une phrase non vide. */
function surLaCarte(criteres){
  criteres = criteres || {};
  return CRITERES.map(function(c){ var v = criteres[c.id]; return v && v.afficher && v.statut && (v.phrase||"").trim() ? {critere:c, statut:statut(v.statut), phrase:v.phrase.trim()} : null; })
    .filter(Boolean);
}
window.EMPLOYABILITE = {STATUTS:STATUTS, AXES:AXES, CRITERES:CRITERES, critere:critere, statut:statut, surLaCarte:surLaCarte};
})();
