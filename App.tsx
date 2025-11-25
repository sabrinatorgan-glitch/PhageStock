
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import RequisitionSystem from './components/RequisitionSystem';
import InventoryAudit from './components/InventoryAudit';
import AIAssistant from './components/AIAssistant';
import AdminPanel from './components/AdminPanel';
import Kardex from './components/Kardex';
import { InventoryItem, Requisition, Category, Location, StockMovement, User, UserRole } from './types';

// Real Data parsed from PhageLab Inventory Documents
const INITIAL_INVENTORY: InventoryItem[] = [
  // CHILE - CHILE LOGISTICA (Raw Materials & General Supplies)
  { id: '200011-1', sku: '200011', name: 'MALTODEXTRINA "GLUCIDEX 19"', category: Category.RAW_MATERIAL, location: Location.CHILE_LOGISTICA, batchNumber: '20240717', expiryDate: '2026-07-17', quantity: 672, unit: 'kg', minStockLevel: 100 },
  { id: '500001-1', sku: '500001', name: 'BOTELLAS PET 1000 ML', category: Category.RAW_MATERIAL, location: Location.CHILE_LOGISTICA, batchNumber: 'L1-01', expiryDate: '2027-01-01', quantity: 48, unit: 'unidades', minStockLevel: 50 },
  
  // CHILE - LAB PISO 5 (Lab Supplies - Bodega 5)
  { id: '700012', sku: '700012', name: 'TUBOS CENTRIFUGA 50 ML', category: Category.LAB_SUPPLY, location: Location.CHILE_LAB_PISO_5, batchNumber: 'B5-01', expiryDate: '2026-06-01', quantity: 100, unit: 'unidades', minStockLevel: 20 },
  
  // CHILE - LAB -3 (Chemicals & Reagents)
  { id: '200001', sku: '200001', name: 'SODIO CITRATO-2 HIDRATO', category: Category.RAW_MATERIAL, location: Location.CHILE_LAB_MINUS_3, batchNumber: '20240126', expiryDate: '2025-01-26', quantity: 6480, unit: 'gr', minStockLevel: 1000 },
  
  // BRASIL - LOGVET (Finished Goods & Distribution)
  { id: '600013', sku: '600013', name: 'CJ CHILE PHAGEIN', category: Category.FINISHED_GOOD, location: Location.BRASIL_LOGVET, batchNumber: 'EXP-BR-01', expiryDate: '2025-12-31', quantity: 150, unit: 'cajas', minStockLevel: 20 },
  
  // WORK IN PROGRESS SAMPLE
  { id: 'WIP-001', sku: 'WIP-SOL-BUF', name: 'Solución Buffer en Preparación', category: Category.WORK_IN_PROGRESS, location: Location.CHILE_LAB_MINUS_3, batchNumber: 'LOTE-WIP-24', expiryDate: '2024-12-31', quantity: 200, unit: 'litros', minStockLevel: 0 },
];

const INITIAL_REQS: Requisition[] = [
  { id: 'r1', requesterName: 'Juan Pérez', itemId: '700012', itemName: 'TUBOS CENTRIFUGA 50 ML', quantityRequested: 20, status: 'PENDING', requestDate: '2023-11-14', department: 'Microbiología' },
];

