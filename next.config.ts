import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Lokal tarmoqdagi boshqa qurilmalardan (masalan telefondan) dev serverga
  // kirish uchun ruxsat berilgan manzillar. O'zingizning IP manzilingizni
  // (masalan `npm run dev` konsolida ko'rsatilgan "Network:" manzilini) shu
  // yerga qo'shing.
  allowedDevOrigins: ["localhost", "127.0.0.1"],

  // Kompyuteringizda boshqa joyda ham lockfile (masalan C:\Users\...\pnpm-lock.yaml)
  // bo'lsa, Next.js loyihaning "root"ini noto'g'ri aniqlab, ogohlantirish berishi
  // mumkin — shuni oldini olish uchun ushbu papkani aniq root deb belgilaymiz.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
