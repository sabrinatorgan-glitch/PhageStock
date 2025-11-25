
import React, { useState, useRef } from 'react';
import { InventoryItem, Category, Location, StockMovement, User, UserRole } from '../types';
import { Search, Plus, Edit, Trash2, ArrowRightLeft, FileText, Calendar, Tag, QrCode, ScanLine, Printer, Settings, Save, X, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface InventoryListProps {
  items: InventoryItem[];
  currentUser: User;
  onAddItem: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onRegisterMovement: (movement: StockMovement) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, currentUser, onAddItem, onEditItem, onDeleteItem, onRegisterMovement }) => {
  const [filterText, setFilterText] = useState('');
  const [filterLoc, setFilterLoc] = useState<string>('ALL');
  const [filterCat, setFilterCat] = useState<string>('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Scanner State
  const [scannerInput, setScannerInput] = useState('');
  const scannerInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false); // New Planning Modal
  
  // Selection
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [movingItem, setMovingItem] = useState<InventoryItem | null>(null);
  const [qrItem, setQrItem] = useState<InventoryItem | null>(null);

  // Permissions
  const isMasterAdmin = currentUser.role === UserRole.MASTER_ADMIN;
  const canEdit = currentUser.role === UserRole.MASTER_ADMIN || currentUser.role === UserRole.ADMIN;
  const canDelete = currentUser.role === UserRole.MASTER_ADMIN;

  // Forms state
  const [productForm, setProductForm] = useState<Partial<InventoryItem>>({
    category: Category.RAW_MATERIAL,
    location: Location.CHILE_LOGISTICA,
    unit: 'unidades'
  });
  
  const [movementForm, setMovementForm] = useState({
    type: 'ENTRADA' as 'ENTRADA' | 'SALIDA',
    quantity: 0,
    reason: 'Recebimento de Fornecedor'
  });

  // Planning Mode State
  const [planningUpdates, setPlanningUpdates] = useState<Record<string, number>>({});

  // Scanner Logic
  const handleScannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scannedSku = scannerInput.trim();
    if (!scannedSku) return;

    const foundItem = items.find(i => i.sku.toLowerCase() === scannedSku.toLowerCase());
    
    if (foundItem) {
      handleOpenMovement(foundItem);
      setScannerInput('');
    } else {
      alert(`SKU no encontrado: ${scannedSku}`);
      setScannerInput('');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesText = item.name.toLowerCase().includes(filterText.toLowerCase()) || 
                        item.sku.toLowerCase().includes(filterText.toLowerCase()) ||
                        item.batchNumber.toLowerCase().includes(filterText.toLowerCase());
    const matchesLoc = filterLoc === 'ALL' || item.location === filterLoc;
    const matchesCat = filterCat === 'ALL' || item.category === filterCat;

    const itemDate = new Date(item.expiryDate).getTime();
    const fromDate = filterDateFrom ? new Date(filterDateFrom).getTime() : null;
    const toDate = filterDateTo ? new Date(filterDateTo).getTime() : null;

    const matchesFrom = !fromDate || itemDate >= fromDate;
    const matchesTo = !toDate || itemDate <= toDate;

    return matchesText && matchesLoc && matchesCat && matchesFrom && matchesTo;
  });

  const handleOpenProductModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setProductForm(item);
    } else {
      setEditingItem(null);
      setProductForm({
        sku: '',
        name: '',
        description: '',
        category: Category.RAW_MATERIAL,
        location: Location.CHILE_LOGISTICA,
        batchNumber: '',
        expiryDate: '',
        quantity: 0,
        unit: 'kg',
        minStockLevel: 0
      });
    }
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      onEditItem({ ...productForm, id: editingItem.id } as InventoryItem);
    } else {
      onAddItem({ ...productForm, id: Math.random().toString(36).substr(2, 9) } as InventoryItem);
    }
    setIsProductModalOpen(false);
  };

  const handleOpenMovement = (item: InventoryItem) => {
    setMovingItem(item);
    setMovementForm({ type: 'SALIDA', quantity: 0, reason: 'Consumo Laboratório' });
    setIsMovementModalOpen(true);
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingItem) return;

    if (movementForm.type === 'SALIDA' && movementForm.quantity > movingItem.quantity) {
      alert(`Error: Stock insuficiente en ${movingItem.location}. Disponible: ${movingItem.quantity}, Solicitado: ${movementForm.quantity}`);
      return;
    }

    onRegisterMovement({
      id: Math.random().toString(36).substr(2, 9),
      itemId: movingItem.id,
      itemSku: movingItem.sku,
      itemName: movingItem.name,
      type: movementForm.type,
      quantity: movementForm.quantity,
      location: movingItem.location,
      date: new Date().toISOString(),
      reason: movementForm.reason,
      user: currentUser.name
    });
    setIsMovementModalOpen(false);
  };

  const handleOpenQR = (item: InventoryItem) => {
    setQrItem(item);
    setIsQRModalOpen(true);
  };

  const handlePrintQR = () => {
    const printContent = document.getElementById('printable-qr');
    if (printContent) {
      const win = window.open('', '', 'height=500,width=500');
      if (win) {
        win.document.write('<html><head><title>Imprimir QR</title></head><body >');
        win.document.write(printContent.innerHTML);
        win.document.write('</body></html>');
        win.document.close();
        win.print();
      }
    }
  };

  // Planning Logic
  const handleSavePlanning = () => {
    Object.entries(planningUpdates).forEach(([id, newMin]) => {
      const item = items.find(i => i.id === id);
      if (item) {
        onEditItem({ ...item, minStockLevel: newMin });
      }
    });
    setPlanningUpdates({});
    setIsPlanningModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Posición de Stock</h2>
          <p className="text-slate-500">Gestión de productos y movimientos por ubicación.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleScannerSubmit} className="relative group">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
               <ScanLine size={18} />
             </div>
             <input 
               ref={scannerInputRef}
               type="text" 
               className="pl-10 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:border-pharma-500 focus:ring-0 outline-none w-full sm:w-64 transition-colors"
               placeholder="Escanear SKU aquí..."
               value={scannerInput}
               onChange={(e) => setScannerInput(e.target.value)}
               autoFocus
             />
          </form>

          {isMasterAdmin && (
            <button 
              onClick={() => setIsPlanningModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md transition font-medium flex items-center gap-2 justify-center"
            >
              <Settings size={18} /> Planificación de Stock
            </button>
          )}

          {canEdit && (
            <button 
              onClick={() => handleOpenProductModal()}
              className="bg-pharma-600 hover:bg-pharma-700 text-white px-4 py-2 rounded-lg shadow-md transition font-medium flex items-center gap-2 justify-center"
            >
              <Plus size={18} /> Registrar Producto
            </button>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4 xl:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar SKU, Nombre, Lote..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-500 text-sm"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto">
          <select 
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600 focus:outline-none focus:border-pharma-500"
            value={filterLoc}
            onChange={(e) => setFilterLoc(e.target.value)}
          >
            <option value="ALL">Todas las Ubicaciones</option>
            {Object.values(Location).map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>

          <select 
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600 focus:outline-none focus:border-pharma-500"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="ALL">Todas las Categorías</option>
            {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
             <Calendar size={16} className="text-slate-400" />
             <input 
               type="date" 
               className="text-sm bg-transparent border-none focus:ring-0 text-slate-600 p-0 w-32"
               value={filterDateFrom}
               onChange={(e) => setFilterDateFrom(e.target.value)}
             />
             <span className="text-slate-400">-</span>
             <input 
               type="date" 
               className="text-sm bg-transparent border-none focus:ring-0 text-slate-600 p-0 w-32"
               value={filterDateTo}
               onChange={(e) => setFilterDateTo(e.target.value)}
             />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
           <h3 className="font-semibold text-slate-700 flex items-center gap-2">
             <FileText size={18} /> Reporte de Saldos Actuales
           </h3>
           <span className="text-xs text-slate-400">Total registros: {filteredItems.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="p-4">Producto (SKU)</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Ubicación</th>
                <th className="p-4 flex items-center gap-1">
                  <Tag size={14} /> Lote (Batch)
                </th>
                <th className="p-4">Vencimiento</th>
                <th className="p-4 text-right">Saldo Actual</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No se encontraron productos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.quantity <= item.minStockLevel;
                  const expDate = new Date(item.expiryDate);
                  const isNearExp = expDate < new Date(new Date().setMonth(new Date().getMonth() + 3));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition group">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1 rounded">{item.sku}</span>
                           <button onClick={() => handleOpenQR(item)} className="text-slate-300 hover:text-slate-600" title="Ver QR">
                             <QrCode size={14} />
                           </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border
                          ${item.category === Category.RAW_MATERIAL ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                            item.category === Category.FINISHED_GOOD ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{item.location}</td>
                      <td className="p-4">
                        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                          {item.batchNumber}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className={`flex items-center gap-1 ${isNearExp ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                          {item.expiryDate}
                          {isNearExp && <AlertCircle size={14} />}
                        </div>
                      </td>
                      <td className="p-4 text-right font-medium">
                        <div className={isLow ? 'text-red-600 font-bold' : ''}>
                          {item.quantity} {item.unit}
                        </div>
                        {isLow && <div className="text-[10px] text-red-500">Bajo Stock (Min: {item.minStockLevel})</div>}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenMovement(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-100" title="Registrar Movimiento">
                            <ArrowRightLeft size={18} />
                          </button>
                          
                          {canEdit && (
                            <button onClick={() => handleOpenProductModal(item)} className="p-2 text-slate-600 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200" title="Editar">
                              <Edit size={18} />
                            </button>
                          )}
                          
                          {canDelete && (
                            <button onClick={() => onDeleteItem(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-100" title="Eliminar">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Planning Modal (Master Admin Only) */}
      {isPlanningModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                 <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                       <Settings className="text-purple-600" /> Planificación de Stock
                    </h3>
                    <p className="text-sm text-slate-500">Defina los niveles mínimos para activar alertas de reabastecimiento.</p>
                 </div>
                 <button onClick={() => setIsPlanningModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-purple-50 text-purple-900 uppercase text-xs font-semibold">
                       <tr>
                          <th className="p-3">SKU</th>
                          <th className="p-3">Producto</th>
                          <th className="p-3">Ubicación</th>
                          <th className="p-3 text-right">Consumo Promedio (Est.)</th>
                          <th className="p-3 text-right">Min Stock Actual</th>
                          <th className="p-3 text-right">Nuevo Min Stock</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                       {filteredItems.map(item => (
                          <tr key={item.id} className="hover:bg-purple-50/30">
                             <td className="p-3 font-mono text-slate-500">{item.sku}</td>
                             <td className="p-3 font-medium text-slate-800">{item.name}</td>
                             <td className="p-3 text-slate-500">{item.location}</td>
                             <td className="p-3 text-right text-slate-400 italic">--</td>
                             <td className="p-3 text-right font-bold text-slate-700">{item.minStockLevel}</td>
                             <td className="p-3">
                                <input 
                                   type="number"
                                   className="w-24 p-2 text-right border border-purple-200 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                                   placeholder={String(item.minStockLevel)}
                                   value={planningUpdates[item.id] !== undefined ? planningUpdates[item.id] : ''}
                                   onChange={(e) => setPlanningUpdates({...planningUpdates, [item.id]: Number(e.target.value)})}
                                />
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                 <button onClick={() => setIsPlanningModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">Cancelar</button>
                 <button onClick={handleSavePlanning} className="px-6 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-medium shadow-lg shadow-purple-500/30 flex items-center gap-2">
                    <Save size={18} /> Guardar Planificación
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Other Modals (QR, Product, Movement) remain mostly same but ensured they are present */}
      {isQRModalOpen && qrItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center">
              <h3 className="text-xl font-bold mb-4 text-slate-800">Código QR de Producto</h3>
              <div id="printable-qr" className="flex flex-col items-center p-4 border border-dashed border-slate-300 rounded-lg">
                 <QRCodeSVG value={qrItem.sku} size={150} />
                 <div className="mt-4 text-center">
                    <p className="font-bold text-lg">{qrItem.sku}</p>
                    <p className="text-sm text-slate-600">{qrItem.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{qrItem.location}</p>
                 </div>
              </div>
              <div className="flex gap-3 mt-6 w-full">
                <button onClick={() => setIsQRModalOpen(false)} className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Cerrar</button>
                <button onClick={handlePrintQR} className="flex-1 px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg transition flex items-center justify-center gap-2"><Printer size={18} /> Imprimir</button>
              </div>
           </div>
        </div>
      )}

      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-bold mb-1 text-slate-800">{editingItem ? 'Editar Producto' : 'Registro de Producto'}</h3>
            <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Product Form Fields (Same as before) */}
              <div><label className="block text-sm font-medium text-slate-700">SKU</label><input required className="w-full p-2 border border-slate-300 rounded" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700">Nombre</label><input required className="w-full p-2 border border-slate-300 rounded" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700">Descripción</label><input className="w-full p-2 border border-slate-300 rounded" value={productForm.description || ''} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700">Categoría</label><select className="w-full p-2 border border-slate-300 rounded" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value as Category})}>{Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700">Unidad</label><input required className="w-full p-2 border border-slate-300 rounded" value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700">Ubicación</label><select className="w-full p-2 border border-slate-300 rounded" value={productForm.location} onChange={e => setProductForm({...productForm, location: e.target.value as Location})}>{Object.values(Location).map(l => <option key={l} value={l}>{l}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-slate-700">Lote</label><input required className="w-full p-2 border border-slate-300 rounded" value={productForm.batchNumber} onChange={e => setProductForm({...productForm, batchNumber: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700">Vencimiento</label><input type="date" required className="w-full p-2 border border-slate-300 rounded" value={productForm.expiryDate} onChange={e => setProductForm({...productForm, expiryDate: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700">Stock Inicial</label><input type="number" required className="w-full p-2 border border-slate-300 rounded" value={productForm.quantity} onChange={e => setProductForm({...productForm, quantity: Number(e.target.value)})} /></div>
              <div className="md:col-span-2 flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-pharma-600 text-white rounded hover:bg-pharma-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMovementModalOpen && movingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-2 text-slate-800">Registrar Movimiento</h3>
            {/* Movement Form Logic (Same as before) */}
             <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm">
              <p><span className="font-semibold text-slate-600">Producto:</span> {movingItem.name}</p>
              <p><span className="font-semibold text-slate-600">Ubicación:</span> {movingItem.location}</p>
              <p><span className="font-semibold text-slate-600">Saldo Actual:</span> {movingItem.quantity} {movingItem.unit}</p>
            </div>
            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${movementForm.type === 'ENTRADA' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="type" className="hidden" checked={movementForm.type === 'ENTRADA'} onChange={() => setMovementForm({...movementForm, type: 'ENTRADA', reason: 'Recebimento de Fornecedor'})} />
                    <span className="font-bold">Entrada (+)</span>
                  </label>
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${movementForm.type === 'SALIDA' ? 'bg-red-50 border-red-200 text-red-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="type" className="hidden" checked={movementForm.type === 'SALIDA'} onChange={() => setMovementForm({...movementForm, type: 'SALIDA', reason: 'Consumo Laboratório'})} />
                    <span className="font-bold">Salida (-)</span>
                  </label>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700">Cantidad</label><input type="number" min="0.01" step="0.01" required className="w-full p-2 border border-slate-300 rounded" value={movementForm.quantity} onChange={e => setMovementForm({...movementForm, quantity: Number(e.target.value)})} /></div>
              <div><label className="block text-sm font-medium text-slate-700">Motivo</label><select className="w-full p-2 border border-slate-300 rounded" value={movementForm.reason} onChange={e => setMovementForm({...movementForm, reason: e.target.value})}>{movementForm.type === 'ENTRADA' ? ['Recebimento de Fornecedor', 'Producción Finalizada', 'Devolución Cliente', 'Transferencia (Entrada)', 'Ajuste de Inventario'].map(r => <option key={r}>{r}</option>) : ['Venta Brasil', 'Venta Chile', 'Consumo Laboratório', 'Mermas / Pérdidas', 'Transferencia (Salida)', 'Ajuste de Inventario'].map(r => <option key={r}>{r}</option>)}</select></div>
              <div className="flex justify-end gap-2 mt-6 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsMovementModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                <button type="submit" className={`px-4 py-2 text-white rounded ${movementForm.type === 'ENTRADA' ? 'bg-emerald-600' : 'bg-red-600'}`}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
