import { Product, SaleRecord, InventorySettings } from '../types/inventory';

export const INITIAL_SETTINGS: InventorySettings = {
  shopName: 'Shree Ganesh Kirana & General Store',
  shopOwner: 'Ramesh Patel',
  currencySymbol: '₹',
  reviewPeriodDays: 7,
  serviceLevelZ: 1.65, // 95% service level
  slowMovingThresholdDaily: 0.25,
  excessStockDaysThreshold: 45,
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PRD-101',
    name: 'Basmati Rice (Daawat Rozana Gold)',
    category: 'Staples & Grains',
    currentStock: 8,
    unit: 'kg',
    sellingPrice: 135,
    purchaseCost: 105,
    minStockThreshold: 15,
    supplierName: 'Kisan Agro Traders, Delhi',
    supplierLeadTimeDays: 4,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
    notes: 'Fast moving daily staple. High demand on weekends.',
  },
  {
    id: 'PRD-102',
    name: 'Aashirvaad Shubh Gold Chakki Atta',
    category: 'Staples & Grains',
    currentStock: 14,
    unit: 'kg',
    sellingPrice: 52,
    purchaseCost: 41,
    minStockThreshold: 20,
    supplierName: 'ITC Food Distributors',
    supplierLeadTimeDays: 3,
    incomingOrderQty: 10, // 10 units incoming
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
  },
  {
    id: 'PRD-103',
    name: 'Fortune Sunlite Sunflower Oil (1L Pouch)',
    category: 'Oils & Ghee',
    currentStock: 7,
    unit: 'packet',
    sellingPrice: 155,
    purchaseCost: 132,
    minStockThreshold: 25,
    supplierName: 'Adani Wilmar Agency',
    supplierLeadTimeDays: 5,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
    notes: 'Essential cooking oil. Demand constant throughout the week.',
  },
  {
    id: 'PRD-104',
    name: 'Madhur Pure & Hygienic Sugar (1kg)',
    category: 'Staples & Grains',
    currentStock: 42,
    unit: 'packet',
    sellingPrice: 50,
    purchaseCost: 42,
    minStockThreshold: 30,
    supplierName: 'Shree Renuka Wholesalers',
    supplierLeadTimeDays: 2,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
  },
  {
    id: 'PRD-105',
    name: 'Tata Tea Premium Leaf (500g)',
    category: 'Beverages & Dairy',
    currentStock: 26,
    unit: 'packet',
    sellingPrice: 280,
    purchaseCost: 235,
    minStockThreshold: 18,
    supplierName: 'Tata Consumer Products Depot',
    supplierLeadTimeDays: 3,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
  },
  {
    id: 'PRD-106',
    name: 'Parle-G Glucose Biscuits (250g)',
    category: 'Snacks & Biscuits',
    currentStock: 5,
    unit: 'packet',
    sellingPrice: 25,
    purchaseCost: 19,
    minStockThreshold: 35,
    supplierName: 'Parle Products C&F Agent',
    supplierLeadTimeDays: 2,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
    notes: 'Highest velocity snack in store. Rapid stockouts if not tracked daily.',
  },
  {
    id: 'PRD-107',
    name: 'Britannia Good Day Butter Cookies (200g)',
    category: 'Snacks & Biscuits',
    currentStock: 28,
    unit: 'packet',
    sellingPrice: 40,
    purchaseCost: 31,
    minStockThreshold: 20,
    supplierName: 'Britannia Depot Hub',
    supplierLeadTimeDays: 3,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
  },
  {
    id: 'PRD-108',
    name: 'Dettol Original Bath Soap (Pack of 3)',
    category: 'Personal Care',
    currentStock: 16,
    unit: 'piece',
    sellingPrice: 145,
    purchaseCost: 118,
    minStockThreshold: 12,
    supplierName: 'Reckitt Benckiser Channel Partner',
    supplierLeadTimeDays: 4,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
  },
  {
    id: 'PRD-109',
    name: 'Head & Shoulders Anti-Dandruff (180ml)',
    category: 'Personal Care',
    currentStock: 8,
    unit: 'bottle',
    sellingPrice: 195,
    purchaseCost: 155,
    minStockThreshold: 10,
    supplierName: 'P&G Distribution Network',
    supplierLeadTimeDays: 5,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
  },
  {
    id: 'PRD-110',
    name: 'Colgate Strong Teeth Toothpaste (200g)',
    category: 'Personal Care',
    currentStock: 32,
    unit: 'piece',
    sellingPrice: 115,
    purchaseCost: 92,
    minStockThreshold: 20,
    supplierName: 'Colgate-Palmolive Direct',
    supplierLeadTimeDays: 3,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
  },
  {
    id: 'PRD-111',
    name: 'Surf Excel Easy Wash Detergent (1kg)',
    category: 'Cleaning & Household',
    currentStock: 22,
    unit: 'packet',
    sellingPrice: 150,
    purchaseCost: 124,
    minStockThreshold: 15,
    supplierName: 'Hindustan Unilever Distributor',
    supplierLeadTimeDays: 4,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
  },
  {
    id: 'PRD-112',
    name: "Haldiram's Nagpur Aloo Bhujia (400g)",
    category: 'Snacks & Biscuits',
    currentStock: 35,
    unit: 'packet',
    sellingPrice: 110,
    purchaseCost: 88,
    minStockThreshold: 20,
    supplierName: 'Haldiram Snacks Logistics',
    supplierLeadTimeDays: 3,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
  },
  {
    id: 'PRD-113',
    name: 'Thums Up Charged Cold Drink (750ml)',
    category: 'Beverages & Dairy',
    currentStock: 24,
    unit: 'bottle',
    sellingPrice: 40,
    purchaseCost: 31,
    minStockThreshold: 18,
    supplierName: 'Hindustan Coca-Cola Beverages',
    supplierLeadTimeDays: 2,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
  },
  {
    id: 'PRD-114',
    name: 'Amul Taaza Homogenised Toned Milk (1L)',
    category: 'Beverages & Dairy',
    currentStock: 48,
    unit: 'box',
    sellingPrice: 72,
    purchaseCost: 61,
    minStockThreshold: 20,
    supplierName: 'Gujarat Co-operative Milk (Amul)',
    supplierLeadTimeDays: 1,
    expiryDate: '2026-11-04', // 12 days left! High risk because stock is 48 but selling only ~2.2/day
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
    notes: 'Short shelf-life tetra pak. Requires monitoring before expiry date.',
  },
  {
    id: 'PRD-115',
    name: 'Maggi 2-Minute Masala Noodles (4-Pack)',
    category: 'Snacks & Biscuits',
    currentStock: 8,
    unit: 'packet',
    sellingPrice: 60,
    purchaseCost: 49,
    minStockThreshold: 25,
    supplierName: 'Nestlé India Distribution',
    supplierLeadTimeDays: 3,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
    notes: 'Consistent daily family favorite. High velocity.',
  },
  {
    id: 'PRD-116',
    name: 'Everest Royal Garam Masala (100g Box)',
    category: 'Spices',
    currentStock: 25,
    unit: 'box',
    sellingPrice: 85,
    purchaseCost: 66,
    minStockThreshold: 12,
    supplierName: 'Everest Spices Agency',
    supplierLeadTimeDays: 6,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
  },
  {
    id: 'PRD-117',
    name: 'Cadbury Dairy Milk Silk Chocolate (150g)',
    category: 'Snacks & Biscuits',
    currentStock: 12,
    unit: 'piece',
    sellingPrice: 180,
    purchaseCost: 145,
    minStockThreshold: 12,
    supplierName: 'Mondelez India Wholesaler',
    supplierLeadTimeDays: 3,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
  },
  {
    id: 'PRD-118',
    name: 'Vim Dishwash Gel Lemon (500ml Bottle)',
    category: 'Cleaning & Household',
    currentStock: 28,
    unit: 'bottle',
    sellingPrice: 120,
    purchaseCost: 96,
    minStockThreshold: 14,
    supplierName: 'Hindustan Unilever Distributor',
    supplierLeadTimeDays: 4,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
  },
  {
    id: 'PRD-119',
    name: 'Premium Kashmiri Kesar / Saffron (1g)',
    category: 'Spices',
    currentStock: 24,
    unit: 'box',
    sellingPrice: 380,
    purchaseCost: 290,
    minStockThreshold: 3,
    supplierName: 'Valley Herbals Srinagar',
    supplierLeadTimeDays: 10,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
    notes: 'Very high value item. Rarely bought (slow mover). Working capital locked up.',
  },
  {
    id: 'PRD-120',
    name: 'Imported Extra Virgin Olive Oil (500ml)',
    category: 'Oils & Ghee',
    currentStock: 42,
    unit: 'bottle',
    sellingPrice: 620,
    purchaseCost: 485,
    minStockThreshold: 6,
    supplierName: 'Gourmet Imports Mumbai',
    supplierLeadTimeDays: 7,
    incomingOrderQty: 0,
    backorderQty: 0,
    createdAt: '2026-07-01',
    updatedAt: '2026-10-23',
    notes: 'Over-ordered in bulk last quarter. Holds ₹20,370 in excess inventory.',
  },
];

