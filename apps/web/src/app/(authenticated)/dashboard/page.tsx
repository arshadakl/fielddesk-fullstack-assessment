'use client';
import { ClipboardList } from 'lucide-react';
import { useSession } from '@/modules/auth/hooks/use-session';
export default function DashboardPage() {
  const { session } = useSession();
  const user = session.data;
  if (!user) return null;
  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm text-muted-foreground">Your workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Welcome, {user.name}
        </h1>
        <p className="mt-3 text-muted-foreground">
          You’re signed in to {user.organisation.name}.
        </p>
      </div>
      <section
        className="rounded-xl border border-border bg-card p-6 sm:p-8"
        aria-labelledby="workspace-heading"
      >
        <ClipboardList
          className="mb-5 size-8 text-primary"
          aria-hidden="true"
        />
        <h2 id="workspace-heading" className="text-xl font-semibold">
          Your workspace is ready
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
          Work orders, scheduling and activity will appear here as those
          features become available.
        </p>
        <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Account</dt>
            <dd className="mt-1 break-all text-sm">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Role</dt>
            <dd className="mt-1 text-sm">
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
