import { Injectable, signal } from '@angular/core';

export type Settore =
  | 'tech' | 'retail' | 'food' | 'manifatturiero' | 'servizi'
  | 'sanita' | 'edilizia' | 'turismo' | 'altro';

export interface SettoreOption {
  id: Settore;
  label: string;
  monogram: string;
  color: string;
}

export const SETTORE_OPTIONS: SettoreOption[] = [
  { id: 'tech',           label: 'Tecnologia & Software',      monogram: 'TS', color: '#6366f1' },
  { id: 'retail',         label: 'Retail & E-commerce',        monogram: 'RE', color: '#f59e0b' },
  { id: 'food',           label: 'Food & Beverage',            monogram: 'FB', color: '#f43f5e' },
  { id: 'manifatturiero', label: 'Manifatturiero & Industria', monogram: 'MI', color: '#475569' },
  { id: 'servizi',        label: 'Servizi Professionali',      monogram: 'SP', color: '#14b8a6' },
  { id: 'sanita',         label: 'Sanità & Benessere',         monogram: 'SB', color: '#10b981' },
  { id: 'edilizia',       label: 'Edilizia & Immobiliare',      monogram: 'EI', color: '#b45309' },
  { id: 'turismo',        label: 'Turismo & Hospitality',      monogram: 'TH', color: '#0ea5e9' },
  { id: 'altro',          label: 'Altro',                      monogram: 'AL', color: '#71717a' },
];

export interface Dipendente {
  ruolo: string;
  nome: string;
  cognome: string;
}

export type BusinessModel =
  | 'b2b' | 'b2c' | 'b2b2c' | 'marketplace' | 'saas'
  | 'ecommerce' | 'freemium' | 'licensing' | 'franchising';

export interface BusinessModelOption {
  id: BusinessModel;
  label: string;
  monogram: string;
  color: string;
}

export const BUSINESS_MODEL_OPTIONS: BusinessModelOption[] = [
  { id: 'b2b',          label: 'Business to Business',  monogram: 'B2',  color: '#4338ca' },
  { id: 'b2c',          label: 'Business to Consumer',  monogram: 'C2',  color: '#db2777' },
  { id: 'b2b2c',        label: 'Business to Business to Consumer', monogram: 'B3', color: '#7c3aed' },
  { id: 'marketplace',  label: 'Marketplace / Piattaforma', monogram: 'MP', color: '#0891b2' },
  { id: 'saas',         label: 'SaaS & Abbonamento',    monogram: 'SA',  color: '#2563eb' },
  { id: 'ecommerce',    label: 'E-commerce',            monogram: 'EC',  color: '#ea580c' },
  { id: 'freemium',     label: 'Freemium',              monogram: 'FM',  color: '#16a34a' },
  { id: 'licensing',    label: 'Licensing / Royalty',   monogram: 'LC',  color: '#ca8a04' },
  { id: 'franchising',  label: 'Franchising',           monogram: 'FZ',  color: '#475569' },
];

export interface CountryOption {
  code: string;
  label: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'it', label: 'Italia' },
  { code: 'fr', label: 'Francia' },
  { code: 'de', label: 'Germania' },
  { code: 'es', label: 'Spagna' },
  { code: 'pt', label: 'Portogallo' },
  { code: 'gb', label: 'Regno Unito' },
  { code: 'ch', label: 'Svizzera' },
  { code: 'at', label: 'Austria' },
  { code: 'nl', label: 'Paesi Bassi' },
  { code: 'be', label: 'Belgio' },
  { code: 'ie', label: 'Irlanda' },
  { code: 'pl', label: 'Polonia' },
  { code: 'se', label: 'Svezia' },
  { code: 'us', label: 'Stati Uniti' },
  { code: 'ca', label: 'Canada' },
  { code: 'br', label: 'Brasile' },
  { code: 'ae', label: 'Emirati Arabi Uniti' },
  { code: 'cn', label: 'Cina' },
  { code: 'jp', label: 'Giappone' },
  { code: 'au', label: 'Australia' },
];

export interface Azienda {
  id: string;
  nome: string;
  descrizione: string;
  isStartup: boolean;
  isInnovativa: boolean;
  settore: Settore;
  isCostituita: boolean;
  storicoDocumento?: { name: string; size: number } | null;
  teamEtaGiovane?: boolean | null;
  dipendenti?: Dipendente[];
  sedi?: string[];
  businessModel?: BusinessModel | null;
  createdAt: Date;
}

export type NuovaAzienda = Omit<Azienda, 'id' | 'createdAt'>;

@Injectable({ providedIn: 'root' })
export class CompanyService {
  readonly companies = signal<Azienda[]>([]);

  addCompany(data: NuovaAzienda): Azienda {
    const azienda: Azienda = {
      ...data,
      id: `azienda-${Date.now()}`,
      createdAt: new Date(),
    };
    this.companies.update(list => [azienda, ...list]);
    return azienda;
  }

  removeCompany(id: string): void {
    this.companies.update(list => list.filter(a => a.id !== id));
  }

  updateCompany(id: string, data: NuovaAzienda): void {
    this.companies.update(list =>
      list.map(a => (a.id === id ? { ...a, ...data } : a))
    );
  }
}
