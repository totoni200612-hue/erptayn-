import fs from 'fs';
import path from 'path';
import {
  Client,
  ERPDatabase,
  Product,
  ProductionOrder,
  ProductionOrderStatus,
  RawMaterial,
  SaleOrder,
  StockMovement,
  Supplier,
  SystemSettings,
  WorkCenter,
} from '../src/types/erp';
import { initialData } from '../src/data/initialData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'erp_database.json');

// In-memory cache synced with disk
let cachedDb: ERPDatabase | null = null;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDatabase(): ERPDatabase {
  if (cachedDb) return cachedDb;

  ensureDataDirectory();

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      cachedDb = JSON.parse(content);
      return cachedDb!;
    } catch (err) {
      console.error('Error reading erp_database.json, falling back to initial data:', err);
    }
  }

  // First run: save initialData to disk
  cachedDb = JSON.parse(JSON.stringify(initialData));
  saveDatabase(cachedDb!);
  return cachedDb!;
}

export function saveDatabase(data: ERPDatabase): void {
  ensureDataDirectory();
  cachedDb = data;
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

export function resetDatabaseToDemo(): ERPDatabase {
  const fresh = JSON.parse(JSON.stringify(initialData));
  saveDatabase(fresh);
  return fresh;
}

// ================= RAW MATERIALS =================
export function getRawMaterials(): RawMaterial[] {
  return getDatabase().rawMaterials;
}

export function saveRawMaterial(material: RawMaterial): RawMaterial {
  const db = getDatabase();
  const index = db.rawMaterials.findIndex((m) => m.id === material.id);
  const now = new Date().toISOString();
  const toSave = { ...material, updatedAt: now };

  if (index >= 0) {
    db.rawMaterials[index] = toSave;
  } else {
    if (!toSave.id) toSave.id = `mat-${Date.now()}`;
    db.rawMaterials.unshift(toSave);
  }
  saveDatabase(db);
  return toSave;
}

export function deleteRawMaterial(id: string): boolean {
  const db = getDatabase();
  const before = db.rawMaterials.length;
  db.rawMaterials = db.rawMaterials.filter((m) => m.id !== id);
  if (db.rawMaterials.length !== before) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// ================= PRODUCTS (FICHAS TÉCNICAS) =================
export function getProducts(): Product[] {
  return getDatabase().products;
}

export function saveProduct(product: Product): Product {
  const db = getDatabase();
  const index = db.products.findIndex((p) => p.id === product.id);
  const now = new Date().toISOString();

  // Recalculate material cost & total process time
  let calculatedMaterialCost = 0;
  if (product.bom && Array.isArray(product.bom)) {
    for (const item of product.bom) {
      const scrapFactor = 1 + (Number(item.scrapPercentage) || 0) / 100;
      calculatedMaterialCost += (Number(item.quantityPerUnit) || 0) * (Number(item.unitCost) || 0) * scrapFactor;
    }
  }

  let totalProcessTimeMinutes = 0;
  if (product.processStages && Array.isArray(product.processStages)) {
    totalProcessTimeMinutes = product.processStages.reduce(
      (acc, stage) => acc + (Number(stage.timeMinutes) || 0),
      0
    );
  }

  const toSave: Product = {
    ...product,
    calculatedMaterialCost: Math.round(calculatedMaterialCost * 100) / 100,
    totalProcessTimeMinutes,
    updatedAt: now,
  };

  if (index >= 0) {
    db.products[index] = toSave;
  } else {
    if (!toSave.id) toSave.id = `prod-${Date.now()}`;
    toSave.createdAt = now;
    db.products.unshift(toSave);
  }

  saveDatabase(db);
  return toSave;
}

export function deleteProduct(id: string): boolean {
  const db = getDatabase();
  const before = db.products.length;
  db.products = db.products.filter((p) => p.id !== id);
  if (db.products.length !== before) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// ================= CLIENTS =================
export function getClients(): Client[] {
  return getDatabase().clients;
}

export function saveClient(client: Client): Client {
  const db = getDatabase();
  const index = db.clients.findIndex((c) => c.id === client.id);
  const toSave = { ...client };

  if (index >= 0) {
    db.clients[index] = toSave;
  } else {
    if (!toSave.id) toSave.id = `cli-${Date.now()}`;
    if (!toSave.createdAt) toSave.createdAt = new Date().toISOString();
    db.clients.unshift(toSave);
  }
  saveDatabase(db);
  return toSave;
}

export function deleteClient(id: string): boolean {
  const db = getDatabase();
  const before = db.clients.length;
  db.clients = db.clients.filter((c) => c.id !== id);
  if (db.clients.length !== before) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// ================= SUPPLIERS =================
export function getSuppliers(): Supplier[] {
  return getDatabase().suppliers;
}

export function saveSupplier(supplier: Supplier): Supplier {
  const db = getDatabase();
  const index = db.suppliers.findIndex((s) => s.id === supplier.id);
  const toSave = { ...supplier };

  if (index >= 0) {
    db.suppliers[index] = toSave;
  } else {
    if (!toSave.id) toSave.id = `sup-${Date.now()}`;
    if (!toSave.createdAt) toSave.createdAt = new Date().toISOString();
    db.suppliers.unshift(toSave);
  }
  saveDatabase(db);
  return toSave;
}

export function deleteSupplier(id: string): boolean {
  const db = getDatabase();
  const before = db.suppliers.length;
  db.suppliers = db.suppliers.filter((s) => s.id !== id);
  if (db.suppliers.length !== before) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// ================= WORK CENTERS (CAPACIDADE PRODUTIVA) =================
export function getWorkCenters(): WorkCenter[] {
  return getDatabase().workCenters;
}

export function saveWorkCenter(wc: WorkCenter): WorkCenter {
  const db = getDatabase();
  const index = db.workCenters.findIndex((w) => w.id === wc.id);

  const operatorsCount = Number(wc.operatorsCount) || 1;
  const dailyHoursPerOperator = Number(wc.dailyHoursPerOperator) || 8;
  const efficiencyRate = Number(wc.efficiencyRate) || 85;

  const nominalDailyMinutes = operatorsCount * dailyHoursPerOperator * 60;
  const effectiveDailyMinutes = Math.round(nominalDailyMinutes * (efficiencyRate / 100));

  const toSave: WorkCenter = {
    ...wc,
    operatorsCount,
    dailyHoursPerOperator,
    efficiencyRate,
    nominalDailyMinutes,
    effectiveDailyMinutes,
  };

  if (index >= 0) {
    db.workCenters[index] = toSave;
  } else {
    if (!toSave.id) toSave.id = `wc-${Date.now()}`;
    db.workCenters.push(toSave);
  }
  saveDatabase(db);
  return toSave;
}

export function deleteWorkCenter(id: string): boolean {
  const db = getDatabase();
  const before = db.workCenters.length;
  db.workCenters = db.workCenters.filter((w) => w.id !== id);
  if (db.workCenters.length !== before) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// ================= SALE ORDERS =================
export function getSaleOrders(): SaleOrder[] {
  return getDatabase().saleOrders;
}

export function saveSaleOrder(order: SaleOrder): SaleOrder {
  const db = getDatabase();
  const index = db.saleOrders.findIndex((o) => o.id === order.id);

  // Recalculate totalAmount
  const items = (order.items || []).map((item) => ({
    ...item,
    subtotal: Math.round(Number(item.quantity || 0) * Number(item.unitPrice || 0) * 100) / 100,
  }));
  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);

  const toSave: SaleOrder = {
    ...order,
    items,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };

  if (index >= 0) {
    db.saleOrders[index] = toSave;
  } else {
    if (!toSave.id) toSave.id = `ped-${Date.now()}`;
    if (!toSave.createdAt) toSave.createdAt = new Date().toISOString();
    db.saleOrders.unshift(toSave);
  }
  saveDatabase(db);
  return toSave;
}

export function deleteSaleOrder(id: string): boolean {
  const db = getDatabase();
  const before = db.saleOrders.length;
  db.saleOrders = db.saleOrders.filter((o) => o.id !== id);
  if (db.saleOrders.length !== before) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// ================= PRODUCTION ORDERS (ORDENS DE PRODUÇÃO) =================
export function getProductionOrders(): ProductionOrder[] {
  return getDatabase().productionOrders;
}

export function saveProductionOrder(op: ProductionOrder): ProductionOrder {
  const db = getDatabase();
  const index = db.productionOrders.findIndex((o) => o.id === op.id);
  const now = new Date().toISOString();

  // If technicalResponsible is missing or incomplete, populate from settings
  const technicalResponsible = {
    name: op.technicalResponsible?.name || db.settings.technicalResponsible.name,
    registration: op.technicalResponsible?.registration || db.settings.technicalResponsible.registration,
    role: op.technicalResponsible?.role || db.settings.technicalResponsible.role,
    email: op.technicalResponsible?.email || db.settings.technicalResponsible.email,
    phone: op.technicalResponsible?.phone || db.settings.technicalResponsible.phone,
  };

  const toSave: ProductionOrder = {
    ...op,
    technicalResponsible,
    updatedAt: now,
  };

  if (index >= 0) {
    db.productionOrders[index] = toSave;
  } else {
    if (!toSave.id) toSave.id = `op-${Date.now()}`;
    toSave.createdAt = now;
    toSave.stockDeducted = false;
    db.productionOrders.unshift(toSave);
  }

  saveDatabase(db);
  return toSave;
}

// BAIXA / CONCLUSÃO DA ORDEM DE PRODUÇÃO
// Deducts raw materials from stock, increases product finished stock, marks completedAt
export function completeProductionOrder(
  id: string,
  completionData?: {
    quantityProduced?: number;
    completionNotes?: string;
    actualTotalMinutes?: number;
    responsibleName?: string;
    responsibleRegistration?: string;
  }
): { success: boolean; op: ProductionOrder; message: string } {
  const db = getDatabase();
  const opIndex = db.productionOrders.findIndex((o) => o.id === id);
  if (opIndex === -1) {
    throw new Error('Ordem de Produção não encontrada.');
  }

  const op = db.productionOrders[opIndex];
  const now = new Date().toISOString();
  const quantityProduced = completionData?.quantityProduced ?? op.quantityPlanned;

  // 1. Mark stages as CONCLUIDO
  const updatedStages = op.stages.map((st) => ({
    ...st,
    status: 'CONCLUIDO' as const,
    finishedAt: st.finishedAt || now,
  }));

  // 2. Deduct raw materials if not already deducted
  if (!op.stockDeducted && op.requiredMaterials && op.requiredMaterials.length > 0) {
    for (const req of op.requiredMaterials) {
      const matIndex = db.rawMaterials.findIndex((m) => m.id === req.rawMaterialId);
      if (matIndex >= 0) {
        const mat = db.rawMaterials[matIndex];
        const newStock = Math.max(0, mat.currentStock - req.requiredQuantity);
        mat.currentStock = Math.round(newStock * 100) / 100;
        mat.updatedAt = now;

        // Register stock movement audit entry
        const movement: StockMovement = {
          id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: now,
          rawMaterialId: mat.id,
          rawMaterialName: mat.name,
          type: 'SAIDA_OP',
          quantity: req.requiredQuantity,
          referenceDoc: op.orderNumber,
          responsibleName: completionData?.responsibleName || op.technicalResponsible?.name || db.settings.technicalResponsible.name,
          notes: `Baixa de matéria-prima para conclusão da OP ${op.orderNumber}`,
        };
        db.stockMovements.unshift(movement);
      }
    }
  }

  // 3. Increment finished product stock
  const productIndex = db.products.findIndex((p) => p.id === op.productId);
  if (productIndex >= 0) {
    db.products[productIndex].currentStock = (db.products[productIndex].currentStock || 0) + quantityProduced;
    db.products[productIndex].updatedAt = now;
  }

  // 4. Update OP status to CONCLUIDA
  op.status = 'CONCLUIDA';
  op.quantityProduced = quantityProduced;
  op.completedAt = now;
  op.currentStageIndex = op.stages.length - 1;
  op.stages = updatedStages;
  op.stockDeducted = true;
  op.updatedAt = now;

  if (completionData?.completionNotes) {
    op.notes = op.notes ? `${op.notes} | Obs Baixa: ${completionData.completionNotes}` : completionData.completionNotes;
  }

  if (completionData?.actualTotalMinutes) {
    op.actualTotalMinutes = completionData.actualTotalMinutes;
  }

  if (completionData?.responsibleName) {
    op.technicalResponsible.name = completionData.responsibleName;
  }
  if (completionData?.responsibleRegistration) {
    op.technicalResponsible.registration = completionData.responsibleRegistration;
  }

  // 5. If linked to a sale order, check if we should update the sale order status
  if (op.saleOrderId) {
    const saleOrder = db.saleOrders.find((so) => so.id === op.saleOrderId);
    if (saleOrder) {
      // Check if all OPs for this order are completed
      const allOps = db.productionOrders.filter((o) => o.saleOrderId === saleOrder.id);
      const allDone = allOps.every((o) => o.id === op.id ? true : o.status === 'CONCLUIDA');
      if (allDone) {
        saleOrder.status = 'CONCLUIDO';
      }
    }
  }

  db.productionOrders[opIndex] = op;
  saveDatabase(db);

  return {
    success: true,
    op,
    message: `Ordem de Produção ${op.orderNumber} baixada com sucesso! Estoque de matérias-primas e produto acabado atualizado.`,
  };
}

export function deleteProductionOrder(id: string): boolean {
  const db = getDatabase();
  const before = db.productionOrders.length;
  db.productionOrders = db.productionOrders.filter((o) => o.id !== id);
  if (db.productionOrders.length !== before) {
    saveDatabase(db);
    return true;
  }
  return false;
}

// ================= SETTINGS =================
export function getSettings(): SystemSettings {
  return getDatabase().settings;
}

export function saveSettings(settings: SystemSettings): SystemSettings {
  const db = getDatabase();
  db.settings = { ...settings };
  saveDatabase(db);
  return db.settings;
}
