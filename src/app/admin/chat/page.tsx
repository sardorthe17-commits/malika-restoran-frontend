"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Conversation } from "@/lib/types";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get<Conversation[]>("/chat/conversations");
      setConversations(Array.isArray(res) ? res : []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (() => {
      load();
    })();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const refresh = () => load();
    socket.on("new-message", refresh);
    return () => {
      socket.off("new-message", refresh);
    };
  }, []);

  return (
    <div>
      <h1 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold text-dark">
        <MessageCircle className="h-6 w-6 text-teal" />
        Chat
      </h1>

      {loading ? (
        <Spinner />
      ) : conversations.length === 0 ? (
        <EmptyState icon={MessageCircle} title="Hozircha suhbatlar yo'q" />
      ) : (
        <div className="frame divide-y divide-dark/10">
          {conversations.map((c, idx) => (
            <Link
              key={c.user?._id ?? idx}
              href={`/admin/chat/${c.user?._id}`}
              className="flex items-center gap-3 p-4 transition hover:bg-teal/5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-dark">{c.user?.fullName ?? "Noma'lum mijoz"}</p>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-olive px-1.5 text-[11px] font-bold text-dark">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-dark/50">{c.lastMessage}</p>
              </div>
              <span className="shrink-0 text-xs text-dark/40">
                {new Date(c.lastAt).toLocaleString("uz-UZ")}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-dark/30" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
