export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = "حذف", danger = true }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-slate-500 mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
          >
            {confirmLabel}
          </button>
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
