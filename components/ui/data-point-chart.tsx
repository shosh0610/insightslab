'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { BarChart3 } from 'lucide-react';

interface DataPointChartProps {
  label: string;
  value: number;
  unit?: string;
  context?: string;
  sources?: string[];
  index?: number;
  visualizationType?: 'auto' | 'pie' | 'bar' | 'radial' | 'area' | 'stat';
}

export function DataPointChart({
  label,
  value,
  unit = '',
  context,
  sources = [],
  index = 0,
}: DataPointChartProps) {
  const delay = index * 0.1;

  // Check if this is a percentage value
  const isPercentage = unit.includes('%');

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
        y: -4,
        transition: { duration: 0.2 },
      }}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs">
              #{index + 1}
            </Badge>
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: delay + 0.2, duration: 0.5 }}
            >
              <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
            </motion.div>
          </div>
          <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-snug">
            {label}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Large Number Display */}
          <motion.div
            className="space-y-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-bold bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                {value}
              </span>
              {unit && (
                <span className="text-2xl font-semibold text-slate-500 dark:text-slate-400">
                  {unit}
                </span>
              )}
            </div>

            {/* Horizontal Progress Bar for Percentages */}
            {isPercentage && (
              <motion.div
                className="space-y-1.5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.5 }}
              >
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ delay: delay + 0.6, duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {value}% of total
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Context */}
          {context && (
            <motion.p
              className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.7 }}
            >
              {context}
            </motion.p>
          )}

          {/* Sources */}
          {sources.length > 0 && (
            <motion.div
              className="pt-3 border-t border-slate-200 dark:border-slate-700"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.8 }}
            >
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Sources:</p>
              <div className="flex flex-wrap gap-1.5">
                {sources.map((source, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: delay + 0.9 + i * 0.1,
                      type: 'spring',
                      stiffness: 300,
                    }}
                  >
                    <Badge variant="secondary" className="text-xs font-normal">
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
