import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Upload,
  Edit3,
  History,
  Barcode,
  X,
  Save,
  FileWarning,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { catalogApi, ProductRecord } from '../../api/catalog.api';
import { useAuthStore } from '../../store/auth.store';
import { exportToCsv } from '../../utils/exportUtils';
import { useBusinessMode } from '../../hooks/useBusinessMode';
import {
  DOSAGE_FORMS,
  MEDICINE_TYPES,
  SCHEDULE_CATEGORIES,
} from '../../config/pharmacyConfig';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuthStore();
  const { mode, isPharmacy, config } = useBusinessMode();
  const canManage = hasPermission('products:manage');
  const currency = user?.business?.settings?.currencySymbol || '₹';

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [availability, setAvailability] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedProductHistory, setSelectedProductHistory] =
    useState<ProductRecord | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(
    null
  );

  // Unified Product / Medicine Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brand: '',
    variant: '',
    description: '',
    unitOfMeasurement: isPharmacy ? 'STRIP' : 'PCS',
    purchasePrice: 0,
    mrp: 0,
    sellingPrice: 0,
    taxPercentage: isPharmacy ? 12 : 18,
    hsnCode: '',
    minimumStockLevel: 10,
    status: 'ACTIVE',
    // Pharmacy-specific fields
    genericName: '',
    medicineType: 'Allopathic',
    dosageForm: 'Tablet',
    strength: '',
    manufacturer: '',
    composition: '',
    scheduleCategory: 'OTC',
    prescriptionRequired: false,
    // Opening batch fields
    initialStock: 0,
    initialBatchNumber: '',
    initialManufacturingDate: '',
    initialExpiryDate: '',
  });

  const [csvText, setCsvText] = useState(
    isPharmacy
      ? 'name,sku,barcode,categoryName,genericName,brand,dosageForm,strength,manufacturer,scheduleCategory,prescriptionRequired,hsnCode,unitOfMeasurement,purchasePrice,mrp,sellingPrice,taxPercentage,minimumStockLevel,openingStock,batchNumber,expiryDate\nPantocid 40mg Tablet (15s),MED-PANT-40,890111229901,Cardiac & Diabetic Care,Pantoprazole,Pantocid,Tablet,40 mg,Sun Pharma,Schedule H,true,30049034,STRIP,98,165,148,12,20,80,PANT-26A,2027-09-30'
      : 'name,sku,barcode,categoryName,brand,variant,unitOfMeasurement,purchasePrice,mrp,sellingPrice,taxPercentage,minimumStockLevel,openingStock,batchNumber,expiryDate\nRoasted California Almonds 500g,GRC-ALM-500,890123459902,Packaged Grocery & Staples,NutriHarvest,500g Pouch,PACK,360,550,499,5,15,50,BATCH-ALM-01,2027-06-30'
  );

  const { data: categories } = useQuery({
    queryKey: ['categories', mode],
    queryFn: () => catalogApi.listCategories(),
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', mode, search, categoryId, availability],
    queryFn: () =>
      catalogApi.listProducts({
        search: search || undefined,
        categoryId: categoryId || undefined,
        availability: availability || undefined,
        limit: 100,
      }),
  });

  const createMutation = useMutation({
    mutationFn: catalogApi.createProduct,
    onSuccess: () => {
      toast.success(`${config.terms.productSingular} created`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to create item'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      catalogApi.updateProduct(id, payload),
    onSuccess: () => {
      toast.success(`${config.terms.productSingular} updated`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to update item'),
  });

  const bulkImportMutation = useMutation({
    mutationFn: catalogApi.bulkImportProducts,
    onSuccess: (res) => {
      toast.success(
        `Imported ${res.importedCount} new, updated ${res.updatedCount} ${config.terms.productPlural.toLowerCase()}`
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCsvModalOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Bulk import failed'),
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      categoryId: categories?.[0]?.id || '',
      brand: '',
      variant: '',
      description: '',
      unitOfMeasurement: config.units[0] || 'PCS',
      purchasePrice: 0,
      mrp: 0,
      sellingPrice: 0,
      taxPercentage: isPharmacy ? 12 : 18,
      hsnCode: '',
      minimumStockLevel: isPharmacy ? 15 : 10,
      status: 'ACTIVE',
      genericName: '',
      medicineType: 'Allopathic',
      dosageForm: 'Tablet',
      strength: '',
      manufacturer: '',
      composition: '',
      scheduleCategory: 'OTC',
      prescriptionRequired: false,
      initialStock: 0,
      initialBatchNumber: '',
      initialManufacturingDate: '',
      initialExpiryDate: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProductRecord) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      categoryId: p.categoryId,
      brand: p.brand || '',
      variant: p.variant || '',
      description: p.description || '',
      unitOfMeasurement: p.unitOfMeasurement,
      purchasePrice: Number(p.purchasePrice),
      mrp: Number(p.mrp ?? p.sellingPrice),
      sellingPrice: Number(p.sellingPrice),
      taxPercentage: Number(p.taxPercentage),
      hsnCode: p.hsnCode || '',
      minimumStockLevel: p.minimumStockLevel,
      status: p.status,
      genericName: p.genericName || '',
      medicineType: p.medicineType || 'Allopathic',
      dosageForm: p.dosageForm || 'Tablet',
      strength: p.strength || '',
      manufacturer: p.manufacturer || '',
      composition: p.composition || '',
      scheduleCategory: p.scheduleCategory || 'OTC',
      prescriptionRequired: Boolean(p.prescriptionRequired),
      initialStock: 0,
      initialBatchNumber: '',
      initialManufacturingDate: '',
      initialExpiryDate: '',
    });
    setIsModalOpen(true);
  };

  const viewHistory = async (id: string) => {
    try {
      const detail = await catalogApi.getProductById(id);
      setSelectedProductHistory(detail);
    } catch {
      toast.error('Failed to load batch history');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleCsvImport = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      toast.error('CSV must contain a header row and at least 1 row');
      return;
    }
    const headers = lines[0].split(',').map((h) => h.trim());
    const parsedRows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx];
      });
      return {
        name: obj.name,
        sku: obj.sku,
        barcode: obj.barcode,
        categoryName: obj.categoryName || 'General',
        genericName: obj.genericName,
        brand: obj.brand,
        variant: obj.variant,
        dosageForm: obj.dosageForm,
        strength: obj.strength,
        manufacturer: obj.manufacturer,
        scheduleCategory: obj.scheduleCategory,
        prescriptionRequired: obj.prescriptionRequired === 'true',
        hsnCode: obj.hsnCode,
        unitOfMeasurement: obj.unitOfMeasurement || (isPharmacy ? 'STRIP' : 'PCS'),
        purchasePrice: Number(obj.purchasePrice || 0),
        mrp: Number(obj.mrp || obj.sellingPrice || 0),
        sellingPrice: Number(obj.sellingPrice || 0),
        taxPercentage: Number(obj.taxPercentage || (isPharmacy ? 12 : 18)),
        minimumStockLevel: Number(obj.minimumStockLevel || 10),
        openingStock: Number(obj.openingStock || 0),
        batchNumber: obj.batchNumber,
        expiryDate: obj.expiryDate,
      };
    });
    bulkImportMutation.mutate(parsedRows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {config.terms.catalogTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {config.terms.catalogSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              exportToCsv(
                isPharmacy ? 'medicines-catalog' : 'products-catalog',
                (productsData?.items || []).map((p) =>
                  isPharmacy
                    ? {
                        Code: p.sku,
                        MedicineName: p.name,
                        GenericName: p.genericName || '',
                        Brand: p.brand || '',
                        DosageForm: p.dosageForm || '',
                        Strength: p.strength || '',
                        Manufacturer: p.manufacturer || '',
                        Schedule: p.scheduleCategory || 'OTC',
                        RxRequired: p.prescriptionRequired ? 'Yes' : 'No',
                        HSN: p.hsnCode || '',
                        PurchasePrice: p.purchasePrice,
                        MRP: p.mrp ?? p.sellingPrice,
                        SellingPrice: p.sellingPrice,
                        GST: p.taxPercentage,
                        AvailableStock: p.currentStock,
                      }
                    : {
                        SKU: p.sku,
                        Name: p.name,
                        Barcode: p.barcode || '',
                        Category: p.category?.name || '',
                        Brand: p.brand || '',
                        Variant: p.variant || '',
                        Unit: p.unitOfMeasurement,
                        PurchasePrice: p.purchasePrice,
                        MRP: p.mrp ?? p.sellingPrice,
                        SellingPrice: p.sellingPrice,
                        TaxPct: p.taxPercentage,
                        AvailableStock: p.currentStock,
                        Status: p.status,
                      }
                )
              )
            }
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            Export CSV
          </button>

          {canManage && (
            <>
              <button
                onClick={() => setIsCsvModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Bulk CSV Import</span>
              </button>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add {config.terms.productSingular}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={config.terms.searchPlaceholder}
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-lg"
          />
        </div>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
        >
          <option value="">All {config.terms.categoryPlural}</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
        >
          <option value="">All Availability</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500">
                <th className="py-3 px-4">
                  {isPharmacy ? 'Medicine / Generic Name' : 'Product / SKU'}
                </th>
                <th className="py-3 px-4">{config.terms.categorySingular}</th>
                {isPharmacy ? (
                  <th className="py-3 px-4">Formulation / Schedule</th>
                ) : (
                  <th className="py-3 px-4">Brand / Variant</th>
                )}
                <th className="py-3 px-4">
                  {isPharmacy ? 'Cost / MRP / Sell' : 'Purchase / Selling'}
                </th>
                <th className="py-3 px-4">GST %</th>
                <th className="py-3 px-4">Sellable Stock</th>
                <th className="py-3 px-4">Batches</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading {config.terms.productPlural.toLowerCase()}...
                  </td>
                </tr>
              ) : !productsData?.items.length ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No {config.terms.productPlural.toLowerCase()} found.
                  </td>
                </tr>
              ) : (
                productsData.items.map((p) => {
                  const isLow =
                    p.currentStock > 0 && p.currentStock <= p.minimumStockLevel;
                  const isOut = p.currentStock <= 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                          <span>{p.name}</span>
                          {isPharmacy && p.prescriptionRequired && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                              Rx Required
                            </span>
                          )}
                        </div>
                        {isPharmacy && p.genericName && (
                          <div className="text-xs text-blue-700 font-medium mt-0.5">
                            Generic: {p.genericName}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono">{p.sku}</span>
                          {p.barcode && (
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <Barcode className="w-3 h-3" />
                              {p.barcode}
                            </span>
                          )}
                          {isPharmacy && p.hsnCode && (
                            <span className="text-slate-400">HSN: {p.hsnCode}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {p.category?.name}
                        </span>
                      </td>

                      {isPharmacy ? (
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">
                            {p.dosageForm || 'Tablet'} {p.strength ? `• ${p.strength}` : ''}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.manufacturer || p.brand || '—'} •{' '}
                            <span className="font-semibold text-slate-700">
                              {p.scheduleCategory || 'OTC'}
                            </span>
                          </div>
                        </td>
                      ) : (
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">
                            {p.brand || '—'}
                          </div>
                          {p.variant && (
                            <div className="text-[11px] text-slate-500">
                              {p.variant}
                            </div>
                          )}
                        </td>
                      )}

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          Sell: {currency}
                          {Number(p.sellingPrice).toFixed(2)}
                        </div>
                        {p.mrp && (
                          <div className="text-[11px] text-slate-500">
                            MRP: {currency}
                            {Number(p.mrp).toFixed(2)}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400">
                          Cost: {currency}
                          {Number(p.purchasePrice).toFixed(2)}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-600">
                        {Number(p.taxPercentage)}%
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold ${
                            isOut
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {p.currentStock} {p.unitOfMeasurement}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {p.batches?.length || 0} batch(es)
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => viewHistory(p.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                        >
                          <History className="w-3.5 h-3.5" />
                          Batches
                        </button>
                        {canManage && (
                          <button
                            onClick={() => openEditModal(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">
                {editingProduct
                  ? `Edit ${config.terms.productSingular}`
                  : `Add New ${config.terms.productSingular}`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 max-h-[82vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {config.terms.productSingular} Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={
                      isPharmacy
                        ? 'e.g., Augmentin 625 Duo Tablet (10s)'
                        : 'e.g., Organic Wild Forest Honey 500g'
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {config.terms.categorySingular} *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Select {config.terms.categorySingular}</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pharmacy-Only Identification Fields */}
                {isPharmacy && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Generic Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.genericName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            genericName: e.target.value,
                          })
                        }
                        placeholder="e.g., Amoxicillin + Clavulanic Acid"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData({ ...formData, brand: e.target.value })
                        }
                        placeholder="e.g., Augmentin"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        value={formData.manufacturer}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            manufacturer: e.target.value,
                          })
                        }
                        placeholder="e.g., GSK Pharmaceuticals"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Medicine Type
                      </label>
                      <select
                        value={formData.medicineType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            medicineType: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                      >
                        {MEDICINE_TYPES.map((mt) => (
                          <option key={mt} value={mt}>
                            {mt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Dosage Form
                      </label>
                      <select
                        value={formData.dosageForm}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dosageForm: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                      >
                        {DOSAGE_FORMS.map((df) => (
                          <option key={df} value={df}>
                            {df}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Strength
                      </label>
                      <input
                        type="text"
                        value={formData.strength}
                        onChange={(e) =>
                          setFormData({ ...formData, strength: e.target.value })
                        }
                        placeholder="e.g., 500 mg, 250 mg/5 ml"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Composition
                      </label>
                      <input
                        type="text"
                        value={formData.composition}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            composition: e.target.value,
                          })
                        }
                        placeholder="e.g., Amoxicillin Trihydrate IP 500mg + Potassium Clavulanate IP 125mg"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Schedule Category
                      </label>
                      <select
                        value={formData.scheduleCategory}
                        onChange={(e) => {
                          const sched = e.target.value;
                          setFormData({
                            ...formData,
                            scheduleCategory: sched,
                            prescriptionRequired:
                              sched !== 'OTC' ? true : formData.prescriptionRequired,
                          });
                        }}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                      >
                        {SCHEDULE_CATEGORIES.map((sc) => (
                          <option key={sc} value={sc}>
                            {sc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Store-Only Brand & Variant Fields */}
                {!isPharmacy && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Brand
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData({ ...formData, brand: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Variant / Size (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.variant}
                        onChange={(e) =>
                          setFormData({ ...formData, variant: e.target.value })
                        }
                        placeholder="e.g., 500g Jar, 1L Pack"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                      />
                    </div>
                  </>
                )}

                {/* Shared SKU, Barcode, HSN, Unit & Pricing Fields */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isPharmacy ? 'Medicine Code / SKU *' : 'SKU / Product Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Barcode (EAN / UPC)
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                {isPharmacy && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      HSN Code
                    </label>
                    <input
                      type="text"
                      value={formData.hsnCode}
                      onChange={(e) =>
                        setFormData({ ...formData, hsnCode: e.target.value })
                      }
                      placeholder="e.g., 30041000"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit of Measurement
                  </label>
                  <select
                    value={formData.unitOfMeasurement}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitOfMeasurement: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {config.units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchasePrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    MRP ({currency}) {isPharmacy ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required={isPharmacy}
                    value={formData.mrp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mrp: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellingPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxPercentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        taxPercentage: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Low-Stock Level
                  </label>
                  <input
                    type="number"
                    value={formData.minimumStockLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumStockLevel: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                {isPharmacy && (
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-rose-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.prescriptionRequired}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            prescriptionRequired: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-slate-300 text-rose-600"
                      />
                      <FileWarning className="w-4 h-4" />
                      <span>Prescription Required (Yes/No)</span>
                    </label>
                  </div>
                )}
              </div>

              {!editingProduct && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Opening Stock Qty
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.initialStock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialStock: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      value={formData.initialBatchNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialBatchNumber: e.target.value,
                        })
                      }
                      placeholder="Auto if empty"
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Manufacturing Date
                    </label>
                    <input
                      type="date"
                      value={formData.initialManufacturingDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialManufacturingDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.initialExpiryDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          initialExpiryDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {editingProduct
                      ? `Update ${config.terms.productSingular}`
                      : `Create ${config.terms.productSingular}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">
                Bulk CSV {config.terms.productSingular} & Batch Import
              </h3>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCsvImport} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Paste CSV rows below (existing SKUs will be updated; new SKUs will be created with their opening batch):
              </p>
              <textarea
                rows={7}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-3 text-xs font-mono border border-slate-300 rounded-lg"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkImportMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {bulkImportMutation.isPending
                    ? 'Importing...'
                    : 'Run Bulk Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batches & Stock Movement History Modal */}
      {selectedProductHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900">
                  {selectedProductHistory.name} ({selectedProductHistory.sku})
                </h3>
                <p className="text-xs text-slate-500">
                  {isPharmacy && selectedProductHistory.composition
                    ? `Composition: ${selectedProductHistory.composition}`
                    : 'Batch-wise inventory breakdown & stock movement audit history'}
                </p>
              </div>
              <button
                onClick={() => setSelectedProductHistory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                  {config.terms.productSingular} Batches
                </h4>
                <table className="w-full text-left border-collapse text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-2 px-3">Batch No</th>
                      <th className="py-2 px-3">Mfg / Expiry</th>
                      <th className="py-2 px-3">Cost / MRP / Sell</th>
                      <th className="py-2 px-3">Sellable</th>
                      <th className="py-2 px-3">Damaged</th>
                      <th className="py-2 px-3">Expired</th>
                      <th className="py-2 px-3">Quarantine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProductHistory.batches?.map((b) => (
                      <tr key={b.id}>
                        <td className="py-2 px-3 font-mono font-semibold">
                          {b.batchNumber}
                        </td>
                        <td className="py-2 px-3">
                          {b.expiryDate
                            ? new Date(b.expiryDate).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="py-2 px-3">
                          {currency}
                          {Number(b.purchasePrice).toFixed(2)} /{' '}
                          {b.mrp ? `${currency}${Number(b.mrp).toFixed(2)} / ` : ''}
                          {currency}
                          {Number(b.sellingPrice).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 font-bold text-emerald-600">
                          {b.availableQuantity}
                        </td>
                        <td className="py-2 px-3 text-rose-600">
                          {b.damagedQuantity}
                        </td>
                        <td className="py-2 px-3 text-amber-600">
                          {b.expiredQuantity}
                        </td>
                        <td className="py-2 px-3 text-purple-600">
                          {b.quarantinedQuantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                  Stock Movement Audit History
                </h4>
                <table className="w-full text-left border-collapse text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Batch</th>
                      <th className="py-2 px-3">Movement Type</th>
                      <th className="py-2 px-3">Qty Change</th>
                      <th className="py-2 px-3">Stock (Before → After)</th>
                      <th className="py-2 px-3">Reason</th>
                      <th className="py-2 px-3">By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProductHistory.stockMovements?.map((mv: any) => (
                      <tr key={mv.id}>
                        <td className="py-2 px-3 text-slate-500">
                          {new Date(mv.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {mv.batch?.batchNumber}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px]">
                          {mv.movementType}
                        </td>
                        <td
                          className={`py-2 px-3 font-bold ${
                            mv.quantity > 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {mv.quantity > 0 ? `+${mv.quantity}` : mv.quantity}
                        </td>
                        <td className="py-2 px-3">
                          {mv.previousStock} → {mv.newStock}
                        </td>
                        <td className="py-2 px-3">{mv.reason}</td>
                        <td className="py-2 px-3">
                          {mv.performedBy?.fullName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
