import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  token: any;
  percentage?: number;
  solAmount?: number;
  estimatedTokens?: number;
  weight: number; // percent, always sum to 100
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'weight'>) => void;
  removeFromCart: (symbol: string) => void;
  updateWeight: (symbol: string, newWeight: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function recalcWeights(items: Omit<CartItem, 'weight'>[]): CartItem[] {
  if (items.length === 0) return [];
  const equalWeight = 100 / items.length;
  return items.map(item => ({ ...item, weight: parseFloat(equalWeight.toFixed(2)) }));
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('cart');
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // If old cart, recalc weights
    if (parsed.length && parsed[0].weight === undefined) {
      return recalcWeights(parsed);
    }
    return parsed;
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Omit<CartItem, 'weight'>) => {
    setCart(prev => {
      if (prev.some(i => i.token.symbol === item.token.symbol)) return prev;
      const newItems = [...prev, item];
      return recalcWeights(newItems);
    });
  };
  const removeFromCart = (symbol: string) => {
    setCart(prev => recalcWeights(prev.filter(i => i.token.symbol !== symbol)));
  };
  const updateWeight = (symbol: string, newWeight: number) => {
    setCart(prev => {
      // Find the index of the updated token
      const idx = prev.findIndex(i => i.token.symbol === symbol);
      if (idx === -1) return prev;
      // Calculate the remaining weight to distribute
      const remaining = 100 - newWeight;
      // Get the old weights of the other tokens
      const others = prev.filter((_, i) => i !== idx);
      const sumOld = others.reduce((sum, i) => sum + i.weight, 0);
      // Distribute remaining weight proportionally to others, preserving order
      const newCart = prev.map((item, i) => {
        if (i === idx) return { ...item, weight: newWeight };
        if (others.length === 0) return { ...item, weight: 0 };
        return {
          ...item,
          weight: parseFloat(((item.weight / sumOld) * remaining).toFixed(2)),
        };
      });
      return newCart;
    });
  };
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateWeight, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
} 