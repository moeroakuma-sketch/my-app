import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const paymentMethod = user
    ? await prisma.paymentMethod.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: {
          brand: true,
          last4: true,
          expMonth: true,
          expYear: true,
        },
      })
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-zinc-900">お届け先・お支払い</h1>
      <p className="mt-2 text-sm text-zinc-600">
        {user
          ? "会員情報を入力済みの状態にしています。必要に応じて変更してください。"
          : "配送先情報を入力して注文を確定してください。"}
      </p>
      <div className="mt-8">
        <CheckoutForm
          initialCustomer={
            user
              ? {
                  customerName: user.name,
                  email: user.email,
                  postalCode: user.postalCode,
                  prefecture: user.prefecture,
                  city: user.city,
                  town: user.town,
                  addressLine: user.addressLine,
                  phone: user.phone,
                }
              : undefined
          }
          initialPaymentMethod={paymentMethod}
        />
      </div>
    </div>
  );
}
