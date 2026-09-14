import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import QRCodeDisplay from "../components/QRCodeDisplay";
import type { Order } from "../types";

export default function HistoryPage() {
  const { orders, setActivePage } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);

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
          className="mt-2 px-6 py-3 rounded-xl font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
          Order Now →
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Order History</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
      </div>

      <div className="space-y-3">
        {orders.map((order: Order) => {
          const date = new Date(order.timestamp);
          const isExpanded = expanded === order.id;
          return (
            <div key={order.id} className="glass-card rounded-2xl overflow-hidden">
              <button
                className="w-full p-4 text-left flex items-center gap-3"
                onClick={() => setExpanded(isExpanded ? null : order.id)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "rgba(249,115,22,0.1)" }}>🧾</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{order.token.id}</div>
                  <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: 11 }}>
                      {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </span>
                    <span>·</span>
                    <span>{order.paymentMethod}</span>
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
                      <div className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Items</div>
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
            ₹{orders.reduce((s, o) => s + o.token.amount, 0)}
          </div>
        </div>
        <div className="text-2xl">📊</div>
      </div>
    </div>
  );
}
