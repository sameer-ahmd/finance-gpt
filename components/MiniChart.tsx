'use client';

interface DataPoint {
  date: string;
  value: number;
}

interface MiniChartProps {
  data: DataPoint[];
  label?: string;
  color?: 'blue' | 'green' | 'red' | 'gray';
  height?: number;
  showAxis?: boolean;
}

export function MiniChart({
  data,
  label,
  color = 'blue',
  height = 60,
  showAxis = false
}: MiniChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">No chart data available</div>
    );
  }

  // Calculate bounds
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Generate SVG path for sparkline
  const width = 200;
  const padding = 4;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
    const y = height - padding - ((d.value - minValue) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const pathData = `M ${points}`;

  // Color mapping
  const colorMap = {
    blue: 'stroke-blue-500 fill-blue-100',
    green: 'stroke-green-500 fill-green-100',
    red: 'stroke-red-500 fill-red-100',
    gray: 'stroke-gray-500 fill-gray-100',
  };

  const strokeColor = colorMap[color].split(' ')[0];
  const fillColor = colorMap[color].split(' ')[1];

  // Create area path for fill
  const areaPath = `${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  return (
    <div className="inline-block">
      {label && (
        <div className="text-xs font-medium text-gray-600 mb-1">{label}</div>
      )}
      <svg width={width} height={height} className="overflow-visible">
        {/* Area fill */}
        <path
          d={areaPath}
          className={fillColor}
          strokeWidth={0}
        />
        {/* Line */}
        <path
          d={pathData}
          className={strokeColor}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Optional axis */}
        {showAxis && (
          <>
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              className="stroke-gray-300"
              strokeWidth={1}
            />
            <text
              x={padding}
              y={height - padding + 12}
              className="text-xs fill-gray-500"
              fontSize="10"
            >
              {data[0]?.date}
            </text>
            <text
              x={width - padding}
              y={height - padding + 12}
              className="text-xs fill-gray-500"
              fontSize="10"
              textAnchor="end"
            >
              {data[data.length - 1]?.date}
            </text>
          </>
        )}
      </svg>
      {showAxis && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{minValue.toFixed(2)}</span>
          <span>{maxValue.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
