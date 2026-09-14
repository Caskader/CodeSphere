import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import QRCodeDisplay from "../components/QRCodeDisplay";
import { STUDENT } from "../data/mockData";

export default function TokenPage() {
  const { activeToken, setActivePage, orders, refreshOrders, cancelOrder } = useApp();
  const [cancelling, setCancelling] = useState(false);

  if (!activeToken) {
    return (
      <div className="animate-slide-up flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="text-6xl">🎫</div>
        <div>
          <h2 className="text-xl font-bold text-white">No Active Token</h2>
          <p className="text-sm mt-2 max-w-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            Place an order from the menu and complete payment to receive your digital meal token.
          </p>
        </div>
        <button
          onClick={() => setActivePage("menu")}
          className="mt-2 px-6 py-3 rounded-xl font-semibold text-white cursor-pointer"
          style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
          Order Now →
        </button>
        {orders.length > 0 && (
          <button onClick={() => setActivePage("history")}
            className="text-sm font-medium cursor-pointer" style={{ color: "rgba(255,255,255,0.4)" }}>
            View Past Orders
          </button>
        )}
      </div>
    );
  }

  const token = activeToken;
  const createdAt = new Date(token.createdAt);
  const expiresAt = new Date(createdAt.getTime() + 45 * 60000);
  const now = new Date();
  const isExpired = now > expiresAt;
  const minsLeft = Math.max(0, Math.round((expiresAt.getTime() - now.getTime()) / 60000));

  // Find matching order in orders list for real-time status
  const matchedOrder = token.orderId ? orders.find(o => o.id === token.orderId) : null;
  const currentStatus = (matchedOrder?.status || token.status || "placed").toLowerCase();
  const isCancelled = currentStatus === "cancelled";
  const isReady = currentStatus === "ready";
  const isCompleted = currentStatus === "completed" || token.status === "used";

  const handleCancel = async () => {
    if (!token.orderId) return;
    if (!confirm("Are you sure you want to cancel this active meal token?")) return;
    setCancelling(true);
    try {
      const res = await cancelOrder(token.orderId);
      if (!res.success) {
        alert(res.error || "Could not cancel token");
      }
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="animate-slide-up space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Meal Token</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Present this token at the counter</p>
        </div>
        <button
          onClick={() => refreshOrders()}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
        >
          🔄 Refresh Status
        </button>
      </div>

      {/* Ready Alert */}
      {isReady && (
        <div className="p-4 rounded-2xl flex items-center gap-3 animate-pulse"
          style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)" }}>
          <span className="text-3xl">🎉</span>
          <div>
            <div className="text-sm font-bold text-green-400">Order is READY for pickup!</div>
            <div className="text-xs text-green-300/80">Please show this QR token at Counter #{token.counter}.</div>
          </div>
        </div>
      )}

      {/* Cancelled Alert */}
      {isCancelled && (
        <div className="p-4 rounded-2xl flex items-center gap-3"
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)" }}>
          <span className="text-3xl">✕</span>
          <div>
            <div className="text-sm font-bold text-red-400">Order has been cancelled</div>
            <div className="text-xs text-red-300/80">This meal token is no longer valid at the counter.</div>
          </div>
        </div>
      )}

      {/* Token Card */}
      <div className="rounded-3xl overflow-hidden" style={{
        background: "linear-gradient(145deg, #0E1420, #121929)",
        border: `1px solid ${isCancelled ? "rgba(239,68,68,0.3)" : isReady ? "rgba(34,197,94,0.4)" : "rgba(249,115,22,0.3)"}`,
        boxShadow: isReady
          ? "0 0 48px rgba(34,197,94,0.2), 0 0 1px rgba(34,197,94,0.4)"
          : isCancelled
          ? "0 0 48px rgba(239,68,68,0.1)"
          : "0 0 48px rgba(249,115,22,0.15), 0 0 1px rgba(249,115,22,0.4)",
      }}>
        {/* Top strip */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(90deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))", borderBottom: "1px solid rgba(249,115,22,0.15)" }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">🍴</span>
            <span className="text-sm font-bold text-white">VIT Night Mess</span>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
            style={{
              background: isCancelled
                ? "rgba(239,68,68,0.2)"
                : isReady
                ? "rgba(34,197,94,0.2)"
                : isExpired
                ? "rgba(239,68,68,0.2)"
                : "rgba(249,115,22,0.2)",
              color: isCancelled
                ? "#EF4444"
                : isReady
                ? "#22C55E"
                : isExpired
                ? "#EF4444"
                : "#F97316",
            }}>
            {isCancelled
              ? "CANCELLED"
              : isReady
              ? "READY FOR PICKUP"
              : isCompleted
              ? "COMPLETED"
              : isExpired
              ? "EXPIRED"
              : `ACTIVE · ${minsLeft}m left`}
          </span>
        </div>

        {/* Main content */}
        <div className="p-6">
          {/* Token ID */}
          <div className="text-center mb-6">
            <div className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Token ID</div>
            <div className="text-2xl font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: isCancelled ? "#EF4444" : "#F97316" }}>{token.id}</div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <QRCodeDisplay value={token.id} size={180} />
          </div>

          {/* Counter Badge */}
          <div className="flex justify-center mb-5">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl"
              style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
              <div className="text-2xl font-extrabold" style={{ color: "#F97316", fontFamily: "JetBrains Mono" }}>#{token.counter}</div>
              <div>
                <div className="text-xs font-semibold text-white">Assigned Counter</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Head to counter {token.counter}</div>
              </div>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="border-dashed border-t my-4" style={{ borderColor: "rgba(255,255,255,0.1)" }} />

          {/* Student details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Student</div>
              <div className="font-semibold text-white">{token.studentName || STUDENT.name}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>ID</div>
              <div className="font-semibold text-white" style={{ fontFamily: "JetBrains Mono" }}>{token.studentId || STUDENT.id}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Meal Type</div>
              <div className="font-semibold text-white">{token.mealType}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Amount Paid</div>
              <div className="font-semibold text-white">₹{token.amount}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Issued At</div>
              <div className="font-semibold text-white" style={{ fontFamily: "JetBrains Mono", fontSize: 11 }}>
                {isNaN(createdAt.getTime())
                  ? token.createdAt
                  : createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Valid Until</div>
              <div className="font-semibold" style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: isExpired || isCancelled ? "#EF4444" : "#22C55E" }}>
                {isNaN(expiresAt.getTime())
                  ? "45 min"
                  : expiresAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Items Ordered</div>
            <div className="space-y-1.5">
              {token.items.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{item.emoji} {item.name} ×{item.quantity}</span>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "JetBrains Mono", fontSize: 12 }}>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setActivePage("menu")}
          className="py-3 rounded-xl text-sm font-semibold text-white cursor-pointer"
          style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
          Order More
        </button>
        <button onClick={() => setActivePage("history")}
          className="py-3 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}>
          View History
        </button>
      </div>

      {/* Cancel Order Button */}
      {token.orderId && !isCancelled && !isCompleted && !isReady && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          {cancelling ? "Cancelling order..." : "Cancel This Order"}
        </button>
      )}
    </div>
  );
}
