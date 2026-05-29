import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CustomersPage from "./pages/CustomersPage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";
import ChatsPage from "./pages/ChatsPage";
import SettingsPage from "./pages/SettingsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import Toast from "./components/Toast";

import { connectSocket, disconnectSocket, getSocket } from "./socket";

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mode, setMode] = useState("login");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toast, setToast] = useState(null);

  function showToast(message, type = "success") {
    setToast({ message, type });
  }

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const socket = connectSocket(user.id);

    socket.on("message:new", (data) => {
      if (document.hidden) {
        try {
          if (Notification.permission === "granted") {
            new Notification("رسالة واتساب جديدة 💬", {
              body: data.message?.content?.slice(0, 80) || "رسالة جديدة",
              icon: "/vite.svg",
            });
          }
        } catch {}
      }
    });

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100" dir="rtl">
        {mode === "login" ? <LoginPage /> : <RegisterPage />}
        <div className="fixed bottom-6 left-0 right-0 text-center">
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-green-700 font-medium text-sm"
          >
            {mode === "login" ? "ليس لديك حساب؟ إنشاء حساب جديد" : "لديك حساب؟ تسجيل الدخول"}
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "📊 الرئيسية" },
    { id: "chats", label: "💬 المحادثات" },
    { id: "customers", label: "👥 العملاء" },
    { id: "products", label: "📦 المنتجات" },
    { id: "orders", label: "🧾 الطلبات" },
    { id: "whatsapp", label: "📱 واتساب" },
    { id: "settings", label: "⚙️ الإعدادات" },
    { id: "subscription", label: "💎 الاشتراك" },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100">
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-green-700">WhatsApp Sales Agent</h1>
            <p className="text-xs text-slate-500">مرحبًا، {user?.name}</p>
          </div>
          <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm">
            خروج
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id ? "bg-green-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {activeTab === "dashboard" && <DashboardPage showToast={showToast} />}
        {activeTab === "chats" && <ChatsPage showToast={showToast} />}
        {activeTab === "customers" && <CustomersPage showToast={showToast} />}
        {activeTab === "products" && <ProductsPage showToast={showToast} />}
        {activeTab === "orders" && <OrdersPage showToast={showToast} />}
        {activeTab === "whatsapp" && <WhatsAppPage />}
        {activeTab === "settings" && <SettingsPage showToast={showToast} />}
        {activeTab === "subscription" && <SubscriptionPage />}
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
