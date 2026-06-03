import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from "crypto";
import { promisify } from "util";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "shop-session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const scrypt = promisify(scryptCallback);

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

function getSessionSecret() {
  return process.env.SESSION_SECRET ?? "dev-session-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || sign(body) !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}.${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(".");
  if (!salt || !key) return false;

  const stored = Buffer.from(key, "base64url");
  const derived = (await scrypt(password, salt, stored.length)) as Buffer;
  return stored.length === derived.length && timingSafeEqual(stored, derived);
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession({
    userId,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      postalCode: true,
      prefecture: true,
      city: true,
      town: true,
      addressLine: true,
    },
  });
});

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(SESSION_COOKIE)?.value);
  return session?.userId ?? null;
}
