"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

interface FileData { id: string; title: string; slug: string; description?: string; content?: string; isPaid: boolean; price?: number; tags?: string; createdAt: string; }

export default function FilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [file, setFile] = useState<FileData | null>(null);
  const [error, setError] = useState<{code: number; msg: string; isPaid?: boolean; title?: string; desc?: string; price?: number} | null>(null);
  const [buying, setBuying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/files/${params.slug}`)
      .then(async r => {
        const data = await r.json();
        if (!r.ok) setError({ code: r.status, msg: data.error, isPaid: data.isPaid, title: data.title, desc: data.description, price: data.price });
        else setFile(data);
      })
      .finally(() => setLoading(false));
  }, [params.slug, session]);

  const handleBuy = async () => {
    if (!session) { router.push("/login"); return; }
    setBuying(true);
    const r = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: file?.id || error?.title }),
    });
    const data = await r.json();
    if (data.url) window.location.href = data.url;
    setBuying(false);
  };

  if (loading) return <div style={{textAlign:"center",padding:"4rem",color:"var(--muted)"}}>Loading…</div>;

  if (error) {
    if (error.code === 402) return (
      <div className="paywall">
        <div className="paywall-icon">🔒</div>
        <h2>{error.title || "Premium Document"}</h2>
        {error.desc && <p>{error.desc}</p>}
        <div className="paywall-price">${error.price}</div>
        <button className="btn btn-gold" style={{width:"100%",justifyContent:"center"}} onClick={handleBuy} disabled={buying}>
          {buying ? "Redirecting…" : "Unlock this document"}
        </button>
        {!session && <p style={{marginTop:"1rem",fontSize:"0.85rem",color:"var(--muted)"}}>You need to <Link href="/login" style={{color:"var(--accent-light)"}}>sign in</Link> first.</p>}
      </div>
    );
    if (error.code === 401) return (
      <div className="paywall">
        <div className="paywall-icon">🔑</div>
        <h2>Sign in required</h2>
        <p>This document requires an account.</p>
        <Link href="/login" className="btn btn-primary" style={{justifyContent:"center",display:"flex"}}>Sign in to continue</Link>
      </div>
    );
    return <div className="empty"><div className="empty-icon">😕</div><h3>Not found</h3></div>;
  }

  if (!file) return null;

  return (
    <div className="md-reader">
      <Link href="/files" style={{color:"var(--muted)",textDecoration:"none",fontSize:"0.85rem",display:"inline-flex",alignItems:"center",gap:"0.3rem",marginBottom:"1.5rem"}}>← Back to vault</Link>
      <h1>{file.title}</h1>
      <div className="md-meta">
        {file.isPaid ? <span className="badge badge-paid">💎 Premium</span> : <span className="badge badge-free">✓ Free</span>}
        {file.tags && file.tags.split(",").map(t => (
          <span key={t} className="badge" style={{background:"var(--surface2)",color:"var(--muted)"}}>{t.trim()}</span>
        ))}
        <span>{new Date(file.createdAt).toLocaleDateString("en-US", {year:"numeric",month:"long",day:"numeric"})}</span>
      </div>
      <div className="md-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{file.content || ""}</ReactMarkdown>
      </div>
    </div>
  );
}
