
import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, PlusCircle, Settings, ClipboardList, Home } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import OrderForm from './pages/OrderForm';
import OrderDetails from './pages/OrderDetails';
import SettingsPage from './pages/Settings';

const Navbar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/20 px-6 py-3 flex justify-around items-center md:top-0 md:bottom-auto md:flex-col md:w-20 md:h-full md:border-r md:border-t-0 md:px-0 md:py-8 z-50">
      <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-white' : 'text-white/40'} hover:text-white transition-colors`}>
        <Home size={24} />
        <span className="text-[10px] font-medium md:hidden">Início</span>
      </Link>
      <Link to="/orders/new" className={`flex flex-col items-center gap-1 ${isActive('/orders/new') ? 'text-white' : 'text-white/40'} hover:text-white transition-colors md:mt-8`}>
        <PlusCircle size={24} />
        <span className="text-[10px] font-medium md:hidden">Novo Pedido</span>
      </Link>
      <Link to="/settings" className={`flex flex-col items-center gap-1 ${isActive('/settings') ? 'text-white' : 'text-white/40'} hover:text-white transition-colors md:mt-8`}>
        <Settings size={24} />
        <span className="text-[10px] font-medium md:hidden">Ajustes</span>
      </Link>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen bg-black text-white md:pl-20 pb-20 md:pb-0">
        <header className="hidden md:flex sticky top-0 bg-black border-b border-white/20 h-16 items-center px-8 z-40">
          <div className="flex items-center gap-2 font-bold text-xl">
            <ClipboardList className="w-6 h-6 text-white" />
            <span className="tracking-tight">LUTHIERFLOW</span>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders/new" element={<OrderForm />} />
            <Route path="/orders/edit/:id" element={<OrderForm />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>

        <Navbar />
      </div>
    </HashRouter>
  );
};

export default App;
