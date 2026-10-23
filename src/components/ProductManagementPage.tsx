import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  Edit2,
  Trash2,
  PackagePlus,
  ShoppingCart,
  Filter,
  CheckCircle2,
  AlertCircle,
  Truck,
  Calendar,
} from 'lucide-react';
import { Product, UnitType } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { Modal } from './Modal';

interface ProductManagementPageProps {
  onOpenAddModal: () => void;
  onOpenSaleModal: (productId?: string) => void;
  onOpenRestockModal: (productId?: string) => void;
}

export const ProductManagementPage: React.FC<ProductManagementPageProps> = ({
  onOpenAddModal,
  onOpenSaleModal,
  onOpenRestockModal,
}) => {
  const {
    products,
    categories,
    deleteProduct,
    updateProduct,
    exportProductsCSV,
    importProductsFromCSV,
  } = useInventory();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'INCOMING'>('ALL');

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

      let matchStock = true;
      if (stockFilter === 'LOW') {
        matchStock = p.currentStock > 0 && p.currentStock <= p.minStockThreshold;
      } else if (stockFilter === 'OUT') {
        matchStock = p.currentStock === 0;
      } else if (stockFilter === 'INCOMING') {
        matchStock = p.incomingOrderQty > 0;
      }

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);

  // Handle Edit Submit
  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;

    const formData = new FormData(e.currentTarget);
    const updates: Partial<Product> = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      currentStock: parseFloat(formData.get('currentStock') as string) || 0,
      unit: formData.get('unit') as UnitType,
      sellingPrice: parseFloat(formData.get('sellingPrice') as string) || 0,
      purchaseCost: parseFloat(formData.get('purchaseCost') as string) || 0,
      minStockThreshold: parseFloat(formData.get('minStockThreshold') as string) || 5,
      supplierName: formData.get('supplierName') as string,
      supplierLeadTimeDays: parseInt(formData.get('supplierLeadTimeDays') as string, 10) || 3,
      incomingOrderQty: parseFloat(formData.get('incomingOrderQty') as string) || 0,
      expiryDate: (formData.get('expiryDate') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
    };

    updateProduct(editingProduct.id, updates);
    setEditingProduct(null);
  };

  // CSV Import
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    if (!csvContent) return;
    const res = importProductsFromCSV(csvContent);
    setImportResult(res);
    if (res.imported > 0 && res.errors.length === 0) {
      setTimeout(() => {
        setShowImportModal(false);
        setCsvContent('');
        setImportResult(null);
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products & Stock Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain master catalog, track physical inventory counts, and record supplier shipments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={exportProductsCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name, ID, or supplier..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 focus:bg-white"
          />
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 whitespace-nowrap">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-slate-400"
          >
            <option value="ALL">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Level Quick Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(
            [
              { id: 'ALL', label: 'All' },
              { id: 'LOW', label: 'Low Stock' },
              { id: 'OUT', label: 'Out of Stock' },
              { id: 'INCOMING', label: 'In Transit' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStockFilter(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                stockFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* High-Density Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Product Name & Category</th>
                <th className="px-3 py-3 text-right">Current Stock</th>
                <th className="px-3 py-3 text-right">In Transit</th>
                <th className="px-3 py-3 text-right">Selling / Cost</th>
                <th className="px-3 py-3 text-right">Min Threshold</th>
                <th className="px-4 py-3">Supplier & Lead Time</th>
                <th className="px-3 py-3">Expiry Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.currentStock === 0;
                const isLowStock = p.currentStock > 0 && p.currentStock <= p.minStockThreshold;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & ID & Category */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-400">{p.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{p.category}</span>
                      </div>
                    </td>

                    {/* Current Stock */}
                    <td className="px-3 py-3 text-right">
                      <div className="font-mono font-bold tabular-nums text-slate-900 text-sm">
                        {p.currentStock}{' '}
                        <span className="text-[11px] font-normal text-slate-500 font-sans">
                          {p.unit}
                        </span>
                      </div>
                      {isOutOfStock && (
                        <span className="text-[10px] font-semibold text-rose-600 block">
                          Out of stock
                        </span>
                      )}
                      {isLowStock && (
                        <span className="text-[10px] font-semibold text-amber-600 block">
                          Low stock
                        </span>
                      )}
                    </td>

                    {/* Incoming Stock */}
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      {p.incomingOrderQty > 0 ? (
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] font-medium border border-emerald-200">
                          +{p.incomingOrderQty} {p.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Selling / Cost */}
                    <td className="px-3 py-3 text-right font-mono tabular-nums">
                      <div className="text-slate-900 font-semibold">₹{p.sellingPrice}</div>
                      <div className="text-[11px] text-slate-400">Cost: ₹{p.purchaseCost}</div>
                    </td>

                    {/* Min Threshold */}
                    <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-700">
                      {p.minStockThreshold} {p.unit}
                    </td>

                    {/* Supplier */}
                    <td className="px-4 py-3">
                      <div className="text-slate-800 truncate max-w-44" title={p.supplierName}>
                        {p.supplierName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Lead: {p.supplierLeadTimeDays} days
                      </div>
                    </td>

                    {/* Expiry */}
                    <td className="px-3 py-3 text-slate-700">
                      {p.expiryDate ? (
                        <span className="font-mono text-xs">{p.expiryDate}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenSaleModal(p.id)}
                          title="Record Sale"
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenRestockModal(p.id)}
                          title="Receive Stock"
                          className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setEditingProduct(p)}
                          title="Edit Details"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingProductId(p.id)}
                          title="Delete Product"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-500">
                    No products found matching your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <Modal
          isOpen={true}
          onClose={() => setEditingProduct(null)}
          title={`Edit Product: ${editingProduct.name}`}
          description="Update catalog attributes, unit costs, and supplier delivery parameters."
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingProduct.name}
                  required
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
                  defaultValue={editingProduct.category}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Current Stock *
                </label>
                <input
                  type="number"
                  name="currentStock"
                  step="any"
                  defaultValue={editingProduct.currentStock}
                  required
                  min="0"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit of Measurement *
                </label>
                <select
                  name="unit"
                  defaultValue={editingProduct.unit}
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
                  step="any"
                  defaultValue={editingProduct.sellingPrice}
                  required
                  min="0"
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
                  step="any"
                  defaultValue={editingProduct.purchaseCost}
                  required
                  min="0"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Min Stock Threshold *
                </label>
                <input
                  type="number"
                  name="minStockThreshold"
                  defaultValue={editingProduct.minStockThreshold}
                  required
                  min="1"
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
                  defaultValue={editingProduct.supplierLeadTimeDays}
                  required
                  min="1"
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
                  defaultValue={editingProduct.supplierName}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Incoming Order Qty (In Transit)
                </label>
                <input
                  type="number"
                  name="incomingOrderQty"
                  defaultValue={editingProduct.incomingOrderQty}
                  min="0"
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
                  defaultValue={editingProduct.expiryDate || ''}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  defaultValue={editingProduct.notes || ''}
                  placeholder="e.g. Popular breakfast item"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingProductId(null)}
          title="Delete Product"
          description="Are you sure you want to remove this product from inventory?"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              This action cannot be undone. Historical sales records for this product will remain preserved.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProduct(deletingProductId);
                  setDeletingProductId(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowImportModal(false);
            setCsvContent('');
            setImportResult(null);
          }}
          title="Import Products from CSV"
          description="Upload or paste your inventory spreadsheet. Required headers: Product Name and Current Stock."
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Choose CSV File
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFileChange}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Or Paste Raw CSV Data
              </label>
              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setImportResult(null);
                }}
                placeholder="Product Name,Category,Current Stock,Unit,Selling Price,Purchase Cost,Min Threshold,Supplier,Lead Time&#10;Basmati Rice 5kg,Staples,10,kg,130,105,15,Kisan Traders,4"
                className="w-full p-2.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400 bg-slate-50"
              />
            </div>

            {importResult && (
              <div
                className={`p-3 rounded-lg text-xs ${
                  importResult.errors.length === 0
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                <div className="font-semibold">
                  Successfully imported {importResult.imported} products.
                </div>
                {importResult.errors.length > 0 && (
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-amber-900">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!csvContent.trim()}
                onClick={handleProcessImport}
                className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md shadow-xs"
              >
                Process & Import
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
