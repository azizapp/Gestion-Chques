
import React from 'react';
import { LogOut, ShieldCheck, Building2, UserCircle, Globe } from 'lucide-react';
import { SystemSettings } from '../types.ts';

interface MobileSettingsProps {
  settings: SystemSettings;
  onLogout: () => void;
  isAdmin: boolean;
}

const MobileSettings: React.FC<MobileSettingsProps> = ({ settings, onLogout, isAdmin }) => {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-black italic uppercase">Config</h2>
        <p className="text-[10px] text-white/30 font-medium tracking-widest uppercase">Paramètres du système</p>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-6 rounded-[24px] border-white/5">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                 <Building2 size={24} />
              </div>
              <div>
                 <h4 className="text-sm font-bold text-white">{settings.company_name}</h4>
                 <p className="text-[9px] text-white/30 uppercase tracking-widest">Compte vérifié</p>
              </div>
           </div>

           <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Globe size={16} className="text-white/20" />
                    <span className="text-xs font-medium">Devise Locale</span>
                 </div>
                 <span className="text-[10px] font-black text-gold">{settings.currency}</span>
              </div>
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="text-white/20" />
                    <span className="text-xs font-medium">Privilèges</span>
                 </div>
                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">{isAdmin ? 'Admin' : 'Utilisateur'}</span>
              </div>
           </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full py-4 bg-rose-500/10 border border-rose-500/20 rounded-[20px] text-rose-500 font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3"
        >
          <LogOut size={18} />
          Déconnexion Sécurisée
        </button>

        <div className="text-center pt-10">
           <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.3em]">{settings.company_name} V1.1.2</p>
           <p className="text-[8px] font-medium text-white/5 mt-1 tracking-widest uppercase">AES-256 ENCRYPTED ENVIRONMENT</p>
        </div>
      </div>
    </div>
  );
};

export default MobileSettings;