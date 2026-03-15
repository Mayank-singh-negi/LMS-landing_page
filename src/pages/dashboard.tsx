import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, PlayCircle, BrainCircuit, ClipboardList,
  Award, Star, MessageSquare, User, LogOut, Menu, X, Bell, Search,
  ChevronRight, Clock, CheckCircle2, TrendingUp, Zap, Plus, Upload,
  BarChart3, ShieldCheck, FileCheck, XCircle, ChevronDown, Settings,
  GraduationCap, Users, BookMarked,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";

/* ── Types ─────────────────────────────────────────────── */
interface Course { _id: string; title: string; description: string; averageRating: number; status?: string; isPublished?: boolean; }
interface Enrollment { _id: string; course: Course; progress: number; createdAt: string; }
interface Certificate { _id: string; course: Course; certificateId: string; createdAt: string; }
interface TestResult { _id: string; score: number; total: number; createdAt: string; }
interface AdminStats { totalUsers: number; totalStudents: number; totalTeachers: number; totalCourses: number; publishedCourses: number; totalEnrollments: number; averageCompletion: number; }

/* ── Role-based nav ─────────────────────────────────────── */
const STUDENT_NAV = [
  { id: "overview",     label: "Overview",        icon: LayoutDashboard },
  { id: "courses",      label: "Browse Courses",   icon: BookOpen },
  { id: "enrollments",  label: "My Learning",      icon: PlayCircle },
  { id: "ai",           label: "AI Tutor",         icon: BrainCircuit },
  { id: "mocktests",    label: "Mock Tests",       icon: ClipboardList },
  { id: "certificates", label: "Certificates",     icon: Award },
  { id: "reviews",      label: "My Reviews",       icon: MessageSquare },
  { id: "profile",      label: "Profile",          icon: User },
];

const TEACHER_NAV = [
  { id: "overview",       label: "Overview",          icon: LayoutDashboard },
  { id: "my-courses",     label: "My Courses",        icon: BookMarked },
  { id: "create-course",  label: "Create Course",     icon: Plus },
  { id: "upload-content", label: "Upload Content",    icon: Upload },
  { id: "ai-quiz",        label: "AI Quiz Generator", icon: BrainCircuit },
  { id: "profile",        label: "Profile",           icon: User },
];

const ADMIN_NAV = [
  { id: "overview",         label: "Overview",         icon: LayoutDashboard },
  { id: "admin-dashboard",  label: "Admin Dashboard",  icon: BarChart3 },
  { id: "pending-courses",  label: "Pending Courses",  icon: FileCheck },
  { id: "courses",          label: "Browse Courses",   icon: BookOpen },
  { id: "profile",          label: "Profile",          icon: User },
];

