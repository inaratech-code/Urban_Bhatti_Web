'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { sendPasswordResetEmail, updateEmail, EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth';

import { useAdminAuth } from '../../../components/AuthProvider';
import { firebaseAuth } from '../../../lib/firebaseAuthClient';
import DatabaseCleanup from '../../../components/DatabaseCleanup';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, role, loading } = useAdminAuth();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Email change state
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || role !== 'admin') {
    router.replace('/signin?callbackUrl=/admin/settings');
    return null;
  }

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!user.email) {
      setError('No email address found for your account.');
      return;
    }

    if (!firebaseAuth) {
      setError('Firebase authentication is not configured. Please check your environment variables.');
      return;
    }

    setStatus('loading');
    try {
      await sendPasswordResetEmail(firebaseAuth, user.email, {
        url: `${window.location.origin}/signin`,
        handleCodeInApp: false
      });
      setStatus('success');
      setMessage('Password reset email sent! Check your inbox and click the link to set a new password. The link expires in 1 hour.');
    } catch (err) {
      setStatus('error');
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
            setError('No account found with that email.');
            break;
          case 'auth/too-many-requests':
            setError('Too many requests. Please wait a few minutes and try again.');
            break;
          default:
            setError('Failed to send password reset email. Please try again later.');
        }
      } else {
        setError('Failed to send password reset email. Please try again later.');
      }
    }
  };

  const handleChangeEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError(null);
    setEmailMessage(null);

    if (!user || !user.email) {
      setEmailError('No user account found.');
      return;
    }

    const trimmedNewEmail = newEmail.trim().toLowerCase();
    if (!trimmedNewEmail) {
      setEmailError('Please enter a new email address.');
      return;
    }

    if (trimmedNewEmail === user.email.toLowerCase()) {
      setEmailError('New email must be different from current email.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedNewEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setEmailError('Please enter your current password to verify your identity.');
      return;
    }

    setEmailStatus('loading');
    try {
      // Re-authenticate user before changing email
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Update email in Firebase Auth
      await updateEmail(user, trimmedNewEmail);
      
      // Update email in Firestore users collection if it exists
      try {
        const authToken = user.getIdToken();
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await authToken}`
          },
          body: JSON.stringify({
            email: trimmedNewEmail
          })
        });
        // Don't fail if Firestore update fails - Auth email is already updated
        if (!response.ok) {
          console.warn('Failed to update email in Firestore, but Auth email was updated');
        }
      } catch (err) {
        console.warn('Error updating email in Firestore:', err);
      }
      
      setEmailStatus('success');
      setEmailMessage(`Email successfully changed to ${trimmedNewEmail}. Signing you out...`);
      setNewEmail('');
      setPassword('');
      setShowEmailForm(false);
      
      // Sign out and redirect to sign in after a delay
      setTimeout(async () => {
        try {
          if (firebaseAuth) {
            await signOut(firebaseAuth);
          }
        } catch (err) {
          console.error('Error signing out:', err);
        }
        router.push('/signin');
      }, 2000);
    } catch (err) {
      setEmailStatus('error');
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            setEmailError('This email is already in use by another account.');
            break;
          case 'auth/invalid-email':
            setEmailError('Invalid email address format.');
            break;
          case 'auth/wrong-password':
            setEmailError('Incorrect password. Please try again.');
            break;
          case 'auth/weak-password':
            setEmailError('Password is too weak.');
            break;
          case 'auth/requires-recent-login':
            setEmailError('For security, please sign out and sign in again, then try changing your email.');
            break;
          case 'auth/too-many-requests':
            setEmailError('Too many requests. Please wait a few minutes and try again.');
            break;
          default:
            setEmailError(err.message || 'Failed to change email. Please try again.');
        }
      } else {
        setEmailError('Failed to change email. Please try again.');
      }
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white shadow-md overflow-hidden w-full" data-admin-page>
      {/* Header */}
      <section className="bg-gradient-to-r from-[#7f1d1d] via-[#6b1717] to-[#4c0f0f] py-8 px-8 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <div>
              <h1 className="text-4xl font-bold">Admin Settings</h1>
              <h2 className="text-3xl font-bold text-white mt-2">
                Urban Bhatti
              </h2>
            </div>
            <p className="text-base text-white/80">
              Manage your admin account settings and security preferences.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="px-4 py-8">
            <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
          <p className="mt-2 text-sm text-gray-500">Your admin account details</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Email Address
              </label>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-gray-900 break-all">{user.email || 'Not available'}</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailForm(!showEmailForm);
                    setEmailError(null);
                    setEmailMessage(null);
                    setNewEmail('');
                    setPassword('');
                  }}
                  className="flex-shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {showEmailForm ? 'Cancel' : 'Change Email'}
                </button>
              </div>
            </div>

            {showEmailForm && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Change Email Address</h3>
                <form onSubmit={handleChangeEmail} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      New Email Address
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="newemail@example.com"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Current Password (for verification)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={emailStatus === 'loading'}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {emailStatus === 'loading' ? 'Changing email...' : 'Update Email'}
                  </button>
                  
                  {emailMessage && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                      <p className="font-semibold">✓ {emailMessage}</p>
                    </div>
                  )}
                  
                  {emailError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                      <p className="font-semibold">Error: {emailError}</p>
                    </div>
                  )}
                </form>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Display Name
              </label>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {user.displayName || 'Urban Bhatti Admin'}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Role
              </label>
              <p className="mt-1 text-base font-semibold text-gray-900">Administrator</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
          <p className="mt-2 text-sm text-gray-500">
            We'll send you a secure link via email to reset your password. Click the link in the email to set a new password.
          </p>

          <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600 break-words">
                A password reset link will be sent to: <strong className="break-all">{user.email}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Click the link in the email to change your password. The link expires in 1 hour.
              </p>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-full bg-brand-orange px-4 py-3 text-sm font-semibold text-white shadow hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'loading' ? 'Sending email...' : 'Send Password Reset Email'}
            </button>

            {message && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <p className="font-semibold">✓ Email sent successfully!</p>
                <p className="mt-1">{message}</p>
                <p className="mt-2 text-xs text-emerald-600">
                  Check your inbox and click the link in the email to change your password. You can change your password anytime using this method.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                <p className="font-semibold">Error</p>
                <p className="mt-1">{error}</p>
              </div>
            )}
          </form>

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-700">Security Tips</h3>
            <ul className="mt-2 space-y-1 text-xs text-gray-600">
              <li>• The password reset link expires after 1 hour</li>
              <li>• Use a strong, unique password</li>
              <li>• Never share your password or reset link</li>
              <li>• If you didn't request this, ignore the email</li>
            </ul>
          </div>
        </div>

        {/* Database Cleanup Section */}
        <div className="lg:col-span-2">
          <DatabaseCleanup />
        </div>
      </div>
      </div>
    </div>
  );
}

