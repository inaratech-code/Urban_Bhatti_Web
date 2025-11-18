'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import AdminOffers from '../../../components/AdminOffers';
import { useAdminAuth } from '../../../components/AuthProvider';

export default function AdminOffersPage() {
  const { user, role, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/signin?callbackUrl=/admin/offers');
      } else if (role !== 'admin') {
        router.replace('/menu');
      }
    }
  }, [loading, user, role, router]);

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white shadow-md overflow-hidden w-full" data-admin-page>
      <AdminOffers />
    </div>
  );
}


