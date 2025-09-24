import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

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
    erreurAnnulation: "Erreur lors de l'annulation de l'abonnement"
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
    erreurAnnulation: "Error cancelling subscription"
  }
};

// Traducciones en coreano
const ko = {
  translation: {
    // Navigation
    carte: "지도",
    liste: "목록", 
    flash: "플래시",
    profil: "프로필",
    argent: "돈",
    
    // Filters
    filtros: "필터:",
    restaurants: "레스토랑",
    bars: "바",
    shops: "상점",
    
    // Offers
    offres: "제안",
    offresFlash: "플래시 제안",
    offresLimitees: "놀라운 할인과 함께하는 한정 제안! 놓치지 마세요!",
    tempsRestant: "남은 시간:",
    voirOffre: "제안 보기",
    activer: "지금 활성화",
    glisserPourActiver: "← 활성화하려면 스와이프",
    activee: "✅ 활성화됨!",
    
    // Subscription
    abonnementExpire: "구독이 만료되었습니다. 모든 제안에 액세스하려면 구독하세요.",
    periodeEssai: "평판 기간 활성",
    joursRestants: "일 남음",
    sabonnerMaintenant: "지금 구독",
    
    // Profile
    offresUtilisees: "사용된 제안",
    totalEpargne: "총 절약",
    points: "포인트",
    niveau: "레벨",
    
    // Money
    historiqueTransactions: "거래 내역",
    exporterCSV: "CSV 내보내기",
    
    // General
    bienvenue: "환영합니다",
    connexion: "로그인",
    inscription: "회원가입",
    deconnexion: "로그아웃",
    email: "이메일",
    motDePasse: "비밀번호",
    confirmerMotDePasse: "비밀번호 확인",
    nom: "이름",
    prenom: "이름",
    seConnecter: "로그인",
    sinscrire: "회원가입",
    motDePasseOublie: "비밀번호를 잊으셨나요?",
    pasDeCompte: "계정이 없으신가요?",
    dejaUnCompte: "이미 계정이 있으신가요?",
    fermer: "닫기",
    sauvegarder: "저장",
    annuler: "취소",
    oui: "예",
    non: "아니오",
    erreur: "오류",
    succes: "성공",
    chargement: "로딩 중...",
    valider: "확인",
    
    // Subscription modal
    gestionAbonnement: "구독 관리",
    activerAbonnement: "구독 활성화",
    abonnementActif: "활성 구독",
    planMensuel: "월간 플랜",
    planAnnuel: "연간 플랜",
    accesComplet: "전체 앱 액세스",
    offresIllimitees: "무제한 혜택",
    supportPrioritaire: "우선 지원",
    deuxMoisGratuits: "2개월 무료",
    
    // Personal information
    informationsPersonnelles: "개인 정보",
    modifier: "수정",
    ville: "도시",
    dernieresOffresActivees: "최근 활성화된 혜택",
    tableauBordFinancier: "금융 대시보드",
    resumeFinancier: "금융 요약",
    totalEconomise: "총 절약액",
    abonnement: "구독",
    actif: "활성",
    inactif: "비활성",
    annulerAbonnement: "구독 취소",
    confirmerAnnulation: "취소 확인",
    messageAnnulation: "구독을 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    abonnementAnnule: "구독이 성공적으로 취소되었습니다",
    erreurAnnulation: "구독 취소 중 오류"
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr,
      en,
      ko
    },
    fallbackLng: 'fr',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;