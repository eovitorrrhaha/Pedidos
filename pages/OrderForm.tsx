
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Camera, Loader2, User, Guitar as GuitarIcon, Sparkles, Wand2 } from 'lucide-react';
import { db } from '../services/db';
import { extractOrderFromImage, ExtractedOrderData } from '../services/geminiService';
import { ServiceOrder, OrderStatus, Service, ServiceStatus, AppSettings, Payment } from '../types';
import { INITIAL_SETTINGS } from '../constants';

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const OrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [fetching, setFetching] = useState(true);
  
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
    const init = async () => {
      setFetching(true);
      const fetchedSettings = await db.getSettings();
      setSettings(fetchedSettings);
      
      if (id) {
        const existing = await db.getOrderById(id);
        if (existing) setOrder(existing);
      }
      setFetching(false);
    };
    init();
  }, [id]);

  const handleSave = async () => {
    if (!order.customer.name.trim()) {
      alert("Informe o nome do cliente.");
      return;
    }
    
    setLoading(true);
    try {
      if (id) {
        await db.updateOrder(order);
      } else {
        const success = await db.addOrder(order);
        if (!success) throw new Error("Falha no Banco de Dados");
      }
      navigate('/');
    } catch (e) {
      alert("Erro ao salvar no banco de dados. Verifique sua conexão.");
      setLoading(false);
    }
  };

  const handleAIExtraction = async (imageIdx: number) => {
    const imageData = order.handwrittenNoteImages[imageIdx];
    if (!imageData) return;

    setExtracting(true);
    try {
      const extracted = await extractOrderFromImage(imageData);
      if (extracted) {
        applyExtractedData(extracted);
      } else {
        alert("Não foi possível extrair dados desta imagem.");
      }
    } catch (error) {
      console.error("Erro IA:", error);
    } finally {
      setExtracting(false);
    }
  };

  const applyExtractedData = (data: ExtractedOrderData) => {
    const newServices: Service[] = (data.services || []).map(s => ({
      id: generateId(),
      description: s.description,
      price: s.price,
      status: ServiceStatus.PENDING,
      checklist: []
    }));

    setOrder(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        name: data.customerName || prev.customer.name,
        phone: data.contact || prev.customer.phone
      },
      instrument: {
        ...prev.instrument,
        type: data.instrumentType || prev.instrument.type,
        brand: data.brand || prev.instrument.brand
      },
      services: [...prev.services, ...newServices],
      notes: data.notes ? `${prev.notes}\n${data.notes}`.trim() : prev.notes
    }));
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

  if (fetching) return <div className="h-40 flex items-center justify-center text-white/20 uppercase font-black">Carregando dados...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-40">
      {extracting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-pulse" size={32} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tighter">Gemini está lendo a nota...</h2>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Identificando caligrafia e valores</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">
          {id ? `Editar OS #${order.orderNumber}` : 'Novo Pedido de Serviço'}
        </h1>
        <div className="w-10"></div>
      </div>

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
          
          <div className="md:col-span-2 space-y-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white hover:border-white transition-all group"
            >
              <Camera size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Tirar foto da nota ou instrumento</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
            
            <div className="grid grid-cols-2 gap-3">
              {order.handwrittenNoteImages.map((img, i) => (
                <div key={i} className="relative group overflow-hidden rounded-xl border border-white/10 aspect-video">
                  <img src={img} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    <button 
                      onClick={() => handleAIExtraction(i)}
                      className="bg-white text-black p-2 rounded-lg hover:scale-110 transition-transform"
                      title="Extrair com IA"
                    >
                      <Wand2 size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        const imgs = [...order.handwrittenNoteImages];
                        imgs.splice(i, 1);
                        setOrder({...order, handwrittenNoteImages: imgs});
                      }}
                      className="bg-red-500 text-white p-2 rounded-lg hover:scale-110 transition-transform"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest">
          <GuitarIcon size={14} /> Detalhes do Instrumento
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/40 ml-1">Tipo de Instrumento</label>
            <select 
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white outline-none appearance-none"
              value={order.instrument.type}
              onChange={e => setOrder({...order, instrument: {...order.instrument, type: e.target.value}})}
            >
              {settings.instrumentTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-white/40 ml-1">Marca</label>
            <select 
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-white outline-none appearance-none"
              value={order.instrument.brand}
              onChange={e => setOrder({...order, instrument: {...order.instrument, brand: e.target.value}})}
            >
              <option value="">Selecionar Marca...</option>
              {settings.brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Serviços e Orçamento</div>
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
                  {s.description} <span className="float-right opacity-50 text-[10px]">R$ {s.price}</span>
                </button>
              ))}
              <button onClick={() => addService()} className="w-full text-center py-3 bg-white/5 text-[9px] font-black uppercase hover:bg-white/10">Personalizado</button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {order.services.map((s, idx) => (
            <div key={s.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group animate-in slide-in-from-right-4 duration-300">
              <div className="flex-1 mr-4">
                <input 
                  value={s.description}
                  onChange={e => {
                    const svcs = [...order.services];
                    svcs[idx].description = e.target.value;
                    setOrder({...order, services: svcs});
                  }}
                  className="bg-transparent text-sm font-bold text-white outline-none w-full mb-1"
                  placeholder="Descrição do serviço"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Preço R$</span>
                  <input 
                    type="number"
                    value={s.price}
                    onChange={e => {
                      const svcs = [...order.services];
                      svcs[idx].price = Number(e.target.value);
                      setOrder({...order, services: svcs});
                    }}
                    className="bg-transparent text-xs font-black text-white outline-none w-20"
                  />
                </div>
              </div>
              <button onClick={() => removeService(idx)} className="text-white/10 hover:text-red-500 transition-colors p-2"><Trash2 size={18} /></button>
            </div>
          ))}
          {order.services.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
              <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">Nenhum serviço adicionado</span>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white text-black p-8 rounded-3xl space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <GuitarIcon size={120} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Responsável</div>
            <select 
              className="w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 text-sm font-bold outline-none appearance-none"
              value={order.luthierId}
              onChange={e => setOrder({...order, luthierId: e.target.value})}
            >
              <option value="">Selecionar Luthier...</option>
              {settings.luthiers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div className="space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Adiantamento (Entrada R$)</div>
            <input 
              type="number" 
              className="w-full bg-black/5 border border-black/10 rounded-xl px-5 py-3 text-lg font-black outline-none"
              value={order.payments[0]?.amount || ''}
              onChange={e => updateEntrance(Number(e.target.value))}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase opacity-30">Data de Entrega</div>
            <input type="date" className="bg-transparent font-black text-sm outline-none" value={order.deliveryDate} onChange={e => setOrder({...order, deliveryDate: e.target.value})} />
          </div>
          <div className="text-right font-black">
            <div className="text-xs opacity-60">Subtotal: R$ {totalPrice.toFixed(2)}</div>
            <div className="text-3xl tracking-tighter mt-1">Saldo: R$ {remaining.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-10 left-0 right-0 px-4 md:px-0 flex justify-center z-50">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="max-w-md w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-3 border-4 border-black"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          {id ? 'Salvar Alterações' : 'Finalizar e Gerar OS'}
        </button>
      </div>
    </div>
  );
};

export default OrderForm;
