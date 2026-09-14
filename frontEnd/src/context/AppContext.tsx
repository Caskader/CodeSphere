import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { CartItem, MenuItem, MealToken, Order, Page, UserProfile } from "../types";
import { MENU_ITEMS, STUDENT } from "../data/mockData";
import { api, backendOrderToFrontendOrder } from "../services/api";

interface PlaceOrderResult {
  success: boolean;
  token?: MealToken;
  order?: Order;
  error?: string;
}

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
  // Live Backend Additions
  menuItems: MenuItem[];
  menuLoading: boolean;
  menuError: string | null;
  refreshMenu: () => Promise<void>;
  ordersLoading: boolean;
  refreshOrders: () => Promise<void>;
  userProfile: UserProfile | null;
  placeOrder: (paymentMethod?: string, upiId?: string) => Promise<PlaceOrderResult>;
  cancelOrder: (orderId: string) => Promise<{ success: boolean; error?: string }>;
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

  // Backend state
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Fetch Menu from API
  const refreshMenu = useCallback(async () => {
    setMenuLoading(true);
    setMenuError(null);
    try {
      const items = await api.getMenu();
      if (items && items.length > 0) {
        setMenuItems(items);
      }
    } catch (err: any) {
      console.warn("Could not load menu from backend, using default items:", err);
      setMenuError(err.message || "Could not connect to backend menu");
    } finally {
      setMenuLoading(false);
    }
  }, []);

  // Fetch User's Orders from API
  const refreshOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const backendOrders = await api.getMyOrders();
      if (backendOrders) {
        const mapped = backendOrders.map(backendOrderToFrontendOrder);
        setOrders(mapped);
        localStorage.setItem("mess_orders", JSON.stringify(mapped));

        // If active token exists, update its status from the backend orders
        const currentToken = getStoredToken();
        if (currentToken?.orderId) {
          const matchingOrder = mapped.find(o => o.id === currentToken.orderId);
          if (matchingOrder) {
            setActiveTokenState(matchingOrder.token);
            localStorage.setItem("mess_active_token", JSON.stringify(matchingOrder.token));
          }
        }
      }
    } catch (err) {
      console.warn("Could not load orders from backend:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Fetch User Profile from API
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await api.getProfile();
      setUserProfile(profile);
    } catch (err) {
      console.warn("Could not load user profile:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshMenu();
    refreshOrders();
    refreshProfile();
  }, [refreshMenu, refreshOrders, refreshProfile]);

  // Fetch real-time queue changes from backend
  const refreshQueueCount = useCallback(async () => {
    try {
      const count = await api.getPendingCount();
      // Use the actual count from backend, minimum of 3 for demo visuals
      setQueueCount(Math.max(3, count));
    } catch (err) {
      console.warn("Could not load queue count:", err);
    }
  }, []);

  useEffect(() => {
    refreshQueueCount();
    const interval = setInterval(() => {
      refreshQueueCount();
    }, 8000);
    return () => clearInterval(interval);
  }, [refreshQueueCount]);

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

  // Place Order on Backend
  const placeOrder = useCallback(async (paymentMethod = "UPI", upiId?: string): Promise<PlaceOrderResult> => {
    if (cart.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    try {
      const formattedMethod = upiId ? `UPI (${upiId})` : paymentMethod;
      const apiItems = cart.map(item => ({
        item_id: item.id,
        quantity: item.quantity,
      }));

      const res = await api.placeOrder(apiItems, formattedMethod);

      const studentName = userProfile?.name || STUDENT.name;
      const studentId = userProfile?.student_id || STUDENT.id;
      const tokenId = res.token_id || `VIT-${res.order_id.slice(0, 6).toUpperCase()}`;

      const token: MealToken = {
        id: tokenId,
        studentName,
        studentId,
        mealType: "Night Mess",
        items: [...cart],
        amount: res.total_amount || cart.reduce((s, i) => s + i.price * i.quantity, 0),
        createdAt: new Date().toISOString(),
        status: "active",
        counter: res.counter || 1,
        orderId: res.order_id,
      };

      const order: Order = {
        id: res.order_id,
        token,
        paymentMethod: formattedMethod,
        timestamp: new Date().toISOString(),
        status: "placed",
        total_amount: token.amount,
      };

      setActiveToken(token);
      addOrder(order);
      clearCart();

      // Refresh orders from backend in the background
      setTimeout(() => refreshOrders(), 500);

      return { success: true, token, order };
    } catch (err: any) {
      console.error("Order placement failed:", err);
      return { success: false, error: err.message || "Failed to place order" };
    }
  }, [cart, userProfile, setActiveToken, addOrder, clearCart, refreshOrders]);

  // Cancel Order on Backend
  const cancelOrder = useCallback(async (orderId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.cancelOrder(orderId);

      // Update in local orders
      setOrders(prev => {
        const updated = prev.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              status: "cancelled",
              token: { ...o.token, status: "cancelled" as const },
            };
          }
          return o;
        });
        localStorage.setItem("mess_orders", JSON.stringify(updated));
        return updated;
      });

      // Update active token if it matches this order
      if (activeToken?.orderId === orderId || activeToken?.id === orderId) {
        const updatedToken: MealToken = {
          ...activeToken,
          status: "cancelled",
        };
        setActiveToken(updatedToken);
      }

      return { success: true };
    } catch (err: any) {
      console.error("Order cancellation failed:", err);
      return { success: false, error: err.message || "Failed to cancel order" };
    }
  }, [activeToken, setActiveToken]);

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
      // Backend additions
      menuItems,
      menuLoading,
      menuError,
      refreshMenu,
      ordersLoading,
      refreshOrders,
      userProfile,
      placeOrder,
      cancelOrder,
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
