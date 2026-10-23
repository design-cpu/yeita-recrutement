/* Réglages de l'espace Candidatures. À modifier ici, sans toucher au code (voir CONTRIBUER.md).
   Rien de confidentiel dans ce fichier : il est lisible par toute personne qui charge l'espace. */
window.YEITA_CONFIG = {
  /* L'équipe recrutement : propose ces prénoms dans « Qui es-tu ? » et dans le champ Recruteurs.
     On peut toujours ajouter un autre nom depuis l'interface ; il est alors gardé dans ce navigateur. */
  equipe: ["Peter", "Thélo", "Andrea", "Pauline", "Léo"],

  /* Les pages publiques envoyées au candidat après l'appel de découverte (mail du one-pager).
     Elles restent hors de l'espace protégé. Laisser vide une page qui n'existe pas encore : elle n'apparaît pas dans le mail. */
  pagesCandidat: {
    pourNousDecouvrir: "",                                                            /* One-pager « Pour nous découvrir » (présentation de Yeita) */
    tonParcours: "https://design-cpu.github.io/yeita-recrutement/one-pager.html"      /* « Ton parcours chez Yeita » */
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
  }
};
