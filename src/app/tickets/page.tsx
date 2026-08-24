"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Reply { id: string; body: string; createdAt: string; user: { name?: string; image?: string; role: string }; }
interface Ticket { id: string; title: string; body: string; status: string; createdAt: string; updatedAt: string; user: { name?: string; email?: string; image?: string }; replies: Reply[]; }

export default function TicketsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status]);
  useEffect(() => { if (session) fetch("/api/tickets").then(r=>r.json()).then(setTickets); }, [session]);

  const createTicket = async () => {
    if (!newTitle || !newBody) return;
    setLoading(true);
    const t = await fetch("/api/tickets", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ title: newTitle, body: newBody }) }).then(r=>r.json());
    setTickets(prev => [t, ...prev]);
    setShowNew(false); setNewTitle(""); setNewBody("");
    setSelected(t);
    setLoading(false);
  };

  const sendReply = async () => {
    if (!reply || !selected) return;
    const r = await fetch(`/api/tickets/${selected.id}/reply`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ body: reply }) }).then(r=>r.json());
    const updated = { ...selected, replies: [...selected.replies, r] };
    setSelected(updated);
    setTickets(prev => prev.map(t => t.id === selected.id ? updated : t));
    setReply("");
  };

  const changeStatus = async (status: string) => {
    if (!selected) return;
    await fetch(`/api/tickets/${selected.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ status }) });
    const updated = { ...selected, status };
    setSelected(updated);
    setTickets(prev => prev.map(t => t.id === selected.id ? updated : t));
  };

  const statusBadge = (s: string) => {
    const cls = s === "OPEN" ? "badge-open" : s === "IN_PROGRESS" ? "badge-in-progress" : "badge-closed";
    const label = s === "IN_PROGRESS" ? "In progress" : s.charAt(0) + s.slice(1).toLowerCase();
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  if (status === "loading") return null;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Support Tickets</div>
          <div className="page-subtitle">{isAdmin ? "All tickets" : "Your tickets"}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Ticket</button>
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <h2>Open a new ticket</h2>
            <div className="form-group"><label>Title</label><input type="text" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Brief description of the issue" /></div>
            <div className="form-group"><label>Message</label><textarea value={newBody} onChange={e=>setNewBody(e.target.value)} placeholder="Describe your question or issue in detail…" style={{minHeight:140}} /></div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createTicket} disabled={loading}>{loading?"Submitting…":"Submit ticket"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap:"1.5rem"}}>
        <div>
          {tickets.length === 0 ? (
            <div className="empty"><div className="empty-icon">🎟️</div><h3>No tickets yet</h3><p>Open a ticket if you need help.</p></div>
          ) : tickets.map(t => (
            <div key={t.id} className="ticket-card" onClick={() => setSelected(t)} style={{borderColor: selected?.id===t.id?"var(--accent)":""}}>
              <div className="ticket-card-main">
                <div className="ticket-title">{t.title}</div>
                <div className="ticket-preview">{t.body.slice(0,100)}{t.body.length>100?"…":""}</div>
                <div className="ticket-meta">
                  {statusBadge(t.status)}
                  <span>{t.replies.length} replies</span>
                  {isAdmin && t.user.email && <span>by {t.user.email}</span>}
                  <span>{new Date(t.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div>
            <div className="ticket-detail">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.75rem",flexWrap:"wrap",gap:"0.5rem"}}>
                <strong>{selected.title}</strong>
                {statusBadge(selected.status)}
              </div>
              <p style={{color:"var(--muted)",fontSize:"0.9rem",marginBottom:"0.5rem"}}>{selected.body}</p>
              <div style={{fontSize:"0.8rem",color:"var(--muted)"}}>Opened {new Date(selected.createdAt).toLocaleString()}</div>
              {isAdmin && (
                <div style={{display:"flex",gap:"0.5rem",marginTop:"1rem"}}>
                  <button className="btn btn-sm btn-ghost" onClick={()=>changeStatus("OPEN")}>Open</button>
                  <button className="btn btn-sm btn-gold" onClick={()=>changeStatus("IN_PROGRESS")}>In progress</button>
                  <button className="btn btn-sm btn-ghost" onClick={()=>changeStatus("CLOSED")}>Close</button>
                </div>
              )}
            </div>

            {selected.replies.map(r => (
              <div key={r.id} className="reply-box" style={{marginBottom:"0.5rem", borderLeft: r.user.role==="ADMIN"?"3px solid var(--accent)":"3px solid var(--border)"}}>
                <div className="reply-meta">
                  {r.user.image && <img src={r.user.image} className="reply-avatar" alt="" />}
                  <strong style={{color: r.user.role==="ADMIN"?"var(--accent-light)":"var(--text)"}}>{r.user.name || "User"}</strong>
                  {r.user.role==="ADMIN" && <span className="badge badge-admin">Admin</span>}
                  <span>· {new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <div style={{fontSize:"0.9rem"}}>{r.body}</div>
              </div>
            ))}

            {selected.status !== "CLOSED" && (
              <div style={{marginTop:"0.75rem"}}>
                <textarea className="search-input" style={{width:"100%",marginBottom:"0.5rem",minHeight:80}} placeholder="Write a reply…" value={reply} onChange={e=>setReply(e.target.value)} />
                <button className="btn btn-primary" onClick={sendReply} disabled={!reply}>Send reply</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
