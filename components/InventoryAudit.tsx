
import React, { useState } from 'react';
import { InventoryItem, Location } from '../types';
import { ClipboardCheck, Save, Search, AlertTriangle, CheckCircle, Download, Upload, FileUp } from 'lucide-react';

interface InventoryAuditProps {
  items: InventoryItem[];
  onApplyAdjustments: (adjustments: { itemId: string, newQuantity: number, variance: number }[]) => void;
}

const InventoryAudit: React.FC<InventoryAuditProps> = ({ items, onApplyAdjustments }) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | 'ALL'>('ALL');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [externalCounts, setExternalCounts] = useState<Record<string, number>>({}); // Pulsar Data
  const [auditFilter, setAuditFilter] = useState('');
  
  // Workflow state
  const [showConfirm, setShowConfirm] = useState(false);
  const [auditSuccess, setAuditSuccess] = useState(false);
  const [processedAdjustments, setProcessedAdjustments] = useState<{ itemId: string, itemSku: string, itemName: string, location: string, oldQty: number, newQty: number, variance: number }[]>([]);

  const filteredItems = items.filter(i => {
    const locMatch = selectedLocation === 'ALL' || i.location === selectedLocation;
    const textMatch = i.name.toLowerCase().includes(auditFilter.toLowerCase()) || i.sku.toLowerCase().includes(auditFilter.toLowerCase());
    return locMatch && textMatch;
  });

  const handleCountChange = (id: string, val: string) => {
    setCounts(prev => ({ ...prev, [id]: Number(val) }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate CSV parsing (Simple mock: SKU,Qty)
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // In a real app, use PapaParse. Here we mock random data matching some SKUs for demo
      const mockExternalData: Record<string, number> = {};
      
      // Simulate that the file contained some discrepancies
      items.forEach(item => {
        // Randomly assign a difference to simulate "Pulsar vs PhageLab"
        if (Math.random() > 0.7) {
            mockExternalData[item.sku] = item.quantity + (Math.floor(Math.random() * 5) - 2); 
        } else {
            mockExternalData[item.sku] = item.quantity;
        }
      });
      setExternalCounts(mockExternalData);
      alert('Datos de Pulsar importados correctamente (Simulación). Verifique la columna "Sistema Externo".');
    };
    reader.readAsText(file);
  };

  const handlePreSave = () => {
    // Determine the target quantity: Manual Count (if present) > External Count (if present) > System Count
    // But for audit, we only care if Manual Count exists.
    // If user wants to adopt Pulsar count, they should type it in Manual Count or we could add a button "Adopt Pulsar".
    
    const adjustments = items
      .filter(item => counts[item.id] !== undefined)
      .map(item => {
        const physical = counts[item.id];
        const variance = physical - item.quantity;
        return {
          itemId: item.id,
          itemSku: item.sku,
          itemName: item.name,
          location: item.location,
          oldQty: item.quantity,
          newQty: physical,
          variance
        };
      })
      .filter(adj => adj.variance !== 0);

    setProcessedAdjustments(adjustments);
    setShowConfirm(true);
  };

  const handleConfirmAdjustments = () => {
    const payload = processedAdjustments.map(adj => ({
      itemId: adj.itemId,
      newQuantity: adj.newQty,
      variance: adj.variance
    }));
    
    onApplyAdjustments(payload);
    setShowConfirm(false);
    setAuditSuccess(true);
  };

  const downloadReport = (system: 'PULSAR' | 'OMIE') => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (system === 'PULSAR') {
      csvContent += "SKU;Description;Batch;ExpiryDate;Location;SystemQty;CountQty;Variance;AdjustmentType;Date\n";
      processedAdjustments.forEach(row => {
        const item = items.find(i => i.id === row.itemId);
        const type = row.variance > 0 ? 'ENTRADA_AJUSTE' : 'SALIDA_AJUSTE';
        csvContent += `${row.itemSku};"${row.itemName}";${item?.batchNumber || ''};${item?.expiryDate || ''};${row.location};${row.oldQty};${row.newQty};${row.variance};${type};${new Date().toISOString().slice(0,10)}\n`;
      });
    } else {
      csvContent += "Codigo_Produto,Descricao,Local_Estoque,Quantidade_Ajuste,Tipo_Movimento\n";
      processedAdjustments.forEach(row => {
        const type = row.variance > 0 ? 'ENTRADA' : 'SAIDA';
        csvContent += `${row.itemSku},"${row.itemName}",${row.location},${Math.abs(row.variance)},${type}\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PhageLab_Audit_${system}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAudit = () => {
    setCounts({});
    setExternalCounts({});
    setAuditSuccess(false);
    setProcessedAdjustments([]);
    setShowConfirm(false);
  };

  if (auditSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 pt-10">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"><CheckCircle size={48} /></div>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800">Conciliación Completada</h2>
          <p className="text-slate-500 mt-2">El stock del sistema ha sido actualizado.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          <button onClick={() => downloadReport('PULSAR')} className="flex items-center gap-3 p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg"><div className="bg-blue-50 p-3 rounded-lg text-blue-600"><Download size={24} /></div><div><h4 className="font-bold text-slate-800">Reporte Pulsar</h4></div></button>
          <button onClick={() => downloadReport('OMIE')} className="flex items-center gap-3 p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg"><div className="bg-indigo-50 p-3 rounded-lg text-indigo-600"><Download size={24} /></div><div><h4 className="font-bold text-slate-800">Reporte Omie</h4></div></button>
        </div>
        <button onClick={resetAudit} className="text-slate-500 hover:text-pharma-600 font-medium mt-8">Iniciar nueva auditoría</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-bold text-slate-800">Conciliación de Inventario</h2>
           <p className="text-slate-500">Cruce de datos (Pulsar vs PhageLab) y ajuste físico.</p>
        </div>
        <label className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50 flex items-center gap-2 shadow-sm">
           <FileUp size={18} /> Importar Datos Pulsar (CSV)
           <input type="file" className="hidden" accept=".csv,.xlsx" onChange={handleFileUpload} />
        </label>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar item..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm" value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)} />
        </div>
        <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm flex-1 md:w-48" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value as Location | 'ALL')}>
            <option value="ALL">Todas las Ubicaciones</option>
            {Object.values(Location).map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
        <button onClick={handlePreSave} className="flex items-center gap-2 bg-pharma-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-pharma-700 w-full md:w-auto justify-center">
          <Save size={18} /> Revisar y Ajustar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="p-4">SKU / Producto</th>
                <th className="p-4">Ubicación</th>
                <th className="p-4 text-right bg-slate-100">Sistema (PhageLab)</th>
                <th className="p-4 text-right bg-orange-50 text-orange-800">Sistema Externo (Pulsar)</th>
                <th className="p-4 text-center w-32 bg-blue-50/50">Conteo Físico</th>
                <th className="p-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const physical = counts[item.id];
                const external = externalCounts[item.sku]; // Match by SKU
                const sysQty = item.quantity;
                
                const variance = physical !== undefined ? physical - sysQty : 0;
                const externalDiff = external !== undefined && external !== sysQty;
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.sku}</div>
                    </td>
                    <td className="p-4 text-slate-600">{item.location}</td>
                    <td className="p-4 text-right font-medium bg-slate-50 border-l border-slate-100">{sysQty}</td>
                    <td className={`p-4 text-right border-l border-white ${externalDiff ? 'bg-red-50 text-red-600 font-bold' : 'bg-orange-50/30 text-slate-400'}`}>
                       {external !== undefined ? external : '-'}
                       {externalDiff && <div className="text-[10px] text-red-500">Difiere del sistema</div>}
                    </td>
                    <td className="p-4 bg-blue-50/30 border-l border-slate-100">
                      <input type="number" className="w-full p-1 border border-blue-200 rounded text-center focus:ring-1 focus:ring-blue-500" placeholder="-" value={physical ?? ''} onChange={(e) => handleCountChange(item.id, e.target.value)} />
                    </td>
                    <td className="p-4 text-center">
                       {physical !== undefined ? (
                           variance === 0 ? <span className="text-emerald-600 text-xs font-bold">OK</span> : <span className="text-red-600 text-xs font-bold">{variance > 0 ? '+' : ''}{variance}</span>
                       ) : (
                           <span className="text-slate-300 text-xs">-</span>
                       )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
             <h3 className="text-xl font-bold mb-4">Confirmar Ajustes</h3>
             <div className="max-h-64 overflow-y-auto mb-6">
                <table className="w-full text-sm">
                   <thead><tr><th className="text-left">Item</th><th className="text-right">Sistema</th><th className="text-right">Nuevo</th></tr></thead>
                   <tbody>
                      {processedAdjustments.map(adj => (
                         <tr key={adj.itemId}>
                            <td className="py-2">{adj.itemName}</td>
                            <td className="text-right">{adj.oldQty}</td>
                            <td className="text-right font-bold">{adj.newQty}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             <div className="flex justify-end gap-3">
                <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
                <button onClick={handleConfirmAdjustments} className="px-6 py-2 bg-pharma-600 text-white rounded-lg">Confirmar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAudit;
