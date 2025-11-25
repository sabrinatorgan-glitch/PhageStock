
import React, { useState } from 'react';
import { Requisition, InventoryItem, Category, User, UserRole } from '../types';
import { Plus, Check, X, FileSpreadsheet, Lock, Truck, PenTool } from 'lucide-react';

interface RequisitionSystemProps {
  items: InventoryItem[];
  requisitions: Requisition[];
  currentUser: User;
  onAddRequisition: (req: Omit<Requisition, 'id' | 'status' | 'requestDate'>) => void;
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED' | 'FULFILLED', deliveryDetails?: any) => void;
}

const RequisitionSystem: React.FC<RequisitionSystemProps> = ({ items, requisitions, currentUser, onAddRequisition, onUpdateStatus }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    requesterName: '',
    itemId: '',
    quantityRequested: 0,
    department: 'Control de Calidad'
  });

  // Delivery Signature Modal State
  const [showDeliveryModal, setShowDeliveryModal] = useState<string | null>(null); // holds req ID
  const [deliveryData, setDeliveryData] = useState({
    receivedBy: '',
    signatureChecked: false
  });

  const labItems = items.filter(i => i.category === Category.LAB_SUPPLY);
  const canApprove = currentUser.role === UserRole.MASTER_ADMIN || currentUser.role === UserRole.ADMIN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedItem = items.find(i => i.id === formData.itemId);
    if (!selectedItem) return;

    onAddRequisition({
      requesterName: formData.requesterName,
      itemId: formData.itemId,
      itemName: selectedItem.name,
      quantityRequested: Number(formData.quantityRequested),
      department: formData.department
    });
    setShowForm(false);
    setFormData({ requesterName: '', itemId: '', quantityRequested: 0, department: 'Control de Calidad' });
  };

  const handleApprove = (req: Requisition) => {
    // 1. Encontrar o item no inventário
    const item = items.find(i => i.id === req.itemId);

    if (!item) {
      alert("Error: El ítem solicitado no se encuentra en el inventario.");
      return;
    }

    // 2. Verificar se há estoque suficiente
    if (item.quantity < req.quantityRequested) {
       alert(`Stock insuficiente para aprobar esta solicitud.\n\nProducto: ${item.name}\nSolicitado: ${req.quantityRequested}\nDisponible: ${item.quantity} ${item.unit}\nUbicación: ${item.location}\n\nPor favor, rechace la solicitud o reponga el stock antes de aprobar.`);
       return;
    }

    // 3. Se tudo estiver ok, prosseguir com a aprovação
    onUpdateStatus(req.id, 'APPROVED');
  };

  const handleDeliverySubmit = () => {
    if (showDeliveryModal && deliveryData.receivedBy && deliveryData.signatureChecked) {
      onUpdateStatus(showDeliveryModal, 'FULFILLED', {
        receivedBy: deliveryData.receivedBy,
        deliveredBy: currentUser.name,
        deliveryDate: new Date().toISOString(),
        digitalSignature: true
      });
      setShowDeliveryModal(null);
      setDeliveryData({ receivedBy: '', signatureChecked: false });
    } else {
      alert("Debe ingresar quien recibe y firmar digitalmente.");
    }
  };

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

      {/* Form Area (Same as before) */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-pharma-500">
           {/* ... Form Inputs ... */}
           <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium">Solicitante</label><input required className="w-full p-2 border rounded" value={formData.requesterName} onChange={e => setFormData({...formData, requesterName: e.target.value})} /></div>
              <div><label className="block text-sm font-medium">Departamento</label><select className="w-full p-2 border rounded" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}><option>Control de Calidad</option><option>I+D</option><option>Microbiología</option></select></div>
              <div><label className="block text-sm font-medium">Item</label><select required className="w-full p-2 border rounded" value={formData.itemId} onChange={e => setFormData({...formData, itemId: e.target.value})}><option value="">Seleccione...</option>{labItems.map(item => <option key={item.id} value={item.id}>{item.name} ({item.quantity} disp.)</option>)}</select></div>
              <div><label className="block text-sm font-medium">Cantidad</label><input type="number" required min="1" className="w-full p-2 border rounded" value={formData.quantityRequested} onChange={e => setFormData({...formData, quantityRequested: Number(e.target.value)})} /></div>
              <div className="md:col-span-2 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-pharma-600 text-white rounded">Enviar</button></div>
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
                <th className="p-4">Estado</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requisitions.map((req) => (
                <tr key={req.id}>
                  <td className="p-4 text-slate-500">{new Date(req.requestDate).toLocaleDateString()}</td>
                  <td className="p-4 font-medium text-slate-800">{req.requesterName}<div className="text-xs text-slate-400">{req.department}</div></td>
                  <td className="p-4 text-slate-700">{req.itemName}</td>
                  <td className="p-4 text-right">{req.quantityRequested}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                        req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        req.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                        req.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-red-100 text-red-700'}`}>
                      {req.status === 'PENDING' ? 'PENDIENTE' : req.status === 'APPROVED' ? 'APROBADO' : req.status === 'FULFILLED' ? 'ENTREGADO' : 'RECHAZADO'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {req.status === 'PENDING' && canApprove && (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleApprove(req)} className="p-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100" title="Aprobar"><Check size={18} /></button>
                        <button onClick={() => onUpdateStatus(req.id, 'REJECTED')} className="p-1 text-red-600 bg-red-50 rounded hover:bg-red-100" title="Rechazar"><X size={18} /></button>
                      </div>
                    )}
                    {req.status === 'APPROVED' && canApprove && (
                      <button onClick={() => setShowDeliveryModal(req.id)} className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 text-xs font-bold mx-auto">
                         <Truck size={14} /> Entregar
                      </button>
                    )}
                    {req.status === 'FULFILLED' && (
                       <div className="text-xs text-slate-400 flex flex-col items-center">
                         <Check size={14} className="text-emerald-500" />
                         <span>Rec: {req.receivedBy}</span>
                       </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Signature Modal */}
      {showDeliveryModal && (
         <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
               <h3 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2"><PenTool size={20} /> Firma de Entrega</h3>
               <p className="text-sm text-slate-500 mb-6">Confirme la entrega física de los materiales al solicitante.</p>
               
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Recibido por (Nombre):</label>
                     <input 
                        type="text" 
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-pharma-500" 
                        placeholder="Nombre de quien retira..."
                        value={deliveryData.receivedBy}
                        onChange={e => setDeliveryData({...deliveryData, receivedBy: e.target.value})}
                     />
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                     <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                           type="checkbox" 
                           className="w-5 h-5 text-pharma-600 rounded focus:ring-pharma-500"
                           checked={deliveryData.signatureChecked}
                           onChange={e => setDeliveryData({...deliveryData, signatureChecked: e.target.checked})}
                        />
                        <span className="text-sm text-slate-700 font-medium">Firmo digitalmente la recepción conforme de los productos.</span>
                     </label>
                  </div>
               </div>

               <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowDeliveryModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                  <button onClick={handleDeliverySubmit} className="px-6 py-2 bg-pharma-600 text-white rounded shadow-lg hover:bg-pharma-700">Confirmar Entrega</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default RequisitionSystem;
