import Link from "next/link";
import { redirect } from "next/navigation";
import { registerUser } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

type RegisterPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (user) {
    redirect("/account");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-zinc-900">会員登録</h1>
      <p className="mt-2 text-sm text-zinc-600">
        氏名、メールアドレス、パスワードだけで登録できます。
      </p>

      {params.error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      )}

      <form action={registerUser} className="mt-8 space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
        <label className="block text-sm">
          <span className="text-zinc-700">氏名</span>
          <input required name="name" autoComplete="name" className={inputClass} />
        </label>
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
            autoComplete="new-password"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-zinc-500">8文字以上で入力してください。</span>
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          登録してはじめる
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        すでに登録済みの方は{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
