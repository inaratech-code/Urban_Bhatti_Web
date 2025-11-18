import Image from 'next/image';

const quickFilters = [
  { label: 'MoMo Specials', emoji: '🥟', href: '/menu' },
  { label: 'Poleko Wings', emoji: '🔥', href: '/menu' },
  { label: 'Late-night Snacks', emoji: '🌙', href: '/menu' },
  { label: 'Veg Favorites', emoji: '🥗', href: '/menu' }
];

const highlightCards = [
  {
    title: 'Live order tracking',
    description: 'Real-time updates and location-based delivery made simple.',
    href: '/menu'
  },
  {
    title: 'Fast checkout',
    description: 'Manage your cart, update quantities and share delivery details in one place.',
    href: '/cart'
  }
];

export default function HomePage() {
  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Hero Section - Zomato/Swiggy Style */}
      <section className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 text-center">
        <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-5">
          <div className="relative">
            <div className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full border-2 border-gray-300 overflow-hidden bg-white flex items-center justify-center">
              <Image 
                src="/LOGO.jpg" 
                alt="Urban Bhatti" 
                width={120} 
                height={120} 
                className="h-full w-full object-cover" 
                priority
              />
            </div>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#381808]">Urban Bhatti</h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 uppercase tracking-wide">Opening Hours: 10:00 AM – 3:00 AM</p>
            <p className="text-xs sm:text-sm md:text-base text-gray-700 px-2 sm:px-4 leading-relaxed max-w-lg mx-auto">
              Dhangadhi&apos;s favourite poleko, momo and late-night snack spot. Order in or swing by the residency for rooftop vibes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 w-full max-w-md">
            <a
              href="/menu"
              className="inline-flex items-center justify-center rounded-lg bg-[#f36a10] px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 text-xs sm:text-sm md:text-base font-semibold text-white shadow-sm hover:bg-[#d85a0b] transition-colors active:scale-95 touch-manipulation"
            >
              Explore Menu
            </a>
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg border-2 border-[#381808] bg-white px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 text-xs sm:text-sm md:text-base font-semibold text-[#381808] hover:bg-[#381808] hover:text-white transition-colors active:scale-95 touch-manipulation"
            >
              Create Account
            </a>
          </div>
        </div>
      </section>

      {/* Quick Filters - Zomato/Swiggy Style */}
      <section className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
        <div className="overflow-x-auto scrollbar-hide -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
          <div className="flex gap-2 sm:gap-3 pb-2">
            {quickFilters.map((filter) => (
              <a
                key={filter.label}
                href={filter.href}
                className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 transition-colors touch-manipulation whitespace-nowrap flex-shrink-0"
              >
                <span aria-hidden className="text-sm sm:text-base">{filter.emoji}</span>
                <span>{filter.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Cards - Zomato/Swiggy Style */}
      <section className="grid gap-3 sm:gap-4 md:gap-5 sm:grid-cols-2">
        {highlightCards.map((card) => (
          <a
            key={card.title}
            href={card.href}
            className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6 hover:shadow-md transition-shadow touch-manipulation"
          >
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">{card.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{card.description}</p>
              <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#f36a10] mt-2 sm:mt-3">
                Learn more
                <span className="text-sm sm:text-base">→</span>
              </span>
            </div>
          </a>
        ))}
      </section>

      {/* CTA Section - Zomato/Swiggy Style */}
      <section className="bg-[#f36a10] rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 text-center text-white">
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Hungry already?</h2>
          <p className="text-xs sm:text-sm md:text-base text-orange-50 max-w-md mx-auto">Jump straight to the menu and start building your cart.</p>
          <a
            href="/menu"
            className="inline-flex items-center justify-center rounded-lg bg-white px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-[#f36a10] shadow-sm hover:bg-gray-50 transition-colors active:scale-95 touch-manipulation"
          >
            View Menu
          </a>
        </div>
      </section>
    </div>
  );
}

