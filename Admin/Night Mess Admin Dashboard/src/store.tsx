import { createContext, useContext, useReducer, useEffect, ReactNode } from "react";

export type MealType = "breakfast" | "lunch" | "dinner";
export type OrderStatus = "pending" | "accepted" | "rejected" | "collected";
export type PaymentStatus = "paid" | "unpaid" | "refunded";
export type QRStatus = "valid" | "invalid" | "expired" | "unpaid" | "duplicate";
export type Availability = "available" | "limited" | "unavailable";
export type ComplaintStatus = "open" | "in-progress" | "resolved";
export type Priority = "low" | "medium" | "high";

export interface Order {
  id: string;
  studentName: string;
  studentId: string;
  mealType: MealType;
  items: string[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  tokenId: string;
  amount: number;
  timestamp: string;
  collectedAt?: string;
  rejectionReason?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  maxStock: number;
  availability: Availability;
  price: number;
  wastage: number;
  unit: string;
}

export interface Complaint {
  id: string;
  studentName: string;
  studentId: string;
  category: string;
  description: string;
  status: ComplaintStatus;
  timestamp: string;
  priority: Priority;
  resolution?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  published: boolean;
  timestamp: string;
  category: string;
  pinned: boolean;
}

export interface QueueEntry {
  id: string;
  studentName: string;
  studentId: string;
  tokenId: string;
  orderId: string;
  position: number;
  mealType: MealType;
  estimatedWait: number;
  status: "waiting" | "serving" | "done";
  joinedAt: string;
}

export interface FraudAlert {
  id: string;
  type: "duplicate_scan" | "invalid_token" | "expired_token" | "unpaid_scan";
  studentId: string;
  studentName: string;
  tokenId: string;
  timestamp: string;
  resolved: boolean;
}

export interface MessSettings {
  messName: string;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  maxCapacity: number;
  avgServiceTime: number;
  notificationEmail: string;
  autoCloseAfterMeal: boolean;
  maxTokensPerMeal: number;
}

export interface AppState {
  orders: Order[];
  foodItems: FoodItem[];
  complaints: Complaint[];
  announcements: Announcement[];
  queue: QueueEntry[];
  fraudAlerts: FraudAlert[];
  messOpen: boolean;
  currentMeal: MealType;
  revenue: number;
  mealsServed: number;
  settings: MessSettings;
  revenueHistory: { date: string; breakfast: number; lunch: number; dinner: number }[];
  mealHistory: { date: string; count: number; wastage: number }[];
  notifications: { id: string; message: string; type: "info" | "warn" | "error"; timestamp: string }[];
}

type Action =
  | { type: "SET_ORDERS"; orders: Order[] }
  | { type: "ACCEPT_ORDER"; orderId: string }
  | { type: "REJECT_ORDER"; orderId: string; reason: string }
  | { type: "MARK_COLLECTED"; orderId: string }
  | { type: "VERIFY_QR"; tokenId: string }
  | { type: "RESOLVE_COMPLAINT"; complaintId: string; resolution: string }
  | { type: "UPDATE_COMPLAINT_STATUS"; complaintId: string; status: ComplaintStatus }
  | { type: "PUBLISH_ANNOUNCEMENT"; announcementId: string }
  | { type: "UNPUBLISH_ANNOUNCEMENT"; announcementId: string }
  | { type: "ADD_ANNOUNCEMENT"; announcement: Omit<Announcement, "id" | "timestamp"> }
  | { type: "DELETE_ANNOUNCEMENT"; announcementId: string }
  | { type: "ADD_FOOD"; food: FoodItem }
  | { type: "EDIT_FOOD"; food: FoodItem }
  | { type: "DELETE_FOOD"; foodId: string }
  | { type: "UPDATE_STOCK"; foodId: string; stock: number }
  | { type: "SET_AVAILABILITY"; foodId: string; availability: Availability }
  | { type: "TOGGLE_MESS"; open: boolean }
  | { type: "SET_CURRENT_MEAL"; meal: MealType }
  | { type: "UPDATE_SETTINGS"; settings: Partial<MessSettings> }
  | { type: "RESOLVE_FRAUD"; alertId: string }
  | { type: "REMOVE_FROM_QUEUE"; queueId: string }
  | { type: "ADD_TO_QUEUE"; entry: Omit<QueueEntry, "id" | "position" | "joinedAt"> }
  | { type: "ADD_NOTIFICATION"; message: string; notifType: "info" | "warn" | "error" }
  | { type: "RESET_DEMO" };

const generateId = () => Math.random().toString(36).slice(2, 10).toUpperCase();

const now = () => new Date().toISOString();
const daysAgo = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt.toISOString();
};

