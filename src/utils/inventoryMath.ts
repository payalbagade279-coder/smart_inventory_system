import { Product, SaleRecord, RestockRecommendation, RestockAction, InventorySettings, ExpiryRiskAnalysis } from '../types/inventory';

/**
 * Calculates historical sales metrics for a product over a given window of days.
 */
export function calculateProductSalesMetrics(
  productId: string,
  sales: SaleRecord[],
  windowDays: number = 30,
  referenceDateStr?: string
): {
  avgDailyDemand: number;
  stdDevDailyDemand: number;
  totalUnitsSold: number;
  lastSaleDate: string | null;
} {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const cutoffDate = new Date(refDate);
  cutoffDate.setDate(cutoffDate.getDate() - windowDays);

  const productSales = sales.filter((s) => {
    if (s.productId !== productId) return false;
    const saleDate = new Date(s.date);
    return saleDate >= cutoffDate && saleDate <= refDate;
  });

  // Aggregate quantity per day in the window to compute true daily variance
  const dailyTotals: Record<string, number> = {};
  let totalSold = 0;
  let lastSaleDate: string | null = null;

  // Initialize all days in window with 0
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(cutoffDate);
    d.setDate(d.getDate() + i + 1);
    const dateKey = d.toISOString().split('T')[0];
    dailyTotals[dateKey] = 0;
  }

  for (const s of productSales) {
    if (dailyTotals[s.date] !== undefined) {
      dailyTotals[s.date] += s.quantity;
    } else {
      dailyTotals[s.date] = s.quantity;
    }
    totalSold += s.quantity;
    if (!lastSaleDate || s.date > lastSaleDate) {
      lastSaleDate = s.date;
    }
  }

  const daysCount = Math.max(1, windowDays);
  const avgDailyDemand = Number((totalSold / daysCount).toFixed(2));

  // Compute daily standard deviation
  const values = Object.values(dailyTotals);
  const variance = values.reduce((acc, val) => acc + Math.pow(val - avgDailyDemand, 2), 0) / daysCount;
  const stdDevDailyDemand = Number(Math.sqrt(variance).toFixed(2));

  return {
    avgDailyDemand,
    stdDevDailyDemand,
    totalUnitsSold: totalSold,
    lastSaleDate,
  };
}

/**
 * Lead-Time Demand = Average Daily Demand × Supplier Lead Time
 */
export function calculateLeadTimeDemand(avgDailyDemand: number, leadTimeDays: number): number {
  return Number((avgDailyDemand * leadTimeDays).toFixed(2));
}

/**
 * Safety Stock calculation using standard OR formula:
 * SS = Z * sqrt(LeadTime) * stdDevDaily
 * If standard deviation is 0 (or constant sales), fallback to 25% of Lead-Time Demand or 1 unit.
 */
export function calculateSafetyStock(
  avgDailyDemand: number,
  stdDevDailyDemand: number,
  leadTimeDays: number,
  serviceLevelZ: number = 1.65,
  manualSafetyStock?: number
): number {
  if (manualSafetyStock !== undefined && manualSafetyStock >= 0) {
    return manualSafetyStock;
  }
  if (avgDailyDemand <= 0) {
    return 1;
  }

  const effectiveStdDev = stdDevDailyDemand > 0 ? stdDevDailyDemand : avgDailyDemand * 0.35;
  const calculated = serviceLevelZ * Math.sqrt(Math.max(1, leadTimeDays)) * effectiveStdDev;
  return Math.max(1, Math.ceil(calculated));
}

/**
 * Reorder Point = Lead-Time Demand + Safety Stock
 */
export function calculateReorderPoint(leadTimeDemand: number, safetyStock: number): number {
  return Math.ceil(leadTimeDemand + safetyStock);
}

/**
 * Inventory Position = Current Stock + Incoming Stock - Backorders
 */
export function calculateInventoryPosition(
  currentStock: number,
  incomingStock: number = 0,
  backorderQty: number = 0
): number {
  return currentStock + incomingStock - backorderQty;
}

/**
 * Target Stock (Order-Up-To Level) =
 * Expected Demand During Lead Time + Expected Demand During Review Period + Safety Stock
 */
export function calculateTargetStock(
  avgDailyDemand: number,
  leadTimeDays: number,
  reviewPeriodDays: number,
  safetyStock: number
): number {
  const leadTimeDemand = avgDailyDemand * leadTimeDays;
  const reviewDemand = avgDailyDemand * reviewPeriodDays;
  return Math.ceil(leadTimeDemand + reviewDemand + safetyStock);
}

