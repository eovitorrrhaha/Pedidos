
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, CheckCircle2, Circle, DollarSign, Image as ImageIcon, Calendar, Phone, CheckSquare, Trash2 } from 'lucide-react';
import { db } from '../services/db';
import { ServiceOrder, OrderStatus, ServiceStatus, AppSettings } from '../types';
import { STATUS_LABELS } from '../constants';

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [settings, setSettings] = useState<AppSettings>(db.getSettings());

  useEffect(() => {
    if (id) {
      const found = db.getOrderById(id);
      if (found) setOrder(found);
    }
  }, [id]);

  if (!order) return null;

  const updateStatus = (status: OrderStatus) => {
    const updated = { ...order, status };
    setOrder(updated);
    db.updateOrder(updated);
  };

  const deleteOrder = () => {
    if (confirm("Deseja realmente excluir este pedido? Esta ação é permanente.")) {
      db.deleteOrder(order.id);
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
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Ordem de Serviço #{order.orderNumber}</span>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mt-2">{order.customer.name}</h1>
            <div className="flex items-center gap-4 mt-4 text-white/60 text-xs font-bold uppercase">
              <span className="flex items-center gap-1.5"><Phone size={14} /> {order.customer.phone}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> Entrada: {new Date(order.entryDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
              <CheckSquare size={16} /> Serviços Contratados
            </h3>
            <div className="space-y-4">
              {order.services.map(s => (
                <div key={s.id} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <div>
                    <div className="font-bold text-white text-sm uppercase">{s.description}</div>
                    <div className="text-[10px] font-black text-white/20 uppercase mt-1">Status: {s.status}</div>
                  </div>
                  <div className="text-sm font-black text-white">R$ {s.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
          
          {order.handwrittenNoteImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={16} /> Anexos e Fotos
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {order.handwrittenNoteImages.map((img, i) => (
                  <img key={i} src={img} className="rounded-2xl border border-white/10 w-full h-48 object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(img)} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white text-black p-8 rounded-3xl space-y-6 shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-30">Status Atual</div>
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

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Resumo Financeiro</div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold opacity-40"><span>Total</span><span>R$ {totalPrice.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs font-bold opacity-40"><span>Pago</span><span>R$ {totalPaid.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-black pt-2 border-t border-white/10"><span>Saldo</span><span>R$ {balance.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
