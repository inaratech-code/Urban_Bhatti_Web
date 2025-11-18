import Image from 'next/image';

import { CartSidebar } from '../../components/Cart';

export default function CartPage() {
  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)] lg:gap-6 md:gap-8 lg:space-y-0">
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header - Zomato/Swiggy Style */}
        <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 overflow-hidden rounded-full border border-gray-200 flex-shrink-0">
              <Image src="/logo.jpg" alt="Urban Bhatti" width={56} height={56} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Your Cart</h1>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-0.5">
                Review your selections and delivery details
              </p>
            </div>
          </div>
        </div>

        {/* Back to Menu - Zomato/Swiggy Style */}
        <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">Need something else?</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Browse the full menu to add more items before checking out.
          </p>
          <a
            href="/menu"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors active:scale-95 touch-manipulation"
          >
            Back to Menu
          </a>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <CartSidebar />
      </div>
    </div>
  );
}
