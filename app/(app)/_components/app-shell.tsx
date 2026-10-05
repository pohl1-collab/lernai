'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { BookOpen, LayoutDashboard, FolderOpen, Camera, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/subjects', label: 'Fächer', icon: FolderOpen },
  { href: '/upload', label: 'Neues Foto', icon: Camera },
];

export default function AppShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string } }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">LernAI</span>
            <Sparkles className="w-3.5 h-3.5 text-accent" />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname?.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <Button variant={active ? 'secondary' : 'ghost'} size="sm" className={cn('gap-2', active && 'font-semibold')}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground ml-2" onClick={() => signOut({ redirectTo: '/login' })}>
              <LogOut className="w-4 h-4" /> Abmelden
            </Button>
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
        {mobileOpen && (
          <nav className="md:hidden border-t border-border bg-background pb-3 px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname?.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <Button variant={active ? 'secondary' : 'ghost'} className={cn('w-full justify-start gap-3', active && 'font-semibold')}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={() => signOut({ redirectTo: '/login' })}>
              <LogOut className="w-4 h-4" /> Abmelden
            </Button>
          </nav>
        )}
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