/**
 * Recommended Order Quantity = max(0, Target Stock - Inventory Position)
 */
export function calculateRecommendedOrderQuantity(targetStock: number, inventoryPosition: number): number {
  return Math.max(0, Math.ceil(targetStock - inventoryPosition));
}

/**
 * Analyzes expiry risk against remaining stock and demand rate.
 */
export function analyzeExpiryRisk(
  expiryDateStr: string | undefined,
  currentStock: number,
  avgDailyDemand: number,
  purchaseCost: number,
  currentDateStr?: string
): ExpiryRiskAnalysis | undefined {
  if (!expiryDateStr) return undefined;

  const today = currentDateStr ? new Date(currentDateStr) : new Date();
  const expiry = new Date(expiryDateStr);
  const diffMs = expiry.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const safeDemand = avgDailyDemand > 0 ? avgDailyDemand : 0.05;
  const estimatedDaysToSell = Math.ceil(currentStock / safeDemand);

  // If days to sell exceeds days remaining, stock will expire before getting sold
  const isRisk = daysRemaining <= 60 && estimatedDaysToSell > daysRemaining && currentStock > 0;
  const unitsCanSellBeforeExpiry = Math.floor(safeDemand * daysRemaining);
  const unitsAtRisk = isRisk ? Math.max(0, currentStock - unitsCanSellBeforeExpiry) : 0;
  const potentialLoss = unitsAtRisk * purchaseCost;

  return {
    expiryDate: expiryDateStr,
    daysRemaining,
    estimatedDaysToSell,
    isRisk,
    unitsAtRisk,
    potentialLoss,
  };
}

/**
 * Generates plain-English explanation derived deterministically from the mathematical values.
 */
export function generateRestockReason(
  action: RestockAction,
  productName: string,
  unit: string,
  orderQty: number,
  currentStock: number,
  avgDailyDemand: number,
  leadTimeDays: number,
  leadTimeDemand: number,
  safetyStock: number,
  inventoryPosition: number,
  reorderPoint: number,
  incomingStock: number,
  daysOfCoverage: number,
  expiryRisk?: ExpiryRiskAnalysis
): string {
  if (action === 'EXPIRY_RISK' && expiryRisk) {
    return `Warning: ${expiryRisk.unitsAtRisk} ${unit} may expire before being sold at your pace of ${avgDailyDemand.toFixed(1)} ${unit}/day. ${expiryRisk.daysRemaining} days left until expiry. Consider offering a 10–20% discount to clear stock.`;
  }

  if (action === 'ORDER_NOW') {
    if (currentStock <= 0) {
      return `Critical: Out of stock! Place an order for ${orderQty} ${unit} immediately. Supplier takes ${leadTimeDays} days, during which ~${leadTimeDemand} ${unit} could sell based on past demand.`;
    }
    const incomingText = incomingStock > 0 ? ` (${incomingStock} ${unit} already in transit)` : '';
    return `Order ${orderQty} ${unit}. With ${currentStock} ${unit} on hand${incomingText}, your inventory position (${inventoryPosition}) has fallen below the reorder point of ${reorderPoint} ${unit}. At ${avgDailyDemand.toFixed(1)} ${unit}/day, ~${leadTimeDemand} ${unit} will sell during the ${leadTimeDays}-day delivery period, plus a ${safetyStock} ${unit} safety buffer.`;
  }

  if (action === 'RESTOCK_SOON') {
    return `Stock is approaching reorder threshold (${reorderPoint} ${unit}). You have ${currentStock} ${unit} (${daysOfCoverage} days coverage). Prepare to reorder within 2–3 days as supplier delivery takes ${leadTimeDays} days.`;
  }

  if (action === 'SLOW_MOVING') {
    return `Sales have been very low (${avgDailyDemand.toFixed(2)} ${unit}/day). You hold ${currentStock} ${unit} (~${daysOfCoverage} days of supply). Do not purchase additional stock until current inventory is reviewed.`;
  }

  if (action === 'EXCESS_STOCK') {
    return `Excess stock detected: ${currentStock} ${unit} on hand provides ${daysOfCoverage} days of coverage, significantly higher than your target buffer. Avoid reordering to free up locked capital.`;
  }

  // STOCK_SUFFICIENT
  return `Stock level is healthy. You have ${currentStock} ${unit} (${daysOfCoverage} days coverage). With a ${leadTimeDays}-day lead time and demand of ${avgDailyDemand.toFixed(1)} ${unit}/day, no order is needed today.`;
}

