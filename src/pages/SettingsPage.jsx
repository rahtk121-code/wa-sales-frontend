import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../api";

const TONES = [
  { value: "friendly", label: "ودود 😊" },
  { value: "professional", label: "احترافي 💼" },
  { value: "sales", label: "مبيعات 🎯" },
  { value: "luxury", label: "فاخر ✨" },
];
const LANGUAGES = [
  { value: "arabic", label: "عربية فصحى" },
  { value: "gulf", label: "لهجة خليجية" },
  { value: "yemeni", label: "لهجة يمنية" },
  { value: "formal", label: "فصحى رسمية" },
];

export default function SettingsPage({ showToast }) {
  const [form, setForm] = useState({
    storeName: "", storeDescription: "", aiTone: "friendly", aiLanguage: "arabic",
    welcomeMessage: "", shippingPolicy: "", paymentPolicy: "", autoReply: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => setForm({ ...form, ...s }))
      .catch(() => showToast?.("فشل تحميل الإعدادات", "error"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form);
      showToast?.("تم حفظ الإعدادات ✅");
    } catch (e) {
      showToast?.(e.message || "فشل الحفظ", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-20 text-slate-400">جاري التحميل...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-6">⚙️ إعدادات المتجر</h2>
        <form onSubmit={handleSave} className="space-y-5">
          {/* Store info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm border-b pb-1">معلومات المتجر</h3>
            <div>
              <label className="block text-sm font-medium mb-1">اسم المتجر</label>
              <input className="w-full border rounded-xl px-3 py-2" value={form.storeName || ""} onChange={(e) => setForm({ ...form, storeName: e.target.value })} placeholder="متجر الجوالات" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">وصف المتجر</label>
              <textarea rows={2} className="w-full border rounded-xl px-3 py-2" value={form.storeDescription || ""} onChange={(e) => setForm({ ...form, storeDescription: e.target.value })} />
            </div>
          </div>

          {/* AI Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm border-b pb-1">إعدادات الذكاء الاصطناعي</h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-sm">الرد التلقائي</p>
                <p className="text-xs text-slate-400">تفعيل الرد الآلي على رسائل واتساب</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, autoReply: !form.autoReply })}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.autoReply ? "bg-green-500" : "bg-slate-300"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.autoReply ? "right-1" : "left-1"}`} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">نبرة الرد</label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, aiTone: t.value })}
                    className={`py-2 px-3 rounded-xl text-sm border transition ${form.aiTone === t.value ? "border-green-500 bg-green-50 text-green-700 font-medium" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">لغة الرد</label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setForm({ ...form, aiLanguage: l.value })}
                    className={`py-2 px-3 rounded-xl text-sm border transition ${form.aiLanguage === l.value ? "border-green-500 bg-green-50 text-green-700 font-medium" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Policies */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm border-b pb-1">السياسات</h3>
            <div>
              <label className="block text-sm font-medium mb-1">رسالة الترحيب</label>
              <textarea rows={2} className="w-full border rounded-xl px-3 py-2" value={form.welcomeMessage || ""} onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })} placeholder="أهلاً بك في متجرنا..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">سياسة الشحن</label>
              <textarea rows={2} className="w-full border rounded-xl px-3 py-2" value={form.shippingPolicy || ""} onChange={(e) => setForm({ ...form, shippingPolicy: e.target.value })} placeholder="الشحن خلال 3-5 أيام عمل..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">سياسة الدفع</label>
              <textarea rows={2} className="w-full border rounded-xl px-3 py-2" value={form.paymentPolicy || ""} onChange={(e) => setForm({ ...form, paymentPolicy: e.target.value })} placeholder="نقبل الدفع بطرق مختلفة..." />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </form>
      </div>
    </div>
  );
}
