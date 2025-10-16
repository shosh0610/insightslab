'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { TrendingUp, Activity, BarChart3 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPointChartProps {
  label: string;
  value: number;
  unit?: string;
  context?: string;
  sources?: string[];
  index?: number;
  visualizationType?: 'auto' | 'pie' | 'bar' | 'radial' | 'area' | 'stat';
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  gradient: ['#3b82f6', '#8b5cf6', '#ec4899'],
};

export function DataPointChart({
  label,
  value,
  unit = '',
  context,
  sources = [],
  index = 0,
  visualizationType = 'auto',
}: DataPointChartProps) {
  const delay = index * 0.1;

  // Auto-detect best visualization type
  const detectVisualizationType = (): 'pie' | 'radial' | 'stat' => {
    if (visualizationType !== 'auto') {
      // Only return valid types for this component
      if (visualizationType === 'pie' || visualizationType === 'radial' || visualizationType === 'stat') {
        return visualizationType;
      }
      // Fallback to radial for other types
      return 'radial';
    }

    // Percentage data -> pie or radial
    if (unit.includes('%') || label.toLowerCase().includes('percent')) {
      return value >= 50 ? 'radial' : 'pie';
    }

    // Time-based data -> stat with icon
    if (unit.includes('hour') || unit.includes('minute') || unit.includes('day')) {
      return 'stat';
    }

    // Default to radial for visual appeal
    return 'radial';
  };

  const chartType = detectVisualizationType();

  // Prepare data for pie/donut chart
  const pieData = [
    { name: label, value: value, fill: COLORS.gradient[0] },
    { name: 'Remaining', value: 100 - value, fill: '#e5e7eb' },
  ];

  // Prepare data for radial chart
  const radialData = [
    {
      name: label,
      value: value,
      fill: `url(#gradient-${index})`,
    },
  ];

  // Render pie chart
  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          animationBegin={delay * 1000}
          animationDuration={1000}
        >
          {pieData.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  // Render radial progress chart
  const renderRadialChart = () => (
    <ResponsiveContainer width="100%" height={200}>
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="60%"
        outerRadius="100%"
        data={radialData}
        startAngle={90}
        endAngle={-270}
      >
        <defs>
          <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.gradient[0]} />
            <stop offset="50%" stopColor={COLORS.gradient[1]} />
            <stop offset="100%" stopColor={COLORS.gradient[2]} />
          </linearGradient>
        </defs>
        <RadialBar
          background={{ fill: '#f3f4f6' }}
          dataKey="value"
          cornerRadius={10}
          animationBegin={delay * 1000}
          animationDuration={1200}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-4xl font-bold"
          fill="url(#gradient-0)"
        >
          {value}
          <tspan className="text-2xl" fill="#6b7280">
            {unit}
          </tspan>
        </text>
      </RadialBarChart>
    </ResponsiveContainer>
  );

  // Render stat card with big number
  const renderStatCard = () => (
    <div className="flex flex-col items-center justify-center h-[200px]">
      <motion.div
        className="flex items-baseline gap-2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
      >
        <span className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          {value}
        </span>
        {unit && (
          <span className="text-3xl font-semibold text-muted-foreground">
            {unit}
          </span>
        )}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.5 }}
        className="mt-4"
      >
        {value > 50 ? (
          <TrendingUp className="h-8 w-8 text-green-500" />
        ) : (
          <Activity className="h-8 w-8 text-blue-500" />
        )}
      </motion.div>
    </div>
  );

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
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="font-mono text-xs">
              #{index + 1}
            </Badge>
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: delay + 0.2, duration: 0.5 }}
            >
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </motion.div>
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Render appropriate chart */}
          {chartType === 'pie' && renderPieChart()}
          {chartType === 'radial' && renderRadialChart()}
          {chartType === 'stat' && renderStatCard()}

          {/* Context */}
          {context && (
            <motion.p
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.6 }}
            >
              {context}
            </motion.p>
          )}

          {/* Sources */}
          {sources.length > 0 && (
            <motion.div
              className="pt-3 border-t"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.7 }}
            >
              <p className="text-xs text-muted-foreground mb-2">Sources:</p>
              <div className="flex flex-wrap gap-2">
                {sources.map((source, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: delay + 0.8 + i * 0.1,
                      type: 'spring',
                      stiffness: 300,
                    }}
                  >
                    <Badge variant="secondary" className="text-xs">
                      {source}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
