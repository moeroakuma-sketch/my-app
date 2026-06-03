import { NextRequest, NextResponse } from "next/server";
import { lookupPostalCode } from "@/lib/postal-code";

export async function GET(request: NextRequest) {
  const zipcode = request.nextUrl.searchParams.get("zipcode");
  if (!zipcode) {
    return NextResponse.json(
      { error: "zipcode parameter is required" },
      { status: 400 },
    );
  }

  const digits = zipcode.replace(/\D/g, "");
  if (digits.length !== 7) {
    return NextResponse.json(
      { error: "zipcode must be 7 digits" },
      { status: 400 },
    );
  }

  try {
    const result = await lookupPostalCode(digits);
    if (!result) {
      return NextResponse.json(
        { error: "住所を取得できませんでした" },
        { status: 404 },
      );
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "住所を取得できませんでした" },
      { status: 502 },
    );
  }
}
