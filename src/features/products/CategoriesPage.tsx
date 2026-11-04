import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit3, Trash2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { catalogApi, CategoryRecord } from '../../api/catalog.api';
import { useAuthStore } from '../../store/auth.store';
import { useBusinessMode } from '../../hooks/useBusinessMode';

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuthStore();
  const { mode, config } = useBusinessMode();
  const canManage = hasPermission('products:manage');
  const currency = user?.business?.settings?.currencySymbol || '₹';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRecord | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', mode],
    queryFn: () => catalogApi.listCategories(),
  });

  const createMutation = useMutation({
    mutationFn: catalogApi.createCategory,
    onSuccess: () => {
      toast.success('Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      catalogApi.updateCategory(id, payload),
    onSuccess: () => {
      toast.success('Category updated');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to update category'),
  });

  const deleteMutation = useMutation({
    mutationFn: catalogApi.deleteCategory,
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Cannot delete category'),
  });

  const openCreate = () => {
    setEditing(null);
    setName('');
    setCode('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEdit = (cat: CategoryRecord) => {
    setEditing(cat);
    setName(cat.name);
    setCode(cat.code || '');
    setDescription(cat.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        payload: { name, code, description },
      });
    } else {
      createMutation.mutate({ name, code, description });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {config.terms.categoryPlural} & Valuation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize {config.terms.productPlural.toLowerCase()} and view category-wise inventory valuation and sales performance.
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add {config.terms.categorySingular}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 py-8 text-center text-sm text-slate-400">
            Loading categories...
          </div>
        ) : (
          categories?.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] font-semibold">
                    {cat.code || 'CAT'}
                  </span>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1 text-slate-400 hover:text-blue-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(cat.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-2">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {cat.description || 'No description'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-slate-100 text-xs">
                <div>
                  <p className="text-slate-400">{config.terms.productPlural}</p>
                  <p className="font-bold text-slate-900">{cat.productCount}</p>
                </div>
                <div>
                  <p className="text-slate-400">Stock Value</p>
                  <p className="font-bold text-slate-900">
                    {currency}
                    {cat.stockValuation.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Sales</p>
                  <p className="font-bold text-emerald-600">
                    {currency}
                    {cat.totalSalesAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">
                {editing ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

