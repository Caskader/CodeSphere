export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: "available" | "limited" | "unavailable";
  emoji: string;
  prepTime: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface MealToken {
  id: string;
  studentName: string;
  studentId: string;
  mealType: string;
  items: CartItem[];
  amount: number;
  createdAt: string;
  status: "active" | "used" | "expired";
  counter: number;
}

export interface Order {
  id: string;
  token: MealToken;
  paymentMethod: string;
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "alert";
  time: string;
  isNew: boolean;
}

export type Page = "dashboard" | "menu" | "queue" | "token" | "announcements" | "history" | "profile";

export type SmartRecommendation = "GO_NOW" | "WAIT" | "AVOID";
