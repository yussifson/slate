import { NavLink } from 'react-router-dom';
import { ArrowLeftRight, BadgeDollarSign, Banknote, CalendarClock, ChevronRight, FileText, Landmark, LockKeyhole, WalletCards } from 'lucide-react';

const financeLinks = [
  { label: 'Trust Accounting', path: '/real-estate/trust-accounting', icon: WalletCards },
  { label: 'Firm Accounting', path: '/finance/accounting', icon: Landmark },
  { label: 'Escrow', path: '/real-estate/escrow', icon: LockKeyhole },
  { label: 'Rent Payments', path: '/real-estate/rent-payments', icon: Banknote },
  { label: 'Payment Schedules', path: '/real-estate/payment-schedules', icon: CalendarClock },
  { label: 'Commissions', path: '/real-estate/commissions', icon: BadgeDollarSign },
  { label: 'Commission Rules', path: '/real-estate/commission-rules', icon: FileText },
];

export default function FinanceLayout({ children }) {
  return (
    <div className="flex min-h-0 w-full flex-col gap-5 lg:flex-row">
      <aside className="w-full shrink-0 rounded-2xl border border-border/60 bg-card/90 p-2 shadow-sm lg:sticky lg:top-4 lg:h-[calc(100vh-7rem)] lg:w-64 lg:self-start">
        <div className="border-b border-border/60 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Finance</p>
          <p className="mt-1 text-xs text-muted-foreground">Accounts and payments</p>
        </div>
        <nav aria-label="Finance navigation" className="mt-2 flex gap-1 overflow-x-auto lg:h-[calc(100%-4.5rem)] lg:flex-col lg:overflow-y-auto">
          {financeLinks.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
              <ChevronRight className="ml-auto hidden h-3.5 w-3.5 lg:block" />
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">{children}</section>
    </div>
  );
}
