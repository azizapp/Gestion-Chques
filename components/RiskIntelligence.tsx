
import React, { useMemo, useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, Activity, TrendingDown, 
  ShieldCheck, AlertCircle, ChevronRight,
  Sparkles, Clock, Loader2, BrainCircuit
} from 'lucide-react';
import { Check, CheckStatus, Currency, RiskLevel, FinancialRisk, CheckType } from '../types.ts';
import { formatCurrency } from '../constants.tsx';
import { analyzePortfolioStrategically } from '../services/geminiService.ts';

interface RiskIntelligenceProps {
  checks: Check[];
  currency: Currency;
  highValueThreshold: number;
  onViewCheck?: (id: string) => void;
}

const RiskIntelligence: React.FC<RiskIntelligenceProps> = ({ checks, currency, highValueThreshold, onViewCheck }) => {
  const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runDeepAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzePortfolioStrategically(checks);
    setDeepAnalysis(result);
    setIsAnalyzing(false);
  };

  const riskAnalysis = useMemo(() => {
    const risks: FinancialRisk[] = [];
    const today = new Date();
    
    checks.forEach(c => {
      if (c.status === CheckStatus.RETURNED) {
        risks.push({ id: `ret-${c.id}`, type: 'returned', level: RiskLevel.HIGH, description: `Chèque retourné #${c.check_number}`, amount: c.amount, relatedId: c.id });
      }
      if (c.status === CheckStatus.PENDING && new Date(c.due_date) < today) {
        risks.push({ id: `over-${c.id}`, type: 'overdue', level: RiskLevel.HIGH, description: `Échéance dépassée #${c.check_number}`, amount: c.amount, relatedId: c.id });
      }
      if (c.amount >= highValueThreshold && c.status === CheckStatus.PENDING) {
        risks.push({ id: `high-${c.id}`, type: 'high_value', level: RiskLevel.MEDIUM, description: `Instrument haute valeur #${c.check_number}`, amount: c.amount, relatedId: c.id });
      }
    });

    const highCount = risks.filter(r => r.level === RiskLevel.HIGH).length;
    const medCount = risks.filter(r => r.level === RiskLevel.MEDIUM).length;
    const riskScore = Math.min(100, (highCount * 30) + (medCount * 10));

    return { risks, riskScore, highCount, medCount, totalRiskAmount: risks.reduce((s, r) => s + r.amount, 0) };
  }, [checks, highValueThreshold]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-10">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Intelligence de Risque</h2>
          <p className="text-white/40 text-sm mt-1">Analyse prédictive et détection de fraudes par IA.</p>
        </div>
        
        <button 
          onClick={runDeepAnalysis}
          disabled={isAnalyzing}
          className="bg-gold text-black px-8 py-4 rounded-[16px] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
        >
          {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={18} />}
          Lancer l'Analyse Profonde
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 rounded-[20px] bg-gradient-to-br from-white/[0.02] to-transparent">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Score de Risque</p>
          <div className="flex items-end gap-3">
             <h3 className={`text-4xl font-black italic ${riskAnalysis.riskScore > 40 ? 'text-rose-500' : 'text-emerald-500'}`}>{riskAnalysis.riskScore}%</h3>
             <div className="w-full h-1 bg-white/5 rounded-full mb-3 overflow-hidden">
               <div className="h-full bg-current transition-all duration-1000" style={{ width: `${riskAnalysis.riskScore}%` }}></div>
             </div>
          </div>
        </div>
        <div className="glass-card p-8 rounded-[20px] border-rose-500/10 bg-rose-500/[0.02]">
          <p className="text-[10px] font-black text-rose-500/50 uppercase mb-4">Alertes Critiques</p>
          <h3 className="text-3xl font-bold text-rose-500">{riskAnalysis.highCount}</h3>
        </div>
        <div className="glass-card p-8 rounded-[20px] border-white/5">
          <p className="text-[10px] font-black text-white/30 uppercase mb-4">Capital Exposé</p>
          <h3 className="text-3xl font-bold text-white">{formatCurrency(riskAnalysis.totalRiskAmount, currency)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-md font-bold flex items-center gap-2.5 uppercase tracking-widest text-white/50">
            <ShieldAlert className="text-gold" size={18} /> Incidents Détectés
          </h4>
          <div className="space-y-4">
            {riskAnalysis.risks.map(risk => (
              <div key={risk.id} className="p-6 rounded-[16px] border border-white/5 bg-white/[0.02] flex items-center justify-between hover:border-gold/30 transition-all cursor-pointer" onClick={() => risk.relatedId && onViewCheck?.(risk.relatedId)}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-opacity-10 ${risk.level === RiskLevel.HIGH ? 'bg-rose-500 text-rose-500' : 'bg-amber-500 text-amber-500'}`}>
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{risk.description}</p>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{formatCurrency(risk.amount, currency)}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/10" />
              </div>
            ))}
            {riskAnalysis.risks.length === 0 && (
              <div className="py-20 text-center opacity-20"><ShieldCheck size={40} className="mx-auto mb-4" /><p className="text-xs uppercase font-black tracking-widest">Aucun risque détecté</p></div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-8 rounded-[22px] bg-gold/[0.03] border-gold/10 relative overflow-hidden">
            <h5 className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Sparkles size={14} /> Rapport IA Avancé
            </h5>
            <div className="space-y-4">
              {deepAnalysis ? (
                <div className="text-[11px] text-white/70 leading-relaxed italic prose prose-invert max-w-none">
                  {deepAnalysis}
                </div>
              ) : (
                <div className="py-10 text-center text-[10px] text-white/20 uppercase font-black italic">
                   Activez l'analyse profonde pour des insights stratégiques.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskIntelligence;