const INITIAL_USERS: User[] = [
  { name: 'Master Admin', email: 'admin@phage-lab.com', bukId: 'BUK-001', role: UserRole.MASTER_ADMIN },
  { name: 'Admin User', email: 'logistica@phage-lab.com', bukId: 'BUK-002', role: UserRole.ADMIN },
  { name: 'Common User', email: 'lab@phage-lab.com', bukId: 'BUK-003', role: UserRole.COMMON_USER }
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [currentView, setCurrentView] = useState('dashboard');
  
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [requisitions, setRequisitions] = useState<Requisition[]>(INITIAL_REQS);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  
  // Admin Panel Data
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [activeLocations, setActiveLocations] = useState<string[]>(Object.values(Location));

  // Role switching Logic (For Demo)
  const handleSwitchRole = (role: UserRole) => {
    let target = users.find(u => u.role === role) || { name: 'Demo User', email: 'demo@phage-lab.com', bukId: '000', role };
    setCurrentUser(target);
    // Redirect Common User immediately
    if (role === UserRole.COMMON_USER) {
        setCurrentView('requisitions');
    } else {
        setCurrentView('dashboard');
    }
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

  const handleRegisterMovement = (movement: StockMovement) => {
    setMovements(prev => [movement, ...prev]);
    
    // Logic for TRANSFER: 1. Deduct from Source, 2. Add to Target
    if (movement.type === 'TRANSFERENCIA' && movement.targetLocation) {
        // 1. Deduct from Source
        setInventory(prevInv => {
            const updatedInv = prevInv.map(item => {
                if (item.id === movement.itemId) {
                    return { ...item, quantity: Math.max(0, item.quantity - movement.quantity) };
                }
                return item;
            });
            
            // 2. Add to Target (Find existing item match by SKU+Batch+Loc OR Create New)
            // Ideally we check if item exists in target location.
            const sourceItem = prevInv.find(i => i.id === movement.itemId);
            if (sourceItem) {
                const targetItemIndex = updatedInv.findIndex(i => 
                    i.sku === sourceItem.sku && 
                    i.batchNumber === sourceItem.batchNumber && 
                    i.location === movement.targetLocation
                );

                if (targetItemIndex >= 0) {
                    updatedInv[targetItemIndex] = {
                        ...updatedInv[targetItemIndex],
                        quantity: updatedInv[targetItemIndex].quantity + movement.quantity
                    };
                } else {
                    // Create new item entry for that location
                    updatedInv.push({
                        ...sourceItem,
                        id: Math.random().toString(36).substr(2, 9),
                        location: movement.targetLocation as Location,
                        quantity: movement.quantity
                    });
                }
            }
            return updatedInv;
        });

    } else {
        // Simple Entry/Exit
        setInventory(inventory.map(item => {
            if (item.id === movement.itemId) {
                const newQty = movement.type === 'ENTRADA' 
                ? item.quantity + movement.quantity
                : item.quantity - movement.quantity;
                return { ...item, quantity: Math.max(0, newQty) };
            }
            return item;
        }));
    }
  };

  const renderContent = () => {
    // Security Check
    if (currentUser.role === UserRole.COMMON_USER && currentView !== 'requisitions') {
        return <RequisitionSystem items={inventory} requisitions={requisitions} currentUser={currentUser} onAddRequisition={() => {}} onUpdateStatus={handleUpdateReqStatus} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard inventory={inventory} requisitions={requisitions} onNavigate={setCurrentView} />;
      case 'inventory':
        return (
          <InventoryList 
            items={inventory} 
            movements={movements}
            currentUser={currentUser}
            activeLocations={activeLocations}
            onAddItem={(i) => setInventory([...inventory, i])}
            onEditItem={(i) => setInventory(inventory.map(x => x.id === i.id ? i : x))}
            onDeleteItem={(id) => setInventory(inventory.filter(i => i.id !== id))}
            onRegisterMovement={handleRegisterMovement}
          />
        );
      case 'kardex':
        return <Kardex movements={movements} />;
      case 'requisitions':
        return (
          <RequisitionSystem 
            items={inventory} 
            requisitions={requisitions} 
            currentUser={currentUser}
            onAddRequisition={(r) => setRequisitions([...requisitions, {...r, id: Math.random().toString(), status: 'PENDING', requestDate: new Date().toISOString()}])}
            onUpdateStatus={handleUpdateReqStatus}
          />
        );
      case 'assistant':
        return <AIAssistant inventory={inventory} requisitions={requisitions} />;
      case 'audit':
        return <InventoryAudit items={inventory} onApplyAdjustments={() => {}} />;
      case 'admin-panel':
        return (
          <AdminPanel 
            users={users} 
            locations={activeLocations}
            onAddUser={(u) => setUsers([...users, u])}
            onDeleteUser={(n) => setUsers(users.filter(u => u.name !== n))}
            onAddLocation={(l) => setActiveLocations([...activeLocations, l])}
            onDeleteLocation={(l) => setActiveLocations(activeLocations.filter(x => x !== l))}
          />
        );
      default:
        return <Dashboard inventory={inventory} requisitions={requisitions} onNavigate={setCurrentView} />;
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
