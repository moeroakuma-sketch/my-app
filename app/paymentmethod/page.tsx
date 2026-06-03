import { redirect } from "next/navigation";
import { savePaymentMethod } from "@/app/actions/auth";
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
    // フォーム全体の最大幅を 4xl に絞る
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">カード情報</h1>
          {/* ページの説明文を追記しました */}
          <p className="mt-2 text-sm text-zinc-600">
            お支払いに関する情報を管理します。
          </p>
        </div>
      </div>

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

      {/* 不要なグリッド指定(lg:grid-cols-3)を削除 */}
      <div className="mt-8">
        
        {/* モダンなカードレイアウトに変更 */}
        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          {/* セクションヘッダー */}
          <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-4">
            <h2 className="text-base font-semibold text-zinc-900">支払方法</h2>
            <p className="mt-1 text-sm text-zinc-500">
              クレジットカード情報の登録・更新を行います。
            </p>
          </div>

          <div className="p-6">
            {/* 登録済み情報の表示をリッチに改修 */}
            {paymentMethod ? (
              <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-12 items-center justify-center rounded border border-zinc-200 bg-white text-xs font-bold text-zinc-600 shadow-sm uppercase">
                    {paymentMethod.brand}
                  </div>
                  <div className="text-sm font-medium text-zinc-700">
                    •••• •••• •••• {paymentMethod.last4}
                  </div>
                </div>
                <div className="text-sm text-zinc-500">
                  有効期限: {String(paymentMethod.expMonth).padStart(2, "0")}/{paymentMethod.expYear}
                </div>
              </div>
            ) : (
              <p className="mb-8 text-sm text-zinc-600">登録済みの支払方法はありません。</p>
            )}

            <form action={savePaymentMethod} className="space-y-6">
              {/* 入力項目を4分割グリッドで整理 */}
              <div className="grid gap-6 sm:grid-cols-4">
                <label className="block text-sm sm:col-span-4">
                  <span className="text-zinc-700 font-medium">カード名義</span>
                  <input
                    required
                    name="holderName"
                    defaultValue={paymentMethod?.holderName}
                    autoComplete="cc-name"
                    className={inputClass}
                    placeholder="TARO YAMADA"
                  />
                </label>
                
                <label className="block text-sm sm:col-span-4">
                  <span className="text-zinc-700 font-medium">カード番号</span>
                  <input
                    required
                    name="cardNumber"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    className={inputClass}
                  />
                  <span className="mt-1 block text-xs text-zinc-500">
                    ※カード番号は保存せず、下4桁だけを安全に記録します。
                  </span>
                </label>

                {/* 月と年を横並びに配置 */}
                <label className="block text-sm sm:col-span-2">
                  <span className="text-zinc-700 font-medium">有効期限（月）</span>
                  <input
                    required
                    name="expMonth"
                    type="number"
                    min="1"
                    max="12"
                    defaultValue={paymentMethod?.expMonth}
                    autoComplete="cc-exp-month"
                    className={inputClass}
                    placeholder="01"
                  />
                </label>
                
                <label className="block text-sm sm:col-span-2">
                  <span className="text-zinc-700 font-medium">有効期限（年）</span>
                  <input
                    required
                    name="expYear"
                    type="number"
                    min={new Date().getFullYear()}
                    defaultValue={paymentMethod?.expYear}
                    autoComplete="cc-exp-year"
                    className={inputClass}
                    placeholder="2026"
                  />
                </label>
              </div>

              {/* 保存ボタンを右寄せに */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors"
                >
                  支払方法を保存する
                </button>
              </div>
            </form>
          </div>
        </section>

      </div>
    </div>
  );
}