
import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Clock,
  Receipt,
  Scale,
  ArrowUpRight,
  Globe,
  ExternalLink,
  Loader2,
  BrainCircuit
} from 'lucide-react';
import { Check, CheckType, CheckStatus } from '../types.ts';
import { formatCurrency } from '../constants.tsx';
import { getMarketIntel } from '../services/geminiService.ts';

interface DashboardProps {
  checks: Check[];
  currency: any;
  onTabChange: (tab: 'checks') => void;
  isAdmin?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ checks, currency, onTabChange, isAdmin }) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [marketIntel, setMarketIntel] = useState<any>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);

  const fetchMarketIntel = async () => {
    setLoadingIntel(true);
    const intel = await getMarketIntel(currency);
    setMarketIntel(intel);
    setLoadingIntel(false);
  };

  const filteredByPeriod = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const getStartOfWeek = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
    };

    const startOfWeek = getStartOfWeek(new Date());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return checks.filter(c => {
      const dateToCompare = new Date(c.due_date).getTime();
      if (period === 'today') return dateToCompare >= startOfToday;
      if (period === 'week') return dateToCompare >= startOfWeek;
      if (period === 'month') return dateToCompare >= startOfMonth;
      return true;
    });
  }, [checks, period]);

  const totalIncoming = filteredByPeriod.filter(c => c.type === CheckType.INCOMING).reduce((sum, c) => sum + Number(c.amount), 0);
  const totalOutgoing = filteredByPeriod.filter(c => c.type === CheckType.OUTGOING).reduce((sum, c) => sum + Number(c.amount), 0);
  const netLiquidity = totalIncoming - totalOutgoing;

  const pendingChecks = filteredByPeriod.filter(c => c.status === CheckStatus.PENDING);
  const outstandingAmount = pendingChecks.reduce((sum, c) => sum + Number(c.amount), 0);
  const recentChecks = [...checks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  const StatCard = ({ title, amount, icon: Icon, colorClass, isCurrency = true, subText }: any) => (
    <div className="glass-card p-7 rounded-[22px] relative overflow-hidden group hover:border-gold/20 transition-all duration-500 shadow-xl">
      <div className={`absolute top-0 right-0 p-7 opacity-[0.03] group-hover:scale-105 transition-transform ${colorClass}`}>
        <Icon size={70} />
      </div>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 bg-white/5 rounded-xl text-white/40 group-hover:text-gold transition-colors`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.2em] mb-2">{title}</p>
      <h3 className={`text-[22px] font-bold leading-[33px] mb-1 tracking-tight ${colorClass}`}>
        {isCurrency ? formatCurrency(amount, currency) : amount}
      </h3>
      {subText && <p className="text-[10px] text-white/20 font-medium italic">{subText}</p>}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-[22px] font-bold leading-[33px] italic tracking-tight text-white uppercase">
              TABLEAU DE BORD
            </h2>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-[8px] font-bold text-gold tracking-widest uppercase">
                VÉRIFIÉ
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs font-medium">Flux de capital en temps réel.</p>
        </div>
        
        <div className="flex bg-[#0a0d18] p-1.5 rounded-2xl border border-white/5">
          {['today', 'week', 'month'].map(id => (
            <button key={id} onClick={() => setPeriod(id as any)} className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${period === id ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-white/30 hover:text-white'}`}>
              {id === 'today' ? "Aujourd'hui" : id === 'week' ? "Cette Semaine" : "Ce Mois"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Chèques Reçus" amount={totalIncoming} icon={TrendingUp} colorClass="text-emerald-500" />
        <StatCard title="Chèques Émis" amount={totalOutgoing} icon={TrendingDown} colorClass="text-orange-500" />
        <StatCard title="Balance Nette" amount={netLiquidity} icon={Scale} colorClass={netLiquidity >= 0 ? "text-blue-400" : "text-rose-400"} />
        <StatCard title="Impayés en Attente" amount={outstandingAmount} icon={Clock} colorClass="text-white" subText={`${pendingChecks.length} instruments`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 rounded-[22px] border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-md font-bold flex items-center gap-2.5 uppercase tracking-widest text-white/80">
              <Receipt className="text-gold" size={18} />
              Dernières Opérations
            </h4>
            <button onClick={() => onTabChange('checks')} className="text-[9px] font-bold text-gold uppercase tracking-[0.2em] hover:opacity-80 transition-opacity">Tout voir</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-4 text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">Référence</th>
                  <th className="pb-4 text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">Entité</th>
                  <th className="pb-4 text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentChecks.map((check) => (
                  <tr key={check.id} className="group">
                    <td className="py-4 text-xs font-mono text-[#D4AF37]">{check.check_number}</td>
                    <td className="py-4 font-bold text-[12px] text-white">{check.entity_name}</td>
                    <td className="py-4 font-bold text-[13px] text-right text-white">{formatCurrency(check.amount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          {/* Market Intel Card using Google Search Tool */}
          <div className="glass-card p-8 rounded-[22px] border-gold/10 bg-gold/[0.02] shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-[10px] font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2">
                <Globe size={14} /> Intelligence du Marché
              </h5>
              {loadingIntel && <Loader2 size={14} className="animate-spin text-gold/50" />}
            </div>
            
            {marketIntel ? (
              <div className="space-y-4">
                <div className="text-[11px] text-white/60 leading-relaxed italic whitespace-pre-line">
                  {marketIntel.text}
                </div>
                {marketIntel.sources.length > 0 && (
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[8px] font-black text-white/20 uppercase mb-2">Sources vérifiées:</p>
                    <div className="flex flex-wrap gap-2">
                      {marketIntel.sources.slice(0, 2).map((s: any, i: number) => (
                        <a key={i} href={s.uri} target="_blank" className="flex items-center gap-1 text-[9px] text-gold hover:underline">
                          <ExternalLink size={10} /> {s.title.substring(0, 20)}...
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <button
                  onClick={fetchMarketIntel}
                  disabled={loadingIntel}
                  className="group flex flex-col items-center gap-3 mx-auto text-white/20 hover:text-gold transition-colors"
                >
                  {loadingIntel ? (
                    <Loader2 size={24} className="animate-spin text-gold/50" />
                  ) : (
                    <BrainCircuit size={24} className="group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-[9px] uppercase tracking-widest font-black">
                    {loadingIntel ? 'Analyse en cours...' : 'Lancer l\'analyse IA'}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="glass-card p-6 rounded-[22px] border-white/5 bg-white/[0.01]">
            <h6 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Statut Système</h6>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] font-bold text-white/60">Protection Active</span>
              <span className="text-[9px] font-black text-emerald-400 uppercase">En ligne</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
