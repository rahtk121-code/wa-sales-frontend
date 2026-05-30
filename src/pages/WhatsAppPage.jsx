import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

import {
  getWhatsAppStatus,
  startWhatsApp,
  stopWhatsApp,
  getWhatsAppQr,
} from "../api";

export default function WhatsAppPage() {
  const [statusText, setStatusText] = useState("DISCONNECTED");
  const [phone, setPhone] = useState("غير مرتبط");
  const [running, setRunning] = useState("لا");
  const [isReady, setIsReady] = useState(false);
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refreshAll();

    const timer = setInterval(refreshAll, 4000);

    return () => clearInterval(timer);
  }, []);

  function normalizeQr(data) {
    return String(
      data?.qrCode ||
        data?.qr ||
        data?.session?.qrCode ||
        data?.status?.qrCode ||
        ""
    );
  }

  function applyStatus(data) {
    const ready = Boolean(data?.isReady);
    setIsReady(ready);
    setStatusText(String(data?.status || "DISCONNECTED"));
    setPhone(String(data?.phone || "غير مرتبط"));
    setRunning(data?.running ? "نعم" : "لا");

    if (ready) {
      setQr("");
    }
  }

  async function refreshAll() {
    try {
      const status = await getWhatsAppStatus();
      applyStatus(status);

      const qrData = await getWhatsAppQr();
      const qrValue = normalizeQr(qrData);

      if (qrValue && !status?.isReady) {
        setQr(qrValue);
      }
    } catch (err) {
      setError(err.message || "فشل تحديث حالة واتساب");
    }
  }

  async function handleStart() {
    try {
      setLoading(true);
      setError("");
      setQr("");

      await startWhatsApp();

      for (let i = 0; i < 12; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await refreshAll();

        const qrData = await getWhatsAppQr();
        const qrValue = normalizeQr(qrData);

        if (qrValue) {
          setQr(qrValue);
          break;
        }
      }
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
      setQr("");

      await stopWhatsApp();
      await refreshAll();
    } catch (err) {
      setError(err.message || "فشل فصل واتساب");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-4">
          {String(error)}
        </div>
      )}

      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-2">ربط واتساب</h2>

        <p className="text-slate-500 mb-6">
          اربط رقم واتساب الخاص بمتجرك.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-slate-500 text-sm mb-1">الحالة</p>
            <p className="text-xl font-bold break-all">
              {isReady ? "متصل ✅" : statusText}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-slate-500 text-sm mb-1">رقم واتساب</p>
            <p className="text-xl font-bold break-all">{phone}</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-slate-500 text-sm mb-1">الجلسة تعمل</p>
            <p className="text-xl font-bold break-all">{running}</p>
          </div>
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
            onClick={refreshAll}
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
          واتساب متصل بنجاح.
        </section>
      )}
    </div>
  );
}
