import { useEffect, useState } from "react";

import {
  getSettings,
  updateSettings,
} from "../api";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    storeName: "",
    storeDescription: "",
    aiTone: "friendly",
    aiLanguage: "arabic",
    welcomeMessage: "",
    shippingPolicy: "",
    paymentPolicy: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await getSettings();

      setSettings({
        storeName: data.storeName || "",
        storeDescription:
          data.storeDescription || "",

        aiTone: data.aiTone || "friendly",
        aiLanguage:
          data.aiLanguage || "arabic",

        welcomeMessage:
          data.welcomeMessage || "",

        shippingPolicy:
          data.shippingPolicy || "",

        paymentPolicy:
          data.paymentPolicy || "",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();

    try {
      setSaving(true);

      await updateSettings(settings);

      alert("✅ تم حفظ الإعدادات");
    } catch (error) {
      console.error(error);

      alert("❌ فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        جاري تحميل الإعدادات...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-6">
        إعدادات المتجر والذكاء الاصطناعي
      </h2>

      <form
        onSubmit={handleSave}
        className="space-y-5"
      >
        <div>
          <label className="block mb-2 font-medium">
            اسم المتجر
          </label>

          <input
            type="text"
            value={settings.storeName}
            onChange={(e) =>
              setSettings({
                ...settings,
                storeName: e.target.value,
              })
            }
            className="w-full border rounded-xl px-4 py-3"
            placeholder="Tehama Store"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            وصف المتجر
          </label>

          <textarea
            rows="3"
            value={settings.storeDescription}
            onChange={(e) =>
              setSettings({
                ...settings,
                storeDescription:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl px-4 py-3"
            placeholder="متجر متخصص بالإلكترونيات..."
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            أسلوب AI
          </label>

          <select
            value={settings.aiTone}
            onChange={(e) =>
              setSettings({
                ...settings,
                aiTone: e.target.value,
              })
            }
            className="w-full border rounded-xl px-4 py-3"
          >
            <option value="friendly">
              ودود
            </option>

            <option value="professional">
              احترافي
            </option>

            <option value="sales">
              مقنع للبيع
            </option>

            <option value="luxury">
              فاخر
            </option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            لغة الرد
          </label>

          <select
            value={settings.aiLanguage}
            onChange={(e) =>
              setSettings({
                ...settings,
                aiLanguage:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl px-4 py-3"
          >
            <option value="arabic">
              العربية
            </option>

            <option value="gulf">
              خليجي
            </option>

            <option value="yemeni">
              يمني
            </option>

            <option value="formal">
              فصحى رسمية
            </option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            رسالة الترحيب
          </label>

          <textarea
            rows="3"
            value={settings.welcomeMessage}
            onChange={(e) =>
              setSettings({
                ...settings,
                welcomeMessage:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl px-4 py-3"
            placeholder="أهلًا بك في متجرنا 🌟"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            سياسة الشحن
          </label>

          <textarea
            rows="3"
            value={settings.shippingPolicy}
            onChange={(e) =>
              setSettings({
                ...settings,
                shippingPolicy:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl px-4 py-3"
            placeholder="الشحن خلال 24 ساعة..."
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            سياسة الدفع
          </label>

          <textarea
            rows="3"
            value={settings.paymentPolicy}
            onChange={(e) =>
              setSettings({
                ...settings,
                paymentPolicy:
                  e.target.value,
              })
            }
            className="w-full border rounded-xl px-4 py-3"
            placeholder="الدفع عند الاستلام..."
          />
        </div>

        <button
          disabled={saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-bold"
        >
          {saving
            ? "جاري الحفظ..."
            : "حفظ الإعدادات"}
        </button>
      </form>
    </div>
  );
}