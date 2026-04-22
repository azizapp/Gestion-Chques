
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { 
  Download, Printer, RefreshCw, FileText, TrendingUp, TrendingDown, 
  AlertCircle, Building2, 
  AlertTriangle, ChevronDown,
  Info,
  ShieldCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Check, CheckStatus, Currency, CheckType } from '../types.ts';
import { COLORS, formatCurrency } from '../constants.tsx';

interface ReportsProps {
  checks: Check[];
  currency: Currency;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const Reports: React.FC<ReportsProps> = ({ checks, currency }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CheckType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CheckStatus>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, dateRange, itemsPerPage]);

  const handleReset = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setDateRange({ from: '', to: '' });
  };

  // 1. Logic to filter checks based on ALL criteria
  const filteredChecks = useMemo(() => {
    return checks.filter(c => {
      const matchesSearch = c.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.check_number.includes(searchTerm);
      const matchesType = typeFilter === 'all' || c.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      
      let matchesRange = true;
      if (c.due_date) {
        const checkDate = new Date(c.due_date).getTime();
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from).getTime();
          matchesRange = matchesRange && checkDate >= fromDate;
        }
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999); // Include the full day
          matchesRange = matchesRange && checkDate <= toDate.getTime();
        }
      } else if (dateRange.from || dateRange.to) {
        matchesRange = false; // If no date but filter exists, exclude
      }

      return matchesSearch && matchesType && matchesStatus && matchesRange;
    });
  }, [checks, searchTerm, typeFilter, statusFilter, dateRange]);

  // 2. Derive stats from FILTERED checks
  const stats = useMemo(() => {
    const today = new Date();
    const soonThreshold = new Date();
    soonThreshold.setDate(today.getDate() + 7);

    const incoming = filteredChecks.filter(c => c.type === CheckType.INCOMING);
    const outgoing = filteredChecks.filter(c => c.type === CheckType.OUTGOING);
    const pending = filteredChecks.filter(c => c.status === CheckStatus.PENDING);
    const returned = filteredChecks.filter(c => c.status === CheckStatus.RETURNED);
    const garantie = filteredChecks.filter(c => c.status === CheckStatus.GARANTIE);
    const dueSoon = pending.filter(c => {
      if (!c.due_date) return false;
      const due = new Date(c.due_date);
      return due >= today && due <= soonThreshold;
    });
    const dueToday = pending.filter(c => {
      if (!c.due_date) return false;
      const due = new Date(c.due_date);
      return due.toDateString() === today.toDateString();
    });

    return {
      totalIncoming: incoming.reduce((s, c) => s + c.amount, 0),
      countIncoming: incoming.length,
      totalOutgoing: outgoing.reduce((s, c) => s + c.amount, 0),
      countOutgoing: outgoing.length,
      totalPending: pending.reduce((s, c) => s + c.amount, 0),
      countPending: pending.length,
      totalReturned: returned.reduce((s, c) => s + c.amount, 0),
      countReturned: returned.length,
      totalGarantie: garantie.reduce((s, c) => s + c.amount, 0),
      countGarantie: garantie.length,
      totalDueSoon: dueSoon.reduce((s, c) => s + c.amount, 0),
      countDueSoon: dueSoon.length,
      countDueToday: dueToday.length,
      totalDueToday: dueToday.reduce((s, c) => s + c.amount, 0),
    };
  }, [filteredChecks]);

  // 3. Status Chart Data from Filtered checks
  const statusChartData = useMemo(() => [
    { name: 'Payé', value: filteredChecks.filter(c => c.status === CheckStatus.PAID).length, color: COLORS.success },
    { name: 'En attente', value: filteredChecks.filter(c => c.status === CheckStatus.PENDING).length, color: '#f59e0b' },
    { name: 'Return', value: filteredChecks.filter(c => c.status === CheckStatus.RETURNED).length, color: COLORS.risk },
    { name: 'Garantie', value: filteredChecks.filter(c => c.status === CheckStatus.GARANTIE).length, color: '#3b82f6' },
  ].filter(d => d.value > 0), [filteredChecks]);

  // 4. Monthly Data from Filtered checks
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    
    return months.map((monthLabel, monthIndex) => {
      const inVal = filteredChecks.filter(c => {
        if (!c.due_date) return false;
        const d = new Date(c.due_date);
        return d.getMonth() === monthIndex && d.getFullYear() === currentYear && c.type === CheckType.INCOMING;
      }).reduce((sum, c) => sum + c.amount, 0);

      const outVal = filteredChecks.filter(c => {
        if (!c.due_date) return false;
        const d = new Date(c.due_date);
        return d.getMonth() === monthIndex && d.getFullYear() === currentYear && c.type === CheckType.OUTGOING;
      }).reduce((sum, c) => sum + c.amount, 0);

      return { name: monthLabel, entrants: inVal, sortants: outVal };
    });
  }, [filteredChecks]);

  const paginatedChecks = filteredChecks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredChecks.length / itemsPerPage);

  const SummaryCard = ({ title, amount, count, icon: Icon, color, subText }: any) => (
    <div className="glass-card p-6 rounded-[14px] border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-500">
      <div className={`absolute top-0 right-0 p-6 opacity-[0.03] transform group-hover:scale-110 transition-transform ${color}`}>
        <Icon size={80} />
      </div>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-[12px] bg-opacity-10 ${color.replace('text-', 'bg-')} ${color}`}>
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{count} records</span>
      </div>
      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-[22px] font-bold leading-[33px] text-white mb-2">{formatCurrency(amount, currency)}</h3>
      {subText && <p className="text-[10px] text-white/30 italic font-medium">{subText}</p>}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Intelligence de Rapport</h2>
          <p className="text-white/40 text-sm">Analyse dynamique du capital ({new Date().getFullYear()})</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleReset}
            className="p-3 bg-[#0a0d18] border border-white/5 rounded-[12px] text-white/40 hover:text-white transition-all group"
            title="Réinitialiser tous les filtres"
          >
            <RotateCcw size={18} className="group-hover:rotate-[-45deg] transition-transform" />
          </button>
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[12px] border border-white/10">
            <input 
              type="date" 
              className="bg-transparent text-[10px] font-bold text-white outline-none border-none p-1 [color-scheme:dark]"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
            />
            <span className="text-white/20 text-xs uppercase font-black">au</span>
            <input 
              type="date" 
              className="bg-transparent text-[10px] font-bold text-white outline-none border-none p-1 [color-scheme:dark]"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
            />
          </div>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-[12px] text-white/60 transition-colors">
            <Download size={18} />
          </button>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-[12px] text-white/60 transition-colors">
            <Printer size={18} />
          </button>
          <button onClick={() => window.location.reload()} className="p-3 bg-gold text-black rounded-[12px] font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-transform flex items-center gap-2 px-6">
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.countDueToday > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-[14px] flex items-center gap-4 animate-pulse">
            <div className="p-2.5 bg-amber-500/20 rounded-full text-amber-500">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Action Requise Aujourd'hui</p>
              <p className="text-xs text-white/80 font-bold">{stats.countDueToday} chèque(s) ({formatCurrency(stats.totalDueToday, currency)})</p>
            </div>
          </div>
        )}
        {stats.countReturned > 0 && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-[14px] flex items-center gap-4">
            <div className="p-2.5 bg-rose-500/20 rounded-full text-rose-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Risque Détecté</p>
              <p className="text-xs text-white/80 font-bold">{stats.countReturned} Return(s) dans la sélection.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <SummaryCard 
          title="Total Entrants" 
          amount={stats.totalIncoming} 
          count={stats.countIncoming} 
          icon={TrendingUp} 
          color="text-emerald-500" 
          subText="Période filtrée"
        />
        <SummaryCard 
          title="Total Sortants" 
          amount={stats.totalOutgoing} 
          count={stats.countOutgoing} 
          icon={TrendingDown} 
          color="text-rose-500" 
          subText="Période filtrée"
        />
        <SummaryCard 
          title="En Collection" 
          amount={stats.totalPending} 
          count={stats.countPending} 
          icon={FileText} 
          color="text-amber-500" 
          subText="Encaissement prévu"
        />
        <SummaryCard 
          title="Returns" 
          amount={stats.totalReturned} 
          count={stats.countReturned} 
          icon={AlertTriangle} 
          color="text-rose-400" 
          subText="Incidents de paiement"
        />
        <SummaryCard 
          title="Garanties" 
          amount={stats.totalGarantie} 
          count={stats.countGarantie} 
          icon={ShieldCheck} 
          color="text-blue-400" 
          subText="Valeurs en dépôt"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 rounded-[14px] border-white/5">
          <div className="flex items-center justify-between mb-8">
             <h4 className="text-lg font-bold flex items-center gap-3 uppercase tracking-tighter">
               <TrendingUp className="text-gold" />
               Flux de Capital Mensuel (Filtre Actif)
             </h4>
             <div className="flex gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                   <span className="text-[9px] font-black text-white/40 uppercase">Entrants</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                   <span className="text-[9px] font-black text-white/40 uppercase">Sortants</span>
                </div>
             </div>
          </div>
          <div className="h-[350px]">
            {monthlyData.some(d => d.entrants > 0 || d.sortants > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} interval={0} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#0a0d18', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }}
                  />
                  <Bar dataKey="entrants" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="sortants" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-white/30">
                <TrendingUp size={48} className="mb-4 opacity-20" />
                <p className="text-[12px] uppercase tracking-widest font-black">Aucune donnée disponible</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 glass-card p-8 rounded-[14px] border-white/5">
           <h4 className="text-lg font-bold flex items-center gap-3 mb-8 uppercase tracking-tighter">
             <Building2 className="text-gold" />
             Répartition par État
           </h4>
           <div className="h-[350px] flex items-center justify-center relative">
             {statusChartData.length > 0 ? (
               <>
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={statusChartData}
                       innerRadius={80}
                       outerRadius={110}
                       paddingAngle={10}
                       dataKey="value"
                       stroke="none"
                     >
                       {statusChartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-white tracking-tighter">{filteredChecks.length}</span>
                    <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">Actifs Filtrés</span>
                 </div>
               </>
             ) : (
               <div className="flex flex-col items-center justify-center text-white/30">
                 <Building2 size={48} className="mb-4 opacity-20" />
                 <p className="text-[12px] uppercase tracking-widest font-black">Aucune donnée</p>
               </div>
             )}
           </div>
        </div>
      </div>

      <div className="glass-card rounded-[14px] border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <h4 className="text-lg font-bold uppercase tracking-tighter">Registre des Transactions</h4>
            <div className="flex items-center gap-3">
              <div className="relative group min-w-[320px]">
                <Info className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" size={18} />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Recherche par entité, banque ou chèque #"
                  className="w-full bg-white/5 border border-white/10 rounded-[12px] py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-gold/30 transition-all placeholder:text-white/10"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center gap-2 bg-white/5 p-1 rounded-[10px] border border-white/10">
               <button onClick={() => setTypeFilter('all')} className={`px-4 py-1.5 rounded-[8px] text-[10px] font-black uppercase transition-all ${typeFilter === 'all' ? 'bg-gold text-black' : 'text-white/40 hover:text-white'}`}>Tous</button>
               <button onClick={() => setTypeFilter(CheckType.INCOMING)} className={`px-4 py-1.5 rounded-[8px] text-[10px] font-black uppercase transition-all ${typeFilter === CheckType.INCOMING ? 'bg-emerald-500 text-white' : 'text-white/40 hover:text-white'}`}>Entrants</button>
               <button onClick={() => setTypeFilter(CheckType.OUTGOING)} className={`px-4 py-1.5 rounded-[8px] text-[10px] font-black uppercase transition-all ${typeFilter === CheckType.OUTGOING ? 'bg-rose-500 text-white' : 'text-white/40 hover:text-white'}`}>Sortants</button>
             </div>

             <div className="relative min-w-[200px]">
               <FileText size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
               <select 
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value as any)}
                 className="w-full bg-black border border-white/10 rounded-[10px] py-2.5 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none appearance-none cursor-pointer text-white"
               >
                 <option value="all" className="bg-black text-white">Tous les Statuts</option>
                 <option value={CheckStatus.PAID} className="bg-black text-white">Payés</option>
                 <option value={CheckStatus.PENDING} className="bg-black text-white">En attente</option>
                 <option value={CheckStatus.RETURNED} className="bg-black text-white">Returns</option>
                 <option value={CheckStatus.GARANTIE} className="bg-black text-white">Garanties</option>
               </select>
               <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/5">
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Référence</th>
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Entité & Banque</th>
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Dates</th>
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Capital</th>
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedChecks.map((check) => (
                <tr key={check.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-5">
                    <span className="text-[11px] font-bold text-white/40 tracking-widest">{check.check_number}</span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-white group-hover:text-gold transition-colors">{check.entity_name}</p>
                    <p className="text-[10px] text-white/30 font-medium italic">{check.bank_name}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-white/20 uppercase w-12">Émis:</span>
                        <span className="text-[11px] font-bold text-white/60">{check.issue_date ? new Date(check.issue_date).toLocaleDateString() : '---'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-white/20 uppercase w-12">Échéance:</span>
                        <span className={`text-[11px] font-black ${check.due_date && new Date(check.due_date) < new Date() && check.status === CheckStatus.PENDING ? 'text-rose-400' : 'text-white/80'}`}>
                          {check.due_date ? new Date(check.due_date).toLocaleDateString() : '---'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-baseline gap-2">
                       <span className="text-base font-black text-white">{formatCurrency(check.amount, currency)}</span>
                       <span className={`text-[9px] font-black uppercase tracking-tighter ${check.type === CheckType.INCOMING ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {check.type === CheckType.INCOMING ? 'CR' : 'DB'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      check.status === CheckStatus.PAID 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : check.status === CheckStatus.PENDING 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : check.status === CheckStatus.GARANTIE
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {check.status === CheckStatus.PAID ? 'Payé' : check.status === CheckStatus.PENDING ? 'Attente' : check.status === CheckStatus.GARANTIE ? 'Garantie' : 'Return'}
                    </span>
                  </td>
                </tr>
              ))}
              {paginatedChecks.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-white/20 uppercase font-black tracking-widest text-xs italic">
                    Aucune transaction ne correspond à vos filtres
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredChecks.length > 0 && (
          <div className="px-8 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01] flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredChecks.length)} sur {filteredChecks.length}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30 uppercase">Lignes:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-[#0a0d18] border border-white/10 rounded-lg text-[10px] text-white px-2 py-1 outline-none focus:border-gold/50 dark:bg-[#0a0d18] dark:text-white light:bg-white light:text-gray-900 light:border-gray-300"
                  style={{ backgroundColor: '#0a0d18', color: '#ffffff' }}
                >
                  {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-gold/10 hover:text-gold transition-all disabled:opacity-20 disabled:pointer-events-none"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let end = Math.min(totalPages, start + maxVisible - 1);
                    if (end - start + 1 < maxVisible) {
                      start = Math.max(1, end - maxVisible + 1);
                    }
                    
                    if (start > 1) {
                      pages.push(1);
                      if (start > 2) pages.push('...');
                    }
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (end < totalPages) {
                      if (end < totalPages - 1) pages.push('...');
                      pages.push(totalPages);
                    }
                    
                    return pages.map((page, idx) => (
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-[10px] text-white/20">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                            currentPage === page 
                              ? 'bg-gold text-black shadow-lg shadow-gold/20' 
                              : 'text-white/30 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ));
                  })()}
                </div>

                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-gold/10 hover:text-gold transition-all disabled:opacity-20 disabled:pointer-events-none"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
