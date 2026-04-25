
import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX,
  Calendar,
  Clock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { AppTab } from '../types.ts';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  companyName: string;
  logoUrl: string;
  onLogout: () => void;
  userEmail?: string;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  companyName, 
  logoUrl, 
  onLogout, 
  userEmail,
  isCollapsed,
  setIsCollapsed
}) => {
  const isAdmin = userEmail === 'admin@apollo.com';
  const isRestrictedUser = userEmail === 'user@apollo.com';
  
  const allMenuItems: { id: AppTab; label: string; icon: any }[] = [
    { id: 'dash', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'checks', label: 'Chèques', icon: Receipt },
    { id: 'dueToday', label: "À Payer Aujourd'hui", icon: Calendar },
    { id: 'dueTomorrow', label: 'À Payer Demain', icon: Clock },
    { id: 'dueWeek', label: 'Cette Semaine', icon: CalendarDays },
    { id: 'performance', label: 'Rapports', icon: BarChart3 },
    { id: 'risks', label: 'Sécurité & Risques', icon: ShieldX },
    { id: 'parameters', label: 'Paramètres', icon: Settings },
  ];

  // Filter items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    if (isRestrictedUser) {
      // Allow restricted users to see checks, risks and the new due-pages
      return (
        item.id === 'checks' ||
        item.id === 'risks' ||
        item.id === 'dueToday' ||
        item.id === 'dueTomorrow' ||
        item.id === 'dueWeek'
      );
    }
    return true; // Admin and others see everything
  });

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-72'} h-screen flex flex-col glass-card border-r border-white/5 sticky top-0 transition-all duration-500 ease-in-out z-50`}>
      {/* Header & Toggle */}
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4 relative`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-500">
            <div className="w-9 h-9 rounded-[10px] bg-transparent border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <ShieldCheck className="text-gold" size={20} />
              )}
            </div>
            <div className="overflow-hidden">
              <h1 className="text-sm font-black tracking-tighter text-white uppercase italic truncate">FINANSSE</h1>
              <p className="text-[8px] text-gold font-black tracking-widest uppercase opacity-70 truncate">{companyName || 'Pro'}</p>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg bg-white/5 hover:bg-gold/10 text-white/40 hover:text-gold transition-all ${isCollapsed ? '' : 'absolute -right-3 top-12 bg-[#0a0d18] border border-white/5'}`}
        >
          {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Identity Card */}
      {!isCollapsed && (
        <div className="px-6 mb-6 animate-in fade-in duration-500">
          <div className="p-4 rounded-[12px] bg-white/[0.02] border border-white/5">
            <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5">Identité Active</p>
            <p className="text-[10px] font-medium text-white/70 truncate mb-2">{userEmail}</p>
            {isAdmin ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-gold/10 border border-gold/20 w-fit">
                <ShieldAlert size={9} className="text-gold" />
                <span className="text-[8px] font-bold text-gold uppercase tracking-widest">Admin</span>
              </div>
            ) : isRestrictedUser ? (
               <div className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-blue-500/10 border border-blue-500/20 w-fit">
                <ShieldCheck size={9} className="text-blue-400" />
                <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Restreint</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 w-fit">
                <ShieldCheck size={9} className="text-emerald-400" />
                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">User</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3.5 px-5'} py-3.5 rounded-[12px] transition-all duration-300 group relative ${
                isActive 
                  ? 'bg-gold/10 text-gold border border-gold/10' 
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon size={18} className={isActive ? 'text-gold' : 'group-hover:text-white/60'} />
              {!isCollapsed && (
                <span className="font-semibold text-[13px] animate-in fade-in slide-in-from-left-1">{item.label}</span>
              )}
              {isActive && !isCollapsed && <div className="ml-auto w-1 h-1 rounded-full bg-gold" />}
              {isActive && isCollapsed && (
                <div className="absolute left-0 w-1 h-6 bg-gold rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className={`p-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button 
          onClick={onLogout}
          className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-5 py-3.5'} w-full rounded-[12px] text-rose-400/80 hover:bg-rose-500/10 transition-all font-semibold text-[13px] border border-transparent hover:border-rose-500/10`}
          title={isCollapsed ? 'Déconnexion' : ''}
        >
          <LogOut size={18} />
          {!isCollapsed && <span className="animate-in fade-in">Déconnexion</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
