import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, BrainCircuit, CalendarDays, ChevronDown, Clock3, PackageCheck, Sparkles, TrendingUp, UserRoundCheck, Users } from "lucide-react";
import { Badge, Button, Card, PageHeader, StatCard } from "../components/ui";
import { DemandForecast, useStore } from "../store";

type Meal = "Breakfast" | "Lunch" | "Dinner";

const forecastByMeal: Record<Meal, { peak: number; peakTime: string; baseline: number; confidence: number; service: string; data: { time: string; actual: number | null; forecast: number; upper: number; lower: number }[] }> = {
  Breakfast: {
    peak: 94, peakTime: "08:20", baseline: 62, confidence: 91, service: "5–8 min",
    data: [
      { time: "07:00", actual: 18, forecast: 16, lower: 10, upper: 23 }, { time: "07:30", actual: 36, forecast: 35, lower: 28, upper: 43 },
      { time: "08:00", actual: 72, forecast: 68, lower: 57, upper: 79 }, { time: "08:30", actual: null, forecast: 92, lower: 78, upper: 106 },
      { time: "09:00", actual: null, forecast: 61, lower: 48, upper: 75 }, { time: "09:30", actual: null, forecast: 25, lower: 17, upper: 34 },
    ],
  },
  Lunch: {
    peak: 186, peakTime: "13:05", baseline: 118, confidence: 94, service: "12–16 min",
    data: [
      { time: "12:00", actual: 42, forecast: 39, lower: 30, upper: 49 }, { time: "12:30", actual: 86, forecast: 91, lower: 75, upper: 106 },
      { time: "13:00", actual: 153, forecast: 160, lower: 140, upper: 181 }, { time: "13:30", actual: null, forecast: 181, lower: 157, upper: 205 },
      { time: "14:00", actual: null, forecast: 121, lower: 102, upper: 140 }, { time: "14:30", actual: null, forecast: 57, lower: 43, upper: 72 },
    ],
  },
  Dinner: {
    peak: 142, peakTime: "20:10", baseline: 88, confidence: 92, service: "9–13 min",
    data: [
      { time: "19:00", actual: 28, forecast: 24, lower: 17, upper: 32 }, { time: "19:30", actual: 64, forecast: 59, lower: 47, upper: 71 },
      { time: "20:00", actual: 103, forecast: 112, lower: 96, upper: 128 }, { time: "20:30", actual: null, forecast: 138, lower: 117, upper: 159 },
      { time: "21:00", actual: null, forecast: 94, lower: 76, upper: 112 }, { time: "21:30", actual: null, forecast: 46, lower: 33, upper: 59 },
    ],
  },
};

const historical = [
  { day: "Mon", crowd: 118 }, { day: "Tue", crowd: 126 }, { day: "Wed", crowd: 139 }, { day: "Thu", crowd: 132 },
  { day: "Fri", crowd: 151 }, { day: "Sat", crowd: 104 }, { day: "Sun", crowd: 87 },
];

const foodRecommendations: Record<Meal, { item: string; unit: string; pastDemand: number; predicted: number; buffer: number; available: number }[]> = {
  Breakfast: [
    { item: "Idli", unit: "pieces", pastDemand: 292, predicted: 318, buffer: 18, available: 360 },
    { item: "Sambar", unit: "litres", pastDemand: 31, predicted: 34, buffer: 2, available: 40 },
    { item: "Chutney", unit: "litres", pastDemand: 18, predicted: 20, buffer: 2, available: 25 },
    { item: "Tea", unit: "litres", pastDemand: 47, predicted: 51, buffer: 3, available: 44 },
  ],
  Lunch: [
    { item: "Jeera Rice", unit: "kg", pastDemand: 42, predicted: 47, buffer: 3, available: 38 },
    { item: "Dal Tadka", unit: "litres", pastDemand: 56, predicted: 62, buffer: 4, available: 66 },
    { item: "Paneer Curry", unit: "kg", pastDemand: 25, predicted: 28, buffer: 2, available: 22 },
    { item: "Salad", unit: "kg", pastDemand: 19, predicted: 21, buffer: 2, available: 24 },
  ],
  Dinner: [
    { item: "Dal Makhani", unit: "litres", pastDemand: 49, predicted: 55, buffer: 4, available: 45 },
    { item: "Roti", unit: "pieces", pastDemand: 328, predicted: 370, buffer: 25, available: 200 },
    { item: "Jeera Rice", unit: "kg", pastDemand: 32, predicted: 36, buffer: 3, available: 70 },
    { item: "Raita", unit: "litres", pastDemand: 26, predicted: 29, buffer: 2, available: 90 },
  ],
};

