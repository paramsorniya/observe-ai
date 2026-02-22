import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/* Badges: slightly rounded rectangles (NOT rounded-full), uppercase, letter-spaced */
const badgeVariants = cva(
  [
    'inline-flex items-center gap-1',
    'rounded-[5px] px-2 py-0.5',
    'text-[11px] font-semibold uppercase tracking-[0.06em]',
    'border transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  ].join(' '),
  {
    variants: {
      variant: {
        /* Default: teal */
        default: 'border-primary/30 bg-primary/10 text-primary',
        /* Secondary: amber */
        secondary: 'border-secondary/30 bg-secondary/10 text-amber-500 dark:text-amber-400',
        /* Destructive */
        destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
        /* Outline */
        outline: 'border-border bg-transparent text-foreground',
        /* Success: green/teal */
        success: 'border-teal-600/30 bg-teal-600/10 text-teal-600 dark:text-teal-400',
        /* Warning: amber */
        warning: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
        /* Ghost */
        ghost: 'border-transparent bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