/* ── Main Dashboard ─────────────────────────────────────── */
export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const role = user?.role ?? "student";

  const NAV = role === "admin" ? ADMIN_NAV : role === "teacher" ? TEACHER_NAV : STUDENT_NAV;

  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // shared data
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  // reviews derived from enrollments — no separate state needed
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  // enroll feedback
  const [enrollMsg, setEnrollMsg] = useState<Record<string, string>>({});

  // AI
  const [aiQ, setAiQ] = useState("");
  const [aiA, setAiA] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // create course form — now self-contained in CreateCourseTab

  // review form
  const [reviewForm, setReviewForm] = useState<Record<string, { rating: number; comment: string }>>({});
  const [reviewMsg, setReviewMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    const loaders: Record<string, () => Promise<void>> = {
      courses:          () => loadCourses(),
      enrollments:      () => loadEnrollments(),
      certificates:     () => loadCertificates(),
      mocktests:        () => loadTestResults(),
      reviews:          () => loadReviews(),
      "my-courses":     () => loadMyCourses(),
      "admin-dashboard":() => loadAdminStats(),
      "pending-courses":() => loadPendingCourses(),
    };
    loaders[tab]?.();
  }, [tab]);

  const withLoading = async (fn: () => Promise<void>) => {
    setLoading(true);
    try { await fn(); } catch { /* show empty state */ } finally { setLoading(false); }
  };

  const loadCourses = () => withLoading(async () => {
    const [d, enrolled] = await Promise.all([
      api.get<{ courses: Course[] }>("/courses"),
      role === "student" ? api.get<Enrollment[]>("/enrollments/me").catch(() => [] as Enrollment[]) : Promise.resolve([] as Enrollment[]),
    ]);
    setCourses(d.courses || []);
    // pre-mark already-enrolled courses so button shows "Enrolled" immediately
    if (Array.isArray(enrolled) && enrolled.length > 0) {
      const alreadyEnrolled: Record<string, string> = {};
      enrolled.forEach(e => {
        const cid = String(e.course?._id ?? e.course);
        if (cid) alreadyEnrolled[cid] = "success";
      });
      setEnrollMsg(p => ({ ...p, ...alreadyEnrolled }));
    }
  });
  const loadEnrollments   = () => withLoading(async () => { const d = await api.get<Enrollment[]>("/enrollments/me"); setEnrollments(Array.isArray(d) ? d : []); });
  const loadCertificates  = () => withLoading(async () => {
    const d = await api.get<Enrollment[]>("/enrollments/me");
    const done = (Array.isArray(d) ? d : []).filter(e => e.progress >= 100);
    setCertificates(done.map(e => ({ _id: e._id, course: e.course, certificateId: `CERT-${e._id.slice(-8).toUpperCase()}`, createdAt: e.createdAt })));
  });
  const loadTestResults   = () => withLoading(async () => { const d = await api.get<TestResult[]>("/testresults/my-results"); setTestResults(Array.isArray(d) ? d : []); });
  const loadReviews       = () => withLoading(async () => {
    // fetch enrollments to know which courses the student can review
    const d = await api.get<Enrollment[]>("/enrollments/me");
    setEnrollments(Array.isArray(d) ? d : []);
  });
  const loadMyCourses     = () => withLoading(async () => { const d = await api.get<Course[]>("/courses/my-courses"); setMyCourses(Array.isArray(d) ? d : []); });
  const loadAdminStats    = () => withLoading(async () => { const d = await api.get<AdminStats>("/admin/dashboard"); setAdminStats(d); });
  const loadPendingCourses= () => withLoading(async () => { const d = await api.get<Course[]>("/admin/pending-courses"); setPendingCourses(Array.isArray(d) ? d : []); });

  const handleEnroll = async (courseId: string) => {
    setEnrollMsg(p => ({ ...p, [courseId]: "loading" }));
    try {
      await api.post(`/enrollments/${courseId}`, {});
      setEnrollMsg(p => ({ ...p, [courseId]: "success" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      // treat duplicate enrollment as success
      if (msg.toLowerCase().includes("already enrolled")) {
        setEnrollMsg(p => ({ ...p, [courseId]: "success" }));
      } else {
        setEnrollMsg(p => ({ ...p, [courseId]: msg }));
      }
    }
  };

  // create course — now handled inside CreateCourseTab directly

  const handleApprove = async (id: string) => {
    try { await api.put(`/admin/approve/${id}`); loadPendingCourses(); }
    catch { /* ignore */ }
  };
  const handleReject = async (id: string) => {
    try { await api.put(`/admin/reject/${id}`); loadPendingCourses(); }
    catch { /* ignore */ }
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQ.trim()) return;
    setAiLoading(true); setAiA("");
    try {
      const d = await api.post<{ answer: string }>("/ai/ask-doubt", { question: aiQ, courseId: "general", lessonId: "general", lessonContent: "General learning question", courseTitle: "General" });
      setAiA(d.answer);
    } catch (err: unknown) { setAiA(err instanceof Error ? err.message : "AI service unavailable."); }
    finally { setAiLoading(false); }
  };

  const handleSubmitReview = async (courseId: string) => {
    const r = reviewForm[courseId];
    if (!r?.comment || !r?.rating) return;
    setReviewMsg(p => ({ ...p, [courseId]: "loading" }));
    try { await api.post(`/reviews/${courseId}`, r); setReviewMsg(p => ({ ...p, [courseId]: "success" })); }
    catch (err: unknown) { setReviewMsg(p => ({ ...p, [courseId]: err instanceof Error ? err.message : "Failed" })); }
  };

  const handleLogout = () => { logout(); navigate("/"); };
  const switchTab = (id: string) => { setTab(id); setSidebarOpen(false); };
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-cream-dark flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-cream-dark shrink-0">
          <img src="/logo.png" alt="Learnovora" className="w-8 h-8" />
          <span className="font-display font-extrabold text-lg text-teal">Learnovora</span>
          <button className="ml-auto lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3 border-b border-cream-dark">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${role === "admin" ? "bg-red-50 text-red-600" : role === "teacher" ? "bg-amber-50 text-amber-600" : "bg-teal/10 text-teal"}`}>
            {role === "admin" ? "🛡 Admin" : role === "teacher" ? "🎓 Teacher" : "📚 Student"}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => (
            <button key={item.id} onClick={() => switchTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === item.id ? "bg-teal text-white shadow-md shadow-teal/20" : "text-slate-600 hover:bg-cream hover:text-teal"}`}>
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-cream-dark shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-sm shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-cream-dark flex items-center gap-4 px-5 sticky top-0 z-30 shrink-0">
          <button className="lg:hidden text-slate-500" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-cream rounded-xl transition">
              <Bell size={19} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal rounded-full" />
            </button>
            <button onClick={() => switchTab("profile")} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-cream transition">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-sm">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              <span className="hidden sm:block text-sm font-semibold text-slate-700">{user?.name?.split(" ")[0]}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-7 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>

              {/* ── SHARED: Overview ── */}
              {tab === "overview" && (
                <OverviewTab user={user} role={role} enrollments={enrollments} certificates={certificates}
                  myCourses={myCourses} adminStats={adminStats} switchTab={switchTab} greeting={greeting}
                  loadEnrollments={loadEnrollments} loadMyCourses={loadMyCourses} loadAdminStats={loadAdminStats} />
              )}

              {/* ── STUDENT tabs ── */}
              {tab === "courses"      && <CoursesTab courses={courses} loading={loading} enrollMsg={enrollMsg} onEnroll={handleEnroll} />}
              {tab === "enrollments"  && <EnrollmentsTab enrollments={enrollments} loading={loading} />}
              {tab === "ai"           && <AITab aiQ={aiQ} setAiQ={setAiQ} aiA={aiA} aiLoading={aiLoading} onSubmit={handleAskAI} role={role} />}
              {tab === "mocktests"    && <MockTestsTab results={testResults} loading={loading} />}
              {tab === "certificates" && <CertificatesTab certificates={certificates} loading={loading} switchTab={switchTab} />}
              {tab === "reviews"      && <ReviewsTab enrollments={enrollments} loading={loading} reviewForm={reviewForm} setReviewForm={setReviewForm} reviewMsg={reviewMsg} onSubmit={handleSubmitReview} />}

              {/* ── TEACHER tabs ── */}
              {tab === "my-courses"     && <MyCoursesTab courses={myCourses} loading={loading} loadMyCourses={loadMyCourses} />}
              {tab === "create-course"  && <CreateCourseTab switchTab={switchTab} />}
              {tab === "upload-content" && <UploadContentTab courses={myCourses} loadMyCourses={loadMyCourses} />}
              {tab === "ai-quiz"        && <AIQuizTab courses={myCourses} loadMyCourses={loadMyCourses} />}

              {/* ── ADMIN tabs ── */}
              {tab === "admin-dashboard"  && <AdminDashboardTab stats={adminStats} loading={loading} />}
              {tab === "pending-courses"  && <PendingCoursesTab courses={pendingCourses} loading={loading} onApprove={handleApprove} onReject={handleReject} />}

              {/* ── SHARED: Profile ── */}
              {tab === "profile" && <ProfileTab user={user} role={role} onLogout={handleLogout} />}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* ── Profile Tab ──────────────────────────────────────── */
function ProfileTab({ user, role, onLogout }: { user: { name: string; email: string; role: string; avatar?: string } | null; role: string; onLogout: () => void; }) {
  const { updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setSaving(true); setMsg("");
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      if (avatarFile) fd.append("avatar", avatarFile);
      const updated = await api.patchForm<{ id: string; name: string; email: string; role: string; avatar: string }>("/auth/profile", fd);
      updateUser({ name: updated.name, avatar: updated.avatar });
      setMsg("saved");
      setEditing(false);
      setAvatarFile(null);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  };

  const avatar = avatarPreview || user?.avatar || "";

  return (
    <div className="max-w-lg">
      <div className="mb-6"><h1 className="text-2xl font-display font-bold text-slate-900">Profile</h1><p className="text-slate-500 mt-1 text-sm">Your account information</p></div>
      <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-teal to-[#14b8a6]" />
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative w-16 h-16 -mt-8 mb-4">
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-teal font-display font-bold text-2xl">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            {editing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl cursor-pointer">
                <Upload size={16} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>

          {editing ? (
            <div className="mb-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
              </div>
              {msg && msg !== "saved" && <p className="text-xs text-red-500">{msg}</p>}
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-60">
                  {saving ? "Saving..." : <><CheckCircle2 size={14} /> Save</>}
                </button>
                <button onClick={() => { setEditing(false); setName(user?.name ?? ""); setAvatarFile(null); setAvatarPreview(user?.avatar ?? ""); }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-display font-bold text-slate-900">{user?.name}</h2>
                <button onClick={() => { setEditing(true); setMsg(""); setName(user?.name ?? ""); }}
                  className="text-xs text-teal font-semibold hover:underline">Edit</button>
              </div>
              <p className="text-sm text-slate-500 mb-5">{user?.email}</p>
              {msg === "saved" && <p className="text-xs text-emerald-600 mb-3 font-semibold">✓ Profile updated</p>}
            </>
          )}

          <div className="space-y-0 divide-y divide-cream-dark">
            <InfoRow icon={User} label="Full Name" value={user?.name ?? "—"} />
            <InfoRow icon={ShieldCheck} label="Role" value={role.charAt(0).toUpperCase() + role.slice(1)} />
            <InfoRow icon={GraduationCap} label="Account Type" value={role === "admin" ? "Administrator" : role === "teacher" ? "Instructor" : "Learner"} />
          </div>
          <div className="mt-6 pt-5 border-t border-cream-dark">
            <button onClick={onLogout} className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 text-sm font-semibold rounded-xl hover:bg-red-100 transition">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Overview Tab ─────────────────────────────────────── */
function OverviewTab({ user, role, enrollments, certificates, myCourses, adminStats, switchTab, greeting, loadEnrollments, loadMyCourses, loadAdminStats }: {
  user: { name: string } | null; role: string;
  enrollments: Enrollment[]; certificates: Certificate[]; myCourses: Course[];
  adminStats: AdminStats | null; switchTab: (t: string) => void; greeting: () => string;
  loadEnrollments: () => void; loadMyCourses: () => void; loadAdminStats: () => void;
}) {
  useEffect(() => {
    if (role === "student") loadEnrollments();
    if (role === "teacher") loadMyCourses();
    if (role === "admin") loadAdminStats();
  }, []);

  const studentStats = [
    { label: "Enrolled",     value: enrollments.length,                                    icon: BookOpen,     color: "bg-blue-50 text-blue-600" },
    { label: "Completed",    value: enrollments.filter(e => e.progress >= 100).length,     icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { label: "Certificates", value: certificates.length,                                   icon: Award,        color: "bg-amber-50 text-amber-600" },
    { label: "Streak Days",  value: 1,                                                     icon: Zap,          color: "bg-purple-50 text-purple-600" },
  ];

  const teacherStats = [
    { label: "My Courses",   value: myCourses.length,                                      icon: BookMarked,   color: "bg-blue-50 text-blue-600" },
    { label: "Published",    value: myCourses.filter(c => c.isPublished).length,           icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { label: "Pending",      value: myCourses.filter(c => c.status === "pending").length,  icon: ClipboardList,color: "bg-amber-50 text-amber-600" },
    { label: "Drafts",       value: myCourses.filter(c => c.status === "draft").length,    icon: Settings,     color: "bg-slate-100 text-slate-600" },
  ];

  const adminStatCards = adminStats ? [
    { label: "Total Users",    value: adminStats.totalUsers,       icon: Users,     color: "bg-blue-50 text-blue-600" },
    { label: "Total Courses",  value: adminStats.totalCourses,     icon: BookOpen,  color: "bg-indigo-50 text-indigo-600" },
    { label: "Enrollments",    value: adminStats.totalEnrollments, icon: PlayCircle,color: "bg-emerald-50 text-emerald-600" },
    { label: "Avg Completion", value: `${Math.round(adminStats.averageCompletion)}%`, icon: TrendingUp, color: "bg-amber-50 text-amber-600" },
  ] : [];

  const stats = role === "admin" ? adminStatCards : role === "teacher" ? teacherStats : studentStats;

  const studentActions = [
    { icon: BookOpen,      title: "Browse Courses",    desc: "Explore the full library",          color: "bg-blue-500",   tab: "courses" },
    { icon: PlayCircle,    title: "Continue Learning",  desc: "Pick up where you left off",        color: "bg-teal",       tab: "enrollments" },
    { icon: BrainCircuit,  title: "AI Tutor",           desc: "Get instant answers",               color: "bg-indigo-500", tab: "ai" },
    { icon: ClipboardList, title: "Mock Tests",         desc: "Practice with timed exams",         color: "bg-rose-500",   tab: "mocktests" },
    { icon: Award,         title: "Certificates",       desc: "View your earned certificates",     color: "bg-amber-500",  tab: "certificates" },
    { icon: MessageSquare, title: "My Reviews",         desc: "Rate and review your courses",      color: "bg-purple-500", tab: "reviews" },
  ];

  const teacherActions = [
    { icon: BookMarked,   title: "My Courses",         desc: "Manage your created courses",       color: "bg-blue-500",   tab: "my-courses" },
    { icon: Plus,         title: "Create Course",      desc: "Start a new course",                color: "bg-teal",       tab: "create-course" },
    { icon: Upload,       title: "Upload Content",     desc: "Add videos & PDFs to courses",      color: "bg-indigo-500", tab: "upload-content" },
    { icon: BrainCircuit, title: "AI Quiz Generator",  desc: "Auto-generate quizzes with AI",     color: "bg-rose-500",   tab: "ai-quiz" },
  ];

  const adminActions = [
    { icon: BarChart3,   title: "Admin Dashboard",    desc: "Platform-wide statistics",           color: "bg-blue-500",   tab: "admin-dashboard" },
    { icon: FileCheck,   title: "Pending Courses",    desc: "Approve or reject submissions",      color: "bg-amber-500",  tab: "pending-courses" },
    { icon: BookOpen,    title: "Browse Courses",     desc: "View all published courses",         color: "bg-teal",       tab: "courses" },
  ];

  const actions = role === "admin" ? adminActions : role === "teacher" ? teacherActions : studentActions;

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-display font-bold text-slate-900">{greeting()}, {user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-slate-500 mt-1 text-sm">Here's your snapshot for today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl p-5 border border-cream-dark">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={19} />
            </div>
            <p className="text-2xl font-display font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
        {actions.map(a => (
          <motion.button key={a.tab} whileHover={{ y: -3 }} onClick={() => switchTab(a.tab)}
            className="w-full text-left bg-white rounded-2xl p-5 border border-cream-dark hover:border-teal/20 hover:shadow-lg hover:shadow-teal/5 transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${a.color}`}>
              <a.icon size={19} className="text-white" />
            </div>
            <p className="font-display font-bold text-slate-900 mb-1 text-sm">{a.title}</p>
            <p className="text-xs text-slate-500">{a.desc}</p>
            <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-teal opacity-0 group-hover:opacity-100 transition-opacity">
              Open <ChevronRight size={12} />
            </div>
          </motion.button>
        ))}
      </div>

      {role === "student" && (
        <div className="bg-gradient-to-r from-teal to-[#14b8a6] rounded-2xl p-6 text-white flex items-center justify-between overflow-hidden relative">
          <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div>
            <p className="text-sm font-semibold text-white/80 mb-1">Learning Streak</p>
            <p className="text-3xl font-display font-bold">1 Day 🔥</p>
            <p className="text-sm text-white/70 mt-1">Log in daily to grow your streak.</p>
          </div>
          <TrendingUp size={56} className="text-white/20 shrink-0" />
        </div>
      )}
    </div>
  );
}

/* ── Courses Tab ──────────────────────────────────────── */
function CoursesTab({ courses, loading, enrollMsg, onEnroll }: { courses: Course[]; loading: boolean; enrollMsg: Record<string, string>; onEnroll: (id: string) => void; }) {
  const [search, setSearch] = useState("");
  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-display font-bold text-slate-900">Browse Courses</h1><p className="text-slate-500 mt-1 text-sm">{courses.length} courses available</p></div>
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter courses..." className="w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
        </div>
      </div>
      {loading ? <SkeletonGrid /> : filtered.length === 0 ? <EmptyState icon={BookOpen} title="No courses found" desc={search ? "Try a different search." : "No published courses yet."} /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course, i) => {
            const status = enrollMsg[course._id];
            return (
              <motion.div key={course._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-cream-dark hover:border-teal/30 hover:shadow-lg hover:shadow-teal/5 transition-all flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center mb-4 shrink-0"><BookOpen size={19} className="text-teal" /></div>
                <h3 className="font-display font-bold text-slate-900 mb-2 leading-snug text-sm">{course.title}</h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2 flex-1">{course.description || "No description."}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1 text-amber-400"><Star size={13} fill="currentColor" /><span className="text-xs font-semibold text-slate-600">{course.averageRating?.toFixed(1) || "New"}</span></div>
                  <button onClick={() => onEnroll(course._id)} disabled={status === "loading" || status === "success"}
                    className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${status === "success" ? "bg-emerald-50 text-emerald-600" : status && status !== "loading" ? "bg-red-50 text-red-500" : "bg-teal/10 text-teal hover:bg-teal hover:text-white"}`}>
                    {status === "loading" ? "..." : status === "success" ? <><CheckCircle2 size={13} /> Enrolled</> : "Enroll"}
                  </button>
                </div>
                {status && status !== "loading" && status !== "success" && <p className="text-xs text-red-400 mt-2">{status}</p>}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Enrollments Tab ──────────────────────────────────── */
function EnrollmentsTab({ enrollments, loading }: { enrollments: Enrollment[]; loading: boolean; }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [contentMap, setContentMap] = useState<Record<string, ContentItem[]>>({});
  const [contentLoading, setContentLoading] = useState<string | null>(null);

  const toggleEnrollment = async (enrollmentId: string, courseId: string) => {
    if (expandedId === enrollmentId) { setExpandedId(null); return; }
    setExpandedId(enrollmentId);
    if (!courseId) return;
    if (!contentMap[courseId]) {
      setContentLoading(courseId);
      try {
        const items = await api.get<ContentItem[]>(`/content/${courseId}`);
        setContentMap(p => ({ ...p, [courseId]: Array.isArray(items) ? items : [] }));
      } catch (err) {
        console.error("Failed to load content:", err);
        setContentMap(p => ({ ...p, [courseId]: [] }));
      }
      finally { setContentLoading(null); }
    }
  };

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-display font-bold text-slate-900">My Learning</h1><p className="text-slate-500 mt-1 text-sm">Track your progress across enrolled courses</p></div>
      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl p-5 border border-cream-dark animate-pulse h-24" />)}</div>
        : enrollments.length === 0 ? <EmptyState icon={PlayCircle} title="No enrollments yet" desc="Browse courses and enroll to start learning." />
        : (
          <div className="space-y-3">
            {enrollments.map((e, i) => {
              const cid = String(e.course?._id ?? "");
              return (
              <motion.div key={e._id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-cream-dark hover:border-teal/20 transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0"><BookOpen size={18} className="text-teal" /></div>
                      <div>
                        <h3 className="font-display font-bold text-slate-900 text-sm leading-snug">{e.course?.title || "Course"}</h3>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Clock size={11} /> Enrolled {new Date(e.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${e.progress >= 100 ? "bg-emerald-50 text-emerald-600" : e.progress > 0 ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                        {e.progress >= 100 ? "Completed" : e.progress > 0 ? "In Progress" : "Not Started"}
                      </span>
                      <button onClick={() => toggleEnrollment(e._id, cid)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal text-white text-xs font-semibold rounded-xl hover:bg-teal-dark transition">
                        <PlayCircle size={13} /> Study
                        <ChevronDown size={13} className={`transition-transform ${expandedId === e._id ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${e.progress}%` }} transition={{ duration: 0.8, delay: i * 0.06 }}
                        className={`h-full rounded-full ${e.progress >= 100 ? "bg-emerald-500" : "bg-teal"}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-10 text-right">{e.progress}%</span>
                  </div>
                </div>

                {/* Study materials panel */}
                <AnimatePresence>
                  {expandedId === e._id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="border-t border-cream-dark overflow-hidden">
                      <div className="p-5">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Study Materials</h4>
                        {contentLoading === cid ? (
                          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                            <span className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin" /> Loading materials...
                          </div>
                        ) : (contentMap[cid] ?? []).length === 0 ? (
                          <div className="text-center py-6 text-slate-400">
                            <BookOpen size={28} className="mx-auto mb-2 opacity-40" />
                            <p className="text-sm">No materials available yet.</p>
                            <p className="text-xs mt-1">The teacher hasn't uploaded content for this course yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(contentMap[cid] ?? []).map((item, idx) => (
                              <a key={item._id} href={item.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-cream rounded-xl border border-cream-dark hover:border-teal/30 hover:bg-teal/5 transition group">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === "video" ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-500"}`}>
                                  {item.type === "video" ? <PlayCircle size={15} /> : <FileCheck size={15} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-teal transition">{item.title || `Material ${idx + 1}`}</p>
                                  <p className="text-xs text-slate-400 capitalize">{item.type}</p>
                                </div>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-teal transition shrink-0" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              );
            })}
          </div>
        )}
    </div>
  );
}

/* ── AI Tutor Tab ─────────────────────────────────────── */
function AITab({ aiQ, setAiQ, aiA, aiLoading, onSubmit, role }: { aiQ: string; setAiQ: (v: string) => void; aiA: string; aiLoading: boolean; onSubmit: (e: React.FormEvent) => void; role: string; }) {
  return (
    <div className="max-w-2xl">
      <div className="mb-6"><h1 className="text-2xl font-display font-bold text-slate-900">AI Tutor</h1><p className="text-slate-500 mt-1 text-sm">{role === "teacher" ? "Ask AI anything or use the Quiz Generator tab." : "Ask any question and get instant answers."}</p></div>
      <div className="bg-white rounded-2xl border border-cream-dark p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-cream-dark">
          <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center"><BrainCircuit size={20} className="text-teal" /></div>
          <div><p className="font-semibold text-slate-800 text-sm">Learnovora AI</p><p className="text-xs text-emerald-500 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" /> Online</p></div>
        </div>
        <div className="min-h-[180px] mb-5">
          {!aiA && !aiLoading && <div className="flex flex-col items-center justify-center h-44 text-slate-400"><BrainCircuit size={40} className="mb-3 opacity-25" /><p className="text-sm text-center">Ask me anything about your courses or any topic.</p></div>}
          {aiLoading && <div className="flex items-center gap-3 p-4 bg-cream rounded-xl"><div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-teal rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div><span className="text-sm text-slate-500">Thinking...</span></div>}
          {aiA && !aiLoading && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-cream rounded-xl border border-cream-dark"><p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{aiA}</p></motion.div>}
        </div>
        <form onSubmit={onSubmit} className="flex gap-3">
          <input type="text" value={aiQ} onChange={e => setAiQ(e.target.value)} placeholder="Ask a question..." className="flex-1 px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
          <button type="submit" disabled={aiLoading || !aiQ.trim()} className="px-5 py-3 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 disabled:cursor-not-allowed">Ask</button>
        </form>
      </div>
      <p className="text-xs text-slate-400 text-center mt-3">AI responses are for educational purposes only.</p>
    </div>
  );
}

/* ── Mock Tests Tab ───────────────────────────────────── */
function MockTestsTab({ results, loading }: { results: TestResult[]; loading: boolean; }) {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-display font-bold text-slate-900">Mock Tests</h1><p className="text-slate-500 mt-1 text-sm">Your test history and scores</p></div>
      {loading ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="bg-white rounded-2xl p-5 border border-cream-dark animate-pulse h-20" />)}</div>
        : results.length === 0 ? <EmptyState icon={ClipboardList} title="No test results yet" desc="Mock tests are generated by teachers. Complete a course to unlock them." />
        : (
          <div className="space-y-3">
            {results.map((r, i) => {
              const pct = Math.round((r.score / r.total) * 100);
              return (
                <motion.div key={r._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-5 border border-cream-dark flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 font-display font-bold text-lg ${pct >= 70 ? "bg-emerald-50 text-emerald-600" : pct >= 40 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}`}>{pct}%</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">Test Result</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.score} / {r.total} correct · {new Date(r.createdAt).toLocaleDateString()}</p>
                    <div className="mt-2 h-1.5 bg-cream-dark rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${pct >= 70 ? "bg-emerald-50 text-emerald-600" : pct >= 40 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}`}>{pct >= 70 ? "Passed" : pct >= 40 ? "Average" : "Failed"}</span>
                </motion.div>
              );
            })}
          </div>
        )}
    </div>
  );
}

/* ── Certificates Tab ─────────────────────────────────── */
function CertificatesTab({ certificates, loading, switchTab }: { certificates: Certificate[]; loading: boolean; switchTab: (t: string) => void; }) {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-display font-bold text-slate-900">Certificates</h1><p className="text-slate-500 mt-1 text-sm">Complete 100% of a course to earn a certificate</p></div>
      {loading ? <div className="grid sm:grid-cols-2 gap-4">{[1,2].map(i => <div key={i} className="bg-white rounded-2xl p-6 border border-cream-dark animate-pulse h-36" />)}</div>
        : certificates.length === 0 ? (
          <EmptyState icon={Award} title="No certificates yet" desc="Complete 100% of a course to earn your certificate.">
            <button onClick={() => switchTab("courses")} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition"><BookOpen size={15} /> Browse Courses</button>
          </EmptyState>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {certificates.map((cert, i) => (
              <motion.div key={cert._id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                className="relative overflow-hidden bg-gradient-to-br from-teal to-[#14b8a6] rounded-2xl p-6 text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <Award size={32} className="mb-3 text-white/80" />
                <h3 className="font-display font-bold text-lg leading-snug mb-1">{cert.course?.title || "Course"}</h3>
                <p className="text-xs text-white/70 mb-3">Issued {new Date(cert.createdAt).toLocaleDateString()}</p>
                <p className="text-xs font-mono bg-white/20 rounded-lg px-3 py-1.5 inline-block">{cert.certificateId}</p>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
}

/* ── Reviews Tab ──────────────────────────────────────── */
function ReviewsTab({ enrollments, loading, reviewForm, setReviewForm, reviewMsg, onSubmit }: {
  enrollments: Enrollment[]; loading: boolean;
  reviewForm: Record<string, { rating: number; comment: string }>;
  setReviewForm: React.Dispatch<React.SetStateAction<Record<string, { rating: number; comment: string }>>>;
  reviewMsg: Record<string, string>; onSubmit: (courseId: string) => void;
}) {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-display font-bold text-slate-900">My Reviews</h1><p className="text-slate-500 mt-1 text-sm">Rate and review courses you've enrolled in</p></div>
      {loading ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="bg-white rounded-2xl p-5 border border-cream-dark animate-pulse h-32" />)}</div>
        : enrollments.length === 0 ? <EmptyState icon={MessageSquare} title="No courses to review" desc="Enroll in a course first to leave a review." />
        : (
          <div className="space-y-4">
            {enrollments.map((e, i) => {
              const courseId = e.course?._id;
              const form = reviewForm[courseId] || { rating: 5, comment: "" };
              const msg = reviewMsg[courseId];
              return (
                <motion.div key={e._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-5 border border-cream-dark">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0"><BookOpen size={18} className="text-teal" /></div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">{e.course?.title || "Course"}</h3>
                  </div>
                  {msg === "success" ? (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold"><CheckCircle2 size={16} /> Review submitted!</div>
                  ) : (
                    <div className="space-y-3">
                      {/* Star rating */}
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} type="button" onClick={() => setReviewForm(p => ({ ...p, [courseId]: { ...form, rating: n } }))}
                            className={`transition ${n <= form.rating ? "text-amber-400" : "text-slate-300"}`}>
                            <Star size={22} fill={n <= form.rating ? "currentColor" : "none"} />
                          </button>
                        ))}
                        <span className="ml-2 text-xs text-slate-500">{form.rating}/5</span>
                      </div>
                      <textarea value={form.comment} onChange={e2 => setReviewForm(p => ({ ...p, [courseId]: { ...form, comment: e2.target.value } }))}
                        placeholder="Share your experience with this course..." rows={3}
                        className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition resize-none" />
                      {msg && msg !== "loading" && <p className="text-xs text-red-400">{msg}</p>}
                      <button onClick={() => onSubmit(courseId)} disabled={msg === "loading" || !form.comment.trim()}
                        className="px-5 py-2.5 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 disabled:cursor-not-allowed">
                        {msg === "loading" ? "Submitting..." : "Submit Review"}
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
    </div>
  );
}

/* ── Teacher: My Courses Tab ──────────────────────────── */
interface ContentItem { _id: string; title: string; type: "video" | "pdf"; url: string; }

function MyCoursesTab({ courses, loading, loadMyCourses }: { courses: Course[]; loading: boolean; loadMyCourses: () => void; }) {
  const statusColor: Record<string, string> = {
    draft: "bg-slate-100 text-slate-500",
    pending: "bg-amber-50 text-amber-600",
    approved: "bg-emerald-50 text-emerald-600",
    rejected: "bg-red-50 text-red-500",
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [contentMap, setContentMap] = useState<Record<string, ContentItem[]>>({});
  const [contentLoading, setContentLoading] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishMsg, setPublishMsg] = useState<Record<string, string>>({});
  const [deletingContentId, setDeletingContentId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const toggleCourse = async (courseId: string) => {
    if (expandedId === courseId) { setExpandedId(null); return; }
    setExpandedId(courseId);
    if (!contentMap[courseId]) {
      setContentLoading(courseId);
      try {
        const items = await api.get<ContentItem[]>(`/content/${courseId}`);
        setContentMap(p => ({ ...p, [courseId]: Array.isArray(items) ? items : [] }));
      } catch { setContentMap(p => ({ ...p, [courseId]: [] })); }
      finally { setContentLoading(null); }
    }
  };

  const handlePublish = async (courseId: string) => {
    setPublishingId(courseId);
    setPublishMsg(p => ({ ...p, [courseId]: "" }));
    try {
      await api.patch(`/courses/${courseId}/publish`);
      setPublishMsg(p => ({ ...p, [courseId]: "published" }));
      loadMyCourses();
    } catch (err: unknown) {
      setPublishMsg(p => ({ ...p, [courseId]: err instanceof Error ? err.message : "Failed to publish" }));
    } finally { setPublishingId(null); }
  };

  const handleDeleteContent = async (contentId: string, courseId: string) => {
    setDeletingContentId(contentId);
    setConfirmDeleteId(null);
    try {
      await api.delete(`/content/${contentId}`);
      setContentMap(p => ({ ...p, [courseId]: (p[courseId] ?? []).filter(c => c._id !== contentId) }));
    } catch (err: unknown) {
      console.error(err);
    } finally { setDeletingContentId(null); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">My Courses</h1>
        <p className="text-slate-500 mt-1 text-sm">{courses.length} courses created</p>
      </div>

      {loading ? <SkeletonGrid /> : courses.length === 0
        ? <EmptyState icon={BookMarked} title="No courses yet" desc="Create your first course to get started." />
        : (
          <div className="space-y-4">
            {courses.map((c, i) => (
              <motion.div key={c._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-cream-dark overflow-hidden">

                {/* Course header row */}
                <div className="p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                    <BookMarked size={18} className="text-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-display font-bold text-slate-900 text-sm">{c.title}</h3>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${statusColor[c.status ?? "draft"]}`}>
                        {c.status ?? "draft"}
                      </span>
                      {c.isPublished && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal/10 text-teal flex items-center gap-1">
                          <CheckCircle2 size={11} /> Live
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{c.description || "No description."}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Publish button — only for approved + unpublished */}
                    {c.status === "approved" && !c.isPublished && (
                      <button
                        onClick={() => handlePublish(c._id)}
                        disabled={publishingId === c._id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-teal text-white text-xs font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50"
                      >
                        {publishingId === c._id
                          ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <Upload size={13} />}
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => toggleCourse(c._id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-cream text-slate-600 text-xs font-semibold rounded-xl hover:bg-cream-dark transition"
                    >
                      <PlayCircle size={13} />
                      Content
                      <ChevronDown size={13} className={`transition-transform ${expandedId === c._id ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Publish feedback */}
                {publishMsg[c._id] && publishMsg[c._id] !== "published" && (
                  <div className="px-5 pb-3 text-xs text-red-500">{publishMsg[c._id]}</div>
                )}
                {publishMsg[c._id] === "published" && (
                  <div className="px-5 pb-3 text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Course is now live and visible to students!
                  </div>
                )}

                {/* Workflow hint for non-approved courses */}
                {c.status === "draft" && (
                  <div className="px-5 pb-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                      This course is a draft. Go to <span className="font-semibold text-slate-700">Upload Content</span> to add materials, then submit for admin review from <span className="font-semibold text-slate-700">Create Course</span>.
                    </div>
                  </div>
                )}
                {c.status === "pending" && (
                  <div className="px-5 pb-4">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-700">
                      Waiting for admin approval. You'll be able to publish once approved.
                    </div>
                  </div>
                )}
                {c.status === "rejected" && (
                  <div className="px-5 pb-4">
                    <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-600">
                      This course was rejected. Edit the course details and resubmit for review.
                    </div>
                  </div>
                )}

                {/* Expanded content list */}
                <AnimatePresence>
                  {expandedId === c._id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="border-t border-cream-dark overflow-hidden">
                      <div className="p-5">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Course Materials</h4>
                        {contentLoading === c._id ? (
                          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                            <span className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin" /> Loading content...
                          </div>
                        ) : (contentMap[c._id] ?? []).length === 0 ? (
                          <div className="text-center py-6 text-slate-400">
                            <Upload size={28} className="mx-auto mb-2 opacity-40" />
                            <p className="text-sm">No content uploaded yet.</p>
                            <p className="text-xs mt-1">Go to <span className="font-semibold">Upload Content</span> to add videos or PDFs.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(contentMap[c._id] ?? []).map((item, idx) => (
                              <div key={item._id} className="rounded-xl border border-cream-dark overflow-hidden">
                                <div className="flex items-center gap-3 p-3 bg-cream">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === "video" ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-500"}`}>
                                    {item.type === "video" ? <PlayCircle size={15} /> : <FileCheck size={15} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{item.title || `Material ${idx + 1}`}</p>
                                    <p className="text-xs text-slate-400 capitalize">{item.type}</p>
                                  </div>
                                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-teal font-semibold hover:underline shrink-0 px-2">
                                    View
                                  </a>
                                  {deletingContentId === item._id ? (
                                    <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin shrink-0" />
                                  ) : (
                                    <button
                                      onClick={() => setConfirmDeleteId(confirmDeleteId === item._id ? null : item._id)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition shrink-0"
                                    >
                                      <XCircle size={13} /> Delete
                                    </button>
                                  )}
                                </div>
                                {/* Inline confirm */}
                                <AnimatePresence>
                                  {confirmDeleteId === item._id && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                                      className="overflow-hidden">
                                      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border-t border-red-100">
                                        <p className="text-xs text-red-700 font-medium">Remove <span className="font-bold">"{item.title || `Material ${idx + 1}`}"</span>? This cannot be undone.</p>
                                        <div className="flex gap-2 shrink-0">
                                          <button onClick={() => setConfirmDeleteId(null)}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                                            Cancel
                                          </button>
                                          <button onClick={() => handleDeleteContent(item._id, c._id)}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition">
                                            Yes, Delete
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
}

/* ── Teacher: Create Course Tab ───────────────────────── */
function CreateCourseTab({ switchTab }: { switchTab: (t: string) => void }) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [createdCourse, setCreatedCourse] = useState<Course | null>(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // after creation — submit for review
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    else if (form.title.trim().length < 3) e.title = "Title must be at least 3 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError("");
    try {
      const course = await api.post<Course>("/courses", {
        title: form.title.trim(),
        description: form.description.trim(),
      });
      setCreatedCourse(course);
      setStep("success");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to create course. Make sure you are logged in as a teacher.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!createdCourse) return;
    setSubmitLoading(true);
    setSubmitError("");
    try {
      await api.patch(`/courses/${createdCourse._id}/submit`);
      setSubmitDone(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit for review.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => {
    setStep("form");
    setCreatedCourse(null);
    setForm({ title: "", description: "" });
    setErrors({});
    setApiError("");
    setSubmitDone(false);
    setSubmitError("");
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">Create Course</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Courses are saved as drafts first, then submitted to admin for approval before going live.
        </p>
      </div>

      {/* Workflow steps indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { n: 1, label: "Create Draft" },
          { n: 2, label: "Submit for Review" },
          { n: 3, label: "Admin Approves" },
          { n: 4, label: "Published" },
        ].map((s, i, arr) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-1.5 ${step === "success" && s.n <= 2 ? "text-teal" : step === "form" && s.n === 1 ? "text-teal" : "text-slate-300"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step === "success" && s.n === 1 ? "bg-teal border-teal text-white" : step === "success" && s.n === 2 && submitDone ? "bg-teal border-teal text-white" : step === "form" && s.n === 1 ? "border-teal text-teal" : "border-slate-200 text-slate-300"}`}>
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
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Course Title <span className="text-red-400">*</span>
              </label>
              <input
                value={form.title}
                onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => ({ ...p, title: "" })); }}
                placeholder="e.g. Introduction to React"
                className={`w-full px-4 py-3 text-sm bg-cream rounded-xl border transition focus:outline-none focus:border-teal/50 ${errors.title ? "border-red-300 bg-red-50/30" : "border-cream-dark"}`}
              />
              {errors.title && <p className="mt-1.5 text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What will students learn in this course? Describe the topics, goals, and target audience."
                rows={5}
                className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/50 transition resize-none"
              />
              <p className="mt-1 text-xs text-slate-400">{form.description.length} characters</p>
            </div>

            {apiError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {apiError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-teal text-white font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                ) : (
                  <><Plus size={16} /> Create Course</>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center">
              The course will be saved as a <span className="font-semibold text-slate-500">draft</span>. You can submit it for admin review after creation.
            </p>
          </form>
        ) : (
          /* ── Success state ── */
          <div className="p-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200 mb-6">
              <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800 text-sm">Course created successfully!</p>
                <p className="text-xs text-emerald-600 mt-0.5">Saved as draft — now submit it for admin review to go live.</p>
              </div>
            </div>

            {/* Course summary card */}
            <div className="bg-cream rounded-xl border border-cream-dark p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                  <BookMarked size={18} className="text-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-slate-900 text-sm">{createdCourse?.title}</h3>
                  {createdCourse?.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{createdCourse.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      {submitDone ? "pending review" : "draft"}
                    </span>
                    <span className="text-xs text-slate-400">ID: {createdCourse?._id?.slice(-8)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit for review section */}
            {!submitDone ? (
              <div className="space-y-3">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm font-semibold text-amber-800 mb-1">Next step: Submit for Review</p>
                  <p className="text-xs text-amber-700">
                    Once submitted, an admin will review your course. After approval it will be published and visible to students.
                  </p>
                </div>
                {submitError && <p className="text-sm text-red-500">{submitError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitForReview}
                    disabled={submitLoading}
                    className="flex-1 py-3 bg-teal text-white font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitLoading ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                    ) : (
                      <><FileCheck size={16} /> Submit for Review</>
                    )}
                  </button>
                  <button
                    onClick={() => switchTab("my-courses")}
                    className="px-4 py-3 bg-cream text-slate-600 font-semibold rounded-xl hover:bg-cream-dark transition text-sm"
                  >
                    Save as Draft
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-teal/5 rounded-xl border border-teal/20">
                  <CheckCircle2 size={20} className="text-teal shrink-0" />
                  <div>
                    <p className="font-semibold text-teal text-sm">Submitted for review!</p>
                    <p className="text-xs text-slate-500 mt-0.5">An admin will review and approve your course shortly.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => switchTab("my-courses")}
                    className="flex-1 py-3 bg-teal text-white font-semibold rounded-xl hover:bg-teal-dark transition text-sm"
                  >
                    View My Courses
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-3 bg-cream text-slate-600 font-semibold rounded-xl hover:bg-cream-dark transition text-sm"
                  >
                    Create Another
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Teacher: Upload Content Tab ──────────────────────── */
const CLOUDINARY_CLOUD = "dg8or6094";
const CLOUDINARY_PRESET = "elearning_unsigned"; // create this in Cloudinary dashboard

function UploadContentTab({ courses, loadMyCourses }: { courses: Course[]; loadMyCourses: () => void; }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const xhrRef = useState<XMLHttpRequest | null>(null);

  useEffect(() => { if (courses.length === 0) loadMyCourses(); }, []);

  const handleCancel = () => {
    xhrRef[0]?.abort();
    xhrRef[1](null);
    setMsg("");
    setProgress(0);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !file) return;
    setMsg("loading");
    setProgress(0);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", CLOUDINARY_PRESET);
      fd.append("resource_type", "auto");

      const cloudRes = await new Promise<{ secure_url: string; public_id: string; resource_type: string }>(
        (resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef[1](xhr);
          xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`);
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 90));
          };
          xhr.onload = () => {
            xhrRef[1](null);
            const data = JSON.parse(xhr.responseText);
            if (xhr.status === 200) resolve(data);
            else reject(new Error(data.error?.message || "Cloudinary upload failed"));
          };
          xhr.onerror = () => { xhrRef[1](null); reject(new Error("Network error during upload")); };
          xhr.onabort = () => { xhrRef[1](null); reject(new Error("Upload cancelled")); };
          xhr.send(fd);
        }
      );

      setProgress(95);
      await api.post(`/content/${selectedCourse}/save-record`, {
        title: title || file.name,
        url: cloudRes.secure_url,
        publicId: cloudRes.public_id,
        resourceType: cloudRes.resource_type,
      });

      setProgress(100);
      setMsg("success");
      setFile(null);
      setTitle("");
      setSelectedCourse("");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Upload failed";
      setMsg(errMsg === "Upload cancelled" ? "" : errMsg);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">Upload Content</h1>
        <p className="text-slate-500 mt-1 text-sm">Add videos or PDFs to your courses — large files supported</p>
      </div>
      <div className="bg-white rounded-2xl border border-cream-dark p-6">

        {/* ── Uploading state ── */}
        {msg === "loading" ? (
          <div className="py-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                <Upload size={22} className="text-teal animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{file?.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{courses.find(c => c._id === selectedCourse)?.title}</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold text-teal">Uploading to Cloudinary...</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="h-3 bg-cream-dark rounded-full overflow-hidden">
                <motion.div className="h-full bg-teal rounded-full" initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
              </div>
              <p className="text-xs text-slate-400 mt-2">Please wait — do not close this tab</p>
            </div>
            <button type="button" onClick={handleCancel}
              className="w-full py-3 bg-red-50 text-red-500 font-semibold rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2">
              <XCircle size={16} /> Cancel Upload
            </button>
          </div>

        ) : msg === "success" ? (
          <div className="text-center py-10">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
            <h3 className="text-lg font-display font-bold text-slate-900 mb-2">Content Uploaded!</h3>
            <button onClick={() => { setMsg(""); setProgress(0); }} className="text-sm text-teal font-semibold hover:underline">Upload another</button>
          </div>

        ) : (
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Course *</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} required
                className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition">
                <option value="">Choose a course...</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Content Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Lesson 1 - Introduction"
                className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">File (Video or PDF) *</label>
              <div className="border-2 border-dashed border-cream-dark rounded-xl p-6 text-center hover:border-teal/40 transition cursor-pointer"
                onClick={() => document.getElementById("file-input")?.click()}>
                <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">{file ? file.name : "Click to select a file"}</p>
                <p className="text-xs text-slate-400 mt-1">MP4, PDF, PPT supported • No size limit</p>
                <input id="file-input" type="file" accept="video/*,.pdf,.ppt,.pptx" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
            {msg && <p className="text-sm text-red-500">{msg}</p>}
            <button type="submit" disabled={!selectedCourse || !file}
              className="w-full py-3 bg-teal text-white font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 disabled:cursor-not-allowed">
              Upload Content
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Teacher: AI Quiz Generator Tab ───────────────────── */
function AIQuizTab({ courses, loadMyCourses }: { courses: Course[]; loadMyCourses: () => void; }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [result, setResult] = useState<{ questions?: unknown[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (courses.length === 0) loadMyCourses(); }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !lessonContent.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const d = await api.post<{ questions: unknown[] }>("/ai/generate-quiz", {
        courseId: selectedCourse, lessonId: "lesson-1",
        lessonContent, courseTitle: courses.find(c => c._id === selectedCourse)?.title ?? "Course",
        numQuestions,
      });
      setResult(d);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to generate quiz"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6"><h1 className="text-2xl font-display font-bold text-slate-900">AI Quiz Generator</h1><p className="text-slate-500 mt-1 text-sm">Paste lesson content and let AI generate quiz questions</p></div>
      <div className="bg-white rounded-2xl border border-cream-dark p-6 mb-4">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Course *</label>
            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} required className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition">
              <option value="">Choose a course...</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lesson Content *</label>
            <textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)} placeholder="Paste the lesson text here..." rows={5} required
              className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Number of Questions</label>
            <input type="number" min={1} max={20} value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))}
              className="w-32 px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading || !selectedCourse || !lessonContent.trim()} className="w-full py-3 bg-teal text-white font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</span> : "Generate Quiz"}
          </button>
        </form>
      </div>
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-cream-dark p-6">
          <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" /> Quiz Generated</h3>
          <pre className="text-xs text-slate-600 bg-cream rounded-xl p-4 overflow-auto max-h-64 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </motion.div>
      )}
    </div>
  );
}

/* ── Admin: Dashboard Tab ─────────────────────────────── */
function AdminDashboardTab({ stats, loading }: { stats: AdminStats | null; loading: boolean; }) {
  if (loading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><SkeletonGrid /></div>;
  if (!stats) return <EmptyState icon={BarChart3} title="Could not load stats" desc="Make sure you are logged in as admin." />;
  const cards = [
    { label: "Total Users",       value: stats.totalUsers,                          icon: Users,      color: "bg-blue-50 text-blue-600" },
    { label: "Students",          value: stats.totalStudents,                       icon: GraduationCap, color: "bg-indigo-50 text-indigo-600" },
    { label: "Teachers",          value: stats.totalTeachers,                       icon: BookMarked, color: "bg-purple-50 text-purple-600" },
    { label: "Total Courses",     value: stats.totalCourses,                        icon: BookOpen,   color: "bg-teal/10 text-teal" },
    { label: "Published Courses", value: stats.publishedCourses,                    icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { label: "Total Enrollments", value: stats.totalEnrollments,                    icon: PlayCircle, color: "bg-amber-50 text-amber-600" },
    { label: "Avg Completion",    value: `${Math.round(stats.averageCompletion)}%`, icon: TrendingUp, color: "bg-rose-50 text-rose-600" },
  ];
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-display font-bold text-slate-900">Admin Dashboard</h1><p className="text-slate-500 mt-1 text-sm">Platform-wide statistics</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl p-5 border border-cream-dark">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color}`}><c.icon size={19} /></div>
            <p className="text-2xl font-display font-bold text-slate-900">{c.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Admin: Pending Courses Tab ───────────────────────── */
function PendingCoursesTab({ courses, loading, onApprove, onReject }: { courses: Course[]; loading: boolean; onApprove: (id: string) => void; onReject: (id: string) => void; }) {
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-display font-bold text-slate-900">Pending Courses</h1><p className="text-slate-500 mt-1 text-sm">{courses.length} course{courses.length !== 1 ? "s" : ""} awaiting review</p></div>
      {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl p-5 border border-cream-dark animate-pulse h-24" />)}</div>
        : courses.length === 0 ? <EmptyState icon={FileCheck} title="No pending courses" desc="All courses have been reviewed." />
        : (
          <div className="space-y-3">
            {courses.map((c, i) => (
              <motion.div key={c._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl p-5 border border-cream-dark flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><FileCheck size={18} className="text-amber-600" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-slate-900 text-sm mb-1">{c.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{c.description || "No description."}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => onApprove(c._id)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition"><CheckCircle2 size={14} /> Approve</button>
                  <button onClick={() => onReject(c._id)} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 text-xs font-semibold rounded-xl hover:bg-red-100 transition"><XCircle size={14} /> Reject</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
}

/* ── Shared helpers ───────────────────────────────────── */
function EmptyState({ icon: Icon, title, desc, children }: { icon: React.ElementType; title: string; desc: string; children?: React.ReactNode; }) {
  return (
    <div className="text-center py-20">
      <Icon size={44} className="mx-auto text-slate-300 mb-4" />
      <h3 className="text-base font-semibold text-slate-600 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{desc}</p>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string; }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center shrink-0"><Icon size={15} className="text-slate-500" /></div>
      <div><p className="text-xs text-slate-400">{label}</p><p className="text-sm font-semibold text-slate-800">{value}</p></div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-cream-dark animate-pulse">
          <div className="h-10 w-10 bg-cream-dark rounded-xl mb-4" />
          <div className="h-4 bg-cream-dark rounded w-3/4 mb-3" />
          <div className="h-3 bg-cream-dark rounded w-full mb-2" />
          <div className="h-3 bg-cream-dark rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}
