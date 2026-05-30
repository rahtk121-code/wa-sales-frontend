import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";

import {
  getWhatsAppStatus,
  startWhatsApp,
  stopWhatsApp,
  getWhatsAppQr,
} from "../api";

import { connectSocket, getSocket } from "../socket";
import { useAuth } from "../context/AuthContext";

export default function WhatsAppPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pollingRef = useRef(null);

  // ── تأكد من اتصال Socket وربط الغرفة ──────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    // connectSocket يضمن الاتصال وينضم للغرفة
    const socket = connectSocket(user.id);

    socket.on("whatsapp:status", (data) => {
      setStatus(data);
      if (data?.isReady) {
        setQr("");
        stopPolling();
      }
      if (data?.status === "QR_READY" && data?.qrCode) {
        setQr(data.qrCode);
      }
    });

    socket.on("whatsapp:qr", (data) => {
      if (data?.qrCode) {
        setQr(data.qrCode);
      }
    });

    // تحميل الحالة الأولية
    loadStatus();
    loadQr();

    return () => {
      socket.off("whatsapp:status");
      socket.off("whatsapp:qr");
      stopPolling();
    };
  }, [user?.id]);

  // ── Polling احتياطي كل 8 ثواني ────────────────────────────────────
  function startPolling() {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const data = await getWhatsAppQr();
        if (data?.qrCode) setQr(data.qrCode);
        if (data?.isReady) {
          setQr("");
          stopPolling();
        }
        const s = await getWhatsAppStatus();
        setStatus(s);
      } catch {}
    }, 8000);
  }

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  async function loadStatus() {
    try {
      const data = await getWhatsAppStatus();
      setStatus(data);
    } catch (err) {
      setError(err.message || "فشل تحميل حالة واتساب");
    }
  }

  async function loadQr() {
    try {
      const data = await getWhatsAppQr();
      if (data?.qrCode) setQr(data.qrCode);
      if (data?.isReady) setQr("");
    } catch {}
  }

  async function handleStart() {
    try {
      setLoading(true);
      setError("");
      setQr("");
      await startWhatsApp();
      await loadStatus();
      // ابدأ polling احتياطي — الـ QR قد يستغرق عدة ثواني
      startPolling();
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
      stopPolling();
      await stopWhatsApp();
      setQr("");
      await loadStatus();
    } catch (err) {
      setError(err.message || "فشل فصل واتساب");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    await loadStatus();
    await loadQr();
  }

  const isReady = status?.isReady;
  const currentStatus = status?.status || "DISCONNECTED";

  return (
    <div className="space-y-6" dir="rtl">
      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-4">{error}</div>
      )}

      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-2">ربط واتساب</h2>
        <p className="text-slate-500 mb-6">
          اربط رقم واتساب الخاص بمتجرك. كل متجر له جلسة مستقلة.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <InfoCard label="الحالة" value={isReady ? "متصل ✅" : currentStatus} />
          <InfoCard label="رقم واتساب" value={status?.phone || "غير مرتبط"} />
          <InfoCard label="الجلسة تعمل" value={status?.running ? "نعم" : "لا"} />
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
            onClick={handleRefresh}
            className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold"
          >
            تحديث
          </button>
        </div>
      </section>

      {/* ── QR Code ── */}
      {!isReady && qr && (
        <section className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <h3 className="text-xl font-bold mb-4">امسح QR من واتساب</h3>
          <div className="inline-block bg-white p-4 rounded-2xl border">
            <QRCode value={qr} size={260} />
          </div>
          <p className="text-slate-500 mt-4">
            واتساب ← الأجهزة المرتبطة ← ربط جهاز ← امسح الرمز.
          </p>
        </section>
      )}

      {/* ── في انتظار QR ── */}
      {!isReady && !qr && status?.running && (
        <section className="bg-blue-50 text-blue-700 rounded-2xl p-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <span className="animate-spin text-2xl">⏳</span>
            <span className="font-semibold">جاري تحضير رمز QR، انتظر لحظة...</span>
          </div>
        </section>
      )}

      {/* ── متصل ── */}
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
