
import React, { useState } from 'react';
import { Search, MoreVertical, Edit2, Trash2, CheckCircle, Banknote } from 'lucide-react';
import { Check, Currency, CheckStatus } from '../types.ts';
import { formatCurrency, getStatusBadge } from '../constants.tsx';

interface MobileCheckListProps {
  checks: Check[];
  currency: Currency;
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
}

const MobileCheckList: React.FC<MobileCheckListProps> = ({ checks, currency, onEdit, onDelete, onMarkAsPaid }) => {
  const [search, setSearch] = useState('');
  const [activeActions, setActiveActions] = useState<string | null>(null);

  const filtered = checks.filter(c => 
    c.entity_name.toLowerCase().includes(search.toLowerCase()) || 
    c.check_number.includes(search)
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par numéro ou entité..."
          className="w-full bg-white/5 border border-white/10 rounded-[16px] py-3.5 pl-12 pr-4 text-xs focus:outline-none focus:border-gold/30 transition-all placeholder:text-white/10"
        />
      </div>

      <div className="space-y-4 pb-10">
        {filtered.map((check) => (
          <div key={check.id} className="glass-card rounded-[22px] border-white/5 overflow-hidden relative">
            <div className="p-5 flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-[14px] bg-white/5 flex items-center justify-center text-white/20 shrink-0">
                  <Banknote size={20} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-white mb-0.5">{check.entity_name}</h4>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">{check.bank_name}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveActions(activeActions === check.id ? null : check.id)}
                className="p-2 text-white/20"
              >
                <MoreVertical size={18} />
              </button>
            </div>

            <div className="px-5 pb-5 flex items-end justify-between">
               <div>
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Montant Opérationnel</p>
                  <p className="text-lg font-black text-white">{formatCurrency(check.amount, currency)}</p>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Échéance</p>
                  <p className="text-[10px] font-bold text-white/60">{new Date(check.due_date).toLocaleDateString()}</p>
               </div>
            </div>

            <div className="px-5 pb-4">
              {getStatusBadge(check.status)}
            </div>

            {/* Floating Actions Overlay */}
            {activeActions === check.id && (
              <div className="absolute inset-0 bg-black/95 flex items-center justify-around px-4 animate-in fade-in duration-200">
                <button onClick={() => { onEdit(check); setActiveActions(null); }} className="flex flex-col items-center gap-2 text-gold">
                  <Edit2 size={24} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Éditer</span>
                </button>
                {check.status === CheckStatus.PENDING && (
                  <button onClick={() => { onMarkAsPaid(check.id); setActiveActions(null); }} className="flex flex-col items-center gap-2 text-emerald-400">
                    <CheckCircle size={24} />
                    <span className="text-[8px] font-black uppercase tracking-widest">Encaisser</span>
                  </button>
                )}
                <button onClick={() => { onDelete(check.id); setActiveActions(null); }} className="flex flex-col items-center gap-2 text-rose-500">
                  <Trash2 size={24} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Supprimer</span>
                </button>
                <button onClick={() => setActiveActions(null)} className="absolute top-4 right-4 text-white/20 font-black text-xs">X</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileCheckList;
