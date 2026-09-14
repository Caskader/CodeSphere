import React from "react";
import { useApp } from "../context/AppContext";
import QRCodeDisplay from "../components/QRCodeDisplay";
import { STUDENT } from "../data/mockData";

export default function TokenPage() {
  const { activeToken, setActivePage, orders } = useApp();

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
          className="mt-2 px-6 py-3 rounded-xl font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
          Order Now →
        </button>
        {orders.length > 0 && (
          <button onClick={() => setActivePage("history")}
            className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
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

  return (
    <div className="animate-slide-up space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">My Meal Token</h1>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Present this token at the counter</p>
      </div>

      {/* Token Card */}
      <div className="rounded-3xl overflow-hidden" style={{
        background: "linear-gradient(145deg, #0E1420, #121929)",
        border: "1px solid rgba(249,115,22,0.3)",
        boxShadow: "0 0 48px rgba(249,115,22,0.15), 0 0 1px rgba(249,115,22,0.4)",
      }}>
        {/* Top strip */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(90deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))", borderBottom: "1px solid rgba(249,115,22,0.15)" }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">🍴</span>
            <span className="text-sm font-bold text-white">VIT Night Mess</span>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: isExpired ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)", color: isExpired ? "#EF4444" : "#22C55E" }}>
            {isExpired ? "EXPIRED" : `ACTIVE · ${minsLeft}m left`}
          </span>
        </div>

        {/* Main content */}
        <div className="p-6">
          {/* Token ID */}
          <div className="text-center mb-6">
            <div className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Token ID</div>
            <div className="text-2xl font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: "#F97316" }}>{token.id}</div>
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
              <div className="font-semibold text-white">{token.studentName}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>ID</div>
              <div className="font-semibold text-white" style={{ fontFamily: "JetBrains Mono" }}>{token.studentId}</div>
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
                {createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Valid Until</div>
              <div className="font-semibold" style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: isExpired ? "#EF4444" : "#22C55E" }}>
                {expiresAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
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
          className="py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
          Order More
        </button>
        <button onClick={() => setActivePage("history")}
          className="py-3 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}>
          View History
        </button>
      </div>
    </div>
  );
}
