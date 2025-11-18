'use client';

import Image from 'next/image';
import { ChangeEvent, FormEvent, useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth, useAdminAuth } from './AuthProvider';
import type { MenuItemDto } from '../lib/menu';

type MenuFormState = {
  title: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
};

type AdminMenuManagerProps = {
  initialMenuItems: MenuItemDto[];
  searchQuery?: string;
};

const emptyForm: MenuFormState = {
  title: '',
  description: '',
  price: '',
  category: '',
  imageUrl: ''
};

export default function AdminMenuManager({ initialMenuItems, searchQuery = '' }: AdminMenuManagerProps) {
  const router = useRouter();
  const { token: adminToken, refreshToken: refreshAdminToken } = useAdminAuth();
  const { token: userToken, refreshToken: refreshUserToken } = useAuth();
  // Prefer admin token, fallback to user token
  const token = adminToken || userToken;
  const refreshToken = adminToken ? refreshAdminToken : refreshUserToken;
  const [menuList, setMenuList] = useState(initialMenuItems);
  const [form, setForm] = useState<MenuFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [importing, setImporting] = useState(false);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isSupported = ['image/jpeg', 'image/png'].includes(file.type);
    if (!isSupported) {
      setMessage('Please upload a JPG or PNG image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString();
      if (result) {
        setForm((prev) => ({ ...prev, imageUrl: result }));
        setMessage('Image uploaded from file. It will be stored as a data URL.');
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (item: MenuItemDto) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      description: item.description,
      price: String(item.price),
      category: item.category,
      imageUrl: item.imageUrl
    });
  };

  const toDto = (item: any): MenuItemDto => ({
    _id: item._id?.toString?.() ?? item.id?.toString?.() ?? item._id ?? item.id,
    title: item.title,
    description: item.description,
    price: item.price,
    category: item.category,
    imageUrl: item.imageUrl,
    rating: item.rating ?? 4.5,
    isAvailable: item.isAvailable ?? true
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const authToken = token ?? (await refreshToken(true));
    if (!authToken) {
      setMessage('Authentication required. Please sign in again.');
      setLoading(false);
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      imageUrl: form.imageUrl
    };

    try {
      const response = await fetch('/api/admin/menu', {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save menu item');
      }

      if (editingId) {
        setMenuList((items) => items.map((item) => (item._id === editingId ? toDto(data) : item)));
        setMessage('Menu item updated');
      } else {
        setMenuList((items) => [toDto(data), ...items]);
        setMessage('Menu item created');
      }

      resetForm();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    setLoading(true);
    setMessage(null);

    const authToken = token ?? (await refreshToken(true));
    if (!authToken) {
      setMessage('Authentication required. Please sign in again.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/menu', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ id })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete menu item');
      }

      setMenuList((items) => items.filter((item) => item._id !== id));
      setMessage('Menu item deleted');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item: MenuItemDto) => {
    console.log('handleToggle called for:', item.title);
    const itemId = item._id;
    
    if (!itemId) {
      console.error('Item ID is missing:', item);
      setMessage('Error: Menu item ID is missing');
      return;
    }
    
    const currentAvailable = item.isAvailable ?? true;
    const nextAvailable = !currentAvailable;

    console.log('Toggling item ID:', itemId, 'from', currentAvailable, 'to', nextAvailable);

    // Optimistically update the UI immediately for this specific item
    setMenuList((prevItems) => {
      const updated = prevItems.map((entry) => {
        if (entry._id === itemId) {
          console.log('Updating item in state:', entry.title, 'from', entry.isAvailable, 'to', nextAvailable);
          return { ...entry, isAvailable: nextAvailable };
        }
        return entry;
      });
      console.log('Updated menu list, item count:', updated.length);
      return updated;
    });

    try {
      const authToken = token ?? (await refreshToken(true));
      if (!authToken) {
        setMessage('Authentication required. Please sign in again.');
        // Revert on auth error
        setMenuList((prevItems) =>
          prevItems.map((entry) => 
            entry._id === itemId ? { ...entry, isAvailable: currentAvailable } : entry
          )
        );
        return;
      }

      const requestBody = { id: itemId, isAvailable: nextAvailable };
      console.log('Sending API request with body:', requestBody);
      
      const response = await fetch('/api/admin/menu', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('API error:', data);
        throw new Error(data.error || 'Failed to update availability');
      }

      // Success
      console.log('API call successful');
      setMessage(`Marked ${item.title} as ${nextAvailable ? 'available' : 'unavailable'}.`);
      
      // Update with server response if different
      const data = await response.json();
      if (data.isAvailable !== undefined && data.isAvailable !== nextAvailable) {
        setMenuList((prevItems) =>
          prevItems.map((entry) => 
            entry._id === itemId ? { ...entry, isAvailable: data.isAvailable } : entry
          )
        );
      }
    } catch (error) {
      console.error('Toggle error:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to update availability');
      // Revert on error - restore original state for this specific item only
      setMenuList((prevItems) => {
        console.log('Reverting state for', item.title);
        return prevItems.map((entry) => 
          entry._id === itemId ? { ...entry, isAvailable: currentAvailable } : entry
        );
      });
    }
  };

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const visibleMenuList = useMemo(
    () =>
      menuList.filter((item) => {
        const matchesQuery =
          normalizedQuery.length === 0
            ? true
            : item.title.toLowerCase().includes(normalizedQuery) ||
              item.description.toLowerCase().includes(normalizedQuery) ||
              item.category.toLowerCase().includes(normalizedQuery);
        if (!matchesQuery) return false;
        if (showUnavailable) return !item.isAvailable;
        return true;
      }),
    [menuList, normalizedQuery, showUnavailable]
  );
  const visibleCount = visibleMenuList.length;

  const groupByCategory = (items: MenuItemDto[]) => {
    return items.reduce<Record<string, MenuItemDto[]>>((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
  };

  const groupedMenu = useMemo(() => groupByCategory(visibleMenuList), [visibleMenuList]);

  useEffect(() => {
    // Only sync initialMenuItems when they actually change and we don't have optimistic updates
    // Check if we have any items with pending changes
    const hasLocalChanges = menuList.some(localItem => {
      const initialItem = initialMenuItems.find(i => i._id === localItem._id);
      return initialItem && localItem.isAvailable !== initialItem.isAvailable;
    });

    // Only update if initialMenuItems changed AND we don't have local changes
    if (!hasLocalChanges) {
      setMenuList(initialMenuItems);
    }
  }, [initialMenuItems, menuList]);

  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  const handleBulkImport = async (overwrite: boolean) => {
    try {
      setImporting(true);
      setMessage(null);
      const authToken = token ?? (await refreshToken(true));
      if (!authToken) {
        setMessage('Authentication required. Please sign in again.');
        return;
      }

      const url = `/api/admin/menu/bulk-import${overwrite ? '?overwrite=true' : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        setMessage('Authentication expired. Please sign in again.');
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to import menu items');
      }

      setMessage(
        `Import successful! Created: ${data.created}, Updated: ${data.updated}, Skipped: ${data.skipped}`
      );
      
      // Refresh the page to show new items
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to import menu items');
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="space-y-6 rounded-3xl border border-white/60 bg-white/95 px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.1)]">
      {/* Bulk Import Section */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-blue-900 mb-1">Bulk Import Menu Items</h3>
            <p className="text-xs text-blue-700">
              Import all menu items from the restaurant menu (42 items total)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleBulkImport(false)}
              disabled={importing}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {importing ? 'Importing...' : 'Import New Items'}
            </button>
            <button
              type="button"
              onClick={() => handleBulkImport(true)}
              disabled={importing}
              className="rounded-lg border border-blue-600 bg-white px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-60 transition-colors"
            >
              {importing ? 'Updating...' : 'Update Existing'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-brand-dark">{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-sm text-brand-orange hover:underline">
              Cancel edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleInputChange}
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Price (NPR)</label>
            <input
              name="price"
              value={form.price}
              onChange={handleInputChange}
              type="number"
              step="1"
              min="0"
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Category</label>
            <input
              name="category"
              value={form.category}
              onChange={handleInputChange}
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Image URL</label>
            <input
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleInputChange}
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              placeholder="https://..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              rows={2}
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Upload Image (JPG or PNG)</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={handleImageUpload}
              className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-brand-orange file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
            />
            <p className="mt-1 text-xs text-gray-500">Paste an external link or upload a JPG/PNG above to auto-fill the Image URL field.</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-brand-orange px-6 py-2 font-semibold text-white shadow hover:bg-brand-dark disabled:opacity-70"
            >
              {loading ? 'Saving...' : editingId ? 'Update Item' : 'Add Item'}
            </button>
            {message && <p className="text-sm text-brand-dark">{message}</p>}
          </div>
          {form.imageUrl && (
            <div className="sm:col-span-2 lg:col-span-4 mt-2 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Preview</span>
              <img src={form.imageUrl} alt="Menu item preview" className="h-16 w-16 rounded-lg object-cover" />
            </div>
          )}
        </form>
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-brand-dark">Menu Items</h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>
              Showing {visibleCount} item{visibleCount === 1 ? '' : 's'}
            </span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search menu items"
              className="h-9 w-48 rounded-full border border-gray-200 px-4 text-xs text-gray-600 shadow-sm outline-none transition focus:border-brand-orange focus:text-gray-800 focus:shadow-md sm:w-60"
            />
            <button
              type="button"
              onClick={() => setShowUnavailable((prev) => !prev)}
              className={`flex items-center gap-3 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                showUnavailable
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                  : 'border-gray-300 bg-gray-100/80 text-gray-600'
              }`}
              aria-pressed={showUnavailable}
            >
              <span>Show unavailable</span>
              <span
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
                  showUnavailable ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-semibold text-gray-500 shadow transition ${
                    showUnavailable ? 'translate-x-4 text-emerald-500' : 'translate-x-0'
                  }`}
                >
                  {showUnavailable ? 'On' : 'Off'}
                </span>
              </span>
            </button>
          </div>
        </div>

        {Object.entries(groupedMenu).map(([category, items]) => (
          <section key={category} className="space-y-5 rounded-3xl border border-white/60 bg-[#fff3eb] px-5 py-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-brand-dark">{category}</h2>
                <p className="text-sm text-gray-600">
                  {items.length} item{items.length === 1 ? '' : 's'} in this category
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <article
                  key={item._id}
                  className="relative flex h-full flex-col justify-between rounded-3xl border border-white bg-white px-4 py-4 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(139,29,29,0.08)]"
                >
                  {!item.isAvailable && (
                    <span className="absolute right-4 top-4 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                      Out of Stock
                    </span>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold uppercase tracking-wide text-brand-orange">{item.category}</span>
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-brand-dark">★ {item.rating}</span>
                      </div>
                      <h4 className="text-lg font-semibold text-brand-dark">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-gray-100">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.title} width={100} height={100} className="h-20 w-20 object-cover" />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center bg-gray-100 text-[10px] text-gray-400">No image</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-brand-dark">Rs. {item.price}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${item.isAvailable !== false ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {item.isAvailable !== false ? 'Available' : 'Unavailable'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Toggle button clicked for:', item.title, 'Current state:', item.isAvailable);
                            void handleToggle(item);
                          }}
                          className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full focus:outline-none focus:ring-4 focus:ring-emerald-300 focus:ring-offset-2"
                          aria-label={`Toggle availability for ${item.title}`}
                          aria-pressed={item.isAvailable !== false}
                        >
                          <div className={`h-6 w-11 rounded-full transition-colors ${
                            item.isAvailable !== false ? 'bg-emerald-500' : 'bg-gray-300'
                          }`} />
                          <span className={`absolute left-0.5 top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${
                            item.isAvailable !== false ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="flex-1 rounded-full border border-brand-orange px-4 py-2 text-sm font-semibold text-brand-orange transition hover:bg-brand-orange hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item._id)}
                        className="flex-1 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {visibleMenuList.length === 0 && (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-5 py-8 text-center text-sm text-gray-500">
            No menu items match your search. Try a different keyword.
          </div>
        )}
      </div>
    </section>
  );
}
