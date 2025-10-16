'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface DataPoint {
  label: string;
  value: number;
  unit?: string;
  context?: string;
  source_authors?: string;
}

interface DataComparisonChartProps {
  title: string;
  dataPoints: DataPoint[];
  index?: number;
}

const GRADIENT_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#10b981', // green
  '#f59e0b', // orange
  '#ef4444', // red
];

export function DataComparisonChart({
  title,
  dataPoints,
  index = 0,
}: DataComparisonChartProps) {
  const delay = index * 0.1;

  // Prepare data for bar chart
  const chartData = dataPoints.map((dp, i) => ({
    name: dp.label.length > 20 ? dp.label.substring(0, 20) + '...' : dp.label,
    value: dp.value,
    fullName: dp.label,
    unit: dp.unit || '',
    context: dp.context || '',
    color: GRADIENT_COLORS[i % GRADIENT_COLORS.length],
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg border border-slate-700">
          <p className="font-semibold text-sm mb-1">{data.fullName}</p>
          <p className="text-2xl font-bold text-blue-400">
            {data.value}
            <span className="text-sm ml-1">{data.unit}</span>
          </p>
          {data.context && (
            <p className="text-xs text-slate-300 mt-2 max-w-xs">
              {data.context}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.2 },
      }}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: delay + 0.2, duration: 0.5 }}
            >
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              {dataPoints.length} metrics
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.4 }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <defs>
                  {chartData.map((entry, i) => (
                    <linearGradient
                      key={i}
                      id={`gradient-bar-${i}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  radius={[8, 8, 0, 0]}
                  animationBegin={delay * 1000}
                  animationDuration={1200}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#gradient-bar-${index})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Summary */}
          <motion.div
            className="mt-4 pt-4 border-t flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.6 }}
          >
            {chartData.map((dp, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-xs"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dp.color }}
                />
                <span className="text-muted-foreground">{dp.name}</span>
                <span className="font-semibold">
                  {dp.value}
                  {dp.unit}
                </span>
              </div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
