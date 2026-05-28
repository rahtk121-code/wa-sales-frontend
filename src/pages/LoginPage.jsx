import { useState } from "react";

import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "فشل تسجيل الدخول");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-100 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-2">
          تسجيل الدخول
        </h1>

        <p className="text-center text-slate-500 mb-6">
          ادخل إلى لوحة وكيل مبيعات واتساب
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-600 p-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">
              البريد الإلكتروني
            </label>

            <input
              type="email"
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@test.com"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              كلمة المرور
            </label>

            <input
              type="password"
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-semibold disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}