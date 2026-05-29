import { useEffect, useState } from "react";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "../api";
import ConfirmModal from "../components/ConfirmModal";

const EMPTY = { name: "", phone: "", city: "", notes: "" };

export default function CustomersPage({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  async function load(q = "") {
    setLoading(true);
    try {
      const res = await getCustomers(q ? { search: q } : {});
      setCustomers(res.customers || res);
      setTotal(res.total ?? (res.customers || res).length);
    } catch (e) {
      showToast?.(e.message || "فشل تحميل العملاء", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setEditingId(null); setShowForm(true); }
  function openEdit(c) { setForm({ name: c.name || "", phone: c.phone, city: c.city || "", notes: c.notes || "" }); setEditingId(c.id); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditingId(null); setForm(EMPTY); }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.phone.trim()) return showToast?.("رقم الهاتف مطلوب", "error");
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateCustomer(editingId, form);
        setCustomers((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        showToast?.("تم تحديث العميل ✅");
      } else {
        const created = await createCustomer(form);
        setCustomers((prev) => [created, ...prev]);
        setTotal((t) => t + 1);
        showToast?.("تم إضافة العميل ✅");
      }
      closeForm();
    } catch (e) {
      showToast?.(e.message || "فشل الحفظ", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setTotal((t) => t - 1);
      showToast?.("تم حذف العميل");
    } catch (e) {
      showToast?.(e.message || "فشل الحذف", "error");
    } finally {
      setConfirmId(null);
    }
  }

  const filtered = customers.filter(
    (c) =>
      !search ||
      (c.name || "").includes(search) ||
      c.phone.includes(search) ||
      (c.city || "").includes(search)
  );

  return (
    <div className="space-y-4">
      {confirmId && (
        <ConfirmModal
          title="حذف العميل"
          message="هل أنت متأكد من حذف هذا العميل؟ لا يمكن حذف عميل لديه طلبات."
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">👥 العملاء</h2>
          <p className="text-slate-400 text-sm">الإجمالي: {total}</p>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm w-48"
            placeholder="بحث باسم أو هاتف..."
          />
          <button
            onClick={openCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            + إضافة عميل
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingId ? "تعديل العميل" : "إضافة عميل"}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              {[
                { key: "name", label: "الاسم", placeholder: "اسم العميل" },
                { key: "phone", label: "رقم الهاتف *", placeholder: "966xxxxxxxxx" },
                { key: "city", label: "المدينة", placeholder: "الرياض" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    className="w-full border rounded-xl px-3 py-2"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1">ملاحظات</label>
                <textarea rows={2} className="w-full border rounded-xl px-3 py-2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold disabled:opacity-60">
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </button>
                <button type="button" onClick={closeForm} className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-slate-400">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400">لا يوجد عملاء</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  {["الاسم", "الهاتف", "المدينة", "نقاط الشراء", "تاريخ الإضافة", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-right font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{c.name || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 ltr">{c.phone}</td>
                    <td className="px-4 py-3 text-slate-500">{c.city || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        ⭐ {c.purchaseScore || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(c.createdAt).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline text-xs">تعديل</button>
                        <button onClick={() => setConfirmId(c.id)} className="text-red-500 hover:underline text-xs">حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
