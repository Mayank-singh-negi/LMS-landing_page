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
interface Course { _id: string; title: string; description: string; averageRating: number; status?: string; isPublished?: boolean; thumbnail?: string; }
interface Enrollment { _id: string; course: Course; progress: number; createdAt: string; }
interface Certificate { _id: string; course: Course; certificateId: string; createdAt: string; }
interface TestResult { _id: string; score: number; total: number; createdAt: string; }
interface AdminStats { totalUsers: number; totalStudents: number; totalTeachers: number; totalCourses: number; publishedCourses: number; totalEnrollments: number; averageCompletion: number; }
interface StudentEnrollment { _id: string; student: { _id: string; name: string; email: string; avatar?: string }; progress: number; enrolledAt: string; }
interface CourseAnalytics { totalEnrollments: number; completed: number; inProgress: number; notStarted: number; avgProgress: number; completionRate: number; totalReviews: number; avgRating: number; }
interface Review { _id: string; course?: Course; student?: { name: string }; rating: number; comment: string; createdAt: string; }

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
  { id: "overview",         label: "Overview",          icon: LayoutDashboard },
  { id: "my-courses",       label: "My Courses",        icon: BookMarked },
  { id: "create-course",    label: "Create Course",     icon: Plus },
  { id: "upload-content",   label: "Upload Content",    icon: Upload },
  { id: "teacher-students", label: "Students",          icon: Users },
  { id: "teacher-analytics",label: "Analytics",         icon: BarChart3 },
  { id: "ai-quiz",          label: "AI Quiz Generator", icon: BrainCircuit },
  { id: "profile",          label: "Profile",           icon: User },
];

const ADMIN_NAV = [
  { id: "overview",         label: "Overview",         icon: LayoutDashboard },
  { id: "admin-dashboard",  label: "Admin Dashboard",  icon: BarChart3 },
  { id: "pending-courses",  label: "Pending Courses",  icon: FileCheck },
  { id: "courses",          label: "Browse Courses",   icon: BookOpen },
  { id: "profile",          label: "Profile",          icon: User },
];

