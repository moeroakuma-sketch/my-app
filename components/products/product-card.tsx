import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";

type ProductCardProps = {
  product: {
    slug: string;
    name: string;
    price: number;
    imageUrl: string;
    category: string;
    stock: number;
  };
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-100">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.stock === 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white">
            売り切れ
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs text-zinc-500">{product.category}</span>
        <h3 className="line-clamp-2 font-medium text-zinc-900">{product.name}</h3>
        <p className="mt-auto text-lg font-semibold text-zinc-900">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
