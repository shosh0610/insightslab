'use client';

import { motion } from 'framer-motion';
import { Card } from './card';
import { ReactNode, ComponentPropsWithoutRef } from 'react';

interface AnimatedCardProps extends Omit<ComponentPropsWithoutRef<typeof Card>, 'children' | 'delay' | 'className'> {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedCard({ children, delay = 0, className = '', ...props }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
    >
      <Card className={className} {...props}>
        {children}
      </Card>
    </motion.div>
  );
}
