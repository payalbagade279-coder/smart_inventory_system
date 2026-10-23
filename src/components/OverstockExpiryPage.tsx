import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Calendar,
  IndianRupee,
  AlertTriangle,
  ArrowDownRight,
  Tag,
  Package,
  TrendingDown,
  Info,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { RestockRecommendation } from '../types/inventory';
import { NavTab } from './Navbar';

interface OverstockExpiryPageProps {
  onSimulateProduct: (productId: string) => void;
  setActiveTab: (tab: NavTab) => void;
}

export const OverstockExpiryPage: React.FC<OverstockExpiryPageProps> = ({
  onSimulateProduct,
  setActiveTab,
}) => {
  const { recommendations, settings, products } = useInventory();

  // Tab switch between Overstock & Expiry Risk
  const [activeSubTab, setActiveSubTab] = useState<'overstock' | 'expiry'>('overstock');

  // Filter Overstocked Products
  // Accounts for lead time, review period, and safety stock (Target Stock)
  const overstockedList = useMemo(() => {
    return recommendations
      .filter((r) => {
        const hasExcess = r.currentStock > r.targetStock && r.currentStock > 10;
        const highCoverage = r.daysOfCoverage > settings.excessStockDaysThreshold;
        const slowVelocity = r.avgDailyDemand < 0.5 && r.currentStock > 10;
        return hasExcess || highCoverage || slowVelocity;
      })
      .map((r) => {
        const excessQty = Math.max(0, r.currentStock - r.targetStock);
        const tiedUpCapital = excessQty * r.purchaseCost;
        return {
          ...r,
          excessQty,
          tiedUpCapital,
        };
      })
      .sort((a, b) => b.tiedUpCapital - a.tiedUpCapital);
  }, [recommendations, settings]);

  // Filter Expiry Risk Products
  const expiryRiskList = useMemo(() => {
    return recommendations
      .filter((r) => r.expiryRisk !== undefined)
      .map((r) => {
        const prod = products.find((p) => p.id === r.productId);
        return {
          ...r,
          productNotes: prod?.notes,
        };
      })
      .sort((a, b) => (a.expiryRisk?.daysRemaining || 0) - (b.expiryRisk?.daysRemaining || 0));
  }, [recommendations, products]);

  // Aggregate stats
  const totalTiedUpCapital = useMemo(() => {
    return overstockedList.reduce((sum, item) => sum + item.tiedUpCapital, 0);
  }, [overstockedList]);

  const totalExpiryPotentialLoss = useMemo(() => {
    return expiryRiskList.reduce(
      (sum, item) => sum + (item.expiryRisk?.isRisk ? item.expiryRisk.potentialLoss : 0),
      0
    );
  }, [expiryRiskList]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Overstock & Expiry Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify stagnant inventory locking up working capital and track perishable items before they reach expiration.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveSubTab('overstock')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'overstock'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Excess & Dead Stock ({overstockedList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('expiry')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeSubTab === 'expiry'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Perishables & Expiry Watch ({expiryRiskList.length})
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">
            Dead Working Capital Locked
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            ₹{totalTiedUpCapital.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Tied up in excess stock above target buffer
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">
            Potential Loss from Expiry
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600">
            ₹{totalExpiryPotentialLoss.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Units projected to spoil before selling
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">
            Inventory Policy Threshold
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            &gt; {settings.excessStockDaysThreshold} Days
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Coverage beyond delivery + review buffer
          </div>
        </div>
      </div>

      {/* View 1: Overstocked & Stagnant Stock */}
      {activeSubTab === 'overstock' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-3 py-3 text-right">Current Stock</th>
                    <th className="px-3 py-3 text-right">Target Buffer</th>
                    <th className="px-3 py-3 text-right">Days of Coverage</th>
                    <th className="px-3 py-3 text-right">Sales Velocity</th>
                    <th className="px-3 py-3 text-right">Excess Units</th>
                    <th className="px-3 py-3 text-right">Capital Tied Up</th>
                    <th className="px-4 py-3">Recommended Retail Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {overstockedList.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.productName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.productId} · {item.category}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-900 font-bold">
                        {item.currentStock} {item.unit}
                      </td>

                      {/* Target Buffer */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-600">
                        {item.targetStock} {item.unit}
                      </td>

                      {/* Days of Coverage */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums">
                        <span
                          className={`font-semibold ${
                            item.daysOfCoverage > 100
                              ? 'text-rose-600'
                              : item.daysOfCoverage > 45
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {item.daysOfCoverage > 365 ? '>1 year' : `${item.daysOfCoverage} days`}
                        </span>
                      </td>

                      {/* Velocity */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-700">
                        {item.avgDailyDemand} {item.unit}/d
                      </td>

                      {/* Excess units */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-amber-700 font-semibold">
                        +{item.excessQty} {item.unit}
                      </td>

                      {/* Capital Tied Up */}
                      <td className="px-3 py-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        ₹{item.tiedUpCapital.toLocaleString('en-IN')}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-[11px] text-slate-700 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            {item.daysOfCoverage > 150
                              ? 'Offer 15-20% bundle discount with fast-moving item.'
                              : 'Pause future purchase orders until stock reduces.'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {overstockedList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-slate-500">
                        No excess or overstocked products detected. Inventory is lean!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Expiry Risk Monitoring */}
      {activeSubTab === 'expiry' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-3 py-3">Expiry Date</th>
                    <th className="px-3 py-3 text-right">Days Remaining</th>
                    <th className="px-3 py-3 text-right">Current Stock</th>
                    <th className="px-3 py-3 text-right">Daily Demand</th>
                    <th className="px-3 py-3 text-right">Days Needed to Sell</th>
                    <th className="px-3 py-3 text-right">Units at Risk</th>
                    <th className="px-3 py-3 text-right">Potential Loss</th>
                    <th className="px-4 py-3">Action Urgency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {expiryRiskList.map((item) => {
                    const exp = item.expiryRisk;
                    if (!exp) return null;
                    const isSpolageRisk = exp.isRisk;

                    return (
                      <tr
                        key={item.productId}
                        className={`transition-colors ${
                          isSpolageRisk ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{item.productName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {item.productId} · {item.category}
                          </div>
                        </td>

                        {/* Expiry Date */}
                        <td className="px-3 py-3 font-mono font-semibold text-slate-800">
                          {exp.expiryDate}
                        </td>

                        {/* Days Remaining */}
                        <td className="px-3 py-3 text-right font-mono tabular-nums">
                          <span
                            className={`font-bold ${
                              exp.daysRemaining <= 15
                                ? 'text-rose-600'
                                : exp.daysRemaining <= 45
                                ? 'text-amber-600'
                                : 'text-slate-700'
                            }`}
                          >
                            {exp.daysRemaining} days
                          </span>
                        </td>

                        {/* Current Stock */}
                        <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-900 font-semibold">
                          {item.currentStock} {item.unit}
                        </td>

                        {/* Daily Demand */}
                        <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-700">
                          {item.avgDailyDemand} {item.unit}/d
                        </td>

                        {/* Days Needed to Sell */}
                        <td className="px-3 py-3 text-right font-mono tabular-nums">
                          <span
                            className={
                              exp.estimatedDaysToSell > exp.daysRemaining
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-600'
                            }
                          >
                            {exp.estimatedDaysToSell} days
                          </span>
                        </td>

                        {/* Units at Risk */}
                        <td className="px-3 py-3 text-right font-mono tabular-nums font-bold">
                          {exp.unitsAtRisk > 0 ? (
                            <span className="text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                              {exp.unitsAtRisk} {item.unit}
                            </span>
                          ) : (
                            <span className="text-emerald-600">0</span>
                          )}
                        </td>

                        {/* Potential Loss */}
                        <td className="px-3 py-3 text-right font-mono tabular-nums font-bold">
                          {exp.potentialLoss > 0 ? (
                            <span className="text-rose-600">
                              ₹{exp.potentialLoss.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-slate-400">₹0</span>
                          )}
                        </td>

                        {/* Urgency */}
                        <td className="px-4 py-3">
                          {isSpolageRisk ? (
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Urgent: Will expire before sellout. Discount now!</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-medium">
                              Safe: Normal velocity will sell out prior to expiry.
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {expiryRiskList.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs text-slate-500">
                        No products currently have an expiry date configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
