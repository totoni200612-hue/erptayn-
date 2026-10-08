import {
  Client,
  ERPDatabase,
  Product,
  ProductionOrder,
  RawMaterial,
  SaleOrder,
  Supplier,
  SystemSettings,
  WorkCenter,
} from '../types/erp';
import { initialData } from '../data/initialData';

const LOCAL_STORAGE_KEY = 'planoerp_database_cache';

// Load fallback cache from local storage if available
function getLocalFallback(): ERPDatabase {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed.settings &&
        (!parsed.settings.technicalResponsible ||
          !parsed.settings.technicalResponsible.name ||
          !parsed.settings.technicalResponsible.name.includes('Tayná'))
      ) {
        parsed.settings.technicalResponsible = initialData.settings.technicalResponsible;
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Could not read from localStorage fallback', e);
  }
  return initialData;
}

function saveLocalFallback(data: ERPDatabase): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not save to localStorage fallback', e);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(`/api${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP ${res.status}: ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      throw new Error('API retornou conteúdo não-JSON (ambiente estático)');
    }

    return (await res.json()) as T;
  } catch (err) {
    console.warn(`API call /api${path} failed or offline, falling back:`, err);
    throw err;
  }
}

export const api = {
  // Entire DB
  async getDatabase(): Promise<ERPDatabase> {
    try {
      const data = await request<ERPDatabase>('/database');
      saveLocalFallback(data);
      return data;
    } catch {
      return getLocalFallback();
    }
  },

  async restoreDatabase(db: ERPDatabase): Promise<void> {
    await request('/database/restore', {
      method: 'POST',
      body: JSON.stringify(db),
    });
    saveLocalFallback(db);
  },

  async resetDemo(): Promise<ERPDatabase> {
    const res = await request<{ data: ERPDatabase }>('/database/reset-demo', {
      method: 'POST',
    });
    saveLocalFallback(res.data);
    return res.data;
  },

  // Raw Materials
  async getRawMaterials(): Promise<RawMaterial[]> {
    try {
      return await request<RawMaterial[]>('/raw-materials');
    } catch {
      return getLocalFallback().rawMaterials;
    }
  },

  async createRawMaterial(material: RawMaterial): Promise<RawMaterial> {
    return await request<RawMaterial>('/raw-materials', {
      method: 'POST',
      body: JSON.stringify(material),
    });
  },

  async updateRawMaterial(id: string, material: RawMaterial): Promise<RawMaterial> {
    return await request<RawMaterial>(`/raw-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(material),
    });
  },

  async deleteRawMaterial(id: string): Promise<void> {
    await request(`/raw-materials/${id}`, { method: 'DELETE' });
  },

  // Products
  async getProducts(): Promise<Product[]> {
    try {
      return await request<Product[]>('/products');
    } catch {
      return getLocalFallback().products;
    }
  },

  async createProduct(product: Product): Promise<Product> {
    return await request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async updateProduct(id: string, product: Product): Promise<Product> {
    return await request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  async deleteProduct(id: string): Promise<void> {
    await request(`/products/${id}`, { method: 'DELETE' });
  },

  // Clients
  async getClients(): Promise<Client[]> {
    try {
      return await request<Client[]>('/clients');
    } catch {
      return getLocalFallback().clients;
    }
  },

  async createClient(client: Client): Promise<Client> {
    return await request<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  },

  async updateClient(id: string, client: Client): Promise<Client> {
    return await request<Client>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
  },

  async deleteClient(id: string): Promise<void> {
    await request(`/clients/${id}`, { method: 'DELETE' });
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    try {
      return await request<Supplier[]>('/suppliers');
    } catch {
      return getLocalFallback().suppliers;
    }
  },

  async createSupplier(supplier: Supplier): Promise<Supplier> {
    return await request<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
  },

  async updateSupplier(id: string, supplier: Supplier): Promise<Supplier> {
    return await request<Supplier>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplier),
    });
  },

  async deleteSupplier(id: string): Promise<void> {
    await request(`/suppliers/${id}`, { method: 'DELETE' });
  },

  // Work Centers / Capacidade
  async getWorkCenters(): Promise<WorkCenter[]> {
    try {
      return await request<WorkCenter[]>('/work-centers');
    } catch {
      return getLocalFallback().workCenters;
    }
  },

  async createWorkCenter(wc: WorkCenter): Promise<WorkCenter> {
    return await request<WorkCenter>('/work-centers', {
      method: 'POST',
      body: JSON.stringify(wc),
    });
  },

  async updateWorkCenter(id: string, wc: WorkCenter): Promise<WorkCenter> {
    return await request<WorkCenter>(`/work-centers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(wc),
    });
  },

  async deleteWorkCenter(id: string): Promise<void> {
    await request(`/work-centers/${id}`, { method: 'DELETE' });
  },

  // Sale Orders
  async getSaleOrders(): Promise<SaleOrder[]> {
    try {
      return await request<SaleOrder[]>('/sale-orders');
    } catch {
      return getLocalFallback().saleOrders;
    }
  },

  async createSaleOrder(order: SaleOrder): Promise<SaleOrder> {
    return await request<SaleOrder>('/sale-orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  async updateSaleOrder(id: string, order: SaleOrder): Promise<SaleOrder> {
    return await request<SaleOrder>(`/sale-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
    });
  },

  async deleteSaleOrder(id: string): Promise<void> {
    await request(`/sale-orders/${id}`, { method: 'DELETE' });
  },

  // Production Orders
  async getProductionOrders(): Promise<ProductionOrder[]> {
    try {
      return await request<ProductionOrder[]>('/production-orders');
    } catch {
      return getLocalFallback().productionOrders;
    }
  },

  async createProductionOrder(op: ProductionOrder): Promise<ProductionOrder> {
    return await request<ProductionOrder>('/production-orders', {
      method: 'POST',
      body: JSON.stringify(op),
    });
  },

  async updateProductionOrder(id: string, op: ProductionOrder): Promise<ProductionOrder> {
    return await request<ProductionOrder>(`/production-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(op),
    });
  },

  async completeProductionOrder(
    id: string,
    payload: {
      quantityProduced?: number;
      completionNotes?: string;
      actualTotalMinutes?: number;
      responsibleName?: string;
      responsibleRegistration?: string;
    }
  ): Promise<{ success: boolean; op: ProductionOrder; message: string }> {
    return await request<{ success: boolean; op: ProductionOrder; message: string }>(
      `/production-orders/${id}/complete`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  async deleteProductionOrder(id: string): Promise<void> {
    await request(`/production-orders/${id}`, { method: 'DELETE' });
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    try {
      return await request<SystemSettings>('/settings');
    } catch {
      return getLocalFallback().settings;
    }
  },

  async updateSettings(settings: SystemSettings): Promise<SystemSettings> {
    return await request<SystemSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};
