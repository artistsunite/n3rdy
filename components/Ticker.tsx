'use client';

const items = [
  { label: 'S&P 500', value: '5,821', change: '+0.34%', up: true },
  { label: 'NASDAQ', value: '19,247', change: '+0.51%', up: true },
  { label: 'BTC/USD', value: '63,420', change: '-1.2%', up: false },
  { label: 'ETH/USD', value: '3,248', change: '-0.8%', up: false },
  { label: 'WTI OIL', value: '87.14', change: '+0.9%', up: true },
  { label: 'GOLD', value: '2,387', change: '+0.4%', up: true },
  { label: 'DXY', value: '104.82', change: '+0.2%', up: true },
  { label: 'AUD/USD', value: '0.6441', change: '-0.3%', up: false },
  { label: '10Y UST', value: '4.52%', change: '+2bp', up: false },
  { label: 'VIX', value: '18.4', change: '+1.1', up: false },
  { label: 'BRENT', value: '91.23', change: '+1.1%', up: true },
  { label: 'SILVER', value: '28.74', change: '+0.6%', up: true },
  { label: 'USD/JPY', value: '157.4', change: '+0.2%', up: true },
  { label: 'EUR/USD', value: '1.0742', change: '-0.1%', up: false },
];

// Double for seamless loop
const doubled = [...items, ...items];

export default function Ticker() {
  return (
    <div className="w-full overflow-hidden bg-n3-card/60 border-y border-n3-border/50 backdrop-blur-sm">
      <div className="ticker-track py-2.5">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-3 mx-6 whitespace-nowrap flex-shrink-0">
            <span className="text-[11px] font-mono font-medium text-n3-muted tracking-wider">
              {item.label}
            </span>
            <span className="text-[12px] font-mono font-semibold text-n3-text">
              {item.value}
            </span>
            <span
              className={`text-[11px] font-mono font-medium ${
                item.up ? 'text-n3-success' : 'text-n3-danger'
              }`}
            >
              {item.up ? '▲' : '▼'} {item.change}
            </span>
            <span className="text-n3-border text-xs select-none ml-2">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}
