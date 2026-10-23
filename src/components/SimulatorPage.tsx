import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  RotateCcw,
  Check,
  ArrowRight,
  TrendingUp,
  Truck,
  ShieldCheck,
  Calendar,
  IndianRupee,
  HelpCircle,
  Package,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types/inventory';
import {
  calculateLeadTimeDemand,
  calculateReorderPoint,
  calculateInventoryPosition,
  calculateTargetStock,
  calculateRecommendedOrderQuantity,
  generateRestockReason,
} from '../utils/inventoryMath';

interface SimulatorPageProps {
  initialProductId?: string;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({ initialProductId }) => {
  const { products, recommendations, settings, updateProduct } = useInventory();

  // Selected product
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || products[0]?.id || 'PRD-101'
  );

  useEffect(() => {
    if (initialProductId) {
      setSelectedProductId(initialProductId);
    }
  }, [initialProductId]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || products[0],
    [products, selectedProductId]
  );

  const baselineRecommendation = useMemo(
    () => recommendations.find((r) => r.productId === selectedProductId),
    [recommendations, selectedProductId]
  );

  // Simulator Interactive States
  const [simStock, setSimStock] = useState<number>(10);
  const [simDailyDemand, setSimDailyDemand] = useState<number>(3.0);
  const [simLeadTime, setSimLeadTime] = useState<number>(4);
  const [simSafetyStock, setSimSafetyStock] = useState<number>(5);
  const [simReviewPeriod, setSimReviewPeriod] = useState<number>(7);
  const [simIncomingStock, setSimIncomingStock] = useState<number>(0);
  const [appliedFeedback, setAppliedFeedback] = useState(false);

  // Sync with baseline product when product selection changes
  useEffect(() => {
    if (selectedProduct && baselineRecommendation) {
      setSimStock(selectedProduct.currentStock);
      setSimDailyDemand(baselineRecommendation.avgDailyDemand || 2.5);
      setSimLeadTime(selectedProduct.supplierLeadTimeDays || 3);
      setSimSafetyStock(baselineRecommendation.safetyStock || 5);
      setSimReviewPeriod(settings.reviewPeriodDays || 7);
      setSimIncomingStock(selectedProduct.incomingOrderQty || 0);
      setAppliedFeedback(false);
    }
  }, [selectedProductId, selectedProduct, baselineRecommendation, settings.reviewPeriodDays]);

  // Real inventory calculation functions executed dynamically for simulated scenario
  const simCalculations = useMemo(() => {
    const leadTimeDemand = calculateLeadTimeDemand(simDailyDemand, simLeadTime);
    const reorderPoint = calculateReorderPoint(leadTimeDemand, simSafetyStock);
    const inventoryPosition = calculateInventoryPosition(simStock, simIncomingStock, 0);
    const targetStock = calculateTargetStock(
      simDailyDemand,
      simLeadTime,
      simReviewPeriod,
      simSafetyStock
    );
    const recommendedOrderQty = calculateRecommendedOrderQuantity(targetStock, inventoryPosition);
    const unitCost = selectedProduct?.purchaseCost || 50;
    const estimatedPurchaseCost = recommendedOrderQty * unitCost;

    const daysOfCoverage =
      simDailyDemand > 0 ? Math.round(simStock / simDailyDemand) : simStock > 0 ? 999 : 0;

    let action: 'ORDER_NOW' | 'RESTOCK_SOON' | 'STOCK_SUFFICIENT' | 'EXCESS_STOCK' | 'SLOW_MOVING' =
      'STOCK_SUFFICIENT';

    if (inventoryPosition <= reorderPoint || simStock <= (selectedProduct?.minStockThreshold || 5)) {
      action = 'ORDER_NOW';
    } else if (inventoryPosition <= reorderPoint * 1.25) {
      action = 'RESTOCK_SOON';
    } else if (simDailyDemand < 0.25 && simStock > 5) {
      action = 'SLOW_MOVING';
    } else if (daysOfCoverage > 45 && simStock > targetStock * 1.5) {
      action = 'EXCESS_STOCK';
    } else {
      action = 'STOCK_SUFFICIENT';
    }

    const reason = generateRestockReason(
      action,
      selectedProduct?.name || 'Item',
      selectedProduct?.unit || 'unit',
      recommendedOrderQty,
      simStock,
      simDailyDemand,
      simLeadTime,
      leadTimeDemand,
      simSafetyStock,
      inventoryPosition,
      reorderPoint,
      simIncomingStock,
      daysOfCoverage
    );

    return {
      leadTimeDemand,
      reorderPoint,
      inventoryPosition,
      targetStock,
      recommendedOrderQty,
      estimatedPurchaseCost,
      daysOfCoverage,
      action,
      reason,
    };
  }, [
    simStock,
    simDailyDemand,
    simLeadTime,
    simSafetyStock,
    simReviewPeriod,
    simIncomingStock,
    selectedProduct,
  ]);

