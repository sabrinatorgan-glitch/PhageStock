
import React, { useState } from 'react';
import { Requisition, InventoryItem, Category, User, UserRole } from '../types';
import { Plus, Check, X, Truck, PenTool, ShieldCheck, UserCheck, Calendar, Package } from 'lucide-react';

interface RequisitionSystemProps {
  items: InventoryItem[];
  requisitions: Requisition[];
  currentUser: User;
  onAddRequisition: (req: Omit<Requisition, 'id' | 'status' | 'requestDate'>) => void;
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED' | 'FULFILLED', details?: any) => void;
}

const RequisitionSystem: React.FC<RequisitionSystemProps> = ({ items, requisitions, currentUser, onAddRequisition, onUpdateStatus }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    requesterName: '',
    itemId: '',
    quantityRequested: 0,
    department: 'Control de Calidad',
    requestedExpiryDate: ''
  });

  // Approval Modal State
  const [approvalReq, setApprovalReq] = useState<Requisition | null>(null);
  const [approvalSignature, setApprovalSignature] = useState(false);

  // Delivery Modal State
  const [showDeliveryModal, setShowDeliveryModal] = useState<string | null>(null); // holds req ID
  const [deliveryData, setDeliveryData] = useState({
    receivedBy: '',
    signatureChecked: false,
    selectedBatch: ''
  });

  const labItems = items.filter(i => i.category === Category.LAB_SUPPLY);
  const canApprove = currentUser.role === UserRole.MASTER_ADMIN || currentUser.role === UserRole.ADMIN;
  
  // Calculate tomorrow's date for validation (YYYY-MM-DD)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedItem = items.find(i => i.id === formData.itemId);
    if (!selectedItem) return;

    onAddRequisition({
      requesterName: formData.requesterName,
      itemId: formData.itemId,
      itemName: selectedItem.name,
      quantityRequested: Number(formData.quantityRequested),
      department: formData.department,
      requestedExpiryDate: formData.requestedExpiryDate || undefined
    });
    setShowForm(false);
    setFormData({ requesterName: '', itemId: '', quantityRequested: 0, department: 'Control de Calidad', requestedExpiryDate: '' });
  };

  const initApprove = (req: Requisition) => {
      setApprovalReq(req);
      setApprovalSignature(false);
  };

  const handleConfirmApprove = () => {
    if (!approvalReq) return;
    if (!approvalSignature) {
        alert("Debe firmar digitalmente para aprobar.");
        return;
    }

    // 1. Encontrar o item no inventário
    const item = items.find(i => i.id === approvalReq.itemId);

    if (!item) {
      alert("Error: El ítem solicitado no se encuentra en el inventario.");
      return;
    }

    // 2. Verificar se há estoque suficiente
    if (item.quantity < approvalReq.quantityRequested) {
       alert(`Stock insuficiente para aprobar esta solicitud.\n\nProducto: ${item.name}\nSolicitado: ${approvalReq.quantityRequested}\nDisponible: ${item.quantity} ${item.unit}\nUbicación: ${item.location}\n\nPor favor, rechace la solicitud o reponga el stock antes de aprobar.`);
       return;
    }

    // 3. Se tudo estiver ok, prosseguir com a aprovação assinada
    onUpdateStatus(approvalReq.id, 'APPROVED', {
        approvedBy: currentUser.name,
        approvalDate: new Date().toISOString()
    });
    setApprovalReq(null);
  };

  const handleDeliverySubmit = () => {
    if (showDeliveryModal && deliveryData.receivedBy && deliveryData.signatureChecked && deliveryData.selectedBatch) {
      onUpdateStatus(showDeliveryModal, 'FULFILLED', {
        receivedBy: deliveryData.receivedBy,
        deliveredBy: currentUser.name,
        deliveryDate: new Date().toISOString(),
        digitalSignature: true,
        fulfilledBatchNumber: deliveryData.selectedBatch
      });
      setShowDeliveryModal(null);
      setDeliveryData({ receivedBy: '', signatureChecked: false, selectedBatch: '' });
    } else {
      alert("Debe completar todos los campos: receptor, lote y firma digital.");
    }
  };
  
  // Helper to find available batches for a requisition
  const getAvailableBatches = (reqId: string | null) => {
      if (!reqId) return [];
      const req = requisitions.find(r => r.id === reqId);
      if (!req) return [];
      
      // Find the original item to get the SKU
      const originalItem = items.find(i => i.id === req.itemId);
      if (!originalItem) return [];
      
      // Find all batches for this SKU
      return items.filter(i => i.sku === originalItem.sku);
  };

  const activeBatches = getAvailableBatches(showDeliveryModal);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Requisiciones de Laboratorio</h2>
          <p className="text-slate-500">Solicitud, Aprobación y Entrega de Materiales.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-pharma-600 hover:bg-pharma-700 text-white px-4 py-2 rounded-lg shadow-md transition font-medium flex items-center gap-2"
        >
          <Plus size={18} /> Nueva Solicitud
        </button>
      </header>

      {/* Form Area */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-pharma-500 animate-fade-in">
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium">Solicitante</label><input required className="w-full p-2 border rounded" value={formData.requesterName} onChange={e => setFormData({...formData, requesterName: e.target.value})} /></div>
              <div><label className="block text-sm font-medium">Departamento</label><select className="w-full p-2 border rounded" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}><option>Control de Calidad</option><option>I+D</option><option>Microbiología</option></select></div>
              <div><label className="block text-sm font-medium">Item</label><select required className="w-full p-2 border rounded" value={formData.itemId} onChange={e => setFormData({...formData, itemId: e.target.value})}><option value="">Seleccione...</option>{labItems.map(item => <option key={item.id} value={item.id}>{item.name} ({item.quantity} disp.)</option>)}</select></div>
              <div><label className="block text-sm font-medium">Cantidad</label><input type="number" required min="1" className="w-full p-2 border rounded" value={formData.quantityRequested} onChange={e => setFormData({...formData, quantityRequested: Number(e.target.value)})} /></div>
              
              <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    <Calendar size={14} /> Fecha de Vencimiento Mínima (Preferencia)
                 </label>
                 <input 
                   type="date" 
                   className="w-full p-2 border rounded text-sm text-slate-600" 
                   min={minDate}
                   value={formData.requestedExpiryDate}
                   onChange={e => setFormData({...formData, requestedExpiryDate: e.target.value})}
                 />
                 <p className="text-xs text-slate-400 mt-1">Seleccione solo si requiere un lote con vencimiento posterior a esta fecha.</p>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 mt-2"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-pharma-600 text-white rounded">Enviar</button></div>
           </form>
        </div>
      )}

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Solicitante</th>
                <th className="p-4">Item</th>
                <th className="p-4 text-right">Cant.</th>
                <th className="p-4">Estado / Firmas</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requisitions.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="p-4 text-slate-500">{new Date(req.requestDate).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-slate-800">{req.requesterName}<div className="text-xs text-slate-400">{req.department}</div></td>
                  <td className="p-4 text-slate-700">
                    {req.itemName}
                    {req.requestedExpiryDate && (
                      <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <Calendar size={10} /> Req. Vence {'>'} {new Date(req.requestedExpiryDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-700">{req.quantityRequested}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold inline-block mb-1 ${
                        req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        req.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                        req.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-red-100 text-red-700'}`}>
                      {req.status === 'PENDING' ? 'PENDIENTE' : req.status === 'APPROVED' ? 'APROBADO' : req.status === 'FULFILLED' ? 'ENTREGADO' : 'RECHAZADO'}
                    </span>
                    {req.status === 'APPROVED' && req.approvedBy && (
                         <div className="flex items-center gap-1 text-[10px] text-blue-600">
                            <ShieldCheck size={10} /> Por: {req.approvedBy}
                         </div>
                    )}
                    {req.status === 'FULFILLED' && (
                       <div className="text-[10px] text-slate-500 space-y-0.5 mt-1">
                         {req.fulfilledBatchNumber && (
                             <div className="flex items-center gap-1 font-mono text-slate-700">
                                 <Package size={10} /> Lote: {req.fulfilledBatchNumber}
                             </div>
                         )}
                         {req.approvedBy && <div className="flex items-center gap-1"><ShieldCheck size={10} className="text-blue-500"/> Apr: {req.approvedBy}</div>}
                         <div className="flex items-center gap-1"><UserCheck size={10} className="text-emerald-500"/> Rec: {req.receivedBy}</div>
                       </div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {req.status === 'PENDING' && canApprove && (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => initApprove(req)} className="p-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 flex items-center gap-1 font-medium text-xs" title="Aprobar con Firma">
                            <PenTool size={14} /> Aprobar
                        </button>
                        <button onClick={() => onUpdateStatus(req.id, 'REJECTED')} className="p-2 text-red-600 bg-red-50 rounded hover:bg-red-100" title="Rechazar"><X size={18} /></button>
                      </div>
                    )}
                    {req.status === 'APPROVED' && canApprove && (
                      <button onClick={() => setShowDeliveryModal(req.id)} className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded hover:bg-emerald-100 text-xs font-bold mx-auto">
                         <Truck size={14} /> Entregar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Signature Modal */}
      {approvalReq && (
         <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center gap-3 mb-4 text-blue-700">
                    <ShieldCheck size={28} />
                    <h3 className="text-xl font-bold">Aprobar Solicitud</h3>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200 text-sm">
                    <p><strong>Item:</strong> {approvalReq.itemName}</p>
                    <p><strong>Solicitante:</strong> {approvalReq.requesterName}</p>
                    <p><strong>Cantidad:</strong> {approvalReq.quantityRequested}</p>
                    {approvalReq.requestedExpiryDate && (
                      <p className="text-amber-600 mt-2 font-semibold">
                         * Requiere vencimiento posterior a: {new Date(approvalReq.requestedExpiryDate).toLocaleDateString()}
                      </p>
                    )}
                </div>

                <div className="mb-6">
                    <label className="flex items-center gap-3 p-3 border border-blue-200 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition">
                        <input 
                           type="checkbox" 
                           className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                           checked={approvalSignature}
                           onChange={e => setApprovalSignature(e.target.checked)}
                        />
                        <span className="text-sm text-slate-800 font-medium">
                            Yo, <strong>{currentUser.name}</strong>, autorizo digitalmente esta salida de stock.
                        </span>
                    </label>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={() => setApprovalReq(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                    <button onClick={handleConfirmApprove} disabled={!approvalSignature} className="px-6 py-2 bg-blue-600 text-white rounded shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        Confirmar Aprobación
                    </button>
                </div>
            </div>
         </div>
      )}

      {/* Delivery Signature Modal */}
      {showDeliveryModal && (
         <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
               <div className="flex items-center gap-3 mb-4 text-emerald-700">
                   <PenTool size={28} />
                   <h3 className="text-xl font-bold">Firma de Entrega</h3>
               </div>
               <p className="text-sm text-slate-500 mb-6">Registre quien retira físicamente los materiales y el lote entregado.</p>
               
               <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lote (Batch) Entregado:</label>
                    <select 
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500"
                        value={deliveryData.selectedBatch}
                        onChange={e => setDeliveryData({...deliveryData, selectedBatch: e.target.value})}
                    >
                        <option value="">-- Seleccione Lote --</option>
                        {activeBatches.map(b => (
                            <option key={b.id} value={b.batchNumber}>
                                {b.batchNumber} (Vence: {b.expiryDate}, Qty: {b.quantity})
                            </option>
                        ))}
                    </select>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Recibido por (Nombre):</label>
                     <input 
                        type="text" 
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500" 
                        placeholder="Nombre de quien retira..."
                        value={deliveryData.receivedBy}
                        onChange={e => setDeliveryData({...deliveryData, receivedBy: e.target.value})}
                     />
                  </div>
                  
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                     <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                           type="checkbox" 
                           className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                           checked={deliveryData.signatureChecked}
                           onChange={e => setDeliveryData({...deliveryData, signatureChecked: e.target.checked})}
                        />
                        <span className="text-sm text-emerald-900 font-medium">Declaro haber recibido los productos conforme.</span>
                     </label>
                  </div>
               </div>

               <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowDeliveryModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                  <button onClick={handleDeliverySubmit} disabled={!deliveryData.signatureChecked || !deliveryData.receivedBy || !deliveryData.selectedBatch} className="px-6 py-2 bg-emerald-600 text-white rounded shadow-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      Registrar Entrega
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default RequisitionSystem;
