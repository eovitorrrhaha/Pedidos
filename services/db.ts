
import { createClient } from '@supabase/supabase-js';
import { ServiceOrder, AppSettings } from '../types';
import { INITIAL_SETTINGS } from '../constants';

const SUPABASE_URL = 'https://dhvfohsyjfzzclxspacu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZDsIt7mvzhTqR2qryG_ttg_zi5d7NYc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const db = {
  // Busca todos os pedidos do Supabase
  getOrders: async (): Promise<ServiceOrder[]> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('entryDate', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error("Erro ao buscar pedidos:", err.message);
      // Fallback para localStorage
      const local = localStorage.getItem('luthierflow_orders');
      return local ? JSON.parse(local) : [];
    }
  },

  // Busca pedido por ID
  getOrderById: async (id: string): Promise<ServiceOrder | null> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) return null;
      return data;
    } catch (err: any) {
      return null;
    }
  },

  // Adiciona novo pedido
  addOrder: async (order: ServiceOrder) => {
    try {
      // Sincroniza localmente primeiro como redundância
      const currentLocal = await db.getOrders();
      localStorage.setItem('luthierflow_orders', JSON.stringify([order, ...currentLocal]));

      const { error } = await supabase
        .from('orders')
        .insert([order]);
      
      if (error) {
        console.error("Erro Supabase (addOrder):", error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      return false;
    }
  },

  // Atualiza pedido existente
  updateOrder: async (order: ServiceOrder) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update(order)
        .eq('id', order.id);
      
      if (error) console.error("Erro Supabase (updateOrder):", error.message);
    } catch (err: any) {
      console.error("Erro de conexão ao atualizar:", err.message);
    }
  },

  // Exclui pedido
  deleteOrder: async (id: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      
      if (error) console.error("Erro Supabase (deleteOrder):", error.message);
    } catch (err: any) {
      console.error("Erro de conexão ao excluir:", err.message);
    }
  },

  // Busca configurações globais
  getSettings: async (): Promise<AppSettings> => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global_settings')
        .maybeSingle();
      
      if (error || !data || !data.config) {
        return INITIAL_SETTINGS;
      }
      return data.config as AppSettings;
    } catch (err: any) {
      return INITIAL_SETTINGS;
    }
  },

  // Salva configurações globais
  saveSettings: async (settings: AppSettings) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          id: 'global_settings', 
          config: settings, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });
      
      if (error) console.error("Erro Supabase (saveSettings):", error.message);
    } catch (err: any) {
      console.error("Erro de conexão ao salvar configs:", err.message);
    }
  }
};
