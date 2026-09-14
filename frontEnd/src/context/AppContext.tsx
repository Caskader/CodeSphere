import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { CartItem, MenuItem, MealToken, Order, Page } from "../types";

interface AppContextValue {
  activePage: Page;
  setActivePage: (p: Page) => void;
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  queueCount: number;
  messOpen: boolean;
  waitTime: number;
  crowdLevel: "low" | "moderate" | "high" | "packed";
  recommendation: "GO_NOW" | "WAIT" | "AVOID";
  recommendedLeaveIn: number;
  activeToken: MealToken | null;
  setActiveToken: (t: MealToken | null) => void;
  orders: Order[];
  addOrder: (o: Order) => void;
  newAnnouncementCount: number;
  setNewAnnouncementCount: (n: number) => void;
  showCart: boolean;
  setShowCart: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem("mess_orders");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getStoredToken(): MealToken | null {
  try {
    const raw = localStorage.getItem("mess_active_token");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function computeRecommendation(queue: number): { rec: "GO_NOW" | "WAIT" | "AVOID"; leaveIn: number; wait: number } {
  if (queue < 20) return { rec: "GO_NOW", leaveIn: 0, wait: Math.max(2, Math.round(queue * 0.6)) };
  if (queue < 45) return { rec: "WAIT", leaveIn: Math.round((45 - queue) * 0.7 + 5), wait: Math.round(queue * 0.8) };
  return { rec: "AVOID", leaveIn: Math.round((queue - 30) * 0.9 + 15), wait: Math.round(queue * 1.1) };
}

function computeCrowdLevel(q: number): "low" | "moderate" | "high" | "packed" {
  if (q < 15) return "low";
  if (q < 30) return "moderate";
  if (q < 50) return "high";
  return "packed";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [queueCount, setQueueCount] = useState(28);
  const [messOpen] = useState(true);
  const [activeToken, setActiveTokenState] = useState<MealToken | null>(getStoredToken);
  const [orders, setOrders] = useState<Order[]>(getStoredOrders);
  const [newAnnouncementCount, setNewAnnouncementCount] = useState(2);
  const [showCart, setShowCart] = useState(false);

  // Simulate real-time queue changes
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueCount(prev => {
        const delta = Math.round((Math.random() - 0.45) * 6);
        return Math.max(3, Math.min(75, prev + delta));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0);
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const setActiveToken = useCallback((t: MealToken | null) => {
    setActiveTokenState(t);
    if (t) localStorage.setItem("mess_active_token", JSON.stringify(t));
    else localStorage.removeItem("mess_active_token");
  }, []);

  const addOrder = useCallback((o: Order) => {
    setOrders(prev => {
      const updated = [o, ...prev];
      localStorage.setItem("mess_orders", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const waitTime = Math.max(2, Math.round(queueCount * 0.8));
  const { rec: recommendation, leaveIn: recommendedLeaveIn } = computeRecommendation(queueCount);
  const crowdLevel = computeCrowdLevel(queueCount);

  return (
    <AppContext.Provider value={{
      activePage, setActivePage,
      cart, addToCart, removeFromCart, updateQty, clearCart,
      cartTotal, cartCount,
      queueCount, messOpen, waitTime, crowdLevel,
      recommendation, recommendedLeaveIn,
      activeToken, setActiveToken,
      orders, addOrder,
      newAnnouncementCount, setNewAnnouncementCount,
      showCart, setShowCart,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
