import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CartItem, StoreCart, getAllStoreCarts, setCart, updateStoreCartsIndex, getStoreCartsKey } from '@/lib/cart';

export function useCartSync() {
  const { data: session, status } = useSession();
  const [cartSynced, setCartSynced] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    const syncCart = async () => {
      if (status === 'authenticated' && session?.user) {
        const localCarts = getAllStoreCarts();

        try {
          const res = await fetch('/api/cart');
          if (res.ok) {
            const { storeCarts } = await res.json();

            const merged = mergeCarts(localCarts, storeCarts);

            localStorage.setItem(getStoreCartsKey(), JSON.stringify(merged));

            await fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ storeCarts: merged }),
            });

            window.dispatchEvent(new Event('cartUpdated'));
          }
        } catch (e) {
          console.error('Cart sync error:', e);
        }
      }
      setCartSynced(true);
    };

    syncCart();
  }, [status, session?.user?.id]);

  const syncToDb = useCallback(async () => {
    if (status !== 'authenticated') return;

    const localCarts = getAllStoreCarts();
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeCarts: localCarts }),
      });
    } catch (e) {
      console.error('Sync to DB error:', e);
    }
  }, [status]);

  const syncFromDb = useCallback(async () => {
    if (status !== 'authenticated') return;

    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const { storeCarts } = await res.json();

        const localCarts = getAllStoreCarts();
        const merged = mergeCarts(localCarts, storeCarts);

        localStorage.setItem(getStoreCartsKey(), JSON.stringify(merged));
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (e) {
      console.error('Sync from DB error:', e);
    }
  }, [status]);

  return { syncToDb, syncFromDb, cartSynced };
}

function mergeCarts(local: StoreCart[], remote: StoreCart[]): StoreCart[] {
  const merged = [...remote];

  for (const localCart of local) {
    const existingIdx = merged.findIndex(c => c.storeId === localCart.storeId);
    if (existingIdx >= 0) {
      const remoteItems = merged[existingIdx].items;
      for (const localItem of localCart.items) {
        const remoteItemIdx = remoteItems.findIndex(i => i._id === localItem._id);
        if (remoteItemIdx >= 0) {
          remoteItems[remoteItemIdx].quantity += localItem.quantity;
        } else {
          remoteItems.push(localItem);
        }
      }
      merged[existingIdx].items = remoteItems;
      merged[existingIdx].updatedAt = Date.now();
    } else {
      merged.push(localCart);
    }
  }

  return merged;
}
