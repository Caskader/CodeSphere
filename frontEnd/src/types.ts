export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: "available" | "limited" | "unavailable";
  emoji: string;
  prepTime: number;
  is_available?: boolean;
  image_url?: string;
  average_rating?: number;
  review_count?: number;
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
  status: "active" | "used" | "expired" | "cancelled" | "preparing" | "ready";
  counter: number;
  orderId?: string;
}

export interface Order {
  id: string;
  token: MealToken;
  paymentMethod: string;
  timestamp: string;
  status?: "placed" | "preparing" | "ready" | "completed" | "cancelled" | string;
  total_amount?: number;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  student_id: string;
  room_number: string;
  hostel_block: string;
  branch: string;
  year: string;
  mess_balance: number;
  role: string;
}

export interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at?: string;
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