const STUDENTS = [
  { name: "Arjun Mehta", id: "STU001" },
  { name: "Priya Sharma", id: "STU002" },
  { name: "Rahul Verma", id: "STU003" },
  { name: "Anika Patel", id: "STU004" },
  { name: "Kabir Singh", id: "STU005" },
  { name: "Divya Nair", id: "STU006" },
  { name: "Rohan Gupta", id: "STU007" },
  { name: "Meera Joshi", id: "STU008" },
  { name: "Vikram Reddy", id: "STU009" },
  { name: "Sneha Iyer", id: "STU010" },
  { name: "Amit Khanna", id: "STU011" },
  { name: "Pooja Bhatt", id: "STU012" },
];

const makeInitialState = (): AppState => {
  const orders: Order[] = [
    { id: "ORD001", studentName: "Arjun Mehta", studentId: "STU001", mealType: "dinner", items: ["Dal Makhani", "Roti x3", "Salad"], status: "accepted", paymentStatus: "paid", tokenId: "TKN001", amount: 85, timestamp: daysAgo(0) },
    { id: "ORD002", studentName: "Priya Sharma", studentId: "STU002", mealType: "dinner", items: ["Paneer Butter Masala", "Rice", "Raita"], status: "pending", paymentStatus: "paid", tokenId: "TKN002", amount: 95, timestamp: daysAgo(0) },
    { id: "ORD003", studentName: "Rahul Verma", studentId: "STU003", mealType: "dinner", items: ["Chole Bhature", "Lassi"], status: "pending", paymentStatus: "unpaid", tokenId: "TKN003", amount: 70, timestamp: daysAgo(0) },
    { id: "ORD004", studentName: "Anika Patel", studentId: "STU004", mealType: "dinner", items: ["Biryani", "Raita", "Papad"], status: "collected", paymentStatus: "paid", tokenId: "TKN004", amount: 110, timestamp: daysAgo(0), collectedAt: new Date(Date.now() - 20 * 60000).toISOString() },
    { id: "ORD005", studentName: "Kabir Singh", studentId: "STU005", mealType: "dinner", items: ["Rajma Chawal", "Pickle"], status: "accepted", paymentStatus: "paid", tokenId: "TKN005", amount: 80, timestamp: daysAgo(0) },
    { id: "ORD006", studentName: "Divya Nair", studentId: "STU006", mealType: "lunch", items: ["Thali Special"], status: "collected", paymentStatus: "paid", tokenId: "TKN006", amount: 120, timestamp: daysAgo(0), collectedAt: daysAgo(0) },
    { id: "ORD007", studentName: "Rohan Gupta", studentId: "STU007", mealType: "lunch", items: ["Veg Fried Rice", "Manchurian"], status: "rejected", paymentStatus: "refunded", tokenId: "TKN007", amount: 90, timestamp: daysAgo(1), rejectionReason: "Item unavailable" },
    { id: "ORD008", studentName: "Meera Joshi", studentId: "STU008", mealType: "breakfast", items: ["Idli x4", "Sambar", "Chutney"], status: "collected", paymentStatus: "paid", tokenId: "TKN008", amount: 50, timestamp: daysAgo(1), collectedAt: daysAgo(1) },
    { id: "ORD009", studentName: "Vikram Reddy", studentId: "STU009", mealType: "dinner", items: ["Egg Curry", "Roti x2", "Dal"], status: "pending", paymentStatus: "paid", tokenId: "TKN009", amount: 75, timestamp: daysAgo(0) },
    { id: "ORD010", studentName: "Sneha Iyer", studentId: "STU010", mealType: "breakfast", items: ["Poha", "Chai"], status: "collected", paymentStatus: "paid", tokenId: "TKN010", amount: 35, timestamp: daysAgo(1), collectedAt: daysAgo(1) },
    { id: "ORD011", studentName: "Amit Khanna", studentId: "STU011", mealType: "dinner", items: ["Butter Naan x3", "Shahi Paneer"], status: "pending", paymentStatus: "paid", tokenId: "TKN011", amount: 100, timestamp: daysAgo(0) },
    { id: "ORD012", studentName: "Pooja Bhatt", studentId: "STU012", mealType: "dinner", items: ["Masoor Dal", "Jeera Rice", "Papad"], status: "accepted", paymentStatus: "paid", tokenId: "TKN012", amount: 65, timestamp: daysAgo(0) },
  ];

  const foodItems: FoodItem[] = [
    { id: "FOOD001", name: "Dal Makhani", category: "Main Course", stock: 45, maxStock: 100, availability: "available", price: 40, wastage: 5, unit: "servings" },
    { id: "FOOD002", name: "Paneer Butter Masala", category: "Main Course", stock: 22, maxStock: 80, availability: "limited", price: 55, wastage: 3, unit: "servings" },
    { id: "FOOD003", name: "Biryani", category: "Main Course", stock: 60, maxStock: 120, availability: "available", price: 75, wastage: 8, unit: "servings" },
    { id: "FOOD004", name: "Chole Bhature", category: "Snacks", stock: 0, maxStock: 50, availability: "unavailable", price: 45, wastage: 0, unit: "plates" },
    { id: "FOOD005", name: "Idli Sambar", category: "Breakfast", stock: 80, maxStock: 150, availability: "available", price: 30, wastage: 12, unit: "plates" },
    { id: "FOOD006", name: "Roti", category: "Bread", stock: 200, maxStock: 300, availability: "available", price: 5, wastage: 20, unit: "pieces" },
    { id: "FOOD007", name: "Jeera Rice", category: "Rice", stock: 70, maxStock: 100, availability: "available", price: 25, wastage: 6, unit: "servings" },
    { id: "FOOD008", name: "Rajma Chawal", category: "Main Course", stock: 15, maxStock: 80, availability: "limited", price: 50, wastage: 2, unit: "servings" },
    { id: "FOOD009", name: "Lassi", category: "Beverages", stock: 40, maxStock: 60, availability: "available", price: 20, wastage: 4, unit: "glasses" },
    { id: "FOOD010", name: "Poha", category: "Breakfast", stock: 55, maxStock: 100, availability: "available", price: 20, wastage: 7, unit: "plates" },
    { id: "FOOD011", name: "Shahi Paneer", category: "Main Course", stock: 18, maxStock: 60, availability: "limited", price: 60, wastage: 2, unit: "servings" },
    { id: "FOOD012", name: "Raita", category: "Sides", stock: 90, maxStock: 120, availability: "available", price: 15, wastage: 8, unit: "bowls" },
  ];

  const complaints: Complaint[] = [
    { id: "CMP001", studentName: "Rohan Gupta", studentId: "STU007", category: "Food Quality", description: "The dal was undercooked today at lunch. Very hard and not properly seasoned.", status: "open", timestamp: daysAgo(0), priority: "high" },
    { id: "CMP002", studentName: "Meera Joshi", studentId: "STU008", category: "Hygiene", description: "Found a foreign object (plastic piece) in the biryani served on Wednesday.", status: "in-progress", timestamp: daysAgo(1), priority: "high" },
    { id: "CMP003", studentName: "Vikram Reddy", studentId: "STU009", category: "Service", description: "Queue management was poor during dinner rush hour, waited over 40 minutes.", status: "open", timestamp: daysAgo(1), priority: "medium" },
    { id: "CMP004", studentName: "Sneha Iyer", studentId: "STU010", category: "Quantity", description: "Roti portions have been reduced without any notice. Getting only 2 instead of 3.", status: "resolved", timestamp: daysAgo(3), priority: "low", resolution: "Portion sizes have been standardized. Extra roti available on request." },
    { id: "CMP005", studentName: "Amit Khanna", studentId: "STU011", category: "Billing", description: "Was charged twice for the same order. Token TKN011 shows duplicate payment.", status: "in-progress", timestamp: daysAgo(2), priority: "high" },
    { id: "CMP006", studentName: "Pooja Bhatt", studentId: "STU012", category: "Food Quality", description: "Milk served at breakfast was sour today. Multiple students affected.", status: "open", timestamp: daysAgo(0), priority: "medium" },
  ];

  const announcements: Announcement[] = [
    { id: "ANN001", title: "Diwali Special Menu — Oct 28", content: "Celebrate Diwali with our special festive menu featuring traditional sweets and snacks. Mithai box included with all meals at no extra cost.", published: true, timestamp: daysAgo(1), category: "Menu", pinned: true },
    { id: "ANN002", title: "Mess Closed — Nov 3 (Sunday)", content: "The mess will remain closed on November 3rd due to annual maintenance. Please make alternate arrangements for all three meals.", published: true, timestamp: daysAgo(2), category: "Operations", pinned: false },
    { id: "ANN003", title: "New Payment System Launched", content: "We have switched to a new UPI-based payment system. All tokens must now be purchased through the student portal before 6 PM for dinner.", published: false, timestamp: daysAgo(0), category: "Payments", pinned: false },
    { id: "ANN004", title: "Feedback Survey — Nov Week", content: "Help us improve! Fill out the monthly feedback survey available on the student portal. Top suggestions will be implemented next month.", published: true, timestamp: daysAgo(3), category: "General", pinned: false },
  ];

  const queue: QueueEntry[] = [
    { id: "Q001", studentName: "Arjun Mehta", studentId: "STU001", tokenId: "TKN001", orderId: "ORD001", position: 1, mealType: "dinner", estimatedWait: 2, status: "serving", joinedAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: "Q002", studentName: "Priya Sharma", studentId: "STU002", tokenId: "TKN002", orderId: "ORD002", position: 2, mealType: "dinner", estimatedWait: 5, status: "waiting", joinedAt: new Date(Date.now() - 4 * 60000).toISOString() },
    { id: "Q003", studentName: "Kabir Singh", studentId: "STU005", tokenId: "TKN005", orderId: "ORD005", position: 3, mealType: "dinner", estimatedWait: 8, status: "waiting", joinedAt: new Date(Date.now() - 3 * 60000).toISOString() },
    { id: "Q004", studentName: "Vikram Reddy", studentId: "STU009", tokenId: "TKN009", orderId: "ORD009", position: 4, mealType: "dinner", estimatedWait: 11, status: "waiting", joinedAt: new Date(Date.now() - 2 * 60000).toISOString() },
    { id: "Q005", studentName: "Amit Khanna", studentId: "STU011", tokenId: "TKN011", orderId: "ORD011", position: 5, mealType: "dinner", estimatedWait: 14, status: "waiting", joinedAt: new Date(Date.now() - 1 * 60000).toISOString() },
    { id: "Q006", studentName: "Pooja Bhatt", studentId: "STU012", tokenId: "TKN012", orderId: "ORD012", position: 6, mealType: "dinner", estimatedWait: 17, status: "waiting", joinedAt: new Date(Date.now() - 30000).toISOString() },
  ];

  const fraudAlerts: FraudAlert[] = [
    { id: "FR001", type: "duplicate_scan", studentId: "STU004", studentName: "Anika Patel", tokenId: "TKN004", timestamp: new Date(Date.now() - 25 * 60000).toISOString(), resolved: true },
    { id: "FR002", type: "invalid_token", studentId: "STU999", studentName: "Unknown", tokenId: "TKN_FAKE", timestamp: new Date(Date.now() - 45 * 60000).toISOString(), resolved: false },
    { id: "FR003", type: "unpaid_scan", studentId: "STU003", studentName: "Rahul Verma", tokenId: "TKN003", timestamp: new Date(Date.now() - 10 * 60000).toISOString(), resolved: false },
  ];

  const revenueHistory = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString("en-IN", { weekday: "short" }),
      breakfast: Math.floor(Math.random() * 2000 + 1500),
      lunch: Math.floor(Math.random() * 4000 + 3000),
      dinner: Math.floor(Math.random() * 5000 + 4000),
    };
  });

  const mealHistory = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString("en-IN", { weekday: "short" }),
      count: Math.floor(Math.random() * 80 + 180),
      wastage: Math.floor(Math.random() * 20 + 10),
    };
  });

  return {
    orders,
    foodItems,
    complaints,
    announcements,
    queue,
    fraudAlerts,
    messOpen: true,
    currentMeal: "dinner",
    revenue: 47250,
    mealsServed: 342,
    settings: {
      messName: "Night Mess — Hostel Block A",
      breakfastTime: "07:00 - 09:30",
      lunchTime: "12:30 - 14:30",
      dinnerTime: "19:00 - 22:00",
      maxCapacity: 400,
      avgServiceTime: 3,
      notificationEmail: "mess-admin@university.edu",
      autoCloseAfterMeal: true,
      maxTokensPerMeal: 1,
    },
    revenueHistory,
    mealHistory,
    notifications: [],
  };
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_ORDERS":
      return { ...state, orders: action.orders };
    case "ACCEPT_ORDER": {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order) return state;
      const alreadyInQueue = state.queue.some((q) => q.orderId === action.orderId);
      const newQueue = alreadyInQueue ? state.queue : [
        ...state.queue,
        {
          id: "Q" + generateId(),
          studentName: order.studentName,
          studentId: order.studentId,
          tokenId: order.tokenId,
          orderId: order.id,
          position: state.queue.length + 1,
          mealType: order.mealType,
          estimatedWait: (state.queue.length + 1) * 3,
          status: "waiting" as const,
          joinedAt: now(),
        },
      ];
      return {
        ...state,
        orders: state.orders.map((o) => o.id === action.orderId ? { ...o, status: "accepted" } : o),
        queue: newQueue,
      };
    }
    case "REJECT_ORDER":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, status: "rejected", paymentStatus: o.paymentStatus === "paid" ? "refunded" : o.paymentStatus, rejectionReason: action.reason } : o
        ),
      };
    case "MARK_COLLECTED": {
      const order = state.orders.find((o) => o.id === action.orderId);
      if (!order) return state;
      const updatedFood = state.foodItems.map((f) => {
        if (order.items.some((item) => item.toLowerCase().includes(f.name.toLowerCase()))) {
          const newStock = Math.max(0, f.stock - 1);
          return { ...f, stock: newStock, availability: newStock === 0 ? "unavailable" as Availability : newStock < f.maxStock * 0.2 ? "limited" as Availability : f.availability };
        }
        return f;
      });
      return {
        ...state,
        orders: state.orders.map((o) => o.id === action.orderId ? { ...o, status: "collected", collectedAt: now() } : o),
        queue: state.queue.filter((q) => q.orderId !== action.orderId),
        revenue: state.revenue + (order.paymentStatus === "paid" ? order.amount : 0),
        mealsServed: state.mealsServed + 1,
        foodItems: updatedFood,
      };
    }
    case "RESOLVE_COMPLAINT":
      return {
        ...state,
        complaints: state.complaints.map((c) =>
          c.id === action.complaintId ? { ...c, status: "resolved", resolution: action.resolution } : c
        ),
      };
    case "UPDATE_COMPLAINT_STATUS":
      return {
        ...state,
        complaints: state.complaints.map((c) =>
          c.id === action.complaintId ? { ...c, status: action.status } : c
        ),
      };
    case "PUBLISH_ANNOUNCEMENT":
      return {
        ...state,
        announcements: state.announcements.map((a) =>
          a.id === action.announcementId ? { ...a, published: true } : a
        ),
      };
    case "UNPUBLISH_ANNOUNCEMENT":
      return {
        ...state,
        announcements: state.announcements.map((a) =>
          a.id === action.announcementId ? { ...a, published: false } : a
        ),
      };
    case "ADD_ANNOUNCEMENT":
      return {
        ...state,
        announcements: [
          { ...action.announcement, id: "ANN" + generateId(), timestamp: now() },
          ...state.announcements,
        ],
      };
    case "DELETE_ANNOUNCEMENT":
      return {
        ...state,
        announcements: state.announcements.filter((a) => a.id !== action.announcementId),
      };
    case "ADD_FOOD":
      return {
        ...state,
        foodItems: [...state.foodItems, action.food],
      };
    case "EDIT_FOOD":
      return {
        ...state,
        foodItems: state.foodItems.map((f) => f.id === action.food.id ? action.food : f),
      };
    case "DELETE_FOOD":
      return {
        ...state,
        foodItems: state.foodItems.filter((f) => f.id !== action.foodId),
      };
    case "UPDATE_STOCK":
      return {
        ...state,
        foodItems: state.foodItems.map((f) => {
          if (f.id !== action.foodId) return f;
          const newStock = action.stock;
          let avail: Availability = f.availability;
          if (newStock === 0) avail = "unavailable";
          else if (newStock < f.maxStock * 0.25) avail = "limited";
          else avail = "available";
          return { ...f, stock: newStock, availability: avail };
        }),
      };
    case "SET_AVAILABILITY":
      return {
        ...state,
        foodItems: state.foodItems.map((f) =>
          f.id === action.foodId ? { ...f, availability: action.availability } : f
        ),
      };
    case "TOGGLE_MESS":
      return { ...state, messOpen: action.open };
    case "SET_CURRENT_MEAL":
      return { ...state, currentMeal: action.meal };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "RESOLVE_FRAUD":
      return {
        ...state,
        fraudAlerts: state.fraudAlerts.map((f) =>
          f.id === action.alertId ? { ...f, resolved: true } : f
        ),
      };
    case "REMOVE_FROM_QUEUE":
      return {
        ...state,
        queue: state.queue
          .filter((q) => q.id !== action.queueId)
          .map((q, i) => ({ ...q, position: i + 1, estimatedWait: (i + 1) * 3 })),
      };
    case "ADD_TO_QUEUE":
      return {
        ...state,
        queue: [
          ...state.queue,
          { ...action.entry, id: "Q" + generateId(), position: state.queue.length + 1, joinedAt: now() },
        ],
      };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [
          { id: generateId(), message: action.message, type: action.notifType, timestamp: now() },
          ...state.notifications.slice(0, 19),
        ],
      };
    case "RESET_DEMO":
      return makeInitialState();
    default:
      return state;
  }
}

