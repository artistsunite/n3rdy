import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

/** Strip BOM and non-printable chars — Secret Manager prepends U+FEFF on some values */
function cleanEnv(value: string | undefined): string {
  if (!value) return '';
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i);
    if (c >= 32 && c <= 126) out += value[i];
  }
  return out;
}

function getAdminApp(): App {
  if (!app) {
    if (getApps().length === 0) {
      const projectId = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
      app = projectId ? initializeApp({ projectId }) : initializeApp();
    } else {
      app = getApps()[0];
    }
  }
  return app;
}

export function adminDb(): Firestore {
  if (!db) {
    getAdminApp();
    db = getFirestore();
  }
  return db;
}

export interface BotConfig {
  isActive: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  intervalMinutes: number;
  topicWeights: {
    crypto: number;
    equities: number;
    macro: number;
    geopolitics: number;
    commodities: number;
  };
  enabledSources: string[];
  lastBriefingAt: string | null;
  nextBriefingAt: string | null;
}

export const DEFAULT_BOT_CONFIG: BotConfig = {
  isActive: false,
  telegramBotToken: '',
  telegramChatId: '',
  intervalMinutes: 60,
  topicWeights: { crypto: 1.0, equities: 1.0, macro: 1.0, geopolitics: 1.0, commodities: 1.0 },
  enabledSources: ['rss', 'newsapi', 'reddit'],
  lastBriefingAt: null,
  nextBriefingAt: null,
};

export async function getUserBotConfig(uid: string): Promise<BotConfig> {
  const doc = await adminDb().collection('users').doc(uid).get();
  if (!doc.exists) return { ...DEFAULT_BOT_CONFIG };
  const data = doc.data() || {};
  const cfg = data.botConfig || {};
  // Convert Firestore Timestamps to ISO strings
  return {
    ...DEFAULT_BOT_CONFIG,
    ...cfg,
    lastBriefingAt: cfg.lastBriefingAt?.toDate?.()?.toISOString() ?? cfg.lastBriefingAt ?? null,
    nextBriefingAt: cfg.nextBriefingAt?.toDate?.()?.toISOString() ?? cfg.nextBriefingAt ?? null,
  };
}

export async function saveUserBotConfig(uid: string, config: Partial<BotConfig>): Promise<void> {
  // Never persist lastBriefingAt/nextBriefingAt from client — bot manages those
  const { lastBriefingAt, nextBriefingAt, ...safe } = config;
  await adminDb().collection('users').doc(uid).set({ botConfig: safe }, { merge: true });
}