/* ── Notification Bell ──────────────────────────────────── */
function NotificationBell({ role, enrollments, myCourses, switchTab }: {
  role: string; enrollments: Enrollment[]; myCourses: Course[];
  switchTab: (t: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const notifications = (() => {
    const items: { icon: React.ReactNode; text: string; sub: string; action?: string; color: string }[] = [];

    if (role === "student") {
      if (enrollments.length === 0) {
        items.push({ icon: <BookOpen size={15} />, text: "Start learning today", sub: "Browse available courses", action: "courses", color: "bg-blue-50 text-blue-600" });
      }
      const inProgress = enrollments.filter(e => e.progress > 0 && e.progress < 100);
      if (inProgress.length > 0) {
        items.push({ icon: <PlayCircle size={15} />, text: `${inProgress.length} course${inProgress.length > 1 ? "s" : ""} in progress`, sub: "Continue where you left off", action: "enrollments", color: "bg-teal/10 text-teal" });
      }
      const completed = enrollments.filter(e => e.progress >= 100);
      if (completed.length > 0) {
        items.push({ icon: <Award size={15} />, text: `${completed.length} course${completed.length > 1 ? "s" : ""} completed`, sub: "Claim your certificates", action: "certificates", color: "bg-amber-50 text-amber-600" });
      }
      items.push({ icon: <Zap size={15} />, text: "Keep your streak alive 🔥", sub: "Log in daily to maintain streak", color: "bg-purple-50 text-purple-600" });
    }

    if (role === "teacher") {
      const drafts = myCourses.filter(c => c.status === "draft");
      const pending = myCourses.filter(c => c.status === "pending");
      const approved = myCourses.filter(c => c.status === "approved" && !c.isPublished);
      if (drafts.length > 0) items.push({ icon: <BookMarked size={15} />, text: `${drafts.length} draft course${drafts.length > 1 ? "s" : ""}`, sub: "Upload content & submit for review", action: "my-courses", color: "bg-slate-100 text-slate-600" });
      if (pending.length > 0) items.push({ icon: <ClipboardList size={15} />, text: `${pending.length} course${pending.length > 1 ? "s" : ""} pending review`, sub: "Waiting for admin approval", action: "my-courses", color: "bg-amber-50 text-amber-600" });
      if (approved.length > 0) items.push({ icon: <CheckCircle2 size={15} />, text: `${approved.length} course${approved.length > 1 ? "s" : ""} approved`, sub: "Ready to publish!", action: "my-courses", color: "bg-emerald-50 text-emerald-600" });
      items.push({ icon: <BrainCircuit size={15} />, text: "Generate a quiz", sub: "Create AI-powered quiz for students", action: "ai-quiz", color: "bg-indigo-50 text-indigo-600" });
    }

    if (role === "admin") {
      items.push({ icon: <FileCheck size={15} />, text: "Review pending courses", sub: "Approve or reject submissions", action: "pending-courses", color: "bg-amber-50 text-amber-600" });
      items.push({ icon: <BarChart3 size={15} />, text: "View platform stats", sub: "Check overall platform health", action: "admin-dashboard", color: "bg-blue-50 text-blue-600" });
    }

    return items;
  })();

  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-cream rounded-xl transition">
        <Bell size={19} />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal rounded-full animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 z-50 w-80 bg-white rounded-2xl shadow-xl border border-cream-dark overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-cream-dark flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                <span className="text-xs font-bold text-white bg-teal px-2 py-0.5 rounded-full">{notifications.length}</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Bell size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No notifications</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <button key={i} onClick={() => { if (n.action) switchTab(n.action); setOpen(false); }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-cream transition-colors text-left border-b border-cream-dark last:border-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${n.color}`}>
                        {n.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{n.text}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.sub}</p>
                      </div>
                      {n.action && <ChevronRight size={14} className="text-slate-300 shrink-0 mt-1" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  const [myReviews, setMyReviews] = useState<Review[]>([]);
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

  // review form
  const [reviewForm, setReviewForm] = useState<Record<string, { rating: number; comment: string }>>({});
  const [reviewMsg, setReviewMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    const loaders: Record<string, () => Promise<void>> = {
      courses:              () => loadCourses(),
      enrollments:          () => loadEnrollments(),
      certificates:         () => loadCertificates(),
      mocktests:            () => loadTestResults(),
      reviews:              () => loadReviews(),
      "my-courses":         () => loadMyCourses(),
      "teacher-students":   () => loadMyCourses(),
      "teacher-analytics":  () => loadMyCourses(),
      "admin-dashboard":    () => loadAdminStats(),
      "pending-courses":    () => loadPendingCourses(),
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
    if (Array.isArray(enrolled) && enrolled.length > 0) {
      const alreadyEnrolled: Record<string, string> = {};
      enrolled.forEach(e => {
        const cid = String(e.course?._id ?? e.course);
        if (cid) alreadyEnrolled[cid] = "success";
      });
      setEnrollMsg(p => ({ ...p, ...alreadyEnrolled }));
    }
  });
  const loadEnrollments  = () => withLoading(async () => { const d = await api.get<Enrollment[]>("/enrollments/me"); setEnrollments(Array.isArray(d) ? d : []); });
  const loadCertificates = () => withLoading(async () => {
    // Fetch real certificates from backend
    const d = await api.get<Certificate[]>("/certificates/my").catch(() => [] as Certificate[]);
    setCertificates(Array.isArray(d) ? d : []);
  });
  const loadTestResults  = () => withLoading(async () => { const d = await api.get<TestResult[]>("/testresults/my-results"); setTestResults(Array.isArray(d) ? d : []); });
  const loadReviews      = () => withLoading(async () => {
    const [enrollData, reviewData] = await Promise.all([
      api.get<Enrollment[]>("/enrollments/me").catch(() => [] as Enrollment[]),
      api.get<Review[]>("/reviews/my").catch(() => [] as Review[]),
    ]);
    setEnrollments(Array.isArray(enrollData) ? enrollData : []);
    setMyReviews(Array.isArray(reviewData) ? reviewData : []);
  });
  const loadMyCourses    = () => withLoading(async () => { const d = await api.get<Course[]>("/courses/my-courses"); setMyCourses(Array.isArray(d) ? d : []); });
  const loadAdminStats   = () => withLoading(async () => { const d = await api.get<AdminStats>("/admin/dashboard"); setAdminStats(d); });
  const loadPendingCourses = () => withLoading(async () => { const d = await api.get<Course[]>("/admin/pending-courses"); setPendingCourses(Array.isArray(d) ? d : []); });

  const handleEnroll = async (courseId: string) => {
    setEnrollMsg(p => ({ ...p, [courseId]: "loading" }));
    try {
      await api.post(`/enrollments/${courseId}`, {});
      setEnrollMsg(p => ({ ...p, [courseId]: "success" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      if (msg.toLowerCase().includes("already enrolled")) {
        setEnrollMsg(p => ({ ...p, [courseId]: "success" }));
      } else {
        setEnrollMsg(p => ({ ...p, [courseId]: msg }));
      }
    }
  };

  const handleApprove = async (id: string) => {
    try { await api.put(`/admin/approve/${id}`); loadPendingCourses(); }
    catch { /* ignore */ }
  };
  const handleReject = async (id: string, reason: string) => {
    try { await api.put(`/admin/reject/${id}`, { reason }); loadPendingCourses(); }
    catch { /* ignore */ }
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQ.trim()) return;
    setAiLoading(true); setAiA("");
    try {
      const d = await api.post<{ success: boolean; data: { answer: string } }>("/ai/ask-doubt", {
        question: aiQ,
        courseId: "general",
        lessonId: "general",
        lessonContent: "General learning question about any topic",
        courseTitle: "General Learning",
      });
      setAiA(d.data?.answer || (d as any).answer || "No response received.");
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-teal flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>

        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 shrink-0 border-b border-white/10">
          <div className="w-8 h-8 rounded-xl bg-teal-light/30 flex items-center justify-center overflow-hidden shrink-0">
            <img src="/logo.jpeg" alt="Learnovora" className="w-6 h-6 object-contain mix-blend-screen" />
          </div>
          <span className="font-display font-extrabold text-lg text-white tracking-tight">Learnovora</span>
          <button className="ml-auto lg:hidden text-white/50 hover:text-white transition" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">

          {/* Main Menu label */}
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mb-2">Main Menu</p>
            <div className="space-y-0.5">
              {NAV.filter(item => item.id !== "profile").map(item => (
                <button key={item.id} onClick={() => switchTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    tab === item.id
                      ? "bg-teal text-white shadow-lg shadow-teal/30"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}>
                  <item.icon size={17} className="shrink-0" />
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {tab === item.id && <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Account section */}
          <div>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mb-2">Account</p>
            <div className="space-y-0.5">
              <button onClick={() => switchTab("profile")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  tab === "profile"
                    ? "bg-teal text-white shadow-lg shadow-teal/30"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}>
                <User size={17} className="shrink-0" />
                <span className="flex-1 text-left">Profile</span>
                {tab === "profile" && <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />}
              </button>
            </div>
          </div>
        </div>

        {/* User card at bottom */}
        <div className="p-3 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-xl object-cover shrink-0 ring-2 ring-white/20" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-light to-teal flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-white/50 capitalize">{role}</p>
            </div>
          </div>
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
            <NotificationBell role={role} enrollments={enrollments} myCourses={myCourses} switchTab={switchTab} />
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
              {tab === "mocktests"    && <MockTestsTab results={testResults} loading={loading} enrollments={enrollments} />}
              {tab === "certificates" && <CertificatesTab certificates={certificates} loading={loading} switchTab={switchTab} enrollments={enrollments} onCertGenerated={(c) => setCertificates(p => [...p.filter(x => x._id !== c._id), c])} />}
              {tab === "reviews"      && <ReviewsTab enrollments={enrollments} myReviews={myReviews} loading={loading} reviewForm={reviewForm} setReviewForm={setReviewForm} reviewMsg={reviewMsg} onSubmit={handleSubmitReview} />}

              {/* ── TEACHER tabs ── */}
              {tab === "my-courses"          && <MyCoursesTab courses={myCourses} loading={loading} loadMyCourses={loadMyCourses} />}
              {tab === "create-course"       && <CreateCourseTab switchTab={switchTab} />}
              {tab === "upload-content"      && <UploadContentTab courses={myCourses} loadMyCourses={loadMyCourses} />}
              {tab === "teacher-students"    && <TeacherStudentsTab courses={myCourses} loading={loading} />}
              {tab === "teacher-analytics"   && <TeacherAnalyticsTab courses={myCourses} loading={loading} />}
              {tab === "ai-quiz"             && <AIQuizTab courses={myCourses} loadMyCourses={loadMyCourses} />}

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
  const [name, setName] = useState(user?.name ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "security">("profile");
  // Change password state
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);

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
      setAvatarFile(null);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { setPwMsg("All fields are required"); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg("New passwords do not match"); return; }
    if (pwForm.newPw.length < 8) { setPwMsg("New password must be at least 8 characters"); return; }
    setPwLoading(true); setPwMsg("");
    try {
      await api.patch("/auth/change-password", { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwMsg("success");
      setPwForm({ current: "", newPw: "", confirm: "" });
      setShowPwForm(false);
    } catch (err: unknown) {
      setPwMsg(err instanceof Error ? err.message : "Failed to change password");
    } finally { setPwLoading(false); }
  };

  const avatar = avatarPreview || user?.avatar || "";
  const roleLabel = role === "admin" ? "Admin" : role === "teacher" ? "Instructor" : "Student";
  const roleColor = role === "admin" ? "bg-red-50 text-red-600 border-red-200" : role === "teacher" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-blue-50 text-blue-600 border-blue-200";

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-display font-bold text-slate-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden shadow-sm">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal relative" />

        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="relative">
              {avatar ? (
                <img src={avatar} alt="avatar"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal to-teal-light border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              {/* Edit avatar button */}
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-teal rounded-full flex items-center justify-center cursor-pointer border-2 border-white shadow hover:bg-teal-dark transition">
                <Upload size={13} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            {/* Role badge */}
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${roleColor}`}>{roleLabel}</span>
          </div>

          {/* Success message */}
          {msg === "saved" && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 size={14} /> Profile updated successfully
            </div>
          )}
          {msg && msg !== "saved" && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{msg}</div>
          )}

          {/* Display Name */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Display Name</label>
            <div className="flex gap-2">
              <input value={name} onChange={e => setName(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-teal/50 transition" />
              <button onClick={handleSave} disabled={saving || name.trim() === user?.name}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? "..." : "Save"}
              </button>
            </div>
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <input value={user?.email ?? ""} readOnly
              className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 text-slate-500 cursor-not-allowed" />
          </div>

          {/* Divider + hint */}
          <div className="border-t border-slate-100 pt-5 mb-4">
            <p className="text-xs text-slate-500 mb-3">To change your profile picture or manage security settings:</p>
            <button onClick={() => setShowSettings(true)}
              className="w-full py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-blue-600 hover:bg-slate-50 transition">
              Open Full Profile Settings
            </button>
          </div>

          {/* Sign out */}
          <button onClick={onLogout}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition font-medium">
            <LogOut size={14} /> ← Sign Out
          </button>
        </div>
      </div>

      {/* Full Profile Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSettings(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal header */}
                <div className="flex items-center justify-end px-6 py-4 border-b border-slate-100">
                  <button onClick={() => setShowSettings(false)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition text-slate-600">
                    <X size={16} />
                  </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  {/* Left sidebar */}
                  <div className="w-64 bg-slate-50 border-r border-slate-100 p-6 shrink-0">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Account</h2>
                    <p className="text-sm text-slate-500 mb-6">Manage your account info.</p>
                    <nav className="space-y-1">
                      <button onClick={() => setSettingsTab("profile")}
                        className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${settingsTab === "profile" ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:bg-white/60"}`}>
                        <User size={16} /> Profile
                      </button>
                      <button onClick={() => setSettingsTab("security")}
                        className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${settingsTab === "security" ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:bg-white/60"}`}>
                        <ShieldCheck size={16} /> Security
                      </button>
                    </nav>
                  </div>

                  {/* Right content */}
                  <div className="flex-1 overflow-y-auto p-8">
                    {settingsTab === "profile" && (
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-8">Profile details</h3>

                        {/* Profile row */}
                        <div className="flex items-center justify-between py-5 border-b border-slate-100">
                          <span className="text-sm font-semibold text-slate-700 w-40 shrink-0">Profile</span>
                          <div className="flex items-center gap-3 flex-1">
                            {avatar ? (
                              <img src={avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-teal-light flex items-center justify-center text-white font-bold text-sm">
                                {user?.name?.[0]?.toUpperCase() ?? "U"}
                              </div>
                            )}
                            <span className="text-sm text-slate-800 font-medium">{user?.name}</span>
                          </div>
                          <label className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer shrink-0">
                            Update profile
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                          </label>
                        </div>

                        {/* Email row */}
                        <div className="py-5 border-b border-slate-100">
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-semibold text-slate-700 w-40 shrink-0 pt-0.5">Email address</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-800">{user?.email}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">Primary</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsTab === "security" && (
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-8">Security</h3>

                        {/* Change Password */}
                        <div className="py-5 border-b border-slate-100">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-700">Password</p>
                              <p className="text-xs text-slate-400 mt-1">Set a strong password to protect your account</p>
                              {pwMsg === "success" && (
                                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle2 size={12} /> Password changed successfully</p>
                              )}
                            </div>
                            <button onClick={() => { setShowPwForm(p => !p); setPwMsg(""); }}
                              className="text-sm font-semibold text-blue-600 hover:underline shrink-0 ml-4">
                              {showPwForm ? "Cancel" : "Change password"}
                            </button>
                          </div>
                          <AnimatePresence>
                            {showPwForm && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                <div className="mt-4 space-y-3 max-w-sm">
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Current password</label>
                                    <input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                                      placeholder="Enter current password"
                                      className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 transition" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">New password</label>
                                    <input type="password" value={pwForm.newPw} onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                                      placeholder="Min 8 characters"
                                      className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 transition" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm new password</label>
                                    <input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                                      placeholder="Repeat new password"
                                      className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-blue-400 transition" />
                                  </div>
                                  {pwMsg && pwMsg !== "success" && <p className="text-xs text-red-500">{pwMsg}</p>}
                                  <button onClick={handleChangePassword} disabled={pwLoading}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                                    {pwLoading ? "Saving..." : "Save new password"}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* 2FA */}
                        <div className="py-5 border-b border-slate-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Two-factor authentication</p>
                              <p className="text-xs text-slate-400 mt-1">Add an extra layer of security to your account</p>
                            </div>
                            <button onClick={() => alert("2FA feature coming soon!")}
                              className="text-sm font-semibold text-blue-600 hover:underline">Enable</button>
                          </div>
                        </div>

                        {/* Active sessions */}
                        <div className="py-5">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Active sessions</p>
                              <p className="text-xs text-slate-400 mt-1">You are currently signed in on this device</p>
                              <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200 max-w-sm">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                <span>Current session — {new Date().toLocaleDateString()}</span>
                              </div>
                            </div>
                            <button onClick={() => { onLogout(); setShowSettings(false); }}
                              className="text-sm font-semibold text-red-500 hover:underline shrink-0 ml-4">Sign out all</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck size={12} />
                  <span>Secured by Learnovora</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Overview Tab ─────────────────────────────────────── */
function OverviewTab({ user, role, enrollments, certificates, myCourses, adminStats, switchTab, greeting, loadEnrollments, loadMyCourses, loadAdminStats }: {
  user: { name: string; avatar?: string } | null; role: string;
  enrollments: Enrollment[]; certificates: Certificate[]; myCourses: Course[];
  adminStats: AdminStats | null; switchTab: (t: string) => void; greeting: () => string;
  loadEnrollments: () => void; loadMyCourses: () => void; loadAdminStats: () => void;
}) {
  useEffect(() => {
    if (role === "student") loadEnrollments();
    if (role === "teacher") loadMyCourses();
    if (role === "admin") loadAdminStats();
  }, []);

  const inProgress = enrollments.filter(e => e.progress > 0 && e.progress < 100);
  const featuredCourse = inProgress[0] ?? enrollments[0] ?? null;

  const studentStats = [
    { label: "Enrolled",     value: enrollments.length,                                icon: BookOpen,     color: "bg-blue-50 text-blue-600",    border: "border-blue-100" },
    { label: "Completed",    value: enrollments.filter(e => e.progress >= 100).length, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", border: "border-emerald-100" },
    { label: "Certificates", value: certificates.length,                               icon: Award,        color: "bg-amber-50 text-amber-600",  border: "border-amber-100" },
    { label: "Streak Days",  value: 1,                                                 icon: Zap,          color: "bg-purple-50 text-purple-600", border: "border-purple-100" },
  ];

  const teacherStats = [
    { label: "My Courses",   value: myCourses.length,                                     icon: BookMarked,   color: "bg-blue-50 text-blue-600",    border: "border-blue-100" },
    { label: "Published",    value: myCourses.filter(c => c.isPublished).length,          icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", border: "border-emerald-100" },
    { label: "Pending",      value: myCourses.filter(c => c.status === "pending").length, icon: ClipboardList,color: "bg-amber-50 text-amber-600",  border: "border-amber-100" },
    { label: "Drafts",       value: myCourses.filter(c => c.status === "draft").length,   icon: Settings,     color: "bg-slate-100 text-slate-600", border: "border-slate-200" },
  ];

  const adminStatCards = adminStats ? [
    { label: "Total Users",    value: adminStats.totalUsers,       icon: Users,     color: "bg-blue-50 text-blue-600",    border: "border-blue-100" },
    { label: "Total Courses",  value: adminStats.totalCourses,     icon: BookOpen,  color: "bg-indigo-50 text-indigo-600", border: "border-indigo-100" },
    { label: "Enrollments",    value: adminStats.totalEnrollments, icon: PlayCircle,color: "bg-emerald-50 text-emerald-600", border: "border-emerald-100" },
    { label: "Avg Completion", value: `${Math.round(adminStats.averageCompletion)}%`, icon: TrendingUp, color: "bg-amber-50 text-amber-600", border: "border-amber-100" },
  ] : [];

  const stats = role === "admin" ? adminStatCards : role === "teacher" ? teacherStats : studentStats;

  const studentActions = [
    { icon: BookOpen,      title: "Browse Courses",    desc: "Explore the full library",      color: "bg-blue-500",   tab: "courses" },
    { icon: BrainCircuit,  title: "AI Tutor",           desc: "Get instant answers",           color: "bg-indigo-500", tab: "ai" },
    { icon: ClipboardList, title: "Mock Tests",         desc: "Practice with timed exams",     color: "bg-rose-500",   tab: "mocktests" },
    { icon: Award,         title: "Certificates",       desc: "View your earned certificates", color: "bg-amber-500",  tab: "certificates" },
  ];

  const teacherActions = [
    { icon: BookMarked,   title: "My Courses",        desc: "Manage your created courses",   color: "bg-blue-500",   tab: "my-courses" },
    { icon: Plus,         title: "Create Course",     desc: "Start a new course",            color: "bg-teal",       tab: "create-course" },
    { icon: Users,        title: "Students",          desc: "View enrolled students",        color: "bg-indigo-500", tab: "teacher-students" },
    { icon: BarChart3,    title: "Analytics",         desc: "Track course performance",      color: "bg-rose-500",   tab: "teacher-analytics" },
  ];

  const adminActions = [
    { icon: BarChart3,   title: "Admin Dashboard",  desc: "Platform-wide statistics",      color: "bg-blue-500",  tab: "admin-dashboard" },
    { icon: FileCheck,   title: "Pending Courses",  desc: "Approve or reject submissions", color: "bg-amber-500", tab: "pending-courses" },
    { icon: BookOpen,    title: "Browse Courses",   desc: "View all published courses",    color: "bg-teal",      tab: "courses" },
  ];

  const actions = role === "admin" ? adminActions : role === "teacher" ? teacherActions : studentActions;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal/20 shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal to-teal-light flex items-center justify-center text-white font-bold text-xl shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-teal uppercase tracking-widest mb-0.5">{greeting()}</p>
            <h1 className="text-2xl font-display font-bold text-slate-900">{user?.name?.split(" ")[0]} 👋</h1>
            <p className="text-sm text-slate-500 mt-0.5">Here's your learning snapshot for today.</p>
          </div>
        </div>
        {role === "student" && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => switchTab("enrollments")}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition-all hover:-translate-y-0.5 shadow-md shadow-teal/20">
              <PlayCircle size={15} /> Resume Learning
            </button>
            <button onClick={() => switchTab("courses")}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-cream-dark text-slate-700 text-sm font-semibold rounded-xl hover:bg-cream transition-all hover:-translate-y-0.5">
              <BookOpen size={15} /> Browse
            </button>
          </div>
        )}
      </div>

      {/* ── Featured Continue Learning Card (student only) ── */}
      {role === "student" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {featuredCourse ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#004643] via-teal to-teal-light p-6 text-white shadow-xl shadow-teal/20 hover:shadow-2xl hover:shadow-teal/25 transition-all duration-300">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
                      <PlayCircle size={11} /> Continue Learning
                    </span>
                    <span className="text-xs text-white/70 font-medium">{featuredCourse.progress}% complete</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold leading-snug mb-3 truncate">
                    {featuredCourse.course?.title || "Your Course"}
                  </h2>
                  <div className="w-full max-w-sm mb-1">
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${featuredCourse.progress}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-white rounded-full" />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-white/50">Progress</span>
                      <span className="text-[10px] text-white/70 font-semibold">{featuredCourse.progress}%</span>
                    </div>
                  </div>
                  <button onClick={() => switchTab("enrollments")}
                    className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-teal font-bold text-sm rounded-xl hover:bg-white/90 active:scale-95 transition-all shadow-lg hover:-translate-y-0.5">
                    <PlayCircle size={15} /> Resume Course
                  </button>
                </div>
                <div className="hidden sm:flex flex-col items-center justify-center w-28 h-28 rounded-2xl bg-white/10 backdrop-blur-sm shrink-0 border border-white/10">
                  <BookOpen size={36} className="text-white/60 mb-1" />
                  <span className="text-[10px] text-white/50 font-medium">In Progress</span>
                </div>
              </div>
            </div>
          ) : (
            /* No enrollments fallback */
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 p-6 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="flex-1">
                  <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full mb-3 inline-block">Start Learning</span>
                  <h2 className="text-xl font-display font-bold mb-2">You haven't enrolled in any course yet</h2>
                  <p className="text-sm text-white/60 mb-4">Browse our top-rated courses and start your learning journey today.</p>
                  <button onClick={() => switchTab("courses")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-800 font-bold text-sm rounded-xl hover:bg-white/90 transition-all shadow-lg">
                    <BookOpen size={15} /> Browse Courses
                  </button>
                </div>
                <div className="hidden sm:flex items-center justify-center w-24 h-24 rounded-2xl bg-white/10 shrink-0">
                  <GraduationCap size={40} className="text-white/40" />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`bg-white rounded-2xl p-4 sm:p-5 border ${s.border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-default`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon size={19} />
            </div>
            <p className="text-2xl font-display font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {actions.map((a, i) => (
            <motion.button key={a.tab}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
              whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => switchTab(a.tab)}
              className="w-full text-left bg-white rounded-2xl p-4 sm:p-5 border border-cream-dark hover:border-teal/20 hover:shadow-xl hover:shadow-teal/5 transition-all duration-300 group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${a.color} group-hover:scale-110 transition-transform duration-300`}>
                <a.icon size={19} className="text-white" />
              </div>
              <p className="font-display font-bold text-slate-900 text-sm mb-0.5">{a.title}</p>
              <p className="text-xs text-slate-500">{a.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-teal opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Open <ChevronRight size={12} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Bottom Row: Streak + Recent Activity ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Streak card */}
        {role === "student" && (
          <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">Learning Streak</p>
              <div className="flex items-end gap-2 mb-1">
                <p className="text-4xl font-display font-bold">1</p>
                <p className="text-lg font-semibold text-white/80 mb-1">Day 🔥</p>
              </div>
              <p className="text-xs text-white/60 mb-4">Log in daily to grow your streak.</p>
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  {["M","T","W","T","F","S","S"].map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-full h-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-white/20"}`} />
                      <span className="text-[9px] text-white/40 font-medium">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent enrollments / activity */}
        {role === "student" && (
          <div className="bg-white rounded-2xl border border-cream-dark p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Clock size={14} className="text-teal" /> Recent Activity
            </h3>
            {enrollments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-5 text-center">
                <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center mb-3">
                  <BookOpen size={24} className="text-teal/50" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">No activity yet</p>
                <p className="text-xs text-slate-400 mb-3">Enroll in a course to start tracking your progress.</p>
                <button onClick={() => switchTab("courses")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal text-white text-xs font-semibold rounded-xl hover:bg-teal-dark transition-all hover:-translate-y-0.5">
                  <BookOpen size={12} /> Browse Courses
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {enrollments.slice(0, 4).map((e) => (
                  <div key={e._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-cream transition-colors cursor-pointer" onClick={() => switchTab("enrollments")}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${e.progress >= 100 ? "bg-emerald-50 text-emerald-500" : e.progress > 0 ? "bg-blue-50 text-blue-500" : "bg-slate-100 text-slate-400"}`}>
                      {e.progress >= 100 ? <CheckCircle2 size={14} /> : <PlayCircle size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{e.course?.title || "Course"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1 bg-cream-dark rounded-full overflow-hidden">
                          <motion.div className="h-full bg-teal rounded-full" initial={{ width: 0 }}
                            animate={{ width: `${e.progress}%` }} transition={{ duration: 0.8 }} />
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">{e.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
                {enrollments.length > 4 && (
                  <button onClick={() => switchTab("enrollments")} className="w-full text-center text-xs text-teal font-semibold py-1.5 hover:underline">
                    View all {enrollments.length} courses →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Teacher: course status summary */}
        {role === "teacher" && (
          <div className="bg-white rounded-2xl border border-cream-dark p-5 sm:col-span-2">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-teal" /> Course Status
            </h3>
            {myCourses.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No courses yet. Create your first course!</p>
            ) : (
              <div className="space-y-2.5">
                {myCourses.slice(0, 4).map(c => (
                  <div key={c._id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">
                      <BookMarked size={14} className="text-teal" />
                    </div>
                    <p className="flex-1 text-xs font-semibold text-slate-800 truncate">{c.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${c.isPublished ? "bg-emerald-50 text-emerald-600" : c.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                      {c.isPublished ? "Live" : c.status ?? "draft"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Courses Tab ──────────────────────────────────────── */
function CoursesTab({ courses, loading, enrollMsg, onEnroll }: { courses: Course[]; loading: boolean; enrollMsg: Record<string, string>; onEnroll: (id: string) => void; }) {
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  // If a course is selected, show detail view
  if (selectedCourse) {
    const status = enrollMsg[selectedCourse._id];
    const isEnrolled = status === "success";
    return (
      <div className="min-h-full bg-[#f8f9fb]">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => setSelectedCourse(null)} className="flex items-center gap-1 text-teal hover:underline font-medium">
            <ChevronRight size={14} className="rotate-180" /> Browse Courses
          </button>
          <span>/</span>
          <span className="text-slate-700 font-medium truncate">{selectedCourse.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT */}
          <div className="lg:col-span-2 min-w-0 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-tight">{selectedCourse.title}</h1>
              <p className="text-sm sm:text-base text-slate-600 mb-4 leading-relaxed">{selectedCourse.description || "No description available."}</p>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-bold text-slate-800 text-sm">{selectedCourse.averageRating?.toFixed(1) || "New"}</span>
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className={`w-4 h-4 ${s <= Math.round(selectedCourse.averageRating ?? 0) ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500">Course by <span className="text-teal font-semibold">Learnovora</span></p>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Course Description</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{selectedCourse.description || "No description available."}</p>
            </div>
          </div>

          {/* RIGHT — sticky card */}
          <div className="lg:col-span-1 self-start">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                {/* Thumbnail */}
                <div className="aspect-video overflow-hidden">
                  {(selectedCourse as any).thumbnail ? (
                    <img src={(selectedCourse as any).thumbnail} alt={selectedCourse.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal to-teal-light flex items-center justify-center">
                      <BookOpen size={40} className="text-white/40" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Enroll / Enrolled button */}
                  {isEnrolled ? (
                    <button disabled
                      className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 font-bold text-sm rounded-xl border-2 border-emerald-200 cursor-default mb-4">
                      <CheckCircle2 size={16} /> Enrolled
                    </button>
                  ) : (
                    <button
                      onClick={() => onEnroll(selectedCourse._id)}
                      disabled={status === "loading"}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-teal hover:bg-teal-dark text-white font-bold text-sm rounded-xl transition-all active:scale-95 shadow-lg shadow-teal/20 mb-4 disabled:opacity-60">
                      {status === "loading"
                        ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enrolling...</>
                        : "Enroll Now"}
                    </button>
                  )}
                  {status && status !== "loading" && status !== "success" && (
                    <p className="text-xs text-red-500 mb-3 text-center">{status}</p>
                  )}

                  {/* What's included */}
                  <h4 className="font-bold text-slate-800 text-sm mb-2">What's included</h4>
                  <ul className="space-y-1.5">
                    {["Lifetime access", "Step-by-step guidance", "Downloadable resources", "Certificate on completion"].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 size={13} className="text-teal mt-0.5 shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Browse Courses</h1>
          <p className="text-slate-500 mt-1 text-sm">{courses.length} courses available</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter courses..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
        </div>
      </div>

      {loading ? <SkeletonGrid /> : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses found" desc={search ? "Try a different search." : "No published courses yet."} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course, i) => {
            const status = enrollMsg[course._id];
            const isEnrolled = status === "success";
            return (
              <motion.div key={course._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedCourse(course)}
                className="bg-white rounded-2xl border border-cream-dark hover:border-teal/20 hover:shadow-lg hover:shadow-teal/5 hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group">
                {/* Thumbnail */}
                <div className="h-36 relative overflow-hidden">
                  {(course as any).thumbnail ? (
                    <img src={(course as any).thumbnail} alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-teal to-teal-light flex items-center justify-center">
                      <BookOpen size={36} className="text-white/30" />
                    </div>
                  )}
                  {isEnrolled && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1">
                        <CheckCircle2 size={10} /> Enrolled
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-display font-bold text-slate-900 text-sm leading-snug mb-1">{course.title}</h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{course.description || "No description."}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star size={12} fill="currentColor" />
                      <span className="text-xs font-semibold text-slate-600">{course.averageRating?.toFixed(1) || "New"}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${isEnrolled ? "bg-emerald-50 text-emerald-600" : "bg-teal/10 text-teal"}`}>
                      {isEnrolled ? "Enrolled" : "View Course"}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Student Material Row (accordion) ────────────────── */
function StudentMaterialRow({ item, idx }: { item: ContentItem; idx: number }) {
  const [open, setOpen] = useState(idx === 0);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}
            className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${item.type === "video" ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-500"}`}>
            {item.type === "video" ? <PlayCircle size={13} /> : <FileCheck size={13} />}
          </div>
          <span className="font-semibold text-slate-800 text-sm truncate">{item.title || `Material ${idx + 1}`}</span>
        </div>
        <span className="text-xs text-slate-400 capitalize shrink-0 ml-3">{item.type}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-slate-700 truncate">{item.title || `Material ${idx + 1}`}</span>
              </div>
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal text-white text-xs font-semibold rounded-lg hover:bg-teal-dark transition shrink-0 ml-3">
                <PlayCircle size={12} /> {item.type === "video" ? "Watch" : "Open"}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Enrollments Tab ──────────────────────────────────── */
function EnrollmentsTab({ enrollments, loading }: { enrollments: Enrollment[]; loading: boolean; }) {
  const [, navigate] = useLocation();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">My Learning</h1>
        <p className="text-slate-500 mt-1 text-sm">Track your progress across enrolled courses</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-cream-dark animate-pulse h-52" />)}</div>
      ) : enrollments.length === 0 ? (
        <EmptyState icon={PlayCircle} title="No enrollments yet" desc="Browse courses and enroll to start learning." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrollments.map((e, i) => (
            <motion.div key={e._id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/my-learning/${e._id}`)}
              className="bg-white rounded-2xl border border-cream-dark cursor-pointer transition-all duration-200 overflow-hidden hover:-translate-y-1 hover:border-teal/20 hover:shadow-lg hover:shadow-teal/5 group">
              {/* Thumbnail */}
              <div className="h-36 relative overflow-hidden">
                {(e.course as any)?.thumbnail ? (
                  <img src={(e.course as any).thumbnail} alt={e.course?.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-teal to-teal-light flex items-center justify-center">
                    <BookOpen size={40} className="text-white/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.progress >= 100 ? "bg-emerald-500 text-white" : e.progress > 0 ? "bg-blue-500 text-white" : "bg-white/80 text-slate-600"}`}>
                    {e.progress >= 100 ? "Completed" : e.progress > 0 ? "In Progress" : "Not Started"}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-display font-bold text-slate-900 text-sm leading-snug mb-1">{e.course?.title || "Course"}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                  <Clock size={10} /> Enrolled {new Date(e.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-cream-dark rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${e.progress}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className={`h-full rounded-full ${e.progress >= 100 ? "bg-emerald-500" : "bg-teal"}`} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">{e.progress}%</span>
                </div>
              </div>
            </motion.div>
          ))}
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
interface QuizQuestion { question: string; options: string[]; correctAnswer: string; explanation?: string; }
interface AvailableQuiz { _id: string; courseId: string; questions: QuizQuestion[]; createdAt: string; }
interface AttemptResult { score: number; total: number; percentage: number; breakdown: { question: string; selected: string | null; correctAnswer: string; correct: boolean; explanation?: string }[]; }

function MockTestsTab({ results, loading, enrollments }: { results: TestResult[]; loading: boolean; enrollments: Enrollment[]; }) {
  const [quizzes, setQuizzes] = useState<AvailableQuiz[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<AvailableQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<"list" | "attempt" | "result">("list");

  useEffect(() => {
    const loadQuizzes = async () => {
      if (enrollments.length === 0) return;
      setQuizzesLoading(true);
      try {
        const all: AvailableQuiz[] = [];
        await Promise.all(enrollments.map(async (e) => {
          const cid = e.course?._id;
          if (!cid) return;
          try {
            const d = await api.get<{ success: boolean; data: AvailableQuiz[] }>(`/ai/quizzes/course/${cid}`);
            if (d.data) all.push(...d.data);
          } catch { /* ignore */ }
        }));
        setQuizzes(all);
      } finally { setQuizzesLoading(false); }
    };
    loadQuizzes();
  }, [enrollments]);

  const startQuiz = (quiz: AvailableQuiz) => {
    setActiveQuiz(quiz);
    setAnswers({});
    setAttemptResult(null);
    setView("attempt");
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    try {
      const d = await api.post<{ success: boolean; data: AttemptResult }>(`/ai/quiz/${activeQuiz._id}/attempt`, { answers });
      setAttemptResult(d.data);
      setView("result");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to submit");
    } finally { setSubmitting(false); }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQ = activeQuiz?.questions.length ?? 0;

  // ── Result view ──
  if (view === "result" && attemptResult) {
    const pct = attemptResult.percentage;
    return (
      <div className="max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => { setView("list"); setActiveQuiz(null); setAttemptResult(null); }}
            className="flex items-center gap-1.5 text-sm text-teal font-semibold hover:underline">
            <ChevronRight size={14} className="rotate-180" /> Back to Quizzes
          </button>
        </div>

        {/* Score card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl p-8 text-center mb-6 ${pct >= 70 ? "bg-emerald-50 border border-emerald-200" : pct >= 40 ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"}`}>
          <div className={`text-6xl font-display font-bold mb-2 ${pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-500"}`}>{pct}%</div>
          <p className={`text-lg font-bold mb-1 ${pct >= 70 ? "text-emerald-700" : pct >= 40 ? "text-amber-700" : "text-red-600"}`}>
            {pct >= 70 ? "🎉 Passed!" : pct >= 40 ? "📚 Average" : "❌ Failed"}
          </p>
          <p className="text-sm text-slate-600">{attemptResult.score} / {attemptResult.total} correct answers</p>
        </motion.div>

        {/* Breakdown */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">Answer Review</h3>
          {attemptResult.breakdown.map((b, i) => (
            <div key={i} className={`bg-white rounded-2xl border p-4 ${b.correct ? "border-emerald-200" : "border-red-200"}`}>
              <div className="flex items-start gap-2 mb-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${b.correct ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                  {b.correct ? "✓" : "✗"}
                </span>
                <p className="text-sm font-semibold text-slate-800">{b.question}</p>
              </div>
              <div className="space-y-1.5 ml-8">
                {b.selected && (
                  <p className={`text-xs ${b.correct ? "text-emerald-700" : "text-red-600"}`}>
                    Your answer: <span className="font-semibold">{b.selected}</span>
                  </p>
                )}
                {!b.correct && (
                  <p className="text-xs text-emerald-700">Correct: <span className="font-semibold">{b.correctAnswer}</span></p>
                )}
                {b.explanation && (
                  <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mt-1">{b.explanation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Attempt view ──
  if (view === "attempt" && activeQuiz) {
    return (
      <div className="max-w-2xl">
        <div className="mb-5 flex items-center justify-between">
          <button onClick={() => { setView("list"); setActiveQuiz(null); }}
            className="flex items-center gap-1.5 text-sm text-teal font-semibold hover:underline">
            <ChevronRight size={14} className="rotate-180" /> Back
          </button>
          <span className="text-xs text-slate-500 font-medium">{answeredCount} / {totalQ} answered</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden mb-6">
          <motion.div className="h-full bg-teal rounded-full" animate={{ width: `${(answeredCount / totalQ) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>

        <div className="space-y-5">
          {activeQuiz.questions.map((q, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-cream-dark p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-7 h-7 rounded-full bg-teal/10 text-teal text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                <p className="font-semibold text-slate-800 text-sm leading-relaxed">{q.question}</p>
              </div>
              <div className="space-y-2 ml-10">
                {q.options.map((opt, oi) => (
                  <button key={oi} type="button" onClick={() => setAnswers(p => ({ ...p, [idx]: opt }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all ${answers[idx] === opt ? "bg-teal text-white border-2 border-teal shadow-md" : "bg-cream border border-cream-dark text-slate-700 hover:border-teal/40 hover:bg-teal/5"}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${answers[idx] === opt ? "bg-white text-teal" : "bg-slate-200 text-slate-500"}`}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => { setView("list"); setActiveQuiz(null); }}
            className="px-5 py-3 bg-cream border border-cream-dark text-slate-600 text-sm font-semibold rounded-xl hover:bg-cream-dark transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting || answeredCount < totalQ}
            className="flex-1 py-3 bg-teal text-white font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {submitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</> : `Submit Quiz (${answeredCount}/${totalQ})`}
          </button>
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">Mock Tests</h1>
        <p className="text-slate-500 mt-1 text-sm">Attempt AI-generated quizzes from your enrolled courses</p>
      </div>

      {/* Available quizzes */}
      {quizzesLoading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="bg-white rounded-2xl p-5 border border-cream-dark animate-pulse h-20" />)}</div>
      ) : quizzes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Available Quizzes</h2>
          <div className="space-y-3">
            {quizzes.map((quiz, i) => {
              const course = enrollments.find(e => e.course?._id === quiz.courseId)?.course;
              return (
                <motion.div key={quiz._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl p-5 border border-cream-dark hover:border-teal/20 hover:shadow-md transition-all flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center shrink-0">
                    <ClipboardList size={20} className="text-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{course?.title || "Quiz"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{quiz.questions.length} questions · Added {new Date(quiz.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => startQuiz(quiz)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal text-white text-xs font-semibold rounded-xl hover:bg-teal-dark transition shrink-0">
                    <PlayCircle size={14} /> Attempt
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past results */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Past Results</h2>
        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="bg-white rounded-2xl p-5 border border-cream-dark animate-pulse h-20" />)}</div>
        ) : results.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No test results yet" desc="Attempt a quiz above to see your results here." />
        ) : (
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
                    <div className="mt-2 h-1.5 bg-cream-dark rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${pct >= 70 ? "bg-emerald-50 text-emerald-600" : pct >= 40 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}`}>
                    {pct >= 70 ? "Passed" : pct >= 40 ? "Average" : "Failed"}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Certificates Tab ─────────────────────────────────── */
function CertificatesTab({ certificates, loading, switchTab, enrollments, onCertGenerated }: {
  certificates: Certificate[]; loading: boolean; switchTab: (t: string) => void;
  enrollments: Enrollment[]; onCertGenerated: (c: Certificate) => void;
}) {
  const { user } = useAuth();
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [genError, setGenError] = useState<Record<string, string>>({});

  // Completed enrollments that don't yet have a certificate
  const completedEnrollments = enrollments.filter(e => e.progress >= 100);
  const certCourseIds = new Set(certificates.map(c => String(c.course?._id ?? c.course)));
  const pendingCerts = completedEnrollments.filter(e => !certCourseIds.has(String(e.course?._id ?? e.course)));

  const handleGenerate = async (courseId: string) => {
    setGenerating(p => ({ ...p, [courseId]: true }));
    setGenError(p => ({ ...p, [courseId]: "" }));
    try {
      const cert = await api.post<Certificate>(`/certificates/${courseId}`, {});
      onCertGenerated(cert);
    } catch (err: unknown) {
      setGenError(p => ({ ...p, [courseId]: err instanceof Error ? err.message : "Failed" }));
    } finally {
      setGenerating(p => ({ ...p, [courseId]: false }));
    }
  };

  const handleDownload = (cert: Certificate) => {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Certificate</title>
<style>
  body { font-family: Georgia, serif; background: #f0fdf4; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .cert { background: white; border: 8px solid #0d9488; border-radius: 16px; padding: 60px 80px; text-align: center; max-width: 700px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
  .logo { font-size: 28px; font-weight: bold; color: #0d9488; margin-bottom: 8px; }
  .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 40px; }
  h1 { font-size: 42px; color: #1e293b; margin: 0 0 8px; }
  .name { font-size: 32px; color: #0d9488; font-style: italic; margin: 16px 0; }
  .course { font-size: 22px; color: #1e293b; font-weight: bold; margin: 8px 0 32px; }
  .meta { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 24px; border-top: 2px solid #e2e8f0; }
  .meta div { text-align: center; }
  .meta .label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
  .meta .value { font-size: 13px; color: #374151; font-weight: bold; margin-top: 4px; }
</style>
</head>
<body>
<div class="cert">
  <div class="logo">🎓 Learnovora</div>
  <div class="subtitle">Certificate of Completion</div>
  <h1>This certifies that</h1>
  <div class="name">${user?.name || "Student"}</div>
  <p style="color:#6b7280;font-size:16px;">has successfully completed the course</p>
  <div class="course">${cert.course?.title || "Course"}</div>
  <div class="meta">
    <div><div class="label">Certificate ID</div><div class="value">${cert.certificateId}</div></div>
    <div><div class="label">Issue Date</div><div class="value">${new Date(cert.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div></div>
    <div><div class="label">Platform</div><div class="value">Learnovora LMS</div></div>
  </div>
</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate-${cert.certificateId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">Certificates</h1>
        <p className="text-slate-500 mt-1 text-sm">Complete 100% of a course to earn a certificate</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1,2].map(i => <div key={i} className="bg-white rounded-2xl p-6 border border-cream-dark animate-pulse h-36" />)}</div>
      ) : (
        <>
          {/* Pending cert generation */}
          {pendingCerts.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Ready to Claim</h2>
              <div className="space-y-3">
                {pendingCerts.map(e => {
                  const cid = String(e.course?._id ?? e.course);
                  return (
                    <motion.div key={e._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Award size={20} className="text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{e.course?.title || "Course"}</p>
                        <p className="text-xs text-amber-700 mt-0.5">100% complete — claim your certificate</p>
                        {genError[cid] && <p className="text-xs text-red-500 mt-1">{genError[cid]}</p>}
                      </div>
                      <button onClick={() => handleGenerate(cid)} disabled={generating[cid]}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 shrink-0">
                        {generating[cid] ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Award size={14} />}
                        {generating[cid] ? "Generating..." : "Generate"}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Earned certificates */}
          {certificates.length === 0 && pendingCerts.length === 0 ? (
            <EmptyState icon={Award} title="No certificates yet" desc="Complete 100% of a course to earn your certificate.">
              <button onClick={() => switchTab("courses")} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition">
                <BookOpen size={15} /> Browse Courses
              </button>
            </EmptyState>
          ) : certificates.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Earned Certificates</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {certificates.map((cert, i) => (
                  <motion.div key={cert._id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                    className="relative overflow-hidden bg-gradient-to-br from-teal to-[#14b8a6] rounded-2xl p-6 text-white">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <Award size={32} className="mb-3 text-white/80" />
                    <h3 className="font-display font-bold text-lg leading-snug mb-1">{cert.course?.title || "Course"}</h3>
                    <p className="text-xs text-white/70 mb-3">Issued {new Date(cert.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs font-mono bg-white/20 rounded-lg px-3 py-1.5 inline-block mb-4">{cert.certificateId}</p>
                    <div>
                      <button onClick={() => handleDownload(cert)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Certificate
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Reviews Tab ──────────────────────────────────────── */
function ReviewsTab({ enrollments, myReviews, loading, reviewForm, setReviewForm, reviewMsg, onSubmit }: {
  enrollments: Enrollment[]; myReviews: Review[]; loading: boolean;
  reviewForm: Record<string, { rating: number; comment: string }>;
  setReviewForm: React.Dispatch<React.SetStateAction<Record<string, { rating: number; comment: string }>>>;
  reviewMsg: Record<string, string>; onSubmit: (courseId: string) => void;
}) {
  // Map existing reviews by courseId for quick lookup
  const reviewedCourseIds = new Set(myReviews.map(r => String(r.course?._id ?? r.course)));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">My Reviews</h1>
        <p className="text-slate-500 mt-1 text-sm">Rate and review courses you've enrolled in</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="bg-white rounded-2xl p-5 border border-cream-dark animate-pulse h-32" />)}</div>
      ) : enrollments.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No courses to review" desc="Enroll in a course first to leave a review." />
      ) : (
        <div className="space-y-4">
          {/* Existing reviews */}
          {myReviews.length > 0 && (
            <div className="mb-2">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Your Reviews</h2>
              <div className="space-y-3">
                {myReviews.map((r, i) => (
                  <motion.div key={r._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl p-4 border border-cream-dark">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                        <BookOpen size={16} className="text-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{r.course?.title || "Course"}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={12} className={s <= r.rating ? "text-amber-400" : "text-slate-200"} fill={s <= r.rating ? "currentColor" : "none"} />
                          ))}
                          <span className="text-xs text-slate-400 ml-1">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">{r.rating}/5</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed ml-12">{r.comment}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Courses pending review */}
          {enrollments.filter(e => !reviewedCourseIds.has(String(e.course?._id))).length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Leave a Review</h2>
              <div className="space-y-4">
                {enrollments.filter(e => !reviewedCourseIds.has(String(e.course?._id))).map((e, i) => {
                  const courseId = e.course?._id;
                  const form = reviewForm[courseId] || { rating: 5, comment: "" };
                  const msg = reviewMsg[courseId];
                  return (
                    <motion.div key={e._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="bg-white rounded-2xl p-5 border border-cream-dark">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
                          <BookOpen size={18} className="text-teal" />
                        </div>
                        <h3 className="font-display font-bold text-slate-900 text-sm">{e.course?.title || "Course"}</h3>
                      </div>
                      {msg === "success" ? (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                          <CheckCircle2 size={16} /> Review submitted! Thank you.
                        </div>
                      ) : (
                        <div className="space-y-3">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Teacher: My Courses Tab ──────────────────────────── */
interface ContentItem { _id: string; title: string; type: "video" | "pdf"; url: string; }

function CourseStructureRow({ item, idx, courseId, deletingContentId, confirmDeleteId, setConfirmDeleteId, onDelete }: {
  item: ContentItem; idx: number; courseId: string;
  deletingContentId: string | null; confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  onDelete: (contentId: string, courseId: string) => void;
}) {
  const [open, setOpen] = useState(idx === 0);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}
            className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${item.type === "video" ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-500"}`}>
            {item.type === "video" ? <PlayCircle size={13} /> : <FileCheck size={13} />}
          </div>
          <span className="font-semibold text-slate-800 text-sm truncate">{item.title || `Material ${idx + 1}`}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            className="text-xs font-semibold text-teal hover:underline">Preview</a>
          <span className="text-xs text-slate-500 capitalize">{item.type}</span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-slate-700 truncate">{item.title || `Material ${idx + 1}`}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {deletingContentId === item._id ? (
                  <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <button onClick={() => setConfirmDeleteId(confirmDeleteId === item._id ? null : item._id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition">
                    <XCircle size={11} /> Delete
                  </button>
                )}
              </div>
            </div>
            <AnimatePresence>
              {confirmDeleteId === item._id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border-t border-red-100">
                    <p className="text-xs text-red-700">Remove <span className="font-bold">"{item.title}"</span>?</p>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                      <button onClick={() => onDelete(item._id, courseId)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition">Delete</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


const CARD_COLORS = [
  "from-teal to-teal-light",
  "from-blue-500 to-indigo-500",
  "from-purple-500 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-600",
];

function MyCoursesTab({ courses, loading }: { courses: Course[]; loading: boolean; loadMyCourses: () => void; }) {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (c: Course) => {
    if (c.isPublished) return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20"><CheckCircle2 size={10} /> Live</span>;
    if (c.status === "approved") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Approved</span>;
    if (c.status === "pending") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">Pending</span>;
    if (c.status === "rejected") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">Rejected</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Draft</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">My Courses</h1>
          <p className="text-slate-500 mt-1 text-sm">{courses.length} course{courses.length !== 1 ? "s" : ""} created</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
        </div>
      </div>

      {loading ? <SkeletonGrid /> : filtered.length === 0 ? (
        <EmptyState icon={BookMarked} title="No courses yet" desc="Create your first course to get started." />
      ) : (
        <div className="space-y-0">
          {/* Cards grid — never changes layout */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c, i) => {
              return (
                <motion.div key={c._id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-cream-dark hover:border-teal/20 hover:shadow-lg hover:shadow-teal/5 hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/teacher/courses/${c._id}`)}>


                  {/* Card top — colored banner or thumbnail */}
                  <div className={`h-28 relative overflow-hidden ${!c.thumbnail ? `bg-gradient-to-r ${CARD_COLORS[i % CARD_COLORS.length]}` : ""}`}
                    onClick={() => navigate(`/teacher/courses/${c._id}`)}>
                    {c.thumbnail ? (
                      <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                          <BookMarked size={80} className="text-white" />
                        </div>
                        <div className="absolute bottom-3 left-4">
                          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <BookMarked size={18} className="text-white" />
                          </div>
                        </div>
                      </>
                    )}
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      {statusBadge(c)}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4" onClick={() => navigate(`/teacher/courses/${c._id}`)}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-display font-bold text-slate-900 text-sm leading-snug flex-1">{c.title}</h3>
                      <ChevronRight size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{c.description || "No description provided."}</p>

                    {/* Approved — ready to publish banner */}
                    {c.status === "approved" && !c.isPublished && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl mb-3">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <p className="text-xs font-semibold text-emerald-700 flex-1">Approved — click to publish</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1,2,3,4,5].map(s => <Star key={s} size={11} fill={s <= Math.round(c.averageRating ?? 0) ? "currentColor" : "none"} />)}
                        <span className="text-xs text-slate-500 ml-1">{c.averageRating?.toFixed(1) || "New"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-teal font-semibold">
                        View details <ChevronRight size={12} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

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

  // thumbnail
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string>("");
  const [thumbUploading, setThumbUploading] = useState(false);
  const [thumbMsg, setThumbMsg] = useState("");

  // after creation — submit for review
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Only images
    if (!f.type.startsWith("image/")) { setThumbMsg("Please select an image file."); return; }
    setThumbFile(f);
    setThumbPreview(URL.createObjectURL(f));
    setThumbMsg("");
  };

  const uploadThumbnail = async (courseId: string) => {
    if (!thumbFile) return;
    setThumbUploading(true);
    setThumbMsg("");
    try {
      const fd = new FormData();
      fd.append("file", thumbFile);
      fd.append("upload_preset", CLOUDINARY_PRESET);
      // Use image resource type, no transformation — preserve original quality
      fd.append("resource_type", "image");

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");

      // Save URL to backend
      await api.patch(`/courses/${courseId}/thumbnail`, {
        thumbnailUrl: data.secure_url,
        thumbnailPublicId: data.public_id,
      });
      setThumbMsg("success");
    } catch (err: unknown) {
      setThumbMsg(err instanceof Error ? err.message : "Thumbnail upload failed");
    } finally {
      setThumbUploading(false);
    }
  };

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
      // Upload thumbnail if selected
      if (thumbFile) await uploadThumbnail(course._id);
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

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Course Thumbnail <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div
                className="relative border-2 border-dashed border-cream-dark rounded-xl overflow-hidden hover:border-teal/40 transition cursor-pointer"
                onClick={() => !thumbPreview && document.getElementById("thumb-input")?.click()}
              >
                {thumbPreview ? (
                  <div className="relative">
                    <img src={thumbPreview} alt="Thumbnail preview" className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition">
                      <button type="button" onClick={e => { e.stopPropagation(); document.getElementById("thumb-input")?.click(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100 transition">
                        <Upload size={12} /> Change
                      </button>
                      <button type="button" onClick={e => { e.stopPropagation(); setThumbFile(null); setThumbPreview(""); setThumbMsg(""); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition">
                        <XCircle size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <Upload size={24} className="mb-2" />
                    <p className="text-sm font-medium">Click to upload thumbnail</p>
                    <p className="text-xs mt-1">JPG, PNG, WebP — original quality preserved</p>
                  </div>
                )}
                <input id="thumb-input" type="file" accept="image/*" className="hidden" onChange={handleThumbChange} />
              </div>
              {thumbMsg && thumbMsg !== "success" && <p className="mt-1 text-xs text-red-500">{thumbMsg}</p>}
              {thumbMsg === "success" && <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> Thumbnail uploaded</p>}
              {thumbFile && thumbMsg !== "success" && (
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <span className="font-medium">{thumbFile.name}</span> · {(thumbFile.size / 1024).toFixed(0)} KB
                </p>
              )}
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
                {submitting || thumbUploading ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {thumbUploading ? "Uploading thumbnail..." : "Creating..."}</>
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
  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useEffect(() => { if (courses.length === 0) loadMyCourses(); }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || lessonContent.length < 10) return;
    setLoading(true); setError(""); setQuestions([]); setQuizId(null); setPublished(false); setOpenIdx(0);
    try {
      const d = await api.post<{ success: boolean; data: { quizId: string; questions: QuizQuestion[] } }>("/ai/generate-quiz", {
        courseId: selectedCourse, lessonId: "lesson-1",
        lessonContent, courseTitle: courses.find(c => c._id === selectedCourse)?.title ?? "Course",
        numQuestions,
      });
      setQuizId(d.data?.quizId ?? null);
      setQuestions(d.data?.questions ?? []);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to generate quiz"); }
    finally { setLoading(false); }
  };

  const handlePublish = async () => {
    if (!quizId) return;
    setPublishing(true); setError("");
    try {
      await api.patch(`/ai/quiz/${quizId}/publish`);
      setPublished(true);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to publish"); }
    finally { setPublishing(false); }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">AI Quiz Generator</h1>
        <p className="text-slate-500 mt-1 text-sm">Generate MCQ quizzes from lesson content — publish so students can attempt them</p>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-dark p-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Course *</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} required
                className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition">
                <option value="">Choose a course...</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Lesson Content * <span className="text-slate-400 font-normal">(min 10 chars)</span>
              </label>
              <textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)}
                placeholder="Paste the lesson text here. AI will generate questions based on this content..."
                rows={6} required
                className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition resize-none" />
              <p className="mt-1 text-xs text-slate-400">{lessonContent.length} chars {lessonContent.length < 10 && <span className="text-amber-500">(need {10 - lessonContent.length} more)</span>}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Number of Questions</label>
              <input type="number" min={1} max={20} value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))}
                className="w-32 px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading || !selectedCourse || lessonContent.length < 10}
              className="w-full py-3 bg-teal text-white font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                : <><BrainCircuit size={16} /> Generate Quiz</>}
            </button>
          </form>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Status bar */}
          <div className="bg-white rounded-2xl border border-cream-dark p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-display font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" /> {questions.length} Questions Generated
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {published
                  ? "✅ Published — students enrolled in this course can now attempt this quiz"
                  : "Review questions below, then publish for students"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => { setQuestions([]); setQuizId(null); setPublished(false); setError(""); }}
                className="px-4 py-2 bg-cream border border-cream-dark text-slate-600 text-sm font-semibold rounded-xl hover:bg-cream-dark transition">
                New Quiz
              </button>
              {!published && (
                <button onClick={handlePublish} disabled={publishing}
                  className="flex items-center gap-2 px-4 py-2 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50">
                  {publishing
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Upload size={14} />}
                  {publishing ? "Publishing..." : "Publish Quiz"}
                </button>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-red-500 px-1">{error}</p>}

          {/* Questions list */}
          {questions.map((q, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
              <button onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-cream transition">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-teal/10 text-teal text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                  <span className="font-semibold text-slate-800 text-sm truncate">{q.question}</span>
                </div>
                <motion.svg animate={{ rotate: openIdx === idx ? 180 : 0 }} transition={{ duration: 0.2 }}
                  className="w-4 h-4 text-slate-400 shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
              <AnimatePresence initial={false}>
                {openIdx === idx && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-5 pb-4 space-y-2 border-t border-cream-dark pt-3">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm ${opt === q.correctAnswer ? "bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold" : "bg-cream border border-cream-dark text-slate-700"}`}>
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${opt === q.correctAnswer ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                            {String.fromCharCode(65 + oi)}
                          </span>
                          {opt}
                          {opt === q.correctAnswer && <CheckCircle2 size={14} className="ml-auto text-emerald-500 shrink-0" />}
                        </div>
                      ))}
                      {q.explanation && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                          <span className="font-semibold">Explanation: </span>{q.explanation}
                        </div>
                      )}
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

/* ── Teacher: Students Tab ────────────────────────────── */
function TeacherStudentsTab({ courses, loading }: { courses: Course[]; loading: boolean }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadStudents = async (courseId: string) => {
    setSelectedCourse(courseId);
    setStudentsLoading(true);
    try {
      const d = await api.get<StudentEnrollment[]>(`/enrollments/course/${courseId}/students`);
      setStudents(Array.isArray(d) ? d : []);
    } catch { setStudents([]); }
    finally { setStudentsLoading(false); }
  };

  const filtered = students.filter(s =>
    s.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">Students</h1>
        <p className="text-slate-500 mt-1 text-sm">View enrolled students for each of your courses</p>
      </div>

      {loading ? <SkeletonGrid /> : courses.length === 0 ? (
        <EmptyState icon={Users} title="No courses yet" desc="Create a course first to see enrolled students." />
      ) : (
        <div className="space-y-5">
          {/* Course selector */}
          <div className="bg-white rounded-2xl border border-cream-dark p-5">
            <label className="block text-xs font-semibold text-slate-600 mb-2">Select Course</label>
            <select value={selectedCourse} onChange={e => loadStudents(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition">
              <option value="">Choose a course...</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>

          {selectedCourse && (
            <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
                <div>
                  <h2 className="font-display font-bold text-slate-900 text-sm">
                    {studentsLoading ? "Loading..." : `${filtered.length} Student${filtered.length !== 1 ? "s" : ""}`}
                  </h2>
                </div>
                <div className="relative w-48">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
                </div>
              </div>

              {studentsLoading ? (
                <div className="p-5 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-cream rounded-xl animate-pulse" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <Users size={36} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500">{search ? "No students match your search." : "No students enrolled yet."}</p>
                </div>
              ) : (
                <div className="divide-y divide-cream-dark">
                  {filtered.map((s, i) => {
                    const pct = s.progress;
                    return (
                      <motion.div key={s._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-cream transition-colors">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal to-teal-light flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {s.student?.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{s.student?.name || "Unknown"}</p>
                          <p className="text-xs text-slate-400 truncate">{s.student?.email}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="hidden sm:block w-24">
                            <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : "bg-teal"}`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 text-right">{pct}%</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pct >= 100 ? "bg-emerald-50 text-emerald-600" : pct > 0 ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                            {pct >= 100 ? "Completed" : pct > 0 ? "In Progress" : "Not Started"}
                          </span>
                        </div>
                        <p className="hidden md:block text-xs text-slate-400 shrink-0">
                          {new Date(s.enrolledAt).toLocaleDateString()}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Teacher: Analytics Tab ───────────────────────────── */
function TeacherAnalyticsTab({ courses, loading }: { courses: Course[]; loading: boolean }) {
  const [selectedCourse, setSelectedCourse] = useState("");
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  const loadAnalytics = async (courseId: string) => {
    setSelectedCourse(courseId);
    setAnalyticsLoading(true);
    try {
      const [analyticsData, reviewData] = await Promise.all([
        api.get<CourseAnalytics>(`/courses/${courseId}/analytics`),
        api.get<Review[]>(`/reviews/course/${courseId}`).catch(() => [] as Review[]),
      ]);
      setAnalytics(analyticsData);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
    } catch { setAnalytics(null); }
    finally { setAnalyticsLoading(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">Course Analytics</h1>
        <p className="text-slate-500 mt-1 text-sm">Track enrollments, completion rates, and student feedback</p>
      </div>

      {loading ? <SkeletonGrid /> : courses.length === 0 ? (
        <EmptyState icon={BarChart3} title="No courses yet" desc="Create a course to see analytics." />
      ) : (
        <div className="space-y-5">
          {/* Course selector */}
          <div className="bg-white rounded-2xl border border-cream-dark p-5">
            <label className="block text-xs font-semibold text-slate-600 mb-2">Select Course</label>
            <select value={selectedCourse} onChange={e => loadAnalytics(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition">
              <option value="">Choose a course...</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>

          {selectedCourse && (
            analyticsLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl p-5 border border-cream-dark animate-pulse h-28" />)}
              </div>
            ) : analytics ? (
              <div className="space-y-5">
                {/* Stats grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Enrolled",   value: analytics.totalEnrollments, icon: Users,       color: "bg-blue-50 text-blue-600" },
                    { label: "Completed",         value: analytics.completed,        icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
                    { label: "Completion Rate",   value: `${analytics.completionRate}%`, icon: TrendingUp, color: "bg-teal/10 text-teal" },
                    { label: "Avg Progress",      value: `${analytics.avgProgress}%`, icon: BarChart3,   color: "bg-purple-50 text-purple-600" },
                  ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="bg-white rounded-2xl p-5 border border-cream-dark">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                        <s.icon size={19} />
                      </div>
                      <p className="text-2xl font-display font-bold text-slate-900">{s.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Progress breakdown */}
                <div className="bg-white rounded-2xl border border-cream-dark p-5">
                  <h3 className="font-display font-bold text-slate-900 text-sm mb-4">Progress Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Completed",   count: analytics.completed,   total: analytics.totalEnrollments, color: "bg-emerald-500" },
                      { label: "In Progress", count: analytics.inProgress,  total: analytics.totalEnrollments, color: "bg-blue-500" },
                      { label: "Not Started", count: analytics.notStarted,  total: analytics.totalEnrollments, color: "bg-slate-300" },
                    ].map(row => {
                      const pct = analytics.totalEnrollments > 0 ? Math.round((row.count / analytics.totalEnrollments) * 100) : 0;
                      return (
                        <div key={row.label} className="flex items-center gap-3">
                          <span className="text-xs text-slate-600 w-24 shrink-0">{row.label}</span>
                          <div className="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                              className={`h-full rounded-full ${row.color}`} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 w-16 text-right shrink-0">{row.count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews section */}
                <div className="bg-white rounded-2xl border border-cream-dark p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-slate-900 text-sm">Student Reviews</h3>
                    <div className="flex items-center gap-1.5">
                      <Star size={14} className="text-amber-400" fill="currentColor" />
                      <span className="text-sm font-bold text-slate-800">{analytics.avgRating || "—"}</span>
                      <span className="text-xs text-slate-400">({analytics.totalReviews} reviews)</span>
                    </div>
                  </div>
                  {reviews.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No reviews yet for this course.</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {reviews.map(r => (
                        <div key={r._id} className="flex items-start gap-3 p-3 bg-cream rounded-xl">
                          <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-xs shrink-0">
                            {r.student?.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-slate-700">{r.student?.name || "Student"}</span>
                              <div className="flex">
                                {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= r.rating ? "text-amber-400" : "text-slate-200"} fill={s <= r.rating ? "currentColor" : "none"} />)}
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState icon={BarChart3} title="Could not load analytics" desc="Try selecting a different course." />
            )
          )}
        </div>
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
interface PendingCourse extends Course { teacher?: { name: string; email: string }; createdAt?: string; }

function PendingCoursesTab({ courses, loading, onApprove, onReject }: {
  courses: PendingCourse[]; loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [actionState, setActionState] = useState<Record<string, "approving" | "rejecting" | "done-approve" | "done-reject">>({});
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const handleApprove = async (id: string) => {
    setActionState(p => ({ ...p, [id]: "approving" }));
    await new Promise(r => setTimeout(r, 0)); // flush state
    onApprove(id);
    setActionState(p => ({ ...p, [id]: "done-approve" }));
  };

  const handleReject = async (id: string) => {
    setActionState(p => ({ ...p, [id]: "rejecting" }));
    onReject(id, rejectReason[id] || "");
    setRejectOpen(null);
    setActionState(p => ({ ...p, [id]: "done-reject" }));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">Pending Courses</h1>
        <p className="text-slate-500 mt-1 text-sm">
          {courses.length} course{courses.length !== 1 ? "s" : ""} awaiting review · Teacher receives an email on approve/reject
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl p-5 border border-cream-dark animate-pulse h-28" />)}</div>
      ) : courses.length === 0 ? (
        <EmptyState icon={FileCheck} title="No pending courses" desc="All courses have been reviewed." />
      ) : (
        <div className="space-y-3">
          {courses.map((c, i) => {
            const state = actionState[c._id];
            const isDone = state === "done-approve" || state === "done-reject";

            return (
              <motion.div key={c._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${isDone ? "border-slate-100 opacity-60" : "border-cream-dark"}`}>

                <div className="flex items-start gap-4 p-5">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck size={18} className="text-amber-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-slate-900 text-sm mb-0.5">{c.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mb-2">{c.description || "No description."}</p>

                    {/* Teacher badge */}
                    {(c as any).teacher && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <div className="w-5 h-5 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-[10px] shrink-0">
                          {(c as any).teacher.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{(c as any).teacher.name}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">{(c as any).teacher.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {isDone ? (
                      <span className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl ${state === "done-approve" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                        {state === "done-approve" ? <><CheckCircle2 size={13} /> Approved — email sent</> : <><XCircle size={13} /> Rejected — email sent</>}
                      </span>
                    ) : (
                      <>
                        <button onClick={() => handleApprove(c._id)} disabled={state === "approving"}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition disabled:opacity-50">
                          {state === "approving"
                            ? <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            : <CheckCircle2 size={14} />}
                          Approve
                        </button>
                        <button onClick={() => setRejectOpen(rejectOpen === c._id ? null : c._id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 text-xs font-semibold rounded-xl hover:bg-red-100 transition">
                          <XCircle size={14} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Rejection reason panel */}
                <AnimatePresence>
                  {rejectOpen === c._id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-5 pb-5 pt-0 border-t border-cream-dark bg-red-50/40">
                        <p className="text-xs font-semibold text-slate-600 mt-4 mb-2">
                          Rejection reason <span className="text-slate-400 font-normal">(optional — will be included in the email)</span>
                        </p>
                        <textarea
                          value={rejectReason[c._id] || ""}
                          onChange={e => setRejectReason(p => ({ ...p, [c._id]: e.target.value }))}
                          placeholder="e.g. Content quality needs improvement, please add more detailed explanations..."
                          rows={3}
                          className="w-full px-4 py-3 text-sm bg-white rounded-xl border border-red-200 focus:outline-none focus:border-red-400 transition resize-none"
                        />
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleReject(c._id)} disabled={actionState[c._id] === "rejecting"}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50">
                            {actionState[c._id] === "rejecting"
                              ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <XCircle size={13} />}
                            Confirm Reject & Send Email
                          </button>
                          <button onClick={() => setRejectOpen(null)}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition">
                            Cancel
                          </button>
                        </div>
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





