import React, { useState } from 'react';
import { ProductionOrder, Recipe } from '../types';
import { Factory, Play, CheckCircle, Plus, Calendar } from 'lucide-react';

interface ProductionPanelProps {
  orders: ProductionOrder[];
  recipes: Recipe[];
  onAddOrder: (order: ProductionOrder) => void;
  onUpdateStatus: (id: string, status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED') => void;
}

const ProductionPanel: React.FC<ProductionPanelProps> = ({ orders, recipes, onAddOrder, onUpdateStatus }) => {
  const [showForm, setShowForm] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<ProductionOrder>>({
    targetQuantity: 0,
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipe = recipes.find(r => r.id === newOrder.recipeId);
    if (!recipe || !newOrder.targetQuantity) return;

    onAddOrder({
      id: Math.random().toString(36).substr(2, 9),
      recipeId: recipe.id,
      productName: recipe.finalProductName,
      targetQuantity: newOrder.targetQuantity,
      startDate: newOrder.startDate!,
      status: 'PLANNED',
      batchOutput: `LOTE-${new Date().getFullYear()}-${Math.floor(Math.random()*1000)}`
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Control de Producción</h2>
          <p className="text-slate-500">Gestión de Órdenes de Producción (OPs) y Planta.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={18} /> Crear Orden (OP)
        </button>
      </header>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow border mb-6">
          <h3 className="font-bold mb-4">Nueva Orden de Producción</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
               <label className="block text-sm font-medium mb-1">Receta / Producto</label>
               <select className="w-full p-2 border rounded" onChange={e => setNewOrder({...newOrder, recipeId: e.target.value})}>
                 <option value="">Seleccione...</option>
                 {recipes.map(r => <option key={r.id} value={r.id}>{r.finalProductName}</option>)}
               </select>
             </div>
             <div>
                <label className="block text-sm font-medium mb-1">Cantidad a Producir</label>
                <input type="number" className="w-full p-2 border rounded" onChange={e => setNewOrder({...newOrder, targetQuantity: Number(e.target.value)})} />
             </div>
             <div className="flex items-end">
                <button onClick={handleSubmit} className="w-full bg-emerald-600 text-white p-2 rounded font-bold">Lanzar OP</button>
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Planned Column */}
        <div className="bg-slate-100 p-4 rounded-xl min-h-[400px]">
           <h3 className="font-bold text-slate-600 mb-4 flex items-center gap-2"><Calendar size={18} /> Planificado</h3>
           <div className="space-y-3">
             {orders.filter(o => o.status === 'PLANNED').map(order => (
               <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-slate-400">
                  <h4 className="font-bold text-slate-800">{order.productName}</h4>
                  <p className="text-xs text-slate-500 mb-2">OP: {order.id} • {order.targetQuantity} un.</p>
                  <button onClick={() => onUpdateStatus(order.id, 'IN_PROGRESS')} className="w-full py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded hover:bg-blue-100 flex justify-center items-center gap-1">
                     <Play size={12} /> Iniciar
                  </button>
               </div>
             ))}
           </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-blue-50 p-4 rounded-xl min-h-[400px]">
           <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2"><Factory size={18} /> En Proceso</h3>
           <div className="space-y-3">
             {orders.filter(o => o.status === 'IN_PROGRESS').map(order => (
               <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                  <h4 className="font-bold text-slate-800">{order.productName}</h4>
                  <p className="text-xs text-slate-500">Lote Salida: {order.batchOutput}</p>
                  <div className="mt-3 flex gap-2">
                     <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-1/2 animate-pulse"></div>
                     </div>
                  </div>
                  <button onClick={() => onUpdateStatus(order.id, 'COMPLETED')} className="mt-3 w-full py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded hover:bg-emerald-100">
                     Finalizar
                  </button>
               </div>
             ))}
           </div>
        </div>

        {/* Completed Column */}
        <div className="bg-emerald-50 p-4 rounded-xl min-h-[400px]">
           <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2"><CheckCircle size={18} /> Terminado</h3>
           <div className="space-y-3">
             {orders.filter(o => o.status === 'COMPLETED').map(order => (
               <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-emerald-500 opacity-75">
                  <h4 className="font-bold text-slate-800 strike">{order.productName}</h4>
                  <p className="text-xs text-slate-500">Completado: {new Date().toLocaleDateString()}</p>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionPanel;