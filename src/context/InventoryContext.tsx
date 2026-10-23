import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Product,
  SaleRecord,
  RestockRecommendation,
  InventorySettings,
  UnitType,
} from '../types/inventory';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, generateSyntheticSales } from '../data/demoData';
import { generateProductRecommendation } from '../utils/inventoryMath';

interface InventoryContextType {
  products: Product[];
  sales: SaleRecord[];
  settings: InventorySettings;
  recommendations: RestockRecommendation[];
  categories: string[];
  isDemoData: boolean;
  addProduct: (newProd: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  recordSale: (productId: string, quantity: number, dateStr?: string, customPrice?: number) => { success: boolean; message: string };
  receiveRestock: (productId: string, quantity: number) => void;
  updateSettings: (newSettings: Partial<InventorySettings>) => void;
  resetToDemoData: () => void;
  importProductsFromCSV: (csvString: string) => { imported: number; errors: string[] };
  importSalesFromCSV: (csvString: string) => { imported: number; errors: string[] };
  exportProductsCSV: () => void;
  exportRestockSheetCSV: () => void;
  exportBackupJSON: () => void;
}

const STORAGE_KEYS = {
  PRODUCTS: 'smart_dukaan_products_v1',
  SALES: 'smart_dukaan_sales_v1',
  SETTINGS: 'smart_dukaan_settings_v1',
  IS_DEMO: 'smart_dukaan_is_demo_v1',
};

const InventoryContext = createContext<InventoryContextType | null>(null);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return generateSyntheticSales(INITIAL_PRODUCTS, 90);
  });

  const [settings, setSettings] = useState<InventorySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_SETTINGS;
  });

  const [isDemoData, setIsDemoData] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.IS_DEMO);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return true;
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch {
      // ignore
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.IS_DEMO, JSON.stringify(isDemoData));
    } catch {
      // ignore
    }
  }, [isDemoData]);

  // Derived categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Compute recommendations for all products
  const recommendations = useMemo(() => {
    return products.map((prod) => generateProductRecommendation(prod, sales, settings));
  }, [products, sales, settings]);

  const addProduct = (newProd: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const id = `PRD-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString().split('T')[0];
    const created: Product = {
      ...newProd,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setProducts((prev) => [created, ...prev]);
    setIsDemoData(false);
    return created;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const now = new Date().toISOString().split('T')[0];
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p))
    );
    setIsDemoData(false);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setIsDemoData(false);
  };

  const recordSale = (
    productId: string,
    quantity: number,
    dateStr?: string,
    customPrice?: number
  ): { success: boolean; message: string } => {
    const target = products.find((p) => p.id === productId);
    if (!target) {
      return { success: false, message: 'Product not found.' };
    }
    if (quantity <= 0) {
      return { success: false, message: 'Quantity must be greater than zero.' };
    }
    if (target.currentStock < quantity) {
      return {
        success: false,
        message: `Insufficient stock! Current stock is ${target.currentStock} ${target.unit}, but sale was ${quantity} ${target.unit}.`,
      };
    }

    const price = customPrice !== undefined && customPrice >= 0 ? customPrice : target.sellingPrice;
    const saleDate = dateStr || new Date().toISOString().split('T')[0];
    const saleId = `SL-${Date.now().toString().slice(-6)}`;

    const newSale: SaleRecord = {
      id: saleId,
      productId: target.id,
      productName: target.name,
      date: saleDate,
      quantity,
      unitPrice: price,
      totalAmount: quantity * price,
    };

    // Deduct stock & add sale
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              currentStock: Math.max(0, p.currentStock - quantity),
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : p
      )
    );
    setSales((prev) => [newSale, ...prev]);
    setIsDemoData(false);

    return {
      success: true,
      message: `Sold ${quantity} ${target.unit} of ${target.name}. Stock updated to ${target.currentStock - quantity}.`,
    };
  };

  const receiveRestock = (productId: string, quantity: number) => {
    if (quantity <= 0) return;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const remainingIncoming = Math.max(0, p.incomingOrderQty - quantity);
          return {
            ...p,
            currentStock: p.currentStock + quantity,
            incomingOrderQty: remainingIncoming,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return p;
      })
    );
    setIsDemoData(false);
  };

  const updateSettings = (newSettings: Partial<InventorySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetToDemoData = () => {
    const freshSales = generateSyntheticSales(INITIAL_PRODUCTS, 90);
    setProducts(INITIAL_PRODUCTS);
    setSales(freshSales);
    setSettings(INITIAL_SETTINGS);
    setIsDemoData(true);
  };

  // CSV Export utility
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportProductsCSV = () => {
    const headers = [
      'Product ID',
      'Name',
      'Category',
      'Current Stock',
      'Unit',
      'Selling Price (INR)',
      'Purchase Cost (INR)',
      'Min Stock Threshold',
      'Supplier Name',
      'Supplier Lead Time (Days)',
      'Incoming Order Qty',
      'Expiry Date',
      'Notes',
    ];

    const rows = products.map((p) => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.currentStock,
      `"${p.unit}"`,
      p.sellingPrice,
      p.purchaseCost,
      p.minStockThreshold,
      `"${p.supplierName.replace(/"/g, '""')}"`,
      p.supplierLeadTimeDays,
      p.incomingOrderQty,
      p.expiryDate ? `"${p.expiryDate}"` : '""',
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csvContent, `smart_dukaan_inventory_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportRestockSheetCSV = () => {
    const headers = [
      'Product ID',
      'Name',
      'Category',
      'Action',
      'Current Stock',
      'Avg Daily Sales',
      'Lead Time (Days)',
      'Reorder Point',
      'Incoming Stock',
      'Recommended Order Qty',
      'Purchase Cost (INR)',
      'Total Estimated Cost (INR)',
      'Supplier Name',
      'Reasoning',
    ];

    const rows = recommendations.map((r) => {
      const p = products.find((prod) => prod.id === r.productId);
      return [
        `"${r.productId}"`,
        `"${r.productName.replace(/"/g, '""')}"`,
        `"${r.category}"`,
        `"${r.action}"`,
        r.currentStock,
        r.avgDailyDemand,
        r.leadTimeDays,
        r.reorderPoint,
        r.incomingStock,
        r.recommendedOrderQty,
        r.purchaseCost,
        r.estimatedPurchaseCost,
        `"${(p?.supplierName || '').replace(/"/g, '""')}"`,
        `"${r.reason.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csvContent, `smart_dukaan_restock_order_sheet_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportBackupJSON = () => {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      shop: settings,
      products,
      sales,
    };
    downloadFile(JSON.stringify(data, null, 2), `smart_dukaan_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const importProductsFromCSV = (csvString: string): { imported: number; errors: string[] } => {
    const lines = csvString.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { imported: 0, errors: ['CSV file is empty or missing headers.'] };
    }

    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

    // Map column names flexibly
    const findIndex = (patterns: string[]) =>
      headers.findIndex((h) => patterns.some((p) => h.includes(p)));

    const nameIdx = findIndex(['name', 'product name', 'item']);
    const catIdx = findIndex(['category', 'type', 'dept']);
    const stockIdx = findIndex(['current stock', 'stock', 'qty', 'quantity']);
    const unitIdx = findIndex(['unit', 'uom']);
    const priceIdx = findIndex(['selling price', 'price', 'mrp', 'rate']);
    const costIdx = findIndex(['purchase cost', 'cost', 'buy price']);
    const minIdx = findIndex(['min stock', 'threshold', 'minimum']);
    const supplierIdx = findIndex(['supplier', 'vendor']);
    const leadIdx = findIndex(['lead time', 'delivery days', 'lead']);
    const expiryIdx = findIndex(['expiry', 'exp date']);

    if (nameIdx === -1 || stockIdx === -1) {
      return {
        imported: 0,
        errors: ['Missing mandatory columns: Product Name and Current Stock are required.'],
      };
    }

    const errors: string[] = [];
    const newItems: Product[] = [];
    const now = new Date().toISOString().split('T')[0];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV regex parsing respecting quoted strings
      const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cleanCols = cols.map((c) => c.replace(/^"|"$/g, '').trim());

      const name = cleanCols[nameIdx] || '';
      if (!name) {
        errors.push(`Row ${i + 1}: Missing product name.`);
        continue;
      }

      const stock = parseFloat(cleanCols[stockIdx]);
      if (isNaN(stock) || stock < 0) {
        errors.push(`Row ${i + 1} (${name}): Invalid stock quantity '${cleanCols[stockIdx]}'. Must be $\\ge 0$.`);
        continue;
      }

      const price = priceIdx !== -1 ? parseFloat(cleanCols[priceIdx]) || 0 : 50;
      const cost = costIdx !== -1 ? parseFloat(cleanCols[costIdx]) || price * 0.8 : price * 0.8;
      const minStock = minIdx !== -1 ? parseFloat(cleanCols[minIdx]) || 10 : 10;
      const leadTime = leadIdx !== -1 ? parseInt(cleanCols[leadIdx], 10) || 3 : 3;
      const category = catIdx !== -1 ? cleanCols[catIdx] || 'General Store' : 'General Store';
      const unitRaw = unitIdx !== -1 ? cleanCols[unitIdx].toLowerCase() : 'packet';
      const validUnits: UnitType[] = ['kg', 'packet', 'piece', 'litre', 'box', 'bottle', 'gram'];
      const unit: UnitType = (validUnits.includes(unitRaw as UnitType) ? unitRaw : 'packet') as UnitType;
      const supplierName = supplierIdx !== -1 ? cleanCols[supplierIdx] || 'Local Wholesale Market' : 'Local Wholesale Market';
      const expiryDate = expiryIdx !== -1 && cleanCols[expiryIdx] ? cleanCols[expiryIdx] : undefined;

      const newProd: Product = {
        id: `PRD-${Date.now().toString().slice(-4)}-${i}`,
        name,
        category,
        currentStock: stock,
        unit,
        sellingPrice: price,
        purchaseCost: cost,
        minStockThreshold: minStock,
        supplierName,
        supplierLeadTimeDays: Math.max(1, leadTime),
        incomingOrderQty: 0,
        backorderQty: 0,
        expiryDate,
        createdAt: now,
        updatedAt: now,
      };

      newItems.push(newProd);
    }

    if (newItems.length > 0) {
      setProducts((prev) => [...newItems, ...prev]);
      setIsDemoData(false);
    }

    return { imported: newItems.length, errors };
  };

  const importSalesFromCSV = (csvString: string): { imported: number; errors: string[] } => {
    const lines = csvString.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { imported: 0, errors: ['CSV file is empty or missing headers.'] };
    }

    const headers = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const prodIdIdx = headers.findIndex((h) => h.includes('id') || h.includes('code'));
    const prodNameIdx = headers.findIndex((h) => h.includes('product') || h.includes('name') || h.includes('item'));
    const qtyIdx = headers.findIndex((h) => h.includes('qty') || h.includes('quantity') || h.includes('sold'));
    const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('day'));
    const amountIdx = headers.findIndex((h) => h.includes('amount') || h.includes('price') || h.includes('total'));

    if (qtyIdx === -1) {
      return { imported: 0, errors: ['Sales CSV must have a quantity column.'] };
    }

    const errors: string[] = [];
    const newSales: SaleRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      const qty = parseFloat(cols[qtyIdx]);
      if (isNaN(qty) || qty <= 0) {
        errors.push(`Row ${i + 1}: Invalid sold quantity '${cols[qtyIdx]}'.`);
        continue;
      }

      const pId = prodIdIdx !== -1 ? cols[prodIdIdx] : '';
      const pName = prodNameIdx !== -1 ? cols[prodNameIdx] : '';

      // Match to existing product
      const matched = products.find(
        (p) => (pId && p.id.toLowerCase() === pId.toLowerCase()) || (pName && p.name.toLowerCase() === pName.toLowerCase())
      );

      const resolvedId = matched ? matched.id : pId || `PRD-CUSTOM-${i}`;
      const resolvedName = matched ? matched.name : pName || 'Imported Product';
      const resolvedPrice = matched ? matched.sellingPrice : amountIdx !== -1 ? parseFloat(cols[amountIdx]) || 10 : 10;
      const saleDate = dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx] : new Date().toISOString().split('T')[0];

      newSales.push({
        id: `SL-IMP-${Date.now().toString().slice(-4)}-${i}`,
        productId: resolvedId,
        productName: resolvedName,
        date: saleDate,
        quantity: qty,
        unitPrice: resolvedPrice,
        totalAmount: qty * resolvedPrice,
      });
    }

    if (newSales.length > 0) {
      setSales((prev) => [...newSales, ...prev]);
      setIsDemoData(false);
    }

    return { imported: newSales.length, errors };
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        sales,
        settings,
        recommendations,
        categories,
        isDemoData,
        addProduct,
        updateProduct,
        deleteProduct,
        recordSale,
        receiveRestock,
        updateSettings,
        resetToDemoData,
        importProductsFromCSV,
        importSalesFromCSV,
        exportProductsCSV,
        exportRestockSheetCSV,
        exportBackupJSON,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
