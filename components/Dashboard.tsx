
import React, { useMemo } from 'react';
import { InventoryItem, Requisition, Location } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { AlertTriangle, TrendingUp, CheckCircle2, Clock, Truck, Factory, FlaskConical, Plane, ArrowRight } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  requisitions: Requisition[];
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ inventory, requisitions, onNavigate }) => {
  
  const { stats, lowStockItems } = useMemo(() => {
    const totalItems = inventory.reduce((acc, curr) => acc + curr.quantity, 0);
    
    // Identify low stock items
    const lowStockItems = inventory.filter(i => i.quantity <= i.minStockLevel);
    const lowStockCount = lowStockItems.length;
    
    const pendingReqs = requisitions.filter(r => r.status === 'PENDING').length;
    const expiredRisk = inventory.filter(i => {
      const expDate = new Date(i.expiryDate);
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      return expDate < threeMonthsFromNow;
    }).length;

    return { 
      stats: { totalItems, lowStockCount, pendingReqs, expiredRisk },
      lowStockItems
    };
  }, [inventory, requisitions]);

  const locationData = useMemo(() => {
    const data = [
      { name: 'Labs/Fábrica CL', value: 0 },
      { name: 'Logística CL', value: 0 },
      { name: 'Brasil', value: 0 },
    ];
    
    inventory.forEach(item => {
      if (item.location.includes('Lab') || item.location.includes('Fábrica')) {
        data[0].value += item.quantity;
      } else if (item.location.includes('Chile')) {
        data[1].value += item.quantity;
      } else if (item.location.includes('Brasil')) {
        data[2].value += item.quantity;
      }
    });
    
    return data;
  }, [inventory]);

  const handleDownloadExcel = () => {
    const headers = ['SKU', 'Nombre', 'Categoria', 'Ubicacion', 'Lote', 'Vencimiento', 'Cantidad', 'Unidad'];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + inventory.map(row => {
          return `${row.sku},"${row.name}",${row.category},${row.location},${row.batchNumber},${row.expiryDate},${row.quantity},${row.unit}`;
      }).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventario_phagelab.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Dashboard General</h2>
        <p className="text-slate-500">Resumen operativo de Chile y Brasil.</p>
      </header>

      {/* Workflow Visualization */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <Truck size={20} className="text-pharma-600" /> Flujo Operativo (Supply Chain)
        </h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 overflow-x-auto pb-4">
          
          {/* Node 1: Suppliers */}
          <div className="flex flex-col items-center min-w-[120px]">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border-2 border-slate-200">
              <Factory size={24} />
            </div>
            <span className="text-xs font-bold text-slate-600 mt-2">Proveedores</span>
            <span className="text-[10px] text-slate-400">Materia Prima</span>
          </div>

          <ArrowRight className="text-slate-300 hidden md:block" />

          {/* Node 2: Chile Logistica */}
          <div className="flex flex-col items-center min-w-[120px]">
             <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border-2 border-blue-200 relative">
               <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] px-2 rounded-full">Hub</div>
               <Factory size={24} />
             </div>
             <span className="text-xs font-bold text-blue-800 mt-2">Chile Logística</span>
             <span className="text-[10px] text-slate-400">Almacenamiento Central</span>
          </div>

          {/* Split Flows */}
          <div className="flex flex-row md:flex-col gap-8 items-center h-full justify-center">
             <div className="flex items-center">
                <ArrowRight className="text-slate-300 rotate-90 md:rotate-0 transform md:-rotate-45" />
             </div>
             <div className="flex items-center">
                <ArrowRight className="text-slate-300 rotate-90 md:rotate-0 transform md:rotate-45" />
             </div>
          </div>

          <div className="flex flex-col gap-6">
             {/* Node 3a: Labs */}
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 border-2 border-purple-200">
                  <FlaskConical size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">Laboratorios (Chile)</span>
                  <span className="text-[10px] text-slate-400">Consumo Interno</span>
                </div>
             </div>

             {/* Node 3b: Brasil */}
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 border-2 border-emerald-200">
                  <Plane size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">Brasil (Logvet/Palotina)</span>
                  <span className="text-[10px] text-slate-400">Venta & Distribución</span>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Unidades</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalItems.toLocaleString()}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-pharma-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Alertas Stock Bajo</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.lowStockCount}</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-red-500">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Pedidos Lab Pendientes</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingReqs}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-500">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Riesgo Vencimiento</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.expiredRisk}</h3>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Charts & Shortcuts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribución de Stock por Ubicación</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                  {locationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0ea5e9' : index === 1 ? '#0284c7' : '#2dd4bf'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Accesos Directos</h3>
          <div className="space-y-3">
            <button onClick={() => onNavigate('inventory')} className="w-full text-left px-4 py-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-sm font-medium transition flex items-center justify-between group border border-emerald-100">
              <span className="flex items-center gap-2"><Truck size={16}/> Registrar Entrada</span>
              <span className="text-emerald-400 group-hover:translate-x-1 transition">→</span>
            </button>
            <button onClick={() => onNavigate('inventory')} className="w-full text-left px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-sm font-medium transition flex items-center justify-between group border border-blue-100">
              <span className="flex items-center gap-2"><Factory size={16}/> Registrar Producción</span>
              <span className="text-blue-400 group-hover:translate-x-1 transition">→</span>
            </button>
            <button onClick={() => onNavigate('inventory')} className="w-full text-left px-4 py-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 text-sm font-medium transition flex items-center justify-between group border border-orange-100">
              <span className="flex items-center gap-2"><ArrowRight size={16}/> Nueva Venta (Salida)</span>
              <span className="text-orange-400 group-hover:translate-x-1 transition">→</span>
            </button>
            <button onClick={handleDownloadExcel} className="w-full text-left px-4 py-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium transition flex items-center justify-between group border border-slate-200">
              <span className="flex items-center gap-2"><Truck size={16}/> Descargar Excel</span>
              <span className="text-slate-400 group-hover:translate-x-1 transition">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alerts Section */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-2 bg-red-100 rounded-lg text-red-600">
               <AlertTriangle size={20} />
             </div>
             <div>
               <h3 className="text-lg font-bold text-red-800">Alertas Críticas</h3>
               <p className="text-xs text-red-600 font-medium">Los siguientes productos están por debajo del nivel mínimo de stock.</p>
             </div>
          </div>
          
          <div className="bg-white rounded-lg border border-red-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-red-50 text-red-800 border-b border-red-100 uppercase text-xs font-semibold">
                        <tr>
                            <th className="p-4">SKU</th>
                            <th className="p-4">Producto</th>
                            <th className="p-4">Ubicación</th>
                            <th className="p-4 text-right">Stock Actual</th>
                            <th className="p-4 text-right">Nivel Mínimo</th>
                            <th className="p-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50">
                        {lowStockItems.map(item => (
                            <tr key={item.id} className="hover:bg-red-50/30 transition">
                                <td className="p-4 font-mono text-slate-500 font-medium">{item.sku}</td>
                                <td className="p-4 font-bold text-slate-700">{item.name}</td>
                                <td className="p-4 text-slate-600">{item.location}</td>
                                <td className="p-4 text-right font-bold text-red-600">{item.quantity} {item.unit}</td>
                                <td className="p-4 text-right text-slate-500">{item.minStockLevel} {item.unit}</td>
                                <td className="p-4 text-center">
                                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                                    REPONER
                                  </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
