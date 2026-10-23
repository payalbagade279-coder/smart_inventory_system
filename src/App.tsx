import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Navbar, NavTab } from './components/Navbar';
import { OverviewPage } from './components/OverviewPage';
import { ProductManagementPage } from './components/ProductManagementPage';
import { RestockingAssistantPage } from './components/RestockingAssistantPage';
import { SalesAnalysisPage } from './components/SalesAnalysisPage';
import { OverstockExpiryPage } from './components/OverstockExpiryPage';
import { SimulatorPage } from './components/SimulatorPage';
import { ActionModals } from './components/ActionModals';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  // Modal states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false);
  const [activeSaleProductId, setActiveSaleProductId] = useState<string | undefined>(undefined);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [activeRestockProductId, setActiveRestockProductId] = useState<string | undefined>(undefined);

  // Simulator target
  const [simulatorProductId, setSimulatorProductId] = useState<string | undefined>(undefined);

  const handleOpenSaleModal = (productId?: string) => {
    setActiveSaleProductId(productId);
    setIsRecordSaleOpen(true);
  };

  const handleOpenRestockModal = (productId?: string) => {
    setActiveRestockProductId(productId);
    setIsRestockOpen(true);
  };

  const handleSimulateProduct = (productId: string) => {
    setSimulatorProductId(productId);
    setActiveTab('simulator');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      {/* Strict 3-zone Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRecordSale={() => handleOpenSaleModal()}
        onOpenAddProduct={() => setIsAddProductOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewPage
            setActiveTab={setActiveTab}
            onQuickRestock={handleOpenRestockModal}
            onQuickSale={handleOpenSaleModal}
            onSimulateProduct={handleSimulateProduct}
          />
        )}

        {activeTab === 'products' && (
          <ProductManagementPage
            onOpenAddModal={() => setIsAddProductOpen(true)}
            onOpenSaleModal={handleOpenSaleModal}
            onOpenRestockModal={handleOpenRestockModal}
          />
        )}

        {activeTab === 'restock' && (
          <RestockingAssistantPage
            onQuickRestock={handleOpenRestockModal}
            onSimulateProduct={handleSimulateProduct}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'sales' && <SalesAnalysisPage />}

        {activeTab === 'overstock' && (
          <OverstockExpiryPage
            onSimulateProduct={handleSimulateProduct}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'simulator' && (
          <SimulatorPage initialProductId={simulatorProductId} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Smart Dukaan</span>
            <span aria-hidden="true">·</span>
            <span>AI-Powered Inventory & Restocking Assistant</span>
            <span aria-hidden="true">·</span>
            <span>Built for Indian Retailers & Kirana Stores</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Deterministic OR Engine & Demand Forecasting
          </div>
        </div>
      </footer>

      {/* Action Modals */}
      <ActionModals
        isAddProductOpen={isAddProductOpen}
        onCloseAddProduct={() => setIsAddProductOpen(false)}
        isRecordSaleOpen={isRecordSaleOpen}
        onCloseRecordSale={() => {
          setIsRecordSaleOpen(false);
          setActiveSaleProductId(undefined);
        }}
        initialSaleProductId={activeSaleProductId}
        isRestockOpen={isRestockOpen}
        onCloseRestock={() => {
          setIsRestockOpen(false);
          setActiveRestockProductId(undefined);
        }}
        initialRestockProductId={activeRestockProductId}
      />
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainLayout />
    </InventoryProvider>
  );
}
