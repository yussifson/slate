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
    <div className="flex min-h-0 w-full flex-col gap-4 lg:gap-5 lg:flex-row overflow-x-hidden">
      <aside className="w-full shrink-0 rounded-2xl border border-border/60 bg-card/90 p-1.5 sm:p-2 shadow-xs lg:sticky lg:top-4 lg:h-[calc(100vh-7rem)] lg:w-60 lg:self-start">
        <nav aria-label="Finance navigation" className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0 lg:h-full lg:flex-col lg:overflow-y-auto">
          {financeLinks.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `group flex shrink-0 items-center gap-2 sm:gap-2.5 rounded-xl px-3 py-2 sm:py-2.5 text-xs font-bold transition-all ${isActive ? 'bg-[#005A9C] text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
              <ChevronRight className="ml-auto hidden h-3.5 w-3.5 lg:block opacity-60 group-hover:opacity-100" />
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1 overflow-x-hidden">{children}</section>
    </div>
  );
}
