import { useEffect, useState, useCallback } from "react";
import { getAnalytics } from "../api";
import { connectSocket, getSocket } from "../socket";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
};
const STATUS_COLORS = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  SHIPPED: "#8b5cf6",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
};

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-full">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-slate-500 text-sm">{label}</p>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage({ showToast }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await getAnalytics();
      setData(res);
    } catch (e) {
      showToast?.("فشل تحميل الإحصاءات", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const socket = getSocket();
    const refresh = () => load();
    socket?.on("order:new", refresh);
    socket?.on("customer:new", refresh);
    return () => {
      socket?.off("order:new", refresh);
      socket?.off("customer:new", refresh);
    };
  }, [load]);

  if (loading)
    return (
      <div className="text-center py-20 text-slate-400">جاري تحميل الإحصاءات...</div>
    );

  const { totals, ordersByStatus, topProducts, dailyChart, recentOrders } = data || {};
  const maxRevenue = Math.max(...(dailyChart || []).map((d) => d.revenue), 1);
  const maxOrders = Math.max(...(dailyChart || []).map((d) => d.orders), 1);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="العملاء" value={totals?.customers ?? 0} icon="👥" color="#10b981" />
        <StatCard label="المنتجات" value={totals?.products ?? 0} icon="📦" color="#3b82f6" />
        <StatCard label="الطلبات" value={totals?.orders ?? 0} icon="🧾" color="#8b5cf6" />
        <StatCard label="المحادثات" value={totals?.chats ?? 0} icon="💬" color="#f59e0b" />
        <StatCard
          label="إجمالي الإيرادات"
          value={`${(totals?.revenue ?? 0).toLocaleString()} ر.س`}
          icon="💰"
          color="#ef4444"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-4 text-slate-700">📈 الإيرادات (آخر 7 أيام)</h3>
          <div className="flex items-end gap-2 h-32">
            {(dailyChart || []).map((d) => {
              const h = maxRevenue > 0 ? Math.max(4, (d.revenue / maxRevenue) * 100) : 4;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-400 hidden md:block">
                    {d.revenue > 0 ? d.revenue.toFixed(0) : ""}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-green-500 transition-all"
                    style={{ height: `${h}%` }}
                    title={`${d.date}: ${d.revenue}`}
                  />
                  <span className="text-xs text-slate-400">{d.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-4 text-slate-700">🧾 الطلبات حسب الحالة</h3>
          <div className="space-y-3">
            {(ordersByStatus || []).map((s) => (
              <div key={s.status}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{STATUS_LABELS[s.status] || s.status}</span>
                  <span className="font-bold">{s.count}</span>
                </div>
                <MiniBar
                  value={s.count}
                  max={totals?.orders || 1}
                  color={STATUS_COLORS[s.status] || "#94a3b8"}
                />
              </div>
            ))}
            {(!ordersByStatus || ordersByStatus.length === 0) && (
              <p className="text-slate-400 text-sm">لا توجد طلبات بعد</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-4 text-slate-700">🏆 أكثر المنتجات مبيعًا</h3>
          <div className="space-y-3">
            {(topProducts || []).map((p, i) => (
              <div key={p.id || i} className="flex items-center gap-3">
                <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.price} ر.س</p>
                </div>
                <span className="text-sm font-bold text-green-600">{p.totalSold} قطعة</span>
              </div>
            ))}
            {(!topProducts || topProducts.length === 0) && (
              <p className="text-slate-400 text-sm">لا توجد مبيعات بعد</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold mb-4 text-slate-700">🕐 آخر الطلبات</h3>
          <div className="space-y-3">
            {(recentOrders || []).map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{o.customer?.name || o.customer?.phone}</p>
                  <p className="text-slate-400 text-xs">
                    {new Date(o.createdAt).toLocaleDateString("ar-SA")}
                  </p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-green-600">{o.total} ر.س</p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: `${STATUS_COLORS[o.status]}22`,
                      color: STATUS_COLORS[o.status],
                    }}
                  >
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                </div>
              </div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && (
              <p className="text-slate-400 text-sm">لا توجد طلبات بعد</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
