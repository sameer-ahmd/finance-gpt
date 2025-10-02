'use client';

interface MetricTileProps {
  label: string;
  value: string | number | undefined;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'currency' | 'percent' | 'number' | 'text';
}

export function MetricTile({
  label,
  value,
  subtitle,
  trend,
  format = 'text'
}: MetricTileProps) {
  // Format the value based on type
  const formatValue = (val: string | number | undefined): string => {
    if (val === undefined || val === null || val === 'N/A') return 'N/A';

    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        // Format large numbers as K, M, B
        if (Math.abs(val) >= 1e9) {
          return `$${(val / 1e9).toFixed(2)}B`;
        } else if (Math.abs(val) >= 1e6) {
          return `$${(val / 1e6).toFixed(2)}M`;
        } else if (Math.abs(val) >= 1e3) {
          return `$${(val / 1e3).toFixed(2)}K`;
        }
        return `$${val.toFixed(2)}`;

      case 'percent':
        return `${(val * 100).toFixed(2)}%`;

      case 'number':
        if (Math.abs(val) >= 1e9) {
          return `${(val / 1e9).toFixed(2)}B`;
        } else if (Math.abs(val) >= 1e6) {
          return `${(val / 1e6).toFixed(2)}M`;
        } else if (Math.abs(val) >= 1e3) {
          return `${(val / 1e3).toFixed(2)}K`;
        }
        return val.toLocaleString('en-US', { maximumFractionDigits: 2 });

      default:
        return String(val);
    }
  };

  // Get trend indicator
  const getTrendIcon = () => {
    if (!trend || trend === 'neutral') return null;

    if (trend === 'up') {
      return <span className="text-green-600">↑</span>;
    }
    return <span className="text-red-600">↓</span>;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-semibold text-gray-900">
          {formatValue(value)}
        </div>
        {getTrendIcon()}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-600 mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
}
