"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface MdFile { id: string; title: string; slug: string; description?: string; isPaid: boolean; price?: number; tags?: string; content?: string; createdAt: string; }
interface User { id: string; name?: string; email?: string; image?: string; role: string; isPro: boolean; createdAt: string; }

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"files"|"users">("files");
  const [files, setFiles] = useState<MdFile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editFile, setEditFile] = useState<Partial<MdFile> | null>(null);
  const [toast, setToast] = useState<{msg:string;type:string}|null>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && (session.user as any).role !== "ADMIN") router.push("/");
    if (status === "unauthenticated") router.push("/login");
  }, [status, session]);

  useEffect(() => {
    fetch("/api/files").then(r=>r.json()).then(setFiles);
    fetch("/api/admin/users").then(r=>r.json()).then(setUsers);
  }, []);

  const showToast = (msg: string, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveFile = async () => {
    if (!editFile?.title || !editFile?.content) return;
    setUploading(true);
    try {
      if (editFile.id) {
        const r = await fetch(`/api/files/${editFile.slug}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify(editFile) });
        const data = await r.json();
        setFiles(prev => prev.map(f => f.id === data.id ? data : f));
        showToast("File updated");
      } else {
        const r = await fetch("/api/files", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(editFile) });
        const data = await r.json();
        setFiles(prev => [data, ...prev]);
        showToast("File created");
      }
      setShowModal(false); setEditFile(null);
    } catch { showToast("Something went wrong", "error"); }
    setUploading(false);
  };

  const deleteFile = async (slug: string) => {
    if (!confirm("Delete this file?")) return;
    await fetch(`/api/files/${slug}`, { method:"DELETE" });
    setFiles(prev => prev.filter(f => f.slug !== slug));
    showToast("File deleted");
  };

  const toggleAdmin = async (user: User) => {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    await fetch(`/api/admin/users/${user.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ role: newRole }) });
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    showToast(`${user.name || user.email} is now ${newRole}`);
  };

  const handleMdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      const title = file.name.replace(/\.md$/, "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      setEditFile({ title, content });
      setShowModal(true);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith(".md")) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      const title = file.name.replace(/\.md$/, "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      setEditFile({ title, content });
      setShowModal(true);
    };
    reader.readAsText(file);
  };

  if (status === "loading") return null;

  return (
    <>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="page-header">
        <div className="page-title">Admin Panel</div>
        <div style={{display:"flex",gap:"0.5rem"}}>
          <label className="btn btn-ghost" style={{cursor:"pointer"}}>
            📤 Upload .md
            <input type="file" accept=".md" onChange={handleMdUpload} style={{display:"none"}} />
          </label>
          <button className="btn btn-primary" onClick={() => { setEditFile({}); setShowModal(true); }}>+ New file</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab==="files"?" active":""}`} onClick={()=>setTab("files")}>Files ({files.length})</button>
        <button className={`tab${tab==="users"?" active":""}`} onClick={()=>setTab("users")}>Users ({users.length})</button>
      </div>

      {tab === "files" && (
        <>
          <div className={`upload-area${drag?" drag":""}`} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={handleDrop} style={{marginBottom:"1.5rem"}}>
            <div style={{fontSize:"1.5rem",marginBottom:"0.5rem"}}>📁</div>
            <div>Drag & drop a <strong>.md file</strong> here to upload</div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table className="admin-table">
              <thead><tr><th>Title</th><th>Type</th><th>Tags</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {files.map(f => (
                  <tr key={f.id}>
                    <td><strong>{f.title}</strong>{f.description && <div style={{fontSize:"0.8rem",color:"var(--muted)"}}>{f.description.slice(0,60)}</div>}</td>
                    <td>{f.isPaid ? <span className="badge badge-paid">💎 ${f.price}</span> : <span className="badge badge-free">Free</span>}</td>
                    <td style={{fontSize:"0.8rem",color:"var(--muted)"}}>{f.tags || "—"}</td>
                    <td style={{fontSize:"0.8rem",color:"var(--muted)"}}>{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{display:"flex",gap:"0.4rem"}}>
                        <button className="btn btn-sm btn-ghost" onClick={() => { setEditFile(f); setShowModal(true); }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteFile(f.slug)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "users" && (
        <div style={{overflowX:"auto"}}>
          <table className="admin-table">
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><div className="user-row">{u.image && <img src={u.image} className="user-avatar" alt="" />}<span>{u.name || "—"}</span></div></td>
                  <td style={{fontSize:"0.85rem"}}>{u.email}</td>
                  <td>{u.role === "ADMIN" ? <span className="badge badge-admin">Admin</span> : <span className="badge" style={{background:"var(--surface2)",color:"var(--muted)"}}>User</span>}</td>
                  <td style={{fontSize:"0.8rem",color:"var(--muted)"}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className={`btn btn-sm ${u.role==="ADMIN"?"btn-danger":"btn-ghost"}`} onClick={() => toggleAdmin(u)}>
                      {u.role === "ADMIN" ? "Remove admin" : "Make admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && (setShowModal(false),setEditFile(null))}>
          <div className="modal">
            <h2>{editFile?.id ? "Edit file" : "Add file"}</h2>
            <div className="form-group"><label>Title *</label><input type="text" value={editFile?.title||""} onChange={e=>setEditFile(p=>({...p,title:e.target.value}))} placeholder="Getting Started Guide" /></div>
            <div className="form-group"><label>Description</label><input type="text" value={editFile?.description||""} onChange={e=>setEditFile(p=>({...p,description:e.target.value}))} placeholder="Short summary" /></div>
            <div className="form-group"><label>Tags (comma-separated)</label><input type="text" value={editFile?.tags||""} onChange={e=>setEditFile(p=>({...p,tags:e.target.value}))} placeholder="guide, beginner, api" /></div>
            <div className="form-group">
              <div className="toggle-row"><input type="checkbox" checked={editFile?.isPaid||false} onChange={e=>setEditFile(p=>({...p,isPaid:e.target.checked}))} /><label>Premium / paid content</label></div>
            </div>
            {editFile?.isPaid && <div className="form-group"><label>Price (USD) *</label><input type="number" value={editFile?.price||""} onChange={e=>setEditFile(p=>({...p,price:parseFloat(e.target.value)}))} placeholder="9.99" /></div>}
            <div className="form-group"><label>Markdown content *</label><textarea value={editFile?.content||""} onChange={e=>setEditFile(p=>({...p,content:e.target.value}))} placeholder="# My Document&#10;&#10;Write your markdown here…" style={{minHeight:200,fontFamily:"var(--font-mono)",fontSize:"0.85rem"}} /></div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => { setShowModal(false); setEditFile(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={saveFile} disabled={uploading}>{uploading?"Saving…":"Save file"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
