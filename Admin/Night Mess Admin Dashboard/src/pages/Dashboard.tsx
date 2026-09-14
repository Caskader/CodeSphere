import { Users, TrendingUp, Utensils, DollarSign, AlertTriangle, Clock, ChefHat, Wifi } from "lucide-react";
import { useStore } from "../store";
import { Card, StatCard, Badge, PageHeader, Button } from "../components/ui";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0d1426] border border-[#1a2540] rounded-lg p-3 text-xs">
        <div className="text-[#5a7099] mono mb-1">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color }} className="mono">
            {p.name}: {typeof p.value === "number" && p.name?.includes("₹") ? "₹" : ""}{p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { state, dispatch } = useStore();

  const pendingOrders = state.orders.filter((o) => o.status === "pending").length;
  const activeQueue = state.queue.filter((q) => q.status !== "done").length;
  const openComplaints = state.complaints.filter((c) => c.status === "open").length;
  const unresolvedFraud = state.fraudAlerts.filter((f) => !f.resolved).length;
  const todayRevenue = state.revenue;
  const lowStock = state.foodItems.filter((f) => f.availability === "limited" || f.availability === "unavailable").length;

  const recentOrders = state.orders.slice(0, 5);

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="Dashboard" subtitle={`${state.settings.messName} · ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`}>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium mono ${state.messOpen ? "bg-[#00e67615] text-[#00e676]" : "bg-[#ff3d7115] text-[#ff3d71]"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${state.messOpen ? "bg-[#00e676] animate-pulse-dot" : "bg-[#ff3d71]"}`} />
          {state.messOpen ? "MESS OPEN" : "MESS CLOSED"}
        </div>
        <Button variant="outline" size="xs" onClick={() => dispatch({ type: "TOGGLE_MESS", open: !state.messOpen })}>
          {state.messOpen ? "Close Mess" : "Open Mess"}
        </Button>
      </PageHeader>

      {/* Alert strip */}
      {(unresolvedFraud > 0 || pendingOrders > 5) && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#ff3d7130] bg-[#ff3d7108] text-[#ff3d71] text-xs">
          <AlertTriangle size={14} />
          <span className="mono">
            {unresolvedFraud > 0 && `${unresolvedFraud} unresolved fraud alert${unresolvedFraud > 1 ? "s" : ""}`}
            {unresolvedFraud > 0 && pendingOrders > 5 && " · "}
            {pendingOrders > 5 && `${pendingOrders} pending orders require attention`}
          </span>
          <button onClick={() => onNavigate("orders")} className="ml-auto text-[10px] underline opacity-70 hover:opacity-100">
            Review
          </button>
        </div>
      )}

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Today's Revenue"
          value={`₹${todayRevenue.toLocaleString("en-IN")}`}
          sub={`Current ${state.currentMeal}`}
          accent="cyan"
          icon={<DollarSign size={16} />}
          trend={8}
        />
        <StatCard
          label="Meals Served"
          value={state.mealsServed}
          sub="Today across all meals"
          accent="green"
          icon={<Utensils size={16} />}
          trend={3}
        />
        <StatCard
          label="Queue Length"
          value={activeQueue}
          sub={`~${activeQueue * 3} min wait`}
          accent="yellow"
          icon={<Users size={16} />}
        />
        <StatCard
          label="Pending Orders"
          value={pendingOrders}
          sub="Awaiting acceptance"
          accent={pendingOrders > 3 ? "red" : "purple"}
          icon={<Clock size={16} />}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Open Complaints" value={openComplaints} sub="Needs resolution" accent={openComplaints > 2 ? "red" : "yellow"} icon={<AlertTriangle size={16} />} />
        <StatCard label="Fraud Alerts" value={unresolvedFraud} sub="Unresolved" accent={unresolvedFraud > 0 ? "red" : "green"} icon={<AlertTriangle size={16} />} />
        <StatCard label="Low Stock Items" value={lowStock} sub="Limited or unavailable" accent={lowStock > 3 ? "red" : "yellow"} icon={<ChefHat size={16} />} />
        <StatCard label="Current Meal" value={state.currentMeal.charAt(0).toUpperCase() + state.currentMeal.slice(1)} sub={state.settings[`${state.currentMeal}Time` as "breakfastTime" | "lunchTime" | "dinnerTime"]} accent="purple" icon={<Wifi size={16} />} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="text-xs font-medium text-[#dce6f5] mb-4 sans">Revenue — Last 7 Days</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={state.revenueHistory} barSize={8} barGap={2}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#3a4d6b", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#3a4d6b", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="breakfast" fill="#7c3aed" radius={[2, 2, 0, 0]} name="Breakfast" />
              <Bar dataKey="lunch" fill="#00c8ff" radius={[2, 2, 0, 0]} name="Lunch" />
              <Bar dataKey="dinner" fill="#00e676" radius={[2, 2, 0, 0]} name="Dinner" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            {[["#7c3aed", "Breakfast"], ["#00c8ff", "Lunch"], ["#00e676", "Dinner"]].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5 text-[10px] text-[#5a7099] mono">
                <span className="w-2 h-2 rounded-sm" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="text-xs font-medium text-[#dce6f5] mb-4 sans">Meals Served vs Wastage</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={state.mealHistory}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#3a4d6b", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#3a4d6b", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#00c8ff" strokeWidth={2} dot={{ r: 3, fill: "#00c8ff" }} name="Served" />
              <Line type="monotone" dataKey="wastage" stroke="#ff3d71" strokeWidth={2} dot={{ r: 3, fill: "#ff3d71" }} name="Wastage" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            {[["#00c8ff", "Meals Served"], ["#ff3d71", "Wastage (plates)"]].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5 text-[10px] text-[#5a7099] mono">
                <span className="w-2 h-1 rounded-sm" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Live Queue + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium text-[#dce6f5] sans">Live Queue</div>
            <button onClick={() => onNavigate("queue")} className="text-[10px] text-[#00c8ff] hover:underline mono">View all →</button>
          </div>
          <div className="space-y-2">
            {state.queue.length === 0 && <div className="text-xs text-[#3a4d6b] py-4 text-center">Queue is empty</div>}
            {state.queue.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-[#1a254030] last:border-0">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold mono flex-shrink-0 ${entry.status === "serving" ? "bg-[#00e67620] text-[#00e676]" : "bg-[#1a2540] text-[#5a7099]"}`}>
                  {entry.position}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#dce6f5] truncate">{entry.studentName}</div>
                  <div className="text-[10px] text-[#5a7099] mono">{entry.tokenId}</div>
                </div>
                <div className="text-right">
                  <Badge variant={entry.status === "serving" ? "success" : "muted"} size="xs">{entry.status.toUpperCase()}</Badge>
                  <div className="text-[9px] text-[#3a4d6b] mono mt-0.5">~{entry.estimatedWait}m</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium text-[#dce6f5] sans">Recent Orders</div>
            <button onClick={() => onNavigate("orders")} className="text-[10px] text-[#00c8ff] hover:underline mono">View all →</button>
          </div>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 py-2 border-b border-[#1a254030] last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[#dce6f5] truncate">{order.studentName}</div>
                  <div className="text-[10px] text-[#5a7099] mono">{order.tokenId} · {order.mealType}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge
                    variant={order.status === "collected" ? "success" : order.status === "accepted" ? "info" : order.status === "rejected" ? "danger" : "warning"}
                    size="xs"
                  >
                    {order.status.toUpperCase()}
                  </Badge>
                  <div className="text-[10px] text-[#5a7099] mono mt-0.5">₹{order.amount}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Food Stock Status */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-medium text-[#dce6f5] sans">Food Stock Status</div>
          <button onClick={() => onNavigate("menu")} className="text-[10px] text-[#00c8ff] hover:underline mono">Manage →</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {state.foodItems.map((food) => {
            const pct = (food.stock / food.maxStock) * 100;
            const color = food.availability === "unavailable" ? "#ff3d71" : food.availability === "limited" ? "#ffb300" : "#00e676";
            return (
              <div key={food.id} className="p-2.5 rounded-lg border border-[#1a2540] bg-[#080d1a]">
                <div className="text-[10px] font-medium text-[#a0b4cc] truncate mb-1">{food.name}</div>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1 rounded-full bg-[#1a2540]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-[9px] mono flex-shrink-0" style={{ color }}>{food.stock}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
