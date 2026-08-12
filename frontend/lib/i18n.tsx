import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type Language = 'en' | 'fr' | 'rw';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
  rw: 'Ikinyarwanda',
};

// A deliberately small, flat translation dictionary covering the shared UI
// chrome (navigation, top bar, common actions, page headers). Mock document
// content (bills, chat answers, comparative notes) stays in its source
// language, as it would in a real system backed by a multilingual corpus.
const dictionary: Record<Language, Record<string, string>> = {
  en: {
    'app.name': 'Parliament AI System',
    'app.shortName': 'Legislative Intelligence',
    'app.tagline': 'AI assistant for the Parliament of Rwanda knowledge base',
    'app.partner': 'MINICT / RISA: Technology Partner',
    'app.demoNotice': 'Laws in force are real, scraped from amategeko.gov.rw. Draft bills are illustrative samples; AI findings and audit entries are generated live from the real corpus.',

    'nav.dashboard': 'Dashboard',
    'nav.assistant': 'Research & Drafting Assistant',
    'nav.duplication': 'Duplication Detection',
    'nav.gaps': 'Gap & Intent Alignment',
    'nav.comparative': 'Comparative Legislation',
    'nav.audit': 'Audit Trail',

    'topbar.search': 'Search laws, bills, articles...',
    'topbar.language': 'Language',
    'topbar.signOut': 'Sign out',
    'topbar.settings': 'Settings',
    'topbar.notifications': 'Notifications',

    'common.accept': 'Accept',
    'common.reject': 'Reject',
    'common.comment': 'Comment',
    'common.addComment': 'Add comment',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.viewSource': 'View source',
    'common.send': 'Send',
    'common.loading': 'Thinking...',
    'common.pending': 'Pending',
    'common.accepted': 'Accepted',
    'common.rejected': 'Rejected',
    'common.critical': 'Critical',
    'common.moderate': 'Moderate',
    'common.minor': 'Minor',
    'common.selectBill': 'Select a bill',
    'common.status': 'Status',
    'common.stage': 'Stage',
    'common.lastUpdated': 'Last updated',
    'common.openModule': 'Open',
    'common.viewOnly': 'View only for your role',
    'common.humanInLoop': 'Human review required. No bill text is changed automatically.',
    'common.readMore': 'Read more',

    'login.title': 'Sign in to the Parliament AI System',
    'login.subtitle': 'Select your role to continue with a mock institutional session.',
    'login.continue': 'Continue',
    'login.selectedRole': 'Signing in as',
    'login.signingIn': 'Signing in...',

    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Overview of drafting activity and AI-flagged review items',
    'dashboard.billsInProgress': 'Bills in progress',
    'dashboard.pendingIssues': 'Pending AI-flagged issues',
    'dashboard.duplicationFlags': 'Duplication flags',
    'dashboard.auditEventsToday': 'Audit events (7 days)',
    'dashboard.recentBills': 'Recent bills in progress',
    'dashboard.needsReview': 'Needs your review',
    'dashboard.quickLinks': 'Modules',
    'dashboard.issuesBySeverity': 'Pending issues by severity',
    'dashboard.welcome': 'Welcome back',

    'assistant.title': 'Research & Drafting Assistant',
    'assistant.subtitle': 'Chat over the parliamentary knowledge base: laws, Hansard, committee reports and draft bills',
    'assistant.knowledgeBase': 'Knowledge base',
    'assistant.inputPlaceholder': 'Ask about a law, article, or request a draft...',
    'assistant.sources': 'Sources',
    'assistant.scope': 'Grounded in',
    'assistant.documentsSelected': 'documents selected',
    'assistant.suggestedPrompts': 'Try asking',

    'duplication.title': 'Duplication Detection',
    'duplication.subtitle': 'Overlapping, contradictory or repeated provisions across laws and draft bills',
    'duplication.selectBillLabel': 'Draft bill',
    'duplication.overlaps': 'Detected overlaps',
    'duplication.similarity': 'Similarity',
    'duplication.compare': 'Side-by-side comparison',
    'duplication.draftClause': 'Draft bill clause',
    'duplication.matchedClause': 'Matched source clause',
    'duplication.markReviewed': 'Mark reviewed',
    'duplication.flagForRevision': 'Flag for revision',
    'duplication.selectOverlap': 'Select an overlap to compare clauses side by side.',

    'gaps.title': 'Gap, Inconsistency & Intent Alignment',
    'gaps.subtitle': 'Annotated bill text with AI-flagged issues awaiting human review',
    'gaps.issues': 'Flagged issues',
    'gaps.suggestedFix': 'Suggested fix',
    'gaps.selectBillLabel': 'Bill under review',
    'gaps.billText': 'Bill text',

    'comparative.title': 'Comparative Legislation',
    'comparative.subtitle': 'Benchmark a bill against equivalent provisions in other countries',
    'comparative.topic': 'Topic',
    'comparative.takeaway': 'AI-generated takeaway',
    'comparative.takeawayNote': 'Generated summary. Verify against primary sources before citing.',
    'comparative.relatedBill': 'Related bill',

    'audit.title': 'Audit Trail',
    'audit.subtitle': 'Log of AI suggestions shown, accepted, rejected and commented on',
    'audit.actor': 'User',
    'audit.module': 'Module',
    'audit.action': 'Action',
    'audit.timestamp': 'Time',
    'audit.target': 'Target',
    'audit.filterAll': 'All modules',
  },

  fr: {
    'app.name': "Système d'IA du Parlement",
    'app.shortName': 'Intelligence législative',
    'app.tagline': "Assistant IA pour la base de connaissances du Parlement du Rwanda",
    'app.partner': 'MINICT / RISA : Partenaire technologique',
    'app.demoNotice': "Les lois en vigueur sont réelles, extraites de amategeko.gov.rw. Les projets de loi sont des exemples illustratifs ; les constats de l'IA et les journaux d'audit sont générés en direct à partir du corpus réel.",

    'nav.dashboard': 'Tableau de bord',
    'nav.assistant': 'Assistant de recherche et de rédaction',
    'nav.duplication': 'Détection des doublons',
    'nav.gaps': "Lacunes et alignement",
    'nav.comparative': 'Législation comparée',
    'nav.audit': "Journal d'audit",

    'topbar.search': 'Rechercher des lois, projets, articles...',
    'topbar.language': 'Langue',
    'topbar.signOut': 'Se déconnecter',
    'topbar.settings': 'Paramètres',
    'topbar.notifications': 'Notifications',

    'common.accept': 'Accepter',
    'common.reject': 'Rejeter',
    'common.comment': 'Commenter',
    'common.addComment': 'Ajouter un commentaire',
    'common.cancel': 'Annuler',
    'common.submit': 'Soumettre',
    'common.viewSource': 'Voir la source',
    'common.send': 'Envoyer',
    'common.loading': 'Réflexion en cours...',
    'common.pending': 'En attente',
    'common.accepted': 'Accepté',
    'common.rejected': 'Rejeté',
    'common.critical': 'Critique',
    'common.moderate': 'Modéré',
    'common.minor': 'Mineur',
    'common.selectBill': 'Sélectionner un projet de loi',
    'common.status': 'Statut',
    'common.stage': 'Étape',
    'common.lastUpdated': 'Dernière mise à jour',
    'common.openModule': 'Ouvrir',
    'common.viewOnly': 'Lecture seule pour votre rôle',
    'common.humanInLoop': "Une revue humaine est requise. Aucun texte de loi n'est modifié automatiquement.",
    'common.readMore': 'Lire la suite',

    'login.title': "Connexion au système d'IA du Parlement",
    'login.subtitle': 'Sélectionnez votre rôle pour continuer avec une session institutionnelle simulée.',
    'login.continue': 'Continuer',
    'login.selectedRole': 'Connexion en tant que',
    'login.signingIn': 'Connexion en cours...',

    'dashboard.title': 'Tableau de bord',
    'dashboard.subtitle': "Aperçu de l'activité de rédaction et des éléments signalés par l'IA",
    'dashboard.billsInProgress': 'Projets de loi en cours',
    'dashboard.pendingIssues': "Problèmes signalés par l'IA en attente",
    'dashboard.duplicationFlags': 'Signalements de doublons',
    'dashboard.auditEventsToday': "Événements d'audit (7 jours)",
    'dashboard.recentBills': 'Projets de loi récents en cours',
    'dashboard.needsReview': 'Nécessite votre révision',
    'dashboard.quickLinks': 'Modules',
    'dashboard.issuesBySeverity': 'Problèmes en attente par gravité',
    'dashboard.welcome': 'Bon retour',

    'assistant.title': 'Assistant de recherche et de rédaction',
    'assistant.subtitle': 'Discutez avec la base de connaissances : lois, Hansard, rapports de commissions et projets de loi',
    'assistant.knowledgeBase': 'Base de connaissances',
    'assistant.inputPlaceholder': 'Posez une question sur une loi, un article, ou demandez une rédaction...',
    'assistant.sources': 'Sources',
    'assistant.scope': 'Fondé sur',
    'assistant.documentsSelected': 'documents sélectionnés',
    'assistant.suggestedPrompts': 'Essayez de demander',

    'duplication.title': 'Détection des doublons',
    'duplication.subtitle': 'Dispositions qui se chevauchent, se contredisent ou se répètent entre lois et projets de loi',
    'duplication.selectBillLabel': 'Projet de loi',
    'duplication.overlaps': 'Chevauchements détectés',
    'duplication.similarity': 'Similarité',
    'duplication.compare': 'Comparaison côte à côte',
    'duplication.draftClause': 'Clause du projet de loi',
    'duplication.matchedClause': 'Clause source correspondante',
    'duplication.markReviewed': 'Marquer comme révisé',
    'duplication.flagForRevision': 'Signaler pour révision',
    'duplication.selectOverlap': 'Sélectionnez un chevauchement pour comparer les clauses côte à côte.',

    'gaps.title': "Lacunes, incohérences et alignement de l'intention",
    'gaps.subtitle': "Texte du projet annoté avec les problèmes signalés par l'IA, en attente de révision humaine",
    'gaps.issues': 'Problèmes signalés',
    'gaps.suggestedFix': 'Correction suggérée',
    'gaps.selectBillLabel': 'Projet en cours de révision',
    'gaps.billText': 'Texte du projet',

    'comparative.title': 'Législation comparée',
    'comparative.subtitle': "Comparer un projet de loi à des dispositions équivalentes d'autres pays",
    'comparative.topic': 'Sujet',
    'comparative.takeaway': "Synthèse générée par l'IA",
    'comparative.takeawayNote': 'Résumé généré. À vérifier auprès des sources primaires avant citation.',
    'comparative.relatedBill': 'Projet de loi associé',

    'audit.title': "Journal d'audit",
    'audit.subtitle': "Journal des suggestions de l'IA affichées, acceptées, rejetées et commentées",
    'audit.actor': 'Utilisateur',
    'audit.module': 'Module',
    'audit.action': 'Action',
    'audit.timestamp': 'Horodatage',
    'audit.target': 'Cible',
    'audit.filterAll': 'Tous les modules',
  },

  rw: {
    'app.name': "Sisitemu ya AI y'Inteko Ishinga Amategeko",
    'app.shortName': 'Ubwenge mu Mategeko',
    'app.tagline': "Umufasha wa AI ku bubiko bw'inyandiko z'Inteko Ishinga Amategeko ya Rwanda",
    'app.partner': "MINICT / RISA: Ufatanyabikorwa mu ikoranabuhanga",
    'app.demoNotice': "Amategeko akurikizwa ni ay'ukuri, akuwe kuri amategeko.gov.rw. Imishinga y'amategeko ni ingero; ibyagaragajwe na AI n'urutonde rw'ibikorwa bikorwa mu buryo butaziguye bishingiye ku byegeranyo nyakuri.",

    'nav.dashboard': 'Imbonerahamwe',
    'nav.assistant': "Umufasha w'Ubushakashatsi n'Kwandika",
    'nav.duplication': 'Kumenya Gusubiramo',
    'nav.gaps': "Icyuho n'Ihuzagurika",
    'nav.comparative': 'Amategeko Agereranywa',
    'nav.audit': "Urutonde rw'Ibikorwa",

    'topbar.search': "Shakisha amategeko, imishinga, ingingo...",
    'topbar.language': 'Ururimi',
    'topbar.signOut': 'Sohoka',
    'topbar.settings': 'Igenamiterere',
    'topbar.notifications': 'Amakuru mashya',

    'common.accept': 'Kwemeza',
    'common.reject': 'Kwanga',
    'common.comment': 'Igitekerezo',
    'common.addComment': 'Ongeraho igitekerezo',
    'common.cancel': 'Hagarika',
    'common.submit': 'Ohereza',
    'common.viewSource': 'Reba inkomoko',
    'common.send': 'Ohereza',
    'common.loading': 'Biratekerezwa...',
    'common.pending': 'Bitegereje',
    'common.accepted': 'Byemejwe',
    'common.rejected': 'Byanzwe',
    'common.critical': 'Byihutirwa',
    'common.moderate': 'Bigereranije',
    'common.minor': 'Bito',
    'common.selectBill': "Hitamo umushinga w'itegeko",
    'common.status': 'Uko bihagaze',
    'common.stage': 'Icyiciro',
    'common.lastUpdated': 'Vuba aha byahinduwe',
    'common.openModule': 'Fungura',
    'common.viewOnly': 'Kureba gusa kubijyanye n\'uruhare rwawe',
    'common.humanInLoop': "Isuzuma ry'umuntu rirakenewe. Nta nyandiko y'itegeko ihinduka ku bwayo.",
    'common.readMore': 'Soma birambuye',

    'login.title': "Injira muri Sisitemu ya AI y'Inteko Ishinga Amategeko",
    'login.subtitle': "Hitamo uruhare rwawe kugira ngo ukomeze n'umukoro w'igerageza.",
    'login.continue': 'Komeza',
    'login.selectedRole': 'Winjira nka',
    'login.signingIn': 'Kwinjira birimo gukorwa...',

    'dashboard.title': 'Imbonerahamwe',
    'dashboard.subtitle': "Incamake y'imirimo yo kwandika n'ibibazo AI yagaragaje",
    'dashboard.billsInProgress': "Imishinga y'amategeko iri gukorwaho",
    'dashboard.pendingIssues': "Ibibazo AI yagaragaje bitegereje isuzuma",
    'dashboard.duplicationFlags': 'Ibimenyetso byo gusubiramo',
    'dashboard.auditEventsToday': "Ibikorwa (iminsi 7 ishize)",
    'dashboard.recentBills': "Imishinga ya vuba iri gukorwaho",
    'dashboard.needsReview': 'Bikeneye isuzuma ryawe',
    'dashboard.quickLinks': "Ibice by'ingenzi",
    'dashboard.issuesBySeverity': "Ibibazo bitegereje bishyizwe mu byiciro",
    'dashboard.welcome': 'Murakaza neza',

    'assistant.title': "Umufasha w'Ubushakashatsi n'Kwandika",
    'assistant.subtitle': "Ganira n'ububiko bw'inyandiko: amategeko, raporo za Kominisiyo n'imishinga y'amategeko",
    'assistant.knowledgeBase': "Ububiko bw'inyandiko",
    'assistant.inputPlaceholder': "Baza ku itegeko, ingingo, cyangwa usabe umushinga w'inyandiko...",
    'assistant.sources': 'Inkomoko',
    'assistant.scope': 'Bishingiye kuri',
    'assistant.documentsSelected': 'inyandiko zatoranyijwe',
    'assistant.suggestedPrompts': 'Gerageza kubaza',

    'duplication.title': 'Kumenya Gusubiramo',
    'duplication.subtitle': "Ingingo zisubiramo, zinyuranyije cyangwa zisa n'izindi mu mategeko n'imishinga",
    'duplication.selectBillLabel': "Umushinga w'itegeko",
    'duplication.overlaps': 'Gusubiramo byagaragaye',
    'duplication.similarity': 'Ugupfa',
    'duplication.compare': 'Ugereranya bwite',
    'duplication.draftClause': "Ingingo y'umushinga",
    'duplication.matchedClause': "Ingingo y'inkomoko ihuye",
    'duplication.markReviewed': 'Shyiraho ko byasuzumwe',
    'duplication.flagForRevision': 'Menyekanisha ko bikeneye gusubirwamo',
    'duplication.selectOverlap': "Hitamo aho hasa kugira ngo ugereranye ingingo.",

    'gaps.title': "Icyuho, Ihuzagurika n'Intego",
    'gaps.subtitle': "Umwandiko w'umushinga urimo utuzahurwa n'ibibazo AI yagaragaje, bitegereje isuzuma ry'umuntu",
    'gaps.issues': 'Ibibazo byagaragajwe',
    'gaps.suggestedFix': 'Icyifuzo cyo gukosora',
    'gaps.selectBillLabel': 'Umushinga urimo gusuzumwa',
    'gaps.billText': "Umwandiko w'umushinga",

    'comparative.title': 'Amategeko Agereranywa',
    'comparative.subtitle': "Kugereranya umushinga n'ingingo zisa muri ibindi bihugu",
    'comparative.topic': 'Ingingo',
    'comparative.takeaway': 'Incamake ya AI',
    'comparative.takeawayNote': "Incamake yakozwe na AI. Genzura mu nkomoko nyayo mbere yo kuyikoresha.",
    'comparative.relatedBill': "Umushinga uhuriye na yo",

    'audit.title': "Urutonde rw'Ibikorwa",
    'audit.subtitle': "Urutonde rw'ibyagaragajwe na AI, byemejwe, byanzwe cyangwa byasobanuwe",
    'audit.actor': 'Ukoresha',
    'audit.module': 'Igice',
    'audit.action': 'Igikorwa',
    'audit.timestamp': 'Igihe',
    'audit.target': 'Icyagenderwaho',
    'audit.filterAll': 'Ibice byose',
  },
};

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'pai-lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored && dictionary[stored]) {
        setLangState(stored);
      }
    } catch {
      // localStorage unavailable - fall back to default language.
    }
  }, []);

  const setLang = (next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore persistence failures in restrictive environments
    }
  };

  const t = useMemo(() => {
    return (key: string): string => dictionary[lang][key] ?? dictionary.en[key] ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
