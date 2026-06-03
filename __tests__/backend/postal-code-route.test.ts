import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

const postalCodeMock = vi.hoisted(() => ({
  lookupPostalCode: vi.fn(),
}));

vi.mock("@/lib/postal-code", () => ({
  lookupPostalCode: postalCodeMock.lookupPostalCode,
}));

import { GET } from "@/app/api/postal-code/route";

function request(url: string) {
  return new NextRequest(url);
}

describe("postal code API route", () => {
  beforeEach(() => {
    postalCodeMock.lookupPostalCode.mockReset();
  });

  test("returns 400 when zipcode is missing", async () => {
    const response = await GET(request("http://localhost/api/postal-code"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "zipcode parameter is required",
    });
  });

  test("returns 400 when zipcode is not seven digits", async () => {
    const response = await GET(
      request("http://localhost/api/postal-code?zipcode=123"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "zipcode must be 7 digits",
    });
  });

  test("returns 404 when the lookup has no result", async () => {
    postalCodeMock.lookupPostalCode.mockResolvedValueOnce(null);

    const response = await GET(
      request("http://localhost/api/postal-code?zipcode=123-4567"),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "住所を取得できませんでした",
    });
  });

  test("returns 502 when the lookup throws", async () => {
    postalCodeMock.lookupPostalCode.mockRejectedValueOnce(new Error("network"));

    const response = await GET(
      request("http://localhost/api/postal-code?zipcode=1234567"),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "住所を取得できませんでした",
    });
  });

  test("returns the normalized address when lookup succeeds", async () => {
    postalCodeMock.lookupPostalCode.mockResolvedValueOnce({
      prefecture: "東京都",
      city: "渋谷区",
      town: "神南",
    });

    const response = await GET(
      request("http://localhost/api/postal-code?zipcode=123-4567"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      prefecture: "東京都",
      city: "渋谷区",
      town: "神南",
    });
    expect(postalCodeMock.lookupPostalCode).toHaveBeenCalledWith("1234567");
  });
});