  // Reset to original actual values
  const handleResetToActual = () => {
    if (selectedProduct && baselineRecommendation) {
      setSimStock(selectedProduct.currentStock);
      setSimDailyDemand(baselineRecommendation.avgDailyDemand);
      setSimLeadTime(selectedProduct.supplierLeadTimeDays);
      setSimSafetyStock(baselineRecommendation.safetyStock);
      setSimReviewPeriod(settings.reviewPeriodDays);
      setSimIncomingStock(selectedProduct.incomingOrderQty);
    }
  };

  // Apply simulated values to actual product in store
  const handleApplyToProduct = () => {
    if (!selectedProduct) return;
    updateProduct(selectedProduct.id, {
      currentStock: simStock,
      supplierLeadTimeDays: simLeadTime,
      incomingOrderQty: simIncomingStock,
      safetyStockManual: simSafetyStock,
    });
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 3000);
  };

  // Dynamic simulation takeaway comparison sentence
  const simulationInsight = useMemo(() => {
    if (!baselineRecommendation || !selectedProduct) return '';

    const leadTimeDiff = simLeadTime - selectedProduct.supplierLeadTimeDays;
    const demandDiff = Number((simDailyDemand - baselineRecommendation.avgDailyDemand).toFixed(2));
    const orderQtyDiff = simCalculations.recommendedOrderQty - baselineRecommendation.recommendedOrderQty;
    const costDiff = simCalculations.estimatedPurchaseCost - baselineRecommendation.estimatedPurchaseCost;

    if (leadTimeDiff > 0) {
      return `If supplier delivery increases by ${leadTimeDiff} days (e.g. logistics or festival delay), your reorder point climbs from ${baselineRecommendation.reorderPoint} to ${simCalculations.reorderPoint} units. You would need to order ${Math.abs(orderQtyDiff)} additional units earlier to prevent stockout.`;
    }
    if (leadTimeDiff < 0) {
      return `If you switch to a faster local distributor (delivery reduced by ${Math.abs(leadTimeDiff)} days), your required reorder point drops from ${baselineRecommendation.reorderPoint} to ${simCalculations.reorderPoint} units, safely freeing up ₹${Math.abs(costDiff).toLocaleString('en-IN')} in working capital.`;
    }
    if (demandDiff > 0) {
      return `During peak demand (+${demandDiff} ${selectedProduct.unit}/day sales surge), your stock coverage shortens from ${baselineRecommendation.daysOfCoverage} to ${simCalculations.daysOfCoverage} days. Recommended order rises to ${simCalculations.recommendedOrderQty} ${selectedProduct.unit}.`;
    }
    if (simStock !== selectedProduct.currentStock) {
      return `With simulated stock of ${simStock} ${selectedProduct.unit}, inventory status switches from ${baselineRecommendation.action.replace('_', ' ')} to ${simCalculations.action.replace('_', ' ')}.`;
    }

    return `Simulated scenario matches baseline shop records. Adjust sliders on the left to test supplier delays, surge demand, or delivery optimizations.`;
  }, [
    simLeadTime,
    simDailyDemand,
    simStock,
    baselineRecommendation,
    selectedProduct,
    simCalculations,
  ]);

  if (!selectedProduct) {
    return <div className="p-8 text-center text-xs text-slate-500">No products available to simulate.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">What-If Inventory Simulator</h1>
            <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              Scenario Lab
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Test how supplier delays, customer sales surges, or buffer adjustments impact reorder points and purchase costs.
          </p>
        </div>

        {/* Product Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Select Product:</span>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-hidden focus:border-slate-400 shadow-2xs"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.currentStock} {p.unit} in stock)
              </option>
            ))}
          </select>
        </div>
      </div>

      {appliedFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-900 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Simulated parameters have been successfully saved to product profile!</span>
        </div>
      )}

      {/* Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-600" />
              <span>Simulated Scenario Inputs</span>
            </h2>
            <button
              onClick={handleResetToActual}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Actual</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Current Stock Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700">Simulated Physical Stock:</span>
                <span className="font-mono font-bold text-slate-900">
                  {simStock} {selectedProduct.unit}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(100, selectedProduct.currentStock * 2.5)}
                value={simStock}
                onChange={(e) => setSimStock(parseFloat(e.target.value))}
                className="w-full accent-slate-900"
              />
              <span className="text-[10px] text-slate-400">Actual in store: {selectedProduct.currentStock} {selectedProduct.unit}</span>
            </div>

            {/* 2. Expected Daily Demand Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700">Customer Daily Demand:</span>
                <span className="font-mono font-bold text-slate-900">
                  {simDailyDemand.toFixed(1)} {selectedProduct.unit}/day
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max={Math.max(25, (baselineRecommendation?.avgDailyDemand || 3) * 3)}
                step="0.1"
                value={simDailyDemand}
                onChange={(e) => setSimDailyDemand(parseFloat(e.target.value))}
                className="w-full accent-slate-900"
              />
              <span className="text-[10px] text-slate-400">
                Baseline historical avg: {baselineRecommendation?.avgDailyDemand || 2.5} {selectedProduct.unit}/day
              </span>
            </div>

            {/* 3. Supplier Lead Time Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700">Supplier Delivery Time:</span>
                <span className="font-mono font-bold text-slate-900">{simLeadTime} Days</span>
              </div>
              <input
                type="range"
                min="1"
                max="21"
                value={simLeadTime}
                onChange={(e) => setSimLeadTime(parseInt(e.target.value, 10))}
                className="w-full accent-slate-900"
              />
              <span className="text-[10px] text-slate-400">
                Normal wholesale delivery: {selectedProduct.supplierLeadTimeDays} days
              </span>
            </div>

            {/* 4. Safety Stock Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700">Safety Buffer Stock (SS):</span>
                <span className="font-mono font-bold text-slate-900">
                  {simSafetyStock} {selectedProduct.unit}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(30, (baselineRecommendation?.safetyStock || 5) * 2.5)}
                value={simSafetyStock}
                onChange={(e) => setSimSafetyStock(parseInt(e.target.value, 10))}
                className="w-full accent-slate-900"
              />
              <span className="text-[10px] text-slate-400">
                95% OR formula default: {baselineRecommendation?.safetyStock} {selectedProduct.unit}
              </span>
            </div>

            {/* 5. Review Period Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700">Review Period (R):</span>
                <span className="font-mono font-bold text-slate-900">{simReviewPeriod} Days</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={simReviewPeriod}
                onChange={(e) => setSimReviewPeriod(parseInt(e.target.value, 10))}
                className="w-full accent-slate-900"
              />
              <span className="text-[10px] text-slate-400">
                How often you order from this vendor
              </span>
            </div>

            {/* 6. Incoming Orders */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-700">Incoming Stock in Transit:</span>
                <span className="font-mono font-bold text-slate-900">
                  {simIncomingStock} {selectedProduct.unit}
                </span>
              </div>
              <input
                type="number"
                min="0"
                value={simIncomingStock}
                onChange={(e) => setSimIncomingStock(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleApplyToProduct}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Simulated Parameters to Product</span>
            </button>
          </div>
        </div>

        {/* Results & Side-by-Side Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Dynamic Insight Banner */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 shadow-md">
            <span className="text-[10px] font-mono text-emerald-400 block uppercase tracking-wider mb-1">
              Simulation Analysis & Takeaway
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {simulationInsight}
            </p>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight pb-2 border-b border-slate-100">
              Side-by-Side Impact: Baseline vs. Simulated Scenario
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Baseline Column */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <div className="pb-2 border-b border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Current Baseline Reality
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {baselineRecommendation?.action.replace('_', ' ')}
                  </div>
                </div>

                <div className="space-y-2 font-mono tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Current Stock:</span>
                    <span className="font-semibold text-slate-800">{selectedProduct.currentStock} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Lead Time:</span>
                    <span className="font-semibold text-slate-800">{selectedProduct.supplierLeadTimeDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Lead-Time Demand:</span>
                    <span className="font-semibold text-slate-800">{baselineRecommendation?.leadTimeDemand} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Reorder Point (ROP):</span>
                    <span className="font-semibold text-slate-800">{baselineRecommendation?.reorderPoint} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Days of Coverage:</span>
                    <span className="font-semibold text-slate-800">{baselineRecommendation?.daysOfCoverage} days</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-700 font-sans font-medium">Recommended Order:</span>
                    <span className="font-bold text-slate-900">{baselineRecommendation?.recommendedOrderQty} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700 font-sans font-medium">Estimated Cost:</span>
                    <span className="font-bold text-slate-900">₹{(baselineRecommendation?.estimatedPurchaseCost || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Simulated Column */}
              <div className="p-3.5 rounded-lg bg-emerald-50/40 border border-emerald-200 space-y-3">
                <div className="pb-2 border-b border-emerald-200">
                  <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
                    Simulated Scenario
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {simCalculations.action.replace('_', ' ')}
                  </div>
                </div>

                <div className="space-y-2 font-mono tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Simulated Stock:</span>
                    <span className="font-bold text-slate-900">{simStock} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Lead Time:</span>
                    <span className="font-bold text-slate-900">{simLeadTime} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Lead-Time Demand:</span>
                    <span className="font-bold text-slate-900">{simCalculations.leadTimeDemand} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Reorder Point (ROP):</span>
                    <span className="font-bold text-slate-900">{simCalculations.reorderPoint} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-sans">Days of Coverage:</span>
                    <span className="font-bold text-slate-900">{simCalculations.daysOfCoverage} days</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200">
                    <span className="text-emerald-950 font-sans font-semibold">Recommended Order:</span>
                    <span className="font-bold text-emerald-900 text-sm">{simCalculations.recommendedOrderQty} {selectedProduct.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-950 font-sans font-semibold">Estimated Cost:</span>
                    <span className="font-bold text-emerald-900 text-sm">₹{simCalculations.estimatedPurchaseCost.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Operations Reasoning */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
              <span className="font-semibold text-slate-900 block mb-0.5">Simulated Purchasing Logic:</span>
              <p className="leading-relaxed">{simCalculations.reason}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
