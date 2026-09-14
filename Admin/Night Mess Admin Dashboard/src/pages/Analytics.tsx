import { useStore } from "../store";
import { Card, StatCard, PageHeader } from "../components/ui";
import { TrendingUp, Users, Utensils, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1426] border border-[#1a2540] rounded-lg p-2.5 text-[10px] mono">
      <div className="text-[#5a7099] mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { state } = useStore();

  const orderStatusData = [
    { name: "Collected", value: state.orders.filter((o) => o.status === "collected").length, color: "#00e676" },
    { name: "Accepted", value: state.orders.filter((o) => o.status === "accepted").length, color: "#00c8ff" },
    { name: "Pending", value: state.orders.filter((o) => o.status === "pending").length, color: "#ffb300" },
    { name: "Rejected", value: state.orders.filter((o) => o.status === "rejected").length, color: "#ff3d71" },
  ];

  const mealTypeData = [
    { name: "Breakfast", value: state.orders.filter((o) => o.mealType === "breakfast").length, color: "#7c3aed" },
    { name: "Lunch", value: state.orders.filter((o) => o.mealType === "lunch").length, color: "#00c8ff" },
    { name: "Dinner", value: state.orders.filter((o) => o.mealType === "dinner").length, color: "#00e676" },
  ];

  const complaintData = [
    { name: "Food Quality", count: state.complaints.filter((c) => c.category === "Food Quality").length },
    { name: "Hygiene", count: state.complaints.filter((c) => c.category === "Hygiene").length },
    { name: "Service", count: state.complaints.filter((c) => c.category === "Service").length },
    { name: "Quantity", count: state.complaints.filter((c) => c.category === "Quantity").length },
    { name: "Billing", count: state.complaints.filter((c) => c.category === "Billing").length },
  ];

  const stockData = state.foodItems.map((f) => ({
    name: f.name.length > 12 ? f.name.slice(0, 12) + "…" : f.name,
    stock: f.stock,
    max: f.maxStock,
    wastage: f.wastage,
  }));

  const totalOrders = state.orders.length;
  const collectionRate = Math.round((state.orders.filter((o) => o.status === "collected").length / totalOrders) * 100);
  const fraudRate = Math.round((state.fraudAlerts.length / totalOrders) * 100);
  const resolvedRate = state.complaints.length > 0
    ? Math.round((state.complaints.filter((c) => c.status === "resolved").length / state.complaints.length) * 100)
    : 0;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="Analytics" subtitle="Operational insights and performance metrics" />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Collection Rate" value={`${collectionRate}%`} sub="Orders collected" accent="green" icon={<Utensils size={16} />} />
        <StatCard label="Total Orders" value={totalOrders} sub="All time" accent="cyan" icon={<Users size={16} />} />
        <StatCard label="Fraud Rate" value={`${fraudRate}%`} sub="of orders" accent={fraudRate > 5 ? "red" : "yellow"} icon={<AlertTriangle size={16} />} />
        <StatCard label="Complaint Resolution" value={`${resolvedRate}%`} sub="Resolved" accent="purple" icon={<TrendingUp size={16} />} />
      </div>

      {/* Revenue trend */}
      <Card>
        <div className="text-xs font-medium text-[#dce6f5] mb-4 sans">Revenue Trend — Last 7 Days (₹)</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={state.revenueHistory}>
            <defs>
              <linearGradient id="breakfastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lunchGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00c8ff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00c8ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dinnerGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e676" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#3a4d6b", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "#3a4d6b", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="breakfast" stroke="#7c3aed" strokeWidth={2} fill="url(#breakfastGrad)" name="Breakfast" />
            <Area type="monotone" dataKey="lunch" stroke="#00c8ff" strokeWidth={2} fill="url(#lunchGrad)" name="Lunch" />
            <Area type="monotone" dataKey="dinner" stroke="#00e676" strokeWidth={2} fill="url(#dinnerGrad)" name="Dinner" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Order status + Meal type pies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="text-xs font-medium text-[#dce6f5] mb-4 sans">Order Status Distribution</div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value">
                  {orderStatusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {orderStatusData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                    <span className="text-[10px] text-[#5a7099]">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] mono text-[#a0b4cc]">{d.value}</span>
                    <span className="text-[9px] mono text-[#3a4d6b]">({totalOrders > 0 ? Math.round(d.value / totalOrders * 100) : 0}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-xs font-medium text-[#dce6f5] mb-4 sans">Orders by Meal Type</div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={mealTypeData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={4} dataKey="value">
                  {mealTypeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {mealTypeData.map((d) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                      <span className="text-[10px] text-[#5a7099]">{d.name}</span>
                    </div>
                    <span className="text-[10px] mono text-[#a0b4cc]">{d.value}</span>
                  </div>
                  <div className="h-1 rounded-full bg-[#1a2540]">
                    <div className="h-full rounded-full" style={{ width: `${totalOrders > 0 ? (d.value / totalOrders * 100) : 0}%`, background: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Meals served vs wastage */}
      <Card>
        <div className="text-xs font-medium text-[#dce6f5] mb-4 sans">Meals Served vs Wastage — Last 7 Days</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={state.mealHistory} barSize={20} barGap={4}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#3a4d6b", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "#3a4d6b", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="count" fill="#00c8ff" radius={[2, 2, 0, 0]} name="Served" />
            <Bar dataKey="wastage" fill="#ff3d71" radius={[2, 2, 0, 0]} name="Wastage" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Food stock vs wastage */}
      <Card>
        <div className="text-xs font-medium text-[#dce6f5] mb-4 sans">Food Item Stock & Wastage</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stockData} barSize={16} barGap={2} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 9, fill: "#3a4d6b", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#5a7099", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="stock" fill="#00c8ff" radius={[0, 2, 2, 0]} name="Stock" />
            <Bar dataKey="wastage" fill="#ff3d71" radius={[0, 2, 2, 0]} name="Wastage" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Complaint breakdown */}
      <Card>
        <div className="text-xs font-medium text-[#dce6f5] mb-4 sans">Complaints by Category</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {complaintData.map((d) => {
            const pct = state.complaints.length > 0 ? Math.round(d.count / state.complaints.length * 100) : 0;
            return (
              <div key={d.name} className="text-center p-3 rounded-xl bg-[#080d1a] border border-[#1a2540]">
                <div className="text-xl font-bold mono text-[#ff3d71]">{d.count}</div>
                <div className="text-[10px] text-[#5a7099] mt-0.5">{d.name}</div>
                <div className="text-[9px] mono text-[#3a4d6b]">{pct}%</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
