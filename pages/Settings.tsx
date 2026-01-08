
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Guitar, UserCheck, ClipboardList, Loader2 } from 'lucide-react';
import { db } from '../services/db';
import { AppSettings, Luthier } from '../types';
import { INITIAL_SETTINGS } from '../constants';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [newBrand, setNewBrand] = useState('');
  const [newLuthier, setNewLuthier] = useState({ name: '', color: '#ffffff' });
  const [newService, setNewService] = useState({ description: '', price: 0 });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const fetched = await db.getSettings();
      setSettings(fetched);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await db.saveSettings(settings);
    setSaving(false);
    alert("Configurações sincronizadas na nuvem!");
  };

  const addLuthier = () => {
    if (!newLuthier.name.trim()) return;
    const updated: Luthier = {
      id: Math.random().toString(36).substring(2, 9),
      name: newLuthier.name,
      color: newLuthier.color
    };
    setSettings({ ...settings, luthiers: [...settings.luthiers, updated] });
    setNewLuthier({ name: '', color: '#ffffff' });
  };

  const removeLuthier = (id: string) => {
    setSettings({ ...settings, luthiers: settings.luthiers.filter(l => l.id !== id) });
  };

  const addPredefinedService = () => {
    if (!newService.description.trim()) return;
    setSettings({
      ...settings,
      predefinedServices: [...settings.predefinedServices, { ...newService }]
    });
    setNewService({ description: '', price: 0 });
  };

  const removePredefinedService = (index: number) => {
    const updated = [...settings.predefinedServices];
    updated.splice(index, 1);
    setSettings({ ...settings, predefinedServices: updated });
  };

  if (loading) return <div className="h-40 flex items-center justify-center text-white/20 uppercase font-black">Carregando Ajustes...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="p-2 text-white/40 hover:text-white transition-colors"><ArrowLeft /></button>
        <h1 className="text-xl font-black uppercase tracking-tighter">Ajustes da Oficina</h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={16} />}
          Salvar na Nuvem
        </button>
      </div>

      <section className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2"><UserCheck size={18} /> Equipe</label>
        <div className="space-y-3">
          {settings.luthiers.map((l) => (
            <div key={l.id} className="flex items-center justify-between p-4 bg-black border border-white/10 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="font-bold text-white uppercase text-xs">{l.name}</span>
              </div>
              <button onClick={() => removeLuthier(l.id)} className="text-white/20 hover:text-white transition-colors"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-white/5 rounded-3xl bg-black/40">
          <input 
            placeholder="Nome"
            className="bg-black border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-white"
            value={newLuthier.name}
            onChange={e => setNewLuthier({ ...newLuthier, name: e.target.value })}
          />
          <div className="flex gap-2">
            <input 
              type="color"
              className="w-12 h-10 bg-black border border-white/10 rounded-xl p-1 cursor-pointer"
              value={newLuthier.color}
              onChange={e => setNewLuthier({ ...newLuthier, color: e.target.value })}
            />
            <button onClick={addLuthier} className="flex-1 bg-white text-black rounded-xl text-[10px] font-black uppercase">Add</button>
          </div>
        </div>
      </section>

      <section className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2"><ClipboardList size={18} /> Serviços Padrão</label>
        <div className="space-y-3">
          {settings.predefinedServices.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-black border border-white/10 rounded-2xl">
              <div>
                <span className="font-bold text-white uppercase text-xs block">{s.description}</span>
                <span className="text-[10px] font-black text-white/40 uppercase">R$ {s.price}</span>
              </div>
              <button onClick={() => removePredefinedService(i)} className="text-white/20 hover:text-white transition-colors"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border border-white/5 rounded-3xl bg-black/40">
          <input 
            placeholder="Serviço"
            className="md:col-span-2 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-white"
            value={newService.description}
            onChange={e => setNewService({ ...newService, description: e.target.value })}
          />
          <div className="flex gap-2">
            <input 
              type="number"
              placeholder="R$"
              className="w-20 bg-black border border-white/10 rounded-xl px-3 py-2 text-sm outline-none"
              value={newService.price || ''}
              onChange={e => setNewService({ ...newService, price: Number(e.target.value) })}
            />
            <button onClick={addPredefinedService} className="flex-1 bg-white text-black rounded-xl text-[10px] font-black uppercase"><Plus size={18} /></button>
          </div>
        </div>
      </section>

      <section className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2"><Guitar size={18} /> Marcas</label>
        <div className="flex flex-wrap gap-2">
          {settings.brands.map((b, i) => (
            <div key={i} className="flex items-center gap-2 bg-black border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-white/60">
              {b}
              <button onClick={() => {
                const brands = [...settings.brands];
                brands.splice(i, 1);
                setSettings({...settings, brands});
              }} className="hover:text-white transition-colors"><Trash2 size={12}/></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input 
            placeholder="Nova marca..."
            className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-white"
            value={newBrand}
            onChange={e => setNewBrand(e.target.value)}
          />
          <button onClick={() => {
            if (newBrand) setSettings({...settings, brands: [...settings.brands, newBrand]});
            setNewBrand('');
          }} className="bg-white text-black p-2 rounded-xl transition-transform active:scale-95"><Plus/></button>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
