import type { ReactNode } from 'react';
import { SessionBoundary } from '@/modules/auth/components/session-boundary';
import { ApplicationShell } from '@/modules/layout/application-shell';
export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SessionBoundary>
      <ApplicationShell>{children}</ApplicationShell>
    </SessionBoundary>
  );
}
