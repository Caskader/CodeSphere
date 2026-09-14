import { ReactNode, ButtonHTMLAttributes } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: "cyan" | "green" | "red" | "none";
}

export function Card({ children, className = "", glow = "none" }: CardProps) {
  const glowClass = glow === "cyan" ? "glow-cyan" : glow === "green" ? "glow-green" : glow === "red" ? "glow-red" : "";
  return (
    <div
      className={`rounded-xl border border-[#1a2540] p-4 ${glowClass} ${className}`}
      style={{ background: "#0d1426" }}
    >
      {children}
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "muted" | "accent";
  size?: "sm" | "xs";
}

export function Badge({ children, variant = "muted", size = "sm" }: BadgeProps) {
  const styles = {
    success: "bg-[#00e67615] text-[#00e676] border border-[#00e67630]",
    warning: "bg-[#ffb30015] text-[#ffb300] border border-[#ffb30030]",
    danger: "bg-[#ff3d7115] text-[#ff3d71] border border-[#ff3d7130]",
    info: "bg-[#00c8ff15] text-[#00c8ff] border border-[#00c8ff30]",
    muted: "bg-[#1a254015] text-[#5a7099] border border-[#1a2540]",
    accent: "bg-[#7c3aed15] text-[#a78bfa] border border-[#7c3aed30]",
  };
  const sz = size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]";
  return (
    <span className={`inline-flex items-center rounded-md font-medium mono ${sz} ${styles[variant]}`}>
      {children}
    </span>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "success" | "danger" | "ghost" | "outline" | "warning";
  size?: "sm" | "md" | "xs";
  children: ReactNode;
}

export function Button({ variant = "primary", size = "sm", children, className = "", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-[#00c8ff] text-black hover:bg-[#00b8ef] active:bg-[#009fc9]",
    success: "bg-[#00e676] text-black hover:bg-[#00cf6b] active:bg-[#00b85f]",
    danger: "bg-[#ff3d71] text-white hover:bg-[#e8335f] active:bg-[#cc2d53]",
    warning: "bg-[#ffb300] text-black hover:bg-[#e8a200] active:bg-[#cc8f00]",
    ghost: "bg-transparent text-[#5a7099] hover:bg-[#1a2540] hover:text-[#dce6f5]",
    outline: "bg-transparent border border-[#1a2540] text-[#a0b4cc] hover:border-[#243352] hover:text-[#dce6f5]",
  };
  const sizes = {
    xs: "px-2 py-1 text-[10px] rounded-md",
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
  };
  return (
    <button
      className={`font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "cyan" | "green" | "red" | "yellow" | "purple";
  icon?: ReactNode;
  trend?: number;
}

export function StatCard({ label, value, sub, accent = "cyan", icon, trend }: StatCardProps) {
  const accentColors = {
    cyan: { text: "text-[#00c8ff]", bg: "bg-[#00c8ff10]", border: "border-[#00c8ff20]" },
    green: { text: "text-[#00e676]", bg: "bg-[#00e67610]", border: "border-[#00e67620]" },
    red: { text: "text-[#ff3d71]", bg: "bg-[#ff3d7110]", border: "border-[#ff3d7120]" },
    yellow: { text: "text-[#ffb300]", bg: "bg-[#ffb30010]", border: "border-[#ffb30020]" },
    purple: { text: "text-[#a78bfa]", bg: "bg-[#7c3aed10]", border: "border-[#7c3aed20]" },
  };
  const c = accentColors[accent];
  return (
    <Card className={`border ${c.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] mono text-[#5a7099] uppercase tracking-wider mb-1">{label}</div>
          <div className={`text-2xl font-bold mono ${c.text}`}>{value}</div>
          {sub && <div className="text-[10px] text-[#3a4d6b] mt-1">{sub}</div>}
          {trend !== undefined && (
            <div className={`text-[10px] mono mt-1 ${trend >= 0 ? "text-[#00e676]" : "text-[#ff3d71]"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs yesterday
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.bg} ${c.text}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

interface TableProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export function Table({ headers, children, className = "" }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#1a2540]">
            {headers.map((h) => (
              <th key={h} className="text-left py-2 px-3 text-[10px] mono text-[#3a4d6b] uppercase tracking-wider font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1a254030]">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <tr className={`hover:bg-[#1a254015] transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <td className={`py-2.5 px-3 text-[#a0b4cc] ${className}`}>
      {children}
    </td>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[10px] mono text-[#5a7099] uppercase tracking-wider">{label}</label>}
      <input
        className={`bg-[#080d1a] border border-[#1a2540] rounded-lg px-3 py-2 text-xs text-[#dce6f5] placeholder-[#3a4d6b] focus:outline-none focus:border-[#00c8ff40] focus:ring-1 focus:ring-[#00c8ff20] transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}

export function Select({ label, className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[10px] mono text-[#5a7099] uppercase tracking-wider">{label}</label>}
      <select
        className={`bg-[#080d1a] border border-[#1a2540] rounded-lg px-3 py-2 text-xs text-[#dce6f5] focus:outline-none focus:border-[#00c8ff40] transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, children, width = "max-w-md" }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} rounded-xl border border-[#1a2540] animate-fade-up`} style={{ background: "#0d1426" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a2540]">
          <h3 className="text-sm font-semibold text-[#dce6f5]">{title}</h3>
          <button onClick={onClose} className="text-[#5a7099] hover:text-[#dce6f5] transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function X({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-base font-semibold text-[#dce6f5] sans">{title}</h1>
        {subtitle && <p className="text-xs text-[#5a7099] mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Divider() {
  return <div className="border-t border-[#1a2540] my-4" />;
}

export function Textarea({ label, className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-[10px] mono text-[#5a7099] uppercase tracking-wider">{label}</label>}
      <textarea
        className={`bg-[#080d1a] border border-[#1a2540] rounded-lg px-3 py-2 text-xs text-[#dce6f5] placeholder-[#3a4d6b] focus:outline-none focus:border-[#00c8ff40] resize-none transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
