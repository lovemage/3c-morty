import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CartItem, storage } from '../lib/localStorage';
import toast from 'react-hot-toast';

interface CartContextType {
  cart: CartItem[];
  addToCart: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    // Load cart from localStorage on mount
    const savedCart = storage.getCart();
    setCart(savedCart);
  }, []);

  const refreshCart = () => {
    const updatedCart = storage.getCart();
    setCart(updatedCart);
  };

  const addToCart = (productId: string, quantity: number = 1) => {
    try {
      storage.addToCart(productId, quantity);
      refreshCart();
      toast.success('商品已加入購物車！');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加入購物車失敗');
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    try {
      storage.updateCartItem(productId, quantity);
      refreshCart();
    } catch (error) {
      toast.error('更新數量失敗');
    }
  };

  const removeFromCart = (productId: string) => {
    storage.removeFromCart(productId);
    refreshCart();
    toast.success('商品已從購物車移除');
  };

  const clearCart = () => {
    storage.clearCart();
    refreshCart();
    toast.success('購物車已清空');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      getCartTotal,
      getCartItemsCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
