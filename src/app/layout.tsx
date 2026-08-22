import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SelectionProvider } from "@/context/SelectionContext";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Malika Restoran",
  description: "Malika Restoran — onlayn menyu, stol bron qilish va buyurtma berish",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-cream font-sans text-dark">
        <AuthProvider>
          <SelectionProvider>
            <CartProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
            </CartProvider>
          </SelectionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
