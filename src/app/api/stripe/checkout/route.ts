import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const body = await req.json();
  const file = await prisma.mdFile.findUnique({ where: { id: body.fileId } });
  if (!file || !file.isPaid) return NextResponse.json({ error: "Invalid file" }, { status: 400 });

  const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL;
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: file.title, description: file.description || undefined },
        unit_amount: Math.round((file.price || 0) * 100),
      },
      quantity: 1,
    }],
    metadata: { userId, fileId: file.id },
    success_url: `${origin}/files/${file.slug}?success=1`,
    cancel_url: `${origin}/files/${file.slug}`,
  });
  return NextResponse.json({ url: checkoutSession.url });
}
