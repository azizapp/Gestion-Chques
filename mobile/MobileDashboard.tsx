
import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Clock, CheckCircle2, 
  ShieldCheck, AlertTriangle, Filter, RotateCcw, 
  MoreVertical, Edit2, CheckCircle, Banknote,
  ChevronRight, ChevronLeft
} from 'lucide-react';
import { Check, CheckType, CheckStatus, Currency } from '../types.ts';
import { formatCurrency } from '../constants.tsx';

interface MobileDashboardProps {
  checks: Check[];
  currency: Currency;
  onEdit?: (check: Check) => void;
  onMarkAsPaid?: (id: string) => void;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];

const MobileDashboard: React.FC<MobileDashboardProps> = ({ checks, currency, onEdit, onMarkAsPaid }) => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | '15days' | 'month'>('month');
  const [typeFilter, setTypeFilter] = useState<CheckType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CheckStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, typeFilter, statusFilter, checks, itemsPerPage]);

  const filteredData = useMemo(() => {
    return checks.filter(c => {
      const checkDate = new Date(c.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let matchesTime = true;
      if (timeFilter === 'today') {
        matchesTime = checkDate.toDateString() === today.toDateString();
      } else if (timeFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        matchesTime = checkDate >= weekAgo && checkDate <= today;
      } else if (timeFilter === '15days') {
        const fifteenAgo = new Date();
        fifteenAgo.setDate(today.getDate() - 15);
        matchesTime = checkDate >= fifteenAgo && checkDate <= today;
      } else if (timeFilter === 'month') {
        matchesTime = checkDate.getMonth() === today.getMonth() && checkDate.getFullYear() === today.getFullYear();
      }

      const matchesType = typeFilter === 'all' || c.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

      return matchesTime && matchesType && matchesStatus;
    });
  }, [checks, timeFilter, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const sum = (type?: CheckType, status?: CheckStatus) => {
      return filteredData
        .filter(c => (!type || c.type === type) && (!status || c.status === status))
        .reduce((s, c) => s + c.amount, 0);
    };
    
    return {
      entrant: sum(CheckType.INCOMING),
      sortant: sum(CheckType.OUTGOING),
      pending: sum(undefined, CheckStatus.PENDING),
      paid: sum(undefined, CheckStatus.PAID),
      garantie: sum(undefined, CheckStatus.GARANTIE),
      returned: sum(undefined, CheckStatus.RETURNED),
    };
  }, [filteredData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleReset = () => {
    setTimeFilter('month');
    setTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const SummaryCard = ({ label, amount, colorClass, borderClass }: any) => (
    <div className={`glass-card p-5 rounded-[20px] border ${borderClass} flex flex-col justify-between min-h-[110px] transition-all duration-300`}>
      <p className={`text-[9px] font-semibold uppercase tracking-[0.2em] ${colorClass} opacity-60 mb-1`}>{label}</p>
      <h3 className="text-xl font-semibold text-white tracking-tight">{formatCurrency(amount, currency)}</h3>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'today', label: 'Today' },
          { id: 'week', label: 'This Week' },
          { id: '15days', label: '15 Days' },
          { id: 'month', label: 'This Month' }
        ].map(f => (
          <button 
            key={f.id}
            onClick={() => setTimeFilter(f.id as any)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-medium whitespace-nowrap transition-all ${timeFilter === f.id ? 'bg-[#1a1e2e] text-white border border-white/10 shadow-lg' : 'text-white/20'}`}
          >
            {f.label}
          </button>
        ))}
        <button onClick={handleReset} className="ml-2 p-2.5 text-white/20 hover:text-gold transition-colors">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex bg-[#0a0d18] p-1.5 rounded-2xl border border-white/5">
        <button 
          onClick={() => setTypeFilter(typeFilter === CheckType.INCOMING ? 'all' : CheckType.INCOMING)}
          className={`flex-1 py-3 rounded-xl text-[9px] font-semibold uppercase tracking-[0.2em] transition-all ${typeFilter === CheckType.INCOMING ? 'bg-[#1e2538] text-white shadow-xl' : 'text-white/20'}`}
        >
          Entrant
        </button>
        <button 
          onClick={() => setTypeFilter(typeFilter === CheckType.OUTGOING ? 'all' : CheckType.OUTGOING)}
          className={`flex-1 py-3 rounded-xl text-[9px] font-semibold uppercase tracking-[0.2em] transition-all ${typeFilter === CheckType.OUTGOING ? 'bg-[#1e2538] text-white shadow-xl' : 'text-white/20'}`}
        >
          Sortant
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: CheckStatus.PENDING, label: 'PENDING', color: 'border-gold/30 text-gold' },
          { id: CheckStatus.RETURNED, label: 'RETURN', color: 'border-rose-500/30 text-rose-500' },
          { id: CheckStatus.GARANTIE, label: 'GUARANTEE', color: 'border-blue-500/30 text-blue-500' },
          { id: CheckStatus.PAID, label: 'PAID', color: 'border-emerald-500/30 text-emerald-500' },
        ].map(s => (
          <button 
            key={s.id}
            onClick={() => setStatusFilter(statusFilter === s.id ? 'all' : s.id)}
            className={`px-4 py-2 rounded-[12px] border text-[9px] font-semibold tracking-widest transition-all whitespace-nowrap ${statusFilter === s.id ? s.color.replace('border-', 'bg-').replace('/30', '/10') + ' ' + s.color.split(' ')[0] : 'bg-transparent border-white/5 text-white/20'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <h4 className="text-xl font-semibold text-white tracking-tight">Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard label="Entrant Total" amount={stats.entrant} colorClass="text-white" borderClass="border-white/5" />
          <SummaryCard label="Sortant Total" amount={stats.sortant} colorClass="text-white" borderClass="border-white/5" />
          <SummaryCard label="En Attente" amount={stats.pending} colorClass="text-gold" borderClass="border-gold/10 bg-gold/[0.02]" />
          <SummaryCard label="Payé" amount={stats.paid} colorClass="text-emerald-400" borderClass="border-emerald-500/10 bg-emerald-500/[0.02]" />
          <SummaryCard label="Garantie" amount={stats.garantie} colorClass="text-blue-400" borderClass="border-blue-500/10 bg-blue-500/[0.02]" />
          <SummaryCard label="Return" amount={stats.returned} colorClass="text-rose-400" borderClass="border-rose-500/10 bg-rose-500/[0.02]" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-semibold text-white tracking-tight">Matching Records</h4>
          <span className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em]">{filteredData.length} Results</span>
        </div>
        
        <div className="space-y-3">
          {paginatedData.map(c => (
            <button 
              key={c.id} 
              onClick={() => onEdit?.(c)}
              className="w-full text-left glass-card p-4 rounded-[22px] border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  c.status === CheckStatus.PAID ? 'bg-emerald-500/10 text-emerald-500' :
                  c.status === CheckStatus.PENDING ? 'bg-gold/10 text-gold' :
                  c.status === CheckStatus.GARANTIE ? 'bg-blue-500/10 text-blue-500' :
                  'bg-rose-500/10 text-rose-500'
                }`}>
                  {c.status === CheckStatus.PAID ? <CheckCircle size={22} /> : 
                   c.status === CheckStatus.PENDING ? <Clock size={22} /> :
                   c.status === CheckStatus.GARANTIE ? <ShieldCheck size={22} /> :
                   <AlertTriangle size={22} />}
                </div>
                <div>
                  <h5 className="text-[14px] font-semibold text-white truncate max-w-[130px]">{c.entity_name}</h5>
                  <p className="text-[10px] text-white/30 font-normal truncate max-w-[130px]">{c.bank_name} • {c.check_number}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-white">{formatCurrency(c.amount, currency)}</p>
                  <p className="text-[10px] text-white/20 font-medium uppercase">{new Date(c.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="text-white/20 group-hover:text-gold transition-colors">
                  <ChevronRight size={18} />
                </div>
              </div>
            </button>
          ))}
          
          {filteredData.length === 0 && (
            <div className="py-20 text-center glass-card rounded-[22px] border-white/5 opacity-50">
              <Banknote size={40} className="mx-auto text-white/10 mb-3" />
              <p className="text-[9px] font-semibold text-white/20 uppercase tracking-[0.2em]">No Records Found</p>
            </div>
          )}

          {/* Mobile Pagination Footer */}
          {filteredData.length > 0 && (
            <div className="mt-6 bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <span className="text-[10px] text-white/40 uppercase">Lignes:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-[#0a0d18] border border-white/10 rounded-lg text-[10px] text-white px-3 py-2 outline-none focus:border-gold/50"
                  style={{ backgroundColor: '#0a0d18', color: '#ffffff' }}
                >
                  {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-3 bg-white/5 rounded-xl text-white disabled:opacity-20 active:scale-90 transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">Page {currentPage}</span>
                    <span className="text-[8px] text-white/20 uppercase tracking-widest">sur {totalPages}</span>
                  </div>

                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="p-3 bg-white/5 rounded-xl text-white disabled:opacity-20 active:scale-90 transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
