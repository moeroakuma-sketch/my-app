"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createOrder } from "@/app/actions/order";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/format";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

export type CheckoutInitialCustomer = {
  customerName: string;
  email: string;
  postalCode: string;
  prefecture: string;
  city: string;
  town: string;
  addressLine: string;
  phone: string;
};

type CheckoutFormProps = {
  initialCustomer?: Partial<CheckoutInitialCustomer>;
  initialPaymentMethod?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
};

export function CheckoutForm({
  initialCustomer,
  initialPaymentMethod,
}: CheckoutFormProps) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState(false);

  const [customerName, setCustomerName] = useState(initialCustomer?.customerName ?? "");
  const [email, setEmail] = useState(initialCustomer?.email ?? "");
  const [postalCode, setPostalCode] = useState(initialCustomer?.postalCode ?? "");
  const [prefecture, setPrefecture] = useState(initialCustomer?.prefecture ?? "");
  const [city, setCity] = useState(initialCustomer?.city ?? "");
  const [town, setTown] = useState(initialCustomer?.town ?? "");
  const [addressLine, setAddressLine] = useState(initialCustomer?.addressLine ?? "");
  const [phone, setPhone] = useState(initialCustomer?.phone ?? "");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetAddressFields = useCallback(() => {
    setPrefecture("");
    setCity("");
    setTown("");
    setLookupError(null);
    setManualAddress(false);
  }, []);

  const lookupAddress = useCallback(
    async (zip: string) => {
      const digits = zip.replace(/\D/g, "");
      if (digits.length !== 7) {
        resetAddressFields();
        return;
      }

      setLookupLoading(true);
      setLookupError(null);

      try {
        const res = await fetch(`/api/postal-code?zipcode=${digits}`);
        if (!res.ok) {
          setLookupError("住所を取得できませんでした");
          setPrefecture("");
          setCity("");
          setTown("");
          return;
        }
        const data = (await res.json()) as {
          prefecture: string;
          city: string;
          town: string;
        };
        setPrefecture(data.prefecture);
        setCity(data.city);
        setTown(data.town ?? "");
        setManualAddress(false);
      } catch {
        setLookupError("住所を取得できませんでした");
      } finally {
        setLookupLoading(false);
      }
    },
    [resetAddressFields],
  );

  const scheduleLookup = useCallback(
    (zip: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => lookupAddress(zip), 300);
    },
    [lookupAddress],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const addressReadOnly = !manualAddress && !!prefecture && !!city;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await createOrder({
      customerName,
      email,
      postalCode,
      prefecture,
      city,
      town,
      addressLine,
      phone,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    clearCart();
    router.push(`/order/complete?id=${result.orderId}`);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
        <p className="font-medium text-zinc-700">カートが空です</p>
        <Link href="/products" className="mt-4 inline-block text-sm text-zinc-900 underline">
          商品一覧へ
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-zinc-900">お客様情報</legend>
        <label className="block text-sm">
          <span className="text-zinc-700">氏名</span>
          <input
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-700">メールアドレス</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-zinc-900">配送先</legend>
        <label className="block text-sm">
          <span className="text-zinc-700">郵便番号</span>
          <div className="relative">
            <input
              required
              value={postalCode}
              placeholder="123-4567"
              onChange={(e) => {
                setPostalCode(e.target.value);
                const digits = e.target.value.replace(/\D/g, "");
                if (digits.length < 7) resetAddressFields();
              }}
              onBlur={() => scheduleLookup(postalCode)}
              className={inputClass}
            />
            {lookupLoading && (
              <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-zinc-400" />
            )}
          </div>
          {lookupError && (
            <p className="mt-1 text-sm text-amber-700">
              {lookupError}{" "}
              <button
                type="button"
                className="underline"
                onClick={() => setManualAddress(true)}
              >
                住所を手入力する
              </button>
            </p>
          )}
        </label>

        <label className="block text-sm">
          <span className="text-zinc-700">都道府県</span>
          <input
            required
            value={prefecture}
            readOnly={addressReadOnly}
            onChange={(e) => setPrefecture(e.target.value)}
            className={`${inputClass} ${addressReadOnly ? "bg-zinc-100" : ""}`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-700">市区町村</span>
          <input
            required
            value={city}
            readOnly={addressReadOnly}
            onChange={(e) => setCity(e.target.value)}
            className={`${inputClass} ${addressReadOnly ? "bg-zinc-100" : ""}`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-700">町域</span>
          <input
            value={town}
            readOnly={addressReadOnly && !manualAddress}
            onChange={(e) => setTown(e.target.value)}
            className={`${inputClass} ${addressReadOnly && !manualAddress ? "bg-zinc-100" : ""}`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-700">番地・建物名</span>
          <input
            required
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-700">電話番号</span>
          <input
            required
            value={phone}
            placeholder="090-1234-5678"
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </label>
      </fieldset>

      <fieldset className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <legend className="text-sm font-medium text-zinc-700">お支払い方法</legend>
        {initialPaymentMethod ? (
          <p className="mt-2 text-sm text-zinc-700">
            登録済み: {initialPaymentMethod.brand} 下4桁 {initialPaymentMethod.last4} /{" "}
            {String(initialPaymentMethod.expMonth).padStart(2, "0")}/
            {initialPaymentMethod.expYear}
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">
            登録済みの支払方法はありません。デモ注文のため実際には課金されません。
          </p>
        )}
        <p className="mt-4 text-lg font-bold text-zinc-900">
          合計 {formatPrice(subtotal)}
        </p>
      </fieldset>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {submitting ? "注文処理中..." : "注文を確定する"}
      </button>
    </form>
  );
}
