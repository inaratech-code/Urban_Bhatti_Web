'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  confirmPasswordReset,
  verifyPasswordResetCode,
  type Auth,
  type User as FirebaseUser
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { firebaseAuth } from '../../lib/firebaseAuthClient';
import { firebaseAdminAuth } from '../../lib/firebaseAdminAuthClient';
import { useAuth, useAdminAuth } from '../../components/AuthProvider';
import { firestoreClient } from '../../lib/firestoreClient';
import { HARDCODED_ADMIN_UIDS } from '../../lib/adminUids';

const roleTabs: Array<{ label: string; value: 'guest' | 'admin'; description: string }> = [
  {
    label: "I'm ordering food",
    value: 'guest',
    description: 'Access your saved addresses, cart, and order history.'
  },
  {
    label: 'I manage the restaurant',
    value: 'admin',
    description: 'Update the menu, track orders, and monitor sales performance.'
  }
];

export default function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'guest' | 'admin'>('guest');
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const { refreshToken: refreshUserToken } = useAuth();
  const { refreshToken: refreshAdminToken } = useAdminAuth();

  // Password reset state
  const [resetMode, setResetMode] = useState<'signin' | 'reset'>('signin');
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetStatus, setResetStatus] = useState<'idle' | 'verifying' | 'ready' | 'resetting' | 'success'>('idle');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const callbackParam = searchParams.get('callbackUrl');
  const oobCode = searchParams.get('oobCode');
  const actionMode = searchParams.get('mode');
  const showAdminOption = searchParams.get('admin') === 'true' || (callbackParam?.startsWith('/admin') ?? false);

  // Set initial mode based on callback URL or admin param
  useEffect(() => {
    if (showAdminOption) {
      setMode('admin');
    } else {
      setMode('guest');
    }
  }, [showAdminOption]);

  const emailPattern = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);
  const passwordHints = 'Use at least 6 characters, including a number.';
  const googleProvider = useMemo(() => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  }, []);

  // Handle password reset link
  useEffect(() => {
    if (oobCode && actionMode === 'resetPassword') {
      setResetMode('reset');
      setResetCode(oobCode);
      setResetStatus('verifying');
      
      // Verify the reset code and get the email
      if (!firebaseAuth) {
        setResetError('Firebase authentication is not configured. Please check your environment variables.');
        setResetStatus('idle');
        return;
      }
      verifyPasswordResetCode(firebaseAuth, oobCode)
        .then((email) => {
          setResetEmail(email);
          setResetStatus('ready');
        })
        .catch((error) => {
          console.error('Password reset verification error:', error);
          setResetStatus('idle');
          if (error instanceof FirebaseError) {
            switch (error.code) {
              case 'auth/expired-action-code':
                setResetError('The password reset link has expired. Please request a new one.');
                break;
              case 'auth/invalid-action-code':
                setResetError('The password reset link is invalid. Please request a new one.');
                break;
              default:
                setResetError('Failed to verify password reset link. Please try again.');
            }
          } else {
            setResetError('Failed to verify password reset link. Please try again.');
          }
        });
    }
  }, [oobCode, actionMode]);

  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetError(null);

    if (!newPassword || !confirmPassword) {
      setResetError('Please enter and confirm your new password.');
      return;
    }

    if (newPassword.length < 6 || !/\d/.test(newPassword)) {
      setResetError('Password must be at least 6 characters and include a number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please try again.');
      return;
    }

    if (!resetCode) {
      setResetError('Reset code is missing. Please request a new password reset link.');
      return;
    }

    if (!firebaseAuth) {
      setResetError('Firebase authentication is not configured. Please check your environment variables.');
      return;
    }

    setResetStatus('resetting');
    try {
      await confirmPasswordReset(firebaseAuth, resetCode, newPassword);
      setResetStatus('success');
      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        router.replace('/signin');
      }, 2000);
    } catch (error) {
      setResetStatus('ready');
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/expired-action-code':
            setResetError('The password reset link has expired. Please request a new one.');
            break;
          case 'auth/invalid-action-code':
            setResetError('The password reset link is invalid. Please request a new one.');
            break;
          case 'auth/weak-password':
            setResetError('Password is too weak. Please choose a stronger password.');
            break;
          default:
            setResetError('Failed to reset password. Please try again.');
        }
      } else {
        setResetError('Failed to reset password. Please try again.');
      }
    }
  };

  const ensureUserProfile = useCallback(async (user: FirebaseUser) => {
    if (!user.email || !firestoreClient) return;
    const profileRef = doc(firestoreClient, 'users', user.uid);
    const snapshot = await getDoc(profileRef);
    if (!snapshot.exists()) {
      await setDoc(profileRef, {
        name: user.displayName ?? user.email?.split('@')[0] ?? 'Guest',
        email: user.email,
        phone: user.phoneNumber ?? '',
        address: '',
        role: 'guest',
        createdAt: serverTimestamp()
      });
    }
  }, []);

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!emailPattern.test(form.email.trim().toLowerCase())) {
      nextErrors.email = 'Enter a valid email address (e.g. user@example.com).';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (form.password.length < 6 || !/\d/.test(form.password)) {
      nextErrors.password = 'Password must be at least 6 characters and include a number.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      setMessage('Please fix the highlighted fields.');
      return;
    }

    setStatus('loading');
    setMessage(null);

    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      const targetAuth: Auth | null = mode === 'admin' ? firebaseAdminAuth : firebaseAuth;
      
      if (!targetAuth) {
        setMessage('Firebase authentication is not configured. Please check your environment variables.');
        setStatus('idle');
        return;
      }
      
      const refresh = mode === 'admin' ? refreshAdminToken : refreshUserToken;

      const userCredential = await signInWithEmailAndPassword(targetAuth, normalizedEmail, form.password);
      const currentUser = userCredential.user;
      
      try {
        await refresh(true);
      } catch (refreshError) {
        console.warn('Token refresh failed, continuing with sign-in:', refreshError);
        // Continue even if refresh fails
      }

      let tokenResult;
      try {
        tokenResult = await currentUser.getIdTokenResult(true);
      } catch (tokenError) {
        console.error('Failed to get token result:', tokenError);
        setMessage('Failed to verify authentication. Please try again.');
        return;
      }
      
      const role = (tokenResult.claims.role as 'admin' | 'guest' | undefined) ?? 'guest';
      const isHardcodedAdmin = HARDCODED_ADMIN_UIDS.has(currentUser.uid);
      const isAdminAccount = role === 'admin' || isHardcodedAdmin;

      if (mode === 'admin' && !isAdminAccount) {
        await signOut(targetAuth);
        setMessage('This account does not have admin access.');
        return;
      }

      try {
        await ensureUserProfile(currentUser);
      } catch (profileError) {
        console.warn('Failed to ensure user profile, continuing:', profileError);
        // Continue even if profile creation fails
      }

      // Clear any error messages before redirecting
      setMessage(null);
      setErrors({});
      
      const goToAdmin = mode === 'admin' || isAdminAccount;
      // Redirect to cart page for regular users, admin dashboard for admins
      const destination = goToAdmin ? '/admin' : callbackParam || '/cart';
      
      // Use replace to avoid back navigation issues and clear state immediately
      router.replace(destination);
    } catch (error) {
      console.error('Sign-in error:', error);
      const fallbackMessage = 'The email or password you entered is incorrect.';
      if (error instanceof FirebaseError) {
        console.error('Firebase error code:', error.code, error.message);
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
          case 'auth/user-not-found':
          case 'auth/invalid-email':
            setMessage(fallbackMessage);
            break;
          case 'auth/too-many-requests':
            setMessage('Too many attempts. Please try again later.');
            break;
          case 'auth/network-request-failed':
            setMessage('Network error. Please check your connection and try again.');
            break;
          case 'auth/internal-error':
            setMessage('An internal error occurred. Please try again later.');
            break;
          default:
            setMessage(`Sign-in failed: ${error.message || error.code || 'Unknown error'}. Please try again.`);
        }
      } else if (error instanceof Error) {
        setMessage(`Error: ${error.message}. Please try again.`);
      } else {
        setMessage('Something went wrong while signing you in. Please try again.');
      }
    } finally {
      setStatus('idle');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrors({});
    setMessage(null);
    setStatus('loading');

    try {
      const targetAuth: Auth | null = mode === 'admin' ? firebaseAdminAuth : firebaseAuth;
      
      if (!targetAuth) {
        setMessage('Firebase authentication is not configured. Please check your environment variables.');
        setStatus('idle');
        return;
      }
      
      const refresh = mode === 'admin' ? refreshAdminToken : refreshUserToken;

      const credential = await signInWithPopup(targetAuth, googleProvider);
      const user = credential.user;
      await ensureUserProfile(user);
      await refresh(true);

      const tokenResult = await user.getIdTokenResult(true);
      const role = (tokenResult.claims.role as 'admin' | 'guest' | undefined) ?? 'guest';
      const isHardcodedAdmin = HARDCODED_ADMIN_UIDS.has(user.uid);
      const isAdminAccount = role === 'admin' || isHardcodedAdmin;
      if (mode === 'admin' && !isAdminAccount) {
        await signOut(targetAuth);
        setMessage('This Google account does not have admin access.');
        return;
      }
      
      // Clear any error messages before redirecting
      setMessage(null);
      setErrors({});
      
      const goToAdmin = mode === 'admin' || isAdminAccount;
      // Redirect to cart page for regular users, admin dashboard for admins
      const destination = goToAdmin ? '/admin' : callbackParam || '/cart';
      
      // Use replace to avoid back navigation issues and clear state immediately
      router.replace(destination);
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/popup-closed-by-user') {
          setMessage('Google sign-in was cancelled.');
        } else if (error.code === 'auth/cancelled-popup-request') {
          setMessage('Another sign-in is already in progress. Please try again.');
        } else {
          setMessage('Could not sign you in with Google. Please try email/password.');
        }
      } else {
        setMessage('Could not sign you in with Google. Please try email/password.');
      }
    } finally {
      setStatus('idle');
    }
  };

  const isSubmitDisabled = status === 'loading';

  const handleForgotPassword = () => {
    router.push(`/reset-password?email=${encodeURIComponent(form.email.trim())}`);
  };

  // Show password reset form if reset mode is active
  if (resetMode === 'reset') {
    return (
      <div className="space-y-6 sm:space-y-8 md:space-y-12">
        <section className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#7f1d1d] via-[#6b1717] to-[#4c0f0f] px-4 py-8 sm:px-6 sm:py-12 text-white shadow-sm">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 sm:gap-4 text-center">
            <span className="hidden sm:inline-flex rounded-full border border-white/40 px-3 py-1 text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/80">
              Reset Password
            </span>
            <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">Set New Password</h1>
            <p className="hidden sm:block max-w-xl text-xs sm:text-sm text-white/80 px-2">
              Enter your new password below. Make sure it's strong and secure.
            </p>
            <p className="sm:hidden max-w-xl text-xs text-white/80 px-2">
              Enter your new password below.
            </p>
          </div>
        </section>

        <section className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-[#f4c6a5] bg-[#fff7f2] p-4 sm:p-6 md:p-8 shadow-sm">
            {resetStatus === 'verifying' && (
              <div className="text-center py-6 sm:py-8">
                <p className="text-sm text-gray-600">Verifying reset link...</p>
              </div>
            )}

            {resetStatus === 'success' && (
              <div className="space-y-3 sm:space-y-4 rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-6 text-center">
                <p className="text-base sm:text-lg font-semibold text-emerald-700">✓ Password Reset Successful!</p>
                <p className="text-xs sm:text-sm text-emerald-600">
                  Your password has been updated. Redirecting to sign in...
                </p>
              </div>
            )}

            {(resetStatus === 'ready' || resetStatus === 'resetting') && (
              <form onSubmit={handlePasswordReset} className="space-y-4 sm:space-y-5" noValidate>
                <div className="rounded-xl sm:rounded-2xl border border-gray-100 bg-white/80 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-600 break-words">
                    Resetting password for: <strong className="break-all">{resetEmail}</strong>
                  </p>
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="new-password"
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 pr-10 px-3 py-2.5 text-base shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? (
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
                  <p className="mt-1.5 text-xs text-gray-500">{passwordHints}</p>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirm-password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 pr-10 px-3 py-2.5 text-base shadow-sm focus:border-brand-orange focus:ring-brand-orange sm:text-sm"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
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
                </div>

                {resetError && (
                  <div className="rounded-xl sm:rounded-2xl border border-red-200 bg-red-50 p-3 sm:p-4 text-xs sm:text-sm text-red-600">
                    {resetError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetStatus === 'resetting'}
                  className="w-full rounded-full bg-brand-orange px-4 py-3 text-sm font-semibold text-white shadow hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 disabled:opacity-70 touch-manipulation"
                >
                  {resetStatus === 'resetting' ? 'Resetting Password...' : 'Reset Password'}
                </button>

                <div className="text-center text-xs sm:text-sm text-gray-600">
                  <Link href="/signin" className="font-semibold text-brand-orange hover:underline">
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}

            {resetError && resetStatus === 'idle' && (
              <div className="space-y-4">
                <div className="rounded-xl sm:rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-6 text-center">
                  <p className="text-xs sm:text-sm text-red-600">{resetError}</p>
                </div>
                <div className="text-center">
                  <Link
                    href="/reset-password"
                    className="inline-block rounded-full bg-brand-orange px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-dark touch-manipulation"
                  >
                    Request New Reset Link
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:block rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Password Security Tips</h2>
            <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
              <li className="rounded-xl sm:rounded-2xl bg-[#fff7f2] p-3 sm:p-4">Use at least 6 characters with a mix of letters and numbers</li>
              <li className="rounded-xl sm:rounded-2xl bg-[#fff7f2] p-3 sm:p-4">Avoid using personal information like your name or email</li>
              <li className="rounded-xl sm:rounded-2xl bg-[#fff7f2] p-3 sm:p-4">Don't reuse passwords from other accounts</li>
            </ul>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-br from-[#7f1d1d] via-[#6b1717] to-[#4c0f0f] px-4 py-6 sm:px-6 sm:py-12 text-white shadow-sm">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 sm:gap-4 text-center">
          <span className="hidden sm:inline-flex rounded-full border border-white/40 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/80">
            Welcome back
          </span>
          <h1 className="text-xl sm:text-3xl font-bold md:text-4xl">Sign in to Urban Bhatti</h1>
          <p className="hidden sm:block max-w-xl text-sm text-white/80">
            Access your saved favourites, track orders in real time, or jump into the admin dashboard to keep the kitchen running smoothly.
          </p>
          <p className="sm:hidden max-w-xl text-xs text-white/80">
            Access your saved favourites and track orders in real time.
          </p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6 rounded-3xl border border-[#f4c6a5] bg-[#fff7f2] p-2 sm:p-8 shadow-sm">
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={status === 'loading'}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-5 sm:px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-brand-orange hover:text-brand-dark disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.5 544.3" className="h-5 w-5">
                <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.4H272v95.4h147.5c-6.4 34.5-25.7 63.7-54.6 83.2v68h88.4c51.7-47.6 80.2-117.8 80.2-196.2z" />
                <path fill="#34a853" d="M272 544.3c73.6 0 135.3-24.4 180.3-66.1l-88.4-68c-24.6 16.5-56.1 26.2-91.9 26.2-70.7 0-130.6-47.7-152-111.8h-90.5v70.2c44.3 87.6 134.9 149.5 242.5 149.5z" />
                <path fill="#fbbc04" d="M120 324.6c-10.8-32.6-10.8-67.8 0-100.4v-70.2H29.5c-39.7 79.4-39.7 171.4 0 250.8z" />
                <path fill="#ea4335" d="M272 107.7c38.8-.6 75.7 14.6 103.7 41.8l77.4-77.4C407.2 24.1 344.2-.2 272 0 164.4 0 73.8 61.9 29.5 149.5l90.5 70.2C141.4 155.4 201.3 107.7 272 107.7z" />
              </svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-gray-400">
              <span className="h-px flex-1 bg-[#f4c6a5]" />
              <span>Or email</span>
              <span className="h-px flex-1 bg-[#f4c6a5]" />
            </div>
          </div>

          {showAdminOption && (
            <div className="grid gap-3 sm:grid-cols-2">
              {roleTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setMode(tab.value);
                    setMessage(null);
                    setErrors({});
                  }}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    mode === tab.value
                      ? 'border-brand-orange bg-white text-brand-dark shadow'
                      : 'border-transparent bg-white/60 text-gray-500 hover:border-brand-orange/60'
                  }`}
                >
                  <p className="text-sm font-semibold">{tab.label}</p>
                  <p className="mt-1 text-xs text-gray-500">{tab.description}</p>
                </button>
              ))}
            </div>
          )}
          
          {!showAdminOption && (
            <div className="rounded-2xl border border-brand-orange bg-white px-5 sm:px-4 py-4 shadow">
              <p className="text-sm font-semibold text-brand-dark">{roleTabs[0].label}</p>
              <p className="mt-1 text-xs text-gray-500">{roleTabs[0].description}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleFieldChange}
                className={`mt-1 block w-full rounded-md border px-2 sm:px-3 py-2 ${
                  errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-brand-orange focus:ring-brand-orange'
                } shadow-sm sm:text-sm`}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'signin-email-error' : undefined}
              />
              {errors.email && (
                <p id="signin-email-error" className="mt-1 text-xs text-red-500">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-brand-orange hover:text-brand-dark"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="password"
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleFieldChange}
                  className={`block w-full rounded-md border pr-10 px-2 sm:px-3 py-2 ${
                    errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-brand-orange focus:ring-brand-orange'
                  } shadow-sm sm:text-sm`}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'signin-password-error' : 'signin-password-hint'}
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
              <p id="signin-password-hint" className="mt-1 text-xs text-gray-500">
                {passwordHints}
              </p>
              {errors.password && (
                <p id="signin-password-error" className="mt-1 text-xs text-red-500">
                  {errors.password}
                </p>
              )}
            </div>
            {message && <div className="text-sm text-red-500">{message}</div>}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full rounded-md bg-brand-orange px-5 sm:px-4 py-2 text-white hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 disabled:opacity-70"
            >
              {status === 'loading' ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="text-center text-sm text-gray-600">
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-brand-orange hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="hidden lg:block rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Why sign in?</h2>
          <p className="mt-2 text-gray-600">
            Signing in keeps your delivery preferences and momo cravings in sync across devices. Admins get direct access to the kitchen dashboard.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-gray-600">
            <p className="rounded-2xl bg-[#fff7f2] p-4">Track orders in real time and view delivery updates.</p>
            <p className="rounded-2xl bg-[#fff7f2] p-4">Save favourite dishes and quickly reorder late-night snacks.</p>
            <p className="rounded-2xl bg-[#fff7f2] p-4">Admins can update menus, monitor sales, and manage fulfilment.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
