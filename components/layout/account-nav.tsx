"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, History, LogIn, LogOut, Trash2, UserRound } from "lucide-react";
import { logoutUser } from "@/app/actions/auth";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

type AccountNavProps = {
  initialUser: CurrentUser | null;
};

export function AccountNav({ initialUser }: AccountNavProps) {
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(initialUser);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as { user: CurrentUser | null };
        if (!ignore) setUser(data.user);
      } catch {
        if (!ignore) setUser(null);
      }
    }

    loadUser();
    window.addEventListener("pageshow", loadUser);

    return () => {
      ignore = true;
      window.removeEventListener("pageshow", loadUser);
    };
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 transition-colors hover:text-zinc-900"
      >
        <LogIn className="h-5 w-5" />
        <span className="hidden sm:inline">ログイン</span>
      </Link>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-1.5 transition-colors hover:text-zinc-900"
      >
        <UserRound className="h-5 w-5" />
        <span className="hidden sm:inline">{user.name}さん ▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <Link
            href="/account"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
          >
            <UserRound className="h-4 w-4" />
            マイページ
          </Link>

          <Link
            href="/paymentmethod"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
          >
            <CreditCard className="h-4 w-4" />
            お支払い方法
          </Link>

          <Link
            href="/history"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
          >
            <History className="h-4 w-4" />
            注文履歴
          </Link>

          <Link
            href="/delete"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
          >
            <Trash2 className="h-4 w-4" />
            退会
          </Link>

          <div className="my-1 border-t border-gray-100" />

          <form action={logoutUser}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              ログアウト
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
