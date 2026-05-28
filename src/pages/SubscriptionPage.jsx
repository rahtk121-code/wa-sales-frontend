import { useEffect, useState } from "react";

import {
  getSubscription,
  getSubscriptionUsage,
  changePlan,
} from "../api";

const plans = [
  {
    id: "FREE",
    name: "Free",
    price: "مجاني",
    description: "مناسب للتجربة والاختبار",
    aiRepliesLimit: 20,
    customersLimit: 50,
    productsLimit: 20,
    ordersLimit: 30,
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$9 / شهر",
    description: "مناسب للمتاجر الصغيرة والمتوسطة",
    aiRepliesLimit: 500,
    customersLimit: 2000,
    productsLimit: 1000,
    ordersLimit: 3000,
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "$29 / شهر",
    description: "مناسب للمتاجر الكبيرة والفرق",
    aiRepliesLimit: "غير محدود",
    customersLimit: "غير محدود",
    productsLimit: "غير محدود",
    ordersLimit: "غير محدود",
  },
];

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      setLoading(true);
      setError("");

      const [sub, usageData] = await Promise.all([
        getSubscription(),
        getSubscriptionUsage(),
      ]);

      setSubscription(sub);
      setUsage(usageData);
    } catch (err) {
      setError(err.message || "فشل تحميل الاشتراك");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePlan(plan) {
    try {
      setChangingPlan(plan);
      setError("");

      await changePlan(plan);
      await loadSubscription();
    } catch (err) {
      setError(err.message || "فشل تغيير الباقة");
    } finally {
      setChangingPlan("");
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        جاري تحميل بيانات الاشتراك...
      </div>
    );
  }

  const currentPlan = subscription?.plan || "FREE";
  const aiUsed = usage?.aiRepliesToday || 0;
  const aiLimit = subscription?.aiRepliesLimit || 0;
  const aiPercentage =
    aiLimit > 0 && aiLimit < 999999
      ? Math.min(100, Math.round((aiUsed / aiLimit) * 100))
      : 0;

  return (
    <div className="space-y-6" dir="rtl">
      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-4">
          {error}
        </div>
      )}

      <section className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-2">
          الاشتراك والاستخدام
        </h2>

        <p className="text-slate-500 mb-6">
          تابع باقتك الحالية وحدود استخدام الذكاء الاصطناعي.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-slate-500 text-sm mb-1">
              الباقة الحالية
            </p>
            <p className="text-2xl font-bold text-green-600">
              {currentPlan}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-slate-500 text-sm mb-1">
              ردود AI اليوم
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {aiUsed} / {aiLimit >= 999999 ? "∞" : aiLimit}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-slate-500 text-sm mb-1">
              حالة الاشتراك
            </p>
            <p className="text-2xl font-bold text-purple-600">
              {subscription?.status || "ACTIVE"}
            </p>
          </div>
        </div>

        {aiLimit < 999999 && (
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>استخدام AI اليوم</span>
              <span>{aiPercentage}%</span>
            </div>

            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-full"
                style={{ width: `${aiPercentage}%` }}
              />
            </div>
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-6 shadow-sm border ${
                isCurrent
                  ? "border-green-500 ring-2 ring-green-100"
                  : "border-transparent"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold">
                  {plan.name}
                </h3>

                {isCurrent && (
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    الحالية
                  </span>
                )}
              </div>

              <p className="text-2xl font-bold mb-2">
                {plan.price}
              </p>

              <p className="text-slate-500 mb-5">
                {plan.description}
              </p>

              <ul className="space-y-2 text-sm mb-6">
                <li>🤖 ردود AI: {plan.aiRepliesLimit}</li>
                <li>👥 العملاء: {plan.customersLimit}</li>
                <li>📦 المنتجات: {plan.productsLimit}</li>
                <li>🧾 الطلبات: {plan.ordersLimit}</li>
              </ul>

              <button
                disabled={isCurrent || changingPlan === plan.id}
                onClick={() => handleChangePlan(plan.id)}
                className={`w-full rounded-xl py-3 font-semibold ${
                  isCurrent
                    ? "bg-slate-100 text-slate-400"
                    : "bg-green-600 hover:bg-green-700 text-white"
                } disabled:opacity-60`}
              >
                {isCurrent
                  ? "الباقة الحالية"
                  : changingPlan === plan.id
                  ? "جاري التغيير..."
                  : "اختيار الباقة"}
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}