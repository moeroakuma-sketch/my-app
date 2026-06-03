<!-- BEGIN:nextjs-agent-rules -->
# これは、あなたが知っている Next.js ではありません

このバージョンには破壊的変更があります。API、慣習、ファイル構成は、あなたの学習済み知識と異なる可能性があります。コードを書く前に、必ず `node_modules/next/dist/docs/` にある関連ガイドを読んでください。非推奨の警告も必ず確認してください。
<!-- END:nextjs-agent-rules -->

# my-app 用エージェント指示

## プロジェクト概要

- このリポジトリは `my-app` です。Next.js 16.2.6、React 19、TypeScript、Tailwind CSS 4、Prisma 7、PostgreSQL を使った ShopMVP 系のオンラインショップです。
- 商品一覧、商品詳細、カート、チェックアウト、注文完了、注文履歴、認証、アカウント、支払い方法、商品レビュー機能があります。
- Next.js App Router 構成です。ルートは `app/`、共通 UI は `components/`、クライアント状態は `context/`、共有ロジックは `lib/`、DB スキーマと seed は `prisma/` にあります。

## Next.js のルール

- Next.js 固有のコードを編集する前に、必ず `node_modules/next/dist/docs/` にある関連ガイドを読んでください。記憶や古い公開記事より、ローカルにある現在のドキュメントを優先してください。
- Next.js の非推奨警告、ビルド警告、API 形状の変更は重要な情報として扱ってください。理由を理解せずに無視したり抑制したりしないでください。
- Server Component、Client Component、Server Action、Route Handler の境界を明確にしてください。
- `"use client"` は、hooks、ブラウザ API、イベントハンドラ、クライアント Context が必要なコンポーネントにだけ付けてください。
- プロジェクト内 import には、既存の `@/*` TypeScript パスエイリアスを使ってください。
- 画像ドメイン、ルーティング規約、Server Action、metadata、cache/revalidation、Next.js 設定を変更する場合は、対応する Next.js 16 のドキュメントを先に確認してください。

## 実装ルール

- 既存のフォルダ構成、命名、コンポーネント分割に従ってください。変更範囲は依頼された内容に絞ってください。
- 新しいユーティリティを作る前に、まず `lib/` の既存 helper を確認してください。
- フォーム検証やサーバー側の入力チェックは、関連する Server Action または Route Handler の近くに置き、必要に応じて Zod を使ってください。
- 日本語 UI 文言は UTF-8 として扱ってください。文字化けを見つけても、依頼内容に関係する箇所か、ユーザーが修正を求めた場合だけ直してください。
- `.next/`、`next-env.d.ts`、生成された Prisma Client など、生成物やビルド出力を手で編集しないでください。
- `.env` の秘密情報を変更しないでください。プレースホルダーの説明には `.env.example` を使ってください。
- 関係のないリファクタリング、大規模な書き換え、デザイン変更は避けてください。

## Prisma とデータベース

- クエリ、リレーション、データ前提を変更する前に、必ず `prisma/schema.prisma` を読んでください。
- Prisma generator は Client を `app/generated/prisma` に出力します。Prisma 関連コードを更新するときは、この import パスを考慮してください。
- スキーマを変更する場合は、関連する seed、フォーム、Server Action、読み取り処理も合わせて確認してください。
- `npm run db:push`、`npm run db:seed`、`npm run db:studio` など、データベースに副作用があるコマンドは、実行前にユーザーの明示的な確認を取ってください。

## 検証

- コード変更後は、まず変更内容に合った最小限の確認を行い、必要に応じて `npm run lint` を実行してください。
- ルーティング、レンダリング、Server Action、Prisma、production 動作に影響する変更では、`npm run build` も実行してください。
- データベーススキーマを変更した場合は、Prisma 生成の確認を行い、DB push や seed を実行したか、または実行しなかった理由を報告してください。
- 最終報告では、実行した検証コマンド、結果、実行できなかった確認があればその理由を明記してください。

## Git と作業ツリーの安全ルール

- 編集前に working tree を確認してください。ユーザーの変更を、明示的な依頼なしに戻したり、上書きしたり、片付けたりしないでください。
- `git reset --hard` や `git checkout --` のような破壊的な git コマンドは、明確な指示なしに使わないでください。
- コミット、ブランチ作成、push、PR 作成は、ユーザーが依頼した場合だけ行ってください。
