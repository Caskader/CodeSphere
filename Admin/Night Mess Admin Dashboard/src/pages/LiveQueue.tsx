import { useState } from "react";
import { Users, Clock, CheckCircle, AlertCircle, QrCode, Search } from "lucide-react";
import { useStore, QRStatus, Order } from "../store";
import { Card, Badge, Button, StatCard, PageHeader, Input } from "../components/ui";

function QRStatusDisplay({ status, order, message }: { status: QRStatus; order?: Order; message: string }) {
  const configs = {
    valid: { color: "text-[#00e676]", bg: "bg-[#00e67610] border-[#00e67630]", label: "VALID TOKEN", icon: "✓" },
    invalid: { color: "text-[#ff3d71]", bg: "bg-[#ff3d7110] border-[#ff3d7130]", label: "INVALID TOKEN", icon: "✗" },
    expired: { color: "text-[#ffb300]", bg: "bg-[#ffb30010] border-[#ffb30030]", label: "EXPIRED TOKEN", icon: "⏰" },
    unpaid: { color: "text-[#ff3d71]", bg: "bg-[#ff3d7110] border-[#ff3d7130]", label: "UNPAID TOKEN", icon: "₹" },
    duplicate: { color: "text-[#ff3d71]", bg: "bg-[#ff3d7110] border-[#ff3d7130]", label: "DUPLICATE SCAN", icon: "⚠" },
  };
  const cfg = configs[status];
  return (
    <div className={`p-4 rounded-xl border ${cfg.bg} animate-fade-up`}>
      <div className="flex items-center gap-3">
        <div className={`text-2xl ${cfg.color} mono font-bold w-8 text-center`}>{cfg.icon}</div>
        <div>
          <div className={`text-xs font-bold mono ${cfg.color}`}>{cfg.label}</div>
          <div className="text-xs text-[#a0b4cc] mt-0.5">{message}</div>
          {order && (
            <div className="mt-1 text-[10px] text-[#5a7099] mono space-x-3">
              <span>ID: {order.studentId}</span>
              <span>Cuisine: {order.cuisines?.join(", ") || "Night Mess"}</span>
              <span>Items: {order.items.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LiveQueue() {
  const { state, dispatch, verifyQR, updateOrderStatus } = useStore();
  const [qrInput, setQrInput] = useState("");
  const [qrResult, setQrResult] = useState<{ status: QRStatus; order?: Order; message: string } | null>(null);
  const [search, setSearch] = useState("");

  // Orders are the server-backed source of truth. Backfill any pending or
  // accepted order that is missing from the local queue (for example after a
  // stale localStorage snapshot or while the polling reducer catches up).
  const queueOrderIds = new Set(state.queue.map((entry) => entry.orderId));
  const missingOrderQueue = state.orders
    .filter((order) => (order.status === "pending" || order.status === "accepted") && !queueOrderIds.has(order.id))
    .map((order, index) => ({
      id: `order-${order.id}`,
      studentName: order.studentName,
      studentId: order.studentId,
      tokenId: order.tokenId,
      orderId: order.id,
      position: state.queue.length + index + 1,
      mealType: order.mealType,
      estimatedWait: (state.queue.length + index + 1) * 3,
      status: "waiting" as const,
      joinedAt: order.timestamp,
    }));
  const activeQueue = [...state.queue, ...missingOrderQueue].filter((q) => q.status !== "done");
  const filtered = activeQueue.filter((q) =>
    q.studentName.toLowerCase().includes(search.toLowerCase()) ||
    q.tokenId.toLowerCase().includes(search.toLowerCase()) ||
    q.studentId.toLowerCase().includes(search.toLowerCase())
  );

  const handleVerify = () => {
    if (!qrInput.trim()) return;
    const result = verifyQR(qrInput.trim());
    setQrResult(result);
    if (result.status === "valid" && result.order) {
      dispatch({ type: "MARK_COLLECTED", orderId: result.order.id });
      setQrResult({ ...result, message: result.message + " — Marked as collected. Inventory updated." });
    } else if (result.status === "duplicate" || result.status === "invalid" || result.status === "unpaid") {
      // Add fraud alert
    }
    setQrInput("");
  };

  const serving = activeQueue.filter((q) => q.status === "serving").length;
  const avgWait = activeQueue.length > 0 ? Math.round(activeQueue.reduce((s, q) => s + q.estimatedWait, 0) / activeQueue.length) : 0;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="Live Queue" subtitle="Real-time student queue management and QR verification" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="In Queue" value={activeQueue.length} sub="Currently waiting" accent="cyan" icon={<Users size={16} />} />
        <StatCard label="Serving Now" value={serving} sub="At counter" accent="green" icon={<CheckCircle size={16} />} />
        <StatCard label="Avg Wait Time" value={`${avgWait}m`} sub="Estimated" accent="yellow" icon={<Clock size={16} />} />
        <StatCard label="Capacity Used" value={`${Math.round((activeQueue.length / state.settings.maxCapacity) * 100)}%`} sub={`of ${state.settings.maxCapacity} max`} accent="purple" icon={<Users size={16} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* QR Scanner */}
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <QrCode size={16} className="text-[#00c8ff]" />
            <div className="text-xs font-semibold text-[#dce6f5] sans">QR Token Verifier</div>
          </div>

          <div className="flex flex-col gap-3">
            <Input
              label="Token ID"
              placeholder="e.g. TKN001, TKN_FAKE..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
            <Button variant="primary" size="sm" onClick={handleVerify} disabled={!qrInput.trim()}>
              Verify & Mark Collected
            </Button>

            {/* Quick test tokens */}
            <div className="border-t border-[#1a2540] pt-3">
              <div className="text-[10px] mono text-[#3a4d6b] mb-2 uppercase tracking-wider">Quick Test</div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { token: "TKN001", label: "Valid", color: "success" as const },
                  { token: "TKN004", label: "Duplicate", color: "danger" as const },
                  { token: "TKN003", label: "Unpaid", color: "danger" as const },
                  { token: "TKN_FAKE", label: "Invalid", color: "danger" as const },
                ].map(({ token, label, color }) => (
                  <button
                    key={token}
                    onClick={() => setQrInput(token)}
                    className="text-[10px] py-1.5 px-2 rounded-lg border border-[#1a2540] hover:border-[#243352] text-[#5a7099] hover:text-[#a0b4cc] mono text-left transition-colors"
                  >
                    <span className={color === "success" ? "text-[#00e676]" : "text-[#ff3d71]"}>●</span> {token}
                    <br /><span className="text-[#3a4d6b]">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {qrResult && (
              <QRStatusDisplay
                status={qrResult.status}
                order={qrResult.order}
                message={qrResult.message}
              />
            )}
          </div>
        </Card>

        {/* Queue List */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-[#dce6f5] sans">Queue ({activeQueue.length})</div>
            <div className="w-44">
              <Input
                placeholder="Search by name or token..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-[10px] py-1.5"
              />
            </div>
          </div>

          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <div className="py-12 text-center text-xs text-[#3a4d6b]">
                {search ? "No matching entries" : "Queue is empty"}
              </div>
            )}
            {filtered.map((entry) => (
              (() => {
                const order = state.orders.find((candidate) => candidate.id === entry.orderId);
                const isPending = order?.status === "pending";
                return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  entry.status === "serving"
                    ? "border-[#00e67640] bg-[#00e67608]"
                    : "border-[#1a2540] bg-[#080d1a] hover:bg-[#0d1426]"
                }`}
              >
                {/* Position */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mono flex-shrink-0 ${
                  entry.status === "serving" ? "bg-[#00e67620] text-[#00e676]" : "bg-[#1a2540] text-[#5a7099]"
                }`}>
                  {entry.position}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#dce6f5] truncate">{entry.studentName}</span>
                    <Badge variant={isPending ? "warning" : entry.status === "serving" ? "success" : "muted"} size="xs">
                      {isPending ? "PENDING" : entry.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] mono text-[#5a7099]">
                    <span>{entry.studentId}</span>
                    <span className="text-[#3a4d6b]">·</span>
                    <span>{entry.tokenId}</span>
                    <span className="text-[#3a4d6b]">·</span>
                    <span>{state.orders.find((order) => order.id === entry.orderId)?.cuisines?.join(", ") || "Night Mess"}</span>
                  </div>
                </div>

                {/* Wait + Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs mono text-[#ffb300]">~{entry.estimatedWait}m</div>
                    <div className="text-[9px] text-[#3a4d6b] mono">
                      {new Date(entry.joinedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {isPending ? <>
                      <Button variant="success" size="xs" onClick={() => { void updateOrderStatus(entry.orderId, "preparing"); }}>
                        ✓ Accept
                      </Button>
                      <Button variant="danger" size="xs" onClick={() => { void updateOrderStatus(entry.orderId, "cancelled", "Rejected from live queue"); }}>
                        ✗ Reject
                      </Button>
                    </> : <Button variant="success" size="xs" onClick={() => { void updateOrderStatus(entry.orderId, "completed"); }}>
                      ✓ Collect
                    </Button>}
                  </div>
                </div>
              </div>
                );
              })()
            ))}
          </div>
        </Card>
      </div>

      {/* Fraud Alerts */}
      {state.fraudAlerts.filter((f) => !f.resolved).length > 0 && (
        <Card className="border-[#ff3d7130]">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-[#ff3d71]" />
            <div className="text-xs font-semibold text-[#ff3d71] sans">Active Fraud Alerts</div>
          </div>
          <div className="space-y-2">
            {state.fraudAlerts.filter((f) => !f.resolved).map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#ff3d7108] border border-[#ff3d7120]">
                <div className="flex-1">
                  <div className="text-xs text-[#dce6f5] font-medium">
                    {alert.type === "duplicate_scan" ? "Duplicate Scan" : alert.type === "invalid_token" ? "Invalid Token" : alert.type === "unpaid_scan" ? "Unpaid Token Scan" : "Expired Token"}
                  </div>
                  <div className="text-[10px] mono text-[#5a7099]">
                    {alert.studentName} · {alert.tokenId} · {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <Button variant="ghost" size="xs" onClick={() => dispatch({ type: "RESOLVE_FRAUD", alertId: alert.id })}>
                  Resolve
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
