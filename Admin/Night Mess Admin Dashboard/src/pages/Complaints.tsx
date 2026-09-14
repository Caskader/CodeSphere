import { useState } from "react";
import { useStore, Complaint, ComplaintStatus, Priority } from "../store";
import { Card, Badge, Button, PageHeader, Select, Input, Textarea, Modal, StatCard } from "../components/ui";
import { MessageSquareWarning, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const priorityVariant = (p: Priority) => p === "high" ? "danger" : p === "medium" ? "warning" : "muted";
const statusVariant = (s: ComplaintStatus) => s === "resolved" ? "success" : s === "in-progress" ? "info" : "danger";

export default function Complaints() {
  const { state, dispatch } = useStore();
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [resolveModal, setResolveModal] = useState<{ open: boolean; complaint: Complaint | null }>({ open: false, complaint: null });
  const [resolution, setResolution] = useState("");
  const [detailComplaint, setDetailComplaint] = useState<Complaint | null>(null);

  const categories = ["All", ...Array.from(new Set(state.complaints.map((c) => c.category)))];

  const filtered = state.complaints.filter((c) => {
    const matchSearch = c.studentName.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchPriority = priorityFilter === "all" || c.priority === priorityFilter;
    const matchCat = catFilter === "All" || c.category === catFilter;
    return matchSearch && matchStatus && matchPriority && matchCat;
  });

  const sorted = [...filtered].sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2 };
    return pOrder[a.priority] - pOrder[b.priority];
  });

  const counts = {
    open: state.complaints.filter((c) => c.status === "open").length,
    inProgress: state.complaints.filter((c) => c.status === "in-progress").length,
    resolved: state.complaints.filter((c) => c.status === "resolved").length,
    high: state.complaints.filter((c) => c.priority === "high").length,
  };

  const doResolve = () => {
    if (!resolveModal.complaint || !resolution.trim()) return;
    dispatch({ type: "RESOLVE_COMPLAINT", complaintId: resolveModal.complaint.id, resolution });
    setResolveModal({ open: false, complaint: null });
    setResolution("");
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="Complaints" subtitle="Student complaint management and resolution tracking" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Open" value={counts.open} accent={counts.open > 2 ? "red" : "yellow"} icon={<MessageSquareWarning size={16} />} />
        <StatCard label="In Progress" value={counts.inProgress} accent="cyan" icon={<Clock size={16} />} />
        <StatCard label="Resolved" value={counts.resolved} accent="green" icon={<CheckCircle size={16} />} />
        <StatCard label="High Priority" value={counts.high} accent="red" icon={<AlertTriangle size={16} />} />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-40">
            <Input placeholder="Search complaints..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-32">
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </Select>
          <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-32">
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="w-36">
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </Card>

      {/* Complaints list */}
      <div className="space-y-3">
        {sorted.length === 0 && (
          <Card>
            <div className="py-10 text-center text-sm text-[#3a4d6b]">No complaints match your filters</div>
          </Card>
        )}
        {sorted.map((complaint) => (
          <Card key={complaint.id} className={`hover:border-[#243352] transition-colors ${
            complaint.priority === "high" && complaint.status !== "resolved" ? "border-[#ff3d7130]" : ""
          }`}>
            <div className="flex items-start gap-3">
              {/* Priority indicator */}
              <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                complaint.priority === "high" ? "bg-[#ff3d71]" : complaint.priority === "medium" ? "bg-[#ffb300]" : "bg-[#3a4d6b]"
              }`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                  <div>
                    <span className="text-sm font-semibold text-[#dce6f5]">{complaint.studentName}</span>
                    <span className="text-[10px] text-[#5a7099] mono ml-2">{complaint.studentId}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <Badge variant={priorityVariant(complaint.priority)} size="xs">{complaint.priority.toUpperCase()}</Badge>
                    <Badge variant={statusVariant(complaint.status)} size="xs">{complaint.status.toUpperCase()}</Badge>
                    <Badge variant="muted" size="xs">{complaint.category}</Badge>
                  </div>
                </div>

                <p className="text-xs text-[#a0b4cc] mb-2 leading-relaxed">{complaint.description}</p>

                {complaint.resolution && (
                  <div className="p-2 rounded-lg bg-[#00e67608] border border-[#00e67620] text-[10px] text-[#00e676] mb-2">
                    <span className="font-medium">Resolution:</span> {complaint.resolution}
                  </div>
                )}

                <div className="text-[10px] mono text-[#3a4d6b]">
                  {new Date(complaint.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  {" · "}
                  {new Date(complaint.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {/* Actions */}
              {complaint.status !== "resolved" && (
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {complaint.status === "open" && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => dispatch({ type: "UPDATE_COMPLAINT_STATUS", complaintId: complaint.id, status: "in-progress" })}
                    >
                      Start
                    </Button>
                  )}
                  <Button
                    variant="success"
                    size="xs"
                    onClick={() => setResolveModal({ open: true, complaint })}
                  >
                    Resolve
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Resolve modal */}
      <Modal open={resolveModal.open} onClose={() => setResolveModal({ open: false, complaint: null })} title="Resolve Complaint">
        {resolveModal.complaint && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-[#080d1a] border border-[#1a2540]">
              <div className="text-xs font-medium text-[#dce6f5] mb-1">{resolveModal.complaint.studentName}</div>
              <div className="text-[10px] text-[#5a7099]">{resolveModal.complaint.description}</div>
            </div>
            <Textarea
              label="Resolution"
              placeholder="Describe the action taken to resolve this complaint..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button variant="success" size="sm" onClick={doResolve} disabled={!resolution.trim()} className="flex-1">
                Mark as Resolved
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setResolveModal({ open: false, complaint: null })}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
