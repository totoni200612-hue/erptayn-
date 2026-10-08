export type ProcessStage = {
  id: string;
  name: string;
  workCenterId: string;
  workCenterName: string;
  timeMinutes: number; // Tempo em minutos por unidade
  order: number;
};

export type BomItem = {
  rawMaterialId: string;
  rawMaterialCode: string;
  rawMaterialName: string;
  unit: string;
  quantityPerUnit: number; // Quantidade de matéria-prima por 1 unidade do produto
  scrapPercentage: number; // Margem de perda/refugo %
  unitCost: number;
};

export type Product = {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  suggestedSalePrice: number;
  currentStock: number;
  totalProcessTimeMinutes: number;
  processStages: ProcessStage[];
  bom: BomItem[];
  calculatedMaterialCost: number;
  createdAt: string;
  updatedAt: string;
};

export type RawMaterial = {
  id: string;
  code: string;
  name: string;
  unit: string; // 'kg' | 'm' | 'm²' | 'un' | 'litro' | 'pacote'
  currentStock: number;
  minStock: number;
  unitCost: number;
  preferredSupplierId: string;
  preferredSupplierName: string;
  location: string;
  updatedAt: string;
};

export type Client = {
  id: string;
  code: string;
  name: string;
  document: string; // CPF ou CNPJ
  contactName: string;
  email: string;
  phone: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  notes?: string;
  createdAt: string;
};

export type Supplier = {
  id: string;
  code: string;
  name: string;
  document: string; // CNPJ
  contactName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  suppliedMaterials: string;
  leadTimeDays: number;
  createdAt: string;
};

export type WorkCenter = {
  id: string;
  code: string;
  name: string;
  operatorsCount: number;
  dailyHoursPerOperator: number;
  workDaysPerWeek: number;
  efficiencyRate: number; // % ex: 85
  nominalDailyMinutes: number; // operatorsCount * dailyHoursPerOperator * 60
  effectiveDailyMinutes: number; // nominalDailyMinutes * (efficiencyRate / 100)
  notes?: string;
};

export type OrderItem = {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productionOrderId?: string;
};

export type SaleOrderStatus = 'PENDENTE' | 'EM_PRODUCAO' | 'CONCLUIDO' | 'CANCELADO';

export type SaleOrder = {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  issueDate: string;
  deliveryDeadline: string;
  status: SaleOrderStatus;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
};

export type ProductionOrderStatus =
  | 'PLANEJADA'
  | 'AGUARDANDO_INSUMOS'
  | 'EM_PROCESSO'
  | 'CONTROLE_QUALIDADE'
  | 'CONCLUIDA'
  | 'CANCELADA';

export type ProductionPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type OPStage = {
  id: string;
  name: string;
  workCenterId: string;
  workCenterName: string;
  plannedMinutes: number;
  actualMinutes?: number;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  finishedAt?: string;
  notes?: string;
};

export type OPRequiredMaterial = {
  rawMaterialId: string;
  rawMaterialCode: string;
  rawMaterialName: string;
  unit: string;
  requiredQuantity: number;
  currentStock: number;
  isSufficient: boolean;
};

export type TechnicalResponsible = {
  name: string;
  registration: string; // CREA / CRQ / Matrícula
  role: string;
  email?: string;
  phone?: string;
};

export type ProductionOrder = {
  id: string;
  orderNumber: string; // ex: OP-2026-001
  saleOrderId?: string;
  saleOrderNumber?: string;
  clientName?: string;
  productId: string;
  productCode: string;
  productName: string;
  quantityPlanned: number;
  quantityProduced: number;
  startDate: string;
  expectedEndDate: string;
  completedAt?: string;
  status: ProductionOrderStatus;
  priority: ProductionPriority;
  stages: OPStage[];
  currentStageIndex: number;
  requiredMaterials: OPRequiredMaterial[];
  technicalResponsible: TechnicalResponsible;
  notes?: string;
  actualTotalMinutes?: number;
  stockDeducted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StockMovement = {
  id: string;
  date: string;
  rawMaterialId: string;
  rawMaterialName: string;
  type: 'ENTRADA' | 'SAIDA_OP' | 'AJUSTE';
  quantity: number;
  referenceDoc: string; // Ex: OP-2026-001 ou NF 1234
  responsibleName: string;
  notes?: string;
};

export type SystemSettings = {
  companyName: string;
  tradeName: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  technicalResponsible: TechnicalResponsible;
};

export type ERPDatabase = {
  products: Product[];
  rawMaterials: RawMaterial[];
  clients: Client[];
  suppliers: Supplier[];
  workCenters: WorkCenter[];
  saleOrders: SaleOrder[];
  productionOrders: ProductionOrder[];
  stockMovements: StockMovement[];
  settings: SystemSettings;
};
