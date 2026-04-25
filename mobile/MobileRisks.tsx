
import React, { useMemo } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingDown, 
  Activity, 
  Clock, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Check, CheckStatus, Currency, RiskLevel, FinancialRisk, CheckType } from '../types.ts';
import { formatCurrency } from '../constants.tsx';

interface MobileRisksProps {
  checks: Check[];
  currency: Currency;
  threshold: number;
  onViewCheck?: (id: string) => void;
}

const MobileRisks: React.FC<MobileRisksProps> = ({ checks, currency, threshold, onViewCheck }) => {
  const riskAnalysis = useMemo(() => {
    const risks: FinancialRisk[] = [];
    const today = new Date();
    
    // 1. Bank Concentration Check
    const bankMap: Record<string, number> = {};
    const totalVolume = checks.reduce((s, c) => s + c.amount, 0);
    checks.forEach(c => bankMap[c.bank_name] = (bankMap[c.bank_name] || 0) + c.amount);
    
    Object.entries(bankMap).forEach(([bank, amount]) => {
      if (amount > totalVolume * 0.5 && checks.length > 2) {
        risks.push({
          id: `conc-${bank}`,
          type: 'concentration',
          level: RiskLevel.MEDIUM,
          description: `Concentration sur ${bank}`,
          amount: amount
        });
      }
    });

    // 2. High Risk Clients
    const badClients = new Set(checks.filter(c => c.status === CheckStatus.RETURNED).map(c => c.entity_name));
    
    // 3. Status & Value Checks
    checks.forEach(c => {
      if (c.status === CheckStatus.RETURNED) {
        risks.push({
          id: `ret-${c.id}`,
          type: 'returned',
          level: RiskLevel.HIGH,
          description: `Retour #${c.check_number}`,
          amount: c.amount,
          relatedId: c.id
        });
      }
      if (c.status === CheckStatus.PENDING && new Date(c.due_date) < today) {
        risks.push({
          id: `over-${c.id}`,
          type: 'overdue',
          level: RiskLevel.HIGH,
          description: `Retard #${c.check_number}`,
          amount: c.amount,
          relatedId: c.id
        });
      }
      if (c.amount >= threshold && c.status === CheckStatus.PENDING) {
        risks.push({
          id: `high-${c.id}`,
          type: 'high_value',
          level: RiskLevel.MEDIUM,
          description: `Montant élevé #${c.check_number}`,
          amount: c.amount,
          relatedId: c.id
        });
      }
    });

    const highCount = risks.filter(r => r.level === RiskLevel.HIGH).length;
    const medCount = risks.filter(r => r.level === RiskLevel.MEDIUM).length;
    const totalRiskAmount = risks.reduce((s, r) => s + r.amount, 0);
    const riskScore = Math.min(100, (highCount * 30) + (medCount * 10));

    const paidIncoming = checks.filter(c => c.status === CheckStatus.PAID && c.type === CheckType.INCOMING).reduce((s, c) => s + c.amount, 0);
    const totalIncoming = checks.filter(c => c.type === CheckType.INCOMING).reduce((s, c) => s + c.amount, 0);
    const recoveryRate = totalIncoming > 0 ? (paidIncoming / totalIncoming) * 100 : 0;
    const overdueIncomingSum = checks.filter(c => c.type === CheckType.INCOMING && c.status === CheckStatus.PENDING && new Date(c.due_date) < today).reduce((s, c) => s + c.amount, 0);

    const entityMap: Record<string, number> = {};
    checks.filter(c => c.status === CheckStatus.PENDING).forEach(c => entityMap[c.entity_name] = (entityMap[c.entity_name] || 0) + c.amount);
    const topEntity = Object.entries(entityMap).sort((a, b) => b[1] - a[1])[0] || [null, 0];
    
    return { 
      risks, 
      totalRiskAmount, 
      riskScore, 
      highCount, 
      medCount, 
      recoveryRate, 
      overdueIncomingSum, 
      topExposureEntityName: topEntity[0], 
      topExposurePercentage: totalVolume > 0 ? (topEntity[1] / totalVolume) * 100 : 0 
    };
  }, [checks, threshold]);

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500">
      {/* Header & Global Score */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black italic uppercase">Sécurité & Risques</h2>
          <p className="text-[10px] text-white/30 font-medium tracking-widest uppercase">Analyse des vulnérabilités mobiles</p>
        </div>

        <div className="glass-card p-6 rounded-[24px] border-white/5 bg-gradient-to-br from-gold/5 to-transparent">
          <div className="flex items-center justify-between mb-4">
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Score de Risque Global</p>
             <Activity size={16} className="text-gold" />
          </div>
          <div className="flex items-end gap-4 mb-4">
            <h3 className={`text-4xl font-black italic tracking-tighter ${riskAnalysis.riskScore > 50 ? 'text-rose-500' : riskAnalysis.riskScore > 20 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {riskAnalysis.riskScore}%
            </h3>
            <p className="text-[10px] text-white/40 font-bold uppercase mb-1.5 tracking-widest">Calculé en Temps Réel</p>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${riskAnalysis.riskScore > 50 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : riskAnalysis.riskScore > 20 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`}
              style={{ width: `${riskAnalysis.riskScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-[22px] border-white/5 bg-white/[0.01]">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Capital à Risque</p>
          <h4 className="text-[15px] font-black text-white">{formatCurrency(riskAnalysis.totalRiskAmount, currency)}</h4>
          <div className="flex items-center gap-1 mt-2 text-rose-500">
            <TrendingDown size={12} />
            <span className="text-[8px] font-black uppercase">Exposition</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-[22px] border-rose-500/10 bg-rose-500/[0.02]">
          <p className="text-[9px] font-black text-rose-500/50 uppercase tracking-widest mb-1">Chèques Retournés</p>
          <h4 className="text-[15px] font-black text-rose-500">{riskAnalysis.risks.filter(r => r.type === 'returned').length}</h4>
          <div className="flex items-center gap-1 mt-2 text-rose-500/40">
            <ShieldAlert size={12} />
            <span className="text-[8px] font-black uppercase">Incidents</span>
          </div>
        </div>
      </div>

      {/* Vulnerability Signals */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 ml-1">Signaux de Vulnérabilité</h4>
        {riskAnalysis.risks.length > 0 ? (
          riskAnalysis.risks.map((risk, i) => (
            <button 
              key={i} 
              onClick={() => risk.relatedId && onViewCheck?.(risk.relatedId)}
              className={`w-full text-left p-4 rounded-[20px] border flex items-center justify-between gap-4 transition-all active:scale-[0.98] ${risk.level === RiskLevel.HIGH ? 'bg-rose-500/5 border-rose-500/20 active:bg-rose-500/10' : 'bg-amber-500/5 border-amber-500/20 active:bg-amber-500/10'} ${risk.relatedId ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl bg-current bg-opacity-10 ${risk.level === RiskLevel.HIGH ? 'text-rose-500' : 'text-amber-500'}`}>
                  {risk.level === RiskLevel.HIGH ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white">{risk.description}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{formatCurrency(risk.amount, currency)}</p>
                </div>
              </div>
              {risk.relatedId && <ChevronRight size={16} className="text-white/20" />}
            </button>
          ))
        ) : (
          <div className="py-12 text-center glass-card rounded-[22px] border-white/5 border-dashed">
            <ShieldCheck size={40} className="mx-auto text-emerald-500/20 mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Environnement Sécurisé</p>
          </div>
        )}
      </div>

      {/* Strategic Intelligence Report */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gold/60 ml-1 flex items-center gap-2">
          <Sparkles size={14} /> Rapport d'Intelligence
        </h4>
        
        <div className="space-y-3">
          {/* Diagnostic de Liquidité */}
          <div className="glass-card p-5 rounded-[22px] border-white/5 bg-black/40">
            <h5 className="text-[9px] font-black uppercase tracking-widest text-white/80 mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold"></div> Diagnostic Liquidité
            </h5>
            <p className="text-[11px] text-white/50 leading-relaxed italic">
              Taux de recouvrement: <span className="text-gold font-bold">{riskAnalysis.recoveryRate.toFixed(1)}%</span>.
              {riskAnalysis.overdueIncomingSum > 0 
                ? ` Retard critique de ${formatCurrency(riskAnalysis.overdueIncomingSum, currency)} détecté.`
                : " Gestion saine du pipeline d'encaissement."}
            </p>
          </div>

          {/* Avis d'Exposition */}
          <div className="glass-card p-5 rounded-[22px] border-white/5 bg-black/40">
            <h5 className="text-[9px] font-black uppercase tracking-widest text-white/80 mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Avis d'Exposition
            </h5>
            <p className="text-[11px] text-white/50 leading-relaxed italic">
              {riskAnalysis.topExposureEntityName 
                ? `Concentration sur ${riskAnalysis.topExposureEntityName} (${riskAnalysis.topExposurePercentage.toFixed(1)}%). Diversification recommandée.`
                : "Exposition équilibrée du portefeuille."}
            </p>
          </div>

          {/* Recommandation */}
          <div className="glass-card p-5 rounded-[22px] border-gold/10 bg-gold/[0.03]">
            <h5 className="text-[9px] font-black uppercase tracking-widest text-gold mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></div> Recommandation IA
            </h5>
            <p className="text-[11px] text-white/70 leading-relaxed italic">
              {riskAnalysis.riskScore > 30 
                ? "Alerte : Priorisez le recouvrement des impayés et provisionnez les sorties critiques sous 72h."
                : "Stabilité confirmée. Profil de risque optimal. Continuez la surveillance des seuils."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileRisks;
