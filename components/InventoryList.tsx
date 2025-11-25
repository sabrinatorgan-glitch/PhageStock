
import React, { useState, useRef } from 'react';
import { InventoryItem, Category, Location, StockMovement, User, UserRole } from '../types';
import { Search, Plus, Edit, Trash2, ArrowRightLeft, History, ScanLine, Printer, Settings, X, Eye, MapPin, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';

interface InventoryListProps {
  items: InventoryItem[];
  movements?: StockMovement[];
  currentUser: User;
  activeLocations?: string[];
  onAddItem: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onRegisterMovement: (movement: StockMovement) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, movements = [], currentUser, activeLocations = Object.values(Location), onAddItem, onEditItem, onDeleteItem, onRegisterMovement }) => {
  const [filterText, setFilterText] = useState('');
  const [filterLoc, setFilterLoc] = useState<string>('ALL');
  const [filterCat, setFilterCat] = useState<string>('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [scannerInput, setScannerInput] = useState('');
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isPlanningModalOpen, setIsPlanningModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [selectedDetailSku, setSelectedDetailSku] = useState<string | null>(null);
  
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [movingItem, setMovingItem] = useState<InventoryItem | null>(null);
  const [qrItem, setQrItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);

  const isMasterAdmin = currentUser.role === UserRole.MASTER_ADMIN;
  const canEdit = currentUser.role === UserRole.MASTER_ADMIN || currentUser.role === UserRole.ADMIN;
  const canDelete = currentUser.role === UserRole.MASTER_ADMIN;

  const [productForm, setProductForm] = useState<Partial<InventoryItem>>({
    category: Category.RAW_MATERIAL,
    location: activeLocations[0] as Location,
    unit: 'unidades'
  });
  
  const [movementForm, setMovementForm] = useState({
    type: 'ENTRADA' as 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA',
    quantity: 0,
    reason: 'Recebimento de Fornecedor',
    targetLocation: activeLocations[0],
    batchNumber: ''
  });

  const [planningUpdates, setPlanningUpdates] = useState<Record<string, number>>({});

  const handleScannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let scannedInput = scannerInput.trim();
    if (!scannedInput) return;
    
    let targetSku = scannedInput;
    let targetBatch = '';

    // Parse logic for "SKU:XXX|LOTE:YYY" format
    if (scannedInput.includes('|LOTE:')) {
       const parts = scannedInput.split('|');
       const skuPart = parts.find(p => p.startsWith('SKU:'));
       const lotePart = parts.find(p => p.startsWith('LOTE:'));
       if (skuPart) targetSku = skuPart.replace('SKU:', '');
       if (lotePart) targetBatch = lotePart.replace('LOTE:', '');
    }
    
    // Attempt to find exact match by SKU + Batch (if batch provided)
    let foundItem = items.find(i => {
        const matchSku = i.sku.toLowerCase() === targetSku.toLowerCase();
        if (targetBatch) {
            return matchSku && i.batchNumber.toLowerCase() === targetBatch.toLowerCase();
        }
        return matchSku;
    });

    // Fallback: search by Name if no direct SKU match
    if (!foundItem && !targetBatch) {
        foundItem = items.find(i => i.name.toLowerCase().includes(targetSku.toLowerCase()));
    }
    
    if (foundItem) {
      setScanStatus('success');
      setTimeout(() => {
        setIsScannerModalOpen(false);
        handleOpenMovement(foundItem!);
        setScannerInput('');
        setScanStatus('idle');
      }, 500);
    } else {
      setScanStatus('error');
      setTimeout(() => setScanStatus('idle'), 2000);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesText = item.name.toLowerCase().includes(filterText.toLowerCase()) || 
                        item.sku.toLowerCase().includes(filterText.toLowerCase()) ||
                        item.batchNumber.toLowerCase().includes(filterText.toLowerCase());
    const matchesLoc = filterLoc === 'ALL' || item.location === filterLoc;
    const matchesCat = filterCat === 'ALL' || item.category === filterCat;
    
    let matchesDate = true;
    if (filterDateFrom && item.expiryDate) {
        matchesDate = matchesDate && new Date(item.expiryDate) >= new Date(filterDateFrom);
    }
    if (filterDateTo && item.expiryDate) {
        matchesDate = matchesDate && new Date(item.expiryDate) <= new Date(filterDateTo);
    }

    return matchesText && matchesLoc && matchesCat && matchesDate;
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
        location: activeLocations[0] as Location,
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
    setMovementForm({ 
      type: 'SALIDA', 
      quantity: 0, 
      reason: 'Consumo Laboratório', 
      targetLocation: activeLocations.find(l => l !== item.location) || activeLocations[0],
      batchNumber: item.batchNumber
    });
    setIsMovementModalOpen(true);
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingItem) return;

    // Validación: Lote Obligatorio
    if (!movementForm.batchNumber || movementForm.batchNumber.trim() === '') {
        alert("El Número de Lote (Batch) es obligatorio para cualquier movimiento.");
        return;
    }

    if ((movementForm.type === 'SALIDA' || movementForm.type === 'TRANSFERENCIA') && movementForm.quantity > movingItem.quantity) {
      alert(`Error: Stock insuficiente en ${movingItem.location}. Disponible: ${movingItem.quantity}`);
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
      targetLocation: movementForm.type === 'TRANSFERENCIA' ? movementForm.targetLocation : undefined,
      batchNumber: movementForm.batchNumber,
      date: new Date().toISOString(),
      reason: movementForm.reason,
      user: currentUser.name,
      isSynced: false
    });
    setIsMovementModalOpen(false);
  };

  const handleOpenHistory = (item: InventoryItem) => {
    setHistoryItem(item);
    setIsHistoryModalOpen(true);
  };

  const handleOpenQR = (item: InventoryItem) => {
    setQrItem(item);
    setIsQRModalOpen(true);
  };

  const handlePrintQR = () => {
    const printContent = document.getElementById('printable-qr');
    if (printContent) {
      const win = window.open('', '', 'height=600,width=600');
      if (win) {
        win.document.write('<html><head><title>Imprimir QR</title></head><body>');
        win.document.write('<style>body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; margin: 0; } .qr-container { text-align: center; border: 2px solid #000; padding: 20px; border-radius: 10px; } .sku { font-size: 24px; font-weight: bold; margin-top: 10px; } .name { font-size: 18px; margin: 5px 0; } .batch { font-size: 16px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; width: 100%; display: block; } </style>');
        
        // Use the outerHTML of the QR code SVG
        const qrSvg = printContent.querySelector('svg')?.outerHTML || '';
        const sku = qrItem?.sku || '';
        const name = qrItem?.name || '';
        const batch = qrItem?.batchNumber || '';
        
        win.document.write(`
            <div class="qr-container">
                ${qrSvg}
                <div class="sku">${sku}</div>
                <div class="name">${name}</div>
                <div class="batch">Lote: ${batch}</div>
            </div>
        `);
        
        win.document.write('<script>window.onload = function() { window.print(); window.close(); }</script>');
        win.document.write('</body></html>');
        win.document.close();
      }
    }
  };

  const openScannerModal = () => {
    setIsScannerModalOpen(true);
    setScannerInput('');
    setScanStatus('idle');
    setTimeout(() => { scannerInputRef.current?.focus(); }, 100);
  };

  const handleSavePlanning = () => {
    Object.entries(planningUpdates).forEach(([id, newMin]) => {
      const item = items.find(i => i.id === id);
      if (item) onEditItem({ ...item, minStockLevel: newMin });
    });
    setPlanningUpdates({});
    setIsPlanningModalOpen(false);
  };

  const getGlobalStockDetails = (sku: string) => {
    return items.filter(i => i.sku === sku);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Posición de Stock</h2>
          <p className="text-slate-500">Gestión de productos y movimientos por ubicación.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={openScannerModal} className="relative group bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg shadow-md transition font-medium flex items-center gap-2">
             <ScanLine size={18} className="text-pharma-400" /> <span>Modo Escáner (Fullscreen)</span>
          </button>
          {isMasterAdmin && (
            <button onClick={() => setIsPlanningModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md transition font-medium flex items-center gap-2 justify-center">
              <Settings size={18} /> Planificación de Stock
            </button>
          )}
          {canEdit && (
            <button onClick={() => handleOpenProductModal()} className="bg-pharma-600 hover:bg-pharma-700 text-white px-4 py-2 rounded-lg shadow-md transition font-medium flex items-center gap-2 justify-center">
              <Plus size={18} /> Registrar Producto
            </button>
          )}
        </div>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4 xl:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Buscar SKU, Nombre, Lote..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
        </div>
        
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Vencimiento:</span>
            <input type="date" className="p-2 border border-slate-200 rounded-lg text-sm" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
            <span className="text-slate-400">-</span>
            <input type="date" className="p-2 border border-slate-200 rounded-lg text-sm" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
        </div>

        <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={filterLoc} onChange={(e) => setFilterLoc(e.target.value)}>
            <option value="ALL">Todas las Ubicaciones</option>
            {activeLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
        <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="ALL">Todas las Categorías</option>
            {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="p-4">Producto (SKU)</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Ubicación</th>
                <th className="p-4">Lote (Batch)</th>
                <th className="p-4">Vencimiento</th>
                <th className="p-4 text-right">Stock Mínimo</th>
                <th className="p-4 text-right">Saldo Actual</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredItems.map((item) => {
                  const isLow = item.quantity <= item.minStockLevel;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition group">
                      <td className="p-4">
                        <div 
                          className="font-semibold text-slate-900 cursor-pointer hover:text-pharma-600 flex items-center gap-1"
                          onClick={() => setSelectedDetailSku(item.sku)}
                          title="Ver detalle global de stock"
                        >
                          {item.name}
                          <Eye size={14} className="text-slate-300 group-hover:text-pharma-500" />
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1 rounded">{item.sku}</span>
                           <button onClick={() => handleOpenQR(item)} className="text-slate-300 hover:text-pharma-600 transition-colors" title="Generar QR con Lote"><QrCode size={16} /></button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border
                          ${item.category === Category.RAW_MATERIAL ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                            item.category === Category.FINISHED_GOOD ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            item.category === Category.WORK_IN_PROGRESS ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{item.location}</td>
                      <td className="p-4"><span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">{item.batchNumber}</span></td>
                      <td className="p-4">{item.expiryDate}</td>
                      <td className="p-4 text-right text-slate-500">{item.minStockLevel} {item.unit}</td>
                      <td className="p-4 text-right font-medium">
                        <div className={isLow ? 'text-red-600 font-bold' : ''}>{item.quantity} {item.unit}</div>
                        {isLow && <div className="text-[10px] text-red-500">Bajo Stock</div>}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                           <button onClick={() => handleOpenMovement(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Movimiento"><ArrowRightLeft size={18} /></button>
                           <button onClick={() => handleOpenHistory(item)} className="p-2 text-slate-500 hover:bg-slate-100 rounded" title="Historial"><History size={18} /></button>
                          {canEdit && <button onClick={() => handleOpenProductModal(item)} className="p-2 text-slate-600 hover:bg-slate-100 rounded" title="Editar"><Edit size={18} /></button>}
                          {canDelete && <button onClick={() => onDeleteItem(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={18} /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {isMovementModalOpen && movingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-2 text-slate-800">Registrar Movimiento</h3>
             <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm">
              <p><strong>Producto:</strong> {movingItem.name}</p>
              <p><strong>Origen:</strong> {movingItem.location}</p>
              <p><strong>Disponible:</strong> {movingItem.quantity} {movingItem.unit}</p>
            </div>
            <form onSubmit={handleMovementSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  <label className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer ${movementForm.type === 'ENTRADA' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-slate-200'}`}>
                    <input type="radio" name="type" className="hidden" checked={movementForm.type === 'ENTRADA'} onChange={() => setMovementForm({...movementForm, type: 'ENTRADA', reason: 'Compra'})} />
                    <span className="font-bold text-xs">Entrada</span>
                  </label>
                  <label className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer ${movementForm.type === 'SALIDA' ? 'bg-red-50 border-red-200 text-red-700' : 'border-slate-200'}`}>
                    <input type="radio" name="type" className="hidden" checked={movementForm.type === 'SALIDA'} onChange={() => setMovementForm({...movementForm, type: 'SALIDA', reason: 'Consumo'})} />
                    <span className="font-bold text-xs">Salida</span>
                  </label>
                  <label className={`flex flex-col items-center justify-center p-2 rounded border cursor-pointer ${movementForm.type === 'TRANSFERENCIA' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200'}`}>
                    <input type="radio" name="type" className="hidden" checked={movementForm.type === 'TRANSFERENCIA'} onChange={() => setMovementForm({...movementForm, type: 'TRANSFERENCIA', reason: 'Movimiento Interno'})} />
                    <span className="font-bold text-xs">Transferir</span>
                  </label>
                </div>
              </div>
              
              {movementForm.type === 'TRANSFERENCIA' && (
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Destino</label>
                    <select className="w-full p-2 border border-slate-300 rounded" value={movementForm.targetLocation} onChange={e => setMovementForm({...movementForm, targetLocation: e.target.value})}>
                       {activeLocations.filter(l => l !== movingItem.location).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                 </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700">Lote (Batch)</label>
                <input 
                  type="text" 
                  className={`w-full p-2 border border-slate-300 rounded ${movementForm.type !== 'ENTRADA' ? 'bg-slate-100 text-slate-500' : ''}`}
                  value={movementForm.batchNumber} 
                  onChange={e => setMovementForm({...movementForm, batchNumber: e.target.value})} 
                  readOnly={movementForm.type !== 'ENTRADA'}
                  title={movementForm.type !== 'ENTRADA' ? 'El lote solo puede editarse en Entradas (nuevos lotes)' : 'Lote seleccionado automáticamente'}
                  placeholder="Ingrese el lote..."
                  required
                />
                 {movementForm.type === 'ENTRADA' && (
                    <p className="text-[10px] text-slate-500 mt-1">
                       * Si cambia el lote, se creará un nuevo registro en el inventario.
                    </p>
                 )}
              </div>

              <div><label className="block text-sm font-medium text-slate-700">Cantidad</label><input type="number" min="0.01" step="0.01" required className="w-full p-2 border border-slate-300 rounded" value={movementForm.quantity} onChange={e => setMovementForm({...movementForm, quantity: Number(e.target.value)})} /></div>
              <div><label className="block text-sm font-medium text-slate-700">Motivo</label><input type="text" required className="w-full p-2 border border-slate-300 rounded" value={movementForm.reason} onChange={e => setMovementForm({...movementForm, reason: e.target.value})} /></div>
              <div className="flex justify-end gap-2 mt-6 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsMovementModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-pharma-600 text-white rounded hover:bg-pharma-700">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
       {isPlanningModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col p-6">
              <h3 className="text-xl font-bold mb-4">Planificación de Stock</h3>
              <div className="flex-1 overflow-y-auto">
                 <table className="w-full text-sm text-left">
                    <thead><tr><th>SKU</th><th>Nombre</th><th>Min Stock</th><th>Nuevo Min</th></tr></thead>
                    <tbody>
                       {filteredItems.map(item => (
                          <tr key={item.id} className="border-b">
                             <td className="p-2">{item.sku}</td>
                             <td className="p-2">{item.name}</td>
                             <td className="p-2">{item.minStockLevel}</td>
                             <td className="p-2"><input type="number" className="border w-20 p-1" value={planningUpdates[item.id] ?? ''} onChange={e => setPlanningUpdates({...planningUpdates, [item.id]: Number(e.target.value)})} placeholder={String(item.minStockLevel)}/></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                 <button onClick={() => setIsPlanningModalOpen(false)} className="px-4 py-2 bg-slate-200 rounded">Cerrar</button>
                 <button onClick={handleSavePlanning} className="px-4 py-2 bg-purple-600 text-white rounded">Guardar Cambios</button>
              </div>
           </div>
        </div>
      )}

      {isQRModalOpen && qrItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center">
              <h3 className="text-xl font-bold mb-4 text-slate-800">Código QR (SKU+Lote)</h3>
              <div id="printable-qr" className="flex flex-col items-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
                 <QRCode value={`SKU:${qrItem.sku}|LOTE:${qrItem.batchNumber}`} size={180} />
                 <div className="mt-6 text-center w-full">
                    <p className="font-mono font-bold text-2xl text-slate-900">{qrItem.sku}</p>
                    <p className="font-bold text-lg text-slate-700 mt-2 truncate max-w-[250px]">{qrItem.name}</p>
                    <p className="batch-label font-bold text-lg text-black mt-2 border-t pt-2 w-full">Lote: {qrItem.batchNumber}</p>
                 </div>
              </div>
              <div className="flex gap-3 mt-6 w-full">
                <button onClick={() => setIsQRModalOpen(false)} className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 rounded-lg">Cerrar</button>
                <button onClick={handlePrintQR} className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-lg flex items-center justify-center gap-2"><Printer size={20} /> Imprimir</button>
              </div>
           </div>
        </div>
      )}
      
      {isScannerModalOpen && (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-8">
           <button onClick={() => setIsScannerModalOpen(false)} className="absolute top-6 right-6 text-white"><X size={40}/></button>
           <div className={`w-full max-w-2xl p-8 rounded-3xl text-center transition-all duration-300 ${scanStatus === 'success' ? 'bg-emerald-500' : scanStatus === 'error' ? 'bg-red-500' : 'bg-white'}`}>
              <h2 className="text-3xl font-bold mb-6">{scanStatus === 'success' ? '¡Producto Encontrado!' : 'Escanee el Código (SKU o QR)'}</h2>
              <form onSubmit={handleScannerSubmit}>
                 <input ref={scannerInputRef} type="text" value={scannerInput} onChange={e => setScannerInput(e.target.value)} className="w-full text-center text-4xl font-mono p-4 rounded-xl border-4 uppercase" placeholder="ESCANEAR..." autoFocus onBlur={() => setTimeout(() => scannerInputRef.current?.focus(), 10)} />
              </form>
              <p className="mt-4 text-slate-500">Soporta formatos: SKU Simple y SKU|LOTE Completo</p>
           </div>
        </div>
      )}
      
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4 text-slate-800">{editingItem ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700">SKU</label><input required className="w-full p-2 border rounded" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-slate-700">Lote (Batch)</label><input required className="w-full p-2 border rounded" value={productForm.batchNumber} onChange={e => setProductForm({...productForm, batchNumber: e.target.value})} /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700">Nombre</label><input required className="w-full p-2 border rounded" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700">Categoría</label><select className="w-full p-2 border rounded" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value as Category})}>{Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-slate-700">Ubicación</label><select className="w-full p-2 border rounded" value={productForm.location} onChange={e => setProductForm({...productForm, location: e.target.value as Location})}>{activeLocations.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-sm font-medium text-slate-700">Vencimiento</label><input type="date" required className="w-full p-2 border rounded" value={productForm.expiryDate} onChange={e => setProductForm({...productForm, expiryDate: e.target.value})} /></div>
                 <div><label className="block text-sm font-medium text-slate-700">Unidad</label><input required className="w-full p-2 border rounded" value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-sm font-medium text-slate-700">Cantidad Inicial</label><input type="number" required min="0" className="w-full p-2 border rounded" value={productForm.quantity} onChange={e => setProductForm({...productForm, quantity: Number(e.target.value)})} /></div>
                 <div><label className="block text-sm font-medium text-slate-700">Stock Mínimo</label><input type="number" required min="0" className="w-full p-2 border rounded" value={productForm.minStockLevel} onChange={e => setProductForm({...productForm, minStockLevel: Number(e.target.value)})} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-pharma-600 text-white rounded hover:bg-pharma-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isHistoryModalOpen && historyItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 text-slate-800">Historial: {historyItem.name}</h3>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                       <tr>
                          <th className="p-2">Fecha</th>
                          <th className="p-2">Tipo</th>
                          <th className="p-2">Cantidad</th>
                          <th className="p-2">Usuario</th>
                          <th className="p-2">Motivo</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {movements.filter(m => m.itemId === historyItem.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(m => (
                          <tr key={m.id}>
                             <td className="p-2">{new Date(m.date).toLocaleDateString()}</td>
                             <td className="p-2 font-bold text-xs">{m.type}</td>
                             <td className={`p-2 font-bold ${m.type === 'ENTRADA' ? 'text-emerald-600' : 'text-red-600'}`}>{m.quantity}</td>
                             <td className="p-2">{m.user}</td>
                             <td className="p-2 text-slate-500 italic">{m.reason}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="mt-4 flex justify-end">
                 <button onClick={() => setIsHistoryModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded">Cerrar</button>
              </div>
           </div>
        </div>
      )}

      {selectedDetailSku && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="text-2xl font-bold text-slate-800">Detalle Global de Stock</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono text-sm">{selectedDetailSku}</span>
                     <span className="text-lg font-medium text-pharma-700">{getGlobalStockDetails(selectedDetailSku)[0]?.name}</span>
                  </div>
               </div>
               <button onClick={() => setSelectedDetailSku(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><X size={24}/></button>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-6 flex justify-between items-center border border-slate-200">
               <div>
                 <p className="text-sm text-slate-500 font-medium">Stock Total Global</p>
                 <p className="text-3xl font-bold text-slate-800">
                    {getGlobalStockDetails(selectedDetailSku).reduce((acc, curr) => acc + curr.quantity, 0)} <span className="text-sm font-normal text-slate-500">{getGlobalStockDetails(selectedDetailSku)[0]?.unit}</span>
                 </p>
               </div>
               <div className="text-right">
                  <p className="text-sm text-slate-500 font-medium">Ubicaciones Activas</p>
                  <p className="text-xl font-bold text-pharma-600">
                     {new Set(getGlobalStockDetails(selectedDetailSku).map(i => i.location)).size}
                  </p>
               </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold">
                     <tr>
                        <th className="p-3">Ubicación</th>
                        <th className="p-3">Lote (Batch)</th>
                        <th className="p-3">Vencimiento</th>
                        <th className="p-3 text-right">Cantidad</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {getGlobalStockDetails(selectedDetailSku)
                       .sort((a,b) => a.location.localeCompare(b.location))
                       .map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                           <td className="p-3 font-medium text-slate-700 flex items-center gap-2">
                              <MapPin size={14} className="text-slate-400" /> {item.location}
                           </td>
                           <td className="p-3 font-mono text-slate-600">{item.batchNumber}</td>
                           <td className="p-3 text-slate-600">{item.expiryDate}</td>
                           <td className="p-3 text-right font-bold text-slate-800">{item.quantity}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="mt-6 flex justify-end">
               <button onClick={() => setSelectedDetailSku(null)} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium">Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InventoryList;
