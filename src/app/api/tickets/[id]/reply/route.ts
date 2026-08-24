import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const userId = (session.user as any).id;
  const body = await req.json();
  const reply = await prisma.ticketReply.create({
    data: { body: body.body, ticketId: id, userId },
    include: { user: { select: { name: true, image: true, role: true } } },
  });
  await prisma.ticket.update({ where: { id }, data: { updatedAt: new Date(), status: (session.user as any).role === "ADMIN" ? "IN_PROGRESS" : undefined } });
  return NextResponse.json(reply);
}
