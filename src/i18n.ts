import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Traducciones en francés (idioma por defecto)
const fr = {
  translation: {
    // Navegación
    carte: "Carte",
    liste: "Liste", 
    flash: "Flash",
    profil: "Profil",
    argent: "Argent",
    
    // Filtros
    filtros: "Filtros:",
    restaurants: "Restaurants",
    bars: "Bars",
    shops: "Shops",
    
    // Ofertas
    offres: "Offres",
    offresFlash: "Offres Flash",
    offresLimitees: "Offres limitées avec des réductions incroyables ! Ne les manquez pas !",
    tempsRestant: "Temps restant :",
    voirOffre: "Voir offre",
    activer: "ACTIVER MAINTENANT",
    glisserPourActiver: "← Glisser pour activer",
    activee: "✅ ACTIVÉE!",
    
    // Suscripción
    abonnementExpire: "Votre abonnement a expiré. Abonnez-vous pour accéder à toutes les offres.",
    periodeEssai: "Période d'essai active",
    joursRestants: "jours restants",
    sabonnerMaintenant: "S'abonner maintenant",
    
    // Perfil
    offresUtilisees: "Offres utilisées",
    totalEpargne: "Total épargné",
    points: "Points",
    niveau: "Niveau",
    
    // Dinero
    historiqueTransactions: "Historique des Transactions",
    exporterCSV: "Exporter CSV",
    
    // General
    bienvenue: "Bienvenue",
    connexion: "Connexion",
    inscription: "Inscription",
    deconnexion: "Déconnexion",
    email: "Email",
    motDePasse: "Mot de passe",
    confirmerMotDePasse: "Confirmer le mot de passe",
    nom: "Nom",
    prenom: "Prénom",
    seConnecter: "Se connecter",
    sinscrire: "S'inscrire",
    motDePasseOublie: "Mot de passe oublié ?",
    pasDeCompte: "Pas de compte ?",
    dejaUnCompte: "Déjà un compte ?",
    fermer: "Fermer",
    sauvegarder: "Sauvegarder",
    annuler: "Annuler",
    oui: "Oui",
    non: "Non",
    erreur: "Erreur",
    succes: "Succès",
    chargement: "Chargement...",
    valider: "Valider",
    
    // Suscripción modal
    gestionAbonnement: "Gestion d'abonnement",
    activerAbonnement: "Activer l'abonnement",
    abonnementActif: "Abonnement actif",
    planMensuel: "Plan Mensuel",
    planAnnuel: "Plan Annuel",
    accesComplet: "Accès complet à l'app",
    offresIllimitees: "Offres illimitées",
    supportPrioritaire: "Support prioritaire",
    deuxMoisGratuits: "2 mois gratuits",
    
    // Información personal
    informationsPersonnelles: "Informations personnelles",
    modifier: "Modifier",
    ville: "Ville",
    dernieresOffresActivees: "Dernières offres activées",
    tableauBordFinancier: "Tableau de bord financier",
    resumeFinancier: "Résumé financier",
    totalEconomise: "Total économisé",
    abonnement: "Abonnement",
    actif: "Actif",
    inactif: "Inactif",
    annulerAbonnement: "Annuler l'abonnement",
    confirmerAnnulation: "Confirmer l'annulation",
    messageAnnulation: "Êtes-vous sûr de vouloir annuler votre abonnement ? Cette action est irréversible.",
    abonnementAnnule: "Abonnement annulé avec succès",
    erreurAnnulation: "Erreur lors de l'annulation de l'abonnement",
    
    // Textos adicionales
    desbloquearOfertas: "Débloquez toutes les offres !",
    subscripcionAcceso: "Avec un abonnement actif, vous pouvez accéder à des centaines d'offres exclusives et économiser de l'argent sur vos achats préférés.",
    ofertasExclusivas: "Offres Exclusives",
    accesoUnico: "Accès à des offres uniques non disponibles pour les utilisateurs gratuits",
    sinLimites: "Sans Limites",
    usarOfertas: "Utilisez toutes les offres que vous voulez sans restrictions",
    ahorroGarantizado: "Économies Garanties",
    ahorrarDinero: "Économisez de l'argent réel sur chaque achat avec nos offres",
    bienvenidoAdmin: "Bienvenue, Administrateur !",
    compartirOferta: "🎉 Regardez cette offre incroyable sur FLASH !\n\n{name}\n{discount}\n\nTéléchargez FLASH : https://t4learningluca.web.app",
    enlaceCopiado: "Lien copié dans le presse-papiers !",
    cuentaCreada: "Compte créé avec succès ! Bienvenue sur FLASH !",
    bienvenidoFlash: "Bienvenue sur FLASH !",
    emailRestablecimiento: "Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.",
    ofertaActivada: "Offre Flash activée ! Vous avez 15 minutes pour l'utiliser.",
    welcomeFlash: "Bienvenue sur FLASH - Votre application de bons plans",
    uneteFlash: "Rejoignez FLASH et découvrez les meilleures offres !",
    nombreCompleto: "Nom complet",
    ofertaActivadaExclamacion: "Offre Activée !",
    activandoOferta: "Activation !",
    preparandoOferta: "Préparation de l'offre",
    pagoCompletado: "Paiement terminé !",
    procesandoPago: "Traitement sécurisé de votre paiement...",
    pagoExitoso: "Paiement effectué avec succès !",
    errorPago: "Une erreur s'est produite lors du traitement du paiement",
    ofertasUsadas: "Offres Utilisées",
    ofertasVistas: "Offres vues",
    
    // Subscription status
    subscriptionValidUntil: "Abonnement valide jusqu'au",
    subscriptionExpires: "Expire le",
    membershipActiveUntil: "Membre actif jusqu'au",
    subscriptionStatus: "Statut d'abonnement",
    timeRemaining: "Temps restant",
    expired: "Expiré",
    expiringSoon: "Expire bientôt - Renouvelez maintenant",
    refresh: "Actualiser",
    trial: "Essai",
    totalPaid: "Total payé",
    
    // Estadísticas personales
    estadisticasPersonales: "Statistiques Personnelles",
    tuActividadEnFlash: "Votre activité dans FLASH",
    miembroDesde: "Membre depuis",
    tusCategoriasFavoritas: "Vos catégories préférées",
    
    // Textos adicionales encontrados
    confirmerAnnulationAbonnement: "Êtes-vous sûr de vouloir annuler votre abonnement ?",
    nonGarderAbonnement: "Non, garder l'abonnement",
    annulationEnCours: "Annulation en cours...",
    ouiAnnuler: "Oui, annuler",
    
    // Otros textos encontrados
    subcategories: "Sous-catégories",
    all: "Tous",
    nouveau: "Nouveau",
    coutPourUtiliser: "Coût pour utiliser cette offre :",
    coutFactureAutomatiquement: "Ce coût sera facturé automatiquement lors de l'activation de l'offre",
    appeler: "Appeler",
    voirSurMap: "Voir sur la carte",
    addNewOffer: "Ajouter une nouvelle offre",
    businessName: "Nom de l'entreprise",
    adresse: "Adresse",
    categoria: "Catégorie",
    subcategoria: "Sous-catégorie",
    reduccionOferta: "Réduction/Offre",
    descripcion: "Description",
    calificacion: "Note",
    precio: "Prix",
    precioAnterior: "Prix précédent",
    agregarOferta: "Ajouter l'offre",
    ofertaAgregadaExitosamente: "Offre ajoutée avec succès !",
    noSePudoEncontrar: "Impossible de trouver l'adresse. Essayez avec une adresse plus spécifique.",
    googleMapsNoDisponible: "Google Maps n'est pas disponible. Réessayez plus tard.",
    errorAgregarOferta: "Erreur lors de l'ajout de l'offre",
    bloquearOferta: "🔒 Bloquage de l'offre... Attendez 10 minutes pour l'activation.",
    ofertaFlashExpirado: "Votre offre Flash a expiré.",
    porFavorCompleta: "Veuillez compléter le nom et l'adresse",
    testCredentials: "Identifiants de test :",
    user: "Utilisateur :",
    password: "Mot de passe :",
    signIn: "Se connecter",
    accesLimite: "🔒 Accès limité - Commencez votre essai gratuit de 7 jours",
    essaiGratuit: "Essai gratuit",
    essaiGratuitActif: "🎉 Essai gratuit actif - {days} jours restants",
    monProfil: "Mon Profil",
    essai: "🎉 Essai",
    expire: "⚠️ Expiré",
    active: "Active",
    resetPassword: "Réinitialiser le mot de passe"
  }
};

