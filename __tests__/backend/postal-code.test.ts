import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { lookupPostalCode } from "@/lib/postal-code";

describe("postal code lookup", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("returns null and does not fetch when the zip is not seven digits", async () => {
    await expect(lookupPostalCode("123")).resolves.toBeNull();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("returns null when the response is not ok", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });

    await expect(lookupPostalCode("123-4567")).resolves.toBeNull();
  });

  test("returns null when zipcloud has no result", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 200, message: null, results: null }),
    });

    await expect(lookupPostalCode("1234567")).resolves.toBeNull();
  });

  test("maps a successful zipcloud response to an address result", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 200,
        message: null,
        results: [
          {
            address1: "東京都",
            address2: "渋谷区",
            address3: "神南",
          },
        ],
      }),
    });

    await expect(lookupPostalCode("123-4567")).resolves.toEqual({
      prefecture: "東京都",
      city: "渋谷区",
      town: "神南",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://zipcloud.ibsnet.co.jp/api/search?zipcode=1234567",
      { next: { revalidate: 86400 } },
    );
  });
});
