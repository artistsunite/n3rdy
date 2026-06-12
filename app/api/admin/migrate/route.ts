import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

// One-shot migration endpoint — protected by CRON_SECRET
// Call once after initial deploy: GET /api/admin/migrate?secret=<CRON_SECRET>
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cwd = process.cwd();
    const prismaBin = path.join(cwd, 'node_modules', '.bin', 'prisma');

    const output = execSync(`"${prismaBin}" migrate deploy`, {
      cwd,
      env: { ...process.env },
      encoding: 'utf8',
      timeout: 60000,
    });

    return NextResponse.json({ ok: true, output });
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
