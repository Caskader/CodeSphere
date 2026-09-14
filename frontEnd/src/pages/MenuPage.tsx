import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import type { MealToken, MenuItem } from "../types";
import QRCodeDisplay from "../components/QRCodeDisplay";
import { STUDENT } from "../data/mockData";
import { api } from "../services/api";

const STATUS_STYLE = {
  available: { label: "Available", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  limited: { label: "Limited", color: "#EAB308", bg: "rgba(234,179,8,0.12)" },
  unavailable: { label: "Unavailable", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

type PayStep = "cart" | "payment" | "processing" | "success" | "failed";

export default function MenuPage() {
  const {
    cart, addToCart, updateQty,
    cartTotal, cartCount,
    menuItems, menuLoading, refreshMenu,
    placeOrder, setActivePage,
  } = useApp();

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showCartPanel, setShowCartPanel] = useState(false);
  const [payStep, setPayStep] = useState<PayStep>("cart");
  const [payMethod, setPayMethod] = useState<"upi" | "card">("upi");
  const [upiId, setUpiId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [generatedToken, setGeneratedToken] = useState<MealToken | null>(null);

  // Review modal state
  const [reviewItem, setReviewItem] = useState<MenuItem | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Categories dynamically derived from menuItems
  const categories = ["All", ...Array.from(new Set(menuItems.map(item => item.category).filter(Boolean)))];

  const filtered = menuItems.filter(item =>
    (category === "All" || item.category === category) &&
    (search === "" || item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCheckout = () => {
    setShowCartPanel(true);
    setPayStep("cart");
  };

  const handlePay = async () => {
    setPayStep("processing");
    setErrorMsg("");
    try {
      const res = await placeOrder(
        payMethod === "upi" ? "UPI" : "Card",
        payMethod === "upi" ? (upiId || "student@upi") : undefined
      );

      if (res.success && res.token) {
        setGeneratedToken(res.token);
        setPayStep("success");
      } else {
        setErrorMsg(res.error || "Order placement could not be completed.");
        setPayStep("failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process order. Please try again.");
      setPayStep("failed");
    }
  };

  const handleClose = () => {
    setShowCartPanel(false);
    setPayStep("cart");
    setGeneratedToken(null);
    setErrorMsg("");
  };

  const handleOpenReviews = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setReviewItem(item);
    setReviewRating(5);
    setReviewComment("");
    setReviewSuccess(false);
  };

  const handleSubmitReview = async () => {
    if (!reviewItem) return;
    setSubmittingReview(true);
    try {
      await api.addReview(reviewItem.id, reviewRating, reviewComment);
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewItem(null);
        refreshMenu();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Could not submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Tonight's Menu</h1>
            <button
              onClick={() => refreshMenu()}
              title="Refresh menu from backend"
              className="p-1 rounded-lg hover:bg-white/10 text-xs transition-colors"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              🔄
            </button>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Night Mess · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
            {menuLoading && <span className="ml-2 text-xs text-orange-400">Syncing with server...</span>}
          </p>
        </div>
        {cartCount > 0 && (
          <button onClick={handleCheckout}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:opacity-95 transition-opacity"
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
          placeholder="Search dishes, ingredients..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#E8EAF0" }}
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
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
          const st = STATUS_STYLE[item.status] || STATUS_STYLE.available;
          const cartItem = cart.find(c => c.id === item.id);
          const isUnavailable = item.status === "unavailable" || item.is_available === false;

          return (
            <div key={item.id} className="glass-card glass-card-hover rounded-2xl p-4 flex flex-col gap-3 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="text-3xl">{item.emoji}</div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={e => handleOpenReviews(item, e)}
                    className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#FBBF24" }}
                    title="View / add reviews"
                  >
                    ⭐ {item.average_rating ? item.average_rating : "Rate"}
                  </button>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm leading-snug">{item.name}</div>
                <div className="text-xs mt-1 leading-snug" style={{ color: "rgba(255,255,255,0.45)" }}>{item.description}</div>
                <div className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  ⏱ ~{item.prepTime} min prep · {item.category}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-bold text-white">₹{item.price}</span>
                {isUnavailable ? (
                  <span className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                    Unavailable
                  </span>
                ) : cartItem ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white cursor-pointer transition-all"
                      style={{ background: "rgba(249,115,22,0.2)" }}>−</button>
                    <span className="text-sm font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: "#F97316" }}>{cartItem.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white cursor-pointer transition-all"
                      style={{ background: "#F97316" }}>+</button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(item)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
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
      {cartCount > 0 && !showCartPanel && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-30 animate-slide-up">
          <button onClick={handleCheckout}
            className="flex items-center gap-4 px-6 py-3 rounded-2xl shadow-xl font-semibold text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg, #F97316, #EA580C)", boxShadow: "0 8px 32px rgba(249,115,22,0.4)" }}>
            <span className="text-sm">{cartCount} item{cartCount > 1 ? "s" : ""}</span>
            <span className="w-px h-4" style={{ background: "rgba(255,255,255,0.3)" }} />
            <span className="text-sm">₹{cartTotal}</span>
            <span className="text-sm font-bold">→ View Cart</span>
          </button>
        </div>
      )}

      {/* Review Modal */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => setReviewItem(null)}>
          <div className="w-full max-w-sm rounded-3xl p-5 animate-slide-up"
            style={{ background: "#0E1420", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{reviewItem.emoji}</span>
                <span className="font-bold text-white text-sm">{reviewItem.name}</span>
              </div>
              <button onClick={() => setReviewItem(null)} className="text-gray-400 hover:text-white text-sm">✕</button>
            </div>

            {reviewSuccess ? (
              <div className="py-6 text-center text-green-400 font-semibold text-sm">
                ✅ Review submitted! Thank you.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-2xl cursor-pointer transition-transform hover:scale-110"
                      >
                        {star <= reviewRating ? "⭐" : "☆"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1">Comment (optional)</label>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Taste, freshness, quantity..."
                    rows={3}
                    className="w-full p-2.5 rounded-xl text-xs outline-none text-white"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>

                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                  style={{ background: "#F97316", opacity: submittingReview ? 0.6 : 1 }}
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            )}
          </div>
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
                {payStep === "cart" ? "Your Cart" : payStep === "payment" ? "Choose Payment" : payStep === "processing" ? "Placing Order..." : payStep === "success" ? "Order Placed Successfully!" : "Order Failed"}
              </h2>
              {payStep !== "processing" && (
                <button onClick={handleClose} className="w-7 h-7 rounded-full flex items-center justify-center text-sm cursor-pointer"
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
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>−</button>
                        <span className="text-sm font-bold w-4 text-center" style={{ fontFamily: "JetBrains Mono", color: "#F97316" }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer" style={{ background: "#F97316", color: "white" }}>+</button>
                      </div>
                      <div className="text-sm font-bold text-white w-14 text-right">₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                  <div className="pt-3 mt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="flex justify-between text-sm text-white font-bold">
                      <span>Total</span>
                      <span>₹{cartTotal}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Verified live against mess server</div>
                  </div>
                </div>
              )}

              {/* Payment Step */}
              {payStep === "payment" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {(["upi", "card"] as const).map(m => (
                      <button key={m} onClick={() => setPayMethod(m)}
                        className="p-3 rounded-xl text-sm font-semibold transition-all cursor-pointer"
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
                            className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer"
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
                  <div className="w-16 h-16 rounded-full border-4 border-t-orange-500 animate-spin"
                    style={{ borderColor: "rgba(249,115,22,0.2)", borderTopColor: "#F97316" }} />
                  <div className="text-sm text-center" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Communicating with Mess Backend API & verifying payment...
                  </div>
                </div>
              )}

              {/* Success */}
              {payStep === "success" && generatedToken && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: "rgba(34,197,94,0.15)" }}>✅</div>
                  <div className="text-center">
                    <div className="font-bold text-white text-lg">Order Created & Confirmed!</div>
                    <div className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>₹{generatedToken.amount} saved to Firestore orders</div>
                  </div>

                  <div className="w-full rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Your Digital Meal Token</div>
                    <div className="text-xl font-bold mb-1" style={{ fontFamily: "JetBrains Mono", color: "#F97316" }}>{generatedToken.id}</div>
                    <div className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Assigned Counter: #{generatedToken.counter} · Show this at pickup
                    </div>
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
                    <div className="font-bold text-white text-lg">Order Placement Failed</div>
                    <div className="text-sm mt-1 px-4 text-red-400">
                      {errorMsg || "Transaction could not be completed. Please check server status."}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 pt-0" style={{ borderTop: payStep !== "processing" ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              {payStep === "cart" && (
                <div className="space-y-2">
                  <button onClick={() => setPayStep("payment")}
                    className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
                    Proceed to Pay · ₹{cartTotal}
                  </button>
                  <button onClick={handleClose} className="w-full py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}>
                    Continue Shopping
                  </button>
                </div>
              )}
              {payStep === "payment" && (
                <div className="space-y-2">
                  <button onClick={handlePay}
                    className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
                    Pay ₹{cartTotal} & Place Order →
                  </button>
                  <button onClick={() => setPayStep("cart")} className="w-full py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}>
                    ← Back to Cart
                  </button>
                </div>
              )}
              {payStep === "success" && (
                <button
                  onClick={() => {
                    handleClose();
                    setActivePage("token");
                  }}
                  className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}>
                  View Digital Token →
                </button>
              )}
              {payStep === "failed" && (
                <div className="space-y-2">
                  <button onClick={() => setPayStep("payment")}
                    className="w-full py-3 rounded-xl font-semibold text-white cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
                    Try Again
                  </button>
                  <button onClick={handleClose} className="w-full py-2.5 rounded-xl text-sm font-medium cursor-pointer"
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
