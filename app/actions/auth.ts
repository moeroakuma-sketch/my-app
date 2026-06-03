"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  getCurrentUserId,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

const authSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください").trim().toLowerCase(),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

const registerSchema = authSchema.extend({
  name: z.string().min(1, "氏名を入力してください").trim(),
});

const profileSchema = z.object({
  name: z.string().min(1, "氏名を入力してください").trim(),
  email: z.string().email("有効なメールアドレスを入力してください").trim().toLowerCase(),
  phone: z.string().trim(),
  postalCode: z.string().trim(),
  prefecture: z.string().trim(),
  city: z.string().trim(),
  town: z.string().trim(),
  addressLine: z.string().trim(),
});

const paymentSchema = z.object({
  holderName: z.string().min(1, "カード名義を入力してください").trim(),
  cardNumber: z.string().transform((value) => value.replace(/\D/g, "")),
  expMonth: z.coerce.number().int().min(1).max(12),
  expYear: z.coerce.number().int().min(new Date().getFullYear()),
});

function getString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function safeNextPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function appendParam(path: string, name: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${name}=${encodeURIComponent(value)}`;
}

function withError(path: string, message: string): never {
  redirect(appendParam(path, "error", message));
}

function withMessage(path: string, message: string): never {
  redirect(appendParam(path, "message", message));
}

function detectCardBrand(cardNumber: string) {
  if (/^4/.test(cardNumber)) return "Visa";
  if (/^5[1-5]/.test(cardNumber) || /^2[2-7]/.test(cardNumber)) return "Mastercard";
  if (/^3[47]/.test(cardNumber)) return "American Express";
  if (/^35/.test(cardNumber)) return "JCB";
  return "カード";
}

export async function registerUser(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    withError("/register", parsed.error.issues[0]?.message ?? "入力内容を確認してください");
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    withError("/register", "このメールアドレスはすでに登録されています");
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
    },
    select: { id: true },
  });

  await createSession(user.id);
  revalidatePath("/", "layout");
  withMessage("/account", "会員登録が完了しました");
}

export async function loginUser(formData: FormData) {
  const next = safeNextPath(getString(formData, "next"));
  const parsed = authSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    withError(`/login?next=${encodeURIComponent(next)}`, "メールアドレスまたはパスワードが正しくありません");
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, passwordHash: true },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    withError(`/login?next=${encodeURIComponent(next)}`, "メールアドレスまたはパスワードが正しくありません");
  }

  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect(next);
}

export async function logoutUser() {
  await destroySession();
  revalidatePath("/", "layout");
  withMessage("/login", "ログアウトしました");
}

export async function updateProfile(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?next=/account");

  const parsed = profileSchema.safeParse({
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    postalCode: getString(formData, "postalCode"),
    prefecture: getString(formData, "prefecture"),
    city: getString(formData, "city"),
    town: getString(formData, "town"),
    addressLine: getString(formData, "addressLine"),
  });

  if (!parsed.success) {
    withError("/account", parsed.error.issues[0]?.message ?? "入力内容を確認してください");
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
    });
  } catch {
    withError("/account", "このメールアドレスはすでに使われています");
  }

  revalidatePath("/", "layout");
  withMessage("/account", "会員情報を更新しました");
}

export async function savePaymentMethod(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?next=/account");

  const parsed = paymentSchema.safeParse({
    holderName: getString(formData, "holderName"),
    cardNumber: getString(formData, "cardNumber"),
    expMonth: getString(formData, "expMonth"),
    expYear: getString(formData, "expYear"),
  });

  if (!parsed.success || parsed.data.cardNumber.length < 12) {
    withError("/account", "支払方法の入力内容を確認してください");
  }

  const now = new Date();
  const expiresAtMonthEnd = new Date(parsed.data.expYear, parsed.data.expMonth, 0);
  if (expiresAtMonthEnd < new Date(now.getFullYear(), now.getMonth(), 1)) {
    withError("/account", "有効期限が過去の日付です");
  }

  const current = await prisma.paymentMethod.findFirst({
    where: { userId },
    select: { id: true },
  });

  const data = {
    holderName: parsed.data.holderName,
    brand: detectCardBrand(parsed.data.cardNumber),
    last4: parsed.data.cardNumber.slice(-4),
    expMonth: parsed.data.expMonth,
    expYear: parsed.data.expYear,
    isDefault: true,
  };

  if (current) {
    await prisma.paymentMethod.update({ where: { id: current.id }, data });
  } else {
    await prisma.paymentMethod.create({ data: { ...data, userId } });
  }

  withMessage("/account", "支払方法を保存しました");
}

export async function deleteAccount(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?next=/account");

  const password = getString(formData, "password");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    withError("/account", "退会するには現在のパスワードを入力してください");
  }

  await prisma.user.delete({ where: { id: userId } });
  await destroySession();
  revalidatePath("/", "layout");
  withMessage("/", "退会が完了しました");
}
