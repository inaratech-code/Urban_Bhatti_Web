import { Suspense } from 'react';

import SignInContent from './SignInContent';

export const metadata = {
  title: 'Sign in | Urban Bhatti'
};

export default function SigninPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-gray-500">Loading sign-in…</div>}>
      <SignInContent />
    </Suspense>
  );
}
