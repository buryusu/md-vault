import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const files = await prisma.mdFile.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, description: true,
      isPaid: true, price: true, tags: true, createdAt: true,
    },
  });
  return NextResponse.json(files);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const slugify = (await import("slugify")).default;
  const slug = slugify(body.title, { lower: true, strict: true });
  const file = await prisma.mdFile.create({
    data: {
      title: body.title,
      slug,
      description: body.description,
      content: body.content,
      isPaid: body.isPaid || false,
      price: body.price || null,
      tags: body.tags || null,
    },
  });
  return NextResponse.json(file);
}
