import { redirect } from "next/navigation";
import { deleteAccount } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AccountPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);

  if (!user) {
    redirect("/login?next=/account");
  }

  const paymentMethod = await prisma.paymentMethod.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
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

      {/* ここを修正： lg:grid-cols-3 を削除しました */}
      <div className="mt-8 grid gap-8">
        <section className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900">退会</h2>
          <p className="mt-2 text-sm text-red-700">
            退会すると会員情報と支払方法が削除されます。
          </p>
          <form action={deleteAccount} className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="text-red-800">現在のパスワード</span>
              <input
                required
                name="password"
                type="password"
                autoComplete="current-password"
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-red-700 py-2.5 text-sm font-medium text-white hover:bg-red-800"
            >
              退会する
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}