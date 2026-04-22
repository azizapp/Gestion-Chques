
import React, { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle2, Pencil, RotateCcw, ChevronLeft, ChevronRight, Trash2, CheckSquare, Square, X } from 'lucide-react';
import { Check, Currency, CheckType, CheckStatus } from '../types.ts';
import { formatCurrency, getStatusBadge, getTypeBadge } from '../constants.tsx';

interface CheckListProps {
  checks: Check[];
  currency: Currency;
  onAdd: () => void;
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid?: (id: string) => void;
  onBatchMarkAsPaid?: (ids: string[]) => void;
  onBatchDelete?: (ids: string[]) => void;
  isAdmin?: boolean;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const CheckList: React.FC<CheckListProps> = ({ 
  checks, 
  currency, 
  onAdd, 
  onEdit, 
  onMarkAsPaid, 
  onBatchMarkAsPaid,
  onBatchDelete,
  isAdmin 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CheckStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | CheckType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]); // Clear selection when filters change
  }, [searchTerm, dateFilter, statusFilter, typeFilter, itemsPerPage]);

  const handleReset = () => {
    setSearchTerm('');
    setDateFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const isToday = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const filteredChecks = checks.filter(c => {
    const matchesSearch = 
      c.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.check_number.includes(searchTerm) ||
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    let matchesDate = true;
    if (dateFilter !== 'all') {
      if (dateFilter === 'today') matchesDate = isToday(c.due_date);
    }
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const totalPages = Math.ceil(filteredChecks.length / itemsPerPage);
  const paginatedChecks = filteredChecks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedChecks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedChecks.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Batch Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="glass-card border-gold/30 bg-gold/5 backdrop-blur-xl rounded-[20px] p-4 flex items-center justify-between shadow-2xl shadow-gold/10">
            <div className="flex items-center gap-4 pl-2">
              <button onClick={() => setSelectedIds([])} className="text-white/40 hover:text-white">
                <X size={18} />
              </button>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-gold uppercase tracking-widest">Action Groupée</span>
                <span className="text-[9px] text-white/40 uppercase font-bold">{selectedIds.length} instrument{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pr-2">
              <button 
                onClick={() => { onBatchMarkAsPaid?.(selectedIds); setSelectedIds([]); }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <CheckCircle2 size={16} />
                Encaisser
              </button>
              <button 
                onClick={() => { onBatchDelete?.(selectedIds); setSelectedIds([]); }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Trash2 size={16} />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-white italic tracking-tight uppercase">Registre des Opérations</h1>
        <button 
          onClick={onAdd}
          className="bg-gold text-black font-bold text-[11px] uppercase tracking-widest px-8 py-3.5 rounded-[12px] hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus size={16} />
          Nouveau Chèque
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 flex-1 w-full">
          <button 
            onClick={handleReset}
            className="p-3 bg-[#0a0d18] border border-white/5 rounded-[12px] text-white/40 hover:text-white transition-all group"
            title="Réinitialiser les filtres"
          >
            <RotateCcw size={16} className="group-hover:rotate-[-45deg] transition-transform" />
          </button>
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par numéro, entité..."
              className="w-full bg-[#0a0d18] border border-white/5 rounded-[12px] py-3 pl-11 pr-4 text-xs font-medium focus:outline-none focus:border-gold/20 transition-all placeholder:text-white/10 text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#0a0d18] p-1 rounded-[12px] border border-white/5 w-full lg:w-auto">
          {[
            { id: 'all', label: 'Tous' },
            { id: CheckType.INCOMING, label: 'Entrant' },
            { id: CheckType.OUTGOING, label: 'Sortant' }
          ].map((u) => (
            <button 
              key={u.id}
              onClick={() => setTypeFilter(u.id as any)} 
              className={`px-4 py-2 rounded-[10px] text-[9px] font-bold uppercase tracking-tight transition-all ${typeFilter === u.id ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-white/30 hover:text-white/60'}`}
            >
              {u.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-auto min-w-[150px]">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-[#0a0d18] border border-white/5 rounded-[12px] pl-5 pr-10 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-gold/20 appearance-none cursor-pointer text-white/60"
          >
            <option value="all">Statuts: Tous</option>
            <option value={CheckStatus.PENDING}>En attente</option>
            <option value={CheckStatus.PAID}>Payé</option>
            <option value={CheckStatus.RETURNED}>Return</option>
            <option value={CheckStatus.GARANTIE}>Garantie</option>
          </select>
        </div>
      </div>

      <div className="glass-card rounded-[12px] overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 w-10">
                  <button onClick={toggleSelectAll} className="text-white/20 hover:text-gold transition-colors">
                    {selectedIds.length === paginatedChecks.length && paginatedChecks.length > 0 ? <CheckSquare size={18} className="text-gold" /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Référence</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Échéance</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Bénéficiaire/Émetteur</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Montant</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold text-center">Type</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold text-center">État</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedChecks.map((check) => (
                <tr key={check.id} className={`hover:bg-white/[0.015] transition-colors group ${selectedIds.includes(check.id) ? 'bg-gold/[0.03]' : ''}`}>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleSelect(check.id)} className={`transition-colors ${selectedIds.includes(check.id) ? 'text-gold' : 'text-white/10 group-hover:text-white/30'}`}>
                      {selectedIds.includes(check.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-medium text-white/40">
                    {check.check_number}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-semibold text-white/60">
                      {check.due_date ? new Date(check.due_date).toLocaleDateString('fr-FR') : '---'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-white/80">{check.entity_name}</span>
                      <span className="text-[9px] text-white/20 uppercase tracking-widest">{check.bank_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[12px] font-bold text-white">{formatCurrency(check.amount, currency)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">{getTypeBadge(check.type)}</td>
                  <td className="px-6 py-4 text-center">{getStatusBadge(check.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {check.status === CheckStatus.PENDING && (
                        <button onClick={() => onMarkAsPaid?.(check.id)} className="p-2 text-emerald-500/60 hover:text-emerald-400 transition-colors">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button onClick={() => onEdit(check)} className="p-2 text-white/20 hover:text-gold transition-colors">
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedChecks.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-xs font-bold text-white/20 uppercase tracking-widest italic">Aucun instrument trouvé</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredChecks.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01] flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredChecks.length)} sur {filteredChecks.length}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30 uppercase">Lignes:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-[#0a0d18] border border-white/10 rounded-lg text-[10px] text-white px-2 py-1 outline-none focus:border-gold/50"
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

export default CheckList;
