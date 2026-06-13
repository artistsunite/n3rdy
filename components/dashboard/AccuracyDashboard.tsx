'use client';

import { RadialBarChart, RadialBar, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface AccuracyRow {
  id: string;
  userId: string;
  targetType: string;
  confidenceBucket: string;
  totalPredictions: number;
  correct: number;
  hitRate: number | null;
}

interface Props {
  accuracy: AccuracyRow[];
  totalPredictions: number;
  correctPredictions: number;
  streak: number;
}

const TYPE_COLORS: Record<string, string> = {
  ASSET: '#6366f1',
  SECTOR: '#22d3ee',
  COMPANY: '#a3e635',
  KEYWORD: '#f59e0b',
  INDUSTRY: '#ec4899',
};

function colorForRate(rate: number): string {
  if (rate >= 0.65) return '#22c55e';
  if (rate >= 0.50) return '#f59e0b';
  return '#ef4444';
}

export default function AccuracyDashboard({ accuracy, totalPredictions, correctPredictions, streak }: Props) {
  const overallRate = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
  const pct = Math.round(overallRate * 100);

  // Gauge data
  const gaugeData = [{ name: 'accuracy', value: pct, fill: colorForRate(overallRate) }];

  // Per-type accuracy bars
  const byType: Record<string, { total: number; correct: number }> = {};
  for (const row of accuracy) {
    if (!byType[row.targetType]) byType[row.targetType] = { total: 0, correct: 0 };
    byType[row.targetType].total += row.totalPredictions;
    byType[row.targetType].correct += row.correct;
  }
  const typeData = Object.entries(byType).map(([type, s]) => ({
    type,
    rate: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    total: s.total,
  }));

  // Calibration curve: predicted confidence bucket vs actual hit rate
  const calibBuckets = ['0.5', '0.6', '0.7', '0.8', '0.9'];
  const calibData = calibBuckets.map(bucket => {
    const rows = accuracy.filter(r => r.confidenceBucket === bucket);
    const total = rows.reduce((s, r) => s + r.totalPredictions, 0);
    const correct = rows.reduce((s, r) => s + r.correct, 0);
    return {
      confidence: `${Math.round(parseFloat(bucket) * 100)}%`,
      actual: total >= 2 ? Math.round((correct / total) * 100) : null,
      perfect: Math.round(parseFloat(bucket) * 100),
    };
  });

  const hasCalibData = calibData.some(d => d.actual !== null);

  if (totalPredictions === 0) {
    return (
      <div className="liquid-glass-card rounded-xl p-5 text-center">
        <p className="text-sm text-white/50">No predictions yet.</p>
        <p className="text-xs text-white/30 mt-1">Generate predictions to start tracking accuracy.</p>
      </div>
    );
  }

  return (
    <div className="liquid-glass-card rounded-xl p-5 space-y-5">
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Accuracy Dashboard</h3>

      {/* Overall gauge */}
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: 120, height: 70 }}>
          <RadialBarChart
            width={120} height={120}
            cx={60} cy={80}
            innerRadius={45} outerRadius={65}
            startAngle={180} endAngle={0}
            data={gaugeData}
          >
            <RadialBar dataKey="value" maxBarSize={20} background={{ fill: 'rgba(255,255,255,0.05)' }} />
          </RadialBarChart>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="text-2xl font-bold" style={{ color: colorForRate(overallRate) }}>{pct}%</span>
          </div>
        </div>
        <p className="text-xs text-white/50 mt-1">{correctPredictions}/{totalPredictions} correct</p>
        {streak !== 0 && (
          <p className="text-xs mt-1" style={{ color: streak > 0 ? '#22c55e' : '#ef4444' }}>
            {streak > 0 ? `🔥 ${streak} correct streak` : `📉 Last ${Math.abs(streak)} incorrect`}
          </p>
        )}
      </div>

      {/* Per-type accuracy bars */}
      {typeData.length > 0 && (
        <div>
          <p className="text-xs text-white/50 mb-2">By type</p>
          <div className="space-y-2">
            {typeData.map(d => (
              <div key={d.type} className="flex items-center gap-2">
                <span className="text-xs text-white/50 w-16 flex-shrink-0">{d.type}</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${d.rate}%`, backgroundColor: colorForRate(d.rate / 100) }} />
                </div>
                <span className="text-xs font-medium" style={{ color: colorForRate(d.rate / 100), width: 32, textAlign: 'right' }}>{d.rate}%</span>
                <span className="text-xs text-white/25">({d.total})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calibration curve */}
      {hasCalibData && (
        <div>
          <p className="text-xs text-white/50 mb-2">Calibration</p>
          <p className="text-xs text-white/30 mb-2">Predicted confidence vs actual hit rate. Perfect = diagonal.</p>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={calibData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="confidence" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: unknown, name: unknown) => [`${v}%`, name === 'actual' ? 'Actual hit rate' : 'Perfect calibration'] as [string, string]}
              />
              <Line type="linear" dataKey="perfect" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" dot={false} strokeWidth={1} />
              <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
