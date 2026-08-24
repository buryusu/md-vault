import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const file = await prisma.mdFile.findUnique({ where: { slug } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (file.isPaid) {
    if (!session) return NextResponse.json({ error: "Login required", isPaid: true }, { status: 401 });
    const userId = (session.user as any).id;
    const role = (session.user as any).role;
    if (role !== "ADMIN") {
      const purchase = await prisma.purchase.findUnique({ where: { userId_fileId: { userId, fileId: file.id } } });
      if (!purchase) return NextResponse.json({ error: "Purchase required", isPaid: true, title: file.title, description: file.description, price: file.price }, { status: 402 });
    }
  }
  return NextResponse.json(file);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const file = await prisma.mdFile.update({ where: { slug }, data: body });
  return NextResponse.json(file);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.mdFile.delete({ where: { slug } });
  return NextResponse.json({ ok: true });
}