/**
 * Deterministic pseudo-random number generator for reproducible sales records.
 */
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates 90 days of reproducible synthetic daily sales records.
 * Realistic consumer patterns:
 * - Weekend surge (+35% footfall on Sat & Sun)
 * - Realistic daily velocity per product
 */
export function generateSyntheticSales(
  products: Product[],
  daysCount: number = 90,
  referenceDateStr: string = '2026-10-23'
): SaleRecord[] {
  const records: SaleRecord[] = [];
  const refDate = new Date(referenceDateStr);
  const rand = createSeededRandom(42918);

  // Baseline average daily velocity per product ID
  const productVelocities: Record<string, { base: number; weekendMultiplier: number }> = {
    'PRD-101': { base: 2.8, weekendMultiplier: 1.4 }, // Basmati Rice
    'PRD-102': { base: 3.6, weekendMultiplier: 1.35 }, // Atta
    'PRD-103': { base: 4.5, weekendMultiplier: 1.25 }, // Oil
    'PRD-104': { base: 4.8, weekendMultiplier: 1.3 }, // Sugar
    'PRD-105': { base: 2.6, weekendMultiplier: 1.2 }, // Tea
    'PRD-106': { base: 13.5, weekendMultiplier: 1.5 }, // Parle-G (very high)
    'PRD-107': { base: 4.2, weekendMultiplier: 1.4 }, // Good Day
    'PRD-108': { base: 1.7, weekendMultiplier: 1.2 }, // Soap
    'PRD-109': { base: 1.3, weekendMultiplier: 1.2 }, // Shampoo
    'PRD-110': { base: 2.5, weekendMultiplier: 1.25 }, // Colgate
    'PRD-111': { base: 2.1, weekendMultiplier: 1.3 }, // Surf Excel
    'PRD-112': { base: 4.4, weekendMultiplier: 1.6 }, // Bhujia (weekend party snack)
    'PRD-113': { base: 3.8, weekendMultiplier: 1.7 }, // Thums Up
    'PRD-114': { base: 2.2, weekendMultiplier: 1.15 }, // Amul Milk (slow vs stock 48)
    'PRD-115': { base: 6.8, weekendMultiplier: 1.5 }, // Maggi Noodles
    'PRD-116': { base: 1.2, weekendMultiplier: 1.2 }, // Garam Masala
    'PRD-117': { base: 2.1, weekendMultiplier: 1.6 }, // Dairy Milk Silk
    'PRD-118': { base: 1.6, weekendMultiplier: 1.2 }, // Vim Dishwash
    'PRD-119': { base: 0.08, weekendMultiplier: 1.0 }, // Saffron (very slow mover)
    'PRD-120': { base: 0.18, weekendMultiplier: 1.1 }, // Imported Olive Oil (slow mover)
  };

  let recordCounter = 1000;

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(refDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    for (const prod of products) {
      const config = productVelocities[prod.id] || { base: 1.5, weekendMultiplier: 1.2 };
      const mean = isWeekend ? config.base * config.weekendMultiplier : config.base;

      // Poisson-like distribution approximation
      let qty = 0;
      if (mean < 0.2) {
        // Very slow mover: probability of selling 1 unit on this day is mean
        qty = rand() < mean ? 1 : 0;
      } else {
        // Normal random jitter
        const jitter = (rand() + rand() + rand() - 1.5) * Math.sqrt(mean);
        qty = Math.max(0, Math.round(mean + jitter));
      }

      if (qty > 0) {
        recordCounter++;
        records.push({
          id: `SL-${recordCounter}`,
          productId: prod.id,
          productName: prod.name,
          date: dateStr,
          quantity: qty,
          unitPrice: prod.sellingPrice,
          totalAmount: qty * prod.sellingPrice,
        });
      }
    }
  }

  return records;
}
