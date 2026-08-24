"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface MdFile { id: string; title: string; slug: string; description?: string; isPaid: boolean; price?: number; tags?: string; createdAt: string; }

export default function FilesPage() {
  const [files, setFiles] = useState<MdFile[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"free"|"paid">("all");

  useEffect(() => { fetch("/api/files").then(r=>r.json()).then(setFiles); }, []);

  const filtered = files.filter(f => {
    const matchSearch = f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.description?.toLowerCase().includes(search.toLowerCase())) ||
      (f.tags?.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" || (filter === "free" && !f.isPaid) || (filter === "paid" && f.isPaid);
    return matchSearch && matchFilter;
  });

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Browse Docs</div>
          <div className="page-subtitle">{files.length} documents in the vault</div>
        </div>
      </div>

      <div className="search-row">
        <input className="search-input" placeholder="Search by title, description, or tag…" value={search} onChange={e=>setSearch(e.target.value)} />
        <button className={`filter-btn${filter==="all"?" active":""}`} onClick={()=>setFilter("all")}>All</button>
        <button className={`filter-btn${filter==="free"?" active":""}`} onClick={()=>setFilter("free")}>Free</button>
        <button className={`filter-btn${filter==="paid"?" active":""}`} onClick={()=>setFilter("paid")}>Paid</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📂</div>
          <h3>No documents found</h3>
          <p>{files.length === 0 ? "The vault is empty — check back soon." : "Try a different search or filter."}</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(f => (
            <Link key={f.id} href={`/files/${f.slug}`} className="file-card">
              <div className="file-card-title">{f.title}</div>
              {f.description && <div className="file-card-desc">{f.description}</div>}
              <div className="file-card-meta">
                {f.isPaid ? (
                  <span className="badge badge-paid">💎 ${f.price}</span>
                ) : (
                  <span className="badge badge-free">✓ Free</span>
                )}
                {f.tags && f.tags.split(",").slice(0,3).map(t => (
                  <span key={t} className="badge" style={{background:"var(--surface2)",color:"var(--muted)"}}>{t.trim()}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
