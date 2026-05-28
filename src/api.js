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

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data;
}

export async function registerUser({ name, email, password }) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

  if (data.token) {
    setToken(data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data;
}

export async function loginUser({ email, password }) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

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
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function getCustomers() {
  return request("/api/customers");
}

export function createCustomer(customer) {
  return request("/api/customers", {
    method: "POST",
    body: JSON.stringify(customer),
  });
}

export function updateCustomer(customerId, customer) {
  return request(`/api/customers/${customerId}`, {
    method: "PUT",
    body: JSON.stringify(customer),
  });
}

export function deleteCustomer(customerId) {
  return request(`/api/customers/${customerId}`, {
    method: "DELETE",
  });
}

export function getProducts() {
  return request("/api/products");
}

export function createProduct(product) {
  return request("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export function updateProduct(productId, product) {
  return request(`/api/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
}

export function deleteProduct(productId) {
  return request(`/api/products/${productId}`, {
    method: "DELETE",
  });
}

export function getOrders() {
  return request("/api/orders");
}

export function createOrder(order) {
  return request("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export function updateOrderStatus(orderId, status) {
  return request(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteOrder(orderId) {
  return request(`/api/orders/${orderId}`, {
    method: "DELETE",
  });
}

export function getChats() {
  return request("/api/chats");
}

export function createChat(customerId) {
  return request("/api/chats", {
    method: "POST",
    body: JSON.stringify({ customerId }),
  });
}

export function addMessage(chatId, message) {
  return request(`/api/chats/${chatId}/messages`, {
    method: "POST",
    body: JSON.stringify(message),
  });
}

export function generateAIReply(chatId) {
  return request(`/api/ai/chat/${chatId}/reply`, {
    method: "POST",
  });
}

export function getSettings() {
  return request("/api/settings");
}

export function updateSettings(settings) {
  return request("/api/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

export function getSubscription() {
  return request("/api/subscription");
}

export function getSubscriptionUsage() {
  return request("/api/subscription/usage");
}

export function changePlan(plan) {
  return request("/api/subscription/change-plan", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
}

export function getWhatsAppStatus() {
  return request("/api/whatsapp/status");
}

export function startWhatsApp() {
  return request("/api/whatsapp/start", {
    method: "POST",
  });
}

export function stopWhatsApp() {
  return request("/api/whatsapp/stop", {
    method: "POST",
  });
}

export function getWhatsAppQr() {
  return request("/api/whatsapp/qr");
}