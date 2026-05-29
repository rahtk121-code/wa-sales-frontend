import { useState } from "react";

import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      await register(name, email, password);

      setSuccess("تم إنشاء الحساب بنجاح");
    } catch (err) {
      setError(err.message || "فشل إنشاء الحساب");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-100 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-2">
          إنشاء حساب
        </h1>

        <p className="text-center text-slate-500 mb-6">
          ابدأ استخدام وكيل مبيعات واتساب الذكي
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-600 p-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 text-green-700 p-3 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium">
              اسم المتجر
            </label>

            <input
              type="text"
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="متجر تهامة"
            />
          </div>

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
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-semibold disabled:opacity-60"
          >
            {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
          </button>
        </form>
      </div>
    </div>
  );
}