import type { MenuItem, Order, MealToken, UserProfile, Review } from "../types";
import { STUDENT } from "../data/mockData";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export interface BackendOrder {
  id: string;
  user_id?: string;
  items: Array<{
    item_id: string;
    name: string;
    price: number;
    quantity: number;
    emoji?: string;
    category?: string;
  }>;
  total_amount: number;
  status: "placed" | "preparing" | "ready" | "completed" | "cancelled" | string;
  room_number?: string;
  hostel_block?: string;
  student_name?: string;
  student_id?: string;
  counter?: number;
  meal_type?: string;
  payment_method?: string;
  token_id?: string;
  created_at?: string;
  updated_at?: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  "South Indian": "🫓",
  "Main Course": "🍛",
  "North Indian": "🫘",
  "Chinese": "🍚",
  "Street Food": "🥘",
  "Bread": "🫔",
  "Beverages": "☕",
  "Dessert": "🍮",
  "Breakfast": "🥞",
  "Lunch": "🍱",
  "Dinner": "🍲",
  "Snacks": "🥪",
};

export function getEmojiForDish(name: string, category = ""): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("dosa")) return "🫓";
  if (lowerName.includes("paneer")) return "🧆";
  if (lowerName.includes("biryani") || lowerName.includes("rice") || lowerName.includes("curry")) return "🍛";
  if (lowerName.includes("naan") || lowerName.includes("roti")) return "🫔";
  if (lowerName.includes("bhaji") || lowerName.includes("pav")) return "🥘";
  if (lowerName.includes("egg")) return "🥚";
  if (lowerName.includes("coffee") || lowerName.includes("tea")) return "☕";
  if (lowerName.includes("lassi")) return "🥭";
  if (lowerName.includes("jamun") || lowerName.includes("sweet")) return "🍮";
  if (lowerName.includes("bhature") || lowerName.includes("chole")) return "🫘";
  if (lowerName.includes("sandwich")) return "🥪";
  if (lowerName.includes("thali")) return "🍱";
  return CATEGORY_EMOJIS[category] || "🍲";
}

export function getAuthToken(): string | null {
  return localStorage.getItem("mess_auth_token");
}

export function setAuthToken(token: string): void {
  localStorage.setItem("mess_auth_token", token);
}

export function clearAuthToken(): void {
  localStorage.removeItem("mess_auth_token");
}

/**
 * Ensures a valid auth token is present. If missing, requests a demo token.
 */
