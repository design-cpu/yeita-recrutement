/* Réglages de l'espace Candidatures. À modifier ici, sans toucher au code (voir CONTRIBUER.md).
   Rien de confidentiel dans ce fichier : il est lisible par toute personne qui charge l'espace. */
window.YEITA_CONFIG = {
  /* L'équipe recrutement : propose ces prénoms dans « Qui es-tu ? » et dans le champ Recruteurs.
     On peut toujours ajouter un autre nom depuis l'interface ; il est alors gardé dans ce navigateur. */
  equipe: ["Peter", "Thélo", "Andrea", "Pauline", "Léo"],

  /* Le nom complet de chaque membre, affiché partout (historique, « fait par », « envoyé par », recruteurs), sauf sur la carte
     du kanban (initiales). Un nom absent de cette liste s'affiche tel qu'il a été saisi. À compléter. */
  equipeNoms: {
    "Léo": "Léo Fuster"
  },

  /* Les pages publiques envoyées au candidat après l'appel de découverte (mail du one-pager).
     Elles restent hors de l'espace protégé. Laisser vide une page qui n'existe pas encore : elle n'apparaît pas dans le mail. */
  pagesCandidat: {
    /* One-pager illustré « Découvrir Yeita ». Aujourd'hui dans Notion ; à remplacer par l'adresse hébergée quand elle existe. */
    pourNousDecouvrir: "https://app.notion.com/p/Pr-sentation-Yeita-25c4bfab78168084ac91da03c4c2ee6f?source=copy_link",
    tonParcours: "https://recrutement.yeita.fr/one-pager.html"                     /* Page « Les étapes de ton recrutement » */
  },

  /* Le bloc « Infos pratiques » du mail du one-pager. Une ligne vide n'apparaît pas. */
  infosPratiques: {
    adresse: "",
    acces: "",
    code: ""
  },

  /* Les liens utiles affichés dans les étapes. */
  liens: {
    guide: "../index.html",                                                            /* Guide du recruteur (suivi de l'ancre de l'étape) */
    employabilite: "https://app.notion.com/p/Employabilit-3e64bfab7816801592f4cfdf068968b6",
    grilleSalaire: "https://app.notion.com/p/2564bfab78168099a8f0de61754e3242",
    referentiel: "https://app.notion.com/p/3f94bfab781681289c7ccea584e7e7e1"
  },

  /* Grille de salaire 2026, Product people (Figma « Grille de Salaires »), en euros bruts annuels : la fourchette de chaque palier,
     du premier au dernier échelon. Sert à suggérer le palier en EC2 depuis le souhait de rémunération de l'appel. */
  paliersSalaire: [
    {palier: 1, min: 38000, max: 45000},   /* Je fais : 38, 42, 45 k€ */
    {palier: 2, min: 49000, max: 58000},   /* J'apporte de l'impact : 49, 52, 55, 58 k€ */
    {palier: 3, min: 61000, max: 67000},   /* Je structure et j'accompagne : 61, 64, 67 k€ */
    {palier: 4, min: 70000, max: 79000}    /* Je transforme : 70, 73, 76, 79 k€ */
  ],

  /* Mention RGPD, sur la carte d'identité (écran et PDF) et la page des étapes du recrutement. À valider avec la personne
     en charge des données : durée de conservation après la fin du recrutement, et adresse de contact. */
  rgpd: {
    dureeMois: 22,
    contact: "[adresse de contact RGPD à définir]"
  }
};
