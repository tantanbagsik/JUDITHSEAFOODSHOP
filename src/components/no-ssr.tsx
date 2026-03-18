'use client';

import dynamic from 'next/dynamic';

export function NoSSR({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default dynamic(() => Promise.resolve(NoSSR), { ssr: false });