// Traducciones en inglés
const en = {
  translation: {
    // Navigation
    carte: "Map",
    liste: "List", 
    flash: "Flash",
    profil: "Profile",
    argent: "Money",
    
    // Filters
    filtros: "Filters:",
    restaurants: "Restaurants",
    bars: "Bars",
    shops: "Shops",
    
    // Offers
    offres: "Offers",
    offresFlash: "Flash Offers",
    offresLimitees: "Limited offers with incredible discounts! Don't miss them!",
    tempsRestant: "Time remaining:",
    voirOffre: "View offer",
    activer: "ACTIVATE NOW",
    glisserPourActiver: "← Swipe to activate",
    activee: "✅ ACTIVATED!",
    
    // Subscription
    abonnementExpire: "Your subscription has expired. Subscribe to access all offers.",
    periodeEssai: "Trial period active",
    joursRestants: "days remaining",
    sabonnerMaintenant: "Subscribe now",
    
    // Profile
    offresUtilisees: "Offers used",
    totalEpargne: "Total saved",
    points: "Points",
    niveau: "Level",
    
    // Money
    historiqueTransactions: "Transaction History",
    exporterCSV: "Export CSV",
    
    // General
    bienvenue: "Welcome",
    connexion: "Login",
    inscription: "Sign up",
    deconnexion: "Logout",
    email: "Email",
    motDePasse: "Password",
    confirmerMotDePasse: "Confirm password",
    nom: "Name",
    prenom: "First name",
    seConnecter: "Login",
    sinscrire: "Sign up",
    motDePasseOublie: "Forgot password?",
    pasDeCompte: "No account?",
    dejaUnCompte: "Already have an account?",
    fermer: "Close",
    sauvegarder: "Save",
    annuler: "Cancel",
    oui: "Yes",
    non: "No",
    erreur: "Error",
    succes: "Success",
    chargement: "Loading...",
    valider: "Validate",
    
    // Subscription modal
    gestionAbonnement: "Subscription management",
    activerAbonnement: "Activate subscription",
    abonnementActif: "Active subscription",
    planMensuel: "Monthly Plan",
    planAnnuel: "Annual Plan",
    accesComplet: "Full app access",
    offresIllimitees: "Unlimited offers",
    supportPrioritaire: "Priority support",
    deuxMoisGratuits: "2 months free",
    
    // Personal information
    informationsPersonnelles: "Personal Information",
    modifier: "Edit",
    ville: "City",
    dernieresOffresActivees: "Last activated offers",
    tableauBordFinancier: "Financial Dashboard",
    resumeFinancier: "Financial Summary",
    totalEconomise: "Total saved",
    abonnement: "Subscription",
    actif: "Active",
    inactif: "Inactive",
    annulerAbonnement: "Cancel subscription",
    confirmerAnnulation: "Confirm cancellation",
    messageAnnulation: "Are you sure you want to cancel your subscription? This action is irreversible.",
    abonnementAnnule: "Subscription cancelled successfully",
    erreurAnnulation: "Error cancelling subscription",
    
    // Subscription status
    subscriptionValidUntil: "Subscription valid until",
    subscriptionExpires: "Expires on",
    membershipActiveUntil: "Active member until",
    subscriptionStatus: "Subscription status",
    timeRemaining: "Time remaining",
    expired: "Expired",
    expiringSoon: "Expiring soon - Renew now",
    refresh: "Refresh",
    trial: "Trial",
    totalPaid: "Total paid"
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr,
      en
    },
    lng: 'fr', // Forzar francés como idioma predeterminado
    fallbackLng: 'fr',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;