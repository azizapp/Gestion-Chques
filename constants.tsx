
import React from 'react';
import { CheckStatus, CheckType, Currency } from './types.ts';

export const COLORS = {
  background: '#05070a',
  card: '#0a0d18',
  gold: '#D4AF37',
  success: '#10b981', 
  risk: '#ef4444',    
};

/**
 * Formats currency amounts. 
 */
export const formatCurrency = (amount: number, currency: Currency, includeSymbol: boolean = false) => {
  const locales: Record<Currency, string> = {
    [Currency.EUR]: 'fr-FR',
    [Currency.MAD]: 'fr-MA',
    [Currency.USD]: 'en-US',
  };

  const safeAmount = amount || 0;
  const locale = locales[currency] || 'fr-MA';

  return new Intl.NumberFormat(locale, {
    style: includeSymbol ? 'currency' : 'decimal',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};

export const getStatusBadge = (status: CheckStatus) => {
  switch (status) {
    case CheckStatus.PAID:
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Payé</span>;
    case CheckStatus.RETURNED:
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20">Return</span>;
    case CheckStatus.PENDING:
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">En attente</span>;
    case CheckStatus.GARANTIE:
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">Garantie</span>;
    default:
      return null;
  }
};

export const getTypeBadge = (type: CheckType) => {
  return type === CheckType.INCOMING ? (
    <span className="text-emerald-400 text-xs font-bold">Entrant</span>
  ) : (
    <span className="text-rose-400 text-xs font-bold">Sortant</span>
  );
};
