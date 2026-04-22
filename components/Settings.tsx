
import React, { useRef, useEffect, useState } from 'react';
import { Camera, Save, Globe, Building2, Bell, Shield, Coins, Smartphone, CalendarDays, Loader2, Building } from 'lucide-react';
import { SystemSettings } from '../types.ts';

interface SettingsProps {
  settings: SystemSettings;
  onSave: (settings: SystemSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLocalSettings({ ...localSettings, logo_url: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(localSettings);
    setSaving(false);
  };

  const NotificationToggle = ({ label, desc, active, onClick }: any) => (
    <div className="flex items-center justify-between p-5 bg-[#0A0D18]/40 border border-white/5 rounded-[20px] group transition-all hover:border-white/10 cursor-pointer" onClick={onClick}>
      <div className="space-y-1">
        <p className="text-white text-xs font-bold tracking-tight">{label}</p>
        <p className="text-white/30 text-[9px] font-bold uppercase tracking-wider">{desc}</p>
      </div>
      <div className={`relative w-11 h-6 rounded-full transition-all border ${active ? 'bg-gold/10 border-gold' : 'bg-white/5 border-white/10'}`}>
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all ${active ? 'translate-x-5 bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]' : 'translate-x-0 bg-white/20'}`} />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Paramètres</h2>
          <p className="text-white/40 text-sm">Gestion de l'infrastructure et sécurité système</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-gold text-black font-black text-[11px] uppercase tracking-[0.2em] px-10 py-4 rounded-[14px] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-2xl shadow-gold/20"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          ENREGISTRER
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: General Settings Card */}
        <div className="glass-card p-10 rounded-[2.5rem] border-white/5 shadow-2xl space-y-10">
          <div className="flex items-center gap-4 text-gold">
            <Building2 size={24} />
            <h4 className="text-sm font-black tracking-[0.2em] uppercase">PARAMÈTRES GÉNÉRAUX</h4>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">NOM DE L'ENTREPRISE</label>
              <input 
                value={localSettings.company_name} 
                onChange={e => setLocalSettings({...localSettings, company_name: e.target.value})} 
                className="w-full bg-[#0A0D18] border border-white/5 rounded-2xl py-4 px-6 text-white text-sm font-bold outline-none focus:border-gold/30 transition-all" 
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">LOGO DE L'ENTREPRISE</label>
              <div className="flex items-center gap-8">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 bg-[#0A0D18] border border-white/5 rounded-[2rem] flex items-center justify-center text-white/10 shadow-inner group cursor-pointer hover:border-gold/30 transition-all"
                >
                   {localSettings.logo_url ? (
                     <img src={localSettings.logo_url} className="w-full h-full object-contain p-2" />
                   ) : (
                     <Building size={36} className="group-hover:text-gold transition-colors" />
                   )}
                </div>
                <div className="text-[10px] font-black space-y-1 uppercase tracking-widest">
                  <p className="text-white/40">512x512 px</p>
                  <p className="text-white/20">PNG / JPG</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">DEVISE PAR DÉFAUT</label>
                <input value={localSettings.currency} onChange={e => setLocalSettings({...localSettings, currency: e.target.value})} className="w-full bg-[#0A0D18] border border-white/5 rounded-2xl py-4 px-6 text-white text-sm font-bold outline-none focus:border-gold/30" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">FUSEAU HORAIRE</label>
                <input value={localSettings.timezone} onChange={e => setLocalSettings({...localSettings, timezone: e.target.value})} className="w-full bg-[#0A0D18] border border-white/5 rounded-2xl py-4 px-6 text-white text-sm font-bold outline-none focus:border-gold/30" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">FORMAT DE DATE</label>
                <select 
                  value={localSettings.date_format} 
                  onChange={e => setLocalSettings({...localSettings, date_format: e.target.value})} 
                  className="w-full bg-[#0A0D18] border border-white/5 rounded-2xl py-4 px-6 text-white text-sm font-bold outline-none focus:border-gold/30 appearance-none cursor-pointer"
                >
                   <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                   <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                   <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">DÉBUT DE L'EXERCICE FISCAL</label>
                <input type="date" value={localSettings.fiscal_start} onChange={e => setLocalSettings({...localSettings, fiscal_start: e.target.value})} className="w-full bg-[#0A0D18] border border-white/5 rounded-2xl py-4 px-6 text-white text-sm font-bold outline-none focus:border-gold/30 [color-scheme:dark]" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Notification Settings Card */}
        <div className="glass-card p-10 rounded-[2.5rem] border-white/5 shadow-2xl space-y-10">
          <div className="flex items-center gap-4 text-gold">
            <Bell size={24} />
            <h4 className="text-sm font-black tracking-[0.2em] uppercase">PARAMÈTRES DE NOTIFICATION</h4>
          </div>

          <div className="space-y-6">
            <NotificationToggle 
              label="Alertes avant échéance" 
              desc="Recevoir des alertes à l'avance" 
              active={localSettings.alert_before} 
              onClick={() => setLocalSettings({...localSettings, alert_before: !localSettings.alert_before})}
            />
            <NotificationToggle 
              label="Alertes chèques en retard" 
              desc="Alertes pour chèques en retard" 
              active={localSettings.alert_delay} 
              onClick={() => setLocalSettings({...localSettings, alert_delay: !localSettings.alert_delay})}
            />
            <NotificationToggle 
              label="Méthode: In-app et sur interface mobile" 
              desc="Multi-plateforme" 
              active={localSettings.alert_method === 'all'} 
              onClick={() => setLocalSettings({...localSettings, alert_method: localSettings.alert_method === 'all' ? 'app' : 'all'})}
            />

            <div className="pt-10 space-y-8">
               <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">NOMBRE DE JOURS AVANT L'ALERTE</label>
                  <div className="w-10 h-10 bg-[#0A0D18] border border-white/5 rounded-xl flex items-center justify-center text-gold font-bold text-sm shadow-inner">{localSettings.alert_days}</div>
               </div>
               <div className="relative group">
                 <input 
                    type="range" min="1" max="30" value={localSettings.alert_days} 
                    onChange={e => setLocalSettings({...localSettings, alert_days: parseInt(e.target.value)})} 
                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-gold" 
                 />
                 <div className="flex justify-between mt-4 text-[9px] font-black text-white/10 uppercase tracking-widest">
                    <span>1 JOUR</span>
                    <span>30 JOURS</span>
                 </div>
               </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex items-center gap-4">
            <div className="p-3 bg-gold/10 rounded-xl text-gold border border-gold/10">
               <Shield size={20} />
            </div>
            <div>
               <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">Sécurité Redondante</p>
               <p className="text-[9px] text-white/20 uppercase font-medium">Notifications chiffrées de bout en bout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
