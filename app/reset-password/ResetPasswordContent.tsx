'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { sendPasswordResetEmail } from 'firebase/auth';

import { firebaseAuth } from '../../lib/firebaseAuthClient';

export default function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get('email') ?? '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailPattern = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Enter the email you used to create your account.');
      return;
    }
    if (!emailPattern.test(trimmedEmail)) {
      setError('Enter a valid email address (example: momo@urbanbhatti.com).');
      return;
    }

    if (!firebaseAuth) {
      setError('Firebase authentication is not configured. Please check your environment variables.');
      return;
    }

    setStatus('loading');
    try {
      await sendPasswordResetEmail(firebaseAuth, trimmedEmail, {
        url: `${window.location.origin}/signin`
      });
      setStatus('sent');
      setMessage("We've emailed you a reset link. It expires in 1 hour.");
    } catch (err) {
      setStatus('idle');
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
            setError('No account found with that email. Check for typos or sign up.');
            break;
          case 'auth/too-many-requests':
            setError('Too many requests. Wait a few minutes and try again.');
            break;
          default:
            setError('We could not send the reset email. Please try again later.');
        }
      } else {
        setError('We could not send the reset email. Please try again later.');
      }
      return;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-12">
      <section className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#111827] px-4 py-8 sm:px-6 sm:py-12 text-white shadow-sm">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 sm:gap-4 text-center">
          <span className="rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/70">
            Reset access
          </span>
          <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">Forgot your password?</h1>
          <p className="max-w-xl text-xs sm:text-sm text-white/80 px-2">
            Enter your email and we&apos;ll send a one-time link to get you back into your account.
          </p>
        </div>
      </section>

      <section className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-[#d1d8ff] bg-white p-4 sm:p-6 md:p-8 shadow-sm"
          noValidate
        >
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`mt-1.5 block w-full rounded-md border ${
                error ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-brand-orange focus:ring-brand-orange'
              } px-3 py-2.5 text-base shadow-sm sm:text-sm`}
              placeholder="name@example.com"
              aria-describedby={error ? 'reset-email-error' : undefined}
              aria-invalid={Boolean(error)}
              required
            />
            <p className="mt-1.5 text-xs text-gray-500">
              We&apos;ll send instructions to this email if it matches your Urban Bhatti account.
            </p>
            {error && (
              <p id="reset-email-error" className="mt-2 text-xs text-red-500">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-full bg-brand-orange px-4 py-3 text-sm font-semibold text-white shadow hover:bg-brand-dark disabled:opacity-70 touch-manipulation"
          >
            {status === 'loading' ? 'Sending link…' : 'Email me a reset link'}
          </button>

          {message && <p className="text-xs sm:text-sm text-emerald-600">{message}</p>}

          <div className="text-xs sm:text-sm text-gray-600">
            <p>
              Remembered your password?{' '}
              <Link href="/signin" className="font-semibold text-brand-orange hover:underline">
                Back to sign in
              </Link>
            </p>
            <p className="mt-2">
              Need help?{' '}
              <Link href="mailto:info@urbanbhatti.com" className="font-semibold text-brand-orange hover:underline">
                Contact support
              </Link>
            </p>
          </div>
        </form>

        <div className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Security tips</h2>
          <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
            <li className="rounded-xl sm:rounded-2xl bg-[#f8fafc] p-3 sm:p-4">Use unique passwords for Urban Bhatti and other sites.</li>
            <li className="rounded-xl sm:rounded-2xl bg-[#f8fafc] p-3 sm:p-4">Never share the reset link—it expires after it&apos;s used once.</li>
            <li className="rounded-xl sm:rounded-2xl bg-[#f8fafc] p-3 sm:p-4">
              Didn&apos;t request a reset? Ignore the email or change your password immediately.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}


