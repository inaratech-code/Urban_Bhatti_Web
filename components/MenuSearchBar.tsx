'use client';

import { FormEvent, useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type MenuSearchBarProps = {
  initialValue?: string;
};

export default function MenuSearchBar({ initialValue = '' }: MenuSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams?.toString());

    if (value.trim().length > 0) {
      params.set('q', value.trim());
    } else {
      params.delete('q');
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    router.refresh();
  }, [value, searchParams, pathname, router]);

  const handleClear = useCallback(() => {
    setValue('');
    const params = new URLSearchParams(searchParams?.toString());
    params.delete('q');
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    router.refresh();
  }, [searchParams, pathname, router]);

  return (
    <form onSubmit={handleSubmit} className="flex w-full items-center gap-1.5 sm:gap-2 rounded-lg border border-gray-300 bg-gray-50 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 focus-within:border-brand-orange focus-within:bg-white focus-within:shadow-sm transition-all">
      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search for dishes..."
        className="flex-1 bg-transparent text-xs sm:text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none min-w-0"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="text-gray-400 hover:text-gray-600 touch-manipulation flex-shrink-0 p-1"
          aria-label="Clear search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  );
}
