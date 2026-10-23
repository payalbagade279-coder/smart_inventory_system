import React, { useState } from 'react';
import { Store, PlusCircle, RefreshCw, Download, Database, Menu, X } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export type NavTab = 'overview' | 'products' | 'restock' | 'sales' | 'overstock' | 'simulator';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenRecordSale: () => void;
  onOpenAddProduct: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenRecordSale,
  onOpenAddProduct,
}) => {
  const { settings, isDemoData, resetToDemoData, exportBackupJSON } = useInventory();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const navItems: { id: NavTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products & Stock' },
    { id: 'restock', label: 'Smart Restocker' },
    { id: 'sales', label: 'Sales & Demand' },
    { id: 'overstock', label: 'Overstock & Expiry' },
    { id: 'simulator', label: 'What-If Simulator' },
  ];

  const handleReset = () => {
    resetToDemoData();
    setShowResetConfirm(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-8">
            {/* Zone 1: Brand Wordmark */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
                <Store className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                  Smart Dukaan
                </span>
                <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap leading-none hidden sm:inline">
                  {settings.shopName}
                </span>
              </div>
            </div>

            {/* Zone 2: Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {isDemoData && (
                <span className="hidden xl:inline text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
                  Demo Dataset (90d)
                </span>
              )}

              <button
                onClick={() => setShowResetConfirm(true)}
                title="Reset to 20 Indian retail demo items"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset Demo</span>
              </button>

              <button
                onClick={exportBackupJSON}
                title="Export complete store backup as JSON"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Backup</span>
              </button>

              <button
                onClick={onOpenRecordSale}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Record Sale</span>
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                  activeTab === item.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => {
                  onOpenAddProduct();
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-medium"
              >
                + Add Product
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(true);
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
              >
                Reset Demo
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Reset Demo Data?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will restore the 20 Indian retail demo products (Basmati Rice, Atta, Oils, Spices, Parle-G, Amul Milk) and 90 days of synthetic sales patterns. Any unsaved custom products will be replaced.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
