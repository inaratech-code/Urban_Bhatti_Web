'use client';

import { useMemo, useState } from 'react';

import { useAuth } from './AuthProvider';

type Address = {
  id: string;
  label: string;
  address: string;
  createdAt?: string;
};

type AddressBookProps = {
  addresses: Address[];
  defaultAddressId: string | null;
  onChange: (data: { addresses: Address[]; defaultAddressId: string | null }) => void;
};

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function AddressBook({ addresses, defaultAddressId, onChange }: AddressBookProps) {
  const { token, refreshToken } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<{ label: string; address: string }>({
    label: '',
    address: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const sortedAddresses = useMemo(
    () =>
      [...addresses].sort((a, b) => {
        const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bTime - aTime;
      }),
    [addresses]
  );

  const request = async (method: 'POST' | 'PATCH' | 'DELETE', body: Record<string, unknown>) => {
    setStatus('loading');
    setMessage(null);
    const authToken = token ?? (await refreshToken(true));
    if (!authToken) {
      setStatus('error');
      setMessage('Please sign in again.');
      return null;
    }

    try {
      const response = await fetch('/api/profile/addresses', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      setStatus('success');
      onChange({
        addresses: Array.isArray(data.addresses) ? data.addresses : [],
        defaultAddressId:
          typeof data.defaultAddressId === 'string' || data.defaultAddressId === null
            ? data.defaultAddressId
            : null
      });
      const successMessage =
        method === 'POST'
          ? 'Address added.'
          : method === 'DELETE'
          ? 'Address removed.'
          : 'Address updated.';
      setMessage(successMessage);
      return data;
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Request failed');
      return null;
    }
  };

  const handleAdd = async () => {
    if (!newAddress.trim()) {
      setMessage('Address cannot be empty.');
      setStatus('error');
      return;
    }
    await request('POST', { label: newLabel.trim(), address: newAddress.trim() });
    setNewLabel('');
    setNewAddress('');
    setShowAddForm(false); // Close form after adding on mobile
  };

  const handleDelete = async (id: string) => {
    await request('DELETE', { id });
  };

  const handleMakeDefault = async (id: string) => {
    if (id === defaultAddressId) return;
    await request('PATCH', { id, makeDefault: true });
  };

  const startEditing = (entry: Address) => {
    setEditingId(entry.id);
    setEditingValue({ label: entry.label, address: entry.address });
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    if (!editingValue.address.trim()) {
      setStatus('error');
      setMessage('Address cannot be empty.');
      return;
    }
    await request('PATCH', {
      id: editingId,
      label: editingValue.label.trim(),
      address: editingValue.address.trim()
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <div>
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-brand-dark">Saved Addresses</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Add multiple delivery addresses and pick one during checkout.
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {sortedAddresses.length === 0 && (
          <div className="rounded-lg sm:rounded-xl border border-gray-100 bg-gray-50 p-3 sm:p-4 text-xs sm:text-sm text-gray-500">
            No saved addresses yet. Add your first address below.
          </div>
        )}

        {sortedAddresses.map((entry) => {
          const isDefault = entry.id === defaultAddressId;
          const isEditing = editingId === entry.id;
          return (
            <div
              key={entry.id}
              className="rounded-lg sm:rounded-xl border border-gray-100 bg-white p-3 sm:p-4 shadow-sm transition hover:border-brand-orange/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  {isEditing ? (
                    <>
                      <input
                        value={editingValue.label}
                        onChange={(event) =>
                          setEditingValue((prev) => ({ ...prev, label: event.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm focus:border-brand-orange focus:outline-none"
                        placeholder="Label (Home, Office...)"
                      />
                      <textarea
                        value={editingValue.address}
                        onChange={(event) =>
                          setEditingValue((prev) => ({ ...prev, address: event.target.value }))
                        }
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm focus:border-brand-orange focus:outline-none"
                        placeholder="Delivery address"
                      />
                    </>
                  ) : (
                    <>
                      <p className="text-xs sm:text-sm font-semibold text-brand-dark break-words">
                        {entry.label || 'Saved address'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 whitespace-pre-line break-words">{entry.address}</p>
                    </>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 text-xs w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleMakeDefault(entry.id)}
                    className={`rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold transition-colors touch-manipulation ${
                      isDefault
                        ? 'bg-brand-orange text-white'
                        : 'border border-gray-200 text-gray-600 hover:border-brand-orange hover:text-brand-orange'
                    }`}
                  >
                    {isDefault ? 'Default' : 'Set Default'}
                  </button>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={handleEditSave}
                          className="flex-1 sm:flex-none rounded-full border border-brand-orange px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-brand-orange hover:bg-brand-orange hover:text-white transition-colors touch-manipulation"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="flex-1 sm:flex-none rounded-full border border-gray-200 px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-gray-500 hover:border-gray-400 transition-colors touch-manipulation"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(entry)}
                          className="flex-1 sm:flex-none rounded-full border border-gray-200 px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-gray-600 hover:border-brand-orange hover:text-brand-orange transition-colors touch-manipulation"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="flex-1 sm:flex-none rounded-full border border-red-200 px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold text-red-500 hover:bg-red-500 hover:text-white transition-colors touch-manipulation"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg sm:rounded-xl border border-dashed border-brand-orange/40 bg-brand-orange/5 overflow-hidden">
        {/* Mobile: Collapsible header button */}
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full sm:hidden flex items-center justify-between p-3 text-left"
        >
          <h3 className="text-xs font-semibold text-brand-dark">Add New Address</h3>
          <svg
            className={`w-4 h-4 text-brand-dark transition-transform ${showAddForm ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Desktop: Always visible header */}
        <h3 className="hidden sm:block text-xs sm:text-sm font-semibold text-brand-dark p-3 sm:p-4 pb-0 sm:pb-0">Add New Address</h3>

        {/* Form content - hidden on mobile when collapsed, always visible on desktop */}
        <div className={`${showAddForm ? 'block' : 'hidden'} sm:block space-y-3 p-3 sm:p-4 ${showAddForm ? 'pt-0' : 'sm:pt-4'}`}>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm focus:border-brand-orange focus:outline-none"
              placeholder="Label (Home, Office...)"
            />
            <textarea
              value={newAddress}
              onChange={(event) => setNewAddress(event.target.value)}
              rows={2}
              className="sm:col-span-2 rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm focus:border-brand-orange focus:outline-none"
              placeholder="Full delivery address"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={status === 'loading'}
            className="w-full sm:w-auto rounded-full bg-brand-orange px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-brand-dark disabled:opacity-70 transition-colors touch-manipulation"
          >
            {status === 'loading' ? 'Saving...' : 'Add Address'}
          </button>
          {message && <p className={`text-xs sm:text-sm ${status === 'error' ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
        </div>
      </div>
    </div>
  );
}


