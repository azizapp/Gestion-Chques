import React, { useMemo } from 'react';
import { Check, CheckStatus } from '../types.ts';
import { Pencil, CheckCircle2 } from 'lucide-react';
import { formatCurrency, getStatusBadge, getTypeBadge } from '../constants.tsx';

interface DueChecksProps {
  checks: Check[];
  mode: 'today' | 'tomorrow' | 'week';
  currency: string;
  onEdit?: (check: Check) => void;
  onMarkAsPaid?: (id: string) => void;
  isAdmin?: boolean;
}

const normalizeDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DueChecks: React.FC<DueChecksProps> = ({ checks, mode, currency, onEdit, onMarkAsPaid, isAdmin }) => {
  const today = new Date();
  const todayStr = normalizeDate(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = normalizeDate(tomorrow);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const filtered = useMemo(() => {
    return checks.filter(c => {
      if (!c.due_date) return false;
      const d = new Date(c.due_date);
      const ds = normalizeDate(d);
      if (mode === 'today') return ds === todayStr;
      if (mode === 'tomorrow') return ds === tomorrowStr;
      if (mode === 'week') {
        const time = d.getTime();
        return time >= new Date(todayStr).getTime() && time <= weekEnd.getTime();
      }
      return false;
    }).sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
  }, [checks, mode, todayStr, tomorrowStr, weekEnd]);

  const title =
    mode === 'today'
      ? "À Payer Aujourd'hui"
      : mode === 'tomorrow'
      ? 'À Payer Demain'
      : 'À Payer Cette Semaine';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-white italic tracking-tight uppercase">
          {title}
        </h1>
        <div className="text-sm font-bold text-white/40 uppercase tracking-widest">
          {filtered.length} instrument{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="glass-card rounded-[12px] overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">
                  Référence
                </th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">
                  Échéance
                </th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">
                  Bénéficiaire/Émetteur
                </th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">
                  Montant
                </th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold text-center">
                  Type
                </th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold text-center">
                  État
                </th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(check => (
                <tr key={check.id} className="hover:bg-white/[0.015] transition-colors group">
                  <td className="px-6 py-4 text-[11px] font-medium text-white/40">
                    {check.check_number}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-semibold text-white/60">
                      {check.due_date ? new Date(check.due_date).toLocaleDateString('fr-FR') : '---'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-white/80">
                        {check.entity_name}
                      </span>
                      <span className="text-[9px] text-white/20 uppercase tracking-widest">
                        {check.bank_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[12px] font-bold text-white">
                      {formatCurrency(check.amount, currency as any)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">{getTypeBadge(check.type)}</td>
                  <td className="px-6 py-4 text-center">{getStatusBadge(check.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {check.status === CheckStatus.PENDING && (
                        <button
                          onClick={() => onMarkAsPaid?.(check.id)}
                          className="p-2 text-emerald-500/60 hover:text-emerald-400 transition-colors"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => onEdit?.(check)}
                        className="p-2 text-white/20 hover:text-gold transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-xs font-bold text-white/20 uppercase tracking-widest italic">
                      Aucun instrument trouvé
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DueChecks;
