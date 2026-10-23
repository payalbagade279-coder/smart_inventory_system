export type UnitType = 'kg' | 'packet' | 'piece' | 'litre' | 'box' | 'bottle' | 'gram';

export type RestockAction =
  | 'ORDER_NOW'
  | 'RESTOCK_SOON'
  | 'STOCK_SUFFICIENT'
  | 'EXCESS_STOCK'
  | 'SLOW_MOVING'
  | 'EXPIRY_RISK';

export interface Product {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: UnitType;
  sellingPrice: number;
  purchaseCost: number;
  minStockThreshold: number;
  supplierName: string;
  supplierLeadTimeDays: number;
  expiryDate?: string; // YYYY-MM-DD
  incomingOrderQty: number; // outstanding order
  backorderQty?: number;
  safetyStockManual?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleRecord {
  id: string;
  productId: string;
  productName: string;
  date: string; // YYYY-MM-DD
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface ExpiryRiskAnalysis {
  expiryDate: string;
  daysRemaining: number;
  estimatedDaysToSell: number;
  isRisk: boolean;
  unitsAtRisk: number;
  potentialLoss: number;
}

export interface RestockRecommendation {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  unit: UnitType;
  sellingPrice: number;
  purchaseCost: number;
  avgDailyDemand: number;
  leadTimeDays: number;
  leadTimeDemand: number;
  safetyStock: number;
  reorderPoint: number;
  incomingStock: number;
  inventoryPosition: number;
  targetStock: number;
  reviewPeriodDays: number;
  recommendedOrderQty: number;
  estimatedPurchaseCost: number;
  daysOfCoverage: number;
  action: RestockAction;
  urgency: 'critical' | 'warning' | 'normal' | 'info';
  reason: string;
  expiryRisk?: ExpiryRiskAnalysis;
}

export interface InventorySettings {
  shopName: string;
  shopOwner: string;
  currencySymbol: string;
  reviewPeriodDays: number;
  serviceLevelZ: number; // 1.65 = 95%
  slowMovingThresholdDaily: number; // e.g. 0.2 units/day
  excessStockDaysThreshold: number; // e.g. 45 days
}

export interface ForecastPoint {
  date: string;
  label: string;
  actual?: number;
  seasonalNaive?: number;
  linearTrend?: number;
  isFuture: boolean;
}

export interface ForecastMetrics {
  maeNaive: number;
  maeTrend: number;
  wapeNaive: number; // Weighted Absolute Percentage Error %
  wapeTrend: number;
  testPeriodDays: number;
  rSquared?: number;
}

export interface SimulatorState {
  currentStock: number;
  expectedDailyDemand: number;
  supplierLeadTimeDays: number;
  safetyStock: number;
  reviewPeriodDays: number;
  incomingStock: number;
}
