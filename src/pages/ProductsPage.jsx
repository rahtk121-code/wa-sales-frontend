import { useEffect, useState } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api";
import ConfirmModal from "../components/ConfirmModal";

const EMPTY = { name: "", description: "", price: "", stock: "", image: "", category: "" };

export default function ProductsPage({ showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await getProducts();
      setProducts(Array.isArray(res) ? res : []);
    } catch (e) {
      showToast?.(e.message || "فشل تحميل المنتجات", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setForm(EMPTY); setEditingId(null); setShowForm(true); }
  function openEdit(p) {
    setForm({
      name: p.name, description: p.description || "", price: String(p.price),
      stock: String(p.stock), image: p.image || "", category: p.category || "",
    });
    setEditingId(p.id); setShowForm(true);
  }
  function closeForm() { setShowForm(false); setEditingId(null); setForm(EMPTY); }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || form.price === "") return showToast?.("الاسم والسعر مطلوبان", "error");
    if (Number(form.price) < 0) return showToast?.("السعر يجب أن يكون موجباً", "error");
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock || 0) };
      if (editingId) {
        const updated = await updateProduct(editingId, payload);
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        showToast?.("تم تحديث المنتج ✅");
      } else {
        const created = await createProduct(payload);
        setProducts((prev) => [created, ...prev]);
        showToast?.("تم إضافة المنتج ✅");
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
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast?.("تم حذف المنتج");
    } catch (e) {
      showToast?.(e.message || "فشل الحذف", "error");
    } finally {
      setConfirmId(null);
    }
  }

  const filtered = products.filter(
    (p) => !search || p.name.includes(search) || (p.description || "").includes(search) || (p.category || "").includes(search)
  );

  return (
    <div className="space-y-4">
      {confirmId && (
        <ConfirmModal
          title="حذف المنتج"
          message="هل أنت متأكد من حذف هذا المنتج؟"
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">📦 المنتجات</h2>
          <p className="text-slate-400 text-sm">{products.length} منتج</p>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm w-48"
            placeholder="بحث..."
          />
          <button onClick={openCreate} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
            + إضافة منتج
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingId ? "تعديل المنتج" : "إضافة منتج"}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              {[
                { key: "name", label: "اسم المنتج *", placeholder: "iPhone 14 Pro" },
                { key: "price", label: "السعر *", placeholder: "999", type: "number" },
                { key: "stock", label: "المخزون", placeholder: "10", type: "number" },
                { key: "category", label: "الفئة", placeholder: "جوالات" },
                { key: "image", label: "رابط الصورة (URL)", placeholder: "https://..." },
              ].map(({ key, label, placeholder, type = "text" }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    type={type}
                    className="w-full border rounded-xl px-3 py-2"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    min={type === "number" ? 0 : undefined}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1">الوصف</label>
                <textarea rows={2} className="w-full border rounded-xl px-3 py-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {p.image && (
                <img src={p.image} alt={p.name} className="w-full h-36 object-cover" onError={(e) => (e.target.style.display = "none")} />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm">{p.name}</h3>
                    {p.category && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{p.category}</span>}
                  </div>
                  <p className="font-bold text-green-600 text-sm whitespace-nowrap">{p.price} ر.س</p>
                </div>
                {p.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.stock > 10 ? "bg-green-100 text-green-700" : p.stock > 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {p.stock > 0 ? `${p.stock} متوفر` : "نفد المخزون"}
                  </span>
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(p)} className="text-blue-600 text-xs hover:underline">تعديل</button>
                    <button onClick={() => setConfirmId(p.id)} className="text-red-500 text-xs hover:underline">حذف</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-10 text-slate-400">لا توجد منتجات</div>
          )}
        </div>
      )}
    </div>
  );
}
