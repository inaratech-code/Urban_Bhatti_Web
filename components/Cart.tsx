'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  useRef,
  useCallback,
  ReactNode,
  memo
} from 'react';
import Link from 'next/link';

import { useAuth } from './AuthProvider';

type CartItem = {
  menuItemId: string;
  title: string;
  price: number;
  qty: number;
  imageUrl?: string;
  note?: string;
};

type CartState = {
  items: CartItem[];
};

type CartAction =
  | { type: 'hydrate'; payload: CartItem[] }
  | { type: 'add'; payload: CartItem }
  | { type: 'update'; payload: { menuItemId: string; qty: number } }
  | { type: 'updateNote'; payload: { menuItemId: string; note: string } }
  | { type: 'remove'; payload: { menuItemId: string } }
  | { type: 'clear' };

type CartContextValue = {
  items: CartItem[];
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQty: (menuItemId: string, qty: number) => void;
  updateNote: (menuItemId: string, note: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'hydrate':
      return { items: action.payload };
    case 'add': {
      const existing = state.items.find((item) => item.menuItemId === action.payload.menuItemId);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.menuItemId === action.payload.menuItemId
              ? { ...item, qty: item.qty + action.payload.qty }
              : item
          )
        };
      }
      return { items: [...state.items, action.payload] };
    }
    case 'update':
      return {
        items: state.items
          .map((item) =>
            item.menuItemId === action.payload.menuItemId
              ? { ...item, qty: action.payload.qty }
              : item
          )
          .filter((item) => item.qty > 0)
      };
    case 'updateNote':
      return {
        items: state.items.map((item) =>
          item.menuItemId === action.payload.menuItemId
            ? { ...item, note: action.payload.note }
            : item
        )
      };
    case 'remove':
      return {
        items: state.items.filter((item) => item.menuItemId !== action.payload.menuItemId)
      };
    case 'clear':
      return { items: [] };
    default:
      return state;
  }
}

const initialState: CartState = { items: [] };

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('restaurant-cart');
    if (stored) {
      try {
        const parsed: CartItem[] = JSON.parse(stored);
        dispatch({ type: 'hydrate', payload: parsed });
      } catch (error) {
        console.error('Failed to parse cart from storage', error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('restaurant-cart', JSON.stringify(state.items));
  }, [state.items]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = state.items.reduce((sum, item) => sum + item.price * item.qty, 0);

    return {
      items: state.items,
      subtotal,
      addItem: (item) => dispatch({ type: 'add', payload: item }),
      removeItem: (menuItemId) => dispatch({ type: 'remove', payload: { menuItemId } }),
      updateQty: (menuItemId, qty) => dispatch({ type: 'update', payload: { menuItemId, qty } }),
      updateNote: (menuItemId, note) => dispatch({ type: 'updateNote', payload: { menuItemId, note } }),
      clearCart: () => dispatch({ type: 'clear' })
    };
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

const CartItemRow = memo(({ item, updateQty, updateNote, removeItem }: { item: CartItem; updateQty: (menuItemId: string, qty: number) => void; updateNote: (menuItemId: string, note: string) => void; removeItem: (menuItemId: string) => void }) => {
  const handleDecrease = useCallback(() => {
    updateQty(item.menuItemId, Math.max(1, item.qty - 1));
  }, [item.menuItemId, item.qty, updateQty]);

  const handleIncrease = useCallback(() => {
    updateQty(item.menuItemId, item.qty + 1);
  }, [item.menuItemId, item.qty, updateQty]);

  const handleRemove = useCallback(() => {
    removeItem(item.menuItemId);
  }, [item.menuItemId, removeItem]);

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNote(item.menuItemId, e.target.value);
  }, [item.menuItemId, updateNote]);

  const total = useMemo(() => item.price * item.qty, [item.price, item.qty]);

  return (
    <div className="rounded-lg border border-gray-100 p-2.5 sm:p-3">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-medium text-gray-800 break-words">{item.title}</p>
          <p className="text-xs sm:text-sm text-gray-500">Rs. {item.price} × {item.qty}</p>
          <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <button
              type="button"
              onClick={handleDecrease}
              className="rounded-full border px-2 py-1 sm:px-2.5 touch-manipulation"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="min-w-[1.5rem] text-center">{item.qty}</span>
            <button
              type="button"
              onClick={handleIncrease}
              className="rounded-full border px-2 py-1 sm:px-2.5 touch-manipulation"
              aria-label="Increase quantity"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-red-500 hover:text-red-700 touch-manipulation"
            >
              Remove
            </button>
          </div>
        </div>
        <span className="text-sm sm:text-base font-semibold text-gray-800 flex-shrink-0">Rs. {total}</span>
      </div>
      <div className="mt-2 sm:mt-3">
        <label className="text-[10px] sm:text-xs font-medium text-gray-600">Special Instructions (Optional)</label>
        <textarea
          value={item.note || ''}
          onChange={handleNoteChange}
          placeholder="Add any special instructions for this item..."
          rows={2}
          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-brand-orange focus:outline-none"
        />
      </div>
    </div>
  );
});

