import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// One-shot migration endpoint — protected by CRON_SECRET
// Call once after initial deploy: GET /api/admin/migrate?secret=<CRON_SECRET>
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  // Strip UTF-8 BOM (U+FEFF) that GCP Secret Manager injects, then trim whitespace
  const rawSecret = process.env.CRON_SECRET ?? '';
  const cronSecret = (rawSecret.charCodeAt(0) === 0xFEFF ? rawSecret.slice(1) : rawSecret).trim();

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cwd = process.cwd();

    // In Next.js standalone output the .bin symlinks are absent; run the JS entry directly
    const candidates = [
      path.join(cwd, 'node_modules', 'prisma', 'build', 'index.js'),
      path.join(cwd, 'node_modules', '.bin', 'prisma'),
      path.join('/workspace', 'node_modules', 'prisma', 'build', 'index.js'),
      path.join('/workspace', 'node_modules', '.bin', 'prisma'),
    ];

    const prismaBin = candidates.find((p) => fs.existsSync(p));
    if (!prismaBin) {
      return NextResponse.json({ ok: false, error: 'prisma binary not found', candidates }, { status: 500 });
    }

    const cmd = prismaBin.endsWith('.js')
      ? `node "${prismaBin}" migrate deploy`
      : `"${prismaBin}" migrate deploy`;

    const output = execSync(cmd, {
      cwd,
      env: { ...process.env },
      encoding: 'utf8',
      timeout: 60000,
    });

    return NextResponse.json({ ok: true, output, prismaBin });
  } catch (err) {
    const error = err as { message: string; stdout?: string; stderr?: string };
    return NextResponse.json({
      ok: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
    }, { status: 500 });
  }
}
