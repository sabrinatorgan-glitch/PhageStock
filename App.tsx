
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import RequisitionSystem from './components/RequisitionSystem';
import InventoryAudit from './components/InventoryAudit';
import AIAssistant from './components/AIAssistant';
import { InventoryItem, Requisition, Category, Location, StockMovement, User, UserRole } from './types';

// Real Data parsed from PhageLab Inventory Documents
const INITIAL_INVENTORY: InventoryItem[] = [
  // CHILE - CHILE LOGISTICA (Raw Materials & General Supplies)
  { id: '200011-1', sku: '200011', name: 'MALTODEXTRINA "GLUCIDEX 19"', category: Category.RAW_MATERIAL, location: Location.CHILE_LOGISTICA, batchNumber: '20240717', expiryDate: '2026-07-17', quantity: 672, unit: 'kg', minStockLevel: 100 },
  { id: '200011-2', sku: '200011', name: 'MALTODEXTRINA "GLUCIDEX 19"', category: Category.RAW_MATERIAL, location: Location.CHILE_LOGISTICA, batchNumber: '20230507', expiryDate: '2025-05-07', quantity: 672, unit: 'kg', minStockLevel: 100 },
  { id: '500001-1', sku: '500001', name: 'BOTELLAS PET 1000 ML', category: Category.RAW_MATERIAL, location: Location.CHILE_LOGISTICA, batchNumber: 'L1-01', expiryDate: '2027-01-01', quantity: 48, unit: 'unidades', minStockLevel: 50 },
  { id: '500001-2', sku: '500001', name: 'BOTELLAS PET 1000 ML', category: Category.RAW_MATERIAL, location: Location.CHILE_LOGISTICA, batchNumber: 'L1-02', expiryDate: '2027-01-01', quantity: 48, unit: 'unidades', minStockLevel: 50 },
  { id: '500001-3', sku: '500001', name: 'BOTELLAS PET 1000 ML', category: Category.RAW_MATERIAL, location: Location.CHILE_LOGISTICA, batchNumber: 'L1-03', expiryDate: '2027-01-01', quantity: 48, unit: 'unidades', minStockLevel: 50 },
  { id: '900131', sku: '900131', name: 'BOTELLA PLASTICA 10 LTS', category: Category.RAW_MATERIAL, location: Location.CHILE_LOGISTICA, batchNumber: 'L1-04', expiryDate: '2030-01-01', quantity: 32, unit: 'unidades', minStockLevel: 10 },
  { id: '600003', sku: '600003', name: 'EUROPALETTS', category: Category.RAW_MATERIAL, location: Location.CHILE_LOGISTICA, batchNumber: 'L1-07', expiryDate: '2099-12-31', quantity: 50, unit: 'unidades', minStockLevel: 10 },
  { id: '700001', sku: '700001', name: 'BAG SINGLE USE FLEXBOY 10 L', category: Category.RAW_MATERIAL, location: Location.CHILE_LOGISTICA, batchNumber: 'L1-08', expiryDate: '2025-11-14', quantity: 5, unit: 'unidades', minStockLevel: 2 },
  { id: '500007', sku: '500007', name: 'TAPAS BOTELLAS- 1000 ML', category: Category.RAW_MATERIAL, location: Location.CHILE_LOGISTICA, batchNumber: '20250312', expiryDate: '2026-03-12', quantity: 4320, unit: 'unidades', minStockLevel: 1000 },
  { id: '500004', sku: '500004', name: 'BOTELLAS PET 250 ML', category: Category.RAW_MATERIAL, location: Location.CHILE_LOGISTICA, batchNumber: 'L2-04', expiryDate: '2027-01-01', quantity: 60, unit: 'unidades', minStockLevel: 100 },
  
  // CHILE - LAB PISO 5 (Lab Supplies - Bodega 5)
  { id: '700012', sku: '700012', name: 'TUBOS CENTRIFUGA 50 ML', category: Category.LAB_SUPPLY, location: Location.CHILE_LAB_PISO_5, batchNumber: 'B5-01', expiryDate: '2026-06-01', quantity: 100, unit: 'unidades', minStockLevel: 20 },
  { id: '700014', sku: '700014', name: 'CAPSULA SARTOFLUOR MIDICAPS 0,2', category: Category.LAB_SUPPLY, location: Location.CHILE_LAB_PISO_5, batchNumber: 'B5-02', expiryDate: '2025-08-01', quantity: 2, unit: 'unidades', minStockLevel: 1 },
  { id: '700047', sku: '700047', name: 'PLACA 96 POCILLOS', category: Category.LAB_SUPPLY, location: Location.CHILE_LAB_PISO_5, batchNumber: 'B5-03', expiryDate: '2026-01-01', quantity: 50, unit: 'unidades', minStockLevel: 10 },
  { id: '700048', sku: '700048', name: 'GUANTES NITRILO TALLA S', category: Category.LAB_SUPPLY, location: Location.CHILE_LAB_PISO_5, batchNumber: 'B5-04', expiryDate: '2028-01-01', quantity: 10, unit: 'cajas', minStockLevel: 2 },
  { id: '900088', sku: '900088', name: 'ALGODON HIDROFOBICO 1 ROLLO', category: Category.LAB_SUPPLY, location: Location.CHILE_LAB_PISO_5, batchNumber: 'B5-05', expiryDate: '2029-01-01', quantity: 5, unit: 'rollos', minStockLevel: 1 },
  { id: '900074', sku: '900074', name: 'PUNTAS DE 10UL', category: Category.LAB_SUPPLY, location: Location.CHILE_LAB_PISO_5, batchNumber: 'B5-06', expiryDate: '2027-01-01', quantity: 20, unit: 'racks', minStockLevel: 5 },
  { id: '900580', sku: '900580', name: 'PUNTA CON FILTRO ESTERIL 1000UL', category: Category.LAB_SUPPLY, location: Location.CHILE_LAB_PISO_5, batchNumber: 'B5-07', expiryDate: '2026-12-01', quantity: 15, unit: 'racks', minStockLevel: 3 },
  { id: '900140', sku: '900140', name: 'ETIQUETA DK2223', category: Category.LAB_SUPPLY, location: Location.CHILE_LAB_PISO_5, batchNumber: 'B5-08', expiryDate: '2030-01-01', quantity: 8, unit: 'rollos', minStockLevel: 2 },
  
  // CHILE - LAB -3 (Chemicals & Reagents)
  { id: '200001', sku: '200001', name: 'SODIO CITRATO-2 HIDRATO', category: Category.RAW_MATERIAL, location: Location.CHILE_LAB_MINUS_3, batchNumber: '20240126', expiryDate: '2025-01-26', quantity: 6480, unit: 'gr', minStockLevel: 1000 },
  { id: '200012', sku: '200012', name: 'EDTA SAL SODICA 2 HID', category: Category.RAW_MATERIAL, location: Location.CHILE_LAB_MINUS_3, batchNumber: '20250312', expiryDate: '2026-03-12', quantity: 1800, unit: 'gr', minStockLevel: 500 },
  { id: '200022', sku: '200022', name: 'CALCIO CLORURO 2-HID', category: Category.RAW_MATERIAL, location: Location.CHILE_LAB_MINUS_3, batchNumber: '20240627', expiryDate: '2025-06-27', quantity: 10800, unit: 'gr', minStockLevel: 2000 },
  { id: '200003', sku: '200003', name: 'PROPYL L4-HIDROXY BENZOATE', category: Category.RAW_MATERIAL, location: Location.CHILE_LAB_MINUS_3, batchNumber: '20240717', expiryDate: '2026-07-17', quantity: 672, unit: 'gr', minStockLevel: 100 },
  { id: '900096', sku: '900096', name: 'CHROMAGAR ORIENTACIÓN', category: Category.LAB_SUPPLY, location: Location.CHILE_LAB_MINUS_3, batchNumber: 'CH-01', expiryDate: '2025-09-01', quantity: 2, unit: 'frascos', minStockLevel: 1 },
  
  // BRASIL - LOGVET (Finished Goods & Distribution)
  { id: '600013', sku: '600013', name: 'CJ CHILE PHAGEIN', category: Category.FINISHED_GOOD, location: Location.BRASIL_LOGVET, batchNumber: 'EXP-BR-01', expiryDate: '2025-12-31', quantity: 150, unit: 'cajas', minStockLevel: 20 },
  { id: '700030', sku: '700030', name: 'KIT ESTERIIZADO-XXL', category: Category.FINISHED_GOOD, location: Location.BRASIL_LOGVET, batchNumber: 'K-2024', expiryDate: '2026-06-30', quantity: 45, unit: 'kits', minStockLevel: 10 },
  { id: '700079', sku: '700079', name: 'KIT ESTERIIZADO-XXXL', category: Category.FINISHED_GOOD, location: Location.BRASIL_LOGVET, batchNumber: 'K-2025', expiryDate: '2026-06-30', quantity: 30, unit: 'kits', minStockLevel: 5 },
  
  // BRASIL - BODEGA PALOTINA (Reserve Stock)
  { id: '200017', sku: '200017', name: 'SODIO HIDROXIDO (LENTEJAS)', category: Category.RAW_MATERIAL, location: Location.BRASIL_PALOTINA, batchNumber: 'LOTE-BR-02', expiryDate: '2026-01-01', quantity: 50, unit: 'kg', minStockLevel: 10 },
  { id: '30024017', sku: '30024017', name: 'INSUMO PACKING BRASIL', category: Category.RAW_MATERIAL, location: Location.BRASIL_PALOTINA, batchNumber: 'PK-001', expiryDate: '2030-12-31', quantity: 11, unit: 'pallets', minStockLevel: 2 },
  { id: '500004-BR', sku: '500004', name: 'BOTELLAS PET 250 ML', category: Category.RAW_MATERIAL, location: Location.BRASIL_PALOTINA, batchNumber: 'TR-CH-BR', expiryDate: '2027-01-01', quantity: 200, unit: 'unidades', minStockLevel: 50 },

  // More Lab Items
  { id: '900156', sku: '900156', name: 'UNIVERSAL FIT PIPET TIPS, 1-30UL', category: Category.LAB_SUPPLY, location: Location.CHILE_LOGISTICA, batchNumber: 'L1-05', expiryDate: '2026-01-01', quantity: 20, unit: 'cajas', minStockLevel: 5 },
  { id: '700024', sku: '700024', name: 'PIPETA SEROLOGICA 50 ML', category: Category.LAB_SUPPLY, location: Location.CHILE_LOGISTICA, batchNumber: 'L1-05', expiryDate: '2026-01-01', quantity: 25, unit: 'bolsas', minStockLevel: 5 },
];

