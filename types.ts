
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
  email: string;
  bukId: string;
  role: UserRole;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: Category;
  location: Location | string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unit: string;
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
  requestedExpiryDate?: string;
  approvedBy?: string;
  approvalDate?: string;
  deliveredBy?: string;
  receivedBy?: string;
  deliveryDate?: string;
  digitalSignature?: boolean;
  fulfilledBatchNumber?: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  type: 'ENTRADA' | 'SALIDA' | 'TRANSFERENCIA';
  quantity: number;
  location: Location | string;
  targetLocation?: Location | string;
  batchNumber: string;
  date: string;
  reason: string;
  user: string;
  isSynced?: boolean;
}

export interface AiInsight {
  type: 'WARNING' | 'SUGGESTION' | 'TREND';
  message: string;
}

// --- NEW PRODUCTION MODULE TYPES ---

export interface RecipeIngredient {
  sku: string;
  name: string;
  quantityRequired: number;
  unit: string;
}

export interface Recipe {
  id: string;
  finalProductSku: string;
  finalProductName: string;
  description: string;
  ingredients: RecipeIngredient[];
  version: string;
  active: boolean;
}

export interface ProductionOrder {
  id: string;
  recipeId: string;
  productName: string;
  targetQuantity: number;
  producedQuantity?: number;
  startDate: string;
  endDate?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedTo?: string;
  batchOutput?: string;
}
