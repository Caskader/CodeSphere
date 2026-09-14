import { useState } from "react";
import { useStore, Order, MealType } from "../store";
import { Card, Badge, Button, PageHeader, Input, Select, StatCard, Modal } from "../components/ui";
import { ClipboardList, CheckCircle, XCircle, Clock, Package } from "lucide-react";

const statusVariant = (s: Order["status"]) =>
  s === "collected" ? "success" : s === "accepted" ? "info" : s === "rejected" ? "danger" : "warning";

const payVariant = (s: Order["paymentStatus"]) =>
  s === "paid" ? "success" : s === "unpaid" ? "danger" : "muted";

export default function OrdersTokens() {
  const { state, dispatch } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mealFilter, setMealFilter] = useState("all");
  const [payFilter, setPayFilter] = useState("all");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; orderId: string }>({ open: false, orderId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const filtered = state.orders.filter((o) => {
    const matchSearch =
      o.studentName.toLowerCase().includes(search.toLowerCase()) ||
      o.studentId.toLowerCase().includes(search.toLowerCase()) ||
      o.tokenId.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchMeal = mealFilter === "all" || o.mealType === mealFilter;
    const matchPay = payFilter === "all" || o.paymentStatus === payFilter;
    return matchSearch && matchStatus && matchMeal && matchPay;
  });

  const counts = {
    pending: state.orders.filter((o) => o.status === "pending").length,
    accepted: state.orders.filter((o) => o.status === "accepted").length,
    collected: state.orders.filter((o) => o.status === "collected").length,
    rejected: state.orders.filter((o) => o.status === "rejected").length,
  };

  const doReject = () => {
    if (!rejectReason.trim()) return;
    dispatch({ type: "REJECT_ORDER", orderId: rejectModal.orderId, reason: rejectReason });
    setRejectModal({ open: false, orderId: "" });
    setRejectReason("");
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="Orders & Tokens" subtitle="Manage student meal orders and token lifecycle" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Pending" value={counts.pending} accent={counts.pending > 3 ? "red" : "yellow"} icon={<Clock size={16} />} />
        <StatCard label="Accepted" value={counts.accepted} accent="cyan" icon={<CheckCircle size={16} />} />
        <StatCard label="Collected" value={counts.collected} accent="green" icon={<Package size={16} />} />
        <StatCard label="Rejected" value={counts.rejected} accent="red" icon={<XCircle size={16} />} />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-40">
            <Input placeholder="Search name, token, ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="collected">Collected</option>
            <option value="rejected">Rejected</option>
          </Select>
          <Select value={mealFilter} onChange={(e) => setMealFilter(e.target.value)} className="w-32">
            <option value="all">All Meals</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
          </Select>
          <Select value={payFilter} onChange={(e) => setPayFilter(e.target.value)} className="w-32">
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="refunded">Refunded</option>
          </Select>
        </div>
      </Card>

      {/* Orders table */}
      <Card>
        <div className="text-[10px] mono text-[#5a7099] mb-3">{filtered.length} orders found</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1a2540]">
                {["Token", "Student", "Meal", "Items", "Amount", "Payment", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left py-2 px-2 text-[10px] mono text-[#3a4d6b] uppercase tracking-wider font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a254020]">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-[#1a254010] transition-colors">
                  <td className="py-2.5 px-2">
                    <button onClick={() => setDetailOrder(order)} className="text-[#00c8ff] mono text-[10px] hover:underline">{order.tokenId}</button>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="text-[#dce6f5] font-medium truncate max-w-[120px]">{order.studentName}</div>
                    <div className="text-[9px] text-[#5a7099] mono">{order.studentId}</div>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="capitalize text-[#a0b4cc]">{order.mealType}</span>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="text-[#5a7099] truncate max-w-[140px]">{order.items.join(", ")}</div>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="mono text-[#a0b4cc]">₹{order.amount}</span>
                  </td>
                  <td className="py-2.5 px-2">
                    <Badge variant={payVariant(order.paymentStatus)} size="xs">{order.paymentStatus.toUpperCase()}</Badge>
                  </td>
                  <td className="py-2.5 px-2">
                    <Badge variant={statusVariant(order.status)} size="xs">{order.status.toUpperCase()}</Badge>
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-1">
                      {order.status === "pending" && (
                        <>
                          <Button
                            variant="success"
                            size="xs"
                            onClick={() => dispatch({ type: "ACCEPT_ORDER", orderId: order.id })}
                            disabled={order.paymentStatus === "unpaid"}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => setRejectModal({ open: true, orderId: order.id })}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {order.status === "accepted" && (
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => dispatch({ type: "MARK_COLLECTED", orderId: order.id })}
                        >
                          Mark Collected
                        </Button>
                      )}
                      {(order.status === "collected" || order.status === "rejected") && (
                        <span className="text-[9px] mono text-[#3a4d6b]">
                          {order.status === "collected" && order.collectedAt
                            ? new Date(order.collectedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                            : order.rejectionReason ? "Rejected" : "—"}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-xs text-[#3a4d6b]">No orders match your filters</div>
          )}
        </div>
      </Card>

      {/* Reject modal */}
      <Modal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, orderId: "" })}
        title="Reject Order"
      >
        <div className="space-y-3">
          <p className="text-xs text-[#5a7099]">Provide a reason for rejecting this order. The student will be notified and payment will be refunded.</p>
          <Input
            label="Rejection Reason"
            placeholder="e.g. Item unavailable, Mess closed..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="danger" size="sm" onClick={doReject} disabled={!rejectReason.trim()} className="flex-1">Reject Order</Button>
            <Button variant="ghost" size="sm" onClick={() => setRejectModal({ open: false, orderId: "" })}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Order detail modal */}
      <Modal open={!!detailOrder} onClose={() => setDetailOrder(null)} title={`Order Details — ${detailOrder?.tokenId}`}>
        {detailOrder && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Order ID", detailOrder.id],
                ["Token ID", detailOrder.tokenId],
                ["Student", detailOrder.studentName],
                ["Student ID", detailOrder.studentId],
                ["Meal", detailOrder.mealType],
                ["Amount", `₹${detailOrder.amount}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[10px] mono text-[#3a4d6b] uppercase mb-0.5">{k}</div>
                  <div className="text-[#dce6f5] font-medium capitalize">{v}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[10px] mono text-[#3a4d6b] uppercase mb-1">Items</div>
              <div className="flex flex-wrap gap-1">
                {detailOrder.items.map((item) => (
                  <span key={item} className="px-2 py-0.5 rounded bg-[#1a2540] text-[#a0b4cc] text-[10px] mono">{item}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={statusVariant(detailOrder.status)}>{detailOrder.status.toUpperCase()}</Badge>
              <Badge variant={payVariant(detailOrder.paymentStatus)}>{detailOrder.paymentStatus.toUpperCase()}</Badge>
            </div>
            {detailOrder.rejectionReason && (
              <div className="p-2 rounded bg-[#ff3d7108] border border-[#ff3d7120] text-[#ff3d71] text-[10px]">
                Rejection reason: {detailOrder.rejectionReason}
              </div>
            )}
            {detailOrder.collectedAt && (
              <div className="text-[10px] text-[#5a7099] mono">
                Collected at: {new Date(detailOrder.collectedAt).toLocaleString("en-IN")}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
