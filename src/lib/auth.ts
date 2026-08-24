import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());
      if (user.email && adminEmails.includes(user.email)) {
        await prisma.user.update({
          where: { email: user.email },
          data: { role: "ADMIN" },
        }).catch(() => {});
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        (session.user as any).id = user.id;
        (session.user as any).role = dbUser?.role;
        (session.user as any).isPro = dbUser?.isPro;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
