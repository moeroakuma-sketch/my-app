import { redirect } from "next/navigation";
import { logoutUser, updateProfile } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

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

  return (
    // ポイント1: フォーム全体の最大幅を 6xl(広すぎ) から 4xl(適正幅) に絞りました
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">マイページ</h1>
          <p className="mt-2 text-sm text-zinc-600">
            会員情報の編集とログアウトができます。
          </p>
        </div>
        <form action={logoutUser}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            ログアウト
          </button>
        </form>
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

      {/* フォーム全体をまとめる */}
      <div className="mt-8">
        <form action={updateProfile} className="space-y-6">
          
          {/* --- カテゴリー1: 基本情報 --- */}
          <section className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            {/* セクションヘッダー：薄いグレー背景で区切りを明確に */}
            <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-4">
              <h2 className="text-base font-semibold text-zinc-900">基本情報</h2>
              <p className="mt-1 text-sm text-zinc-500">お名前やご連絡先などの基本情報を設定します。</p>
            </div>
            
            <div className="p-6 grid gap-6 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="text-zinc-700 font-medium">氏名</span>
                <input required name="name" defaultValue={user.name} className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-700 font-medium">メールアドレス</span>
                <input
                  required
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-700 font-medium">電話番号</span>
                <input name="phone" defaultValue={user.phone} className={inputClass} placeholder="090-1234-5678" />
              </label>
            </div>
          </section>

          {/* --- カテゴリー2: 住所情報 --- */}
          <section className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-4">
              <h2 className="text-base font-semibold text-zinc-900">住所情報</h2>
              <p className="mt-1 text-sm text-zinc-500">商品の配送などに使用する住所を設定します。</p>
            </div>
            
            {/* ポイント2: 6分割グリッドを採用し、項目ごとの適切な長さに調整 */}
            <div className="p-6 grid gap-6 sm:grid-cols-6">
              <label className="block text-sm sm:col-span-2">
                <span className="text-zinc-700 font-medium">郵便番号</span>
                <input name="postalCode" defaultValue={user.postalCode} className={inputClass} placeholder="123-4567" />
              </label>
              <label className="block text-sm sm:col-span-4">
                <span className="text-zinc-700 font-medium">都道府県</span>
                <input name="prefecture" defaultValue={user.prefecture} className={inputClass} placeholder="東京都" />
              </label>

              <label className="block text-sm sm:col-span-3">
                <span className="text-zinc-700 font-medium">市区町村</span>
                <input name="city" defaultValue={user.city} className={inputClass} placeholder="渋谷区" />
              </label>
              <label className="block text-sm sm:col-span-3">
                <span className="text-zinc-700 font-medium">町域</span>
                <input name="town" defaultValue={user.town} className={inputClass} placeholder="神南" />
              </label>

              <label className="block text-sm sm:col-span-6">
                <span className="text-zinc-700 font-medium">番地・建物名</span>
                <input name="addressLine" defaultValue={user.addressLine} className={inputClass} placeholder="1-2-3 〇〇ビル 4F" />
              </label>
            </div>
          </section>

          {/* --- 保存ボタンを独立させる --- */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors"
            >
              変更を保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}