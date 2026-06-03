import Link from "next/link";
import { redirect } from "next/navigation";
import { loginUser } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const next = params.next?.startsWith("/") ? params.next : "/";

  if (user) {
    redirect(next);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-zinc-900">ログイン</h1>
      <p className="mt-2 text-sm text-zinc-600">
        会員情報や支払方法を使って、次回からスムーズに購入できます。
      </p>

      {params.error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      )}
      {params.message && (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {params.message}
        </div>
      )}

      <form action={loginUser} className="mt-8 space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
        <input type="hidden" name="next" value={next} />
        <label className="block text-sm">
          <span className="text-zinc-700">メールアドレス</span>
          <input required name="email" type="email" autoComplete="email" className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-700">パスワード</span>
          <input
            required
            name="password"
            type="password"
            minLength={8}
            autoComplete="current-password"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          ログイン
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        はじめての方は{" "}
        <Link href="/register" className="font-medium text-zinc-900 underline">
          会員登録
        </Link>
      </p>
    </div>
  );
}
