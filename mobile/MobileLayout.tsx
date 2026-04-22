
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Plus,
  Receipt
} from 'lucide-react';
import { AppTab, Check, SystemSettings } from '../types.ts';
import { supabase, isConfigured } from '../supabase.ts';
import MobileDashboard from './MobileDashboard.tsx';
import MobileRisks from './MobileRisks.tsx';
import MobileCheckList from './MobileCheckList.tsx';
import CheckModal from '../components/CheckModal.tsx';

interface MobileLayoutProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  checks: Check[];
  settings: SystemSettings;
  onSaveCheck: (data: Partial<Check>) => void;
  onDeleteCheck: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
  onLogout: () => void;
  isAdmin: boolean;
  userEmail?: string;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  activeTab, setActiveTab, checks, settings, onSaveCheck, onDeleteCheck, onMarkAsPaid, onLogout, isAdmin, userEmail 
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);

  const isRestrictedUser = userEmail === 'user@apollo.com';

  const openCheckModal = async (checkOrId: Check | string | null) => {
    if (checkOrId === null) {
      setEditingCheck(null);
      setIsAddOpen(true);
      return;
    }

    let check: Check;
    if (typeof checkOrId === 'string') {
      const found = checks.find(c => c.id === checkOrId);
      if (!found) return;
      check = found;
    } else {
      check = checkOrId;
    }

    if (!check.image_url && isConfigured) {
      try {
        const { data, error } = await supabase
          .from('checks')
          .select('image_url')
          .eq('id', check.id)
          .single();
        if (!error && data?.image_url) {
          setEditingCheck({ ...check, image_url: data.image_url });
          setIsAddOpen(true);
          return;
        }
      } catch (e) {
        console.error('Failed to fetch check image:', e);
      }
    }
    setEditingCheck(check);
    setIsAddOpen(true);
  };

  // Simplified content rendering for mobile
  const renderContent = () => {
    switch (activeTab) {
      case 'dash': 
        if (isRestrictedUser) return null;
        return (
          <MobileDashboard 
            checks={checks} 
            currency={settings.currency as any} 
            onEdit={(c) => openCheckModal(c)}
            onMarkAsPaid={onMarkAsPaid}
          />
        );
      case 'checks':
        return (
          <MobileCheckList
            checks={checks}
            currency={settings.currency as any}
            onEdit={(c) => openCheckModal(c)}
            onDelete={onDeleteCheck}
            onMarkAsPaid={onMarkAsPaid}
          />
        );
      case 'risks': return (
        <MobileRisks 
          checks={checks} 
          currency={settings.currency as any} 
          threshold={50000} 
          onViewCheck={(id) => openCheckModal(id)}
        />
      );
      default: return (
        <MobileDashboard 
          checks={checks} 
          currency={settings.currency as any} 
          onEdit={(c) => { setEditingCheck(c); setIsAddOpen(true); }}
          onMarkAsPaid={onMarkAsPaid}
        />
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#05070a] text-white">
      {/* Header - Cleaned up */}
      <header className="p-6 pt-10 flex items-center justify-between sticky top-0 bg-[#05070a]/80 backdrop-blur-lg z-30">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase">FINANSSE</h1>
          <p className="text-[8px] text-gold font-black tracking-widest uppercase">{settings.company_name}</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="px-3 py-1 rounded-full border border-white/5 bg-white/5">
              <span className="text-[8px] font-black text-gold uppercase tracking-widest">Live PRO</span>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-32 pt-4 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Bottom Navigation with Integrated Plus Button */}
      <nav className="fixed bottom-0 left-0 right-0 p-6 z-40 pointer-events-none">
        <div className="max-w-md mx-auto glass-card rounded-[30px] border-white/5 flex items-center justify-around py-3 px-4 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          
          {/* Dashboard Tab - Hidden for restricted user */}
          {!isRestrictedUser && (
            <button
              onClick={() => setActiveTab('dash')}
              className={`flex flex-col items-center justify-center transition-all duration-300 ${activeTab === 'dash' ? 'text-gold' : 'text-white/20'}`}
            >
              <LayoutDashboard size={22} className={activeTab === 'dash' ? 'scale-110' : ''} />
              <span className="text-[8px] font-black uppercase tracking-widest mt-1">Accueil</span>
            </button>
          )}

          {/* Checks Tab - Explicitly added for restricted user or anyone */}
          <button
            onClick={() => setActiveTab('checks')}
            className={`flex flex-col items-center justify-center transition-all duration-300 ${activeTab === 'checks' ? 'text-gold' : 'text-white/20'}`}
          >
            <Receipt size={22} className={activeTab === 'checks' ? 'scale-110' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest mt-1">Chèques</span>
          </button>

          {/* Central Plus Action Button */}
          <button 
            onClick={() => openCheckModal(null)}
            className="w-14 h-14 bg-gold rounded-[20px] flex items-center justify-center text-black shadow-[0_10px_20px_rgba(212,175,55,0.3)] active:scale-90 transition-all -translate-y-4 border-4 border-[#05070a]"
          >
            <Plus size={28} />
          </button>

          {/* Risks Tab */}
          <button
            onClick={() => setActiveTab('risks')}
            className={`flex flex-col items-center justify-center transition-all duration-300 ${activeTab === 'risks' ? 'text-gold' : 'text-white/20'}`}
          >
            <ShieldAlert size={22} className={activeTab === 'risks' ? 'scale-110' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest mt-1">Risques</span>
          </button>

        </div>
      </nav>

      {isAddOpen && (
        <CheckModal 
          onClose={() => setIsAddOpen(false)}
          onSave={onSaveCheck}
          initialData={editingCheck}
        />
      )}
    </div>
  );
};

export default MobileLayout;
