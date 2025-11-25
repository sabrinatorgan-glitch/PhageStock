
import React, { useState, useMemo } from 'react';
import { StockMovement } from '../types';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Search, Filter, Calendar, Package, MapPin, X, Download } from 'lucide-react';

interface KardexProps {
  movements: StockMovement[];
}

const Kardex: React.FC<KardexProps> = ({ movements }) => {
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  
  // Advanced Filters State
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('ALL');

  // Extract unique locations from movements history for the dropdown
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    movements.forEach(m => {
      locs.add(m.location);
      if (m.targetLocation) locs.add(m.targetLocation);
    });
    return Array.from(locs).sort();
  }, [movements]);

  const filteredMovements = movements.filter(m => {
    // Text Filter
    const matchesText = m.itemName.toLowerCase().includes(filter.toLowerCase()) || 
                        m.itemSku.toLowerCase().includes(filter.toLowerCase()) || 
                        m.user.toLowerCase().includes(filter.toLowerCase());
    
    // Type Filter
    const matchesType = typeFilter === 'ALL' || m.type === typeFilter;

    // Batch Filter
    const matchesBatch = m.batchNumber.toLowerCase().includes(batchFilter.toLowerCase());

    // Location Filter (Matches either Source OR Target)
    const matchesLoc = locationFilter === 'ALL' || 
                       m.location === locationFilter || 
                       m.targetLocation === locationFilter;

    // Date Filter
    let matchesDate = true;
    if (dateFrom) {
      matchesDate = matchesDate && new Date(m.date) >= new Date(dateFrom);
    }
    if (dateTo) {
      // Add end of day time to include the selected end date fully
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(m.date) <= endDate;
    }

    return matchesText && matchesType && matchesBatch && matchesLoc && matchesDate;
  }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const clearFilters = () => {
    setFilter('');
    setTypeFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setBatchFilter('');
    setLocationFilter('ALL');
  };

  const handleExportCSV = () => {
    const headers = [
      'Fecha', 
      'Hora', 
      'Tipo', 
      'SKU', 
      'Producto', 
      'Lote', 
      'Cantidad', 
      'Origen', 
      'Destino', 
      'Usuario', 
      'Motivo'
    ];

    const rows = filteredMovements.map(m => {
      const dateObj = new Date(m.date);
      return [
        dateObj.toLocaleDateString(),
        dateObj.toLocaleTimeString(),
        m.type,
        m.itemSku,
        `"${m.itemName.replace(/"/g, '""')}"`, // Escape quotes and wrap in quotes
        m.batchNumber,
        m.type === 'ENTRADA' ? m.quantity : -m.quantity,
        `"${m.location}"`,
        m.targetLocation ? `"${m.targetLocation}"` : '',
        m.user,
        `"${m.reason.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Kardex_PhageLab_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Kardex Global (WMS)</h2>
          <p className="text-slate-500">Historial completo de transacciones y trazabilidad de inventario.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition"
        >
          <Download size={18} /> Exportar CSV
        </button>
      </header>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
             <Filter size={16} /> Filtros de Búsqueda
           </h3>
           <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-pharma-600 flex items-center gap-1">
             <X size={14} /> Limpiar Filtros
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Main Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar SKU, Producto, Usuario..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharma-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          {/* Batch Filter */}
          <div className="relative">
             <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Filtrar por Lote (Batch)" 
               className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharma-500"
               value={batchFilter}
               onChange={(e) => setBatchFilter(e.target.value)}
             />
          </div>

          {/* Type Filter */}
          <select 
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-pharma-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">Todos los Tipos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SALIDA">Salidas</option>
            <option value="TRANSFERENCIA">Transferencias</option>
          </select>

          {/* Location Filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-pharma-500 appearance-none"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              <option value="ALL">Todas las Ubicaciones</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Date Filters */}
          <div className="flex items-center gap-2 md:col-span-2 lg:col-span-2">
             <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                   type="date" 
                   className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600"
                   value={dateFrom}
                   onChange={(e) => setDateFrom(e.target.value)}
                />
             </div>
             <span className="text-slate-400">-</span>
             <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                   type="date" 
                   className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600"
                   value={dateTo}
                   onChange={(e) => setDateTo(e.target.value)}
                />
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
              <tr>
                <th className="p-4">Fecha / Hora</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">SKU / Producto</th>
                <th className="p-4">Lote (Batch)</th>
                <th className="p-4 text-right">Cantidad</th>
                <th className="p-4">Ubicación (Origen → Destino)</th>
                <th className="p-4">Usuario</th>
                <th className="p-4">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length > 0 ? (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(m.date).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${
                        m.type === 'ENTRADA' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        m.type === 'SALIDA' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {m.type === 'ENTRADA' && <ArrowDownLeft size={12} />}
                        {m.type === 'SALIDA' && <ArrowUpRight size={12} />}
                        {m.type === 'TRANSFERENCIA' && <ArrowRightLeft size={12} />}
                        {m.type}
                      </div>
                    </td>
                    <td className="p-4">
                       <div className="font-medium text-slate-800">{m.itemName}</div>
                       <div className="text-xs text-slate-400 font-mono">{m.itemSku}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-600">{m.batchNumber}</td>
                    <td className={`p-4 text-right font-bold ${
                        m.type === 'ENTRADA' ? 'text-emerald-600' : 'text-slate-800'
                    }`}>
                      {m.type === 'ENTRADA' ? '+' : '-'}{m.quantity}
                    </td>
                    <td className="p-4">
                       <div className="flex flex-col gap-1 text-xs">
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin size={10} /> {m.location}
                          </span>
                          {m.type === 'TRANSFERENCIA' && m.targetLocation && (
                             <span className="flex items-center gap-1 text-blue-600 font-medium">
                                ↓ {m.targetLocation}
                             </span>
                          )}
                       </div>
                    </td>
                    <td className="p-4 text-slate-600">{m.user}</td>
                    <td className="p-4 text-slate-500 italic max-w-[200px] truncate" title={m.reason}>
                      {m.reason}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No se encontraron movimientos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Kardex;
