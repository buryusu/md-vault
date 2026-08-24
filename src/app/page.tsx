import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [totalFiles, freeFiles, paidFiles] = await Promise.all([
    prisma.mdFile.count(),
    prisma.mdFile.count({ where: { isPaid: false } }),
    prisma.mdFile.count({ where: { isPaid: true } }),
  ]);

  const recent = await prisma.mdFile.findMany({
    take: 6, orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, description: true, isPaid: true, price: true, tags: true },
  });

  return (
    <>
      <div className="hero">
        <p className="hero-eyebrow">// curated knowledge base</p>
        <h1>Your Markdown docs,<br /><em>organized & gated.</em></h1>
        <p>A clean vault for technical documentation, guides, and resources. Free access for community docs, premium access for in-depth content.</p>
        <div className="hero-actions">
          <Link href="/files" className="btn btn-primary">Browse the vault →</Link>
          <Link href="/login" className="btn btn-ghost">Sign in</Link>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-value">{totalFiles}</div><div className="stat-label">Total documents</div></div>
        <div className="stat-card"><div className="stat-value">{freeFiles}</div><div className="stat-label">Free to read</div></div>
        <div className="stat-card"><div className="stat-value">{paidFiles}</div><div className="stat-label">Premium docs</div></div>
      </div>

      {recent.length > 0 && (
        <>
          <div className="section-title">Recently added</div>
          <div className="card-grid">
            {recent.map((f: typeof recent[number]) => (
              <Link key={f.id} href={`/files/${f.slug}`} className="file-card">
                <div className="file-card-title">{f.title}</div>
                {f.description && <div className="file-card-desc">{f.description}</div>}
                <div className="file-card-meta">
                  {f.isPaid ? (
                    <span className="badge badge-paid">💎 ${f.price}</span>
                  ) : (
                    <span className="badge badge-free">✓ Free</span>
                  )}
                  {f.tags && f.tags.split(",").slice(0,2).map((t: string) => (
                    <span key={t} className="badge" style={{background:"var(--surface2)",color:"var(--muted)"}}>{t.trim()}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
