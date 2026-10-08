import { Router, Request, Response } from 'express';
import {
  completeProductionOrder,
  deleteClient,
  deleteProduct,
  deleteProductionOrder,
  deleteRawMaterial,
  deleteSaleOrder,
  deleteSupplier,
  deleteWorkCenter,
  getClients,
  getDatabase,
  getProducts,
  getProductionOrders,
  getRawMaterials,
  getSaleOrders,
  getSettings,
  getSuppliers,
  getWorkCenters,
  resetDatabaseToDemo,
  saveClient,
  saveDatabase,
  saveProduct,
  saveProductionOrder,
  saveRawMaterial,
  saveSaleOrder,
  saveSettings,
  saveSupplier,
  saveWorkCenter,
} from './database';

export const apiRouter = Router();

// ================= STATUS & HEALTH =================
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Full database export & restore
apiRouter.get('/database', (_req: Request, res: Response) => {
  res.json(getDatabase());
});

apiRouter.post('/database/restore', (req: Request, res: Response) => {
  try {
    saveDatabase(req.body);
    res.json({ success: true, message: 'Banco de dados restaurado com sucesso!' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao restaurar banco de dados.' });
  }
});

apiRouter.post('/database/reset-demo', (_req: Request, res: Response) => {
  const data = resetDatabaseToDemo();
  res.json({ success: true, message: 'Dados de demonstração restaurados com sucesso!', data });
});

// ================= RAW MATERIALS =================
apiRouter.get('/raw-materials', (_req: Request, res: Response) => {
  res.json(getRawMaterials());
});

apiRouter.post('/raw-materials', (req: Request, res: Response) => {
  try {
    const saved = saveRawMaterial(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/raw-materials/:id', (req: Request, res: Response) => {
  try {
    const toUpdate = { ...req.body, id: req.params.id };
    const saved = saveRawMaterial(toUpdate);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/raw-materials/:id', (req: Request, res: Response) => {
  const success = deleteRawMaterial(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Matéria-prima não encontrada' });
  }
});

// ================= PRODUCTS (FICHAS TÉCNICAS) =================
apiRouter.get('/products', (_req: Request, res: Response) => {
  res.json(getProducts());
});

apiRouter.post('/products', (req: Request, res: Response) => {
  try {
    const saved = saveProduct(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  try {
    const toUpdate = { ...req.body, id: req.params.id };
    const saved = saveProduct(toUpdate);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  const success = deleteProduct(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Produto não encontrado' });
  }
});

// ================= CLIENTS =================
apiRouter.get('/clients', (_req: Request, res: Response) => {
  res.json(getClients());
});

apiRouter.post('/clients', (req: Request, res: Response) => {
  try {
    const saved = saveClient(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/clients/:id', (req: Request, res: Response) => {
  try {
    const toUpdate = { ...req.body, id: req.params.id };
    const saved = saveClient(toUpdate);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/clients/:id', (req: Request, res: Response) => {
  const success = deleteClient(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Cliente não encontrado' });
  }
});

// ================= SUPPLIERS =================
apiRouter.get('/suppliers', (_req: Request, res: Response) => {
  res.json(getSuppliers());
});

apiRouter.post('/suppliers', (req: Request, res: Response) => {
  try {
    const saved = saveSupplier(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/suppliers/:id', (req: Request, res: Response) => {
  try {
    const toUpdate = { ...req.body, id: req.params.id };
    const saved = saveSupplier(toUpdate);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/suppliers/:id', (req: Request, res: Response) => {
  const success = deleteSupplier(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Fornecedor não encontrado' });
  }
});

// ================= WORK CENTERS / CAPACIDADE =================
apiRouter.get('/work-centers', (_req: Request, res: Response) => {
  res.json(getWorkCenters());
});

apiRouter.post('/work-centers', (req: Request, res: Response) => {
  try {
    const saved = saveWorkCenter(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/work-centers/:id', (req: Request, res: Response) => {
  try {
    const toUpdate = { ...req.body, id: req.params.id };
    const saved = saveWorkCenter(toUpdate);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/work-centers/:id', (req: Request, res: Response) => {
  const success = deleteWorkCenter(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Centro de trabalho não encontrado' });
  }
});

// ================= SALE ORDERS =================
apiRouter.get('/sale-orders', (_req: Request, res: Response) => {
  res.json(getSaleOrders());
});

apiRouter.post('/sale-orders', (req: Request, res: Response) => {
  try {
    const saved = saveSaleOrder(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/sale-orders/:id', (req: Request, res: Response) => {
  try {
    const toUpdate = { ...req.body, id: req.params.id };
    const saved = saveSaleOrder(toUpdate);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/sale-orders/:id', (req: Request, res: Response) => {
  const success = deleteSaleOrder(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Pedido não encontrado' });
  }
});

// ================= PRODUCTION ORDERS =================
apiRouter.get('/production-orders', (_req: Request, res: Response) => {
  res.json(getProductionOrders());
});

apiRouter.post('/production-orders', (req: Request, res: Response) => {
  try {
    const saved = saveProductionOrder(req.body);
    res.status(201).json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/production-orders/:id', (req: Request, res: Response) => {
  try {
    const toUpdate = { ...req.body, id: req.params.id };
    const saved = saveProductionOrder(toUpdate);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// BAIXA DE ORDEM DE PRODUÇÃO
apiRouter.post('/production-orders/:id/complete', (req: Request, res: Response) => {
  try {
    const result = completeProductionOrder(req.params.id, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/production-orders/:id', (req: Request, res: Response) => {
  const success = deleteProductionOrder(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Ordem de Produção não encontrada' });
  }
});

// ================= SETTINGS =================
apiRouter.get('/settings', (_req: Request, res: Response) => {
  res.json(getSettings());
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  try {
    const saved = saveSettings(req.body);
    res.json(saved);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
