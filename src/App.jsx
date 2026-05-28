import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import WhatsAppPage from "./pages/WhatsAppPage";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  getChats,
  createChat,
  addMessage,
  generateAIReply,
} from "./api";

import { connectSocket, disconnectSocket } from "./socket";

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();

  const [mode, setMode] = useState("login");
  const [activeTab, setActiveTab] = useState("dashboard");

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chats, setChats] = useState([]);

  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);

  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    city: "",
    notes: "",
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  });

  const [newOrder, setNewOrder] = useState({
    customerId: "",
    productId: "",
    quantity: 1,
  });

  const [newChatCustomerId, setNewChatCustomerId] = useState("");
  const [selectedChatId, setSelectedChatId] = useState("");

  const [newMessage, setNewMessage] = useState({
    sender: "customer",
    content: "",
  });

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    loadDashboard();

    const socket = connectSocket(user.id);

    socket.on("message:new", loadDashboard);
    socket.on("chat:new", loadDashboard);
    socket.on("chat:updated", loadDashboard);
    socket.on("customer:new", loadDashboard);

    return () => {
      socket.off("message:new", loadDashboard);
      socket.off("chat:new", loadDashboard);
      socket.off("chat:updated", loadDashboard);
      socket.off("customer:new", loadDashboard);
      disconnectSocket();
    };
  }, [isAuthenticated, user?.id]);

  async function loadDashboard() {
    try {
      setLoadingDashboard(true);
      setError("");

      const [customersData, productsData, ordersData, chatsData] =
        await Promise.all([getCustomers(), getProducts(), getOrders(), getChats()]);

      setCustomers(customersData);
      setProducts(productsData);
      setOrders(ordersData);
      setChats(chatsData);
    } catch (err) {
      setError(err.message || "فشل تحميل البيانات");
    } finally {
      setLoadingDashboard(false);
    }
  }

  async function handleSaveCustomer(e) {
    e.preventDefault();

    if (!newCustomer.phone) {
      setError("رقم الهاتف مطلوب");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingCustomerId) {
        await updateCustomer(editingCustomerId, newCustomer);
      } else {
        await createCustomer(newCustomer);
      }

      cancelEditCustomer();
      await loadDashboard();
    } catch (err) {
      setError(err.message || "فشل حفظ العميل");
    } finally {
      setSaving(false);
    }
  }

  function startEditCustomer(customer) {
    setEditingCustomerId(customer.id);
    setNewCustomer({
      name: customer.name || "",
      phone: customer.phone || "",
      city: customer.city || "",
      notes: customer.notes || "",
    });
  }

  function cancelEditCustomer() {
    setEditingCustomerId(null);
    setNewCustomer({
      name: "",
      phone: "",
      city: "",
      notes: "",
    });
  }

  async function handleDeleteCustomer(id) {
    if (!window.confirm("هل تريد حذف هذا العميل؟")) return;

    try {
      await deleteCustomer(id);
      await loadDashboard();
    } catch (err) {
      setError(err.message || "فشل حذف العميل");
    }
  }

  async function handleSaveProduct(e) {
    e.preventDefault();

    if (!newProduct.name || !newProduct.price) {
      setError("اسم المنتج والسعر مطلوبان");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: newProduct.name,
        description: newProduct.description,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock || 0),
      };

      if (editingProductId) {
        await updateProduct(editingProductId, payload);
      } else {
        await createProduct(payload);
      }

      cancelEditProduct();
      await loadDashboard();
    } catch (err) {
      setError(err.message || "فشل حفظ المنتج");
    } finally {
      setSaving(false);
    }
  }

  function startEditProduct(product) {
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
    });
  }

  function cancelEditProduct() {
    setEditingProductId(null);
    setNewProduct({
      name: "",
      description: "",
      price: "",
      stock: "",
    });
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm("هل تريد حذف هذا المنتج؟")) return;

    try {
      await deleteProduct(id);
      await loadDashboard();
    } catch (err) {
      setError(err.message || "فشل حذف المنتج");
    }
  }

  async function handleCreateOrder(e) {
    e.preventDefault();

    if (!newOrder.customerId || !newOrder.productId) {
      setError("اختر العميل والمنتج");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createOrder({
        customerId: newOrder.customerId,
        items: [
          {
            productId: newOrder.productId,
            quantity: Number(newOrder.quantity || 1),
          },
        ],
      });

      setNewOrder({
        customerId: "",
        productId: "",
        quantity: 1,
      });

      await loadDashboard();
    } catch (err) {
      setError(err.message || "فشل إنشاء الطلب");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateOrderStatus(id, status) {
    try {
      await updateOrderStatus(id, status);
      await loadDashboard();
    } catch (err) {
      setError(err.message || "فشل تحديث الطلب");
    }
  }

  async function handleDeleteOrder(id) {
    if (!window.confirm("هل تريد حذف هذا الطلب؟")) return;

    try {
      await deleteOrder(id);
      await loadDashboard();
    } catch (err) {
      setError(err.message || "فشل حذف الطلب");
    }
  }

  async function handleCreateChat(e) {
    e.preventDefault();

    if (!newChatCustomerId) {
      setError("اختر العميل أولًا");
      return;
    }

    try {
      const chat = await createChat(newChatCustomerId);
      setSelectedChatId(chat.id);
      setNewChatCustomerId("");
      await loadDashboard();
    } catch (err) {
      setError(err.message || "فشل إنشاء المحادثة");
    }
  }

  async function handleAddMessage(e) {
    e.preventDefault();

    if (!selectedChatId || !newMessage.content) {
      setError("اختر محادثة واكتب رسالة");
      return;
    }

    try {
      await addMessage(selectedChatId, newMessage);
      setNewMessage({ sender: "customer", content: "" });
      await loadDashboard();
    } catch (err) {
      setError(err.message || "فشل إضافة الرسالة");
    }
  }

  async function handleGenerateAIReply() {
    if (!selectedChatId) {
      setError("اختر محادثة أولًا");
      return;
    }

    try {
      await generateAIReply(selectedChatId);
      await loadDashboard();
    } catch (err) {
      setError(err.message || "فشل توليد الرد");
    }
  }

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === newOrder.productId);
  }, [products, newOrder.productId]);

  const estimatedTotal = selectedProduct
    ? Number(selectedProduct.price) * Number(newOrder.quantity || 1)
    : 0;

  const selectedChat = chats.find((c) => c.id === selectedChatId);

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
            <p className="text-slate-500">مرحبًا {user?.name}</p>
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
          <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>
            لوحة التحكم
          </TabButton>

          <TabButton active={activeTab === "whatsapp"} onClick={() => setActiveTab("whatsapp")}>
            واتساب
          </TabButton>

          <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")}>
            إعدادات AI
          </TabButton>

          <TabButton active={activeTab === "subscription"} onClick={() => setActiveTab("subscription")}>
            الاشتراك
          </TabButton>
        </div>

        {activeTab === "settings" && <SettingsPage />}
        {activeTab === "subscription" && <SubscriptionPage />}
        {activeTab === "whatsapp" && <WhatsAppPage />}

        {activeTab === "dashboard" && (
          <>
            {error && (
              <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-5">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <StatCard title="العملاء" value={customers.length} />
              <StatCard title="المنتجات" value={products.length} />
              <StatCard title="الطلبات" value={orders.length} />
              <StatCard title="المحادثات" value={chats.length} />
            </div>

            <button
              onClick={loadDashboard}
              className="bg-black text-white px-5 py-3 rounded-xl mb-8"
            >
              {loadingDashboard ? "جاري التحديث..." : "تحديث"}
            </button>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <Panel title="العملاء" className="lg:col-span-2">
                <CustomerTable
                  customers={customers}
                  onEdit={startEditCustomer}
                  onDelete={handleDeleteCustomer}
                />
              </Panel>

              <Panel title={editingCustomerId ? "تعديل عميل" : "إضافة عميل"}>
                <form onSubmit={handleSaveCustomer} className="space-y-4">
                  <Input label="الاسم" value={newCustomer.name} onChange={(v) => setNewCustomer({ ...newCustomer, name: v })} />
                  <Input label="الهاتف" value={newCustomer.phone} onChange={(v) => setNewCustomer({ ...newCustomer, phone: v })} />
                  <Input label="المدينة" value={newCustomer.city} onChange={(v) => setNewCustomer({ ...newCustomer, city: v })} />
                  <TextArea label="ملاحظات" value={newCustomer.notes} onChange={(v) => setNewCustomer({ ...newCustomer, notes: v })} />

                  <SubmitButton loading={saving}>
                    {editingCustomerId ? "حفظ التعديل" : "حفظ العميل"}
                  </SubmitButton>

                  {editingCustomerId && (
                    <button type="button" onClick={cancelEditCustomer} className="w-full bg-slate-200 rounded-xl py-3 font-bold">
                      إلغاء التعديل
                    </button>
                  )}
                </form>
              </Panel>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <Panel title="المنتجات" className="lg:col-span-2">
                <ProductTable
                  products={products}
                  onEdit={startEditProduct}
                  onDelete={handleDeleteProduct}
                />
              </Panel>

              <Panel title={editingProductId ? "تعديل منتج" : "إضافة منتج"}>
                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <Input label="اسم المنتج" value={newProduct.name} onChange={(v) => setNewProduct({ ...newProduct, name: v })} />
                  <Input label="السعر" type="number" value={newProduct.price} onChange={(v) => setNewProduct({ ...newProduct, price: v })} />
                  <Input label="المخزون" type="number" value={newProduct.stock} onChange={(v) => setNewProduct({ ...newProduct, stock: v })} />
                  <TextArea label="الوصف" value={newProduct.description} onChange={(v) => setNewProduct({ ...newProduct, description: v })} />

                  <SubmitButton loading={saving}>
                    {editingProductId ? "حفظ التعديل" : "حفظ المنتج"}
                  </SubmitButton>

                  {editingProductId && (
                    <button type="button" onClick={cancelEditProduct} className="w-full bg-slate-200 rounded-xl py-3 font-bold">
                      إلغاء التعديل
                    </button>
                  )}
                </form>
              </Panel>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <Panel title="الطلبات" className="lg:col-span-2">
                <OrdersTable
                  orders={orders}
                  onStatusChange={handleUpdateOrderStatus}
                  onDelete={handleDeleteOrder}
                />
              </Panel>

              <Panel title="إنشاء طلب">
                <form onSubmit={handleCreateOrder} className="space-y-4">
                  <Select
                    label="العميل"
                    value={newOrder.customerId}
                    onChange={(v) => setNewOrder({ ...newOrder, customerId: v })}
                    options={customers.map((c) => ({
                      value: c.id,
                      label: c.name || c.phone,
                    }))}
                    placeholder="اختر العميل"
                  />

                  <Select
                    label="المنتج"
                    value={newOrder.productId}
                    onChange={(v) => setNewOrder({ ...newOrder, productId: v })}
                    options={products.map((p) => ({
                      value: p.id,
                      label: `${p.name} - ${p.price}`,
                    }))}
                    placeholder="اختر المنتج"
                  />

                  <Input
                    label="الكمية"
                    type="number"
                    value={newOrder.quantity}
                    onChange={(v) => setNewOrder({ ...newOrder, quantity: v })}
                  />

                  <div className="bg-slate-50 rounded-xl p-4">
                    الإجمالي المتوقع:{" "}
                    <span className="font-bold text-blue-600">{estimatedTotal}</span>
                  </div>

                  <SubmitButton loading={saving}>إنشاء الطلب</SubmitButton>
                </form>
              </Panel>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Panel title="المحادثات" className="lg:col-span-2">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {chats.length === 0 ? (
                      <div className="text-slate-500 bg-slate-50 rounded-xl p-4">لا توجد محادثات</div>
                    ) : (
                      chats.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => setSelectedChatId(chat.id)}
                          className={`w-full text-right border rounded-xl p-3 ${
                            selectedChatId === chat.id ? "bg-green-50 border-green-500" : "bg-white"
                          }`}
                        >
                          <div className="font-bold">{chat.customer?.name || chat.customer?.phone}</div>
                          <div className="text-xs text-slate-500">{chat.messages?.length || 0} رسائل</div>
                        </button>
                      ))
                    )}
                  </div>

                  <div>
                    <div className="bg-slate-50 rounded-xl p-4 h-72 overflow-y-auto space-y-3">
                      {!selectedChat ? (
                        <div className="text-slate-500">اختر محادثة</div>
                      ) : selectedChat.messages?.length === 0 ? (
                        <div className="text-slate-500">لا توجد رسائل</div>
                      ) : (
                        selectedChat.messages.map((m) => (
                          <div
                            key={m.id}
                            className={`p-3 rounded-xl max-w-[85%] ${
                              m.sender === "customer"
                                ? "bg-white border ml-auto"
                                : "bg-green-600 text-white mr-auto"
                            }`}
                          >
                            <div className="text-xs opacity-70">{m.sender}</div>
                            <div>{m.content}</div>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={handleGenerateAIReply}
                      disabled={saving || !selectedChatId}
                      className="w-full mt-4 bg-green-600 text-white rounded-xl py-3 font-bold disabled:opacity-60"
                    >
                      توليد رد AI
                    </button>

                    <form onSubmit={handleAddMessage} className="mt-4 space-y-3">
                      <Select
                        label="المرسل"
                        value={newMessage.sender}
                        onChange={(v) => setNewMessage({ ...newMessage, sender: v })}
                        options={[
                          { value: "customer", label: "العميل" },
                          { value: "ai", label: "AI" },
                          { value: "agent", label: "الموظف" },
                        ]}
                        placeholder="اختر المرسل"
                      />

                      <TextArea
                        label="الرسالة"
                        value={newMessage.content}
                        onChange={(v) => setNewMessage({ ...newMessage, content: v })}
                      />

                      <SubmitButton loading={saving}>إضافة رسالة</SubmitButton>
                    </form>
                  </div>
                </div>
              </Panel>

              <Panel title="إنشاء محادثة">
                <form onSubmit={handleCreateChat} className="space-y-4">
                  <Select
                    label="العميل"
                    value={newChatCustomerId}
                    onChange={setNewChatCustomerId}
                    options={customers.map((c) => ({
                      value: c.id,
                      label: c.name || c.phone,
                    }))}
                    placeholder="اختر العميل"
                  />

                  <SubmitButton loading={saving}>إنشاء محادثة</SubmitButton>
                </form>
              </Panel>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function CustomerTable({ customers, onEdit, onDelete }) {
  if (customers.length === 0) {
    return <Empty text="لا يوجد عملاء" />;
  }

  return (
    <SimpleTable
      headers={["الاسم", "الهاتف", "المدينة", "ملاحظات", "إجراءات"]}
      rows={customers.map((c) => [
        c.name || "-",
        c.phone,
        c.city || "-",
        c.notes || "-",
        <Actions key={c.id} onEdit={() => onEdit(c)} onDelete={() => onDelete(c.id)} />,
      ])}
    />
  );
}

function ProductTable({ products, onEdit, onDelete }) {
  if (products.length === 0) {
    return <Empty text="لا توجد منتجات" />;
  }

  return (
    <SimpleTable
      headers={["المنتج", "السعر", "المخزون", "الوصف", "إجراءات"]}
      rows={products.map((p) => [
        p.name,
        p.price,
        p.stock,
        p.description || "-",
        <Actions key={p.id} onEdit={() => onEdit(p)} onDelete={() => onDelete(p.id)} />,
      ])}
    />
  );
}

function OrdersTable({ orders, onStatusChange, onDelete }) {
  if (orders.length === 0) {
    return <Empty text="لا توجد طلبات" />;
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-right">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="p-3">العميل</th>
            <th className="p-3">الحالة</th>
            <th className="p-3">الإجمالي</th>
            <th className="p-3">المنتجات</th>
            <th className="p-3">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b">
              <td className="p-3">{o.customer?.name || o.customer?.phone || "-"}</td>
              <td className="p-3">
                <select
                  value={o.status}
                  onChange={(e) => onStatusChange(o.id, e.target.value)}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="PENDING">قيد الانتظار</option>
                  <option value="CONFIRMED">مؤكد</option>
                  <option value="SHIPPED">تم الشحن</option>
                  <option value="DELIVERED">تم التسليم</option>
                  <option value="CANCELLED">ملغي</option>
                </select>
              </td>
              <td className="p-3">{o.total}</td>
              <td className="p-3">
                {o.items?.map((i) => `${i.product?.name} × ${i.quantity}`).join("، ") || "-"}
              </td>
              <td className="p-3">
                <button onClick={() => onDelete(o.id)} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm">
                  حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimpleTable({ headers, rows }) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-right">
        <thead>
          <tr className="border-b bg-slate-50">
            {headers.map((h) => (
              <th key={h} className="p-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b">
              {row.map((cell, j) => (
                <td key={j} className="p-3">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Actions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2">
      <button onClick={onEdit} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
        تعديل
      </button>
      <button onClick={onDelete} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm">
        حذف
      </button>
    </div>
  );
}

function Empty({ text }) {
  return <div className="p-6 text-center text-slate-500">{text}</div>;
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
      <p className="text-3xl font-bold text-green-600">{value}</p>
    </div>
  );
}

function Panel({ title, children, className = "" }) {
  return (
    <section className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="block mb-2 font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="block mb-2 font-medium">{label}</label>
      <textarea
        rows="3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      />
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="block mb-2 font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-xl px-4 py-3"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SubmitButton({ children, loading }) {
  return (
    <button
      disabled={loading}
      className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-bold disabled:opacity-60"
    >
      {loading ? "جاري الحفظ..." : children}
    </button>
  );
}