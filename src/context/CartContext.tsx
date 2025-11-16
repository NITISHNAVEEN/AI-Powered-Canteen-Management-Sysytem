'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

type FoodType = 'veg' | 'non-veg';

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  catererId: string;
  imageUrl?: string;
  category: string;
  foodType: FoodType;
};

type CartItem = MenuItem & {
  quantity: number;
  packaging: boolean;
};

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  togglePackaging: (itemId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = (item: MenuItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...prevItems, { ...item, quantity: 1, packaging: false }];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevItems.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      } else {
        return prevItems.filter((i) => i.id !== itemId);
      }
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const togglePackaging = (itemId: string) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, packaging: !item.packaging } : item
      )
    );
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, clearCart, togglePackaging }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
