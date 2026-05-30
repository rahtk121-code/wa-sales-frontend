import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import WhatsAppPage from "./pages/WhatsAppPage";

import {
  getAnalytics,
  getCustomers,
  getProducts,
  getOrders,
  getChats,
} from "./api";

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();

  const [mode, setMode] = useState("login");
  const [activeTab, setActiveTab] = useState("dashboard");

  const [analytics, setAnalytics] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chats, setChats] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
    }
  }, [isAuthenticated]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [analyticsData, customersData, productsData, ordersData, chatsData] =
        await Promise.all([
          getAnalytics().catch(() => null),
          getCustomers().catch(() => []),
          getProducts().catch(() => []),
          getOrders().catch(() => []),
          getChats().catch(() => []),
        ]);

      setAnalytics(analyticsData);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setChats(Array.isArray(chatsData) ? chatsData : []);
    } catch (err) {
      setError(err.message || "فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return mode === "login" ? (
      <>
        <LoginPage />
        <AuthSwitch onClick={() => setMode("register")}>
          إنشاء حساب جديد
        </AuthSwitch>
      </>
    ) : (
      <>
        <RegisterPage />
        <AuthSwitch onClick={() => setMode("login")}>
          لدي حساب بالفعل
        </AuthSwitch>
      </>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Sales Agent</h1>
            <p className="text-slate-500">مرحبًا {user?.name || "مستخدم"}</p>
          </div>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl"
          >
            خروج
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex gap-3 mb-6 flex-wrap">
          <TabButton
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          >
            لوحة التحكم
          </TabButton>

          <TabButton
            active={activeTab === "whatsapp"}
            onClick={() => setActiveTab("whatsapp")}
          >
            واتساب
          </TabButton>

          <TabButton
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          >
            إعدادات AI
          </TabButton>

          <TabButton
            active={activeTab === "subscription"}
            onClick={() => setActiveTab("subscription")}
          >
            الاشتراك
          </TabButton>
        </div>

        {activeTab === "dashboard" && (
          <>
            {error && (
              <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-5">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="العملاء"
                value={analytics?.customers ?? customers.length}
              />
              <StatCard
                title="المنتجات"
                value={analytics?.products ?? products.length}
              />
              <StatCard
                title="الطلبات"
                value={analytics?.orders ?? orders.length}
              />
              <StatCard
                title="المحادثات"
                value={analytics?.chats ?? chats.length}
              />
            </div>

            <button
              onClick={loadDashboard}
              className="bg-black text-white px-5 py-3 rounded-xl mb-8"
            >
              {loading ? "جاري التحديث..." : "تحديث"}
            </button>

            <div className="grid lg:grid-cols-2 gap-6">
              <Panel title="آخر العملاء">
                <SimpleList
                  items={customers}
                  empty="لا يوجد عملاء"
                  render={(c) => (
                    <div key={c.id} className="border-b py-3">
                      <div className="font-bold">{c.name || c.phone}</div>
                      <div className="text-slate-500 text-sm">{c.phone}</div>
                    </div>
                  )}
                />
              </Panel>

              <Panel title="آخر المنتجات">
                <SimpleList
                  items={products}
                  empty="لا توجد منتجات"
                  render={(p) => (
                    <div key={p.id} className="border-b py-3">
                      <div className="font-bold">{p.name}</div>
                      <div className="text-slate-500 text-sm">
                        السعر: {p.price} — المخزون: {p.stock}
                      </div>
                    </div>
                  )}
                />
              </Panel>

              <Panel title="آخر الطلبات">
                <SimpleList
                  items={orders}
                  empty="لا توجد طلبات"
                  render={(o) => (
                    <div key={o.id} className="border-b py-3">
                      <div className="font-bold">
                        {o.customer?.name || o.customer?.phone || "عميل"}
                      </div>
                      <div className="text-slate-500 text-sm">
                        الحالة: {o.status} — الإجمالي: {o.total}
                      </div>
                    </div>
                  )}
                />
              </Panel>

              <Panel title="آخر المحادثات">
                <SimpleList
                  items={chats}
                  empty="لا توجد محادثات"
                  render={(c) => (
                    <div key={c.id} className="border-b py-3">
                      <div className="font-bold">
                        {c.customer?.name || c.customer?.phone || "محادثة"}
                      </div>
                      <div className="text-slate-500 text-sm">
                        عدد الرسائل: {c.messages?.length || 0}
                      </div>
                    </div>
                  )}
                />
              </Panel>
            </div>
          </>
        )}

        {activeTab === "whatsapp" && <WhatsAppPage />}
        {activeTab === "settings" && <SettingsPage />}
        {activeTab === "subscription" && <SubscriptionPage />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-xl transition ${
        active ? "bg-green-600 text-white" : "bg-white hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function AuthSwitch({ children, onClick }) {
  return (
    <div className="fixed bottom-6 left-0 right-0 text-center">
      <button onClick={onClick} className="text-green-700 font-medium">
        {children}
      </button>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      <p className="text-3xl font-bold text-green-600">{String(value ?? 0)}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function SimpleList({ items, empty, render }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <div className="text-slate-500">{empty}</div>;
  }

  return <div>{items.slice(0, 8).map(render)}</div>;
}
