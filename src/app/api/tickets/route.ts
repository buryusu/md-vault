import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const tickets = await prisma.ticket.findMany({
    where: role === "ADMIN" ? {} : { userId },
    include: { user: { select: { name: true, email: true, image: true } }, replies: { include: { user: { select: { name: true, image: true, role: true } } } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const body = await req.json();
  const ticket = await prisma.ticket.create({
    data: { title: body.title, body: body.body, userId },
    include: { user: { select: { name: true, email: true } } },
  });
  return NextResponse.json(ticket);
}
