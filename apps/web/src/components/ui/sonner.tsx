'use client';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="top-center"
      closeButton
      offset="max(16px, env(safe-area-inset-top))"
      mobileOffset="max(16px, env(safe-area-inset-top))"
      toastOptions={{
        classNames: {
          toast: 'auth-toast',
          description: 'text-muted-foreground',
        },
      }}
    />
  );
}
