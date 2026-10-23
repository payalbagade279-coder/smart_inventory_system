import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Download,
  SlidersHorizontal,
  Info,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  Truck,
  IndianRupee,
  Calendar,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { RestockAction, RestockRecommendation } from '../types/inventory';
import { NavTab } from './Navbar';

interface RestockingAssistantPageProps {
  onQuickRestock: (productId: string) => void;
  onSimulateProduct: (productId: string) => void;
  setActiveTab: (tab: NavTab) => void;
}

export const RestockingAssistantPage: React.FC<RestockingAssistantPageProps> = ({
  onQuickRestock,
  onSimulateProduct,
  setActiveTab,
}) => {
  const {
    recommendations,
    settings,
    updateSettings,
    exportRestockSheetCSV,
    updateProduct,
    products,
  } = useInventory();

  // Filters
  const [selectedActionFilter, setSelectedActionFilter] = useState<'ALL' | RestockAction>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormulaGuide, setShowFormulaGuide] = useState(false);
  const [placedOrderFeedback, setPlacedOrderFeedback] = useState<string | null>(null);

  // Filtered recommendations
  const filteredList = useMemo(() => {
    return recommendations.filter((r) => {
      const matchAction = selectedActionFilter === 'ALL' || r.action === selectedActionFilter;
      const matchSearch =
        r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchAction && matchSearch;
    });
  }, [recommendations, selectedActionFilter, searchTerm]);

  // Aggregate stats
  const totalRestockCost = useMemo(() => {
    return recommendations
      .filter((r) => r.action === 'ORDER_NOW' || r.action === 'RESTOCK_SOON')
      .reduce((sum, r) => sum + r.estimatedPurchaseCost, 0);
  }, [recommendations]);

  const itemsToOrderCount = useMemo(() => {
    return recommendations.filter((r) => r.action === 'ORDER_NOW').length;
  }, [recommendations]);

  // Mark an order as placed (updates incoming order quantity)
  const handleMarkOrdered = (productId: string, orderQty: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    updateProduct(productId, {
      incomingOrderQty: prod.incomingOrderQty + orderQty,
    });
    setPlacedOrderFeedback(`Marked ${orderQty} ${prod.unit} of ${prod.name} as in-transit from ${prod.supplierName}.`);
    setTimeout(() => setPlacedOrderFeedback(null), 3500);
  };

  const getActionBadge = (action: RestockAction) => {
    switch (action) {
      case 'ORDER_NOW':
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded">
            Order Now
          </span>
        );
      case 'RESTOCK_SOON':
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded">
            Restock Soon
          </span>
        );
      case 'EXPIRY_RISK':
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded">
            Expiry Risk
          </span>
        );
      case 'SLOW_MOVING':
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            Slow Mover
          </span>
        );
      case 'EXCESS_STOCK':
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded">
            Excess Stock
          </span>
        );
      case 'STOCK_SUFFICIENT':
      default:
        return (
          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
            Sufficient
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Smart Restocking Assistant</h1>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Deterministic Logic
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculates exact reorder points, buffer stock, and recommended quantities based on supplier delivery days and customer demand.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFormulaGuide(!showFormulaGuide)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Formula Guide</span>
            {showFormulaGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={exportRestockSheetCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Order Sheet</span>
          </button>
        </div>
      </div>

      {placedOrderFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-900 flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{placedOrderFeedback}</span>
        </div>
      )}

      {/* Formula & Inventory Operations Guide Drawer */}
      {showFormulaGuide && (
        <div className="p-5 bg-slate-900 text-slate-100 rounded-xl shadow-md border border-slate-800 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Deterministic Inventory Control & Operations Research Model
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Transparent equations utilized in Smart Dukaan without opaque or fabricated black-box outputs.
              </p>
            </div>
            <button
              onClick={() => setShowFormulaGuide(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="font-semibold text-emerald-400 block mb-1">1. Average Daily Demand ($d$)</span>
              <p className="text-slate-300 font-mono text-[11px]">d = Units Sold in 30 Days / 30 Days</p>
              <p className="text-slate-400 mt-1 text-[11px]">Real customer sales rate per calendar day.</p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="font-semibold text-emerald-400 block mb-1">2. Lead-Time Demand ($LTD$)</span>
              <p className="text-slate-300 font-mono text-[11px]">LTD = d × Supplier Delivery Days (L)</p>
              <p className="text-slate-400 mt-1 text-[11px]">Expected sales while waiting for stock to arrive.</p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="font-semibold text-emerald-400 block mb-1">3. Safety Stock ($SS$)</span>
              <p className="text-slate-300 font-mono text-[11px]">SS = Z × √(L) × σ_d</p>
              <p className="text-slate-400 mt-1 text-[11px]">Z = 1.65 (95% service level buffer against unexpected weekend spikes).</p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="font-semibold text-emerald-400 block mb-1">4. Reorder Point ($ROP$)</span>
              <p className="text-slate-300 font-mono text-[11px]">ROP = LTD + SS</p>
              <p className="text-slate-400 mt-1 text-[11px]">When stock hits this number, order must be placed immediately.</p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="font-semibold text-emerald-400 block mb-1">5. Inventory Position ($IP$)</span>
              <p className="text-slate-300 font-mono text-[11px]">IP = On Hand + In Transit - Backorders</p>
              <p className="text-slate-400 mt-1 text-[11px]">Accounts for trucks already on the road from distributors.</p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
              <span className="font-semibold text-emerald-400 block mb-1">6. Recommended Order Qty ($Q$)</span>
              <p className="text-slate-300 font-mono text-[11px]">Q = max(0, Target Stock - IP)</p>
              <p className="text-slate-400 mt-1 text-[11px]">Target Stock = LTD + (d × Review Period) + SS.</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Controls: Policy Settings & Summary Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Configurable Policy */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="font-medium text-slate-700">Review Period (R):</span>
            <select
              value={settings.reviewPeriodDays}
              onChange={(e) => updateSettings({ reviewPeriodDays: parseInt(e.target.value, 10) })}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-900"
            >
              <option value={3}>3 Days (Twice Weekly)</option>
              <option value={7}>7 Days (Weekly Review)</option>
              <option value={14}>14 Days (Bi-weekly)</option>
              <option value={30}>30 Days (Monthly)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">Service Level (Z):</span>
            <select
              value={settings.serviceLevelZ}
              onChange={(e) => updateSettings({ serviceLevelZ: parseFloat(e.target.value) })}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-900"
            >
              <option value={1.28}>90% (Z = 1.28, Lean)</option>
              <option value={1.65}>95% (Z = 1.65, Standard)</option>
              <option value={2.05}>98% (Z = 2.05, High Protection)</option>
            </select>
          </div>
        </div>

        {/* Right: Order Summary Banner */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] font-sans">Needs Immediate Order</span>
            <span className="text-base font-bold text-rose-600">{itemsToOrderCount} items</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-right">
            <span className="text-slate-500 block text-[10px] font-sans">Est. Purchase Outlay</span>
            <span className="text-base font-bold text-slate-900">₹{totalRestockCost.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Segmented Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {(
            [
              { id: 'ALL', label: 'All Items' },
              { id: 'ORDER_NOW', label: 'Order Now' },
              { id: 'RESTOCK_SOON', label: 'Restock Soon' },
              { id: 'EXPIRY_RISK', label: 'Expiry Risk' },
              { id: 'EXCESS_STOCK', label: 'Excess' },
              { id: 'SLOW_MOVING', label: 'Slow Movers' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedActionFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedActionFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 w-full sm:w-60"
        />
      </div>

      {/* Main Restocking Recommendation Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Product & Category</th>
                <th className="px-3 py-3">Action Status</th>
                <th className="px-3 py-3 text-right">Current Stock</th>
                <th className="px-3 py-3 text-right">Daily Demand</th>
                <th className="px-3 py-3 text-right">Lead Time</th>
                <th className="px-3 py-3 text-right">Reorder Point</th>
                <th className="px-3 py-3 text-right">Order Qty</th>
                <th className="px-3 py-3 text-right">Purchase Cost</th>
                <th className="px-4 py-3">Operations Reason</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredList.map((r) => {
                const isOrderUrgent = r.action === 'ORDER_NOW';
                return (
                  <tr
                    key={r.productId}
                    className={`transition-colors ${
                      isOrderUrgent ? 'bg-rose-50/25 hover:bg-rose-50/50' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{r.productName}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {r.productId} · {r.category}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-3 py-3 whitespace-nowrap">{getActionBadge(r.action)}</td>

                    {/* Stock */}
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      <span className="font-bold text-slate-900">{r.currentStock}</span>{' '}
                      <span className="text-[11px] text-slate-500 font-sans">{r.unit}</span>
                      {r.incomingStock > 0 && (
                        <span className="text-[10px] text-emerald-600 block">
                          +{r.incomingStock} in transit
                        </span>
                      )}
                    </td>

                    {/* Daily Demand */}
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      <span className="text-slate-800">{r.avgDailyDemand}</span>{' '}
                      <span className="text-[10px] text-slate-400 font-sans">/day</span>
                    </td>

                    {/* Lead Time */}
                    <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-700">
                      {r.leadTimeDays}d
                    </td>

                    {/* Reorder Point */}
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      <span className="font-semibold text-slate-900">{r.reorderPoint}</span>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        Buffer: {r.safetyStock}
                      </span>
                    </td>

                    {/* Order Qty */}
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      {r.recommendedOrderQty > 0 ? (
                        <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                          {r.recommendedOrderQty} {r.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </td>

                    {/* Purchase Cost */}
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      {r.estimatedPurchaseCost > 0 ? (
                        <span className="font-semibold text-slate-900">
                          ₹{r.estimatedPurchaseCost.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Operations Reason */}
                    <td className="px-4 py-3 max-w-xs lg:max-w-md">
                      <p className="text-[11px] text-slate-600 leading-snug line-clamp-2" title={r.reason}>
                        {r.reason}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.recommendedOrderQty > 0 && (
                          <button
                            onClick={() => handleMarkOrdered(r.productId, r.recommendedOrderQty)}
                            title="Mark order as placed with distributor"
                            className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                          >
                            Order
                          </button>
                        )}

                        <button
                          onClick={() => onQuickRestock(r.productId)}
                          title="Record inventory arrival immediately"
                          className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        >
                          Receive
                        </button>

                        <button
                          onClick={() => onSimulateProduct(r.productId)}
                          title="Simulate what-if changes"
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-slate-500">
                    No products matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