const STORAGE_KEY = "night-mess-admin-v1";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// Set VITE_ADMIN_TOKEN in .env for deployments instead of using the demo token.
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5Adml0LmFjLmluIiwiaXNfYWRtaW4iOnRydWUsIm5hbWUiOiJBZG1pbiIsImV4cCI6MTgyMDkyNTM1MX0.bSafq0-bKWIsnzoO40t_nA1BELUzt99cuWuxfvbzzQY";

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return makeInitialState();
}

interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  createFoodItem: (food: Omit<FoodItem, "id">) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: "preparing" | "completed" | "cancelled", rejectionReason?: string) => Promise<boolean>;
  verifyQR: (tokenId: string) => { status: QRStatus; order?: Order; message: string };
  sendNotification: (message: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  const createFoodItem = async (food: Omit<FoodItem, "id">): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_TOKEN}` },
        body: JSON.stringify({
          ...food,
          is_available: food.availability !== "unavailable",
        }),
      });
      if (!res.ok) {
        console.error("Failed to create menu item", await res.json().catch(() => ({})));
        return false;
      }

      const data = await res.json();
      dispatch({ type: "ADD_FOOD", food: { ...food, id: data.id } });
      return true;
    } catch (err) {
      console.error("Failed to create menu item", err);
      return false;
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status: "preparing" | "completed" | "cancelled",
    rejectionReason?: string,
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_TOKEN}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        console.error("Failed to update order status", await res.json().catch(() => ({})));
        return false;
      }

      if (status === "preparing") dispatch({ type: "ACCEPT_ORDER", orderId });
      if (status === "completed") dispatch({ type: "MARK_COLLECTED", orderId });
      if (status === "cancelled") dispatch({ type: "REJECT_ORDER", orderId, reason: rejectionReason || "Rejected by admin" });
      return true;
    } catch (err) {
      console.error("Failed to update order status", err);
      return false;
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/orders`, {
          headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
        });
        if (res.ok) {
          const data = await res.json();
          const mappedOrders: Order[] = data.map((o: any) => ({
            id: o.id,
            studentName: o.student_name,
            studentId: o.student_id,
            mealType: o.meal_type.toLowerCase(),
            items: o.items.map((i: any) => `${i.name} x${i.quantity}`),
            status: o.status === "placed" ? "pending" : (o.status === "preparing" || o.status === "ready" ? "accepted" : (o.status === "completed" ? "collected" : "rejected")),
            paymentStatus: "paid",
            tokenId: o.token_id,
            amount: o.total_amount,
            timestamp: o.created_at,
          }));
          dispatch({ type: "SET_ORDERS", orders: mappedOrders });
        }
      } catch (err) {
        console.error("Failed to fetch orders", err);
      }
    };
    fetchOrders();
    const intervalId = setInterval(fetchOrders, 5000);
    return () => clearInterval(intervalId);
  }, []);


  const verifyQR = (tokenId: string): { status: QRStatus; order?: Order; message: string } => {
    const order = state.orders.find((o) => o.tokenId === tokenId.toUpperCase());
    if (!order) {
      const fraud: FraudAlert = {
        id: "FR" + generateId(),
        type: "invalid_token",
        studentId: "UNKNOWN",
        studentName: "Unknown",
        tokenId,
        timestamp: now(),
        resolved: false,
      };
      // We can't dispatch from here synchronously and return, so we handle alerts separately
      return { status: "invalid", message: "Token not found in system. Possible counterfeit." };
    }
    if (order.paymentStatus === "unpaid") {
      return { status: "unpaid", order, message: `Payment pending for ${order.studentName}. Amount: ₹${order.amount}` };
    }
    if (order.status === "collected") {
      return { status: "duplicate", order, message: `Token already used by ${order.studentName} at ${new Date(order.collectedAt!).toLocaleTimeString()}` };
    }
    if (order.status === "rejected") {
      return { status: "expired", order, message: `Order was rejected. Reason: ${order.rejectionReason || "N/A"}` };
    }
    const mealEndTimes: Record<MealType, string> = {
      breakfast: state.settings.breakfastTime.split(" - ")[1],
      lunch: state.settings.lunchTime.split(" - ")[1],
      dinner: state.settings.dinnerTime.split(" - ")[1],
    };
    const endTimeStr = mealEndTimes[order.mealType];
    const [endH, endM] = endTimeStr.split(":").map(Number);
    const now2 = new Date();
    const endTime = new Date();
    endTime.setHours(endH, endM, 0, 0);
    if (now2 > endTime) {
      return { status: "expired", order, message: `Token expired. Meal time ended at ${endTimeStr}` };
    }
    return { status: "valid", order, message: `Valid token for ${order.studentName} — ${order.mealType} (₹${order.amount})` };
  };

  const sendNotification = (message: string) => {
    dispatch({ type: "ADD_NOTIFICATION", message, notifType: "info" });
  };

  return (
    <StoreContext.Provider value={{ state, dispatch, createFoodItem, updateOrderStatus, verifyQR, sendNotification }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
