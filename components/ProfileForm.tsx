'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';

import { useAuth } from './AuthProvider';

type Address = {
  id: string;
  label: string;
  address: string;
  createdAt?: string;
};

type ProfileFormProps = {
  profile: {
    name: string;
    email: string;
    phone: string;
    addresses: Address[];
    defaultAddressId: string | null;
  };
  onUpdated?: (profile: Partial<ProfileFormProps['profile']>) => void;
};

export default function ProfileForm({ profile, onUpdated }: ProfileFormProps) {
  const { token, refreshToken } = useAuth();
  const [form, setForm] = useState({ name: profile.name, phone: profile.phone });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({ name: profile.name, phone: profile.phone });
  }, [profile.name, profile.phone]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name: field, value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    const trimmedName = form.name.trim();
    const trimmedPhone = form.phone.trim();

    if (!trimmedName || !trimmedPhone) {
      setStatus('error');
      setMessage('Name and phone are required.');
      return;
    }

    const authToken = token ?? (await refreshToken(true));
    if (!authToken) {
      setStatus('error');
      setMessage('Authentication required. Please sign in again.');
      return;
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: trimmedName,
          phone: trimmedPhone
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setStatus('success');
      setMessage('Profile updated successfully.');
      onUpdated?.({
        name: data.name,
        phone: data.phone,
        addresses: data.addresses ?? profile.addresses,
        defaultAddressId:
          typeof data.defaultAddressId === 'string' || data.defaultAddressId === null
            ? data.defaultAddressId
            : profile.defaultAddressId
      });
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div>
        <label className="text-xs sm:text-sm font-medium text-gray-700" htmlFor="profile-name">
          Full Name
        </label>
        <input
          id="profile-name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm focus:border-brand-orange focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="text-xs sm:text-sm font-medium text-gray-700">Email</label>
        <input
          value={profile.email}
          type="email"
          disabled
          className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs sm:text-sm"
        />
      </div>

      <div>
        <label className="text-xs sm:text-sm font-medium text-gray-700" htmlFor="profile-phone">
          Phone
        </label>
        <input
          id="profile-phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm focus:border-brand-orange focus:outline-none"
          required
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-full bg-brand-orange px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-brand-dark disabled:opacity-70 transition-colors touch-manipulation"
      >
        {status === 'loading' ? 'Saving...' : 'Save Changes'}
      </button>

      {message && (
        <p className={`text-xs sm:text-sm ${status === 'error' ? 'text-red-500' : 'text-green-600'}`}>{message}</p>
      )}
    </form>
  );
}

