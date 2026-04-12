import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookMarked, Plus, Upload, Users, BarChart3,
  BrainCircuit, User, LogOut, Menu, X, Bell, Search, ChevronRight,
  CheckCircle2, TrendingUp, Star, Settings, ArrowUpRight, Sparkles,
  Target, Activity, Clock, Trash2, X as XIcon,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";

/* ── Types ── */
interface Course {
  _id: string; title: string; description: string; averageRating: number;
  status?: string; isPublished?: boolean; thumbnail?: string;
}
interface StudentEnrollment {
  _id: string; student: { _id: string; name: string; email: string };
  progress: number; enrolledAt: string;
}
interface CourseAnalytics {
  totalEnrollments: number; completed: number; inProgress: number; notStarted: number;
  avgProgress: number; completionRate: number; totalReviews: number; avgRating: number;
}
interface Review { _id: string; student?: { name: string }; rating: number; comment: string; createdAt: string; }
interface QuizQuestion { question: string; options: string[]; correctAnswer: string; explanation?: string; }
interface OverviewAnalytics { chartData: { month: string; enrollments: number }[]; totalStudents: number; totalReviews: number; }

const CLOUDINARY_CLOUD = "dg8or6094";
const CLOUDINARY_PRESET = "elearning_unsigned";
const CARD_GRADIENTS = ["from-teal-500 to-cyan-600","from-indigo-500 to-purple-600","from-amber-500 to-orange-500","from-emerald-500 to-teal-600","from-rose-500 to-pink-600","from-blue-500 to-indigo-600"];

const NAV_ITEMS = [
  { id: "overview",          label: "Overview",       icon: LayoutDashboard },
  { id: "my-courses",        label: "My Courses",     icon: BookMarked },
  { id: "create-course",     label: "Create Course",  icon: Plus },
  { id: "upload-content",    label: "Upload Content", icon: Upload },
  { id: "teacher-students",  label: "Students",       icon: Users },
  { id: "teacher-analytics", label: "Analytics",      icon: BarChart3 },
  { id: "ai-quiz",           label: "AI Quiz",        icon: BrainCircuit },
  { id: "profile",           label: "Profile",        icon: User },
];

/* ── Shared helpers ── */
function StatusBadge({ course }: { course: Course }) {
  if (course.isPublished) return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20"><span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse" />Live</span>;
  if (course.status === "approved") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Approved</span>;
  if (course.status === "pending")  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">Pending</span>;
  if (course.status === "rejected") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">Rejected</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Draft</span>;
}

function SkeletonCard() { return <div className="bg-white rounded-2xl border border-cream-dark animate-pulse h-52" />; }

function EmptyState({ icon: Icon, title, desc, action, onAction }: { icon: React.ElementType; title: string; desc: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal/10 flex items-center justify-center mb-4"><Icon size={28} className="text-teal/50" /></div>
      <h3 className="text-base font-semibold text-slate-700 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-4">{desc}</p>
      {action && onAction && <button onClick={onAction} className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition"><Plus size={15} /> {action}</button>}
    </div>
  );
}

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircle2 size={16} /> : <XIcon size={16} />}
      {msg}
    </motion.div>
  );
}

