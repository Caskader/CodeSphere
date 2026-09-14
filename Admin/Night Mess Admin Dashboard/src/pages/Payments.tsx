import { useStore } from "../store";
import { Card, Badge, StatCard, PageHeader } from "../components/ui";
import { DollarSign, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0d1426] border border-[#1a2540] rounded-lg p-2.5 text-xs mono">
        <div style={{ color: payload[0].color }}>{payload[0].name}: ₹{payload[0].value?.toLocaleString("en-IN")}</div>
      </div>
    );
  }
  return null;
};

export default function Payments() {
  const { state } = useStore();

  const paidOrders = state.orders.filter((o) => o.paymentStatus === "paid");
  const unpaidOrders = state.orders.filter((o) => o.paymentStatus === "unpaid");
  const refundedOrders = state.orders.filter((o) => o.paymentStatus === "refunded");

  const totalRevenue = paidOrders.filter((o) => o.status === "collected").reduce((s, o) => s + o.amount, 0);
  const pendingRevenue = paidOrders.filter((o) => o.status !== "collected" && o.status !== "rejected").reduce((s, o) => s + o.amount, 0);
  const totalRefunded = refundedOrders.reduce((s, o) => s + o.amount, 0);
  const unpaidAmount = unpaidOrders.reduce((s, o) => s + o.amount, 0);

  const pieData = [
    { name: "Collected", value: totalRevenue, color: "#00e676" },
    { name: "Pending", value: pendingRevenue, color: "#00c8ff" },
    { name: "Unpaid", value: unpaidAmount, color: "#ff3d71" },
    { name: "Refunded", value: totalRefunded, color: "#ffb300" },
  ].filter((d) => d.value > 0);

  const mealBreakdown = ["breakfast", "lunch", "dinner"].map((meal) => {
    const mealOrders = paidOrders.filter((o) => o.mealType === meal && o.status === "collected");
    return { meal: meal.charAt(0).toUpperCase() + meal.slice(1), amount: mealOrders.reduce((s, o) => s + o.amount, 0), count: mealOrders.length };
  });

  const recentTransactions = state.orders
    .filter((o) => o.paymentStatus !== "refunded")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="Payments" subtitle="Revenue tracking and payment status overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Revenue" value={`₹${state.revenue.toLocaleString("en-IN")}`} sub="Collected today" accent="cyan" icon={<DollarSign size={16} />} trend={8} />
        <StatCard label="Pending Revenue" value={`₹${pendingRevenue.toLocaleString("en-IN")}`} sub="Orders accepted" accent="yellow" icon={<TrendingUp size={16} />} />
        <StatCard label="Unpaid Amount" value={`₹${unpaidAmount.toLocaleString("en-IN")}`} sub={`${unpaidOrders.length} orders`} accent="red" icon={<AlertCircle size={16} />} />
        <StatCard label="Total Refunded" value={`₹${totalRefunded.toLocaleString("en-IN")}`} sub={`${refundedOrders.length} orders`} accent="purple" icon={<RefreshCw size={16} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue breakdown pie */}
        <Card>
          <div className="text-xs font-medium text-[#dce6f5] mb-4 sans">Revenue Breakdown</div>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-[10px] text-[#5a7099]">{d.name}</span>
                  </div>
                  <span className="text-[10px] mono text-[#a0b4cc]">₹{d.value.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Meal-wise revenue */}
        <Card>
          <div className="text-xs font-medium text-[#dce6f5] mb-4 sans">Revenue by Meal</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={mealBreakdown} barSize={32}>
              <XAxis dataKey="meal" tick={{ fontSize: 10, fill: "#5a7099", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#3a4d6b", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#00c8ff" radius={[4, 4, 0, 0]} name="Revenue">
                {mealBreakdown.map((_, i) => (
                  <Cell key={i} fill={["#7c3aed", "#00c8ff", "#00e676"][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {mealBreakdown.map((m, i) => (
              <div key={m.meal} className="text-center p-2 rounded-lg bg-[#080d1a] border border-[#1a2540]">
                <div className="text-[10px] mono" style={{ color: ["#7c3aed", "#00c8ff", "#00e676"][i] }}>{m.meal}</div>
                <div className="text-xs mono text-[#dce6f5] font-bold">₹{m.amount}</div>
                <div className="text-[9px] text-[#3a4d6b] mono">{m.count} orders</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue history chart */}
      <Card>
        <div className="text-xs font-medium text-[#dce6f5] mb-4 sans">Weekly Revenue Trend</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={state.revenueHistory} barSize={20}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#3a4d6b", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "#3a4d6b", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="breakfast" stackId="a" fill="#7c3aed" name="Breakfast" />
            <Bar dataKey="lunch" stackId="a" fill="#00c8ff" name="Lunch" />
            <Bar dataKey="dinner" stackId="a" fill="#00e676" radius={[2, 2, 0, 0]} name="Dinner" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent transactions */}
      <Card>
        <div className="text-xs font-medium text-[#dce6f5] mb-3 sans">Recent Transactions</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1a2540]">
                {["Token", "Student", "Meal", "Amount", "Status", "Payment", "Time"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] mono text-[#3a4d6b] uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a254020]">
              {recentTransactions.map((o) => (
                <tr key={o.id} className="hover:bg-[#1a254010] transition-colors">
                  <td className="py-2.5 px-3 mono text-[#00c8ff] text-[10px]">{o.tokenId}</td>
                  <td className="py-2.5 px-3">
                    <div className="text-[#dce6f5] font-medium">{o.studentName}</div>
                    <div className="text-[9px] text-[#5a7099] mono">{o.studentId}</div>
                  </td>
                  <td className="py-2.5 px-3 capitalize text-[#a0b4cc]">{o.mealType}</td>
                  <td className="py-2.5 px-3 mono text-[#dce6f5] font-medium">₹{o.amount}</td>
                  <td className="py-2.5 px-3">
                    <Badge
                      variant={o.status === "collected" ? "success" : o.status === "accepted" ? "info" : o.status === "rejected" ? "danger" : "warning"}
                      size="xs"
                    >
                      {o.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge
                      variant={o.paymentStatus === "paid" ? "success" : o.paymentStatus === "unpaid" ? "danger" : "muted"}
                      size="xs"
                    >
                      {o.paymentStatus.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 mono text-[9px] text-[#5a7099]">
                    {new Date(o.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
