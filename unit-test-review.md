# Unit Test Review

作成日: 2026-06-03

## レビュー観点

- テストケースの不足分はないか
- 実DBを使用していないか

## 対象

- `__tests__/backend/products.test.ts`
- `__tests__/backend/order.test.ts`
- `vitest.config.mts`
- 関連実装:
  - `lib/products.ts`
  - `app/actions/order.ts`
  - `app/actions/auth.ts`
  - `app/actions/review.ts`
  - `lib/auth.ts`
  - `lib/prisma.ts`

## 結論

現状の unit test は、`@/lib/prisma` を mock しており、既存テスト実行時に実DBを直接使用していません。

一方で、テスト対象は `lib/products.ts` と `app/actions/order.ts` に限られており、認証、アカウント、レビュー、API route、クライアント状態の主要ロジックには unit test が不足しています。

## 実DB使用の確認

### 現状

- `products.test.ts` は `vi.mock("@/lib/prisma", ...)` で `prisma.product` を mock しています。
- `order.test.ts` は `vi.mock("@/lib/prisma", ...)` で `$transaction` と `order.updateMany` を mock しています。
- テストファイル内で `new PrismaClient`、`DATABASE_URL`、`@prisma/adapter-pg` は直接参照されていません。
- 実DB接続を作る箇所は `lib/prisma.ts` と `prisma/seed.ts` に限定されています。

### 懸念

`vitest.config.mts` に global setup や setup file がなく、`@/lib/prisma` の mock 漏れを検知する仕組みはありません。

今後の unit test で `@/lib/prisma` を mock せずに対象 module を import すると、`lib/prisma.ts` 経由で実DB接続に寄る可能性があります。

### 推奨

- unit test 用 setup file を追加し、意図しない `@/lib/prisma` import を fail-fast させる。
- DB を使うテストを追加する場合は unit test ではなく integration test として分離し、専用DB、専用 script、専用 environment variable を使う。

## 指摘事項

### P2: mock implementation の持ち越しリスク

`order.test.ts` の `beforeEach` は `vi.clearAllMocks()` を使っていますが、これは call history を消すだけで mock implementation は残します。

特に `transactionClientMock.product.updateMany.mockResolvedValue({ count: 1 })` のような default implementation が後続テストに残り得ます。

推奨対応:

- `vi.resetAllMocks()` を使う。
- もしくは `beforeEach` で各 mock の implementation を明示的に初期化する。

### P2: レビュー機能の Server Action が未テスト

`app/actions/review.ts` は分岐が多く、DB 更新やファイル保存も絡むため unit test の追加優先度が高いです。

追加したいケース:

- 商品が存在しない場合はエラーになる。
- 未ログイン時は login に redirect される。
- rating 未指定、不正値、範囲外を拒否する。
- comment 空、1000文字超を拒否する。
- 画像が4枚以上の場合を拒否する。
- JPEG/PNG/WebP 以外を拒否する。
- 5MB超の画像を拒否する。
- 未購入の商品はレビューできない。
- 既にレビュー済みの商品はレビューできない。
- 正常系で review 作成、画像作成、revalidate が呼ばれる。
- helpful の追加、解除、自分のレビューへの helpful 拒否。
- review report の正常系、理由不正、自分のレビュー報告拒否、重複報告。

### P2: 認証・アカウント系 Server Action が未テスト

`app/actions/auth.ts` には登録、ログイン、ログアウト、プロフィール更新、支払方法保存、退会がまとまっていますが、unit test がありません。

追加したいケース:

- register: 入力不正、email 重複、正常登録、session 作成、revalidate、redirect。
- login: next path sanitize、不正 password、存在しない user、正常 login。
- logout: session 破棄、revalidate、redirect。
- updateProfile: 未ログイン redirect、入力不正、email 重複エラー、正常更新。
- savePaymentMethod: 未ログイン redirect、カード番号不正、期限切れ、既存支払方法 update、新規 create、brand 判定。
- deleteAccount: 未ログイン redirect、password 不一致、正常削除、session 破棄。

### P3: 注文機能の未カバー分岐

`app/actions/order.ts` は主要な happy path、在庫不足、同時更新失敗、キャンセル正常系、未ログインキャンセルをカバーしています。

追加したいケース:

- 商品IDが存在しない場合に `存在しない商品が含まれています` を返す。
- email が不正な場合に transaction を開始しない。
- postalCode が7桁に正規化できない場合に transaction を開始しない。
- phone が10から11桁に正規化できない場合に transaction を開始しない。
- quantity が0、負数、小数の場合に validation error になる。
- `cancelOrder` で `orderId` がない、または string でない場合は更新しない。
- transaction callback 内で予期しない Error 以外が throw された場合の fallback message。

### P3: 商品 query の境界値が未テスト

`lib/products.ts` は query shape の確認としては最低限カバーされています。

追加したいケース:

- `getFeaturedProducts()` の default limit が 6 であること。
- `getCategories()` が空配列を返す場合。
- `getProducts("")` が category filter なしとして扱われること。

### P3: API route と外部 fetch の unit test が未追加

`app/api/postal-code/route.ts` と `lib/postal-code.ts` は未テストです。

追加したいケース:

- zipcode 未指定は 400。
- 7桁でない zipcode は 400。
- `lookupPostalCode` が null の場合は 404。
- fetch 失敗時は 502。
- zipcloud response が正常な場合は prefecture/city/town を返す。
- fetch は mock し、実ネットワークには接続しない。

### P3: Cart context の unit test が未追加

`context/cart-context.tsx` はユーザー操作に近い状態管理ですが未テストです。

追加したいケース:

- localStorage から初期 load する。
- `addItem` は新規追加と既存商品の数量加算を行う。
- `updateQuantity` は数量更新し、1未満なら削除する。
- `removeItem` と `clearCart` が正しく動く。
- `itemCount` と `subtotal` が正しく計算される。
- 壊れた localStorage JSON の場合は空配列に fallback する。

## 検証結果

実行コマンド:

```powershell
npm.cmd run test:run
```

結果:

- Test Files: 2 passed
- Tests: 11 passed
- 実DB接続を示す error や `DATABASE_URL` 依存の失敗は発生していません。

補足:

- PowerShell の実行ポリシーにより `npm run test:run` は `npm.ps1` 読み込みで失敗しました。
- 同じ script を `npm.cmd run test:run` で実行し、成功を確認しました。

## 優先順位

1. `order.test.ts` の mock reset を改善する。
2. `app/actions/review.ts` の unit test を追加する。
3. `app/actions/auth.ts` の unit test を追加する。
4. `@/lib/prisma` の mock 漏れを検知する unit test setup を検討する。
5. postal-code API、cart context、商品 query の境界値テストを追加する。
