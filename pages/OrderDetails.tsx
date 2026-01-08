
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, CheckCircle2, Image as ImageIcon, Calendar, Phone, CheckSquare, Trash2, Loader2 } from 'lucide-react';
import { db } from '../services/db';
import { ServiceOrder, OrderStatus, AppSettings } from '../types';
import { STATUS_LABELS, INITIAL_SETTINGS } from '../constants';

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (id) {
        const [found, fetchedSettings] = await Promise.all([
          db.getOrderById(id),
          db.getSettings()
        ]);
        if (found) setOrder(found);
        setSettings(fetchedSettings);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="h-40 flex items-center justify-center text-white/20 uppercase font-black">Carregando...</div>;
  if (!order) return <div className="p-8 text-center text-white/40 uppercase font-black">Pedido não encontrado</div>;

  const updateStatus = async (status: OrderStatus) => {
    const updated = { ...order, status };
    setOrder(updated);
    await db.updateOrder(updated);
  };

  const deleteOrder = async () => {
    if (confirm("Deseja realmente excluir este pedido? Esta ação é permanente na nuvem.")) {
      await db.deleteOrder(order.id);
      navigate('/');
    }
  };

  const totalPrice = order.services.reduce((acc, s) => acc + s.price, 0);
  const totalPaid = order.payments.reduce((acc, p) => acc + p.amount, 0);
  const balance = totalPrice - totalPaid;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2">
          <Link to={`/orders/edit/${order.id}`} className="p-2 text-white/60 hover:text-white"><Edit2 size={20} /></Link>
          <button onClick={deleteOrder} className="p-2 text-white/20 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Ordem #{order.orderNumber}</span>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mt-2">{order.customer.name}</h1>
            <div className="flex items-center gap-4 mt-4 text-white/60 text-xs font-bold uppercase">
              <span className="flex items-center gap-1.5"><Phone size={14} /> {order.customer.phone}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> Entrada: {new Date(order.entryDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
              <CheckSquare size={16} /> Serviços
            </h3>
            <div className="space-y-4">
              {order.services.map(s => (
                <div key={s.id} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div className="font-bold text-white text-sm uppercase">{s.description}</div>
                  <div className="text-sm font-black text-white">R$ {s.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
          
          {order.handwrittenNoteImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={16} /> Fotos
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {order.handwrittenNoteImages.map((img, i) => (
                  <img key={i} src={img} className="rounded-2xl border border-white/10 w-full h-48 object-cover cursor-pointer" onClick={() => window.open(img)} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white text-black p-8 rounded-3xl space-y-6 shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-30">Status</div>
            <div className="space-y-2">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button 
                  key={key}
                  onClick={() => updateStatus(key as OrderStatus)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-between ${order.status === key ? 'bg-black text-white' : 'hover:bg-black/5 opacity-40'}`}
                >
                  {label}
                  {order.status === key && <CheckCircle2 size={14} />}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-right">
            <div className="text-[10px] uppercase text-white/30 font-black">Saldo Restante</div>
            <div className="text-2xl font-black text-white">R$ {balance.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
