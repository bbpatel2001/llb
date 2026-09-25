import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="min-h-screen bg-app-background text-main">
      <Header mobileOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen((value) => !value)} />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
