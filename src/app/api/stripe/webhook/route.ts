import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { userId, fileId } = session.metadata;
    await prisma.purchase.upsert({
      where: { userId_fileId: { userId, fileId } },
      create: { userId, fileId, stripePaymentId: session.payment_intent },
      update: {},
    });
  }
  return NextResponse.json({ ok: true });
}
