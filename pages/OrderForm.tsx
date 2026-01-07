
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Camera, Loader2, DollarSign, Calendar, User, Guitar as GuitarIcon, UserCheck } from 'lucide-react';
import { db } from '../services/db';
import { ServiceOrder, OrderStatus, Service, ServiceStatus, AppSettings, Payment } from '../types';
import { extractOrderFromImage } from '../services/geminiService';

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const OrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(db.getSettings());
  
  const [order, setOrder] = useState<ServiceOrder>({
    id: generateId(),
    orderNumber: `${Math.floor(1000 + Math.random() * 8999)}`,
    customer: { name: '', contact: '', phone: '' },
    instrument: { type: 'Guitarra', brand: '' },
    services: [],
    payments: [],
    entryDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: OrderStatus.PENDING,
    notes: '',
    handwrittenNoteImages: [],
    luthierId: ''
  });

  useEffect(() => {
    if (id) {
      const existing = db.getOrderById(id);
      if (existing) setOrder(existing);
    }
    setSettings(db.getSettings());
  }, [id]);

  const handleSave = async () => {
    if (!order.customer.name.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }
    
    setLoading(true);
    try {
      if (id) {
        db.updateOrder(order);
      } else {
        console.log("Tentando criar ordem...");
        const success = db.addOrder(order);
        if (!success) throw new Error("Falha no Banco de Dados");
      }
      
      // Feedback visual e navegação
      setTimeout(() => {
        setLoading(false);
        navigate('/');
      }, 500);
    } catch (e) {
      console.error(e);
      alert("Ocorreu um erro ao salvar o pedido.");
      setLoading(false);
    }
  };

  const addService = (predefined?: { description: string; price: number }) => {
    const newService: Service = {
      id: generateId(),
      description: predefined?.description || '',
      price: predefined?.price || 0,
      status: ServiceStatus.PENDING,
      checklist: []
    };
    setOrder(prev => ({ ...prev, services: [...prev.services, newService] }));
  };

  const removeService = (idx: number) => {
    const services = [...order.services];
    services.splice(idx, 1);
    setOrder({ ...order, services });
  };

  const updateEntrance = (val: number) => {
    // Sistema simplificado: apenas um registro de pagamento principal de entrada
    const payment: Payment = {
      id: 'entrada-principal',
      amount: val,
      date: new Date().toISOString(),
      description: 'Entrada'
    };
    setOrder(prev => ({ ...prev, payments: [payment] }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setOrder(prev => ({ ...prev, handwrittenNoteImages: [...prev.handwrittenNoteImages, base64] }));
    };
    reader.readAsDataURL(file);
  };

  const totalPrice = order.services.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
  const totalPaid = order.payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const remaining = totalPrice - totalPaid;

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-40">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">
          {id ? `Editar OS #${order.orderNumber}` : 'Novo Pedido de Serviço'}
        </h1>
        <div className="w-10"></div>
      </div>

      {/* CLIENTE */}
      <section className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest">
          <User size={14} /> Informações do Cliente
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            placeholder="Nome Completo" 
            className="w-full bg-black border border-white/10 rounded-xl px-5 py-3 text-sm focus:border-white outline-none transition-all"
            value={order.customer.name}
            onChange={e => setOrder({...order, customer: {...order.customer, name: e.target.value}})}
          />
          <input 
            placeholder="Telefone / WhatsApp" 
            className="w-full bg-black border border-white/10 rounded-xl px-5 py-3 text-sm focus:border-white outline-none transition-all"
            value={order.customer.phone}
            onChange={e => setOrder({...order, customer: {...order.customer, phone: e.target.value}})}
          />
          <div className="md:col-span-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-white/40 hover:text-white hover:border-white transition-all group"
            >
              <Camera size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase">Anexar Foto da Nota ou Instrumento</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
          </div>
        </div>
      </section>

      {/* INSTRUMENTO */}
      <section className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest">
          <GuitarIcon size={14} /> Detalhes do Instrumento
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/40 ml-1">Tipo de Instrumento</label>
            <select 
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white outline-none"
              value={order.instrument.type}
              onChange={e => setOrder({...order, instrument: {...order.instrument, type: e.target.value}})}
            >
              {settings.instrumentTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/40 ml-1">Marca</label>
            <select 
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white outline-none"
              value={order.instrument.brand}
              onChange={e => setOrder({...order, instrument: {...order.instrument, brand: e.target.value}})}
            >
              <option value="">Selecionar Marca...</option>
              {settings.brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Serviços Selecionados</div>
          <div className="relative group">
            <button className="bg-white text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase hover:scale-105 transition-transform">
              + Adicionar
            </button>
            <div className="absolute right-0 mt-2 w-64 bg-black border border-white/20 rounded-2xl shadow-2xl hidden group-hover:block z-50 overflow-hidden">
              {settings.predefinedServices.map(s => (
                <button 
                  key={s.description}
                  onClick={() => addService(s)}
                  className="w-full text-left px-5 py-3 hover:bg-white hover:text-black text-xs font-bold border-b border-white/5 transition-colors"
                >
                  {s.description} <span className="float-right opacity-50">R$ {s.price}</span>
                </button>
              ))}
              <button 
                onClick={() => addService()}
                className="w-full text-center py-3 bg-white/5 text-[9px] font-black uppercase hover:bg-white/10"
              >
                Serviço Personalizado
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {order.services.map((s, idx) => (
            <div key={s.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group">
              <div className="flex-1 mr-4">
                <input 
                  value={s.description}
                  onChange={e => {
                    const services = [...order.services];
                    services[idx].description = e.target.value;
                    setOrder({...order, services});
                  }}
                  placeholder="Descrição do serviço..."
                  className="bg-transparent text-sm font-bold text-white outline-none w-full mb-1"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-white/20 uppercase">Valor R$</span>
                  <input 
                    type="number"
                    value={s.price}
                    onChange={e => {
                      const services = [...order.services];
                      services[idx].price = Number(e.target.value);
                      setOrder({...order, services});
                    }}
                    className="bg-transparent text-xs font-black text-white outline-none w-20"
                  />
                </div>
              </div>
              <button onClick={() => removeService(idx)} className="text-white/20 hover:text-white transition-colors p-2">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {order.services.length === 0 && (
            <div className="text-center py-10 border border-dashed border-white/10 rounded-3xl text-white/20 text-[10px] font-black uppercase">
              Nenhum serviço adicionado ainda
            </div>
          )}
        </div>
      </section>

      {/* FINANCEIRO E LUTHIER */}
      <section className="bg-white text-black p-8 rounded-3xl space-y-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Luthier Responsável</div>
            <select 
              className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-bold outline-none"
              value={order.luthierId}
              onChange={e => setOrder({...order, luthierId: e.target.value})}
            >
              <option value="">Selecionar Luthier...</option>
              {settings.luthiers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Pagamento de Entrada (R$)</div>
            <input 
              type="number" 
              placeholder="0.00"
              className="w-full bg-black/5 border border-black/10 rounded-xl px-5 py-3 text-lg font-black outline-none"
              value={order.payments[0]?.amount || ''}
              onChange={e => updateEntrance(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase opacity-30">Previsão de Entrega</div>
            <input 
              type="date" 
              className="bg-transparent font-black text-sm outline-none"
              value={order.deliveryDate}
              onChange={e => setOrder({...order, deliveryDate: e.target.value})}
            />
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase opacity-30 mb-1">Resumo Financeiro</div>
            <div className="text-xs font-bold opacity-60">Total: R$ {totalPrice.toFixed(2)}</div>
            <div className="text-xs font-bold opacity-60">Entrada: R$ {totalPaid.toFixed(2)}</div>
            <div className="text-3xl font-black tracking-tighter mt-1">Saldo: R$ {remaining.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-10 left-0 right-0 px-4 md:px-0 flex justify-center z-50">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="max-w-md w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-3 border-4 border-black"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          {id ? 'Atualizar Pedido' : 'Criar Ordem de Serviço'}
        </button>
      </div>
    </div>
  );
};

export default OrderForm;
