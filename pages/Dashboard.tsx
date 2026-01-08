
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, ArrowRight, Guitar, Clock, CheckCircle2, History, Loader2 } from 'lucide-react';
import { db } from '../services/db';
import { ServiceOrder, OrderStatus, AppSettings } from '../types';
import { INITIAL_SETTINGS } from '../constants';

const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [fetchedOrders, fetchedSettings] = await Promise.all([
        db.getOrders(),
        db.getSettings()
      ]);
      setOrders(fetchedOrders);
      setSettings(fetchedSettings);
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    return orders.filter(order => 
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.includes(searchTerm) ||
      order.instrument.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const ordersByStatus = useMemo(() => {
    return {
      [OrderStatus.PENDING]: filteredOrders.filter(o => o.status === OrderStatus.PENDING),
      [OrderStatus.IN_PROGRESS]: filteredOrders.filter(o => o.status === OrderStatus.IN_PROGRESS),
      [OrderStatus.READY]: filteredOrders.filter(o => o.status === OrderStatus.READY),
      [OrderStatus.DELIVERED]: filteredOrders.filter(o => o.status === OrderStatus.DELIVERED),
    };
  }, [filteredOrders]);

  const StatusSection = ({ status, icon: Icon, title }: { status: OrderStatus, icon: any, title: string }) => {
    const sectionOrders = ordersByStatus[status];
    if (status === OrderStatus.DELIVERED && sectionOrders.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Icon className="text-white/40" size={18} />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-white/60">{title}</h2>
          <span className="ml-auto bg-white/10 text-white/40 text-[9px] px-2 py-0.5 rounded-full font-black">
            {sectionOrders.length}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sectionOrders.map(order => (
            <Link 
              key={order.id} 
              to={`/orders/${order.id}`}
              className={`group relative bg-black border border-white/10 p-4 rounded-2xl hover:border-white transition-all overflow-hidden ${status === OrderStatus.DELIVERED ? 'opacity-40 grayscale' : ''}`}
            >
              <div 
                className="absolute top-0 left-0 w-1 h-full" 
                style={{ backgroundColor: settings.luthiers.find(l => l.id === order.luthierId)?.color || '#fff' }}
              />
              <div className="flex justify-between items-start mb-3">
                <span className="text-[9px] font-black text-white/30 uppercase">#{order.orderNumber}</span>
                <span className="text-[9px] font-black text-white/30">{new Date(order.entryDate).toLocaleDateString()}</span>
              </div>
              <h3 className="font-bold text-white uppercase text-sm mb-1">{order.customer.name}</h3>
              <p className="text-[10px] text-white/50 font-medium uppercase tracking-tighter">
                {order.instrument.type} • {order.instrument.brand}
              </p>
              
              <div className="mt-4 flex justify-between items-end">
                <div className="text-[9px] text-white/40 font-black uppercase">
                  {order.services.length} Serviços
                </div>
                <ArrowRight size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
          {sectionOrders.length === 0 && (
            <div className="col-span-full py-8 border border-dashed border-white/5 rounded-2xl text-center">
              <span className="text-[9px] font-black text-white/10 uppercase">Vazio</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-white/20" size={40} />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Sincronizando com a Nuvem...</span>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Fluxo da Oficina</h1>
          <p className="text-white/40 text-xs font-medium">Controle de estados e entregas.</p>
        </div>
        <Link 
          to="/orders/new" 
          className="bg-white text-black px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-2xl"
        >
          <Plus size={18} /> Criar Novo Pedido
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
        <input 
          type="text" 
          placeholder="Buscar cliente ou ordem..." 
          className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-white outline-none transition-all text-white font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-12">
        <StatusSection status={OrderStatus.PENDING} icon={Clock} title="Aguardando Início" />
        <StatusSection status={OrderStatus.IN_PROGRESS} icon={Guitar} title="Em Bancada" />
        <StatusSection status={OrderStatus.READY} icon={CheckCircle2} title="Prontos para Retirada" />
        <StatusSection status={OrderStatus.DELIVERED} icon={History} title="Histórico de Entregas" />
      </div>
    </div>
  );
};

export default Dashboard;
