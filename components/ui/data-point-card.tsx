'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { AnimatedCounter } from './animated-counter';
import { TrendingUp } from 'lucide-react';

interface DataPointCardProps {
  label: string;
  value: number;
  unit?: string;
  context?: string;
  sources?: string[];
  index?: number;
  maxValue?: number;
}

export function DataPointCard({
  label,
  value,
  unit = '',
  context,
  sources = [],
  index = 0,
  maxValue,
}: DataPointCardProps) {
  const delay = index * 0.1;
  const percentage = maxValue ? (value / maxValue) * 100 : 0;

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
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </motion.div>
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Large animated value */}
          <motion.div
            className="flex items-baseline gap-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
          >
            <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              <AnimatedCounter value={value} duration={1.5} />
            </span>
            {unit && (
              <span className="text-2xl font-semibold text-muted-foreground">
                {unit}
              </span>
            )}
          </motion.div>

          {/* Progress bar if maxValue provided */}
          {maxValue && (
            <div className="space-y-2">
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: delay + 0.5, duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {percentage.toFixed(1)}% of maximum
              </p>
            </div>
          )}

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
