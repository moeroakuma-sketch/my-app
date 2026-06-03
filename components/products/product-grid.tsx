import { ProductCard } from "@/components/products/product-card";

type Product = {
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
};

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
        <p className="text-lg font-medium text-zinc-700">商品がありません</p>
        <p className="mt-2 text-sm text-zinc-500">
          しばらくしてから再度お試しください。
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
