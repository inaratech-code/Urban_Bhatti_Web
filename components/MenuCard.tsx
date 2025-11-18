'use client';

import { memo, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { MenuItemDto } from '../lib/menu';
import { useCart } from './Cart';

function MenuCard({ item }: { item: MenuItemDto }) {
  const { addItem } = useCart();

  const handleAdd = useCallback(() => {
    addItem({
      menuItemId: item._id,
      title: item.title,
      price: item.price,
      qty: 1,
      imageUrl: item.imageUrl
    });
  }, [addItem, item._id, item.title, item.price, item.imageUrl]);

  const imageSrc = useMemo(() => item.imageUrl || '/LOGO.jpg', [item.imageUrl]);

  return (
    <article className="group relative flex flex-col bg-white rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 w-full">
      {!item.isAvailable && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-lg sm:rounded-xl">
          <span className="bg-gray-800 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold">Currently unavailable</span>
        </div>
      )}
      
      {/* Image Section - Full Width */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={imageSrc}
          alt={item.title}
          width={300}
          height={225}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {item.rating && (
          <div className="absolute top-2 sm:top-2 left-2 sm:left-2 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm px-1.5 sm:px-1.5 py-0.5 rounded-full shadow-sm">
            <span className="text-orange-500 text-xs sm:text-xs">★</span>
            <span className="text-xs sm:text-xs font-semibold text-gray-800">{item.rating}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-3 md:p-4 flex flex-col flex-1">
        <div className="flex-1">
          <div className="mb-1.5">
            <span className="inline-block text-[11px] sm:text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.category}</span>
          </div>
          <h3 className="text-sm sm:text-sm md:text-base font-bold text-gray-900 line-clamp-1 mb-1.5 leading-tight">{item.title}</h3>
          <p className="text-[11px] sm:text-xs md:text-sm text-gray-600 line-clamp-2 mb-2.5 sm:mb-3 leading-relaxed">{item.description}</p>
        </div>

        {/* Price and Add Button */}
        <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-gray-100 gap-2 sm:gap-2">
          <div>
            <p className="text-base sm:text-base md:text-lg font-bold text-gray-900">₹{item.price}</p>
          </div>
          <button 
            type="button" 
            disabled={!item.isAvailable} 
            onClick={handleAdd} 
            className={`${item.isAvailable 
              ? 'bg-brand-orange hover:bg-orange-600 active:bg-orange-700 text-white' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            } px-4 sm:px-4 md:px-5 py-2.5 sm:py-2 rounded-lg text-xs sm:text-xs md:text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 touch-manipulation disabled:opacity-50 flex-shrink-0 min-h-[44px] sm:min-h-0`}
          >
            {item.isAvailable ? 'ADD' : 'UNAVAILABLE'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default memo(MenuCard);

