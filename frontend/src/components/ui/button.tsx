import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base: all buttons share these traits
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-sans font-semibold text-sm',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.97]',
  ].join(' '),
  {
    variants: {
      variant: {
        /* Primary — solid teal with inner glow */
        default: [
          'bg-primary text-primary-foreground',
          'shadow-glow-xs',
          'hover:bg-teal-500 hover:shadow-glow-sm',
          '[--btn-inset:inset_0_1px_0_rgba(255,255,255,0.12)]',
          'shadow-[0_0_0_1px_rgba(13,148,136,0.3),inset_0_1px_0_rgba(255,255,255,0.12)]',
          'hover:shadow-[0_0_0_1px_rgba(13,148,136,0.5),0_0_16px_rgba(13,148,136,0.18),inset_0_1px_0_rgba(255,255,255,0.14)]',
        ].join(' '),

        /* Destructive */
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/85',
          'shadow-[0_0_0_1px_rgba(239,68,68,0.3)]',
          'hover:shadow-[0_0_0_1px_rgba(239,68,68,0.5),0_0_12px_rgba(239,68,68,0.15)]',
        ].join(' '),

        /* Outline — teal border, transparent bg */
        outline: [
          'border border-primary/30 bg-transparent text-primary',
          'hover:border-primary/70 hover:bg-primary/8',
        ].join(' '),

        /* Secondary — amber accent */
        secondary: [
          'bg-secondary/15 border border-secondary/30 text-secondary',
          'hover:bg-secondary/25 hover:border-secondary/60',
        ].join(' '),

        /* Ghost — no border, subtle hover */
        ghost: [
          'bg-transparent text-muted-foreground',
          'hover:bg-accent hover:text-foreground',
        ].join(' '),

        /* Link */
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-5 py-2 rounded-[8px]',
        sm: 'h-8 px-4 text-xs rounded-[6px]',
        lg: 'h-11 px-7 text-base rounded-[10px]',
        xl: 'h-13 px-9 text-base rounded-[12px]',
        icon: 'h-10 w-10 rounded-[8px]',
        'icon-sm': 'h-8 w-8 rounded-[6px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
