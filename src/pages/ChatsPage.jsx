import { useEffect, useState, useRef } from "react";
import {
  getChats, addMessage, generateAIReply, updateChatStatus,
  toggleAutoReply, generateChatSummary, sendWhatsAppMessage, deleteChat,
} from "../api";
import { getSocket } from "../socket";
import ConfirmModal from "../components/ConfirmModal";

const INTENT_LABELS = { ORDER: "🛒 طلب", INQUIRY: "❓ استفسار", COMPLAINT: "⚠️ شكوى", CLOSING: "👋 ختام", REPLY: "🤖" };
const STATUS_LABELS = { OPEN: "مفتوحة", PENDING: "معلقة", CLOSED: "مغلقة" };

export default function ChatsPage({ showToast }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("OPEN");
  const [confirmId, setConfirmId] = useState(null);
  const [waMessage, setWaMessage] = useState("");
  const [showWaSend, setShowWaSend] = useState(false);
  const messagesEndRef = useRef(null);

  async function loadChats() {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await getChats(params);
      setChats(Array.isArray(res) ? res : []);
    } catch (e) {
      showToast?.(e.message || "فشل تحميل المحادثات", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadChats(); }, [filterStatus]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewMsg = ({ chatId, message: msg, customer }) => {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.id === chatId);
        if (idx === -1) {
          loadChats();
          return prev;
        }
        const updated = [...prev];
        const chat = { ...updated[idx] };
        chat.messages = [...(chat.messages || []), msg];
        chat.updatedAt = new Date().toISOString();
        updated.splice(idx, 1);
        updated.unshift(chat);
        return updated;
      });
      setSelectedChat((prev) => {
        if (prev?.id === chatId) return { ...prev, messages: [...(prev.messages || []), msg] };
        return prev;
      });
    };

    const onChatUpdated = (chat) => {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.id === chat.id);
        if (idx === -1) return [chat, ...prev];
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...chat };
        return updated;
      });
      setSelectedChat((prev) => (prev?.id === chat.id ? { ...prev, ...chat } : prev));
    };

    const onChatNew = (chat) => { setChats((prev) => [chat, ...prev]); };

    socket.on("message:new", onNewMsg);
    socket.on("chat:updated", onChatUpdated);
    socket.on("chat:new", onChatNew);
    return () => {
      socket.off("message:new", onNewMsg);
      socket.off("chat:updated", onChatUpdated);
      socket.off("chat:new", onChatNew);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat?.messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;
    setSending(true);
    try {
      const msg = await addMessage(selectedChat.id, { sender: "agent", content: message });
      setSelectedChat((prev) => ({ ...prev, messages: [...(prev.messages || []), msg] }));
      setChats((prev) => prev.map((c) => c.id === selectedChat.id ? { ...c, messages: [...(c.messages || []), msg] } : c));
      setMessage("");
    } catch (e) {
      showToast?.(e.message || "فشل الإرسال", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleAIReply() {
    if (!selectedChat) return;
    setAiLoading(true);
    try {
      const res = await generateAIReply(selectedChat.id);
      const msg = res.message;
      setSelectedChat((prev) => ({ ...prev, messages: [...(prev.messages || []), msg] }));
      setChats((prev) => prev.map((c) => c.id === selectedChat.id ? { ...c, messages: [...(c.messages || []), msg] } : c));
      showToast?.("تم توليد الرد بالذكاء الاصطناعي ✅");
    } catch (e) {
      showToast?.(e.message || "فشل توليد الرد", "error");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleToggleAutoReply() {
    if (!selectedChat) return;
    try {
      const updated = await toggleAutoReply(selectedChat.id, !selectedChat.autoReply);
      setSelectedChat((prev) => ({ ...prev, autoReply: updated.autoReply }));
      setChats((prev) => prev.map((c) => c.id === selectedChat.id ? { ...c, autoReply: updated.autoReply } : c));
      showToast?.(updated.autoReply ? "تم تفعيل الرد التلقائي 🤖" : "تم إيقاف الرد التلقائي ✋");
    } catch (e) {
      showToast?.(e.message || "فشل التغيير", "error");
    }
  }

  async function handleSummary() {
    if (!selectedChat) return;
    setSummaryLoading(true);
    try {
      const res = await generateChatSummary(selectedChat.id);
      setSelectedChat((prev) => ({ ...prev, summary: res.summary }));
      showToast?.("تم إنشاء الملخص ✅");
    } catch (e) {
      showToast?.(e.message || "فشل إنشاء الملخص", "error");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleStatusChange(chatId, status) {
    try {
      await updateChatStatus(chatId, status);
      setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, status } : c));
      if (selectedChat?.id === chatId) setSelectedChat((prev) => ({ ...prev, status }));
    } catch (e) {
      showToast?.(e.message || "فشل تغيير الحالة", "error");
    }
  }

  async function handleSendWA() {
    if (!waMessage.trim() || !selectedChat) return;
    try {
      await sendWhatsAppMessage(selectedChat.id, waMessage);
      showToast?.("تم إرسال الرسالة عبر واتساب ✅");
      setWaMessage(""); setShowWaSend(false);
      const msg = { id: Date.now(), sender: "agent", content: waMessage, createdAt: new Date().toISOString() };
      setSelectedChat((prev) => ({ ...prev, messages: [...(prev.messages || []), msg] }));
    } catch (e) {
      showToast?.(e.message || "فشل الإرسال عبر واتساب", "error");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteChat(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (selectedChat?.id === id) setSelectedChat(null);
      showToast?.("تم حذف المحادثة");
    } catch (e) {
      showToast?.(e.message || "فشل الحذف", "error");
    } finally {
      setConfirmId(null);
    }
  }

  const filtered = chats.filter((c) => {
    const name = c.customer?.name || c.customer?.phone || "";
    return !search || name.includes(search);
  });

  const lastMsg = (chat) => {
    const msgs = chat.messages || [];
    return msgs[msgs.length - 1]?.content?.slice(0, 40) || "لا توجد رسائل";
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      {confirmId && (
        <ConfirmModal
          title="حذف المحادثة"
          message="هل أنت متأكد من حذف هذه المحادثة وكل رسائلها؟"
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* Chat List */}
      <div className="w-72 shrink-0 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-3 border-b space-y-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm"
            placeholder="بحث..."
          />
          <select
            className="w-full border rounded-xl px-3 py-1.5 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">كل المحادثات</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-6 text-slate-400 text-sm">جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">لا توجد محادثات</div>
          ) : (
            filtered.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`w-full text-right px-3 py-3 border-b hover:bg-slate-50 transition ${selectedChat?.id === chat.id ? "bg-green-50 border-r-2 border-green-500" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm truncate">{chat.customer?.name || chat.customer?.phone}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    {!chat.autoReply && <span title="الرد اليدوي" className="text-orange-500 text-xs">✋</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${chat.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {STATUS_LABELS[chat.status]}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{lastMsg(chat)}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      {selectedChat ? (
        <div className="flex-1 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold">{selectedChat.customer?.name || selectedChat.customer?.phone}</p>
              <p className="text-xs text-slate-400">{selectedChat.customer?.phone}</p>
              {selectedChat.summary && (
                <p className="text-xs text-blue-600 mt-0.5 bg-blue-50 px-2 py-0.5 rounded-full">📝 {selectedChat.summary}</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Auto-reply toggle */}
              <button
                onClick={handleToggleAutoReply}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
                  selectedChat.autoReply ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                }`}
              >
                {selectedChat.autoReply ? "🤖 آلي" : "✋ يدوي"}
              </button>

              {/* Summary */}
              <button
                onClick={handleSummary}
                disabled={summaryLoading}
                className="text-xs px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
              >
                {summaryLoading ? "..." : "📝 ملخص"}
              </button>

              {/* WA proactive send */}
              <button
                onClick={() => setShowWaSend((v) => !v)}
                className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              >
                📤 إرسال واتساب
              </button>

              {/* Status */}
              <select
                className="border rounded-xl px-2 py-1.5 text-xs"
                value={selectedChat.status}
                onChange={(e) => handleStatusChange(selectedChat.id, e.target.value)}
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>

              <button onClick={() => setConfirmId(selectedChat.id)} className="text-xs text-red-500 hover:underline">حذف</button>
            </div>
          </div>

          {/* Proactive WA send bar */}
          {showWaSend && (
            <div className="px-4 py-2 bg-emerald-50 border-b flex gap-2">
              <input
                className="flex-1 border rounded-xl px-3 py-1.5 text-sm"
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                placeholder="اكتب رسالة لإرسالها عبر واتساب..."
              />
              <button onClick={handleSendWA} className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-sm">إرسال</button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {(selectedChat.messages || []).map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "customer" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  msg.sender === "customer" ? "bg-slate-100 text-slate-800" : msg.sender === "ai" ? "bg-green-600 text-white" : "bg-blue-500 text-white"
                }`}>
                  {msg.content}
                  <div className="flex items-center justify-between gap-2 mt-1">
                    {msg.intent && msg.sender === "customer" && (
                      <span className="text-xs opacity-60">{INTENT_LABELS[msg.intent] || ""}</span>
                    )}
                    <span className="text-xs opacity-50 mr-auto">
                      {new Date(msg.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t flex gap-2">
            <form onSubmit={handleSend} className="flex-1 flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 border rounded-xl px-3 py-2 text-sm"
                placeholder="اكتب رداً..."
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
              >
                {sending ? "..." : "إرسال"}
              </button>
            </form>
            <button
              onClick={handleAIReply}
              disabled={aiLoading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
            >
              {aiLoading ? "..." : "🤖 AI"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400">
          <div className="text-center">
            <p className="text-4xl mb-3">💬</p>
            <p>اختر محادثة للبدء</p>
          </div>
        </div>
      )}
    </div>
  );
}
