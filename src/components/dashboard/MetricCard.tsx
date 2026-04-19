import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  variant?: "default" | "warning" | "success";
}

const variants = {
  default: "bg-white border-gray-200",
  warning: "bg-amber-50 border-amber-200",
  success: "bg-green-50 border-green-200",
};

export default function MetricCard({ label, value, sub, icon, variant = "default" }: MetricCardProps) {
  return (
    <div className={cn("rounded-xl border p-5 shadow-sm", variants[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
