import { Queue, Worker, Job } from 'bullmq';

export type IngestJobData = { sourceId: string };
export type AnalyzeJobData = { articleId: string };
export type BriefingJobData = { userId: string; type?: string };
export type CompetitorScanJobData = { competitorId: string; userId: string };

function getConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL environment variable is not set');
  // Parse redis[s]://[:password@]host:port[/db] for BullMQ ConnectionOptions
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379'),
    password: parsed.password || undefined,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
    maxRetriesPerRequest: null as null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeQueue(name: string, attempts = 3): Queue<any, any, string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Queue<any, any, string>(name, {
    connection: getConnection(),
    defaultJobOptions: { attempts, backoff: { type: 'exponential', delay: 5000 } },
  });
}

let _ingestQueue: ReturnType<typeof makeQueue> | null = null;
let _analyzeQueue: ReturnType<typeof makeQueue> | null = null;
let _briefingQueue: ReturnType<typeof makeQueue> | null = null;
let _competitorScanQueue: ReturnType<typeof makeQueue> | null = null;

export function getIngestQueue() {
  if (!_ingestQueue) _ingestQueue = makeQueue('ingest', 3);
  return _ingestQueue;
}

export function getAnalyzeQueue() {
  if (!_analyzeQueue) _analyzeQueue = makeQueue('analyze', 2);
  return _analyzeQueue;
}

export function getBriefingQueue() {
  if (!_briefingQueue) _briefingQueue = makeQueue('briefing', 2);
  return _briefingQueue;
}

export function getCompetitorScanQueue() {
  if (!_competitorScanQueue) _competitorScanQueue = makeQueue('competitor-scan', 2);
  return _competitorScanQueue;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createWorker<T = any>(
  queueName: string,
  processor: (job: Job<T>) => Promise<void>
): Worker<T> {
  return new Worker<T>(queueName, processor, {
    connection: getConnection(),
    concurrency: 5,
  });
}