export async function ensureAuthToken(): Promise<string> {
  const existing = getAuthToken();
  if (existing) return existing;

  try {
    const res = await fetch(`${API_BASE}/auth/demo-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.id_token) {
        setAuthToken(data.id_token);
        return data.id_token;
      }
    }
  } catch (err) {
    console.warn("Could not fetch demo auth token:", err);
  }
  return "";
}

/**
 * Common fetch wrapper that automatically attaches Authorization Bearer token.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = getAuthToken();
  if (!token && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/signup")) {
    token = await ensureAuthToken();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.error || errJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // --- Auth ---
  async login(email: string, password: string) {
    const data = await apiFetch<{ id_token: string; uid: string; email: string; name?: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.id_token) {
      setAuthToken(data.id_token);
    }
    return data;
  },

  async signup(payload: { email: string; password: string; name: string; student_id?: string; room_number?: string; hostel_block?: string }) {
    const data = await apiFetch<{ id_token: string; uid: string; message: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (data.id_token) {
      setAuthToken(data.id_token);
    }
    return data;
  },

  async getProfile(): Promise<UserProfile> {
    try {
      const profile = await apiFetch<UserProfile>("/auth/me");
      return profile;
    } catch {
      return {
        name: STUDENT.name,
        email: STUDENT.email,
        student_id: STUDENT.id,
        room_number: "Room 214",
        hostel_block: "A-Block",
        branch: STUDENT.branch,
        year: STUDENT.year,
        mess_balance: STUDENT.messBalance,
        role: "student",
      };
    }
  },

  // --- Menu ---
  async getMenu(category?: string, availableOnly = false): Promise<MenuItem[]> {
    const params = new URLSearchParams();
    if (category && category.toLowerCase() !== "all") {
      params.append("category", category);
    }
    if (availableOnly) {
      params.append("available_only", "true");
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const rawItems = await apiFetch<any[]>(`/menu${query}`);

    return rawItems.map((item) => {
      const isAvail = item.is_available !== false;
      const status: "available" | "limited" | "unavailable" =
        item.status || (isAvail ? "available" : "unavailable");

      return {
        id: item.id,
        name: item.name,
        description: item.description || "",
        price: Number(item.price),
        category: item.category || "Main Course",
        status,
        is_available: isAvail,
        emoji: item.emoji || getEmojiForDish(item.name, item.category),
        prepTime: item.prepTime || item.prep_time || 5,
        image_url: item.image_url || "",
        average_rating: item.average_rating,
        review_count: item.review_count,
      };
    });
  },

  async getMenuItem(id: string): Promise<MenuItem> {
    const item = await apiFetch<any>(`/menu/${id}`);
    const isAvail = item.is_available !== false;
    return {
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: Number(item.price),
      category: item.category || "Main Course",
      status: item.status || (isAvail ? "available" : "unavailable"),
      is_available: isAvail,
      emoji: item.emoji || getEmojiForDish(item.name, item.category),
      prepTime: item.prepTime || item.prep_time || 5,
    };
  },

  // --- Orders ---
  async placeOrder(items: { item_id: string; quantity: number }[], paymentMethod = "UPI") {
    return apiFetch<{
      message: string;
      order_id: string;
      total_amount: number;
      token_id: string;
      counter: number;
      status: string;
      order: any;
    }>("/orders", {
      method: "POST",
      body: JSON.stringify({
        items,
        payment_method: paymentMethod,
      }),
    });
  },

  async getMyOrders(): Promise<BackendOrder[]> {
    return apiFetch<BackendOrder[]>("/orders/my");
  },

  async getOrder(id: string): Promise<BackendOrder> {
    return apiFetch<BackendOrder>(`/orders/${id}`);
  },

  async cancelOrder(id: string) {
    return apiFetch<{ message: string; id: string; status: string }>(`/orders/${id}/cancel`, {
      method: "POST",
    });
  },

  // --- Reviews ---
  async getReviews(itemId: string): Promise<Review[]> {
    return apiFetch<Review[]>(`/menu/${itemId}/reviews`);
  },

  async addReview(itemId: string, rating: number, comment = "") {
    return apiFetch<{ message: string; id: string }>(`/menu/${itemId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    });
  },
};

/**
 * Helper to convert a backend order doc into a frontend Order object.
 */
export function backendOrderToFrontendOrder(bo: BackendOrder): Order {
  const token: MealToken = {
    id: bo.token_id || `VIT-${bo.id.slice(0, 6).toUpperCase()}`,
    studentName: bo.student_name || STUDENT.name,
    studentId: bo.student_id || STUDENT.id,
    mealType: bo.meal_type || "Night Mess",
    items: (bo.items || []).map((item) => ({
      id: item.item_id,
      name: item.name,
      description: "",
      price: item.price,
      quantity: item.quantity,
      category: item.category || "General",
      status: "available",
      emoji: item.emoji || getEmojiForDish(item.name, item.category),
      prepTime: 5,
    })),
    amount: bo.total_amount,
    createdAt: bo.created_at || new Date().toISOString(),
    status:
      bo.status === "cancelled"
        ? "cancelled"
        : bo.status === "completed"
        ? "used"
        : "active",
    counter: bo.counter || 1,
    orderId: bo.id,
  };

  return {
    id: bo.id,
    token,
    paymentMethod: bo.payment_method || "UPI",
    timestamp: bo.created_at || new Date().toISOString(),
    status: bo.status,
    total_amount: bo.total_amount,
  };
}
