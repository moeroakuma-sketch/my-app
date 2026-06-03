import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const products = [
  {
    name: "オーガニックコットンTシャツ",
    slug: "organic-cotton-tee",
    description:
      "肌触りの良いオーガニックコットン100%。日常使いに最適な定番Tシャツです。",
    price: 3980,
    imageUrl: "https://picsum.photos/seed/tee1/800/800",
    stock: 25,
    category: "アパレル",
  },
  {
    name: "リネンシャツ",
    slug: "linen-shirt",
    description: "通気性抜群のリネン素材。夏場のビジネスカジュアルに。",
    price: 8900,
    imageUrl: "https://picsum.photos/seed/shirt1/800/800",
    stock: 15,
    category: "アパレル",
  },
  {
    name: "ウールニットセーター",
    slug: "wool-knit-sweater",
    description: "上質なメリノウール。軽くて暖かい冬の定番アイテム。",
    price: 12800,
    imageUrl: "https://picsum.photos/seed/sweater1/800/800",
    stock: 12,
    category: "アパレル",
  },
  {
    name: "レザーミニ財布",
    slug: "leather-mini-wallet",
    description: "コンパクトながら収納力抜群。本革を使用したミニ財布。",
    price: 6500,
    imageUrl: "https://picsum.photos/seed/wallet1/800/800",
    stock: 20,
    category: "バッグ・小物",
  },
  {
    name: "キャンバストートバッグ",
    slug: "canvas-tote-bag",
    description: "A4サイズが入る大容量トート。毎日使えるシンプルデザイン。",
    price: 3200,
    imageUrl: "https://picsum.photos/seed/tote1/800/800",
    stock: 30,
    category: "バッグ・小物",
  },
  {
    name: "ステンレスマグボトル",
    slug: "stainless-mug-bottle",
    description: "保温・保冷12時間。500mlのスリムなマグボトル。",
    price: 2800,
    imageUrl: "https://picsum.photos/seed/bottle1/800/800",
    stock: 40,
    category: "ライフスタイル",
  },
  {
    name: "アロマディフューザー",
    slug: "aroma-diffuser",
    description: "超音波式で静音設計。お部屋をやさしい香りで包みます。",
    price: 4500,
    imageUrl: "https://picsum.photos/seed/diffuser1/800/800",
    stock: 18,
    category: "ライフスタイル",
  },
  {
    name: "セラミックマグカップ",
    slug: "ceramic-mug",
    description: "手作り風の釉薬仕上げ。朝のコーヒータイムに。",
    price: 1980,
    imageUrl: "https://picsum.photos/seed/mug1/800/800",
    stock: 35,
    category: "ライフスタイル",
  },
  {
    name: "ワイヤレスイヤホン",
    slug: "wireless-earbuds",
    description: "ノイズキャンセリング搭載。最大24時間の再生が可能。",
    price: 15800,
    imageUrl: "https://picsum.photos/seed/earbuds1/800/800",
    stock: 10,
    category: "ガジェット",
  },
  {
    name: "ポータブル充電器 10000mAh",
    slug: "portable-charger",
    description: "急速充電対応。スマホを約2回フル充電できます。",
    price: 4200,
    imageUrl: "https://picsum.photos/seed/charger1/800/800",
    stock: 22,
    category: "ガジェット",
  },
  {
    name: "ブルーライトカットメガネ",
    slug: "blue-light-glasses",
    description: "PC作業時の目の疲れを軽減。軽量フレームで長時間も快適。",
    price: 5500,
    imageUrl: "https://picsum.photos/seed/glasses1/800/800",
    stock: 16,
    category: "ガジェット",
  },
  {
    name: "ハンドクリーム セット",
    slug: "hand-cream-set",
    description: "3種の香りが楽しめるミニサイズセット。ギフトにも最適。",
    price: 2400,
    imageUrl: "https://picsum.photos/seed/cream1/800/800",
    stock: 28,
    category: "ビューティー",
  },
];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log(`Seeded ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