const counterPlans: Record<Meal, { counter: string; role: string; crowd: number; current: string[]; recommended: number }[]> = {
  Breakfast: [
    { counter: "Counter 1", role: "Idli & beverages", crowd: 54, current: ["Ramesh K.", "Anita S."], recommended: 2 },
    { counter: "Counter 2", role: "Quick pickup", crowd: 40, current: ["Farhan A."], recommended: 1 },
  ],
  Lunch: [
    { counter: "Counter 1", role: "Rice & main course", crowd: 76, current: ["Ramesh K.", "Anita S."], recommended: 2 },
    { counter: "Counter 2", role: "Roti & sides", crowd: 62, current: ["Farhan A."], recommended: 2 },
    { counter: "Counter 3", role: "Express pickup", crowd: 48, current: ["Meera P."], recommended: 1 },
  ],
  Dinner: [
    { counter: "Counter 1", role: "Main course & rice", crowd: 82, current: ["Ramesh K.", "Anita S."], recommended: 2 },
    { counter: "Counter 2", role: "Roti & express pickup", crowd: 60, current: ["Farhan A."], recommended: 2 },
  ],
};

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const predicted = payload.find((point: any) => point.dataKey === "forecast");
  const actual = payload.find((point: any) => point.dataKey === "actual");
  return <div className="rounded-lg border border-[#243352] bg-[#0d1426] px-3 py-2 text-[10px] mono shadow-xl">
    <div className="mb-1 text-[#a0b4cc]">{label}</div>
    {actual?.value != null && <div className="text-[#00c8ff]">Observed: {actual.value} people</div>}
    {predicted?.value != null && <div className="text-[#a78bfa]">Forecast: {predicted.value} people</div>}
  </div>;
}

