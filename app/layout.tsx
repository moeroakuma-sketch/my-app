import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { CartProvider } from "@/context/cart-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShopMVP | オンラインショップ",
  description: "シンプルで快適なオンラインショッピング体験",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
        <CartProvider>
          <Header/>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-200 bg-white py-8 text-center text-sm text-zinc-500">
            <p>&copy; {new Date().getFullYear()} ShopMVP. All rights reserved.</p>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
