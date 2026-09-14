import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import QRCodeDisplay from "../components/QRCodeDisplay";
import type { Order } from "../types";

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  placed: { label: "Placed", color: "#F97316", bg: "rgba(249,115,22,0.15)" },
  preparing: { label: "Preparing", color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  ready: { label: "Ready for Pickup", color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
  completed: { label: "Completed", color: "#A855F7", bg: "rgba(168,85,247,0.15)" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
};

export default function HistoryPage() {
  const { orders, setActivePage, refreshOrders, ordersLoading, cancelOrder } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancellingId(orderId);
    try {
      const res = await cancelOrder(orderId);
      if (!res.success) {
        alert(res.error || "Could not cancel order");
      }
    } finally {
      setCancellingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="animate-slide-up flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="text-6xl">🕑</div>
        <div>
          <h2 className="text-xl font-bold text-white">No Orders Yet</h2>
          <p className="text-sm mt-2 max-w-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            Your order history will appear here after your first purchase.
          </p>
        </div>
        <button onClick={() => setActivePage("menu")}
          className="mt-2 px-6 py-3 rounded-xl font-semibold text-white cursor-pointer"
          style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
          Order Now →
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Order History</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {orders.length} order{orders.length !== 1 ? "s" : ""} placed
            {ordersLoading && <span className="ml-2 text-xs text-orange-400">Syncing with server...</span>}
          </p>
        </div>
        <button
          onClick={() => refreshOrders()}
          disabled={ordersLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
        >
          🔄 Refresh
        </button>
      </div>

      <div className="space-y-3">
        {orders.map((order: Order) => {
          const date = new Date(order.timestamp);
          const isExpanded = expanded === order.id;
          const statusKey = (order.status || (order.token.status === "cancelled" ? "cancelled" : "placed")).toLowerCase();
          const statusConfig = ORDER_STATUS_CONFIG[statusKey] || ORDER_STATUS_CONFIG.placed;
          const canCancel = statusKey === "placed" || statusKey === "preparing";

          return (
            <div key={order.id} className="glass-card rounded-2xl overflow-hidden">
              <button
                className="w-full p-4 text-left flex items-center gap-3 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : order.id)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "rgba(249,115,22,0.1)" }}>🧾</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">{order.token.id}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{ background: statusConfig.bg, color: statusConfig.color }}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: 11 }}>
                      {isNaN(date.getTime())
                        ? order.timestamp
                        : `${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`}
                    </span>
                    <span>·</span>
                    <span>{order.paymentMethod}</span>
                    {order.token.counter && (
                      <>
                        <span>·</span>
                        <span className="text-orange-400">Counter #{order.token.counter}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-white">₹{order.token.amount}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {order.token.items.length} item{order.token.items.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <span className="text-xs ml-2 transition-transform" style={{ color: "rgba(255,255,255,0.3)", transform: isExpanded ? "rotate(90deg)" : "none" }}>▶</span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 animate-fade-in" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="pt-4 grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Items Ordered</div>
                      <div className="space-y-1.5">
                        {order.token.items.map(item => (
                          <div key={item.id} className="flex justify-between text-xs">
                            <span style={{ color: "rgba(255,255,255,0.7)" }}>{item.emoji} {item.name} ×{item.quantity}</span>
                            <span style={{ fontFamily: "JetBrains Mono", color: "rgba(255,255,255,0.5)" }}>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs font-bold pt-1 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <span className="text-white">Total</span>
                          <span style={{ fontFamily: "JetBrains Mono", color: "#F97316" }}>₹{order.token.amount}</span>
                        </div>
                      </div>

                      {canCancel && (
                        <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <button
                            onClick={e => handleCancel(order.id, e)}
                            disabled={cancellingId === order.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}
                          >
                            {cancellingId === order.id ? "Cancelling..." : "✕ Cancel Order"}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Token QR</div>
                      <QRCodeDisplay value={order.token.id} size={100} />
                      <div className="text-xs" style={{ fontFamily: "JetBrains Mono", color: "#F97316" }}>{order.token.id}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Total Spent This Month</div>
          <div className="text-xl font-bold text-white mt-0.5">
            ₹{orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.token.amount, 0)}
          </div>
        </div>
        <div className="text-2xl">📊</div>
      </div>
    </div>
  );
}
