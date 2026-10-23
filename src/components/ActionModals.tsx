import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Modal } from './Modal';
import { UnitType, Product } from '../types/inventory';
import { ShoppingCart, PackagePlus, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

interface ActionModalsProps {
  // Add Product Modal
  isAddProductOpen: boolean;
  onCloseAddProduct: () => void;

  // Record Sale Modal
  isRecordSaleOpen: boolean;
  onCloseRecordSale: () => void;
  initialSaleProductId?: string;

  // Receive Restock Modal
  isRestockOpen: boolean;
  onCloseRestock: () => void;
  initialRestockProductId?: string;
}

export const ActionModals: React.FC<ActionModalsProps> = ({
  isAddProductOpen,
  onCloseAddProduct,
  isRecordSaleOpen,
  onCloseRecordSale,
  initialSaleProductId,
  isRestockOpen,
  onCloseRestock,
  initialRestockProductId,
}) => {
  const { products, addProduct, recordSale, receiveRestock } = useInventory();

  // Record Sale Form State
  const [saleProductId, setSaleProductId] = useState<string>(
    initialSaleProductId || products[0]?.id || ''
  );
  const [saleQty, setSaleQty] = useState<number>(1);
  const [saleFeedback, setSaleFeedback] = useState<{ success: boolean; message: string } | null>(
    null
  );

  // Sync saleProductId when initialSaleProductId changes
  React.useEffect(() => {
    if (initialSaleProductId) {
      setSaleProductId(initialSaleProductId);
    }
  }, [initialSaleProductId]);

  // Receive Restock Form State
  const [restockProductId, setRestockProductId] = useState<string>(
    initialRestockProductId || products[0]?.id || ''
  );
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockFeedback, setRestockFeedback] = useState<string | null>(null);

  // Sync restockProductId when initialRestockProductId changes
  React.useEffect(() => {
    if (initialRestockProductId) {
      setRestockProductId(initialRestockProductId);
    }
  }, [initialRestockProductId]);

  // Selected Product for Sale
  const activeSaleProduct = products.find((p) => p.id === (saleProductId || products[0]?.id));
  const activeRestockProduct = products.find(
    (p) => p.id === (restockProductId || products[0]?.id)
  );

  // Submit Sale Handler
  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSaleProduct) return;
    const res = recordSale(activeSaleProduct.id, saleQty);
    setSaleFeedback(res);
    if (res.success) {
      setTimeout(() => {
        setSaleFeedback(null);
        setSaleQty(1);
        onCloseRecordSale();
      }, 1200);
    }
  };

  // Submit Restock Handler
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRestockProduct) return;
    receiveRestock(activeRestockProduct.id, restockQty);
    setRestockFeedback(`Added +${restockQty} ${activeRestockProduct.unit} to ${activeRestockProduct.name}.`);
    setTimeout(() => {
      setRestockFeedback(null);
      setRestockQty(10);
      onCloseRestock();
    }, 1200);
  };

  // Submit Add Product Handler
  const handleAddProductSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const currentStock = parseFloat(formData.get('currentStock') as string) || 0;
    const unit = formData.get('unit') as UnitType;
    const sellingPrice = parseFloat(formData.get('sellingPrice') as string) || 0;
    const purchaseCost = parseFloat(formData.get('purchaseCost') as string) || 0;
    const minStockThreshold = parseFloat(formData.get('minStockThreshold') as string) || 5;
    const supplierName = (formData.get('supplierName') as string) || 'Local Distributor';
    const supplierLeadTimeDays = parseInt(formData.get('supplierLeadTimeDays') as string, 10) || 3;
    const incomingOrderQty = parseFloat(formData.get('incomingOrderQty') as string) || 0;
    const expiryDate = (formData.get('expiryDate') as string) || undefined;
    const notes = (formData.get('notes') as string) || undefined;

    addProduct({
      name,
      category,
      currentStock,
      unit,
      sellingPrice,
      purchaseCost,
      minStockThreshold,
      supplierName,
      supplierLeadTimeDays,
      incomingOrderQty,
      backorderQty: 0,
      expiryDate,
      notes,
    });

    onCloseAddProduct();
  };

  return (
    <>
      {/* 1. Add Product Modal */}
      <Modal
        isOpen={isAddProductOpen}
        onClose={onCloseAddProduct}
        title="Add New Inventory Product"
        description="Enter product master details, supplier lead time, and initial stock level."
        maxWidth="2xl"
      >
        <form onSubmit={handleAddProductSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Fortune Mustard Oil (1L)"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category *
              </label>
              <input
                type="text"
                name="category"
                required
                placeholder="e.g. Oils & Ghee, Staples, Snacks"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Initial Stock Count *
              </label>
              <input
                type="number"
                name="currentStock"
                required
                min="0"
                step="any"
                defaultValue={10}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Unit of Measurement *
              </label>
              <select
                name="unit"
                defaultValue="packet"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              >
                <option value="kg">kg (Kilogram)</option>
                <option value="packet">packet</option>
                <option value="piece">piece</option>
                <option value="litre">litre</option>
                <option value="box">box</option>
                <option value="bottle">bottle</option>
                <option value="gram">gram</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                name="sellingPrice"
                required
                min="0"
                step="any"
                defaultValue={100}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Purchase Cost (₹) *
              </label>
              <input
                type="number"
                name="purchaseCost"
                required
                min="0"
                step="any"
                defaultValue={80}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Minimum Stock Threshold *
              </label>
              <input
                type="number"
                name="minStockThreshold"
                required
                min="1"
                defaultValue={10}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Supplier Delivery Time (Days) *
              </label>
              <input
                type="number"
                name="supplierLeadTimeDays"
                required
                min="1"
                defaultValue={3}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Supplier / Wholesaler Name
              </label>
              <input
                type="text"
                name="supplierName"
                placeholder="e.g. City Wholesale Mandi"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                name="expiryDate"
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCloseAddProduct}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Record Quick Sale Modal */}
      <Modal
        isOpen={isRecordSaleOpen}
        onClose={onCloseRecordSale}
        title="Record Customer Sale (POS)"
        description="Log sales to update physical stock immediately and update daily demand velocity."
        maxWidth="md"
      >
        <form onSubmit={handleSaleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Product
            </label>
            <select
              value={saleProductId}
              onChange={(e) => setSaleProductId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.currentStock} {p.unit} in stock - ₹{p.sellingPrice})
                </option>
              ))}
            </select>
          </div>

          {activeSaleProduct && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between font-mono">
              <div>
                <span className="text-slate-500 block text-[11px] font-sans">Available Stock:</span>
                <span className="font-bold text-slate-900">
                  {activeSaleProduct.currentStock} {activeSaleProduct.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-sans">Unit Price:</span>
                <span className="font-bold text-slate-900">₹{activeSaleProduct.sellingPrice}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-sans">Total Bill:</span>
                <span className="font-bold text-emerald-600">
                  ₹{(saleQty * activeSaleProduct.sellingPrice).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Quantity Sold ({activeSaleProduct?.unit || 'units'})
            </label>
            <input
              type="number"
              step="any"
              min="0.1"
              max={activeSaleProduct?.currentStock || 9999}
              value={saleQty}
              onChange={(e) => setSaleQty(parseFloat(e.target.value) || 0)}
              required
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
            />
          </div>

          {saleFeedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                saleFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {saleFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{saleFeedback.message}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCloseRecordSale}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!activeSaleProduct || activeSaleProduct.currentStock <= 0}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Confirm & Deduct Stock</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Receive Restock / Arrival Modal */}
      <Modal
        isOpen={isRestockOpen}
        onClose={onCloseRestock}
        title="Receive Supplier Restock"
        description="Record newly arrived purchase shipments to increase physical on-hand stock."
        maxWidth="md"
      >
        <form onSubmit={handleRestockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Product
            </label>
            <select
              value={restockProductId}
              onChange={(e) => setRestockProductId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {p.currentStock} {p.unit} | Transit: {p.incomingOrderQty} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {activeRestockProduct && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between font-mono">
              <div>
                <span className="text-slate-500 block text-[11px] font-sans">Current On Hand:</span>
                <span className="font-bold text-slate-900">
                  {activeRestockProduct.currentStock} {activeRestockProduct.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-sans">In-Transit Order:</span>
                <span className="font-bold text-blue-600">
                  {activeRestockProduct.incomingOrderQty} {activeRestockProduct.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-sans">Supplier:</span>
                <span className="font-bold text-slate-800 truncate max-w-28 block">
                  {activeRestockProduct.supplierName}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Quantity Received ({activeRestockProduct?.unit || 'units'})
            </label>
            <input
              type="number"
              step="any"
              min="1"
              value={restockQty}
              onChange={(e) => setRestockQty(parseFloat(e.target.value) || 0)}
              required
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
            />
          </div>

          {restockFeedback && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{restockFeedback}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCloseRestock}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Receive & Add to Stock</span>
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
