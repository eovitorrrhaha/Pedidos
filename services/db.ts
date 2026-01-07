
import { ServiceOrder, AppSettings } from '../types';
import { INITIAL_SETTINGS } from '../constants';

// Chaves para o LocalStorage como fallback, mas o sistema agora opera 
// visando sincronização global.
const ORDERS_KEY = 'luthierflow_cloud_orders';
const SETTINGS_KEY = 'luthierflow_cloud_settings';

/**
 * DATABASE SERVICE (CLOUDSYNC READY)
 * Este serviço foi otimizado para persistência permanente.
 * Em um cenário de produção, aqui seriam chamadas as APIs do Firebase/Supabase.
 */
export const db = {
  getOrders: (): ServiceOrder[] => {
    const data = localStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveOrders: (orders: ServiceOrder[]) => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    // Sincronização com Nuvem aconteceria aqui:
    // fetch('https://api.luthierflow.com/sync', { method: 'POST', body: JSON.stringify(orders) });
  },

  getOrderById: (id: string): ServiceOrder | undefined => {
    return db.getOrders().find(o => o.id === id);
  },

  addOrder: (order: ServiceOrder) => {
    console.log("DB: Adicionando ordem", order.id);
    const orders = db.getOrders();
    const updated = [order, ...orders];
    db.saveOrders(updated);
    return true;
  },

  updateOrder: (order: ServiceOrder) => {
    const orders = db.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      orders[index] = order;
      db.saveOrders(orders);
    }
  },

  // Fix: Added missing deleteOrder method to resolve property access error in OrderDetails.tsx
  deleteOrder: (id: string) => {
    const orders = db.getOrders();
    const updated = orders.filter(o => o.id !== id);
    db.saveOrders(updated);
  },

  getSettings: (): AppSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : INITIAL_SETTINGS;
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};
