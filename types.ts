
export enum Location {
  CHILE_LOGISTICA = 'Chile - Chile Logistica',
  CHILE_LAB_PISO_5 = 'Chile - Lab Piso 5',
  CHILE_LAB_MINUS_3 = 'Chile - Lab -3',
  BRASIL_LOGVET = 'Brasil - Logvet',
  BRASIL_PALOTINA = 'Brasil - Bodega Palotina',
}

export enum Category {
  RAW_MATERIAL = 'Materia Prima',
  FINISHED_GOOD = 'Producto Terminado',
  LAB_SUPPLY = 'Material de Laboratorio',
  WORK_IN_PROGRESS = 'Producto en Proceso (WIP)',
}

export enum UserRole {
  MASTER_ADMIN = 'Master Admin',
  ADMIN = 'Admin',
  COMMON_USER = 'Common User'
}

export interface User {
  name: string;
  email: string; // New: Strict email validation
  bukId: string; // New: Buk Integration ID
  role: UserRole;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: Category;
  location: Location;
  batchNumber: string; // Lote
  expiryDate: string; // Vencimiento
  quantity: number;
  unit: string; // kg, litros, unidades, cajas
  minStockLevel: number;
  lastCountDate?: string;
}

export interface Requisition {
  id: string;
  requesterName: string;
  itemId: string;
  itemName: string;
  quantityRequested: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED';
  requestDate: string;
  department: string;
  // Delivery fields
  approvedBy?: string;
  approvalDate?: string;
  deliveredBy?: string;
  receivedBy?: string;
  deliveryDate?: string;
  digitalSignature?: boolean; // True if signed
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  type: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA';
  quantity: number;
  location: Location | string;
  targetLocation?: Location | string; // For transfers
  date: string;
  reason: string;
  user: string;
}

export interface AiInsight {
  type: 'WARNING' | 'SUGGESTION' | 'TREND';
  message: string;
}
