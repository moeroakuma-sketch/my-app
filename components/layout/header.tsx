import Link from "next/link";
import { Store } from "lucide-react";
import { AccountNav } from "@/components/layout/account-nav";
import { CartLink } from "@/components/layout/cart-link";
import { getCurrentUser } from "@/lib/auth";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-zinc-900"
        >
          <Store className="h-5 w-5" />
          <span>ShopMVP</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-zinc-600">
          <Link href="/products" className="hover:text-zinc-900">
            商品一覧
          </Link>
          <CartLink />
          <AccountNav initialUser={user} />
        </nav>
      </div>
    </header>
  );
}