const INITIAL_REQS: Requisition[] = [
  { id: 'r1', requesterName: 'Juan Pérez', itemId: '700012', itemName: 'TUBOS CENTRIFUGA 50 ML', quantityRequested: 20, status: 'PENDING', requestDate: '2023-11-14', department: 'Microbiología' },
  { id: 'r2', requesterName: 'Maria Soto', itemId: '200001', itemName: 'SODIO CITRATO-2 HIDRATO', quantityRequested: 500, status: 'APPROVED', requestDate: '2023-11-10', department: 'Producción' },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>({ name: 'Admin User', role: UserRole.MASTER_ADMIN });
  const [currentView, setCurrentView] = useState('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [requisitions, setRequisitions] = useState<Requisition[]>(INITIAL_REQS);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  // Role switching Logic (For Demo)
  const handleSwitchRole = (role: UserRole) => {
    let name = 'User';
    if (role === UserRole.MASTER_ADMIN) name = 'Master Admin';
    if (role === UserRole.ADMIN) name = 'Admin User';
    if (role === UserRole.COMMON_USER) name = 'Common User';
    
    setCurrentUser({ name, role });
    setCurrentView('dashboard'); // Reset view to safe default
  };

  // Requisition Logic
  const handleAddRequisition = (newReq: Omit<Requisition, 'id' | 'status' | 'requestDate'>) => {
    const req: Requisition = {
      ...newReq,
      id: Math.random().toString(36).substr(2, 9),
      status: 'PENDING',
      requestDate: new Date().toISOString(),
    };
    setRequisitions([req, ...requisitions]);
  };

  const handleUpdateReqStatus = (id: string, status: 'APPROVED' | 'REJECTED' | 'FULFILLED', deliveryDetails?: any) => {
    setRequisitions(requisitions.map(r => {
      if (r.id === id) {
        if (status === 'FULFILLED' && deliveryDetails) {
          return { ...r, status, ...deliveryDetails };
        }
        return { ...r, status };
      }
      return r;
    }));
    
    // If approved, deduct stock
    if (status === 'APPROVED') {
      const req = requisitions.find(r => r.id === id);
      if (req) {
        setInventory(inventory.map(item => {
          if (item.id === req.itemId) {
            return { ...item, quantity: Math.max(0, item.quantity - req.quantityRequested) };
          }
          return item;
        }));
      }
    }
  };

  // Inventory Management Logic
  const handleAddItem = (newItem: InventoryItem) => {
    setInventory([...inventory, newItem]);
  };

  const handleEditItem = (updatedItem: InventoryItem) => {
    setInventory(inventory.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este registro de inventario?')) {
      setInventory(inventory.filter(i => i.id !== id));
    }
  };

  const handleRegisterMovement = (movement: StockMovement) => {
    setMovements([movement, ...movements]);
    
    setInventory(inventory.map(item => {
      if (item.id === movement.itemId) {
        const newQty = movement.type === 'ENTRADA' 
          ? item.quantity + movement.quantity
          : item.quantity - movement.quantity;
        return { ...item, quantity: Math.max(0, newQty) };
      }
      return item;
    }));
  };

  // Audit Logic
  const handleApplyAuditAdjustments = (adjustments: { itemId: string, newQuantity: number, variance: number }[]) => {
    const newMovements: StockMovement[] = [];
    const now = new Date().toISOString();

    const updatedInventory = inventory.map(item => {
      const adjustment = adjustments.find(a => a.itemId === item.id);
      if (adjustment) {
        // Create movement log
        newMovements.push({
          id: Math.random().toString(36).substr(2, 9),
          itemId: item.id,
          itemSku: item.sku,
          itemName: item.name,
          type: adjustment.variance > 0 ? 'ENTRADA' : 'SALIDA',
          quantity: Math.abs(adjustment.variance),
          location: item.location,
          date: now,
          reason: 'Ajuste de Auditoría (Conciliación)',
          user: currentUser.name
        });
        // Update item
        return { ...item, quantity: adjustment.newQuantity, lastCountDate: now };
      }
      return item;
    });

    setInventory(updatedInventory);
    setMovements([...newMovements, ...movements]);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard inventory={inventory} requisitions={requisitions} />;
      case 'inventory':
        return (
          <InventoryList 
            items={inventory} 
            currentUser={currentUser}
            onAddItem={handleAddItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onRegisterMovement={handleRegisterMovement}
          />
        );
      case 'requisitions':
        return (
          <RequisitionSystem 
            items={inventory} 
            requisitions={requisitions} 
            currentUser={currentUser}
            onAddRequisition={handleAddRequisition}
            onUpdateStatus={handleUpdateReqStatus}
          />
        );
      case 'assistant':
        return <AIAssistant inventory={inventory} requisitions={requisitions} />;
      case 'audit':
        return <InventoryAudit items={inventory} onApplyAdjustments={handleApplyAuditAdjustments} />;
      default:
        return <Dashboard inventory={inventory} requisitions={requisitions} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        currentUser={currentUser} 
        onSwitchRole={handleSwitchRole} 
      />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
