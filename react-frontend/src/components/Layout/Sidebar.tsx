import { LucideIcon } from 'lucide-react';
import {
  BookMarked,
  BookOpen,
  Bookmark,
  BrainCircuit,
  ClipboardList,
  FileText,
  Globe2,
  GraduationCap,
  History,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  MessageSquare,
  Newspaper,
  Scale,
  Settings,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface SidebarLink {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface SidebarGroup {
  label: string;
  links: SidebarLink[];
}

const navigationGroups: SidebarGroup[] = [
  {
    label: 'Overview',
    links: [
      { label: 'Home', to: '/', icon: Home },
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Study',
    links: [
      { label: 'Study Material', to: '/study', icon: BookOpen },
      { label: 'Study Articles', to: '/study/articles', icon: Newspaper },
      { label: 'Question Papers', to: '/papers', icon: FileText },
      { label: 'Question Bank', to: '/questions', icon: ClipboardList },
      { label: 'Subjects & Syllabi', to: '/syllabi', icon: GraduationCap },
      { label: 'Law Mapping', to: '/law-mapping', icon: Scale },
    ],
  },
  {
    label: 'Practice',
    links: [
      { label: 'Practice Tests', to: '/quizzes', icon: Trophy },
      { label: 'Flashcards', to: '/flashcards', icon: BookMarked },
      { label: 'Flashcard History', to: '/flashcard-history', icon: History },
    ],
  },
  {
    label: 'Resources',
    links: [
      { label: 'Case Laws', to: '/case-laws', icon: Scale },
      { label: 'Articles', to: '/articles', icon: FileText },
      { label: 'Blogs', to: '/blogs', icon: Newspaper },
    ],
  },
  {
    label: 'My Workspace',
    links: [
      { label: 'My Study', to: '/my-study', icon: Bookmark },
      { label: 'Quiz History', to: '/quiz-history', icon: History },
      { label: 'Recommendations', to: '/recommendations', icon: BrainCircuit },
    ],
  },
];

const adminLinks: SidebarLink[] = [
  { label: 'Admin Dashboard', to: '/admin', icon: ShieldCheck },
  { label: 'Content Review', to: '/admin/review', icon: FileText },
  { label: 'Syllabus Admin', to: '/admin/syllabi', icon: GraduationCap },
  { label: 'Bulk Mapping', to: '/admin/mappings', icon: Scale },
  { label: 'Flashcard Diagnostics', to: '/admin/flashcards', icon: BookMarked },
  { label: 'Audit Log', to: '/admin/audit', icon: History },
];

function LinkItem({ link, onClose }: { link: SidebarLink; onClose: () => void }) {
  const Icon = link.icon;
  return (
    <NavLink
      to={link.to}
      end={link.to === '/'}
      onClick={onClose}
      className={({ isActive }) => `group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${isActive
        ? 'bg-light-blue text-primary-700 shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{link.label}</span>
    </NavLink>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLocale();

  const handleLogout = () => {
    void logout();
    onClose();
  };

  return (
    <>
      {open && <button type="button" aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-30 bg-slate-950/30 md:hidden" />}
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-16 left-0 z-40 flex w-60 flex-col border-r border-border bg-card px-3 py-4 shadow-xl transition-transform md:sticky md:top-16 md:z-0 md:h-[calc(100vh-4rem)] md:translate-x-0 md:shadow-none`}>
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto pr-1">
          {navigationGroups.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{group.label}</p>
              <div className="space-y-0.5">
                {group.links.map((link) => <LinkItem key={link.to} link={link} onClose={onClose} />)}
              </div>
            </div>
          ))}

          {user?.role === 'admin' && (
            <div className="mb-5 border-t border-slate-100 pt-4">
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Manage</p>
              <div className="space-y-0.5">
                {adminLinks.map((link) => <LinkItem key={link.to} link={link} onClose={onClose} />)}
              </div>
            </div>
          )}
        </nav>

        <div className="space-y-1 border-t border-slate-100 pt-3">
          <a href="mailto:support@example.com?subject=LLB%20Platform%20feedback" className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span>Contact / Feedback</span>
          </a>
          <LinkItem link={{ label: 'Settings', to: '/my-study', icon: Settings }} onClose={onClose} />
          <label className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-600" htmlFor="sidebar-locale">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            <span className="flex-1">Language</span>
            <select id="sidebar-locale" value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)} className="max-w-20 border-0 bg-transparent text-right text-xs outline-none">
              <option value="en">English</option>
              <option value="gu">ગુજરાતી</option>
            </select>
          </label>
          {user ? (
            <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sign out</span>
            </button>
          ) : (
            <Link to="/login" onClick={onClose} className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-primary-700 transition hover:bg-light-blue">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
