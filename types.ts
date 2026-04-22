
export enum CheckType {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing'
}

export enum CheckStatus {
  PENDING = 'pending',
  PAID = 'paid',
  RETURNED = 'returned',
  GARANTIE = 'garantie'
}

export enum Currency {
  EUR = 'EUR',
  MAD = 'MAD',
  USD = 'USD'
}

export enum RiskLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface FinancialRisk {
  id: string;
  type: 'returned' | 'overdue' | 'high_value' | 'concentration' | 'client_risk';
  level: RiskLevel;
  description: string;
  amount: number;
  relatedId?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  status: 'new' | 'read' | 'closed';
  createdAt: string;
  linkId?: string;
}

export interface Check {
  id: string;
  check_number: string;
  bank_name: string;
  amount: number;
  issue_date: string;
  due_date: string;
  entity_name: string;
  type: CheckType;
  status: CheckStatus;
  notes?: string;
  image_url?: string;
  created_at: string;
  fund_name?: string;
  amount_in_words?: string;
}

export interface SystemSettings {
  user_id?: string;
  company_name: string;
  currency: string;
  timezone: string;
  date_format: string;
  fiscal_start: string;
  alert_before: boolean;
  alert_delay: boolean;
  alert_method: string;
  alert_days: number;
  logo_url: string;
}

export type AppTab = 'dash' | 'checks' | 'dueToday' | 'dueTomorrow' | 'dueWeek' | 'performance' | 'risks' | 'parameters';
