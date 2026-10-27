/* Tous les textes de l'espace Candidatures, rangés par écran.
   Pour changer un texte : modifier la valeur entre guillemets, jamais le nom à gauche des deux-points.
   {job}, {n}, {nom}… sont remplacés à l'affichage : les garder tels quels. Mode d'emploi : CONTRIBUER.md. */
window.WORDING = {

  /* ---------- Partout dans l'espace ---------- */
  commun: {
    espace: "Candidatures",
    fictif: "Données fictives uniquement, jusqu'au déploiement sécurisé. Tout reste dans ce navigateur.",
    serveur: "Les candidatures sont enregistrées sur le serveur de l'équipe Yeita, accessible aux seuls recruteurs connectés.",
    volatile: "Ce navigateur refuse d'enregistrer : tout disparaîtra à la fermeture de l'onglet. Exporte la base avant de partir.",
    retourTableau: "Toutes les candidatures",
    guide: "Guide du recruteur",
    guideEtape: "Guide de l'étape",
    enregistre: "Enregistré",
    enregistreA: "Enregistré à {heure}",
    annuler: "Annuler",
    fermer: "Fermer",
    aide: "Aide",
    nonCommunique: "Non communiqué au candidat",
    surCarte: "Visible sur la carte du candidat",
    imprimer: "Imprimer",
    exemple: "Exemple",
    introuvable: "Cette candidature n'existe pas dans ce navigateur. Tant que le stockage est local, un lien ne marche que là où la candidature a été saisie.",
    sansId: "Ouvre une candidature depuis le tableau : cette page n'affiche aucun candidat sans son lien."
  },

  /* ---------- « Qui es-tu ? » (remplacé plus tard par la connexion Google) ---------- */
  qui: {
    label: "Qui es-tu ?",
    choisir: "Choisis ton prénom",
    autre: "Un autre nom…",
    nouveauLabel: "Ton prénom",
    nouveauPlaceholder: "Ton prénom",
    valider: "OK",
    note: "C'est noté : ",
    retire: "Prénom retiré",
    requis: "Choisis ton prénom en haut de la page : il est noté dans l'historique à chaque action.",
    connecte: "Connecté·e : ",
    lectureSeule: " · lecture seule"
  },
  /* Mode serveur (assets/demarrage.js, assets/adapter-serveur.js). Conflit : docs/backend/MODELE.md ; accès : api/README.md. */
  serveur: {
    conflit: "La candidature a été modifiée par quelqu'un d'autre. Recharge la page.",
    horsEquipe: "Tu ne fais pas partie de l'équipe.",
    lectureSeule: "Lecture seule : tu ne peux pas modifier.",
    reseau: "La base ne répond pas. Vérifie ta connexion, puis réessaie.",
    session: "Ta session n'a pas pu être vérifiée. Ferme l'onglet, puis rouvre le site.",
    identifiant: "Identifiant invalide pour « {nom} » : ce dossier ne peut pas être enregistré dans la base.",
    saisie: "Ce que tu as saisi depuis n'est pas enregistré : copie-le avant de recharger.",
    nonEnregistre: "Non enregistré",
    recharger: "Recharger",
    exportTexte: "Les candidatures sont enregistrées sur le serveur de l'équipe. Un export est une copie : supprime-la après usage."
  },

  /* ---------- Les étapes : libellé, libellé court (colonnes, étapes en haut de la fiche), objectif en une phrase ---------- */
  etapes: {
    "appel":       {label: "Appel de découverte", court: "Appel", objectif: "Comprendre ce que la personne cherche, et décider s'il y a un EC1."},
    "ec1":         {label: "EC1", court: "EC1", objectif: "Lire comment la personne fonctionne dans nos quatre valeurs, avec Yeita Match."},
    "bilan-ec1":   {label: "Bilan EC1", court: "Bilan EC1", objectif: "Croiser les lectures, puis décider : on continue, on met en attente, ou on s'arrête."},
    "ec2":         {label: "EC2", court: "EC2", objectif: "Lire le métier sur les quatre diamants, avec des faits, et placer le palier."},
    "bilan-ec2":   {label: "Bilan EC2", court: "Bilan EC2", objectif: "Réunir ce qui reste ouvert pour l'EC3, puis décider de la suite."},
    "ec3":         {label: "EC3", court: "EC3", objectif: "Lever les dernières zones d'ombre et corriger la carte d'identité avec la personne."},
    "decision":    {label: "Décision", court: "Décision", objectif: "Trancher, avec un commentaire court. Toujours au téléphone d'abord."},
    "proposition": {label: "Proposition", court: "Proposition", objectif: "Faire la proposition d'embauche et suivre la réponse."},
    "go-mission":  {label: "Go sur mission", court: "Go sur mission", objectif: "L'embauche attend une mission : on la confirme dès qu'elle est trouvée."},
    "onboarding":  {label: "Onboarding", court: "Onboarding", objectif: "La carte d'identité devient le point de départ de la personne, avec sa Nanny."},
    "vivier":      {label: "Vivier", court: "Vivier", objectif: "On s'entend bien, pas tout de suite : la personne reste au vivier."},
    "non-retenu":  {label: "Non retenu", court: "Non retenu", objectif: "Le parcours s'arrête ici. La carte d'identité part si la personne la veut."}
  },

  /* ---------- L'État : se change à la main, depuis la carte du tableau ou la fiche ---------- */
  etats: {
    "a-planifier": "À planifier",
    "planifie": "Planifié",
    "fait": "Fait",
    "retour-a-faire": "Retour à faire",
    "non-retenu": "Non retenu",
    "valide": "Validé",
    "plus-dispo": "Plus dispo"
  },

  /* ---------- Les métiers : comment on les nomme dans une phrase (question 3 de l'appel) ---------- */
  jobsDansUnePhrase: {
    "PrD": "Product Designer", "PM / PO": "PM / PO", "Ops": "Product Ops", "SM": "Scrum Master", "PMM": "Product Marketing Manager",
    "UXR": "UX Researcher", "Bizdev": "Bizdev", "RH": "RH", "Recruteur·se": "recruteur·se"
  },

  /* ---------- Le tableau des candidatures ---------- */
  tableau: {
    titre: "Candidatures",
    ajouter: "Ajouter un candidat",
    affichage: "Affichage",
    kanban: "Kanban",
    liste: "Liste",
    chercher: "Chercher un nom ou un e-mail",
    afficherPlus: "Afficher plus",
    afficherPlusDetail: "Go sur mission, Vivier, Non retenu",
    masquer: "Masquer Go sur mission, Vivier, Non retenu",
    colonneVide: "Personne ici",
    resume: "{enCours} en cours",
    resumeRetour: "{n} retour à faire",
    resumeRetours: "{n} retours à faire",
    glisser: "Une carte avance par les actions de son étape, pour qu'aucune fiche ne soit sautée. Ouvre la candidature pour la faire avancer.",
    copierLien: "Copier le lien",
    lienCopie: "Lien copié",
    lienAide: "Le lien ouvre ce candidat à son étape. Tant que le stockage est local, il ne marche que dans ce navigateur.",
    changerEtat: "Changer l'état de {nom}",
    xp: "{n} ans", xpUn: "1 an", xpVide: "XP ?",
    dispoVide: "Dispo ?",
    recruteursVide: "Sans recruteur",
    vide: {
      titre: "Aucune candidature pour l'instant",
      texte: "Ajoute la première personne avec qui tu as un appel de découverte. Pour une démo, charge des exemples fictifs.",
      texteServeur: "Ajoute la première personne avec qui tu as un appel de découverte.",
      exemples: "Charger des exemples"
    },
    colonnes: {candidat: "Candidat", job: "Job", xp: "XP", dispo: "Disponibilité", etat: "État", recruteurs: "Recruteurs", etape: "Étape", debut: "Début du process", lien: "Actions"},
    trierPar: "Trier par {col}",
    sauvegarde: {
      titre: "Sauvegarde et exemples",
      exporter: "Exporter la base (JSON)",
      importerFichier: "Importer un fichier JSON",
      fusionner: "Fusionner", remplacer: "Remplacer tout",
      copieExport: "L'export, à copier si le téléchargement est bloqué",
      copier: "Copier l'export",
      coller: "Ou colle un export ici",
      importerTexte: "Importer le texte collé",
      exemples: "Charger des exemples", retirerExemples: "Retirer les exemples",
      dernierExport: "Dernier export depuis ce navigateur : {quand}.", jamais: "Pas encore d'export depuis ce navigateur. Exporte la base de temps en temps : c'est ta sauvegarde.",
      exportPret: "Export prêt",
      importOk: "Import terminé : {a} ajouté(s), {m} mis à jour, {i} déjà à jour.",
      importVide: "Colle d'abord un export.",
      exemplesCharges: "Exemples fictifs chargés",
      exemplesRetires: "Exemples retirés",
      exportCopie: "Export copié"
    }
  },

  /* ---------- Ajouter un candidat ---------- */
  ajout: {
    titre: "Ajouter un candidat",
    personne: "Nom Prénom",
    personneAide: "Colle-le tel quel, par exemple « NOM Prénom ».",
    job: "Job",
    provenance: "Provenance",
    email: "E-mail",
    telephone: "Téléphone",
    plus: "Plus d'infos (facultatif)",
    xp: "Expérience (années)",
    dispo: "Disponibilité",
    dateDispo: "Date de disponibilité",
    ville: "Ville",
    linkedin: "LinkedIn",
    portfolio: "Portfolio",
    cv: "CV (lien)",
    cvAide: "Un lien pour l'instant. Le dépôt de fichier viendra avec le stockage sécurisé.",
    references: "Références",
    recruteurs: "Recruteurs",
    ouvrirAppel: "Démarrer l'appel maintenant",
    enregistrer: "Enregistrer et revenir à la liste",
    ajoute: "{nom} ajouté·e à l'appel de découverte"
  },

  /* ---------- Le champ Recruteurs, « à la Notion » ---------- */
  recruteurs: {
    ajouterLabel: "Ajouter un recruteur",
    placeholder: "Tape un prénom, puis Entrée",
    retirer: "Retirer {nom}",
    aide: "Choisis dans la liste ou tape un nouveau prénom : il sera proposé ensuite partout."
  },

  /* ---------- Le bloc « Infos candidat » (en haut de l'appel, et dans « Fiche du candidat » ailleurs) ---------- */
  infos: {
    titre: "Infos candidat",
    ficheTitre: "Fiche du candidat",
    debutProcess: "Début du process",
    autreDispo: "Autre…",
    autreDispoLabel: "Nouvelle option de disponibilité",
    supprimer: "Supprimer ce candidat",
    supprimerTitre: "Supprimer {nom} ?",
    supprimerConfirme: "La candidature, sa carte d'identité et son historique disparaissent. C'est aussi la réponse à une demande d'effacement.",
    supprimerOui: "Supprimer", supprimerNon: "Garder",
    supprime: "{nom} supprimé·e"
  },

  /* ---------- Le menu ⋯ d'un candidat (tableau, liste, en-tête du parcours) ---------- */
  menu: {
    bouton: "Plus d'actions pour {nom}",
    fiche: "Fiche du candidat",
    historique: "Historique",
    copierLien: "Copier le lien",
    supprimer: "Supprimer",
    fermer: "Fermer"
  },

  /* ---------- Le panneau Notes : les notes libres de l'entretien, une par étape ---------- */
  notes: {
    bouton: "Notes",
    titre: "Notes",
    etape: "Notes · {etape}",
    placeholder: "Ce qui se dit, en vrac.",
    autres: "Les autres étapes",
    fermer: "Fermer les notes",
    ecrites: "notes déjà écrites pour cette étape"
  },

  /* ---------- La fiche candidat : en-tête, étapes, sorties communes ---------- */
  fiche: {
    etapeSur: "Étape {n} sur {total}",
    etapePassee: "Étape passée, en lecture",
    termineeLe: ", terminée le {quand}",
    revenir: "Revenir à l'étape en cours",
    arrete: "Parcours arrêté ici",
    futur: "Pas encore : on avance d'une étape à la fois",
    enCours: "Étape en cours",
    passee: "Étape passée, en lecture",
    historique: "Historique",
    entree: "Entrée : {etape}",
    etatChange: "État : {etat}",
    annulerPassage: "Annuler ce passage",
    passageFait: "{de} validé → {vers}",
    passageAnnule: "Passage annulé : retour à {etape}.",
    sorties: "Sorties de l'étape"
  },

  /* ---------- Les fiches EC1 et EC2 (candidatures/ec1.html, ec2.html), la carte et la feuille de décompte ---------- */
  ec: {
    titre1: "Fiche de l'EC1 · Yeita Match et valeurs",
    titre2: "Fiche de l'EC2 · Scorecard",
    liens: "Liens et outils",
    masquerCarte: "Masquer sur la carte",
    echange: "Échange libre",
    pitch: "Pitch Yeita",
    recit: "Son parcours, raconté",
    prendreNotes: "Prendre des notes",
    role: "Rôle",
    roleJob: "Repris du Job de la fiche candidat",
    palier: "Palier visé",
    suggere: "suggéré",
    suggereDepuis: "Suggéré depuis le souhait de rémunération : {texte}",
    copierNotion: "Copier pour Notion",
    vider: "Vider la fiche",
    viderQuestion: "Vider la fiche de {nom} ?",
    viderTexte: "Ce qui est écrit ici disparaît de sa candidature et de sa carte d'identité.",
    ymPasse: "Yeita Match passé",
    presentiel: "En présentiel",
    visio: "En visio",
    ymRepris: "Résultat repris : {dom}, puis {sec}",
    autoSave: "Enregistrement automatique",
    retourParcours: "Retour au parcours : {etape}",
    decompte: "Feuille de décompte",
    jeuEnLigne: "Yeita Match en ligne",
    kit: "Kit Yeita Match",
    carte: "Carte d'identité",
    scorecard: "Scorecard (référentiel)",
    grille: "Grille de salaire",
    carteRetour: "Retour au parcours",
    imprimer: "Imprimer pour l'EC3",
    decompteSans: "Ouverte seule, la feuille compte les jetons mais ne reporte rien : ouvre-la depuis la fiche EC1 d'un candidat pour reporter son résultat.",
    decompteReporter: "Reporter sur la fiche EC1 de {nom}",
    retourFiche: "Retour à la fiche EC1 de {nom}"
  },

  /* ---------- Les actions en bas de chaque étape ---------- */
  sorties: {
    suivant: {
      "appel": "Passer à l'EC1",
      "ec1": "Passer au bilan",
      "ec2": "Passer au bilan",
      "bilan-ec1": "Continuer vers l'EC2",
      "bilan-ec2": "Continuer vers l'EC3",
      "ec3": "Envoyer en décision",
      "proposition": "Arrivée confirmée",
      "go-mission": "Arrivée confirmée"
    },
    nonRetenu: "Non retenu",
    reflexion: "Mettre en attente (retour à faire)",
    reflexionFait: "Mis en attente : retour à faire. La carte reste dans sa colonne.",
    pasDeRefusEC3: "Pas de refus en EC3 : la décision tranche.",
    ficheVide: "La fiche est encore vide.",
    seDecideAuBilan: "Le non se décide au bilan."
  },

  /* ---------- Bilans EC1 et EC2 (candidat.html?etape=bilan-ec1, bilan-ec2) ---------- */
  bilan: {
    rappel: "Call de 15 min de débrief avec la personne suivante, ou en asynchrone",
    forme: "Forme du débrief",
    enAppel: "En appel, 15 min",
    enAsync: "En asynchrone",
    carteBref: "La carte d'identité",
    lignes: {
      percu: "Ce qu'on a perçu", match: "Yeita Match", partielle: "Lecture partielle", employabilite: "Employabilité",
      vigilance: "Signaux de vigilance", creuserEC2: "À creuser en EC2", creuserEC3: "À creuser en EC3", palier: "Palier", creux: "Diamants creux"
    },
    nonRenseigne: "Non renseigné",
    ouvrirCarte: "Ouvrir la carte d'identité",
    imprimerEC3: "Imprimer pour l'EC3",
    exporterCarte: "Exporter la carte (PDF)"
  },

  /* ---------- EC3 (candidat.html?etape=ec3) ---------- */
  ec3: {
    aCreuser: "À creuser en EC3",
    aucuneQuestion: "Aucune question ouverte : l'EC3 confirme la carte avec la personne.",
    carteComplete: "La carte complète",
    blocNotes: "L'entretien",
    date: "Date de l'EC3",
    par: "Mené par",
    notes: "Notes de l'EC3"
  },

  /* ---------- Onboarding (candidat.html?etape=onboarding) ---------- */
  onboarding: {
    carte: "La carte d'identité, point de départ avec sa Nanny",
    finTitre: "{prenom} rejoint Yeita",
    finTexte: "Le recrutement est terminé. Sa carte d'identité devient son point de départ, avec sa Nanny.",
    finParcours: "Son parcours",
    finRetour: "Retour aux candidatures"
  },

  /* ---------- Le one-pager, à la fin de l'appel ---------- */
  onePager: {
    titre: "Le one-pager",
    texte: "Seulement si on avance. Ouvre un brouillon Gmail à l'adresse de la personne, relis, envoie, puis coche la case.",
    sansEmail: "Ajoute l'e-mail de la personne dans « Infos candidat » pour préparer le brouillon.",
    envoyer: "Envoyer le one-pager",
    envoyerSr: "(ouvre Gmail dans un nouvel onglet)",
    coche: "One-pager envoyé",
    envoyeLe: "One-pager envoyé le {quand} par {qui}",
    objet: "Yeita : la suite de ton recrutement",
    corps: "Bonjour {prenom},\n\nMerci pour notre échange. Comme promis, voici de quoi découvrir Yeita et la suite de ton parcours.\n\n{pages}{infos}\nÀ très vite,\n{moi}",
    pageDecouvrir: "Découvrir Yeita en une page : {url}",
    pageParcours: "Les étapes de ton recrutement : {url}",
    infosTitre: "Infos pratiques",
    infosAdresse: "Adresse : {v}",
    infosAcces: "Accès : {v}",
    infosCode: "Code d'entrée : {v}"
  },

  /* ---------- L'appel de refus (Non retenu) ---------- */
  refus: {
    titre: "Appel de refus",
    rappel: "Le refus se fait par téléphone d'abord : « pas aujourd'hui, parce que… ».",
    carteSuit: "La carte d'identité suit par mail, si la personne la veut.",
    sansCarte: "À cette étape, pas de carte : un mail court confirme l'appel.",
    motif: "Motif",
    choisirMotif: "Choisis un motif",
    detail: "En une phrase",
    detailPlaceholder: "Ce qui a été dit au téléphone",
    exporter: "Exporter la carte (PDF)",
    carteEnvoyee: "Carte d'identité envoyée",
    clore: "Clore le parcours",
    revenir: "Revenir à l'étape",
    note: "La candidature passe dans la colonne Non retenu (masquée par défaut). Un clic de trop s'annule juste après.",
    fait: "{nom} passe dans Non retenu.",
    arrete: "Parcours arrêté le {quand}{par}. Motif : {motif}.",
    carteEnvoyeeOui: "Carte d'identité envoyée.",
    carteEnvoyeeNon: "Carte d'identité non envoyée."
  },

  /* ---------- La décision ---------- */
  decision: {
    titre: "La décision",
    appel: "Appel au candidat",
    appelTexte: "La décision se dit au téléphone d'abord. Le mail vient après, avec la carte d'identité.",
    appelFait: "Appel fait",
    choix: {
      "proposition": {label: "Proposition d'embauche", aide: "Passe dans la colonne Proposition."},
      "go-mission": {label: "Go sur mission", aide: "Embauche conditionnée à une mission. Passe dans Go sur mission."},
      "vivier": {label: "Vivier", aide: "On s'entend bien, pas tout de suite. Passe dans Vivier."},
      "non-retenu": {label: "Non retenu", aide: "Ouvre l'appel de refus."}
    },
    commentaire: "Commentaire",
    commentaireAide: "Deux ou trois phrases, comme le « CR final » de Notion : pourquoi cette décision.",
    valider: "Valider la décision",
    commentaireRequis: "Ajoute un commentaire court : il reste dans le dossier.",
    choisir: "Choisis une décision.",
    prise: "Décision : {choix}, le {quand} par {par}.",
    pourDecider: "Pour décider",
    palier: "Palier proposé",
    conditions: "À confirmer avant la proposition",
    notesEC3: "Notes de l'EC3"
  },

  /* ---------- Mention RGPD : carte d'identité (écran et PDF), page des étapes. Durée et contact : assets/config.js ---------- */
  rgpd: {
    mention: "Yeita garde ces informations {duree} après la fin de ton recrutement, pour le suivre et te recontacter. Pour les consulter, les corriger ou les faire effacer : {contact}."
  },

  /* ---------- L'appel de découverte : les questions de la base Notion, une par champ ---------- */
  appel: {
    aide: "On ne fait pas raconter le parcours ni le CV : c'est le travail de l'EC1. Sinon, le candidat pitche son CV pendant 20 à 30 minutes.",
    date: "Date de l'appel",
    par: "Mené par",
    questions: {
      recherche: "Sa recherche : souhait de mission, rôle",
      pourquoi: "Pourquoi en recherche ?",
      role: "C'était quoi ton rôle en tant que {job} sur tes projets ? En quoi ça consistait ? Tes tâches ?",
      roleGenerique: "C'était quoi ton rôle sur tes projets ? En quoi ça consistait ? Tes tâches ?",
      ia: "Comment utilises-tu l'IA dans ton quotidien ?",
      iaAide: "Depuis quand, sur quels outils, qu'est-ce que tu fais avec ?",
      yeita: "Compréhension de ce qu'on fait chez Yeita",
      motivations: "Motivations, intérêts à rejoindre Yeita",
      disponibilite: "Disponibilité",
      disponibiliteNote: "Précision sur la disponibilité",
      pistes: "Pistes d'emploi en cours",
      remuneration: "Souhait de rémunération",
      lieu: "Lieu d'habitation"
    },
    placeholder: "Ce que la personne a dit, avec ses mots.",
    ancien: "Notes de l'ancien format (4 blocs)",
    ancienBlocs: {parcours: "Le parcours", recherche: "La recherche", cadre: "Le cadre", conditions: "Les conditions"}
  }
};
