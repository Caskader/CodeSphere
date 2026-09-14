import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { MENU_ITEMS, CATEGORIES } from "../data/mockData";
import type { CartItem, MealToken, Order } from "../types";
import QRCodeDisplay from "../components/QRCodeDisplay";
import { STUDENT } from "../data/mockData";

const STATUS_STYLE = {
  available: { label: "Available", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  limited: { label: "Limited", color: "#EAB308", bg: "rgba(234,179,8,0.12)" },
  unavailable: { label: "Unavailable", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

type PayStep = "cart" | "payment" | "processing" | "success" | "failed";

function generateTokenId(): string {
  return "VIT-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export default function MenuPage() {
  const { cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal, cartCount, setActiveToken, addOrder } = useApp();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showCartPanel, setShowCartPanel] = useState(false);
  const [payStep, setPayStep] = useState<PayStep>("cart");
  const [payMethod, setPayMethod] = useState<"upi" | "card">("upi");
  const [upiId, setUpiId] = useState("");
  const [generatedToken, setGeneratedToken] = useState<MealToken | null>(null);

  const filtered = MENU_ITEMS.filter(item =>
    (category === "All" || item.category === category) &&
    (search === "" || item.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCheckout = () => {
    setShowCartPanel(true);
    setPayStep("cart");
  };

  const handlePay = () => {
    setPayStep("processing");
    setTimeout(() => {
      const success = Math.random() > 0.1;
      if (success) {
        const token: MealToken = {
          id: generateTokenId(),
          studentName: STUDENT.name,
          studentId: STUDENT.id,
          mealType: "Night Mess",
          items: [...cart],
          amount: cartTotal,
          createdAt: new Date().toISOString(),
          status: "active",
          counter: Math.ceil(Math.random() * 3),
        };
        const order: Order = {
          id: "ORD-" + Date.now(),
          token,
          paymentMethod: payMethod === "upi" ? `UPI (${upiId || "PhonePe"})` : "Card",
          timestamp: new Date().toISOString(),
        };
        setGeneratedToken(token);
        setActiveToken(token);
        addOrder(order);
        clearCart();
        setPayStep("success");
      } else {
        setPayStep("failed");
      }
    }, 2200);
  };

  const handleClose = () => {
    setShowCartPanel(false);
    setPayStep("cart");
    setGeneratedToken(null);
  };

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Tonight's Menu</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Night Mess · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" })}</p>
        </div>
        {cartCount > 0 && (
          <button onClick={handleCheckout}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", color: "white" }}>
            🛒 Cart
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.3)" }}>{cartCount}</span>
            <span>· ₹{cartTotal}</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base">🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search dishes..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#E8EAF0" }}
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: category === cat ? "#F97316" : "rgba(255,255,255,0.06)",
              color: category === cat ? "white" : "rgba(255,255,255,0.5)",
            }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(item => {
          const st = STATUS_STYLE[item.status];
          const cartItem = cart.find(c => c.id === item.id);
          return (
            <div key={item.id} className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col gap-3 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="text-3xl">{item.emoji}</div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: st.bg, color: st.color }}>
                  {st.label}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm leading-snug">{item.name}</div>
                <div className="text-xs mt-1 leading-snug" style={{ color: "rgba(255,255,255,0.45)" }}>{item.description}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">₹{item.price}</span>
                {item.status === "unavailable" ? (
                  <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                    Unavailable
                  </span>
                ) : cartItem ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white transition-all"
                      style={{ background: "rgba(249,115,22,0.2)" }}>−</button>
                    <span className="text-sm font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: "#F97316" }}>{cartItem.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white transition-all"
                      style={{ background: "#F97316" }}>+</button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(item)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "rgba(249,115,22,0.15)", color: "#F97316", border: "1px solid rgba(249,115,22,0.3)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F97316"; (e.currentTarget as HTMLElement).style.color = "white"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(249,115,22,0.15)"; (e.currentTarget as HTMLElement).style.color = "#F97316"; }}>
                    + Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-30 animate-slide-up">
          <button onClick={handleCheckout}
            className="flex items-center gap-4 px-6 py-3 rounded-2xl shadow-xl font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", boxShadow: "0 8px 32px rgba(249,115,22,0.4)" }}>
            <span className="text-sm">{cartCount} item{cartCount > 1 ? "s" : ""}</span>
            <span className="w-px h-4" style={{ background: "rgba(255,255,255,0.3)" }} />
            <span className="text-sm">₹{cartTotal}</span>
            <span className="text-sm font-bold">→ View Cart</span>
          </button>
        </div>
      )}

      {/* Cart / Payment Modal */}
      {showCartPanel && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget && payStep !== "processing") handleClose(); }}>
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up"
            style={{ background: "#0E1420", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

            {/* Modal header */}
            <div className="flex items-center justify-between p-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h2 className="font-bold text-white">
                {payStep === "cart" ? "Your Cart" : payStep === "payment" ? "Choose Payment" : payStep === "processing" ? "Processing..." : payStep === "success" ? "Payment Successful!" : "Payment Failed"}
              </h2>
              {payStep !== "processing" && (
                <button onClick={handleClose} className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>×</button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {/* Cart Step */}
              {payStep === "cart" && (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>₹{item.price} each</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>−</button>
                        <span className="text-sm font-bold w-4 text-center" style={{ fontFamily: "JetBrains Mono", color: "#F97316" }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center" style={{ background: "#F97316", color: "white" }}>+</button>
                      </div>
                      <div className="text-sm font-bold text-white w-14 text-right">₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                  <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex justify-between text-sm text-white font-bold">
                      <span>Total</span>
                      <span>₹{cartTotal}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Inclusive of all charges</div>
                  </div>
                </div>
              )}

              {/* Payment Step */}
              {payStep === "payment" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {(["upi", "card"] as const).map(m => (
                      <button key={m} onClick={() => setPayMethod(m)}
                        className="p-3 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: payMethod === m ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${payMethod === m ? "#F97316" : "rgba(255,255,255,0.08)"}`,
                          color: payMethod === m ? "#F97316" : "rgba(255,255,255,0.6)",
                        }}>
                        {m === "upi" ? "📱 UPI" : "💳 Card"}
                      </button>
                    ))}
                  </div>

                  {payMethod === "upi" && (
                    <div>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>UPI ID</label>
                      <input
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E8EAF0" }}
                      />
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {["GPay", "PhonePe", "Paytm"].map(app => (
                          <button key={app} onClick={() => setUpiId(STUDENT.email.split("@")[0] + "@" + app.toLowerCase())}
                            className="text-xs px-2.5 py-1 rounded-lg font-medium"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                            {app}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {payMethod === "card" && (
                    <div className="space-y-3">
                      <input placeholder="Card Number" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E8EAF0" }} />
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="MM/YY" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E8EAF0" }} />
                        <input placeholder="CVV" className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E8EAF0" }} />
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Amount to pay</span>
                    <span className="text-lg font-bold text-white">₹{cartTotal}</span>
                  </div>
                </div>
              )}

              {/* Processing */}
              {payStep === "processing" && (
                <div className="flex flex-col items-center py-8 gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-t-orange-500 animate-spin-slow"
                    style={{ borderColor: "rgba(249,115,22,0.2)", borderTopColor: "#F97316" }} />
                  <div className="text-sm text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Verifying payment via {payMethod === "upi" ? "UPI" : "Card"}...
                  </div>
                </div>
              )}

              {/* Success */}
              {payStep === "success" && generatedToken && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: "rgba(34,197,94,0.15)" }}>✅</div>
                  <div className="text-center">
                    <div className="font-bold text-white text-lg">Payment Confirmed!</div>
                    <div className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>₹{generatedToken.amount} paid successfully</div>
                  </div>

                  <div className="w-full rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Your Meal Token</div>
                    <div className="text-xl font-bold mb-1" style={{ fontFamily: "JetBrains Mono", color: "#F97316" }}>{generatedToken.id}</div>
                    <div className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Counter #{generatedToken.counter} · Show this at the counter</div>
                    <div className="flex justify-center">
                      <QRCodeDisplay value={generatedToken.id} size={140} />
                    </div>
                    <div className="mt-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{STUDENT.name} · {STUDENT.id}</div>
                  </div>
                </div>
              )}

              {/* Failed */}
              {payStep === "failed" && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: "rgba(239,68,68,0.15)" }}>❌</div>
                  <div className="text-center">
                    <div className="font-bold text-white text-lg">Payment Failed</div>
                    <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Transaction could not be completed. Please try again.</div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 pt-0" style={{ borderTop: payStep !== "processing" ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              {payStep === "cart" && (
                <div className="space-y-2">
                  <button onClick={() => setPayStep("payment")}
                    className="w-full py-3 rounded-xl font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
                    Proceed to Pay · ₹{cartTotal}
                  </button>
                  <button onClick={handleClose} className="w-full py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}>
                    Continue Shopping
                  </button>
                </div>
              )}
              {payStep === "payment" && (
                <div className="space-y-2">
                  <button onClick={handlePay}
                    className="w-full py-3 rounded-xl font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
                    Pay ₹{cartTotal} →
                  </button>
                  <button onClick={() => setPayStep("cart")} className="w-full py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}>
                    ← Back to Cart
                  </button>
                </div>
              )}
              {payStep === "success" && (
                <button onClick={handleClose}
                  className="w-full py-3 rounded-xl font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}>
                  View My Token →
                </button>
              )}
              {payStep === "failed" && (
                <div className="space-y-2">
                  <button onClick={() => setPayStep("payment")}
                    className="w-full py-3 rounded-xl font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
                    Try Again
                  </button>
                  <button onClick={handleClose} className="w-full py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
