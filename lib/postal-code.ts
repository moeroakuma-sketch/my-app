export type PostalCodeResult = {
  prefecture: string;
  city: string;
  town: string;
};

type ZipcloudResponse = {
  status: number;
  message: string | null;
  results: Array<{
    address1: string;
    address2: string;
    address3: string;
  }> | null;
};

export async function lookupPostalCode(
  zip: string,
): Promise<PostalCodeResult | null> {
  const digits = zip.replace(/\D/g, "");
  if (digits.length !== 7) return null;

  const url = `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const data = (await res.json()) as ZipcloudResponse;
  if (data.status !== 200 || !data.results?.[0]) return null;

  const { address1, address2, address3 } = data.results[0];
  return {
    prefecture: address1,
    city: address2,
    town: address3 ?? "",
  };
}
