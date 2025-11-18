import { Suspense } from 'react';

import ResetPasswordContent from './ResetPasswordContent';

export const metadata = {
  title: 'Reset password | Urban Bhatti'
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-gray-500">Loading reset form…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}


