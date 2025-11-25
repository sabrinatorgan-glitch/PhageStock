
import React, { useState } from 'react';
import { StockMovement } from '../types';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Search, Filter } from 'lucide-react';

interface KardexProps {
  movements: StockMovement[];
}

const Kardex: React.FC<KardexProps> = ({ movements }) => {
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredMovements = movements.filter(m => {
    const matchesText = m.itemName.toLowerCase().includes(filter.toLowerCase()) || 
                        m.itemSku.toLowerCase().includes(filter.toLowerCase()) || 
                        m.user.toLowerCase().includes(filter.toLowerCase());
    const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
    return matchesText && matchesType;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">Kardex Global (WMS)</h2>
        <p className="text-slate-500">Historial completo de transacciones y trazabilidad de inventario.</p>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por SKU, Producto o Usuario..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharma-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <select 
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">Todos los Tipos</option>
          <option value="ENTRADA">Entradas</option>
          <option value="SALIDA">Salidas</option>
          <option value="TRANSFERENCIA">Transferencias</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
            <tr>
              <th className="p-4">Fecha / Hora</th>
              <th className="p-4">Tipo Movimiento</th>
              <th className="p-4">SKU / Producto</th>
              <th className="p-4">Origen / Destino</th>
              <th className="p-4">Motivo</th>
              <th className="p-4">Usuario</th>
              <th className="p-4 text-right">Cantidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMovements.map(mov => (
              <tr key={mov.id} className="hover:bg-slate-50 transition">
                <td className="p-4 text-slate-600 font-mono">
                  {new Date(mov.date).toLocaleString()}
                </td>
                <td className="p-4">
                  <span className={`flex items-center gap-1 font-bold text-xs px-2 py-1 rounded-full w-fit ${
                    mov.type === 'ENTRADA' ? 'bg-emerald-100 text-emerald-700' : 
                    mov.type === 'SALIDA' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {mov.type === 'ENTRADA' && <ArrowDownLeft size={14}/>}
                    {mov.type === 'SALIDA' && <ArrowUpRight size={14}/>}
                    {mov.type === 'TRANSFERENCIA' && <ArrowRightLeft size={14}/>}
                    {mov.type}
                  </span>
                </td>
                <td className="p-4">
                   <div className="font-medium text-slate-800">{mov.itemName}</div>
                   <div className="text-xs text-slate-400 font-mono">{mov.itemSku}</div>
                </td>
                <td className="p-4 text-slate-600">
                   <div>{mov.location}</div>
                   {mov.targetLocation && <div className="text-xs text-blue-500">➝ {mov.targetLocation}</div>}
                </td>
                <td className="p-4 text-slate-600 italic">{mov.reason}</td>
                <td className="p-4 text-slate-600">{mov.user}</td>
                <td className={`p-4 text-right font-bold ${
                   mov.type === 'ENTRADA' ? 'text-emerald-600' : 'text-red-600'
                }`}>
                   {mov.type === 'ENTRADA' ? '+' : '-'}{mov.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMovements.length === 0 && (
          <div className="p-8 text-center text-slate-400">No se encontraron movimientos.</div>
        )}
      </div>
    </div>
  );
};

export default Kardex;