/**
 * Builds complete RestockRecommendation for a product based on current settings and sales history.
 */
export function generateProductRecommendation(
  product: Product,
  sales: SaleRecord[],
  settings: InventorySettings,
  referenceDateStr?: string
): RestockRecommendation {
  const { avgDailyDemand, stdDevDailyDemand } = calculateProductSalesMetrics(
    product.id,
    sales,
    30,
    referenceDateStr
  );

  const leadTimeDemand = calculateLeadTimeDemand(avgDailyDemand, product.supplierLeadTimeDays);
  const safetyStock = calculateSafetyStock(
    avgDailyDemand,
    stdDevDailyDemand,
    product.supplierLeadTimeDays,
    settings.serviceLevelZ,
    product.safetyStockManual
  );
  const reorderPoint = calculateReorderPoint(leadTimeDemand, safetyStock);
  const inventoryPosition = calculateInventoryPosition(
    product.currentStock,
    product.incomingOrderQty,
    product.backorderQty || 0
  );
  const targetStock = calculateTargetStock(
    avgDailyDemand,
    product.supplierLeadTimeDays,
    settings.reviewPeriodDays,
    safetyStock
  );
  const recommendedOrderQty = calculateRecommendedOrderQuantity(targetStock, inventoryPosition);
  const estimatedPurchaseCost = recommendedOrderQty * product.purchaseCost;

  const daysOfCoverage =
    avgDailyDemand > 0 ? Math.round(product.currentStock / avgDailyDemand) : product.currentStock > 0 ? 999 : 0;

  const expiryRisk = analyzeExpiryRisk(
    product.expiryDate,
    product.currentStock,
    avgDailyDemand,
    product.purchaseCost,
    referenceDateStr
  );

  // Classification logic
  let action: RestockAction = 'STOCK_SUFFICIENT';
  let urgency: 'critical' | 'warning' | 'normal' | 'info' = 'normal';

  if (expiryRisk && expiryRisk.isRisk && expiryRisk.unitsAtRisk > 0 && expiryRisk.daysRemaining <= 45) {
    action = 'EXPIRY_RISK';
    urgency = expiryRisk.daysRemaining <= 15 ? 'critical' : 'warning';
  } else if (inventoryPosition <= reorderPoint || product.currentStock <= product.minStockThreshold) {
    action = 'ORDER_NOW';
    urgency = product.currentStock <= product.minStockThreshold || product.currentStock === 0 ? 'critical' : 'warning';
  } else if (inventoryPosition <= reorderPoint * 1.25) {
    action = 'RESTOCK_SOON';
    urgency = 'warning';
  } else if (avgDailyDemand < settings.slowMovingThresholdDaily && product.currentStock > 5) {
    action = 'SLOW_MOVING';
    urgency = 'info';
  } else if (
    daysOfCoverage > settings.excessStockDaysThreshold &&
    product.currentStock > targetStock * 1.5 &&
    product.currentStock > 10
  ) {
    action = 'EXCESS_STOCK';
    urgency = 'info';
  } else {
    action = 'STOCK_SUFFICIENT';
    urgency = 'normal';
  }

  const reason = generateRestockReason(
    action,
    product.name,
    product.unit,
    recommendedOrderQty,
    product.currentStock,
    avgDailyDemand,
    product.supplierLeadTimeDays,
    leadTimeDemand,
    safetyStock,
    inventoryPosition,
    reorderPoint,
    product.incomingOrderQty,
    daysOfCoverage,
    expiryRisk
  );

  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    currentStock: product.currentStock,
    unit: product.unit,
    sellingPrice: product.sellingPrice,
    purchaseCost: product.purchaseCost,
    avgDailyDemand,
    leadTimeDays: product.supplierLeadTimeDays,
    leadTimeDemand,
    safetyStock,
    reorderPoint,
    incomingStock: product.incomingOrderQty,
    inventoryPosition,
    targetStock,
    reviewPeriodDays: settings.reviewPeriodDays,
    recommendedOrderQty,
    estimatedPurchaseCost,
    daysOfCoverage,
    action,
    urgency,
    reason,
    expiryRisk,
  };
}