export default function CrowdPrediction() {
  const { state, getDemandForecast } = useStore();
  const [meal, setMeal] = useState<Meal>("Dinner");
  const [refreshed, setRefreshed] = useState(false);
  const [demandForecast, setDemandForecast] = useState<DemandForecast | null>(null);
  const [planApplied, setPlanApplied] = useState(false);
  const [staffPlanApplied, setStaffPlanApplied] = useState(false);
  const forecast = forecastByMeal[meal];
  const expectedCrowd = demandForecast?.crowd.forecast ?? forecast.peak;
  const currentQueue = state.orders.filter((order) => order.status === "pending" || order.status === "accepted").length;
  const queueWait = currentQueue > 0 ? Math.max(3, currentQueue * 3) : 0;
  const capacityUse = Math.round((expectedCrowd / state.settings.maxCapacity) * 100);
  const status = capacityUse > 85 ? "High demand expected" : "Capacity looks healthy";
  const recommendation = capacityUse > 85 ? "Open counter 2 before the peak window" : "One counter can handle the predicted load";
  const forecastDate = useMemo(() => new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }), []);
  const refreshDemandForecast = async () => {
    const forecastResult = await getDemandForecast();
    if (forecastResult) setDemandForecast(forecastResult);
    setRefreshed(true);
  };
  useEffect(() => { void refreshDemandForecast(); }, []);
  const actualHistory = demandForecast?.crowd.history.slice(-7) || historical.map((point) => ({ day: point.day, actual: point.crowd }));
  const chartData = demandForecast ? [
    // Historical points contain only observed values. The forecast and its
    // confidence range begin at the separate Tomorrow point.
    ...actualHistory.map((point) => ({ time: point.day, actual: point.actual, forecast: null, lower: null, upper: null })),
    { time: "Tomorrow", actual: null, forecast: demandForecast.crowd.forecast, lower: demandForecast.crowd.lower, upper: demandForecast.crowd.upper },
  ] : forecast.data;
  const foodPlan = demandForecast?.dishes.map((dish) => ({
    item: dish.name, unit: dish.unit, pastDemand: dish.average_daily_orders,
    predicted: dish.forecast_orders, buffer: dish.safety_buffer, available: Number.POSITIVE_INFINITY,
  })) || foodRecommendations[meal];
  const counterPlan = counterPlans[meal];
  const restockCount = foodPlan.filter((item) => item.available < item.predicted + item.buffer).length;
  const currentlyAllocated = counterPlan.reduce((total, counter) => total + counter.current.length, 0);
  const recommendedStaff = counterPlan.reduce((total, counter) => total + counter.recommended, 0);

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="Crowd Forecast" subtitle="Predicted footfall using historical meal, queue, and calendar patterns">
        <Button variant="outline" size="sm" className="flex items-center gap-1.5" onClick={refreshDemandForecast}>
          <Sparkles size={13} /> {refreshed ? "Forecast refreshed" : "Refresh forecast"}
        </Button>
      </PageHeader>

      <Card className="relative overflow-hidden border-[#7c3aed45] p-0 glow-cyan">
        <div className="absolute inset-0 grid-bg opacity-25" />
        <div className="relative flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#7c3aed20] text-[#a78bfa]"><BrainCircuit size={20} /></div>
            <div>
              <div className="flex items-center gap-2"><span className="text-sm font-semibold text-[#dce6f5]">Today’s {meal.toLowerCase()} forecast</span><Badge variant="accent" size="xs">MODEL ACTIVE</Badge></div>
              <p className="mt-1 text-xs text-[#5a7099]">{demandForecast ? `Based on ${demandForecast.data_points} days of CSV order history · ${demandForecast.model}` : "Using the dashboard fallback until the forecast API is available"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#1a2540] bg-[#080d1a] p-1">
            {(["Dinner"] as Meal[]).map((option) => <button key={option} onClick={() => { setMeal(option); setRefreshed(false); setPlanApplied(false); setStaffPlanApplied(false); }} className={`rounded-md px-3 py-1.5 text-[10px] font-medium mono transition-colors ${meal === option ? "bg-[#00c8ff] text-[#07111e]" : "text-[#5a7099] hover:text-[#dce6f5]"}`}>{option}</button>)}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={demandForecast ? "Expected crowd" : "Expected Peak"} value={expectedCrowd} sub={demandForecast ? "tomorrow · estimated diners" : `at ${forecast.peakTime}`} accent="purple" icon={<Users size={16} />} />
        <StatCard label="Peak Capacity" value={`${capacityUse}%`} sub={`of ${state.settings.maxCapacity} seats`} accent={capacityUse > 85 ? "yellow" : "green"} icon={<TrendingUp size={16} />} />
        <StatCard label="Current Queue" value={currentQueue} sub="Live signal included" accent="cyan" icon={<Clock3 size={16} />} />
        <StatCard label="Model Confidence" value={`${forecast.confidence}%`} sub="from past patterns" accent="green" icon={<BrainCircuit size={16} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-start justify-between">
            <div><div className="text-xs font-semibold text-[#dce6f5]">{demandForecast ? "Expected crowd by day" : "Expected crowd by time"}</div><div className="mt-0.5 text-[10px] text-[#5a7099]">{demandForecast ? `Last 7 days of CSV demand, with tomorrow's predicted ${demandForecast.crowd.unit}` : "Observed activity transitions into the forecast window"}</div></div>
            <Badge variant="info" size="xs"><CalendarDays size={10} className="mr-1" /> {forecastDate}</Badge>
          </div>
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs><linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.28} /><stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid stroke="#1a2540" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#5a7099", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#5a7099", fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <ReferenceLine y={state.settings.maxCapacity} stroke="#ffb300" strokeDasharray="4 4" label={{ value: "Capacity", fill: "#ffb300", fontSize: 9, position: "insideTopRight" }} />
              <Area type="monotone" dataKey="upper" stroke="none" fill="url(#forecastBand)" name="Upper range" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="#0d1426" fillOpacity={1} name="Lower range" />
              <Area type="monotone" dataKey="forecast" stroke="#a78bfa" strokeWidth={2.5} fill="none" name="Forecast" />
              <Area type="monotone" dataKey="actual" stroke="#00c8ff" strokeWidth={2.5} fill="none" name="Observed" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-[#5a7099]"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#00c8ff]" />Observed crowd</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#a78bfa]" />Forecast</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#7c3aed]" />Confidence range</span></div>
        </Card>

        <div className="space-y-4">
          <Card className={capacityUse > 85 ? "border-[#ffb30040]" : "border-[#00e67635]"}>
            <div className="flex items-center gap-2"><AlertTriangle size={15} className={capacityUse > 85 ? "text-[#ffb300]" : "text-[#00e676]"} /><span className="text-xs font-semibold text-[#dce6f5]">Operational signal</span></div>
            <div className={`mt-3 text-sm font-semibold ${capacityUse > 85 ? "text-[#ffb300]" : "text-[#00e676]"}`}>{status}</div>
            <p className="mt-1.5 text-xs leading-5 text-[#5a7099]">{recommendation}. The highest volume is predicted around <span className="mono text-[#a0b4cc]">{forecast.peakTime}</span>.</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#1a2540]"><div className={capacityUse > 85 ? "h-full rounded-full bg-[#ffb300]" : "h-full rounded-full bg-[#00e676]"} style={{ width: `${Math.min(capacityUse, 100)}%` }} /></div>
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold text-[#dce6f5]">Recommended preparation</span><ChevronDown size={14} className="text-[#5a7099]" /></div>
            <div className="space-y-3">
              {[{ label: "Meals to prepare", value: `${Math.ceil(expectedCrowd * 1.08)} portions`, color: "text-[#a78bfa]" }, { label: "Counters to staff", value: capacityUse > 85 ? "2 counters" : "1 counter", color: "text-[#00c8ff]" }, { label: "Live queue wait", value: queueWait ? `~${queueWait} min` : "No active queue", color: "text-[#00e676]" }].map((item) => <div key={item.label} className="flex items-center justify-between border-b border-[#1a254030] pb-2 last:border-0 last:pb-0"><span className="text-[10px] text-[#5a7099]">{item.label}</span><span className={`text-[10px] font-medium mono ${item.color}`}>{item.value}</span></div>)}
            </div>
          </Card>
        </div>
      </div>

      <Card className="border-[#00e67635]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00e67612] text-[#00e676]"><PackageCheck size={17} /></div>
            <div><div className="text-xs font-semibold text-[#dce6f5]">Food quantity recommendation</div><p className="mt-0.5 text-[10px] leading-4 text-[#5a7099]">Suggested preparation for {meal.toLowerCase()}, calculated from the last 4 weeks of item-level demand and today’s crowd forecast.</p></div>
          </div>
          <Button variant={planApplied ? "success" : "outline"} size="sm" className="shrink-0" onClick={() => setPlanApplied(true)}>{planApplied ? "✓ Preparation plan applied" : "Apply to preparation plan"}</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead><tr className="border-b border-[#1a2540] text-[9px] uppercase tracking-wider text-[#3a4d6b] mono"><th className="px-3 py-2 font-medium">Food item</th><th className="px-3 py-2 font-medium">Past avg. demand</th><th className="px-3 py-2 font-medium">Forecast demand</th><th className="px-3 py-2 font-medium">Safety buffer</th><th className="px-3 py-2 font-medium">Prepare</th><th className="px-3 py-2 font-medium">Stock signal</th></tr></thead>
            <tbody className="divide-y divide-[#1a254030]">{foodPlan.map((item) => { const quantity = item.predicted + item.buffer; const shortfall = Math.max(quantity - item.available, 0); return <tr key={item.item} className="hover:bg-[#1a254012]"><td className="px-3 py-3"><div className="text-xs font-medium text-[#dce6f5]">{item.item}</div><div className="mt-0.5 text-[9px] mono text-[#3a4d6b]">per {meal.toLowerCase()} service</div></td><td className="px-3 py-3 text-[11px] mono text-[#a0b4cc]">{item.pastDemand} {item.unit}</td><td className="px-3 py-3 text-[11px] mono text-[#a78bfa]">{item.predicted} {item.unit}</td><td className="px-3 py-3 text-[11px] mono text-[#00c8ff]">+{item.buffer} {item.unit}</td><td className="px-3 py-3"><span className="text-xs font-semibold text-[#00e676] mono">{quantity} {item.unit}</span></td><td className="px-3 py-3">{shortfall > 0 ? <Badge variant="warning" size="xs">ADD {shortfall} {item.unit}</Badge> : <Badge variant="success" size="xs">STOCK READY</Badge>}</td></tr>; })}</tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#080d1a] px-3 py-2.5"><span className="text-[10px] text-[#5a7099]">Forecast adds a 7–8% buffer to protect service levels without excess waste.</span>{restockCount > 0 ? <span className="text-[10px] mono text-[#ffb300]">{restockCount} item{restockCount > 1 ? "s" : ""} need restocking</span> : <span className="text-[10px] mono text-[#00e676]">All forecast quantities are in stock</span>}</div>
      </Card>

      {demandForecast && <Card className="border-[#a78bfa35]">
        <div className="mb-3"><div className="text-xs font-semibold text-[#dce6f5]">Raw material needed for the preparation plan</div><p className="mt-0.5 text-[10px] text-[#5a7099]">Aggregated from the five dish forecasts and their per-serving recipes.</p></div>
        <div className="flex flex-wrap gap-2">{demandForecast.raw_materials.map((material) => <div key={material.id} className="rounded-lg border border-[#1a2540] bg-[#080d1a] px-3 py-2"><span className="text-[10px] text-[#a0b4cc]">{material.name}</span><span className="ml-2 text-[11px] font-semibold text-[#a78bfa] mono">{material.quantity} {material.unit}</span></div>)}</div>
      </Card>}

      <Card className="border-[#00c8ff35]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00c8ff12] text-[#00c8ff]"><UserRoundCheck size={17} /></div>
            <div><div className="text-xs font-semibold text-[#dce6f5]">Counter workforce allocation</div><p className="mt-0.5 text-[10px] leading-4 text-[#5a7099]">Staffing is balanced against the predicted crowd at each counter during the {forecast.peakTime} peak window.</p></div>
          </div>
          <Button variant={staffPlanApplied ? "success" : "outline"} size="sm" className="shrink-0" onClick={() => setStaffPlanApplied(true)}>{staffPlanApplied ? "✓ Staffing plan applied" : "Apply staffing plan"}</Button>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-[#1a2540] bg-[#080d1a] px-3 py-2.5"><div className="text-[9px] uppercase tracking-wider text-[#3a4d6b] mono">Current workforce</div><div className="mt-1 text-lg font-semibold text-[#00c8ff] mono">{currentlyAllocated} <span className="text-[10px] font-normal text-[#5a7099]">staff allocated</span></div></div>
          <div className="rounded-lg border border-[#1a2540] bg-[#080d1a] px-3 py-2.5"><div className="text-[9px] uppercase tracking-wider text-[#3a4d6b] mono">Recommended workforce</div><div className="mt-1 text-lg font-semibold text-[#a78bfa] mono">{recommendedStaff} <span className="text-[10px] font-normal text-[#5a7099]">staff required</span></div></div>
          <div className="rounded-lg border border-[#1a2540] bg-[#080d1a] px-3 py-2.5"><div className="text-[9px] uppercase tracking-wider text-[#3a4d6b] mono">Coverage status</div><div className={`mt-1 text-sm font-semibold ${currentlyAllocated >= recommendedStaff ? "text-[#00e676]" : "text-[#ffb300]"}`}>{currentlyAllocated >= recommendedStaff ? "Fully covered" : `${recommendedStaff - currentlyAllocated} staff short`}</div></div>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">{counterPlan.map((counter) => { const gap = counter.recommended - counter.current.length; const load = Math.round(counter.crowd / expectedCrowd * 100); return <div key={counter.counter} className={`rounded-xl border p-3 ${gap > 0 ? "border-[#ffb30035] bg-[#ffb30006]" : "border-[#1a2540] bg-[#080d1a]"}`}><div className="flex items-start justify-between gap-2"><div><div className="text-xs font-semibold text-[#dce6f5]">{counter.counter}</div><div className="mt-0.5 text-[10px] text-[#5a7099]">{counter.role}</div></div><Badge variant={gap > 0 ? "warning" : "success"} size="xs">{counter.crowd} PEOPLE</Badge></div><div className="mt-3"><div className="mb-1.5 flex justify-between text-[9px] mono text-[#5a7099]"><span>PEAK CROWD SHARE</span><span>{load}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#1a2540]"><div className={gap > 0 ? "h-full rounded-full bg-[#ffb300]" : "h-full rounded-full bg-[#00c8ff]"} style={{ width: `${load}%` }} /></div></div><div className="mt-3 border-t border-[#1a254030] pt-2.5"><div className="text-[9px] uppercase tracking-wider text-[#3a4d6b] mono">Currently allotted</div><div className="mt-1.5 flex flex-wrap gap-1.5">{counter.current.map((member) => <span key={member} className="rounded-md bg-[#1a2540] px-1.5 py-1 text-[9px] text-[#a0b4cc] mono">{member}</span>)}</div></div><div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-[#5a7099]">Recommended team</span><span className={`text-[11px] font-semibold mono ${gap > 0 ? "text-[#ffb300]" : "text-[#00e676]"}`}>{counter.recommended} staff {gap > 0 ? `(add ${gap})` : "✓"}</span></div></div>; })}</div>
      </Card>

      <Card>
          <div className="mb-4 flex items-center justify-between"><div><div className="text-xs font-semibold text-[#dce6f5]">Weekly demand pattern</div><div className="mt-0.5 text-[10px] text-[#5a7099]">Actual crowd from the last 7 CSV days</div></div><Badge variant="muted" size="xs">ACTUAL DATA</Badge></div>
        <div className="grid grid-cols-7 gap-2">{actualHistory.map((item) => { const maxCrowd = Math.max(...actualHistory.map((entry) => entry.actual), 1); const height = Math.round((item.actual / maxCrowd) * 100); const isPeak = item.actual === maxCrowd; return <div key={item.day} className="group text-center"><div className="flex h-24 items-end justify-center rounded-md bg-[#080d1a] px-2"><div className={`w-full rounded-t-sm transition-all ${isPeak ? "bg-[#a78bfa]" : "bg-[#00c8ff50] group-hover:bg-[#00c8ff]"}`} style={{ height: `${height}%` }} /></div><div className="mt-2 text-[10px] mono text-[#5a7099]">{item.day}</div><div className={`mt-0.5 text-[10px] mono ${isPeak ? "text-[#a78bfa]" : "text-[#a0b4cc]"}`}>{item.actual}</div></div>; })}</div>
      </Card>
    </div>
  );
}
