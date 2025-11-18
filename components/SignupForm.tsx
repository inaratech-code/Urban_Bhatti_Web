'use client';

import { FormEvent, useState, ChangeEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

import { firebaseAuth } from '../lib/firebaseAuthClient';
import { firestoreClient } from '../lib/firestoreClient';
import { useAuth } from './AuthProvider';

export default function SignupForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { refreshToken } = useAuth();

  const emailPattern = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);
  const phonePattern = useMemo(() => /^9[78]\d{8}$/, []); // Nepal mobile starting with 97/98 + 8 digits
  const passwordRules = 'At least 8 characters with uppercase, lowercase, and a number.';

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof typeof form, string>> = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Please enter your full name.';
    } else if (form.name.trim().length < 3) {
      nextErrors.name = 'Name should be at least 3 characters.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!emailPattern.test(form.email.trim().toLowerCase())) {
      nextErrors.email = 'Enter a valid email address (e.g. user@example.com).';
    }

    if (!form.phone.trim()) {
      nextErrors.phone = 'Phone number is required.';
    } else if (!phonePattern.test(form.phone.trim())) {
      nextErrors.phone = 'Enter a valid Nepali mobile number (starts with 97/98 and has 10 digits).';
    }

    if (!form.address.trim()) {
      nextErrors.address = 'Address is required.';
    } else if (form.address.trim().length < 5) {
      nextErrors.address = 'Add more detail so we can find you (min 5 characters).';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else {
      const pwd = form.password;
      if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/\d/.test(pwd)) {
        nextErrors.password = 'Use a stronger password with uppercase, lowercase, and a number.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) {
      setStatus('error');
      setMessage('Please review the highlighted fields.');
      return;
    }

    if (!firebaseAuth) {
      setMessage('Firebase authentication is not configured. Please check your environment variables.');
      setStatus('idle');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, form.email, form.password);
      const user = credential.user;
      await updateProfile(user, { displayName: form.name });
      
      if (!firestoreClient) {
        setMessage('Firestore is not configured. Please check your environment variables.');
        setStatus('error');
        return;
      }
      
      const primaryAddressId = crypto.randomUUID();
      await setDoc(doc(firestoreClient, 'users', user.uid), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        addresses: [
          {
            id: primaryAddressId,
            label: 'Primary',
            address: form.address,
            createdAt: new Date().toISOString()
          }
        ],
        defaultAddressId: primaryAddressId,
        role: 'guest',
        createdAt: serverTimestamp()
      });
      await refreshToken(true);

      setStatus('success');
      setMessage('Account created! Redirecting...');
      setForm({ name: '', email: '', phone: '', address: '', password: '' });
      router.push('/menu');
    } catch (error) {
      let errorMessage = 'Failed to register';
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered. Please sign in.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Please choose a stronger password (at least 6 characters).';
            break;
          default:
            errorMessage = 'Something went wrong while creating your account. Please try again.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setStatus('error');
      setMessage(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white px-4 py-6 shadow-sm" noValidate>
      <h3 className="text-lg font-semibold text-brand-dark">Join Urban Bhatti</h3>
      <p className="text-sm text-gray-600">Create an account to save your details and track orders.</p>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className={`mt-1 w-full rounded-lg border ${
              errors.name ? 'border-red-300 focus:border-red-400 focus:outline-none' : 'border-gray-200 focus:border-brand-orange focus:outline-none'
            } px-3 py-2 text-sm`}
            placeholder="Your name"
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className={`mt-1 w-full rounded-lg border ${
              errors.email ? 'border-red-300 focus:border-red-400 focus:outline-none' : 'border-gray-200 focus:border-brand-orange focus:outline-none'
            } px-3 py-2 text-sm`}
            placeholder="name@example.com"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={form.phone}
            onChange={handleChange}
            className={`mt-1 w-full rounded-lg border ${
              errors.phone ? 'border-red-300 focus:border-red-400 focus:outline-none' : 'border-gray-200 focus:border-brand-orange focus:outline-none'
            } px-3 py-2 text-sm`}
            placeholder="98XXXXXXXX"
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700" htmlFor="address">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            required
            value={form.address}
            onChange={handleChange}
            rows={2}
            className={`mt-1 w-full rounded-lg border ${
              errors.address ? 'border-red-300 focus:border-red-400 focus:outline-none' : 'border-gray-200 focus:border-brand-orange focus:outline-none'
            } px-3 py-2 text-sm`}
            placeholder="Street, City"
          />
          {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700" htmlFor="password">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              className={`w-full rounded-lg border pr-10 ${
                errors.password ? 'border-red-300 focus:border-red-400 focus:outline-none' : 'border-gray-200 focus:border-brand-orange focus:outline-none'
              } px-3 py-2 text-sm`}
              placeholder="At least 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.736m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">{passwordRules}</p>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-full bg-brand-orange px-4 py-2 font-semibold text-white shadow hover:bg-brand-dark disabled:opacity-70"
      >
        {status === 'loading' ? 'Creating account...' : 'Create Account'}
      </button>

      {message && (
        <p className={`text-sm ${status === 'error' ? 'text-red-500' : 'text-green-600'}`}>{message}</p>
      )}
    </form>
  );
}