/* ── Main Shell ── */
export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  useEffect(() => {
    const h = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const loadMyCourses = async () => {
    setLoading(true);
    try { const d = await api.get<Course[]>("/courses/my-courses"); setMyCourses(Array.isArray(d) ? d : []); }
    catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => {
    if (["overview","my-courses","upload-content","teacher-students","teacher-analytics","ai-quiz"].includes(tab)) loadMyCourses();
  }, [tab]);

  const switchTab = (id: string) => { setTab(id); setSidebarOpen(false); };
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

  const drafts   = myCourses.filter(c => c.status === "draft");
  const pending  = myCourses.filter(c => c.status === "pending");
  const approved = myCourses.filter(c => c.status === "approved" && !c.isPublished);

  const notifications = [
    ...(drafts.length   > 0 ? [{ text: `${drafts.length} draft course${drafts.length > 1 ? "s" : ""}`,     sub: "Upload content & submit",    tab: "my-courses", color: "bg-slate-100 text-slate-600" }] : []),
    ...(pending.length  > 0 ? [{ text: `${pending.length} pending review`,                                  sub: "Waiting for admin approval", tab: "my-courses", color: "bg-amber-50 text-amber-600" }]   : []),
    ...(approved.length > 0 ? [{ text: `${approved.length} approved — ready to publish!`,                   sub: "Go to My Courses",           tab: "my-courses", color: "bg-emerald-50 text-emerald-600" }]: []),
    { text: "Generate AI quiz", sub: "Create quiz for your students", tab: "ai-quiz", color: "bg-indigo-50 text-indigo-600" },
  ];

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-teal flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
        <div className="h-16 flex items-center gap-3 px-5 shrink-0 border-b border-white/10">
          <Logo size="sm" theme="dark" />
          <p className="text-white/50 text-[10px] font-medium ml-auto hidden">Teacher Studio</p>
          <button className="lg:hidden text-white/50 hover:text-white transition ml-auto" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mb-2">Main Menu</p>
          {NAV_ITEMS.filter(i => i.id !== "profile").map(item => (
            <button key={item.id} onClick={() => switchTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${tab === item.id ? "bg-white/20 text-white shadow-lg" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
              <item.icon size={17} className="shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {tab === item.id && <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />}
            </button>
          ))}
          <div className="pt-3">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mb-2">Account</p>
            <button onClick={() => switchTab("profile")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "profile" ? "bg-white/20 text-white" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
              <User size={17} className="shrink-0" /><span className="flex-1 text-left">Profile</span>
            </button>
          </div>
        </div>
        <div className="p-3 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10">
            {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-xl object-cover shrink-0 ring-2 ring-white/20" /> : <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">{user?.name?.[0]?.toUpperCase() ?? "T"}</div>}
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{user?.name}</p><p className="text-xs text-white/50">Instructor</p></div>
            <button onClick={logout} className="p-1.5 text-white/40 hover:text-red-300 transition rounded-lg hover:bg-white/10"><LogOut size={14} /></button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-cream-dark flex items-center gap-4 px-5 sticky top-0 z-30 shrink-0 shadow-sm">
          <button className="lg:hidden text-slate-500" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search courses, students..." className="w-full pl-9 pr-4 py-2 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(p => !p)} className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-cream rounded-xl transition">
                <Bell size={19} />
                {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal rounded-full animate-pulse" />}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-50 w-80 bg-white rounded-2xl shadow-xl border border-cream-dark overflow-hidden">
                    <div className="px-4 py-3 border-b border-cream-dark flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                      <span className="text-xs font-bold text-white bg-teal px-2 py-0.5 rounded-full">{notifications.length}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.map((n, i) => (
                        <button key={i} onClick={() => { switchTab(n.tab); setNotifOpen(false); }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-cream transition-colors text-left border-b border-cream-dark last:border-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${n.color}`}><Bell size={14} /></div>
                          <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 leading-snug">{n.text}</p><p className="text-xs text-slate-500 mt-0.5">{n.sub}</p></div>
                          <ChevronRight size={14} className="text-slate-300 shrink-0 mt-1" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={() => switchTab("profile")} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-cream transition">
              {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-sm">{user?.name?.[0]?.toUpperCase() ?? "T"}</div>}
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-7 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
              {tab === "overview"          && <OverviewTab user={user} greeting={greeting} myCourses={myCourses} loading={loading} switchTab={switchTab} />}
              {tab === "my-courses"        && <MyCoursesTab courses={myCourses} loading={loading} navigate={navigate} switchTab={switchTab} showToast={showToast} />}
              {tab === "create-course"     && <CreateCourseTab switchTab={switchTab} showToast={showToast} />}
              {tab === "upload-content"    && <UploadContentTab courses={myCourses} loadMyCourses={loadMyCourses} showToast={showToast} />}
              {tab === "teacher-students"  && <StudentsTab courses={myCourses} loading={loading} />}
              {tab === "teacher-analytics" && <AnalyticsTab courses={myCourses} loading={loading} />}
              {tab === "ai-quiz"           && <AIQuizTab courses={myCourses} loadMyCourses={loadMyCourses} />}
              {tab === "profile"           && <ProfileTab user={user} logout={logout} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

/* ── Overview Tab ── */
function OverviewTab({ user, greeting, myCourses, loading, switchTab }: {
  user: { name: string; avatar?: string } | null; greeting: () => string;
  myCourses: Course[]; loading: boolean; switchTab: (t: string) => void;
}) {
  const [analytics, setAnalytics] = useState<OverviewAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    api.get<OverviewAnalytics>("/courses/teacher/overview-analytics")
      .then(setAnalytics).catch(() => setAnalytics(null)).finally(() => setAnalyticsLoading(false));
  }, []);

  const published = myCourses.filter(c => c.isPublished).length;
  const pending   = myCourses.filter(c => c.status === "pending").length;

  const stats = [
    { label: "My Courses",     value: myCourses.length,              icon: BookMarked,   grad: "from-teal-500 to-cyan-600" },
    { label: "Published",      value: published,                     icon: CheckCircle2, grad: "from-emerald-500 to-teal-600" },
    { label: "Total Students", value: analytics?.totalStudents ?? 0, icon: Users,        grad: "from-indigo-500 to-purple-600" },
    { label: "Pending Review", value: pending,                       icon: Clock,        grad: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal via-teal to-teal-light rounded-2xl p-6 text-white shadow-xl shadow-teal/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">{greeting()}</p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">{user?.name?.split(" ")[0]} 👋</h1>
            <p className="text-white/70 text-sm mb-5">Here's your teaching snapshot for today.</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => switchTab("create-course")} className="flex items-center gap-2 px-5 py-2.5 bg-white text-teal font-bold text-sm rounded-xl hover:bg-white/90 transition shadow-lg hover:-translate-y-0.5"><Plus size={15} /> Create Course</button>
              <button onClick={() => switchTab("upload-content")} className="flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/30 transition hover:-translate-y-0.5"><Upload size={15} /> Upload Content</button>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center w-28 h-28 rounded-2xl bg-white/10 backdrop-blur-sm shrink-0 border border-white/10">
            <Sparkles size={36} className="text-white/60 mb-1" />
            <span className="text-[10px] text-white/50 font-medium">Studio</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="bg-white rounded-2xl p-5 border border-cream-dark shadow-sm hover:shadow-lg hover:shadow-teal/5 transition-all duration-300 cursor-default">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center mb-4 shadow-lg`}>
              <s.icon size={20} className="text-white" />
            </div>
            <p className="text-2xl font-display font-bold text-slate-900">{loading || analyticsLoading ? "..." : s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
            <p className="text-[10px] text-teal font-semibold mt-1 flex items-center gap-0.5"><ArrowUpRight size={10} /> Real data</p>
          </motion.div>
        ))}
      </div>

      {/* Charts — real data */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-cream-dark p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center"><TrendingUp size={16} className="text-teal" /></div>
            <div><p className="font-bold text-slate-900 text-sm">Enrollment Trend</p><p className="text-xs text-slate-400">Last 6 months</p></div>
          </div>
          {analyticsLoading ? <div className="h-40 bg-cream rounded-xl animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={analytics?.chartData ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="enrollments" stroke="#0d9488" strokeWidth={2.5} fill="url(#tealGrad)" dot={{ fill: "#0d9488", r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-cream-dark p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><Activity size={16} className="text-indigo-600" /></div>
            <div><p className="font-bold text-slate-900 text-sm">Course Status</p><p className="text-xs text-slate-400">Your courses breakdown</p></div>
          </div>
          {loading ? <div className="h-40 bg-cream rounded-xl animate-pulse" /> : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { status: "Live",     count: myCourses.filter(c => c.isPublished).length },
                { status: "Approved", count: myCourses.filter(c => c.status === "approved" && !c.isPublished).length },
                { status: "Pending",  count: myCourses.filter(c => c.status === "pending").length },
                { status: "Draft",    count: myCourses.filter(c => c.status === "draft").length },
              ]} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" /><stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]} name="Courses" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: BookMarked,   title: "My Courses",    desc: "Manage your courses",    grad: "from-teal-500 to-cyan-600",    tab: "my-courses" },
            { icon: Plus,         title: "Create Course", desc: "Start a new course",     grad: "from-indigo-500 to-purple-600", tab: "create-course" },
            { icon: Users,        title: "Students",      desc: "View enrolled students", grad: "from-amber-500 to-orange-500", tab: "teacher-students" },
            { icon: BrainCircuit, title: "AI Quiz",       desc: "Generate quiz with AI",  grad: "from-rose-500 to-pink-600",    tab: "ai-quiz" },
          ].map(a => (
            <motion.button key={a.tab} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }} onClick={() => switchTab(a.tab)}
              className="bg-white rounded-2xl p-4 border border-cream-dark hover:border-teal/20 hover:shadow-lg hover:shadow-teal/5 transition-all duration-300 text-left group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.grad} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <a.icon size={18} className="text-white" />
              </div>
              <p className="font-bold text-slate-900 text-sm mb-0.5">{a.title}</p>
              <p className="text-xs text-slate-500">{a.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── My Courses Tab ── */
function MyCoursesTab({ courses, loading, navigate, switchTab, showToast }: {
  courses: Course[]; loading: boolean; navigate: (to: string) => void;
  switchTab: (t: string) => void; showToast: (msg: string, type?: "success" | "error") => void;
}) {
  const [search, setSearch] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await api.delete(`/courses/${id}`); showToast("Course deleted"); window.location.reload(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed", "error"); }
    finally { setDeleting(null); setConfirmDel(null); }
  };

  const handlePublish = async (id: string) => {
    try { await api.patch(`/courses/${id}/publish`); showToast("Course published!"); window.location.reload(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed", "error"); }
  };

  const handleSubmit = async (id: string) => {
    try { await api.patch(`/courses/${id}/submit`); showToast("Submitted for admin review!"); window.location.reload(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed", "error"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">My Courses</h1>
          <p className="text-slate-500 mt-1 text-sm">{courses.length} course{courses.length !== 1 ? "s" : ""} created</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
          </div>
          <button onClick={() => switchTab("create-course")} className="flex items-center gap-2 px-4 py-2.5 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition shrink-0">
            <Plus size={15} /> New
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookMarked} title="No courses yet" desc="Create your first course to get started." action="Create Course" onAction={() => switchTab("create-course")} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-cream-dark overflow-hidden hover:shadow-lg hover:shadow-teal/5 hover:-translate-y-1 transition-all duration-200 group">
              <div className={`h-36 relative overflow-hidden ${!c.thumbnail ? `bg-gradient-to-r ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]}` : ""}`}>
                {c.thumbnail ? <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><BookMarked size={60} className="text-white" /></div>}
                <div className="absolute top-2.5 right-2.5"><StatusBadge course={c} /></div>
              </div>
              <div className="p-4">
                <h3 className="font-display font-bold text-slate-900 text-sm leading-snug mb-1 line-clamp-1">{c.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.description || "No description."}</p>
                <div className="flex items-center gap-1 mb-3 text-amber-400">
                  {[1,2,3,4,5].map(s => <Star key={s} size={11} fill={s <= Math.round(c.averageRating ?? 0) ? "currentColor" : "none"} />)}
                  <span className="text-xs text-slate-500 ml-1">{c.averageRating?.toFixed(1) || "New"}</span>
                </div>
                {c.status === "approved" && !c.isPublished && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-3">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <p className="text-xs font-semibold text-emerald-700">Approved — ready to publish</p>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => navigate(`/teacher/courses/${c._id}`)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-teal/10 text-teal text-xs font-semibold rounded-xl hover:bg-teal/20 transition">
                    <Settings size={12} /> Manage
                  </button>
                  {c.status === "draft" && <button onClick={() => handleSubmit(c._id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-50 text-amber-600 text-xs font-semibold rounded-xl hover:bg-amber-100 transition"><ArrowUpRight size={12} /> Submit</button>}
                  {c.status === "approved" && !c.isPublished && <button onClick={() => handlePublish(c._id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition"><CheckCircle2 size={12} /> Publish</button>}
                  {confirmDel === c._id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(c._id)} disabled={deleting === c._id} className="px-2 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition disabled:opacity-50">{deleting === c._id ? "..." : "Confirm"}</button>
                      <button onClick={() => setConfirmDel(null)} className="px-2 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(c._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Create Course Tab ── */
function CreateCourseTab({ switchTab, showToast }: { switchTab: (t: string) => void; showToast: (msg: string, type?: "success" | "error") => void }) {
  const [form, setForm] = useState({ title: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState("");
  const [thumbUploading, setThumbUploading] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [createdId, setCreatedId] = useState("");
  const [submitDone, setSubmitDone] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    else if (form.title.trim().length < 3) e.title = "At least 3 characters";
    setErrors(e); return !Object.keys(e).length;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!validate()) return;
    setSubmitting(true);
    try {
      const course = await api.post<Course>("/courses", { title: form.title.trim(), description: form.description.trim() });
      setCreatedId(course._id);
      if (thumbFile) {
        setThumbUploading(true);
        try {
          const fd = new FormData(); fd.append("file", thumbFile); fd.append("upload_preset", CLOUDINARY_PRESET); fd.append("resource_type", "image");
          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: fd });
          const data = await res.json();
          if (res.ok) await api.patch(`/courses/${course._id}/thumbnail`, { thumbnailUrl: data.secure_url, thumbnailPublicId: data.public_id });
        } catch { /* ignore thumb error */ } finally { setThumbUploading(false); }
      }
      setStep("success"); showToast("Course created successfully!");
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to create course", "error"); }
    finally { setSubmitting(false); }
  };

  const handleSubmitForReview = async () => {
    try { await api.patch(`/courses/${createdId}/submit`); setSubmitDone(true); showToast("Submitted for admin review!"); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed", "error"); }
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">Create Course</h1>
        <p className="text-slate-500 mt-1 text-sm">Courses are saved as drafts first, then submitted for admin approval.</p>
      </div>
      <div className="flex items-center gap-2 mb-6">
        {[{ n: 1, label: "Create Draft" }, { n: 2, label: "Submit Review" }, { n: 3, label: "Admin Approves" }, { n: 4, label: "Publish" }].map((s, i, arr) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-1.5 ${step === "success" && s.n <= 2 ? "text-teal" : step === "form" && s.n === 1 ? "text-teal" : "text-slate-300"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${(step === "success" && s.n === 1) || (submitDone && s.n === 2) ? "bg-teal border-teal text-white" : step === "form" && s.n === 1 ? "border-teal text-teal" : "border-slate-200 text-slate-300"}`}>
                {(step === "success" && s.n === 1) || (submitDone && s.n === 2) ? <CheckCircle2 size={14} /> : s.n}
              </div>
              <span className="text-xs font-semibold hidden sm:block">{s.label}</span>
            </div>
            {i < arr.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${step === "success" && s.n === 1 ? "bg-teal" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
        {step === "form" ? (
          <form onSubmit={handleCreate} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Course Title *</label>
              <input value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => ({ ...p, title: "" })); }} placeholder="e.g. Introduction to React"
                className={`w-full px-4 py-3 text-sm bg-cream rounded-xl border transition focus:outline-none focus:border-teal/50 ${errors.title ? "border-red-300 bg-red-50/30" : "border-cream-dark"}`} />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What will students learn?" rows={4}
                className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/50 transition resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Thumbnail <span className="text-slate-400 font-normal">(optional)</span></label>
              <div className="border-2 border-dashed border-cream-dark rounded-xl overflow-hidden hover:border-teal/40 transition cursor-pointer" onClick={() => !thumbPreview && document.getElementById("create-thumb")?.click()}>
                {thumbPreview ? (
                  <div className="relative">
                    <img src={thumbPreview} alt="preview" className="w-full h-36 object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition">
                      <button type="button" onClick={e => { e.stopPropagation(); document.getElementById("create-thumb")?.click(); }} className="px-3 py-1.5 bg-white text-slate-800 text-xs font-semibold rounded-lg">Change</button>
                      <button type="button" onClick={e => { e.stopPropagation(); setThumbFile(null); setThumbPreview(""); }} className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg">Remove</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-7 text-slate-400">
                    <Upload size={22} className="mb-2" /><p className="text-sm font-medium">Click to upload thumbnail</p><p className="text-xs mt-1">JPG, PNG, WebP</p>
                  </div>
                )}
                <input id="create-thumb" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; setThumbFile(f); setThumbPreview(URL.createObjectURL(f)); }} />
              </div>
            </div>
            <button type="submit" disabled={submitting || thumbUploading} className="w-full py-3 bg-teal text-white font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting || thumbUploading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {thumbUploading ? "Uploading thumbnail..." : "Creating..."}</> : <><Plus size={16} /> Create Course</>}
            </button>
          </form>
        ) : (
          <div className="p-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200 mb-5">
              <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
              <div><p className="font-semibold text-emerald-800 text-sm">Course created!</p><p className="text-xs text-emerald-600 mt-0.5">Now submit it for admin review to go live.</p></div>
            </div>
            {!submitDone ? (
              <div className="space-y-3">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200"><p className="text-sm font-semibold text-amber-800 mb-1">Next: Submit for Review</p><p className="text-xs text-amber-700">Admin will review and approve. After approval you can publish.</p></div>
                <div className="flex gap-3">
                  <button onClick={handleSubmitForReview} className="flex-1 py-3 bg-teal text-white font-semibold rounded-xl hover:bg-teal-dark transition flex items-center justify-center gap-2"><ArrowUpRight size={16} /> Submit for Review</button>
                  <button onClick={() => switchTab("my-courses")} className="px-4 py-3 bg-cream text-slate-600 font-semibold rounded-xl hover:bg-cream-dark transition text-sm">Save as Draft</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-teal/5 rounded-xl border border-teal/20"><CheckCircle2 size={20} className="text-teal shrink-0" /><div><p className="font-semibold text-teal text-sm">Submitted for review!</p><p className="text-xs text-slate-500 mt-0.5">Admin will review shortly.</p></div></div>
                <div className="flex gap-3">
                  <button onClick={() => switchTab("my-courses")} className="flex-1 py-3 bg-teal text-white font-semibold rounded-xl hover:bg-teal-dark transition text-sm">View My Courses</button>
                  <button onClick={() => { setStep("form"); setForm({ title: "", description: "" }); setThumbFile(null); setThumbPreview(""); setSubmitDone(false); }} className="px-4 py-3 bg-cream text-slate-600 font-semibold rounded-xl hover:bg-cream-dark transition text-sm">Create Another</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Upload Content Tab ── */
function UploadContentTab({ courses, loadMyCourses, showToast }: { courses: Course[]; loadMyCourses: () => void; showToast: (msg: string, type?: "success" | "error") => void }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const xhrRef = useState<XMLHttpRequest | null>(null);

  useEffect(() => { if (courses.length === 0) loadMyCourses(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedCourse || !file) return;
    setUploading(true); setProgress(0); setDone(false);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("upload_preset", CLOUDINARY_PRESET); fd.append("resource_type", "auto");
      const cloudRes = await new Promise<{ secure_url: string; public_id: string; resource_type: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest(); xhrRef[1](xhr);
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`);
        xhr.upload.onprogress = ev => { if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 90)); };
        xhr.onload = () => { xhrRef[1](null); const d = JSON.parse(xhr.responseText); xhr.status === 200 ? resolve(d) : reject(new Error(d.error?.message || "Upload failed")); };
        xhr.onerror = () => { xhrRef[1](null); reject(new Error("Network error")); };
        xhr.onabort = () => { xhrRef[1](null); reject(new Error("Cancelled")); };
        xhr.send(fd);
      });
      setProgress(95);
      await api.post(`/content/${selectedCourse}/save-record`, { title: title || file.name, url: cloudRes.secure_url, publicId: cloudRes.public_id, resourceType: cloudRes.resource_type });
      setProgress(100); setDone(true); showToast("Content uploaded successfully!");
      setFile(null); setTitle(""); setSelectedCourse("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      if (msg !== "Cancelled") showToast(msg, "error");
      setProgress(0);
    } finally { setUploading(false); }
  };

  return (
    <div className="max-w-lg">
      <div className="mb-6"><h1 className="text-2xl font-display font-bold text-slate-900">Upload Content</h1><p className="text-slate-500 mt-1 text-sm">Add videos or PDFs to your courses</p></div>
      <div className="bg-white rounded-2xl border border-cream-dark p-6">
        {uploading ? (
          <div className="py-8 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center shrink-0"><Upload size={22} className="text-teal animate-bounce" /></div>
              <div className="flex-1 min-w-0"><p className="font-semibold text-slate-800 text-sm truncate">{file?.name}</p><p className="text-xs text-slate-400 mt-0.5">{courses.find(c => c._id === selectedCourse)?.title}</p></div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-2"><span className="font-semibold text-teal">Uploading...</span><span className="font-bold">{progress}%</span></div>
              <div className="h-3 bg-cream-dark rounded-full overflow-hidden"><motion.div className="h-full bg-teal rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} /></div>
            </div>
            <button onClick={() => { xhrRef[0]?.abort(); xhrRef[1](null); setUploading(false); setProgress(0); }} className="w-full py-3 bg-red-50 text-red-500 font-semibold rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2"><XIcon size={16} /> Cancel</button>
          </div>
        ) : done ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={32} className="text-emerald-500" /></div>
            <h3 className="text-lg font-display font-bold text-slate-900 mb-2">Content Uploaded!</h3>
            <p className="text-sm text-slate-500 mb-5">Your content is now available to enrolled students.</p>
            <button onClick={() => setDone(false)} className="text-sm text-teal font-semibold hover:underline">Upload another</button>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Course *</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} required className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition">
                <option value="">Choose a course...</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Content Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Lesson 1 — Introduction" className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">File (Video or PDF) *</label>
              <div className="border-2 border-dashed border-cream-dark rounded-xl p-6 text-center hover:border-teal/40 transition cursor-pointer" onClick={() => document.getElementById("upload-file")?.click()}>
                <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">{file ? file.name : "Click to select a file"}</p>
                <p className="text-xs text-slate-400 mt-1">MP4, PDF, PPT supported</p>
                <input id="upload-file" type="file" accept="video/*,.pdf,.ppt,.pptx" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
            <button type="submit" disabled={!selectedCourse || !file} className="w-full py-3 bg-teal text-white font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 flex items-center justify-center gap-2"><Upload size={16} /> Upload Content</button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Students Tab ── */
function StudentsTab({ courses, loading }: { courses: Course[]; loading: boolean }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadStudents = async (courseId: string) => {
    setSelectedCourse(courseId); setStudentsLoading(true);
    try { const d = await api.get<StudentEnrollment[]>(`/enrollments/course/${courseId}/students`); setStudents(Array.isArray(d) ? d : []); }
    catch { setStudents([]); } finally { setStudentsLoading(false); }
  };

  const filtered = students.filter(s => s.student?.name?.toLowerCase().includes(search.toLowerCase()) || s.student?.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-display font-bold text-slate-900">Students</h1><p className="text-slate-500 mt-1 text-sm">View enrolled students for each of your courses</p></div>
      {loading ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
        : courses.length === 0 ? <EmptyState icon={Users} title="No courses yet" desc="Create a course first to see enrolled students." />
        : (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-cream-dark p-5">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Select Course</label>
              <select value={selectedCourse} onChange={e => loadStudents(e.target.value)} className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition">
                <option value="">Choose a course...</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            {selectedCourse && (
              <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
                  <p className="font-display font-bold text-slate-900 text-sm">{studentsLoading ? "Loading..." : `${filtered.length} Student${filtered.length !== 1 ? "s" : ""}`}</p>
                  <div className="relative w-44"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-2 text-xs bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" /></div>
                </div>
                {studentsLoading ? <div className="p-5 space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-14 bg-cream rounded-xl animate-pulse" />)}</div>
                  : filtered.length === 0 ? <div className="py-12 text-center"><Users size={36} className="mx-auto text-slate-300 mb-3" /><p className="text-sm text-slate-500">{search ? "No students match." : "No students enrolled yet."}</p></div>
                  : (
                    <div className="divide-y divide-cream-dark">
                      {filtered.map((s, i) => (
                        <motion.div key={s._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-4 px-5 py-3.5 hover:bg-cream transition-colors">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal to-teal-light flex items-center justify-center text-white font-bold text-sm shrink-0">{s.student?.name?.[0]?.toUpperCase() ?? "?"}</div>
                          <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-800 truncate">{s.student?.name || "Unknown"}</p><p className="text-xs text-slate-400 truncate">{s.student?.email}</p></div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="hidden sm:block w-24"><div className="h-1.5 bg-cream-dark rounded-full overflow-hidden"><div className={`h-full rounded-full ${s.progress >= 100 ? "bg-emerald-500" : "bg-teal"}`} style={{ width: `${s.progress}%` }} /></div><p className="text-[10px] text-slate-400 mt-0.5 text-right">{s.progress}%</p></div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.progress >= 100 ? "bg-emerald-50 text-emerald-600" : s.progress > 0 ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>{s.progress >= 100 ? "Done" : s.progress > 0 ? "Active" : "New"}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
    </div>
  );
}

/* ── Analytics Tab ── */
function AnalyticsTab({ courses, loading }: { courses: Course[]; loading: boolean }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const loadAnalytics = async (courseId: string) => {
    setSelectedCourse(courseId); setAnalyticsLoading(true);
    try {
      const [a, r] = await Promise.all([api.get<CourseAnalytics>(`/courses/${courseId}/analytics`), api.get<Review[]>(`/reviews/course/${courseId}`).catch(() => [] as Review[])]);
      setAnalytics(a); setReviews(Array.isArray(r) ? r : []);
    } catch { setAnalytics(null); } finally { setAnalyticsLoading(false); }
  };

  const breakdownData = analytics ? [
    { name: "Completed",   value: analytics.completed,  color: "#10b981" },
    { name: "In Progress", value: analytics.inProgress, color: "#0d9488" },
    { name: "Not Started", value: analytics.notStarted, color: "#e2e8f0" },
  ] : [];

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-display font-bold text-slate-900">Analytics</h1><p className="text-slate-500 mt-1 text-sm">Track enrollments, completion rates, and student feedback</p></div>
      {loading ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
        : courses.length === 0 ? <EmptyState icon={BarChart3} title="No courses yet" desc="Create a course to see analytics." />
        : (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-cream-dark p-5">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Select Course</label>
              <select value={selectedCourse} onChange={e => loadAnalytics(e.target.value)} className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition">
                <option value="">Choose a course...</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            {selectedCourse && (
              analyticsLoading ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 border border-cream-dark animate-pulse h-28" />)}</div>
              : analytics ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Enrolled",     value: analytics.totalEnrollments, icon: Users,       grad: "from-teal-500 to-cyan-600" },
                      { label: "Completed",    value: analytics.completed,        icon: CheckCircle2, grad: "from-emerald-500 to-teal-600" },
                      { label: "Completion %", value: `${analytics.completionRate}%`, icon: Target,  grad: "from-indigo-500 to-purple-600" },
                      { label: "Avg Progress", value: `${analytics.avgProgress}%`, icon: TrendingUp, grad: "from-amber-500 to-orange-500" },
                    ].map((s, i) => (
                      <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="bg-white rounded-2xl p-5 border border-cream-dark shadow-sm">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center mb-3 shadow-md`}><s.icon size={18} className="text-white" /></div>
                        <p className="text-2xl font-display font-bold text-slate-900">{s.value}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-2xl border border-cream-dark p-5">
                      <p className="font-bold text-slate-900 text-sm mb-4">Progress Breakdown</p>
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width="55%" height={160}>
                          <PieChart><Pie data={breakdownData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">{breakdownData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}</Pie><Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} /></PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2.5 flex-1">{breakdownData.map(r => (<div key={r.name} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full shrink-0" style={{ background: r.color }} /><span className="text-xs text-slate-600 flex-1">{r.name}</span><span className="text-xs font-bold text-slate-800">{r.value}</span></div>))}</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-cream-dark p-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-bold text-slate-900 text-sm">Student Reviews</p>
                        <div className="flex items-center gap-1.5"><Star size={13} className="text-amber-400" fill="currentColor" /><span className="text-sm font-bold text-slate-800">{analytics.avgRating || "—"}</span><span className="text-xs text-slate-400">({analytics.totalReviews})</span></div>
                      </div>
                      {reviews.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">No reviews yet.</p> : (
                        <div className="space-y-3 max-h-52 overflow-y-auto">
                          {reviews.map(r => (
                            <div key={r._id} className="flex items-start gap-3 p-3 bg-cream rounded-xl">
                              <div className="w-7 h-7 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-xs shrink-0">{r.student?.name?.[0]?.toUpperCase() ?? "?"}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1"><span className="text-xs font-semibold text-slate-700">{r.student?.name || "Student"}</span><div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= r.rating ? "text-amber-400" : "text-slate-200"} fill={s <= r.rating ? "currentColor" : "none"} />)}</div></div>
                                <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : <EmptyState icon={BarChart3} title="Could not load analytics" desc="Try selecting a different course." />
            )}
          </div>
        )}
    </div>
  );
}

/* ── AI Quiz Tab ── */
function AIQuizTab({ courses, loadMyCourses }: { courses: Course[]; loadMyCourses: () => void }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useEffect(() => { if (courses.length === 0) loadMyCourses(); }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedCourse || lessonContent.length < 10) return;
    setLoading(true); setError(""); setQuestions([]); setQuizId(null); setPublished(false); setOpenIdx(0);
    try {
      const d = await api.post<{ success: boolean; data: { quizId: string; questions: QuizQuestion[] } }>("/ai/generate-quiz", { courseId: selectedCourse, lessonId: "lesson-1", lessonContent, courseTitle: courses.find(c => c._id === selectedCourse)?.title ?? "Course", numQuestions });
      setQuizId(d.data?.quizId ?? null); setQuestions(d.data?.questions ?? []);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to generate quiz"); }
    finally { setLoading(false); }
  };

  const handlePublish = async () => {
    if (!quizId) return; setPublishing(true); setError("");
    try { await api.patch(`/ai/quiz/${quizId}/publish`); setPublished(true); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to publish"); }
    finally { setPublishing(false); }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6"><h1 className="text-2xl font-display font-bold text-slate-900">AI Quiz Generator</h1><p className="text-slate-500 mt-1 text-sm">Generate MCQ quizzes from lesson content — publish so students can attempt them</p></div>
      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-dark p-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Course *</label><select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} required className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition"><option value="">Choose a course...</option>{courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Lesson Content * <span className="text-slate-400 font-normal">(min 10 chars)</span></label><textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)} placeholder="Paste the lesson text here..." rows={6} required className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition resize-none" /><p className="mt-1 text-xs text-slate-400">{lessonContent.length} chars {lessonContent.length < 10 && <span className="text-amber-500">(need {10 - lessonContent.length} more)</span>}</p></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1.5">Number of Questions</label><input type="number" min={1} max={20} value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} className="w-32 px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" /></div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading || !selectedCourse || lessonContent.length < 10} className="w-full py-3 bg-teal text-white font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</> : <><BrainCircuit size={16} /> Generate Quiz</>}
            </button>
          </form>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white rounded-2xl border border-cream-dark p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><p className="font-display font-bold text-slate-900 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" /> {questions.length} Questions Generated</p><p className="text-xs text-slate-500 mt-0.5">{published ? "Published — students can now attempt this quiz" : "Review below, then publish for students"}</p></div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => { setQuestions([]); setQuizId(null); setPublished(false); setError(""); }} className="px-4 py-2 bg-cream border border-cream-dark text-slate-600 text-sm font-semibold rounded-xl hover:bg-cream-dark transition">New Quiz</button>
              {!published && <button onClick={handlePublish} disabled={publishing} className="flex items-center gap-2 px-4 py-2 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50">{publishing ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}{publishing ? "Publishing..." : "Publish Quiz"}</button>}
            </div>
          </div>
          {error && <p className="text-sm text-red-500 px-1">{error}</p>}
          {questions.map((q, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
              <button onClick={() => setOpenIdx(openIdx === idx ? null : idx)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-cream transition">
                <div className="flex items-center gap-3 min-w-0"><span className="w-7 h-7 rounded-full bg-teal/10 text-teal text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span><span className="font-semibold text-slate-800 text-sm truncate">{q.question}</span></div>
                <motion.svg animate={{ rotate: openIdx === idx ? 180 : 0 }} transition={{ duration: 0.2 }} className="w-4 h-4 text-slate-400 shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></motion.svg>
              </button>
              <AnimatePresence initial={false}>
                {openIdx === idx && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-5 pb-4 space-y-2 border-t border-cream-dark pt-3">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm ${opt === q.correctAnswer ? "bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold" : "bg-cream border border-cream-dark text-slate-700"}`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${opt === q.correctAnswer ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>{String.fromCharCode(65 + oi)}</span>
                          {opt}{opt === q.correctAnswer && <CheckCircle2 size={14} className="ml-auto text-emerald-500 shrink-0" />}
                        </div>
                      ))}
                      {q.explanation && <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700"><span className="font-semibold">Explanation: </span>{q.explanation}</div>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/* ── Profile Tab ── */
function ProfileTab({ user, logout }: { user: { name: string; email: string; role: string; avatar?: string } | null; logout: () => void }) {
  const { updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSave = async () => {
    setSaving(true); setMsg("");
    try {
      const fd = new FormData(); fd.append("name", name.trim()); if (avatarFile) fd.append("avatar", avatarFile);
      const updated = await api.patchForm<{ id: string; name: string; email: string; role: string; avatar: string }>("/auth/profile", fd);
      updateUser({ name: updated.name, avatar: updated.avatar }); setMsg("saved"); setAvatarFile(null);
    } catch (err: unknown) { setMsg(err instanceof Error ? err.message : "Failed"); }
    finally { setSaving(false); }
  };

  const handleChangePw = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { setPwMsg("All fields required"); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg("Passwords don't match"); return; }
    if (pwForm.newPw.length < 8) { setPwMsg("Min 8 characters"); return; }
    setPwLoading(true); setPwMsg("");
    try { await api.patch("/auth/change-password", { currentPassword: pwForm.current, newPassword: pwForm.newPw }); setPwMsg("success"); setPwForm({ current: "", newPw: "", confirm: "" }); setShowPw(false); }
    catch (err: unknown) { setPwMsg(err instanceof Error ? err.message : "Failed"); }
    finally { setPwLoading(false); }
  };

  const avatar = avatarPreview || user?.avatar || "";

  return (
    <div className="max-w-xl">
      <div className="mb-6"><h1 className="text-2xl font-display font-bold text-slate-900">My Profile</h1><p className="text-slate-500 mt-1 text-sm">Manage your instructor account</p></div>
      <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden shadow-sm">
        <div className="h-28 bg-gradient-to-r from-teal via-teal to-teal-light" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="relative">
              {avatar ? <img src={avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" /> : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal to-teal-light border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl">{user?.name?.[0]?.toUpperCase() ?? "T"}</div>}
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-teal rounded-full flex items-center justify-center cursor-pointer border-2 border-white shadow hover:bg-teal-dark transition">
                <Upload size={13} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }} />
              </label>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200">Instructor</span>
          </div>
          {msg === "saved" && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2"><CheckCircle2 size={14} /> Profile updated</div>}
          {msg && msg !== "saved" && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{msg}</div>}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Display Name</label>
            <div className="flex gap-2">
              <input value={name} onChange={e => setName(e.target.value)} className="flex-1 px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-teal/50 transition" />
              <button onClick={handleSave} disabled={saving || name.trim() === user?.name} className="px-5 py-2.5 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">{saving ? "..." : "Save"}</button>
            </div>
          </div>
          <div className="mb-6"><label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label><input value={user?.email ?? ""} readOnly className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 text-slate-500 cursor-not-allowed" /></div>
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div><p className="text-sm font-semibold text-slate-700">Password</p><p className="text-xs text-slate-400 mt-0.5">Change your account password</p>{pwMsg === "success" && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 size={12} /> Password changed</p>}</div>
              <button onClick={() => { setShowPw(p => !p); setPwMsg(""); }} className="text-sm font-semibold text-teal hover:underline">{showPw ? "Cancel" : "Change"}</button>
            </div>
            <AnimatePresence>
              {showPw && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="space-y-3 max-w-sm">
                    {[["Current password", "current"], ["New password", "newPw"], ["Confirm new password", "confirm"]].map(([label, key]) => (
                      <div key={key}><label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label><input type="password" value={pwForm[key as keyof typeof pwForm]} onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))} className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-teal/50 transition" /></div>
                    ))}
                    {pwMsg && pwMsg !== "success" && <p className="text-xs text-red-500">{pwMsg}</p>}
                    <button onClick={handleChangePw} disabled={pwLoading} className="px-5 py-2.5 bg-teal hover:bg-teal-dark text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">{pwLoading ? "Saving..." : "Save Password"}</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition font-medium"><LogOut size={14} /> Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}
