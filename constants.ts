
import { AppSettings, OrderStatus, ServiceStatus } from './types';

export const INITIAL_SETTINGS: AppSettings = {
  instrumentTypes: [
    'Violão Nylon', 
    'Violão Aço', 
    'Guitarra', 
    'Baixo', 
    'Ukulele', 
    'Cavaquinho', 
    'Mandolim', 
    'Viola'
  ],
  brands: ['Fender', 'Gibson', 'Ibanez', 'Tagima', 'Taylor', 'Martin', 'Yamaha', 'Epiphone'],
  predefinedServices: [
    { description: 'Regulagem Completa', price: 180 },
    { description: 'Troca de Cordas', price: 50 },
    { description: 'Nivelamento de Trastes', price: 350 },
    { description: 'Elétrica (Limpeza/Troca)', price: 100 },
    { description: 'Colagem de Cavalete', price: 400 },
    { description: 'Troca de Nut/Rastilho', price: 120 }
  ],
  luthiers: [
    { id: '1', name: 'Luthier Principal', color: '#ffffff' }
  ]
};

export const STATUS_LABELS = {
  [OrderStatus.PENDING]: 'Pendentes',
  [OrderStatus.IN_PROGRESS]: 'Em Andamento',
  [OrderStatus.READY]: 'Prontos',
  [OrderStatus.DELIVERED]: 'Entregues (Histórico)',
};

export const STATUS_COLORS = {
  [OrderStatus.PENDING]: 'bg-white/5 border-white/20 text-white/60',
  [OrderStatus.IN_PROGRESS]: 'bg-white text-black font-bold border-white',
  [OrderStatus.READY]: 'bg-white border-white text-black border-2 animate-pulse',
  [OrderStatus.DELIVERED]: 'bg-black border-white/10 text-white/30',
};
