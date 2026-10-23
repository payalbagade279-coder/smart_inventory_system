import React, { useMemo } from 'react';
import {
  Package,
  Boxes,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldAlert,
  Archive,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useInventory } from '../context/InventoryContext';
import { NavTab } from './Navbar';

interface OverviewPageProps {
  setActiveTab: (tab: NavTab) => void;
  onQuickRestock: (productId: string) => void;
  onQuickSale: (productId: string) => void;
  onSimulateProduct: (productId: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  setActiveTab,
  onQuickRestock,
  onQuickSale,
  onSimulateProduct,
}) => {
  const { products, sales, recommendations, settings } = useInventory();

  // Summary Metrics
  const totalProducts = products.length;
  const totalUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + p.currentStock * p.purchaseCost, 0);

  const orderNowCount = recommendations.filter((r) => r.action === 'ORDER_NOW').length;
  const restockSoonCount = recommendations.filter((r) => r.action === 'RESTOCK_SOON').length;
  const excessStockCount = recommendations.filter((r) => r.action === 'EXCESS_STOCK').length;
  const slowMovingCount = recommendations.filter((r) => r.action === 'SLOW_MOVING').length;
  const expiryRiskCount = recommendations.filter((r) => r.action === 'EXPIRY_RISK').length;

  // Fast sellers: avgDailyDemand >= 3.0
  const fastSellers = recommendations.filter((r) => r.avgDailyDemand >= 3.0);

  // Daily sales chart data for last 30 days
  const chartData = useMemo(() => {
    const dailyMap: Record<string, { units: number; revenue: number }> = {};
    const refDate = new Date('2026-10-23');

    // Fill last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(refDate);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      dailyMap[dateKey] = { units: 0, revenue: 0 };
    }

    sales.forEach((s) => {
      if (dailyMap[s.date]) {
        dailyMap[s.date].units += s.quantity;
        dailyMap[s.date].revenue += s.totalAmount;
      }
    });

    return Object.entries(dailyMap).map(([date, data]) => ({
      date: date.slice(5), // MM-DD
      revenue: data.revenue,
      units: data.units,
    }));
  }, [sales]);

  // "What Needs Your Attention Today?" prioritized alerts
  const priorityAlerts = useMemo(() => {
    const list: Array<{
      id: string;
      productId: string;
      title: string;
      description: string;
      badge: string;
      level: 'critical' | 'warning' | 'info';
      actionLabel: string;
      onAction: () => void;
    }> = [];

    // 1. Expiry alerts
    recommendations
      .filter((r) => r.action === 'EXPIRY_RISK' && r.expiryRisk?.isRisk)
      .forEach((r) => {
        list.push({
          id: `exp-${r.productId}`,
          productId: r.productId,
          title: `${r.productName}: Approaching Expiry (${r.expiryRisk?.daysRemaining} days remaining)`,
          description: `You have ${r.currentStock} ${r.unit} in stock. At your current rate of ${r.avgDailyDemand} ${r.unit}/day, ~${r.expiryRisk?.unitsAtRisk} ${r.unit} will spoil before selling, risking ₹${r.expiryRisk?.potentialLoss.toLocaleString('en-IN')}.`,
          badge: 'Expiry Warning',
          level: 'critical',
          actionLabel: 'Review Expiry',
          onAction: () => setActiveTab('overstock'),
        });
      });

    // 2. Critical Order Now items
    recommendations
      .filter((r) => r.action === 'ORDER_NOW')
      .slice(0, 3)
      .forEach((r) => {
        list.push({
          id: `ord-${r.productId}`,
          productId: r.productId,
          title: `${r.productName}: Stock is critically low (${r.currentStock} ${r.unit} left)`,
          description: `Supplier takes ${r.leadTimeDays} days. Recommended purchase: ${r.recommendedOrderQty} ${r.unit} (Est. cost: ₹${r.estimatedPurchaseCost.toLocaleString('en-IN')}).`,
          badge: 'Order Now',
          level: r.currentStock <= 5 ? 'critical' : 'warning',
          actionLabel: 'Restock',
          onAction: () => onQuickRestock(r.productId),
        });
      });

    // 3. Fast-moving surge items
    fastSellers.slice(0, 2).forEach((r) => {
      list.push({
        id: `fast-${r.productId}`,
        productId: r.productId,
        title: `${r.productName}: High customer demand (${r.avgDailyDemand} ${r.unit}/day)`,
        description: `Current stock covers approximately ${r.daysOfCoverage} days. Monitor closely so you do not run out before supplier restocks.`,
        badge: 'Fast Mover',
        level: 'info',
        actionLabel: 'Simulate',
        onAction: () => onSimulateProduct(r.productId),
      });
    });

    // 4. Dead capital / Overstock item
    const highestExcess = recommendations
      .filter((r) => r.action === 'EXCESS_STOCK' || r.action === 'SLOW_MOVING')
      .sort((a, b) => b.currentStock * b.purchaseCost - a.currentStock * a.purchaseCost)[0];

    if (highestExcess) {
      const tiedUp = highestExcess.currentStock * highestExcess.purchaseCost;
      list.push({
        id: `slow-${highestExcess.productId}`,
        productId: highestExcess.productId,
        title: `${highestExcess.productName}: ₹${tiedUp.toLocaleString('en-IN')} locked up in slow inventory`,
        description: `Holding ${highestExcess.currentStock} ${highestExcess.unit} (~${highestExcess.daysOfCoverage} days supply). Avoid reordering and consider promotional discounts.`,
        badge: 'Slow Moving',
        level: 'info',
        actionLabel: 'Audit Overstock',
        onAction: () => setActiveTab('overstock'),
      });
    }

    return list;
  }, [recommendations, fastSellers, onQuickRestock, onSimulateProduct, setActiveTab]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Shop Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time snapshot of {settings.shopName} inventory health, demand velocity, and working capital.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('restock')}
            className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <span>Open Restock Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Products</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalProducts}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalUnits.toLocaleString()} units in store
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Inventory Value</span>
            <IndianRupee className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            ₹{totalInventoryValue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Based on purchase cost
          </div>
        </div>

        <div
          onClick={() => setActiveTab('restock')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Restock Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-600">
              {orderNowCount}
            </div>
            {restockSoonCount > 0 && (
              <span className="text-xs font-mono text-amber-600">
                +{restockSoonCount} soon
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 text-slate-600">
            <span>Needs immediate order</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab('overstock')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Overstock / Expiry</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {excessStockCount + slowMovingCount}
            </div>
            {expiryRiskCount > 0 && (
              <span className="text-xs font-mono text-rose-600 font-semibold">
                {expiryRiskCount} expiry risk
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Slow movers & tied capital
          </div>
        </div>
      </div>

      {/* Two Column Layout: Attention Today + Sales Velocity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Prioritized Attention List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>What Needs Your Attention Today?</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Prioritized operational items calculated from sales rates, lead times, and expiry.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {priorityAlerts.length} Active Items
            </span>
          </div>

          <div className="space-y-3">
            {priorityAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        alert.level === 'critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : alert.level === 'warning'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {alert.badge}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {alert.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {alert.description}
                  </p>
                </div>

                <button
                  onClick={alert.onAction}
                  className="self-start sm:self-center px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs"
                >
                  {alert.actionLabel}
                </button>
              </div>
            ))}

            {priorityAlerts.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500">
                All inventory levels and expiry dates are currently healthy!
              </div>
            )}
          </div>
        </div>

        {/* 30-Day Sales Trend Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  30-Day Sales Trend
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily revenue trajectory across all product categories.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('sales')}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
              >
                <span>Full Analysis</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '11px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0f172a"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Top Selling Category</span>
              <span className="font-semibold text-slate-800">Snacks & Biscuits</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Weekend Lift</span>
              <span className="font-semibold text-emerald-600">+34% vs Weekday</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
