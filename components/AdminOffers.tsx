'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';

import { useAdminAuth } from './AuthProvider';

type Offer = {
  _id: string;
  title: string;
  description: string;
  highlight: string;
  imageUrl: string;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
};

type OfferFormState = {
  title: string;
  description: string;
  highlight: string;
  imageUrl: string;
  validFrom: string;
  validTo: string;
};

const emptyForm: OfferFormState = {
  title: '',
  description: '',
  highlight: '',
  imageUrl: '',
  validFrom: '',
  validTo: ''
};

export default function AdminOffers() {
  const { token, refreshToken } = useAdminAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [form, setForm] = useState<OfferFormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const authToken = token ?? (await refreshToken(true));
      if (!authToken) {
        setMessage('Authentication required to manage offers.');
        return;
      }

      const response = await fetch('/api/admin/offers', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load offers');
      }

      setOffers(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const authToken = token ?? (await refreshToken(true));
      if (!authToken) {
        setMessage('Authentication required to manage offers.');
        return;
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        highlight: form.highlight.trim(),
        imageUrl: form.imageUrl.trim(),
        validFrom: form.validFrom || null,
        validTo: form.validTo || null
      };

      const response = await fetch('/api/admin/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create offer');
      }

      setOffers((prev) => [data as Offer, ...prev]);
      setForm(emptyForm);
      setMessage('Offer created successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create offer');
    } finally {
      setSubmitting(false);
    }
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
        setMessage('Image uploaded. It will be used in the offer popup.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggle = async (offer: Offer) => {
    try {
      const authToken = token ?? (await refreshToken(true));
      if (!authToken) {
        setMessage('Authentication required to manage offers.');
        return;
      }

      const nextActive = !offer.isActive;

      // optimistic update
      setOffers((prev) =>
        prev.map((entry) =>
          entry._id === offer._id ? { ...entry, isActive: nextActive } : entry
        )
      );

      const response = await fetch('/api/admin/offers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ id: offer._id, isActive: nextActive })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update offer');
      }

      const updated = data as Offer;
      setOffers((prev) =>
        prev.map((entry) => (entry._id === updated._id ? updated : entry))
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update offer');
      // revert on error
      setOffers((prev) =>
        prev.map((entry) =>
          entry._id === offer._id ? { ...entry, isActive: offer.isActive } : entry
        )
      );
    }
  };

  const handleDelete = async (offer: Offer) => {
    if (!window.confirm('Delete this offer?')) return;

    try {
      const authToken = token ?? (await refreshToken(true));
      if (!authToken) {
        setMessage('Authentication required to manage offers.');
        return;
      }

      const response = await fetch('/api/admin/offers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ id: offer._id })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete offer');
      }

      setOffers((prev) => prev.filter((entry) => entry._id !== offer._id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete offer');
    }
  };

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-r from-[#7f1d1d] via-[#6b1717] to-[#4c0f0f] py-8 px-8 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Offers & Promotions</h1>
            <p className="text-base text-white/80">
              Highlight limited-time deals on the customer menu page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchOffers()}
            disabled={loading}
            className="rounded-full border border-white/40 px-6 py-3 text-base font-semibold text-white hover:bg-white/10 disabled:opacity-60"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </section>

      {/* Content */}
      <div className="px-4 py-8 space-y-6">

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-6 py-6 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-brand-orange focus:outline-none"
            placeholder="Offer title"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Highlight</label>
          <input
            value={form.highlight}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, highlight: event.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-brand-orange focus:outline-none"
            placeholder="Offer description"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Promo Image URL</label>
          <input
            value={form.imageUrl}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, imageUrl: event.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-brand-orange focus:outline-none"
            placeholder="Image URL"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Upload Image (JPG or PNG)</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            onChange={handleImageUpload}
            className="mt-1 block w-full text-xs text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-orange file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-dark"
          />
          {form.imageUrl && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2">
              <span className="text-[10px] font-semibold text-gray-500">Preview</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.imageUrl}
                alt="Offer preview"
                className="h-10 w-10 rounded-lg object-cover"
              />
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Valid From</label>
          <input
            type="date"
            value={form.validFrom}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, validFrom: event.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-brand-orange focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Valid To</label>
          <input
            type="date"
            value={form.validTo}
            onChange={(event) => setForm((prev) => ({ ...prev, validTo: event.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-brand-orange focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-brand-orange focus:outline-none"
            placeholder="Details about the offer, terms and conditions…"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-brand-orange px-5 py-2 text-xs font-semibold text-white shadow hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Add Offer'}
          </button>
          {message && <p className="text-xs text-gray-600">{message}</p>}
        </div>
      </form>

      <div className="space-y-3">
        {offers.length === 0 && !loading && (
          <p className="text-xs text-gray-500">No offers yet. Create your first one above.</p>
        )}
        {offers.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {offers.map((offer) => (
              <article
                key={offer._id}
                className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white/95 p-4 text-xs shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-brand-dark">{offer.title}</h3>
                    {offer.highlight && (
                      <p className="text-[11px] font-semibold text-brand-orange">
                        {offer.highlight}
                      </p>
                    )}
                    {offer.description && (
                      <p className="text-[11px] text-gray-600 whitespace-pre-line">
                        {offer.description}
                      </p>
                    )}
                    {(offer.validFrom || offer.validTo) && (
                      <p className="text-[11px] text-gray-500">
                        {offer.validFrom && `From ${offer.validFrom}`}
                        {offer.validFrom && offer.validTo && ' · '}
                        {offer.validTo && `Until ${offer.validTo}`}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => void handleToggle(offer)}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        offer.isActive
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(offer)}
                      className="text-[11px] font-semibold text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}


