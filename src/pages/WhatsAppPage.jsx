import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

import {
  getWhatsAppStatus,
  startWhatsApp,
  stopWhatsApp,
  getWhatsAppQr,
} from "../api";

export default function WhatsAppPage() {
  const [status, setStatus] = useState(null);
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStatus();
    loadQr();

    const timer = setInterval(() => {
      loadStatus();
      loadQr();
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  async function loadStatus() {
    try {
      const data = await getWhatsAppStatus();
      setStatus(data);

      if (data?.isReady) {
        setQr("");
      }
    } catch (err) {
      setError(err.message || "فشل تحميل حالة واتساب");
    }
  }

  async function loadQr() {
    try {
      const data = await getWhatsAppQr();

      if (data?.qrCode) {
        setQr(data.qrCode);
      }

      if (data?.isReady) {
        setQr("");
      }
    } catch {
      // تجاهل مؤقتًا حتى لا تنهار الصفحة
    }
  }

  async function handleStart() {
    try {
      setLoading(true);
      setError("");

      await startWhatsApp();

      setTimeout(() => {
        loadStatus();
        loadQr();
      }, 1500);
    } catch (err) {
      setError(err.message || "فشل بدء واتساب");
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    try {
      setLoading(true);
      setError("");

      await stopWhatsApp();
      setQr("");

      await loadStatus();
    } catch (err) {
      setError(err.message || "فشل فصل واتساب");
    } finally {
      setLoading(false);
    }
  }

  const isReady = Boolean(status?.isReady);
  const currentStatus = status?.status || "DISCONNECTED";

  return (
    <div className="space-y-6" dir="rtl">
      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-4">
          {error}
        </div>
      )}

      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-2">ربط واتساب</h2>

        <p className="text-slate-500 mb-6">
          اربط رقم واتساب الخاص بمتجرك. كل متجر له جلسة مستقلة.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <InfoCard
            label="الحالة"
            value={isReady ? "متصل ✅" : currentStatus}
          />

          <InfoCard
            label="رقم واتساب"
            value={status?.phone || "غير مرتبط"}
          />

          <InfoCard
            label="الجلسة تعمل"
            value={status?.running ? "نعم" : "لا"}
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleStart}
            disabled={loading || isReady}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-60"
          >
            {loading ? "جاري التشغيل..." : "بدء الربط"}
          </button>

          <button
            onClick={handleStop}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-60"
          >
            فصل واتساب
          </button>

          <button
            onClick={() => {
              loadStatus();
              loadQr();
            }}
            className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold"
          >
            تحديث
          </button>
        </div>
      </section>

      {!isReady && qr && (
        <section className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <h3 className="text-xl font-bold mb-4">امسح QR من واتساب</h3>

          <div className="inline-block bg-white p-4 rounded-2xl border">
            <QRCode value={qr} size={180} />
          </div>

          <p className="text-slate-500 mt-4">
            واتساب ← الأجهزة المرتبطة ← ربط جهاز ← امسح الرمز.
          </p>
        </section>
      )}

      {isReady && (
        <section className="bg-green-50 text-green-700 rounded-2xl p-6">
          واتساب متصل بنجاح. النظام سيرد تلقائيًا على عملاء هذا المتجر.
        </section>
      )}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-2xl p-5">
      <p className="text-slate-500 text-sm mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
