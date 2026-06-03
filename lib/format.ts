export function formatPrice(yen: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(yen);
}

export function formatPostalCode(code: string): string {
  const digits = code.replace(/\D/g, "");
  if (digits.length !== 7) return code;
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

export function formatFullAddress(order: {
  prefecture: string;
  city: string;
  town: string;
  addressLine: string;
}): string {
  return `${order.prefecture}${order.city}${order.town}${order.addressLine}`;
}
