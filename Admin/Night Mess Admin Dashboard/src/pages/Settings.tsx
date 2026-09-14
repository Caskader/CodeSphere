import { useState } from "react";
import { useStore } from "../store";
import { Card, Button, Input, PageHeader, Select } from "../components/ui";
import { Settings as SettingsIcon, Bell, Database, Shield, RotateCcw, Save, Wifi, WifiOff, UserPlus } from "lucide-react";

export default function Settings() {
  const { state, dispatch, createUser } = useStore();
  const [form, setForm] = useState({ ...state.settings });
  const [saved, setSaved] = useState(false);
  const [notifMsg, setNotifMsg] = useState("");
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", student_id: "", room_number: "", hostel_block: "A-Block", branch: "B.Tech CSE", year: "2nd Year" });
  const [userMessage, setUserMessage] = useState("");
  const [userSaving, setUserSaving] = useState(false);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const setUser = (k: string, v: string) => setUserForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    dispatch({ type: "UPDATE_SETTINGS", settings: form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm("Reset all demo data? This cannot be undone.")) {
      dispatch({ type: "RESET_DEMO" });
    }
  };

  const handleSendNotification = () => {
    if (!notifMsg.trim()) return;
    dispatch({ type: "ADD_NOTIFICATION", message: notifMsg, notifType: "info" });
    setNotifMsg("");
    alert(`Notification sent: "${notifMsg}"`);
  };

  const handleCreateUser = async () => {
    setUserMessage("");
    setUserSaving(true);
    const result = await createUser(userForm);
    setUserSaving(false);
    if (!result.success) {
      setUserMessage(result.error || "Could not create user");
      return;
    }
    setUserMessage("User created successfully. They can now sign in with the email and password.");
    setUserForm({ name: "", email: "", password: "", student_id: "", room_number: "", hostel_block: "A-Block", branch: "B.Tech CSE", year: "2nd Year" });
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="Settings" subtitle="Configure mess operations and system preferences">
        <Button variant={saved ? "success" : "primary"} size="sm" onClick={handleSave}>
          <span className="flex items-center gap-1.5">
            <Save size={12} />
            {saved ? "Saved!" : "Save Changes"}
          </span>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* General */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon size={14} className="text-[#00c8ff]" />
            <div className="text-xs font-semibold text-[#dce6f5]">General Settings</div>
          </div>
          <div className="space-y-3">
            <Input
              label="Mess Name"
              value={form.messName}
              onChange={(e) => set("messName", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Max Capacity"
                type="number"
                value={form.maxCapacity}
                onChange={(e) => set("maxCapacity", Number(e.target.value))}
              />
              <Input
                label="Avg Service Time (min)"
                type="number"
                value={form.avgServiceTime}
                onChange={(e) => set("avgServiceTime", Number(e.target.value))}
              />
            </div>
            <Input
              label="Max Tokens per Student per Meal"
              type="number"
              value={form.maxTokensPerMeal}
              onChange={(e) => set("maxTokensPerMeal", Number(e.target.value))}
            />
            <div className="flex items-center justify-between py-2 border-t border-[#1a2540]">
              <div>
                <div className="text-xs text-[#a0b4cc]">Auto-close after meal hours</div>
                <div className="text-[10px] text-[#5a7099]">Automatically close mess after meal time ends</div>
              </div>
              <button
                onClick={() => set("autoCloseAfterMeal", !form.autoCloseAfterMeal)}
                className={`w-10 h-5 rounded-full transition-colors relative ${form.autoCloseAfterMeal ? "bg-[#00c8ff]" : "bg-[#1a2540]"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.autoCloseAfterMeal ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
        </Card>

        {/* Meal Times */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={14} className="text-[#00c8ff]" />
            <div className="text-xs font-semibold text-[#dce6f5]">Meal Timings</div>
          </div>
          <div className="space-y-3">
            <Input
              label="Breakfast Hours"
              value={form.breakfastTime}
              onChange={(e) => set("breakfastTime", e.target.value)}
              placeholder="07:00 - 09:30"
            />
            <Input
              label="Lunch Hours"
              value={form.lunchTime}
              onChange={(e) => set("lunchTime", e.target.value)}
              placeholder="12:30 - 14:30"
            />
            <Input
              label="Dinner Hours"
              value={form.dinnerTime}
              onChange={(e) => set("dinnerTime", e.target.value)}
              placeholder="19:00 - 22:00"
            />

            {/* Current meal selector */}
            <div className="pt-2 border-t border-[#1a2540]">
              <div className="text-[10px] mono text-[#5a7099] uppercase tracking-wider mb-2">Current Active Meal</div>
              <div className="flex gap-2">
                {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
                  <button
                    key={meal}
                    onClick={() => dispatch({ type: "SET_CURRENT_MEAL", meal })}
                    className={`flex-1 py-2 rounded-lg text-[10px] mono font-medium transition-colors capitalize ${
                      state.currentMeal === meal
                        ? "bg-[#00c8ff20] text-[#00c8ff] border border-[#00c8ff40]"
                        : "bg-[#1a2540] text-[#5a7099] hover:text-[#a0b4cc] border border-transparent"
                    }`}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Mess Status Control */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            {state.messOpen ? <Wifi size={14} className="text-[#00e676]" /> : <WifiOff size={14} className="text-[#ff3d71]" />}
            <div className="text-xs font-semibold text-[#dce6f5]">Mess Status Control</div>
          </div>
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${state.messOpen ? "border-[#00e67640] bg-[#00e67608]" : "border-[#ff3d7140] bg-[#ff3d7108]"}`}>
              <div>
                <div className={`text-sm font-bold mono ${state.messOpen ? "text-[#00e676]" : "text-[#ff3d71]"}`}>
                  {state.messOpen ? "MESS IS OPEN" : "MESS IS CLOSED"}
                </div>
                <div className="text-[10px] text-[#5a7099] mt-0.5">
                  Students {state.messOpen ? "can" : "cannot"} place orders
                </div>
              </div>
              <button
                onClick={() => dispatch({ type: "TOGGLE_MESS", open: !state.messOpen })}
                className={`ml-auto px-4 py-2 rounded-lg text-xs font-medium mono transition-colors ${
                  state.messOpen
                    ? "bg-[#ff3d71] text-white hover:bg-[#e8335f]"
                    : "bg-[#00e676] text-black hover:bg-[#00cf6b]"
                }`}
              >
                {state.messOpen ? "Close Mess" : "Open Mess"}
              </button>
            </div>

            <div className="text-[10px] mono text-[#3a4d6b] space-y-1">
              <div>• Students see the mess status in real-time</div>
              <div>• Closing stops new order placement</div>
              <div>• Existing accepted orders can still be collected</div>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={14} className="text-[#00c8ff]" />
            <div className="text-xs font-semibold text-[#dce6f5]">Notifications</div>
          </div>
          <div className="space-y-3">
            <Input
              label="Notification Email"
              type="email"
              value={form.notificationEmail}
              onChange={(e) => set("notificationEmail", e.target.value)}
              placeholder="admin@university.edu"
            />

            <div className="pt-2 border-t border-[#1a2540]">
              <div className="text-[10px] mono text-[#5a7099] uppercase tracking-wider mb-2">Send Push Notification</div>
              <div className="flex gap-2">
                <input
                  value={notifMsg}
                  onChange={(e) => setNotifMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendNotification()}
                  placeholder="Message to all students..."
                  className="flex-1 bg-[#080d1a] border border-[#1a2540] rounded-lg px-3 py-2 text-xs text-[#dce6f5] placeholder-[#3a4d6b] focus:outline-none focus:border-[#00c8ff40] transition-colors"
                />
                <Button variant="primary" size="sm" onClick={handleSendNotification} disabled={!notifMsg.trim()}>
                  Send
                </Button>
              </div>
            </div>

            {state.notifications.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                <div className="text-[10px] mono text-[#3a4d6b] uppercase tracking-wider">Recent Notifications</div>
                {state.notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="p-2 rounded-lg bg-[#080d1a] border border-[#1a2540] text-[10px] text-[#a0b4cc]">
                    <span className="text-[#5a7099] mono">{new Date(n.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                    {" — "}
                    {n.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* User management */}
      <Card className="border-[#00c8ff30]">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={14} className="text-[#00c8ff]" />
          <div><div className="text-xs font-semibold text-[#dce6f5]">Add Student User</div><div className="text-[10px] text-[#5a7099]">Creates a Firebase login and matching Realtime Database profile.</div></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Full Name" value={userForm.name} onChange={(e) => setUser("name", e.target.value)} placeholder="Student name" />
          <Input label="Email" type="email" value={userForm.email} onChange={(e) => setUser("email", e.target.value)} placeholder="student@university.edu" />
          <Input label="Temporary Password" type="password" value={userForm.password} onChange={(e) => setUser("password", e.target.value)} placeholder="At least 6 characters" />
          <Input label="Student ID" value={userForm.student_id} onChange={(e) => setUser("student_id", e.target.value)} placeholder="24BCE1234" />
          <Input label="Room Number" value={userForm.room_number} onChange={(e) => setUser("room_number", e.target.value)} placeholder="A-Block, Room 214" />
          <Input label="Hostel Block" value={userForm.hostel_block} onChange={(e) => setUser("hostel_block", e.target.value)} />
          <Input label="Branch" value={userForm.branch} onChange={(e) => setUser("branch", e.target.value)} />
          <Input label="Year" value={userForm.year} onChange={(e) => setUser("year", e.target.value)} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={() => { void handleCreateUser(); }} disabled={userSaving || !userForm.name.trim() || !userForm.email.trim() || userForm.password.length < 6}>
            <span className="flex items-center gap-1.5"><UserPlus size={12} /> {userSaving ? "Creating..." : "Create User"}</span>
          </Button>
          {userMessage && <span className={`text-[10px] ${userMessage.startsWith("User created") ? "text-[#00e676]" : "text-[#ff3d71]"}`}>{userMessage}</span>}
        </div>
      </Card>

      {/* Data Management */}
      <Card className="border-[#ff3d7130]">
        <div className="flex items-center gap-2 mb-4">
          <Database size={14} className="text-[#ff3d71]" />
          <div className="text-xs font-semibold text-[#dce6f5]">Data Management</div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[#a0b4cc]">Reset Demo Data</div>
            <div className="text-[10px] text-[#5a7099]">
              Restores all orders, food items, complaints, and queue to initial demo state.
              Useful for hackathon demonstrations.
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={handleReset}>
            <span className="flex items-center gap-1.5"><RotateCcw size={12} /> Reset Demo</span>
          </Button>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#1a2540]">
          {[
            ["Orders", state.orders.length],
            ["Food Items", state.foodItems.length],
            ["Complaints", state.complaints.length],
            ["Announcements", state.announcements.length],
          ].map(([label, value]) => (
            <div key={label} className="text-center p-2.5 rounded-lg bg-[#080d1a] border border-[#1a2540]">
              <div className="text-lg font-bold mono text-[#00c8ff]">{value}</div>
              <div className="text-[10px] text-[#5a7099] mono">{label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
