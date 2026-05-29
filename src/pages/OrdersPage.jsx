import { useEffect, useState } from "react";
import { getOrders, getCustomers, getProducts, createOrder, updateOrderStatus, deleteOrder } from "../api";
import ConfirmModal from "../components/ConfirmModal";
import { getSocket } from "../socket";

const STATUS_LABELS = {
  PENDING: "قيد الانتظار",
  CONFIRMED: "مؤكد",
  SHIPPED: "تم الشحن",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
};
const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function OrdersPage({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // New order form state
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [orderItems, setOrderItems] = useState([{ productId: "", quantity: 1 }]);
  const [orderNotes, setOrderNotes] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await getOrders(params);
      setOrders(res.orders || res);
      setTotal(res.total ?? (res.orders || res).length);
    } catch (e) {
      showToast?.(e.message || "فشل تحميل الطلبات", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filterStatus]);

  useEffect(() => {
    getCustomers().then((r) => setCustomers(r.customers || r)).catch(() => {});
    getProducts().then((r) => setProducts(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = (order) => {
      setOrders((prev) => [order, ...prev]);
      setTotal((t) => t + 1);
    };
    socket.on("order:new", onNew);
    return () => socket.off("order:new", onNew);
  }, []);

  async function handleStatusChange(id, status) {
    try {
      const updated = await updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      showToast?.(`تم تغيير الحالة إلى: ${STATUS_LABELS[status]}`);
    } catch (e) {
      showToast?.(e.message || "فشل تغيير الحالة", "error");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setTotal((t) => t - 1);
      showToast?.("تم حذف الطلب وإعادة المخزون");
    } catch (e) {
      showToast?.(e.message || "فشل الحذف", "error");
    } finally {
      setConfirmId(null);
    }
  }

  function addItem() {
    setOrderItems((prev) => [...prev, { productId: "", quantity: 1 }]);
  }
  function removeItem(i) {
    setOrderItems((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateItem(i, field, value) {
    setOrderItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }

  function calcTotal() {
    return orderItems.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product ? product.price * Number(item.quantity) : 0);
    }, 0);
  }

  async function handleCreateOrder(e) {
    e.preventDefault();
    if (!selectedCustomer) return showToast?.("اختر عميلاً", "error");
    const validItems = orderItems.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) return showToast?.("أضف منتجاً واحداً على الأقل", "error");
    setSaving(true);
    try {
      const order = await createOrder({ customerId: selectedCustomer, items: validItems, notes: orderNotes });
      setOrders((prev) => [order, ...prev]);
      setTotal((t) => t + 1);
      setShowForm(false);
      setSelectedCustomer("");
      setOrderItems([{ productId: "", quantity: 1 }]);
      setOrderNotes("");
      showToast?.("تم إنشاء الطلب ✅");
    } catch (e) {
      showToast?.(e.message || "فشل إنشاء الطلب", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {confirmId && (
        <ConfirmModal
          title="حذف الطلب"
          message="سيتم حذف الطلب وإعادة المخزون للمنتجات. هل أنت متأكد؟"
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">🧾 الطلبات</h2>
          <p className="text-slate-400 text-sm">الإجمالي: {total}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          >
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            + طلب جديد
          </button>
        </div>
      </div>

      {/* Create Order Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">إنشاء طلب جديد</h3>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              {/* Customer */}
              <div>
                <label className="block text-sm font-medium mb-1">العميل *</label>
                <select
                  className="w-full border rounded-xl px-3 py-2"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">اختر عميلاً</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name || c.phone}</option>
                  ))}
                </select>
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium mb-2">المنتجات *</label>
                <div className="space-y-2">
                  {orderItems.map((item, i) => {
                    const prod = products.find((p) => p.id === item.productId);
                    return (
                      <div key={i} className="flex gap-2 items-center">
                        <select
                          className="flex-1 border rounded-xl px-3 py-2 text-sm"
                          value={item.productId}
                          onChange={(e) => updateItem(i, "productId", e.target.value)}
                        >
                          <option value="">اختر منتجاً</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} — {p.price} ر.س</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          className="w-16 border rounded-xl px-2 py-2 text-sm text-center"
                          value={item.quantity}
                          onChange={(e) => updateItem(i, "quantity", e.target.value)}
                        />
                        {prod && (
                          <span className="text-xs text-green-700 whitespace-nowrap">
                            {(prod.price * item.quantity).toFixed(0)} ر.س
                          </span>
                        )}
                        {orderItems.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)} className="text-red-500 text-lg leading-none">×</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button type="button" onClick={addItem} className="mt-2 text-green-600 text-sm hover:underline">
                  + إضافة منتج آخر
                </button>
              </div>

              {/* Total */}
              <div className="bg-green-50 rounded-xl px-4 py-2 flex justify-between">
                <span className="font-medium">الإجمالي</span>
                <span className="font-bold text-green-700">{calcTotal().toFixed(2)} ر.س</span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea rows={2} className="w-full border rounded-xl px-3 py-2" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold disabled:opacity-60">
                  {saving ? "جاري الإنشاء..." : "إنشاء الطلب"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-10 text-slate-400">جاري التحميل...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 text-slate-400">لا توجد طلبات</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧾</span>
                  <div>
                    <p className="font-bold">{order.customer?.name || order.customer?.phone}</p>
                    <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString("ar-SA")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-green-600">{order.total} ر.س</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                  <select
                    className="border rounded-xl px-2 py-1 text-xs"
                    value={order.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmId(order.id); }}
                    className="text-red-500 hover:underline text-xs"
                  >
                    حذف
                  </button>
                  <span className="text-slate-300">{expandedId === order.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {expandedId === order.id && (
                <div className="border-t px-4 py-3 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 mb-2">المنتجات:</p>
                  <div className="space-y-1">
                    {(order.items || []).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product?.name || "منتج محذوف"} × {item.quantity}</span>
                        <span className="text-green-600 font-medium">{(item.price * item.quantity).toFixed(2)} ر.س</span>
                      </div>
                    ))}
                  </div>
                  {order.notes && (
                    <p className="text-xs text-slate-400 mt-2">ملاحظات: {order.notes}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
