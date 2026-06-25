import * as React from 'react';
import type { Product } from '@/lib/itemMapper';

export type PosCartLine = { product: Product; quantity: number };

export function usePosCart() {
  const [posCart, setPosCart] = React.useState<PosCartLine[]>([]);
  const clearCart = React.useCallback(() => setPosCart([]), []);
  return { posCart, setPosCart, clearCart };
}
