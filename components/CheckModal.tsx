
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2, Upload, Receipt, Calendar, Building2, User, DollarSign, Fingerprint, ShieldCheck, StickyNote, Wallet } from 'lucide-react';
import { Check, CheckType, CheckStatus } from '../types.ts';
import { extractCheckData } from '../services/geminiService.ts';

interface CheckModalProps {
  onClose: () => void;
  onSave: (check: Partial<Check>) => void;
  initialData?: Check | null;
}

const InputWrapper = ({ label, icon: Icon, children }: any) => (
  <div className="space-y-1.5 group">
    <label className="text-[10px] uppercase tracking-widest text-white/30 font-black ml-1 group-focus-within:text-gold transition-colors">
      {label}
    </label>
    <div className="relative rounded-[14px] border border-white/10 bg-white/5 transition-all duration-300 focus-within:border-gold/50 focus-within:bg-gold/[0.02] focus-within:ring-1 focus-within:ring-gold/20">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors">
        <Icon size={18} />
      </div>
      {children}
    </div>
  </div>
);

const CheckModal: React.FC<CheckModalProps> = ({ onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Check>>(
    initialData || {
      check_number: '',
      bank_name: '',
      amount: 0,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      entity_name: '',
      type: CheckType.INCOMING,
      status: CheckStatus.PENDING,
      notes: '',
      image_url: '',
      fund_name: '',
      amount_in_words: '',
    }
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, image_url: base64 }));

      const extracted = await extractCheckData(base64);
      if (extracted) {
        setFormData(prev => ({
          ...prev,
          ...extracted,
          // الاحتفاظ بتاريخ الإصدار الحالي (اليوم) وعدم استبداله بالبيانات المستخرجة
          issue_date: prev.issue_date,
          due_date: extracted.due_date || prev.due_date,
          notes: extracted.notes || prev.notes,
        }));
      }
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[24px] flex flex-col shadow-2xl border-white/10 animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h2 className="text-xl md:text-2xl font-black italic tracking-tight text-white uppercase">
              {initialData ? 'Modifier l\'instrument' : 'Nouveau Dépôt'}
            </h2>
            <p className="text-[10px] text-gold font-black tracking-widest uppercase opacity-70">
              {isProcessing ? 'Analyse IA en cours...' : 'Coffre-fort Numérique'}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-3 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white border border-transparent hover:border-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Combined Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-8">
          
          {/* Integrated Image Section */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest text-white/30 font-black ml-1">
              Capture & Analyse OCR
            </label>
            <div className="relative">
              {isProcessing ? (
                <div className="w-full aspect-[21/9] bg-gold/5 border-2 border-dashed border-gold/30 rounded-[20px] flex flex-col items-center justify-center gap-4 animate-pulse">
                  <Loader2 className="w-12 h-12 text-gold animate-spin" />
                  <p className="text-gold font-black text-[10px] uppercase tracking-[0.2em]">Extraction des données...</p>
                </div>
              ) : formData.image_url ? (
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-full aspect-[21/9] rounded-[20px] overflow-hidden border-2 border-white/5 group-hover:border-gold/30 transition-all shadow-2xl">
                    <img src={formData.image_url} className="w-full h-full object-cover" alt="Chèque" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="text-white" size={32} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Changer l'image</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-[21/9] border-2 border-dashed border-white/5 rounded-[20px] flex flex-col items-center justify-center gap-4 hover:border-gold/20 hover:bg-gold/5 transition-all group bg-white/[0.02]"
                >
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/5">
                    <Upload className="text-white/20 group-hover:text-gold" size={24} />
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-black text-white/40 uppercase tracking-widest block">Déposer ou scanner le chèque</span>
                    <span className="text-[9px] text-white/10 uppercase tracking-widest mt-1 block italic">Supporte JPG, PNG, WEBP</span>
                  </div>
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-8">
            
            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-4">
               <button 
                 type="button"
                 onClick={() => setFormData({...formData, type: CheckType.INCOMING})}
                 className={`py-4 rounded-[16px] border font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${formData.type === CheckType.INCOMING ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-transparent text-white/20 hover:bg-white/10'}`}
               >
                 <Receipt size={16} /> Entrant
               </button>
               <button 
                 type="button"
                 onClick={() => setFormData({...formData, type: CheckType.OUTGOING})}
                 className={`py-4 rounded-[16px] border font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${formData.type === CheckType.OUTGOING ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'bg-white/5 border-transparent text-white/20 hover:bg-white/10'}`}
               >
                 <Receipt size={16} /> Sortant
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputWrapper label="Numéro de Chèque" icon={Fingerprint}>
                <input 
                  ref={firstInputRef}
                  value={formData.check_number}
                  onChange={e => setFormData({...formData, check_number: e.target.value})}
                  className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-semibold focus:outline-none placeholder:text-white/5"
                  placeholder="Ex: 12345678"
                />
              </InputWrapper>
              
              <InputWrapper label="Montant Numérique" icon={DollarSign}>
                <input 
                  type="number"
                  step="any"
                  value={formData.amount || ''}
                  onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                  className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-black focus:outline-none placeholder:text-white/5"
                  placeholder="0.00"
                />
              </InputWrapper>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputWrapper label="Bénéficiaire / Émetteur" icon={User}>
                <input 
                  value={formData.fund_name || ''}
                  onChange={e => setFormData({...formData, fund_name: e.target.value})}
                  className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-semibold focus:outline-none placeholder:text-white/5"
                  placeholder="Nom de l'entité"
                />
              </InputWrapper>

              <InputWrapper label="Institution Bancaire" icon={Building2}>
                <input 
                  value={formData.bank_name}
                  onChange={e => setFormData({...formData, bank_name: e.target.value})}
                  className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-semibold focus:outline-none placeholder:text-white/5"
                  placeholder="Ex: CIH, BMCE..."
                />
              </InputWrapper>
            </div>

            <InputWrapper label="Nom du Fonds / Compte" icon={Wallet}>
              <input 
                value={formData.entity_name}
                onChange={e => setFormData({...formData, entity_name: e.target.value})}
                className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-semibold focus:outline-none placeholder:text-white/5"
                placeholder="Ex: Fonds de Commerce, Caisse A..."
              />
            </InputWrapper>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputWrapper label="Date d'Émission" icon={Calendar}>
                <input 
                  type="date"
                  value={formData.issue_date}
                  onChange={e => setFormData({...formData, issue_date: e.target.value})}
                  className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-semibold focus:outline-none [color-scheme:dark]"
                />
              </InputWrapper>
              <InputWrapper label="Date d'Échéance" icon={Calendar}>
                <input 
                  type="date"
                  value={formData.due_date}
                  onChange={e => setFormData({...formData, due_date: e.target.value})}
                  className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-semibold focus:outline-none [color-scheme:dark]"
                />
              </InputWrapper>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 group">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-black ml-1 group-focus-within:text-gold transition-colors">Statut Actuel</label>
                <div className="relative rounded-[14px] border border-white/10 bg-white/5 transition-all duration-300 focus-within:border-gold/50 focus-within:bg-gold/[0.02]">
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as CheckStatus})}
                    className="w-full bg-transparent border-none py-4 px-6 text-white text-sm font-semibold focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value={CheckStatus.PENDING} className="bg-slate-900">En attente</option>
                    <option value={CheckStatus.PAID} className="bg-slate-900">Payé</option>
                    <option value={CheckStatus.RETURNED} className="bg-slate-900">Return</option>
                    <option value={CheckStatus.GARANTIE} className="bg-slate-900">Garantie</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-focus-within:text-gold">
                    <Receipt size={14} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 px-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[14px]">
                 <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <ShieldCheck size={20} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Sécurité Active</p>
                    <p className="text-[10px] text-white/30 font-medium">Chiffrement AES-256</p>
                 </div>
              </div>
            </div>

            <div className="space-y-1.5 group">
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-black ml-1 group-focus-within:text-gold transition-colors">Observations & Notes</label>
              <div className="relative rounded-[14px] border border-white/10 bg-white/5 transition-all duration-300 focus-within:border-gold/50 focus-within:bg-gold/[0.02]">
                <div className="absolute left-4 top-4 text-white/20 group-focus-within:text-gold transition-colors">
                  <StickyNote size={18} />
                </div>
                <textarea 
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-semibold focus:outline-none min-h-[100px] resize-none"
                  placeholder="Informations additionnelles..."
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                className="w-full py-5 bg-gold text-black rounded-[16px] font-black text-[11px] uppercase tracking-[0.2em] gold-glow hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3"
              >
                {initialData ? 'Mettre à jour le registre' : 'Enregistrer dans le coffre'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckModal;
