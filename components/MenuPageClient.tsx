'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import AdminMenuManager from './AdminMenuManager';
import MenuCard from './MenuCard';
import MenuSearchBar from './MenuSearchBar';
import { useAuth } from './AuthProvider';
import type { MenuItemDto } from '../lib/menu';

const quickFilters = ['All items', 'MoMo', 'Veg Snacks', 'Non Veg Snacks', 'Poleko', 'Biryani'];

function slugifyCategory(label: string) {
  if (label === 'All items') return 'top';
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function groupByCategory(items: MenuItemDto[]) {
  return items.reduce<Record<string, MenuItemDto[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});
}

type MenuPageClientProps = {
  menuItems: MenuItemDto[];
  query: string;
};

export default function MenuPageClient({ menuItems, query }: MenuPageClientProps) {
  const { role, user, token, refreshToken } = useAuth();
  const isAdmin = role === 'admin';
  const [userName, setUserName] = useState<string | null>(null);

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  const fetchUserName = useCallback(async () => {
    if (!user) {
      setUserName(null);
      return;
    }

    try {
      const authToken = token ?? (await refreshToken(true));
      if (!authToken) return;

      const response = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setUserName(data.name || null);
      }
    } catch (error) {
      // Silently fail - user name is optional
      // Don't log on mobile to avoid console spam
      if (typeof window !== 'undefined' && window.innerWidth > 768) {
        console.error('Failed to fetch user name:', error);
      }
    }
  }, [user, token, refreshToken]);

  useEffect(() => {
    if (user && !isAdmin) {
      // Delay fetch slightly to avoid blocking initial render
      const timer = setTimeout(() => {
        void fetchUserName();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, isAdmin, fetchUserName]);
  
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (!isAdmin && item.isAvailable === false) {
        return false;
      }
      if (!normalizedQuery) return true;
      const haystack = `${item.title} ${item.description} ${item.category}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [menuItems, isAdmin, normalizedQuery]);

  const grouped = useMemo(() => groupByCategory(filteredItems), [filteredItems]);

  // Safety check: ensure menuItems is an array
  if (!Array.isArray(menuItems)) {
    return (
      <div className="space-y-3 sm:space-y-6 md:space-y-8">
        <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-sm text-gray-600">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6 md:space-y-8">
      {isAdmin && <AdminMenuManager initialMenuItems={menuItems} searchQuery={normalizedQuery} />}

      {/* Header Section - Zomato/Swiggy Style */}
      <header id="top" className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-sm border border-gray-200 p-2.5 sm:p-4 md:p-6">
        <div className="space-y-3 sm:space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Urban Bhatti</h1>
              {userName && (
                <p className="text-xs sm:text-sm font-semibold text-brand-orange break-words sm:whitespace-nowrap">
                  {userName}
                </p>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              VAT inclusive prices. Order now and we&apos;ll have your favourites ready.
            </p>
          </div>
          <div className="w-full">
            <MenuSearchBar initialValue={query} />
          </div>
        </div>
        
        {/* Category Filters - Horizontal Scroll */}
        <div className="mt-2.5 sm:mt-4 md:mt-5 overflow-x-auto scrollbar-hide -mx-2.5 sm:-mx-4 md:-mx-6 px-2.5 sm:px-4 md:px-6">
          <div className="flex gap-2 sm:gap-3 pb-2">
            {quickFilters.map((filter) => (
              <a
                key={filter}
                href={`#${slugifyCategory(filter)}`}
                className="flex-shrink-0 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 transition-colors touch-manipulation whitespace-nowrap"
              >
                {filter}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* Menu Sections - Clean Zomato/Swiggy Style */}
      {Object.entries(grouped).map(([category, items]) => (
        <section
          key={category}
          id={slugifyCategory(category)}
          className="space-y-2.5 sm:space-y-4 md:space-y-5"
        >
          {/* Category Header */}
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-2.5 sm:p-4 md:p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{category}</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                  {category === 'MoMo' && 'Steamed, fried and saucy momo favourites.'}
                  {category === 'Veg Snacks' && 'Vegetarian bites perfect for sharing.'}
                  {category === 'Non Veg Snacks' && 'Chicken and pork snacks to pair with poleko.'}
                  {category === 'Poleko' && 'From the bhatti fire—sekuwa and smoked specials.'}
                  {category === 'Biryani' && 'Slow-cooked biryani straight from the kitchen.'}
                  {category !== 'MoMo' &&
                    category !== 'Veg Snacks' &&
                    category !== 'Non Veg Snacks' &&
                    category !== 'Poleko' &&
                    category !== 'Biryani' &&
                    'Hand-picked dishes from Urban Bhatti.'}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid gap-2.5 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <MenuCard key={item._id} item={item} />
            ))}
          </div>
        </section>
      ))}

      {filteredItems.length === 0 && (
        <div className="rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl border border-dashed border-gray-300 bg-white p-6 sm:p-8 md:p-12 text-center text-xs sm:text-sm text-gray-500">
          No menu items match your search. Try a different category or keyword.
        </div>
      )}
    </div>
  );
}
