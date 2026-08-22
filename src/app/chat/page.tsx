"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { MessageCircle, Send, Paperclip, Loader2 } from "lucide-react";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getSocket } from "@/lib/socket";
import type { ChatMessage } from "@/lib/types";
import { extractId } from "@/lib/utils";
import { BackButton } from "@/components/BackButton";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { ImageLightbox } from "@/components/ImageLightbox";

function resolveImage(url?: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const res = await api.get<ChatMessage[]>("/chat/me");
      setMessages(Array.isArray(res) ? res : []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      await load();
    })();
     
  }, [user]);

  const addMessage = (msg: ChatMessage) => {
    setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
  };

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const onMessage = (msg: ChatMessage) => {
      if (extractId(msg.user_id) === user._id) {
        addMessage(msg);
      }
    };
    socket.on("new-message", onMessage);
    return () => {
      socket.off("new-message", onMessage);
    };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post<{ success: boolean; data?: ChatMessage }>("/chat/me", { text: text.trim() });
      if (res.success && res.data) {
        addMessage(res.data);
        setText("");
      }
    } finally {
      setSending(false);
    }
  };

  const handleAttach = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await api.post<{ success: boolean; data?: { url: string } }>("/upload", formData);
      if (!uploadRes.success || !uploadRes.data?.url) return;

      const res = await api.post<{ success: boolean; data?: ChatMessage }>("/chat/me", {
        image_url: uploadRes.data.url,
      });
      if (res.success && res.data) addMessage(res.data);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-2xl flex-col px-4 py-6 sm:px-6">
      <div className="mb-4">
        <BackButton href="/" label="Menyuga qaytish" />
      </div>

      <h1 className="mb-4 flex items-center gap-2 font-display text-2xl font-semibold text-dark">
        <MessageCircle className="h-6 w-6 text-teal" />
        Admin bilan chat
      </h1>

      {authLoading || loading ? (
        <Spinner />
      ) : !user ? (
        <EmptyState icon={MessageCircle} title="Avval tizimga kiring" description="Admin bilan yozishish uchun hisobingizga kiring." />
      ) : (
        <>
          <div className="frame mb-3 flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="Hali xabar yo'q"
                description="Savolingiz yoki muammoingiz bo'lsa, pastdan yozing — admin tez orada javob beradi."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {messages.map((m) => {
                  const isMine = m.sender_role === "CLIENT";
                  const image = resolveImage(m.image_url);
                  return (
                    <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                          isMine ? "bg-teal text-white" : "bg-gray/25 text-dark"
                        }`}
                      >
                        {image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image}
                            alt="Biriktirilgan rasm"
                            onClick={() => setLightboxSrc(image)}
                            className="mb-1 max-h-56 cursor-zoom-in rounded-lg object-contain"
                          />
                        )}
                        {m.text && <p>{m.text}</p>}
                        <p className={`mt-1 text-[10px] ${isMine ? "text-white/70" : "text-dark/40"}`}>
                          {new Date(m.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAttach(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Rasm biriktirish"
              className="flex items-center justify-center rounded-full border border-dark/15 px-3 text-dark/60 hover:border-teal hover:text-teal disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Xabar yozing..."
              className="flex-1 rounded-full border border-dark/15 px-4 py-2.5 text-sm outline-none focus:border-teal"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="flex items-center gap-1.5 rounded-full bg-olive px-4 py-2.5 text-sm font-semibold text-dark hover:brightness-105 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </>
      )}

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
