
import React, { useState } from 'react';
import { User, UserRole, Location, Category } from '../types';
import { Users, MapPin, Plus, Trash2, Shield, BrainCircuit, Wand2 } from 'lucide-react';
import { suggestSkuNamingConvention } from '../services/geminiService';

interface AdminPanelProps {
  users: User[];
  locations: string[];
  onAddUser: (user: User) => void;
  onDeleteUser: (email: string) => void;
  onAddLocation: (loc: string) => void;
  onDeleteLocation: (loc: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, locations, onAddUser, onDeleteUser, onAddLocation, onDeleteLocation }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'locations' | 'sku-gen'>('users');
  
  // Forms
  const [newUser, setNewUser] = useState({ name: '', email: '', bukId: '', role: UserRole.COMMON_USER });
  const [newLoc, setNewLoc] = useState('');

  // SKU Gen State
  const [skuDesc, setSkuDesc] = useState('');
  const [skuCat, setSkuCat] = useState('Materia Prima');
  const [skuSuggestions, setSkuSuggestions] = useState<any[]>([]);
  const [loadingSku, setLoadingSku] = useState(false);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate Email Domain
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(phage-lab\.com|pht\.cl)$/;
    if (!emailRegex.test(newUser.email)) {
      alert("Error: El correo debe pertenecer a @phage-lab.com o @pht.cl");
      return;
    }
    
    if (newUser.name && newUser.email && newUser.bukId) {
      onAddUser(newUser);
      setNewUser({ name: '', email: '', bukId: '', role: UserRole.COMMON_USER });
    } else {
      alert("Todos los campos son obligatorios.");
    }
  };

  const handleAddLoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLoc) {
      onAddLocation(newLoc);
      setNewLoc('');
    }
  };

  const handleGenerateSku = async () => {
    if (!skuDesc) return;
    setLoadingSku(true);
    const result = await suggestSkuNamingConvention(skuDesc, skuCat);
    try {
        const parsed = JSON.parse(result);
        setSkuSuggestions(parsed);
    } catch (e) {
        // Fallback if not pure JSON
        setSkuSuggestions([]);
        alert("La IA devolvió texto plano, ver consola.");
        console.log(result);
    }
    setLoadingSku(false);
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">Panel de Control (Master Admin)</h2>
        <p className="text-slate-500">Gestión centralizada de usuarios, bodegas y nomenclatura.</p>
      </header>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 font-medium transition-colors border-b-2 ${activeTab === 'users' ? 'border-pharma-600 text-pharma-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2"><Users size={18} /> Usuarios</div>
        </button>
        <button 
          onClick={() => setActiveTab('locations')}
          className={`pb-3 px-4 font-medium transition-colors border-b-2 ${activeTab === 'locations' ? 'border-pharma-600 text-pharma-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2"><MapPin size={18} /> Bodegas</div>
        </button>
        <button 
          onClick={() => setActiveTab('sku-gen')}
          className={`pb-3 px-4 font-medium transition-colors border-b-2 ${activeTab === 'sku-gen' ? 'border-pharma-600 text-pharma-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2"><BrainCircuit size={18} /> Generador SKUs (IA)</div>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[400px]">
        {activeTab === 'users' && (
          <div className="space-y-8">
            {/* Add User */}
            <form onSubmit={handleAddUser} className="bg-slate-50 p-6 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input required className="w-full p-2 border border-slate-300 rounded" placeholder="Juan Perez" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Corporativo</label>
                <input required type="email" className="w-full p-2 border border-slate-300 rounded" placeholder="juan@phage-lab.com" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID Buk (Matrícula)</label>
                <input required className="w-full p-2 border border-slate-300 rounded" placeholder="BUK-123" value={newUser.bukId} onChange={e => setNewUser({...newUser, bukId: e.target.value})} />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                 <select className="w-full p-2 border border-slate-300 rounded" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                   {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                 </select>
              </div>
              <div className="md:col-span-4 flex justify-end">
                  <button type="submit" className="bg-pharma-600 text-white px-6 py-2 rounded hover:bg-pharma-700 flex items-center gap-2 font-medium">
                    <Plus size={18} /> Crear Usuario
                  </button>
              </div>
            </form>

            <div className="overflow-hidden border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">ID Buk</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-medium">{u.name}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3 font-mono text-slate-500">{u.bukId}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === UserRole.MASTER_ADMIN ? 'bg-purple-100 text-purple-700' : u.role === UserRole.ADMIN ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => onDeleteUser(u.name)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="space-y-8">
             <form onSubmit={handleAddLoc} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Bodega / Ubicación</label>
                <input className="w-full p-2 border border-slate-300 rounded" placeholder="Ej: Chile - Bodega Externa 2" value={newLoc} onChange={e => setNewLoc(e.target.value)} />
              </div>
              <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 flex items-center gap-2"><Plus size={18} /> Agregar Bodega</button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {locations.map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-3"><div className="p-2 bg-slate-100 rounded text-slate-500"><MapPin size={18} /></div><span className="font-medium text-slate-700">{loc}</span></div>
                  <button onClick={() => onDeleteLocation(loc)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sku-gen' && (
            <div className="flex flex-col items-center justify-center max-w-2xl mx-auto space-y-6">
                <div className="text-center">
                    <div className="inline-block p-3 bg-indigo-100 text-indigo-600 rounded-full mb-4">
                        <Wand2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Generador de SKUs Inteligente</h3>
                    <p className="text-slate-500">Describe el producto y la IA sugerirá un código estándar PhageLab.</p>
                </div>
                
                <div className="w-full bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del Producto</label>
                        <input className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej: Botellas plásticas 250ml para Brasil" value={skuDesc} onChange={e => setSkuDesc(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                        <select className="w-full p-3 border border-slate-300 rounded-lg" value={skuCat} onChange={e => setSkuCat(e.target.value)}>
                            {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <button onClick={handleGenerateSku} disabled={loadingSku} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition flex justify-center items-center gap-2">
                        {loadingSku ? 'Generando...' : 'Sugerir SKUs'}
                        {!loadingSku && <BrainCircuit size={20} />}
                    </button>
                </div>

                {skuSuggestions.length > 0 && (
                    <div className="w-full space-y-3">
                        <h4 className="font-bold text-slate-700">Sugerencias:</h4>
                        {skuSuggestions.map((sug, idx) => (
                            <div key={idx} className="bg-white p-4 border border-indigo-100 rounded-lg shadow-sm flex justify-between items-center hover:bg-indigo-50 cursor-pointer">
                                <div>
                                    <p className="text-lg font-mono font-bold text-indigo-700">{sug.sku}</p>
                                    <p className="text-xs text-slate-500">{sug.reason}</p>
                                </div>
                                <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded">Copiar</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
