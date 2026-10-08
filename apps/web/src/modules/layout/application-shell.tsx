'use client';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Settings, Users, Wrench, Briefcase } from 'lucide-react';
import { NavLink } from '@/components/navigation-progress';
import { useSession } from '@/modules/auth/hooks/use-session';
import { ThemeSelector } from '@/modules/theme/theme-selector';
import { Button } from '@/components/ui/button';
import { useLogout } from '@/modules/auth/hooks/use-logout';

export function ApplicationShell({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const logoutMutation = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const user = session.data;
  if (!user) return null;

  async function signOut(): Promise<void> {
    try {
      await logoutMutation.mutateAsync();
      router.replace('/login');
    } catch {
      /* Keep the screen and present the mutation error. */
    }
  }

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true,
      exact: true,
    },
    {
      label: user.role === 'TECHNICIAN' ? 'My Work Orders' : 'Work Orders',
      href: '/work-orders',
      icon: Briefcase,
      show: true,
      exact: false,
    },
    {
      label: 'Users',
      href: '/users',
      icon: Users,
      show: user.role === 'OWNER',
      exact: false,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      show: user.role === 'OWNER',
      exact: false,
    },
  ].filter((item) => item.show);

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:block focus:p-3"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-card px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <NavLink
              href="/dashboard"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Wrench className="size-5 text-primary" aria-hidden="true" />
              FieldDesk
            </NavLink>
            <p className="mt-1 break-words text-sm text-muted-foreground">
              {user.organisation.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeSelector />
            <Button
              variant="outline"
              disabled={logoutMutation.isPending}
              onClick={() => {
                void signOut();
              }}
            >
              <LogOut className="size-4" aria-hidden="true" />
              {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-7 md:grid-cols-[200px_1fr] sm:px-8">
        <aside>
          <nav aria-label="Main navigation" className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="mt-5 rounded-lg border border-border bg-card p-4">
            <p className="break-words text-sm font-medium">{user.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </p>
          </div>
        </aside>
        <main id="main-content" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
