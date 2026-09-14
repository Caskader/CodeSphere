import { useState } from "react";
import { useStore, Announcement } from "../store";
import { Card, Badge, Button, PageHeader, Input, Select, Textarea, Modal } from "../components/ui";
import { Megaphone, Plus, Edit2, Trash2, Pin, Send, Eye, EyeOff } from "lucide-react";

const CATEGORIES = ["Menu", "Operations", "Payments", "Holiday", "General", "Maintenance"];

function AnnouncementForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Announcement>;
  onSave: (data: Omit<Announcement, "id" | "timestamp">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    content: initial?.content || "",
    category: initial?.category || "General",
    published: initial?.published ?? false,
    pinned: initial?.pinned ?? false,
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    onSave(form);
  };
  return (
    <div className="space-y-3">
      <Input label="Title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Announcement title..." />
      <Textarea label="Content" value={form.content} onChange={(e) => set("content", e.target.value)} placeholder="Announcement content..." rows={4} />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Category" value={form.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] mono text-[#5a7099] uppercase tracking-wider">Options</label>
          <div className="flex gap-3 mt-1.5">
            <label className="flex items-center gap-1.5 text-xs text-[#5a7099] cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)}
                className="accent-[#00c8ff]" />
              Publish now
            </label>
            <label className="flex items-center gap-1.5 text-xs text-[#5a7099] cursor-pointer">
              <input type="checkbox" checked={form.pinned} onChange={(e) => set("pinned", e.target.checked)}
                className="accent-[#00c8ff]" />
              Pin
            </label>
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="primary" size="sm" onClick={handleSave} className="flex-1">
          <span className="flex items-center gap-1.5"><Send size={11} /> {form.published ? "Publish" : "Save Draft"}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function Announcements() {
  const { state, saveAnnouncement, setAnnouncementPublished, deleteAnnouncement } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editAnn, setEditAnn] = useState<Announcement | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [pubFilter, setPubFilter] = useState("all");

  const filtered = state.announcements.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || a.category === catFilter;
    const matchPub = pubFilter === "all" || (pubFilter === "published" ? a.published : !a.published);
    return matchSearch && matchCat && matchPub;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const handleSaveNew = async (data: Omit<Announcement, "id" | "timestamp">) => {
    if (await saveAnnouncement(data)) setShowForm(false);
  };

  const handleSaveEdit = async (data: Omit<Announcement, "id" | "timestamp">) => {
    if (!editAnn) return;
    if (await saveAnnouncement(data, editAnn.id)) setEditAnn(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this announcement?")) await deleteAnnouncement(id);
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="Announcements" subtitle="Publish and manage mess announcements for students">
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <span className="flex items-center gap-1.5"><Plus size={12} /> New Announcement</span>
        </Button>
      </PageHeader>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Published", value: state.announcements.filter((a) => a.published).length, color: "text-[#00e676]" },
          { label: "Drafts", value: state.announcements.filter((a) => !a.published).length, color: "text-[#ffb300]" },
          { label: "Pinned", value: state.announcements.filter((a) => a.pinned).length, color: "text-[#00c8ff]" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="text-center py-3">
            <div className={`text-2xl font-bold mono ${color}`}>{value}</div>
            <div className="text-[10px] text-[#5a7099] mono uppercase tracking-wider mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {/* New announcement form */}
      {showForm && (
        <Card className="border-[#00c8ff30]">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone size={14} className="text-[#00c8ff]" />
            <div className="text-xs font-semibold text-[#dce6f5]">New Announcement</div>
          </div>
          <AnnouncementForm onSave={handleSaveNew} onCancel={() => setShowForm(false)} />
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-40">
            <Input placeholder="Search announcements..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="w-32">
            {["All", ...CATEGORIES].map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={pubFilter} onChange={(e) => setPubFilter(e.target.value)} className="w-32">
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </Select>
        </div>
      </Card>

      {/* Announcements list */}
      <div className="space-y-3">
        {sorted.length === 0 && (
          <Card>
            <div className="py-10 text-center text-sm text-[#3a4d6b]">No announcements found</div>
          </Card>
        )}
        {sorted.map((ann) => (
          <Card key={ann.id} className={`transition-colors hover:border-[#243352] ${ann.pinned ? "border-[#00c8ff30]" : ""}`}>
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${ann.published ? "bg-[#00e67615]" : "bg-[#1a2540]"}`}>
                <Megaphone size={16} className={ann.published ? "text-[#00e676]" : "text-[#5a7099]"} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-[#dce6f5] truncate">{ann.title}</h3>
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    {ann.pinned && <Pin size={11} className="text-[#00c8ff]" />}
                    <Badge variant={ann.published ? "success" : "muted"} size="xs">
                      {ann.published ? "PUBLISHED" : "DRAFT"}
                    </Badge>
                    <Badge variant="muted" size="xs">{ann.category}</Badge>
                  </div>
                </div>
                <p className="text-xs text-[#5a7099] line-clamp-2 mb-2">{ann.content}</p>
                <div className="text-[10px] mono text-[#3a4d6b]">
                  {new Date(ann.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {" · "}
                  {new Date(ann.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => { void setAnnouncementPublished(ann.id, !ann.published); }}
                  className={`p-1.5 rounded-md transition-colors ${ann.published ? "text-[#ffb300] hover:bg-[#ffb30015]" : "text-[#00e676] hover:bg-[#00e67615]"}`}
                  title={ann.published ? "Unpublish" : "Publish"}
                >
                  {ann.published ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button
                  onClick={() => setEditAnn(ann)}
                  className="p-1.5 rounded-md text-[#5a7099] hover:text-[#a0b4cc] hover:bg-[#1a2540] transition-colors"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(ann.id)}
                  className="p-1.5 rounded-md text-[#3a4d6b] hover:text-[#ff3d71] hover:bg-[#ff3d7110] transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit modal */}
      <Modal open={!!editAnn} onClose={() => setEditAnn(null)} title="Edit Announcement" width="max-w-lg">
        {editAnn && (
          <AnnouncementForm
            initial={editAnn}
            onSave={handleSaveEdit}
            onCancel={() => setEditAnn(null)}
          />
        )}
      </Modal>
    </div>
  );
}
