import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface TopStory {
  headline: string;
  summary: string;
  impact: string;
  sentiment: string;
  source: string;
}

interface BriefingContent {
  executiveSummary: string;
  topStories: TopStory[];
  marketImpactForecast: string;
  sentimentOverview: { overall: string; byCategory: Record<string, string> };
  riskSignals: string[];
  bullishDevelopments: string[];
  bearishDevelopments: string[];
  sevenDayOutlook: string;
  watchNext: string[];
}

const sentimentColor = (s: string) =>
  s === 'positive' || s === 'bullish' ? '#00FF88' : s === 'negative' || s === 'bearish' ? '#FF4D6D' : '#00E5FF';

export async function sendBriefingEmail(params: {
  toEmail: string;
  toName: string;
  briefing: BriefingContent;
}): Promise<void> {
  const { toEmail, toName, briefing } = params;
  const firstName = toName?.split(' ')[0] ?? 'there';
  const date = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const topStoriesHtml = briefing.topStories.slice(0, 3).map(s => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1a1a2e;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="background:${sentimentColor(s.sentiment)};color:#000;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;text-transform:uppercase;">${s.sentiment}</span>
          <span style="color:#00E5FF;font-size:10px;">${s.impact} IMPACT</span>
        </div>
        <div style="color:#ffffff;font-size:14px;font-weight:600;margin-bottom:4px;">${s.headline}</div>
        <div style="color:#888;font-size:12px;">${s.summary}</div>
        <div style="color:#555;font-size:11px;margin-top:4px;">— ${s.source}</div>
      </td>
    </tr>`).join('');

  const riskHtml = briefing.riskSignals.slice(0, 3).map(r =>
    `<li style="color:#FF4D6D;margin-bottom:4px;">⚠ ${r}</li>`).join('');

  const bullishHtml = briefing.bullishDevelopments.slice(0, 3).map(b =>
    `<li style="color:#00FF88;margin-bottom:4px;">↑ ${b}</li>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050816;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050816;">
    <tr><td align="center" style="padding:24px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0a0a1a,#0d1b2a);border:1px solid #00E5FF22;border-radius:12px 12px 0 0;padding:28px 32px;">
          <div style="color:#00E5FF;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">N3RDY INTELLIGENCE</div>
          <div style="color:#ffffff;font-size:22px;font-weight:700;margin-bottom:4px;">Good morning, ${firstName}</div>
          <div style="color:#888;font-size:13px;">${date}</div>
        </td></tr>

        <!-- Executive Summary -->
        <tr><td style="background:#0a0a1a;border-left:1px solid #00E5FF22;border-right:1px solid #00E5FF22;padding:24px 32px;">
          <div style="color:#00E5FF;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">EXECUTIVE SUMMARY</div>
          <div style="color:#cccccc;font-size:14px;line-height:1.7;">${briefing.executiveSummary}</div>
        </td></tr>

        <!-- Top Stories -->
        <tr><td style="background:#0a0a1a;border-left:1px solid #00E5FF22;border-right:1px solid #00E5FF22;padding:0 32px 24px;">
          <div style="color:#00E5FF;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">TOP STORIES</div>
          <table width="100%" cellpadding="0" cellspacing="0">${topStoriesHtml}</table>
        </td></tr>

        <!-- Risk & Opportunities -->
        <tr><td style="background:#0a0a1a;border-left:1px solid #00E5FF22;border-right:1px solid #00E5FF22;padding:0 32px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="vertical-align:top;padding-right:12px;">
                <div style="color:#FF4D6D;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">RISK SIGNALS</div>
                <ul style="margin:0;padding-left:0;list-style:none;">${riskHtml}</ul>
              </td>
              <td width="50%" style="vertical-align:top;padding-left:12px;">
                <div style="color:#00FF88;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">OPPORTUNITIES</div>
                <ul style="margin:0;padding-left:0;list-style:none;">${bullishHtml}</ul>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- 7-Day Outlook -->
        <tr><td style="background:#0d1b2a;border:1px solid #00E5FF22;border-radius:0 0 12px 12px;padding:24px 32px;">
          <div style="color:#00E5FF;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">7-DAY OUTLOOK</div>
          <div style="color:#cccccc;font-size:14px;line-height:1.7;margin-bottom:20px;">${briefing.sevenDayOutlook}</div>
          <div style="border-top:1px solid #1a1a2e;padding-top:16px;text-align:center;">
            <a href="https://n3rdy.info/dashboard" style="display:inline-block;background:#00E5FF;color:#000;font-size:12px;font-weight:700;padding:10px 24px;border-radius:999px;text-decoration:none;letter-spacing:1px;">VIEW FULL DASHBOARD →</a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 0;text-align:center;">
          <div style="color:#444;font-size:11px;">N3RDY Intelligence · <a href="https://n3rdy.info/dashboard/settings" style="color:#00E5FF;text-decoration:none;">Manage email preferences</a></div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const { error } = await resend.emails.send({
    from: 'N3RDY Intelligence <briefings@n3rdy.info>',
    to: toEmail,
    subject: `Your N3RDY Brief — ${date}`,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