CartItemRow.displayName = 'CartItemRow';

type CustomerAddress = {
  id: string;
  label: string;
  address: string;
  createdAt?: string;
};

export function CartSidebar() {
  const { user, token, refreshToken } = useAuth();
  const { items, subtotal, removeItem, updateQty, updateNote, clearCart } = useCart();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationTimeoutRef = useRef<number | null>(null);

  const isAuthenticated = !!user;
  const userEmail = user?.email ?? '';
  const userName =
    user?.displayName ??
    (userEmail ? userEmail.split('@')[0].replace(/[._-]/g, ' ') : 'Guest User');

  useEffect(() => {
    if (!isAuthenticated || prefilled) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const authToken = token ?? (await refreshToken(true));
        if (!authToken) return;
        const response = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: controller.signal
        });
        if (!response.ok) {
          return;
        }
        const data: {
          addresses?: CustomerAddress[];
          defaultAddressId?: string | null;
          address?: string;
          phone?: string;
        } = await response.json();
        if (cancelled) return;
        const addresses = Array.isArray(data.addresses) ? data.addresses : [];
        setSavedAddresses(addresses);
        const preferredId =
          (typeof data.defaultAddressId === 'string' ? data.defaultAddressId : null) ??
          addresses[0]?.id ??
          null;
        setSelectedAddressId(preferredId);
        const preferredAddress =
          addresses.find((entry) => entry.id === preferredId)?.address ??
          data.address ??
          '';
        if (preferredAddress) {
          setAddress((current) => (current ? current : preferredAddress));
        }
        if (data.phone) {
          setPhone((current) => (current ? current : data.phone ?? ''));
        }
        setPrefilled(true);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to load profile for cart prefill', error);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isAuthenticated, token, refreshToken, prefilled]);

  useEffect(() => () => {
    if (celebrationTimeoutRef.current) {
      window.clearTimeout(celebrationTimeoutRef.current);
    }
  }, []);

  const handleCheckout = useCallback(async () => {
    if (!isAuthenticated) {
      setStatus('error');
      setMessage('Create an account or sign in before placing an order.');
      return;
    }

    if (!address || !phone) {
      setStatus('error');
      setMessage('Address and phone are required.');
      return;
    }

    if (items.length === 0) {
      setStatus('error');
      setMessage('Your cart is empty.');
      return;
    }

    try {
      setStatus('loading');
      setMessage('');
      setShowCelebration(false);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          items: items.map((item) => ({ 
            menuItemId: item.menuItemId, 
            qty: item.qty,
            note: item.note || undefined
          })),
          address,
          phone,
          location
        })
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.error || 'Failed to submit order';
        
        // Handle invalid menu items error
        if (errorMessage.includes('No valid menu items') || data.invalidItems) {
          // Clear invalid items from cart
          if (data.invalidItems && Array.isArray(data.invalidItems)) {
            data.invalidItems.forEach((itemId: string) => {
              removeItem(itemId);
            });
          }
          throw new Error('Some items in your cart are no longer available. They have been removed. Please refresh the menu and try again.');
        }
        
        throw new Error(errorMessage);
      }

      clearCart();
      setAddress('');
      setPhone('');
      setLocation(undefined);
      setStatus('success');
      setMessage('Order placed successfully!');
      setShowCelebration(true);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('ub:new-order', `${Date.now()}`);
        } catch (_error) {
          // Ignore storage write issues (private mode, etc.)
        }
        window.dispatchEvent(new Event('admin-notification'));
        window.dispatchEvent(new Event('play-notification-sound'));
      }
      if (celebrationTimeoutRef.current) {
        window.clearTimeout(celebrationTimeoutRef.current);
      }
      celebrationTimeoutRef.current = window.setTimeout(() => {
        setShowCelebration(false);
      }, 2200);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong');
    }
  }, [isAuthenticated, address, phone, items, token, location, clearCart, removeItem]);

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('Geolocation is not supported by your browser. Please enter your address manually.');
      return;
    }

    // Check if we're on HTTPS or localhost (required for geolocation on mobile)
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      setStatus('error');
      setMessage('Location access requires HTTPS. Please use https:// or enter your address manually. For local testing, use localhost instead of IP address.');
      return;
    }

    setStatus('loading');
    setMessage('Requesting location permission...');

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout for mobile
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setMessage('Location captured successfully!');
        setStatus('success');
      },
      (error) => {
        setStatus('error');
        let errorMessage = 'Unable to retrieve your location.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please:\n1. Allow location access when prompted\n2. Check browser settings to enable location\n3. Or enter your address manually';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please:\n1. Check your GPS is enabled\n2. Ensure you have internet connection\n3. Or enter your address manually';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please:\n1. Try again\n2. Ensure GPS is enabled\n3. Or enter your address manually';
            break;
          default:
            errorMessage = 'Unable to retrieve your location. Please enter your address manually.';
            break;
        }
        
        setMessage(errorMessage);
      },
      options
    );
  }, []);

  return (
    <aside className="relative mt-6 sm:mt-12 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm md:sticky md:top-24 md:w-96 md:self-start">
      {showCelebration && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-4">
          <div className="order-glow absolute inset-5 rounded-[32px] bg-gradient-to-br from-orange-100/40 via-white/60 to-rose-100/30" />
          <div className="order-pop relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white shadow-[0_22px_45px_rgba(16,185,129,0.35)]">
            ✓
          </div>
          <p className="order-pop relative z-10 text-sm font-semibold text-emerald-700">
            Order on its way!
          </p>
        </div>
      )}
      <h2 className="text-lg sm:text-xl font-semibold text-brand-dark">Your Cart</h2>
      <p className="mt-1 text-xs sm:text-sm text-gray-500">Review your selections and place an order.</p>

      <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl border border-gray-100 bg-gray-50/70 p-3 sm:p-4 text-xs sm:text-sm text-gray-700">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] sm:tracking-[0.35em] text-gray-400">
          {isAuthenticated ? 'Signed in customer' : 'Guest user'}
        </p>
        <div className="mt-1.5 sm:mt-2">
          <p className="text-sm sm:text-base font-semibold text-brand-dark break-words">{userName}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 break-all">{userEmail || 'No email associated yet'}</p>
        </div>
        {!isAuthenticated && (
          <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-red-500">
            Please sign in or create an account before placing an order.
          </p>
        )}
      </div>

      {!isAuthenticated && (
        <div className="mt-3 sm:mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4 text-center">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-full bg-brand-orange px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-brand-dark touch-manipulation flex-1 sm:flex-initial min-w-[100px]"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full border border-brand-orange px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-brand-orange hover:bg-brand-orange hover:text-white touch-manipulation flex-1 sm:flex-initial min-w-[100px]"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}

      <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
        {items.length === 0 && <p className="text-xs sm:text-sm text-gray-500">Your cart is empty.</p>}
        {items.map((item) => (
          <CartItemRow
            key={item.menuItemId}
            item={item}
            updateQty={updateQty}
            updateNote={updateNote}
            removeItem={removeItem}
          />
        ))}
      </div>

      <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
        {savedAddresses.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400">
              Saved Addresses
            </p>
            <div className="space-y-2">
              {savedAddresses.map((entry) => {
                const isSelected = entry.id === selectedAddressId;
                return (
                  <label
                    key={entry.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                      isSelected
                        ? 'border-brand-orange bg-white shadow'
                        : 'border-gray-200 hover:border-brand-orange/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="saved-address"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedAddressId(entry.id);
                        setAddress(entry.address);
                      }}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-semibold text-gray-800">{entry.label}</span>
                      <span className="block text-gray-600 whitespace-pre-line">{entry.address}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-gray-500">
              Manage your saved addresses from the Profile page.
            </p>
          </div>
        )}
        <div>
          <label className="text-xs sm:text-sm font-medium text-gray-700">Delivery Address</label>
          <textarea
            value={address}
            onChange={(event) => {
              setAddress(event.target.value);
              setSelectedAddressId(null);
            }}
            rows={3}
            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-brand-orange focus:outline-none"
            placeholder="Enter delivery address"
          />
        </div>
        <div>
          <label className="text-xs sm:text-sm font-medium text-gray-700">Phone</label>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-base sm:text-sm focus:border-brand-orange focus:outline-none"
            placeholder="Phone number"
          />
        </div>
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={status === 'loading'}
          className="w-full rounded-lg border border-brand-orange px-3 py-2.5 text-xs sm:text-sm font-medium text-brand-orange hover:bg-brand-orange hover:text-white disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
              Getting location...
            </>
          ) : (
            <>
              <span>📍</span>
              Use My Location
            </>
          )}
        </button>
        {typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
            <strong>Note:</strong> Location access requires HTTPS. For mobile testing, use <code className="text-xs">localhost</code> or enter address manually.
          </p>
        )}
        {location && (
          <p className="text-xs text-gray-500">
            Location captured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </p>
        )}
      </div>

      <div className="mt-4 sm:mt-6 border-t border-gray-100 pt-3 sm:pt-4">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-base sm:text-lg font-semibold text-gray-900">Rs. {subtotal.toFixed(2)}</span>
        </div>
        <button
          type="button"
          onClick={handleCheckout}
          disabled={status === 'loading'}
          className="group relative mt-3 sm:mt-4 w-full rounded-full bg-gradient-to-r from-brand-orange to-orange-500 px-4 py-3.5 sm:py-3 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:from-orange-600 hover:to-brand-dark hover:scale-105 hover:shadow-xl hover:shadow-orange-500/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 touch-manipulation"
        >
          <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          {status === 'loading' ? (
            <span className="relative z-10 inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
              Placing order…
            </span>
          ) : (
            <span className="relative z-10">Place Order</span>
          )}
        </button>
        {message && (
          <p className={`mt-2 text-sm ${status === 'error' ? 'text-red-500' : 'text-green-600'}`} aria-live="polite">
            {message}
          </p>
        )}
      </div>
    </aside>
  );
}

