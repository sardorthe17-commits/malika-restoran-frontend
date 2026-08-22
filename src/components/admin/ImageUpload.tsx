"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { api, API_URL } from "@/lib/api";

interface ImageUploadProps {
  value: string; // saqlangan yo'l, masalan "/uploads/xyz.jpg" yoki bo'sh
  onChange: (url: string) => void;
}

function resolvePreview(url: string) {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post<{ success: boolean; message?: string; data?: { url: string } }>(
        "/upload",
        formData
      );
      if (!res.success || !res.data?.url) {
        setError(res.message ?? "Rasm yuklashda xatolik yuz berdi");
        return;
      }
      onChange(res.data.url);
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setUploading(false);
    }
  };

  const preview = resolvePreview(value);

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <div className="flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dark/15 bg-gray/20">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-teal" />
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Rasm" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-dark/30" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-lg border border-teal/40 px-3 py-1.5 text-xs font-medium text-teal hover:bg-teal/5 disabled:opacity-60"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {value ? "Rasmni almashtirish" : "Rasm tanlash"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="flex items-center gap-1.5 text-xs font-medium text-dark/50 hover:text-red-600"
            >
              <X className="h-3.5 w-3.5" />
              Rasmni olib tashlash
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
