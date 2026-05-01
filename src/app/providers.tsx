'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useCartSync } from '@/hooks/useCartSync';

function CartSyncProvider({ children }: { children: React.ReactNode }) {
  useCartSync();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      <CartSyncProvider>{children}</CartSyncProvider>
    </SessionProvider>
  );
}
