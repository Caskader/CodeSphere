import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, BrainCircuit, CalendarDays, ChevronDown, Clock3, Sparkles, TrendingUp, Users } from "lucide-react";
import { Badge, Button, Card, PageHeader, StatCard } from "../components/ui";
import { useStore } from "../store";

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
  const { state } = useStore();
  const [meal, setMeal] = useState<Meal>("Dinner");
  const [refreshed, setRefreshed] = useState(false);
  const forecast = forecastByMeal[meal];
  const currentQueue = state.queue.filter((entry) => entry.status !== "done").length;
  const capacityUse = Math.round((forecast.peak / state.settings.maxCapacity) * 100);
  const status = capacityUse > 85 ? "High demand expected" : "Capacity looks healthy";
  const recommendation = capacityUse > 85 ? "Open counter 2 before the peak window" : "One counter can handle the predicted load";
  const forecastDate = useMemo(() => new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }), []);

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="Crowd Forecast" subtitle="Predicted footfall using historical meal, queue, and calendar patterns">
        <Button variant="outline" size="sm" className="flex items-center gap-1.5" onClick={() => setRefreshed(true)}>
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
              <p className="mt-1 text-xs text-[#5a7099]">Based on 12 weeks of order history · Last updated just now</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#1a2540] bg-[#080d1a] p-1">
            {(["Breakfast", "Lunch", "Dinner"] as Meal[]).map((option) => <button key={option} onClick={() => { setMeal(option); setRefreshed(false); }} className={`rounded-md px-3 py-1.5 text-[10px] font-medium mono transition-colors ${meal === option ? "bg-[#00c8ff] text-[#07111e]" : "text-[#5a7099] hover:text-[#dce6f5]"}`}>{option}</button>)}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Expected Peak" value={forecast.peak} sub={`at ${forecast.peakTime}`} accent="purple" icon={<Users size={16} />} />
        <StatCard label="Peak Capacity" value={`${capacityUse}%`} sub={`of ${state.settings.maxCapacity} seats`} accent={capacityUse > 85 ? "yellow" : "green"} icon={<TrendingUp size={16} />} />
        <StatCard label="Current Queue" value={currentQueue} sub="Live signal included" accent="cyan" icon={<Clock3 size={16} />} />
        <StatCard label="Model Confidence" value={`${forecast.confidence}%`} sub="from past patterns" accent="green" icon={<BrainCircuit size={16} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-start justify-between">
            <div><div className="text-xs font-semibold text-[#dce6f5]">Expected crowd by time</div><div className="mt-0.5 text-[10px] text-[#5a7099]">Observed activity transitions into the forecast window</div></div>
            <Badge variant="info" size="xs"><CalendarDays size={10} className="mr-1" /> {forecastDate}</Badge>
          </div>
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={forecast.data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
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
              {[{ label: "Meals to prepare", value: `${Math.ceil(forecast.peak * 1.08)} portions`, color: "text-[#a78bfa]" }, { label: "Counters to staff", value: capacityUse > 85 ? "2 counters" : "1 counter", color: "text-[#00c8ff]" }, { label: "Estimated wait", value: forecast.service, color: "text-[#00e676]" }].map((item) => <div key={item.label} className="flex items-center justify-between border-b border-[#1a254030] pb-2 last:border-0 last:pb-0"><span className="text-[10px] text-[#5a7099]">{item.label}</span><span className={`text-[10px] font-medium mono ${item.color}`}>{item.value}</span></div>)}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between"><div><div className="text-xs font-semibold text-[#dce6f5]">Weekly demand pattern</div><div className="mt-0.5 text-[10px] text-[#5a7099]">Average dinner crowd from the last 7 corresponding days</div></div><Badge variant="muted" size="xs">HISTORICAL DATA</Badge></div>
        <div className="grid grid-cols-7 gap-2">{historical.map((item) => { const height = Math.round((item.crowd / 160) * 100); const isPeak = item.crowd === 151; return <div key={item.day} className="group text-center"><div className="flex h-24 items-end justify-center rounded-md bg-[#080d1a] px-2"><div className={`w-full rounded-t-sm transition-all ${isPeak ? "bg-[#a78bfa]" : "bg-[#00c8ff50] group-hover:bg-[#00c8ff]"}`} style={{ height: `${height}%` }} /></div><div className="mt-2 text-[10px] mono text-[#5a7099]">{item.day}</div><div className={`mt-0.5 text-[10px] mono ${isPeak ? "text-[#a78bfa]" : "text-[#a0b4cc]"}`}>{item.crowd}</div></div>; })}</div>
      </Card>
    </div>
  );
}
