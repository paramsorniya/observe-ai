import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        // Base layout
        'flex h-10 w-full',
        'rounded-[8px]',
        'border border-input',
        'bg-input',
        'px-4 py-2.5',
        'text-sm text-foreground font-sans',
        'placeholder:text-muted-foreground/60',
        // File input reset
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        // Focus: 2px teal border
        'focus-visible:outline-none',
        'focus-visible:border-primary/70',
        'focus-visible:ring-2 focus-visible:ring-primary/20',
        'focus-visible:ring-offset-0',
        // Transition
        'transition-all duration-200 ease-out',
        // Disabled
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
