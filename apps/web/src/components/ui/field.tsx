import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
export function Field({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('space-y-2', className)} {...props} />;
}
export function FieldLabel({ className, ...props }: ComponentProps<'label'>) {
  return (
    <label className={cn('block text-sm font-medium', className)} {...props} />
  );
}
export function FieldError({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm text-destructive', className)} {...props} />;
}
