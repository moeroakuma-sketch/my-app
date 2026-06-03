import { beforeEach, describe, expect, test, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "../test-utils/prisma";

const authMock = vi.hoisted(() => ({
  createSession: vi.fn(),
  destroySession: vi.fn(),
  getCurrentUserId: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

const navigationMock = vi.hoisted(() => ({
  redirect: vi.fn(),
}));

const revalidateMock = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  createSession: authMock.createSession,
  destroySession: authMock.destroySession,
  getCurrentUserId: authMock.getCurrentUserId,
  hashPassword: authMock.hashPassword,
  verifyPassword: authMock.verifyPassword,
}));

vi.mock("next/navigation", () => ({
  redirect: navigationMock.redirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidateMock.revalidatePath,
}));

import {
  deleteAccount,
  loginUser,
  logoutUser,
  registerUser,
  savePaymentMethod,
  updateProfile,
} from "@/app/actions/auth";

function formData(fields: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.set(key, value);
  }
  return form;
}

function redirectError(path: string) {
  return new Error(`NEXT_REDIRECT:${path}`);
}

describe("auth and account backend actions", () => {
  beforeEach(() => {
    resetPrismaMock();
    authMock.createSession.mockReset();
    authMock.destroySession.mockReset();
    authMock.getCurrentUserId.mockReset();
    authMock.hashPassword.mockReset();
    authMock.verifyPassword.mockReset();
    navigationMock.redirect.mockReset();
    revalidateMock.revalidatePath.mockReset();

    authMock.hashPassword.mockResolvedValue("hashed-password");
    authMock.verifyPassword.mockResolvedValue(true);
    navigationMock.redirect.mockImplementation((path: string) => {
      throw redirectError(path);
    });
  });

  test("register redirects with an error for invalid input", async () => {
    await expect(
      registerUser(formData({ name: "", email: "bad", password: "short" })),
    ).rejects.toThrow("NEXT_REDIRECT:/register?error=");

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  test("register redirects with an error when email is already used", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "user-existing" });

    await expect(
      registerUser(
        formData({
          name: "山田 太郎",
          email: "taro@example.com",
          password: "password123",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/register?error=");

    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(authMock.createSession).not.toHaveBeenCalled();
  });

  test("register creates a user, session, revalidation, and success redirect", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({ id: "user-1" });

    await expect(
      registerUser(
        formData({
          name: " 山田 太郎 ",
          email: "TARO@example.com",
          password: "password123",
        }),
      ),
    ).rejects.toThrow(
      `NEXT_REDIRECT:/account?message=${encodeURIComponent("会員登録が完了しました")}`,
    );

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        name: "山田 太郎",
        email: "taro@example.com",
        passwordHash: "hashed-password",
      },
      select: { id: true },
    });
    expect(authMock.createSession).toHaveBeenCalledWith("user-1");
    expect(revalidateMock.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  test("login sanitizes an unsafe next path before redirecting", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      passwordHash: "hashed-password",
    });

    await expect(
      loginUser(
        formData({
          email: "taro@example.com",
          password: "password123",
          next: "//evil.example",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/account");

    expect(authMock.verifyPassword).toHaveBeenCalledWith(
      "password123",
      "hashed-password",
    );
    expect(authMock.createSession).toHaveBeenCalledWith("user-1");
  });

  test("login redirects with an error when the user does not exist", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    await expect(
      loginUser(
        formData({
          email: "missing@example.com",
          password: "password123",
          next: "/checkout",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/login?next=%2Fcheckout&error=");

    expect(authMock.createSession).not.toHaveBeenCalled();
  });

  test("logout destroys the session and redirects to login with a message", async () => {
    await expect(logoutUser()).rejects.toThrow("NEXT_REDIRECT:/login?message=");

    expect(authMock.destroySession).toHaveBeenCalled();
    expect(revalidateMock.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  test("updateProfile redirects anonymous users to login", async () => {
    authMock.getCurrentUserId.mockResolvedValueOnce(null);

    await expect(updateProfile(new FormData())).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=/account",
    );

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  test("updateProfile reports duplicate email errors", async () => {
    authMock.getCurrentUserId.mockResolvedValueOnce("user-1");
    prismaMock.user.update.mockRejectedValueOnce(new Error("duplicate"));

    await expect(
      updateProfile(
        formData({
          name: "山田 太郎",
          email: "taro@example.com",
          phone: "09012345678",
          postalCode: "1234567",
          prefecture: "東京都",
          city: "渋谷区",
          town: "神南",
          addressLine: "1-1-1",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/account?error=");
  });

  test("savePaymentMethod updates an existing card with detected brand and last4", async () => {
    authMock.getCurrentUserId.mockResolvedValueOnce("user-1");
    prismaMock.paymentMethod.findFirst.mockResolvedValueOnce({ id: "pm-1" });
    prismaMock.paymentMethod.update.mockResolvedValueOnce({});

    await expect(
      savePaymentMethod(
        formData({
          holderName: " TARO YAMADA ",
          cardNumber: "4111 1111 1111 1234",
          expMonth: "12",
          expYear: String(new Date().getFullYear() + 1),
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/account?message=");

    expect(prismaMock.paymentMethod.update).toHaveBeenCalledWith({
      where: { id: "pm-1" },
      data: {
        holderName: "TARO YAMADA",
        brand: "Visa",
        last4: "1234",
        expMonth: 12,
        expYear: new Date().getFullYear() + 1,
        isDefault: true,
      },
    });
    expect(prismaMock.paymentMethod.create).not.toHaveBeenCalled();
  });

  test("savePaymentMethod creates a new card when no existing method is found", async () => {
    authMock.getCurrentUserId.mockResolvedValueOnce("user-1");
    prismaMock.paymentMethod.findFirst.mockResolvedValueOnce(null);
    prismaMock.paymentMethod.create.mockResolvedValueOnce({});

    await expect(
      savePaymentMethod(
        formData({
          holderName: "TARO YAMADA",
          cardNumber: "3530111333300000",
          expMonth: "1",
          expYear: String(new Date().getFullYear() + 1),
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/account?message=");

    expect(prismaMock.paymentMethod.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        holderName: "TARO YAMADA",
        brand: "JCB",
        last4: "0000",
        expMonth: 1,
        expYear: new Date().getFullYear() + 1,
        isDefault: true,
      },
    });
  });

  test("savePaymentMethod rejects expired cards", async () => {
    authMock.getCurrentUserId.mockResolvedValueOnce("user-1");

    await expect(
      savePaymentMethod(
        formData({
          holderName: "TARO YAMADA",
          cardNumber: "4111111111111111",
          expMonth: "12",
          expYear: String(new Date().getFullYear() - 1),
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/account?error=");

    expect(prismaMock.paymentMethod.findFirst).not.toHaveBeenCalled();
  });

  test("deleteAccount rejects a wrong password", async () => {
    authMock.getCurrentUserId.mockResolvedValueOnce("user-1");
    authMock.verifyPassword.mockResolvedValueOnce(false);
    prismaMock.user.findUnique.mockResolvedValueOnce({
      passwordHash: "hashed-password",
    });

    await expect(
      deleteAccount(formData({ password: "wrong-password" })),
    ).rejects.toThrow("NEXT_REDIRECT:/account?error=");

    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  test("deleteAccount deletes the user, destroys the session, and redirects home", async () => {
    authMock.getCurrentUserId.mockResolvedValueOnce("user-1");
    prismaMock.user.findUnique.mockResolvedValueOnce({
      passwordHash: "hashed-password",
    });
    prismaMock.user.delete.mockResolvedValueOnce({});

    await expect(
      deleteAccount(formData({ password: "password123" })),
    ).rejects.toThrow("NEXT_REDIRECT:/?message=");

    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(authMock.destroySession).toHaveBeenCalled();
    expect(revalidateMock.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
