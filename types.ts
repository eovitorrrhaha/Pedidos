
export enum OrderStatus {
  PENDING = 'PENDENTE',
  IN_PROGRESS = 'EM_ANDAMENTO',
  READY = 'PRONTO',
  DELIVERED = 'ENTREGUE'
}

export enum ServiceStatus {
  PENDING = 'PENDENTE',
  IN_PROGRESS = 'EM_ANDAMENTO',
  COMPLETED = 'CONCLUÍDO'
}

export interface Luthier {
  id: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  isCompleted: boolean;
}

export interface Service {
  id: string;
  description: string;
  price: number;
  status: ServiceStatus;
  checklist: ChecklistItem[];
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  description?: string;
}

export interface InstrumentInfo {
  type: string;
  brand: string;
}

export interface CustomerInfo {
  name: string;
  contact: string;
  phone: string;
}

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  instrument: InstrumentInfo;
  services: Service[];
  payments: Payment[];
  entryDate: string;
  deliveryDate: string;
  status: OrderStatus;
  notes: string;
  handwrittenNoteImages: string[];
  luthierId?: string;
}

export interface AppSettings {
  instrumentTypes: string[];
  brands: string[];
  predefinedServices: { description: string; price: number }[];
  luthiers: Luthier[];
}
