const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function getToken() { 
  return localStorage.getItem("token"); 
}

export function setToken(token) { 
  localStorage.setItem("token", token); 
}

export function removeToken() { 
  localStorage.removeItem("token"); 
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => null);

  if (!response.ok) throw new Error(data?.error || "Request failed");
  return data;
}

// Auth
export async function registerUser({ name, email, password }) {
  const data = await request("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
  if (data.token) { 
    setToken(data.token); 
    localStorage.setItem("user", JSON.stringify(data.user)); 
  }
  return data;
}

export async function loginUser({ email, password }) {
  const data = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  if (data.token) { 
    setToken(data.token); 
    localStorage.setItem("user", JSON.stringify(data.user)); 
  }
  return data;
}

export function logoutUser() { 
  removeToken(); 
  localStorage.removeItem("user"); 
}

export function getCurrentUser() { 
  const u = localStorage.getItem("user"); 
  return u ? JSON.parse(u) : null; 
}

// Analytics
export function getAnalytics() { 
  return request("/api/analytics/dashboard"); 
}

// Customers
export function getCustomers(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/api/customers${q ? "?" + q : ""}`);
}
export function createCustomer(c) { 
  return request("/api/customers", { method: "POST", body: JSON.stringify(c) }); 
}
export function updateCustomer(id, c) { 
  return request(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(c) }); 
}
export function deleteCustomer(id) { 
  return request(`/api/customers/${id}`, { method: "DELETE" }); 
}

// Products
export function getProducts(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/api/products${q ? "?" + q : ""}`);
}
export function createProduct(p) { 
  return request("/api/products", { method: "POST", body: JSON.stringify(p) }); 
}
export function updateProduct(id, p) { 
  return request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(p) }); 
}
export function deleteProduct(id) { 
  return request(`/api/products/${id}`, { method: "DELETE" }); 
}

// Orders
export function getOrders(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/api/orders${q ? "?" + q : ""}`);
}
export function createOrder(o) { 
  return request("/api/orders", { method: "POST", body: JSON.stringify(o) }); 
}
export function updateOrderStatus(id, status) { 
  return request(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); 
}
export function deleteOrder(id) { 
  return request(`/api/orders/${id}`, { method: "DELETE" }); 
}

// Chats
export function getChats(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/api/chats${q ? "?" + q : ""}`);
}
export function createChat(customerId) { 
  return request("/api/chats", { method: "POST", body: JSON.stringify({ customerId }) }); 
}
export function addMessage(chatId, msg) { 
  return request(`/api/chats/${chatId}/messages`, { method: "POST", body: JSON.stringify(msg) }); 
}
export function generateAIReply(chatId) { 
  return request(`/api/ai/chat/${chatId}/reply`, { method: "POST" }); 
}
export function updateChatStatus(chatId, status) { 
  return request(`/api/chats/${chatId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); 
}
export function toggleAutoReply(chatId, autoReply) { 
  return request(`/api/chats/${chatId}/auto-reply`, { method: "PATCH", body: JSON.stringify({ autoReply }) }); 
}
export function generateChatSummary(chatId) { 
  return request(`/api/chats/${chatId}/summary`, { method: "POST" }); 
}
export function sendWhatsAppMessage(chatId, message) { 
  return request(`/api/chats/${chatId}/send-whatsapp`, { method: "POST", body: JSON.stringify({ message }) }); 
}
export function deleteChat(chatId) { 
  return request(`/api/chats/${chatId}`, { method: "DELETE" }); 
}

// Settings
export function getSettings() { 
  return request("/api/settings"); 
}
export function updateSettings(s) { 
  return request("/api/settings", { method: "PUT", body: JSON.stringify(s) }); 
}

// Subscription
export function getSubscription() { 
  return request("/api/subscription"); 
}
export function getSubscriptionUsage() { 
  return request("/api/subscription/usage"); 
}
export function changePlan(plan) { 
  return request("/api/subscription/change-plan", { method: "POST", body: JSON.stringify({ plan }) }); 
}

// WhatsApp
export function getWhatsAppStatus() { 
  return request("/api/whatsapp/status"); 
}
export function startWhatsApp() { 
  return request("/api/whatsapp/start", { method: "POST" }); 
}
export function stopWhatsApp() { 
  return request("/api/whatsapp/stop", { method: "POST" }); 
}
export function getWhatsAppQr() { 
  return request("/api/whatsapp/qr"); 
}
