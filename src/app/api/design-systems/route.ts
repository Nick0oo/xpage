import { NextResponse } from "next/server";
import { designSystems } from "@/lib/design-systems/catalog";

export function GET() {
  return NextResponse.json({ designSystems });
}
