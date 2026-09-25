import { FormEvent, useState } from 'react';
import { Bell, BookOpen, Globe2, Menu, Search, UserCircle, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';

interface HeaderProps {
  mobileOpen: boolean;
  onMenuToggle: () => void;
}

export function Header({ mobileOpen, onMenuToggle }: HeaderProps) {
  const { user } = useAuth();
  const { locale, setLocale } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(search.trim() ? `/case-laws?search=${encodeURIComponent(search.trim())}` : '/case-laws');
  };

  const initials = user?.name
    ? user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
    : 'X';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-7">
        <button type="button" onClick={onMenuToggle} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Toggle navigation" aria-expanded={mobileOpen}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link to="/" className="flex shrink-0 items-center gap-2.5 text-primary-700">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-primary-700"><BookOpen className="h-5 w-5" aria-hidden="true" /></span>
          <span className="hidden text-lg font-extrabold tracking-tight sm:inline">LLB Platform</span>
        </Link>
        <div className="hidden text-[10px] leading-3 text-slate-400 xl:block">Learn · Practice · Build Your Future</div>

        <form onSubmit={submitSearch} className="relative ml-auto hidden w-full max-w-[490px] md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-16 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100" placeholder="Search case laws, subjects, topics, judgments..." aria-label="Search the platform" />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-400">Ctrl K</kbd>
        </form>

        <div className="ml-auto flex items-center gap-2 sm:gap-4 md:ml-5">
          <label className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex" htmlFor="header-locale">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            <select id="header-locale" value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)} className="cursor-pointer border-0 bg-transparent pr-1 text-xs text-slate-600 outline-none">
              <option value="en">English</option>
              <option value="gu">ગુજરાતી</option>
            </select>
          </label>
          <button type="button" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Notifications">
            <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>
          <Link to={user ? '/my-study' : '/login'} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-xs text-slate-600 transition hover:bg-slate-100">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 font-semibold text-white">{user ? initials : <UserCircle className="h-5 w-5" />}</span>
            <span className="hidden max-w-24 truncate sm:inline">{user?.name || 'Hello, Student'}</span>
            <span className="hidden text-slate-400 sm:inline">⌄</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
