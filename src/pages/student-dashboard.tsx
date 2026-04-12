/**
 * Learnovora — Premium Student Dashboard
 * Teal + Cream theme · Gamified · Engaging · Modern
 */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, PlayCircle, BrainCircuit, ClipboardList,
  Award, Star, MessageSquare, User, LogOut, Menu, X, Search,
  ChevronRight, Clock, CheckCircle2, Sparkles,
  Download, Send, Flame, Trophy, Copy,
  ChevronDown, RotateCcw, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";

/* ── Types ── */
interface Course { _id: string; title: string; description: string; averageRating: number; status?: string; isPublished?: boolean; thumbnail?: string; }
interface Enrollment { _id: string; course: Course; progress: number; createdAt: string; }
interface Certificate { _id: string; course: Course; certificateId: string; createdAt: string; }
interface TestResult { _id: string; score: number; total: number; createdAt: string; }
interface Review { _id: string; course?: Course; student?: { name: string }; rating: number; comment: string; createdAt: string; }
interface QuizQuestion { question: string; options: string[]; correctAnswer: string; explanation?: string; }
interface AvailableQuiz { _id: string; courseId: string; questions: QuizQuestion[]; createdAt: string; }
interface AttemptResult { score: number; total: number; percentage: number; breakdown: { question: string; selected: string | null; correctAnswer: string; correct: boolean; explanation?: string }[]; }

const NAV = [
  { id: "overview",     label: "Overview",       icon: LayoutDashboard },
  { id: "courses",      label: "Browse Courses",  icon: BookOpen },
  { id: "enrollments",  label: "My Learning",     icon: PlayCircle },
  { id: "ai",           label: "AI Tutor",        icon: BrainCircuit },
  { id: "mocktests",    label: "Mock Tests",      icon: ClipboardList },
  { id: "certificates", label: "Certificates",    icon: Award },
  { id: "reviews",      label: "My Reviews",      icon: MessageSquare },
  { id: "profile",      label: "Profile",         icon: User },
];

/* ── Toast ── */
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
      {type === "success" ? <CheckCircle2 size={16} /> : <X size={16} />}
      {msg}
    </motion.div>
  );
}

/* ── Skeleton ── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-cream-dark animate-pulse rounded-xl ${className}`} />;
}

/* ── Star Rating ── */
function Stars({ rating, size = 14, interactive = false, onChange }: { rating: number; size?: number; interactive?: boolean; onChange?: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" disabled={!interactive}
          onClick={() => onChange?.(n)} onMouseEnter={() => interactive && setHover(n)} onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? "transition-transform hover:scale-125" : "cursor-default"}>
          <Star size={size} className={n <= (hover || rating) ? "text-amber-400" : "text-slate-200"} fill={n <= (hover || rating) ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN SHELL
══════════════════════════════════════════════════════ */
export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Shared state
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState<Record<string, string>>({});
  const [reviewForm, setReviewForm] = useState<Record<string, { rating: number; comment: string }>>({});
  const [reviewMsg, setReviewMsg] = useState<Record<string, string>>({});
  const [aiQ, setAiQ] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  const withLoading = async (fn: () => Promise<void>) => {
    setLoading(true); try { await fn(); } catch { /* ignore */ } finally { setLoading(false); }
  };

  const loadCourses = () => withLoading(async () => {
    const [d, enrolled] = await Promise.all([
      api.get<{ courses: Course[] }>("/courses"),
      api.get<Enrollment[]>("/enrollments/me").catch(() => [] as Enrollment[]),
    ]);
    setCourses(d.courses || []);
    if (Array.isArray(enrolled)) {
      const map: Record<string, string> = {};
      enrolled.forEach(e => { const cid = String(e.course?._id ?? e.course); if (cid) map[cid] = "success"; });
      setEnrollMsg(p => ({ ...p, ...map }));
    }
  });

  const loadEnrollments = () => withLoading(async () => {
    const d = await api.get<Enrollment[]>("/enrollments/me");
    setEnrollments(Array.isArray(d) ? d : []);
  });

  const loadCertificates = () => withLoading(async () => {
    const d = await api.get<Certificate[]>("/certificates/my").catch(() => [] as Certificate[]);
    setCertificates(Array.isArray(d) ? d : []);
  });

  const loadTestResults = () => withLoading(async () => {
    const d = await api.get<TestResult[]>("/testresults/my-results");
    setTestResults(Array.isArray(d) ? d : []);
  });

  const loadReviews = () => withLoading(async () => {
    const [e, r] = await Promise.all([
      api.get<Enrollment[]>("/enrollments/me").catch(() => [] as Enrollment[]),
      api.get<Review[]>("/reviews/my").catch(() => [] as Review[]),
    ]);
    setEnrollments(Array.isArray(e) ? e : []);
    setMyReviews(Array.isArray(r) ? r : []);
  });

  useEffect(() => {
    const loaders: Record<string, () => void> = {
      courses: loadCourses, enrollments: loadEnrollments,
      certificates: loadCertificates, mocktests: loadTestResults,
      reviews: loadReviews,
    };
    loaders[tab]?.();
    if (tab === "overview") { loadEnrollments(); loadCertificates(); }
  }, [tab]);

  const handleEnroll = async (courseId: string) => {
    setEnrollMsg(p => ({ ...p, [courseId]: "loading" }));
    try {
      await api.post(`/enrollments/${courseId}`, {});
      setEnrollMsg(p => ({ ...p, [courseId]: "success" }));
      showToast("Enrolled successfully! 🎉");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      if (msg.toLowerCase().includes("already enrolled")) { setEnrollMsg(p => ({ ...p, [courseId]: "success" })); }
      else { setEnrollMsg(p => ({ ...p, [courseId]: msg })); showToast(msg, "error"); }
    }
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault(); if (!aiQ.trim()) return;
    const q = aiQ.trim(); setAiQ("");
    setAiMessages(p => [...p, { role: "user", text: q }]);
    setAiLoading(true);
    try {
      const d = await api.post<{ success: boolean; data: { answer: string } }>("/ai/ask-doubt", {
        question: q, courseId: "general", lessonId: "general",
        lessonContent: "General learning question", courseTitle: "General Learning",
      });
      const answer = d.data?.answer || (d as any).answer || "No response received.";
      setAiMessages(p => [...p, { role: "ai", text: answer }]);
    } catch (err: unknown) {
      setAiMessages(p => [...p, { role: "ai", text: err instanceof Error ? err.message : "AI service unavailable." }]);
    } finally { setAiLoading(false); }
  };

  const handleSubmitReview = async (courseId: string) => {
    const r = reviewForm[courseId]; if (!r?.comment || !r?.rating) return;
    setReviewMsg(p => ({ ...p, [courseId]: "loading" }));
    try {
      await api.post(`/reviews/${courseId}`, r);
      setReviewMsg(p => ({ ...p, [courseId]: "success" }));
      showToast("Review submitted! ⭐");
    } catch (err: unknown) {
      setReviewMsg(p => ({ ...p, [courseId]: err instanceof Error ? err.message : "Failed" }));
    }
  };

  const switchTab = (id: string) => { setTab(id); setSidebarOpen(false); };
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-teal flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
        <div className="h-16 flex items-center gap-3 px-5 shrink-0 border-b border-white/10">
          <Logo size="sm" theme="dark" />
          <button className="lg:hidden text-white/50 hover:text-white transition ml-auto" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mb-2">Main Menu</p>
          {NAV.filter(i => i.id !== "profile").map(item => (
            <button key={item.id} onClick={() => switchTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${tab === item.id ? "bg-white/20 text-white shadow-lg" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
              <item.icon size={17} className="shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {tab === item.id && <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />}
            </button>
          ))}
          <div className="pt-3">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mb-2">Account</p>
            <button onClick={() => switchTab("profile")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "profile" ? "bg-white/20 text-white" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
              <User size={17} className="shrink-0" /><span className="flex-1 text-left">Profile</span>
            </button>
          </div>
        </div>
        <div className="p-3 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10">
            {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-xl object-cover shrink-0 ring-2 ring-white/20" /> : <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">{user?.name?.[0]?.toUpperCase() ?? "S"}</div>}
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-white truncate">{user?.name}</p><p className="text-xs text-white/50">Student</p></div>
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
              <input type="text" placeholder="Search courses..." className="w-full pl-9 pr-4 py-2 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => switchTab("profile")} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-cream transition">
              {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-sm">{user?.name?.[0]?.toUpperCase() ?? "S"}</div>}
              <span className="hidden sm:block text-sm font-semibold text-slate-700">{user?.name?.split(" ")[0]}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-7 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
              {tab === "overview"     && <OverviewTab user={user} greeting={greeting} enrollments={enrollments} certificates={certificates} loading={loading} switchTab={switchTab} navigate={navigate} />}
              {tab === "courses"      && <CoursesTab courses={courses} loading={loading} enrollMsg={enrollMsg} onEnroll={handleEnroll} />}
              {tab === "enrollments"  && <EnrollmentsTab enrollments={enrollments} loading={loading} navigate={navigate} />}
              {tab === "ai"           && <AITab messages={aiMessages} aiQ={aiQ} setAiQ={setAiQ} aiLoading={aiLoading} onSubmit={handleAskAI} />}
              {tab === "mocktests"    && <MockTestsTab results={testResults} loading={loading} enrollments={enrollments} />}
              {tab === "certificates" && <CertificatesTab certificates={certificates} loading={loading} enrollments={enrollments} user={user} onCertGenerated={c => setCertificates(p => [...p.filter(x => x._id !== c._id), c])} switchTab={switchTab} />}
              {tab === "reviews"      && <ReviewsTab enrollments={enrollments} myReviews={myReviews} loading={loading} reviewForm={reviewForm} setReviewForm={setReviewForm} reviewMsg={reviewMsg} onSubmit={handleSubmitReview} />}
              {tab === "profile"      && <ProfileTab user={user} logout={logout} showToast={showToast} />}
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

/* ══════════════════════════════════════════════════════
   OVERVIEW TAB — Premium redesign
══════════════════════════════════════════════════════ */
function OverviewTab({ user, greeting, enrollments, certificates, loading, switchTab, navigate }: {
  user: { name: string; avatar?: string; streak?: number } | null; greeting: () => string;
  enrollments: Enrollment[]; certificates: Certificate[]; loading: boolean;
  switchTab: (t: string) => void; navigate: (to: string) => void;
}) {
  const inProgress = enrollments.filter(e => e.progress > 0 && e.progress < 100);
  const completed  = enrollments.filter(e => e.progress >= 100);
  const featured   = inProgress[0] ?? enrollments[0] ?? null;
  const streakDays = user?.streak ?? 0;

  // Build last-7-days activity bar — today = index 6, highlight days within streak
  const weekDays = ["M","T","W","T","F","S","S"];
  const todayDow = (new Date().getDay() + 6) % 7; // Mon=0 … Sun=6
  const activeIndices = new Set(
    Array.from({ length: Math.min(streakDays, 7) }, (_, i) => (todayDow - i + 7) % 7)
  );

  const stats = [
    { label: "Enrolled",     value: enrollments.length,  icon: BookOpen,     grad: "from-teal-500 to-cyan-600",    insight: `${inProgress.length} in progress` },
    { label: "Completed",    value: completed.length,     icon: CheckCircle2, grad: "from-emerald-500 to-teal-600", insight: "Keep it up!" },
    { label: "Certificates", value: certificates.length,  icon: Award,        grad: "from-amber-500 to-orange-500", insight: "Earned" },
    { label: "Streak",       value: `${streakDays}🔥`,    icon: Flame,        grad: "from-rose-500 to-pink-600",    insight: streakDays > 0 ? `${streakDays} day${streakDays > 1 ? "s" : ""} active` : "Start today!" },
  ];

  const quickActions = [
    { icon: BookOpen,     title: "Browse Courses",  desc: "Explore the library",      grad: "from-teal-500 to-cyan-600",    tab: "courses" },
    { icon: BrainCircuit, title: "AI Tutor",         desc: "Get instant answers",      grad: "from-indigo-500 to-purple-600", tab: "ai" },
    { icon: ClipboardList,title: "Mock Tests",       desc: "Practice & improve",       grad: "from-rose-500 to-pink-600",    tab: "mocktests" },
    { icon: Award,        title: "Certificates",     desc: "View your achievements",   grad: "from-amber-500 to-orange-500", tab: "certificates" },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal via-teal to-teal-light rounded-2xl p-6 text-white shadow-xl shadow-teal/20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex-1">
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">{greeting()}</p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold mb-1">{user?.name?.split(" ")[0]} 👋</h1>
            <p className="text-white/70 text-sm mb-5">Keep learning, you're doing great!</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => switchTab("enrollments")} className="flex items-center gap-2 px-5 py-2.5 bg-white text-teal font-bold text-sm rounded-xl hover:bg-white/90 transition shadow-lg hover:-translate-y-0.5"><PlayCircle size={15} /> Resume Learning</button>
              <button onClick={() => switchTab("courses")} className="flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white font-bold text-sm rounded-xl hover:bg-white/30 transition hover:-translate-y-0.5"><BookOpen size={15} /> Browse</button>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center w-28 h-28 rounded-2xl bg-white/10 backdrop-blur-sm shrink-0 border border-white/10">
            <Sparkles size={36} className="text-white/60 mb-1" />
            <span className="text-[10px] text-white/50 font-medium">Learning</span>
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
            <p className="text-2xl font-display font-bold text-slate-900">{loading ? "..." : s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.label}</p>
            <p className="text-[10px] text-teal font-semibold mt-1">{s.insight}</p>
          </motion.div>
        ))}
      </div>

      {/* Featured Continue Learning */}
      {featured ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-white border border-cream-dark shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
          onClick={() => navigate(`/my-learning/${featured._id}`)}>
          {/* Blurred thumbnail background */}
          {(featured.course as any)?.thumbnail && (
            <div className="absolute inset-0 overflow-hidden">
              <img src={(featured.course as any).thumbnail} alt="" className="w-full h-full object-cover scale-110 blur-sm opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/80" />
            </div>
          )}
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5">
            {(featured.course as any)?.thumbnail && (
              <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300">
                <img src={(featured.course as any).thumbnail} alt={featured.course?.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-teal/10 text-teal px-2 py-0.5 rounded-full flex items-center gap-1"><PlayCircle size={10} /> Continue Learning</span>
                <span className="text-xs text-slate-400">{featured.progress}% complete</span>
              </div>
              <h2 className="text-lg font-display font-bold text-slate-900 truncate mb-2">{featured.course?.title || "Your Course"}</h2>
              <div className="w-full max-w-xs">
                <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${featured.progress}%` }} transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-teal to-teal-light rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-teal text-white font-bold text-sm rounded-xl hover:bg-teal-dark transition shadow-lg shadow-teal/20 group-hover:-translate-y-0.5">
                <PlayCircle size={15} /> Resume
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex-1">
              <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full mb-3 inline-block">Start Learning</span>
              <h2 className="text-xl font-display font-bold mb-2">You haven't enrolled in any course yet</h2>
              <p className="text-sm text-white/60 mb-4">Browse our top-rated courses and start your learning journey today.</p>
              <button onClick={() => switchTab("courses")} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-800 font-bold text-sm rounded-xl hover:bg-white/90 transition shadow-lg">
                <BookOpen size={15} /> Browse Courses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(a => (
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

      {/* Streak + Recent Activity */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Streak */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">Learning Streak</p>
            <div className="flex items-end gap-2 mb-1">
              <p className="text-4xl font-display font-bold">{streakDays}</p>
              <p className="text-lg font-semibold text-white/80 mb-1">{streakDays === 1 ? "Day" : "Days"} 🔥</p>
            </div>
            <p className="text-xs text-white/60 mb-4">
              {streakDays === 0 ? "Log in daily to start your streak!" : streakDays >= 7 ? "You're on fire! Keep it up 🔥" : "Log in daily to grow your streak."}
            </p>
            <div className="flex gap-1.5">
              {weekDays.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full h-1.5 rounded-full transition-all ${activeIndices.has(i) ? "bg-white" : "bg-white/20"}`} />
                  <span className={`text-[9px] font-medium ${i === todayDow ? "text-white" : "text-white/40"}`}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-cream-dark p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Clock size={14} className="text-teal" /> Recent Activity</h3>
          {enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center mb-3"><BookOpen size={20} className="text-teal/50" /></div>
              <p className="text-sm font-semibold text-slate-700 mb-1">No activity yet</p>
              <p className="text-xs text-slate-400 mb-3">Enroll in a course to start tracking.</p>
              <button onClick={() => switchTab("courses")} className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal text-white text-xs font-semibold rounded-xl hover:bg-teal-dark transition"><BookOpen size={12} /> Browse</button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {enrollments.slice(0, 4).map(e => (
                <div key={e._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-cream transition-colors cursor-pointer" onClick={() => navigate(`/my-learning/${e._id}`)}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${e.progress >= 100 ? "bg-emerald-50 text-emerald-500" : e.progress > 0 ? "bg-blue-50 text-blue-500" : "bg-slate-100 text-slate-400"}`}>
                    {e.progress >= 100 ? <CheckCircle2 size={14} /> : <PlayCircle size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{e.course?.title || "Course"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1 bg-cream-dark rounded-full overflow-hidden">
                        <motion.div className="h-full bg-teal rounded-full" initial={{ width: 0 }} animate={{ width: `${e.progress}%` }} transition={{ duration: 0.8 }} />
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">{e.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   BROWSE COURSES TAB
══════════════════════════════════════════════════════ */
function CoursesTab({ courses, loading, enrollMsg, onEnroll }: { courses: Course[]; loading: boolean; enrollMsg: Record<string, string>; onEnroll: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Course | null>(null);

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || (c.description || "").toLowerCase().includes(search.toLowerCase()));

  if (selected) {
    const status = enrollMsg[selected._id];
    const isEnrolled = status === "success";
    return (
      <div>
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm text-teal font-semibold hover:underline mb-6">
          <ChevronRight size={14} className="rotate-180" /> Back to Courses
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{selected.title}</h1>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{selected.description || "No description."}</p>
              <div className="flex items-center gap-3">
                <Stars rating={selected.averageRating || 0} />
                <span className="text-sm font-bold text-slate-700">{selected.averageRating?.toFixed(1) || "New"}</span>
                <span className="text-xs text-slate-400">by Learnovora</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-cream-dark p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3">What you'll get</h3>
              <ul className="space-y-2">
                {["Lifetime access to all materials","Step-by-step video lectures","Downloadable resources","Certificate on completion","AI Tutor support"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={14} className="text-teal shrink-0" />{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="self-start sticky top-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="aspect-video overflow-hidden bg-gradient-to-br from-teal to-teal-light">
                {(selected as any).thumbnail ? <img src={(selected as any).thumbnail} alt={selected.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen size={40} className="text-white/40" /></div>}
              </div>
              <div className="p-5">
                {isEnrolled ? (
                  <button disabled className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 font-bold text-sm rounded-xl border-2 border-emerald-200 cursor-default mb-4">
                    <CheckCircle2 size={16} /> Enrolled
                  </button>
                ) : (
                  <button onClick={() => onEnroll(selected._id)} disabled={status === "loading"}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-teal hover:bg-teal-dark text-white font-bold text-sm rounded-xl transition-all active:scale-95 shadow-lg shadow-teal/20 mb-4 disabled:opacity-60">
                    {status === "loading" ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enrolling...</> : "Enroll Now — Free"}
                  </button>
                )}
                {status && status !== "loading" && status !== "success" && <p className="text-xs text-red-500 mb-3 text-center">{status}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Browse Courses</h1>
          <p className="text-slate-500 mt-1 text-sm">{courses.length} courses available</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20"><BookOpen size={44} className="mx-auto text-slate-300 mb-4" /><h3 className="text-base font-semibold text-slate-600 mb-2">{search ? "No courses found" : "No courses yet"}</h3><p className="text-slate-400 text-sm">{search ? "Try a different search." : "Check back soon!"}</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course, i) => {
            const status = enrollMsg[course._id];
            const isEnrolled = status === "success";
            return (
              <motion.div key={course._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                whileHover={{ y: -6 }}
                onClick={() => setSelected(course)}
                className="bg-white rounded-2xl border border-cream-dark overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-teal/10 hover:border-teal/20 transition-all duration-300">
                <div className="h-44 relative overflow-hidden">
                  {(course as any).thumbnail ? (
                    <img src={(course as any).thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal to-teal-light flex items-center justify-center">
                      <BookOpen size={40} className="text-white/30" />
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white font-bold text-sm flex items-center gap-2"><ExternalLink size={16} /> {isEnrolled ? "Continue Learning" : "Preview Course"}</span>
                  </div>
                  {isEnrolled && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1"><CheckCircle2 size={10} /> Enrolled</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-bold text-slate-900 text-sm leading-snug mb-1 line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{course.description || "No description."}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Stars rating={course.averageRating || 0} size={12} />
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

/* ══════════════════════════════════════════════════════
   MY LEARNING TAB
══════════════════════════════════════════════════════ */
function EnrollmentsTab({ enrollments, loading, navigate }: { enrollments: Enrollment[]; loading: boolean; navigate: (to: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">My Learning</h1>
        <p className="text-slate-500 mt-1 text-sm">Track your progress across enrolled courses</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-52" />)}</div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-20"><PlayCircle size={44} className="mx-auto text-slate-300 mb-4" /><h3 className="text-base font-semibold text-slate-600 mb-2">No enrollments yet</h3><p className="text-slate-400 text-sm">Browse courses and enroll to start learning.</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrollments.map((e, i) => (
            <motion.div key={e._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-cream-dark overflow-hidden hover:shadow-lg hover:shadow-teal/5 hover:-translate-y-1 transition-all duration-200 group">
              <div className="h-36 relative overflow-hidden cursor-pointer" onClick={() => navigate(`/my-learning/${e._id}`)}>
                {(e.course as any)?.thumbnail ? (
                  <img src={(e.course as any).thumbnail} alt={e.course?.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-teal to-teal-light flex items-center justify-center"><BookOpen size={40} className="text-white/30" /></div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.progress >= 100 ? "bg-emerald-500 text-white" : e.progress > 0 ? "bg-blue-500 text-white" : "bg-white/80 text-slate-600"}`}>
                    {e.progress >= 100 ? "Completed" : e.progress > 0 ? "In Progress" : "Not Started"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-display font-bold text-slate-900 text-sm leading-snug mb-1 cursor-pointer" onClick={() => navigate(`/my-learning/${e._id}`)}>{e.course?.title || "Course"}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mb-3"><Clock size={10} /> Enrolled {new Date(e.createdAt).toLocaleDateString()}</p>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${e.progress}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                      className={`h-full rounded-full ${e.progress >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-teal to-teal-light"}`} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 shrink-0">{e.progress}%</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/learn/${e._id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-teal text-white text-xs font-semibold rounded-xl hover:bg-teal-dark transition">
                    <PlayCircle size={12} /> {e.progress > 0 ? "Continue" : "Start"}
                  </button>
                  <button onClick={() => setExpanded(expanded === e._id ? null : e._id)}
                    className="px-3 py-2 bg-cream text-slate-600 text-xs font-semibold rounded-xl hover:bg-cream-dark transition flex items-center gap-1">
                    <ChevronDown size={12} className={`transition-transform ${expanded === e._id ? "rotate-180" : ""}`} />
                  </button>
                </div>
                <AnimatePresence>
                  {expanded === e._id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="mt-3 pt-3 border-t border-cream-dark space-y-1.5">
                        <p className="text-xs font-semibold text-slate-600 mb-2">Course Details</p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Progress</span><span className="font-bold text-teal">{e.progress}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Status</span>
                          <span className={`font-bold ${e.progress >= 100 ? "text-emerald-600" : e.progress > 0 ? "text-blue-600" : "text-slate-500"}`}>
                            {e.progress >= 100 ? "Completed" : e.progress > 0 ? "In Progress" : "Not Started"}
                          </span>
                        </div>
                        <button onClick={() => navigate(`/learn/${e._id}`)} className="w-full mt-2 py-2 bg-teal/10 text-teal text-xs font-semibold rounded-xl hover:bg-teal/20 transition flex items-center justify-center gap-1.5">
                          <PlayCircle size={12} /> Open Course Player
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   AI TUTOR TAB — Modern chat UI
══════════════════════════════════════════════════════ */
function AITab({ messages, aiQ, setAiQ, aiLoading, onSubmit }: {
  messages: { role: "user" | "ai"; text: string }[];
  aiQ: string; setAiQ: (v: string) => void; aiLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, aiLoading]);

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx); setTimeout(() => setCopied(null), 2000);
  };

  const suggestions = ["Explain this concept simply", "Give me a quiz question", "What are the key points?", "How can I practice this?"];

  return (
    <div className="max-w-2xl flex flex-col" style={{ height: "calc(100vh - 160px)" }}>
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-display font-bold text-slate-900">AI Tutor</h1>
        <p className="text-slate-500 mt-1 text-sm">Ask anything — get instant, intelligent answers</p>
      </div>

      {/* Chat window */}
      <div className="flex-1 bg-white rounded-2xl border border-cream-dark overflow-hidden flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-cream-dark shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal to-teal-light flex items-center justify-center shadow-md">
            <BrainCircuit size={18} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Learnovora AI</p>
            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" /> Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !aiLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-teal/10 flex items-center justify-center mb-4">
                <BrainCircuit size={32} className="text-teal/50" />
              </div>
              <p className="text-slate-600 font-semibold mb-1">How can I help you today?</p>
              <p className="text-slate-400 text-sm mb-6">Ask me anything about your courses or any topic.</p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {suggestions.map(s => (
                  <button key={s} onClick={() => setAiQ(s)}
                    className="text-xs text-left px-3 py-2.5 bg-cream rounded-xl border border-cream-dark hover:border-teal/40 hover:bg-teal/5 transition text-slate-600 font-medium">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {msg.role === "ai" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal to-teal-light flex items-center justify-center shrink-0 mt-0.5">
                  <BrainCircuit size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] group relative ${msg.role === "user" ? "bg-teal text-white rounded-2xl rounded-tr-sm" : "bg-cream border border-cream-dark text-slate-700 rounded-2xl rounded-tl-sm"} px-4 py-3 text-sm leading-relaxed`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.role === "ai" && (
                  <button onClick={() => copyText(msg.text, i)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 rounded-lg hover:bg-slate-200">
                    {copied === i ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
                  </button>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-teal/20 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={14} className="text-teal" />
                </div>
              )}
            </motion.div>
          ))}

          {aiLoading && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal to-teal-light flex items-center justify-center shrink-0">
                <BrainCircuit size={14} className="text-white" />
              </div>
              <div className="bg-cream border border-cream-dark rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-teal rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-cream-dark shrink-0">
          <form onSubmit={onSubmit} className="flex gap-2">
            <input type="text" value={aiQ} onChange={e => setAiQ(e.target.value)} placeholder="Ask a question..."
              className="flex-1 px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition" />
            <button type="submit" disabled={aiLoading || !aiQ.trim()}
              className="px-4 py-3 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <Send size={15} />
            </button>
          </form>
          <p className="text-xs text-slate-400 text-center mt-2">AI responses are for educational purposes only.</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MOCK TESTS TAB
══════════════════════════════════════════════════════ */
function MockTestsTab({ results, loading, enrollments }: { results: TestResult[]; loading: boolean; enrollments: Enrollment[] }) {
  const [quizzes, setQuizzes] = useState<AvailableQuiz[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<AvailableQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [attemptResult, setAttemptResult] = useState<AttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<"list" | "attempt" | "result">("list");

  useEffect(() => {
    if (enrollments.length === 0) return;
    setQuizzesLoading(true);
    Promise.all(enrollments.map(async e => {
      const cid = e.course?._id; if (!cid) return [];
      try { const d = await api.get<{ success: boolean; data: AvailableQuiz[] }>(`/ai/quizzes/course/${cid}`); return d.data || []; }
      catch { return []; }
    })).then(all => setQuizzes(all.flat())).finally(() => setQuizzesLoading(false));
  }, [enrollments]);

  const startQuiz = (quiz: AvailableQuiz) => { setActiveQuiz(quiz); setAnswers({}); setAttemptResult(null); setView("attempt"); };

  const handleSubmit = async () => {
    if (!activeQuiz) return; setSubmitting(true);
    try {
      const d = await api.post<{ success: boolean; data: AttemptResult }>(`/ai/quiz/${activeQuiz._id}/attempt`, { answers });
      setAttemptResult(d.data); setView("result");
    } catch (err: unknown) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setSubmitting(false); }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQ = activeQuiz?.questions.length ?? 0;

  if (view === "result" && attemptResult) {
    const pct = attemptResult.percentage;
    return (
      <div className="max-w-2xl space-y-5">
        <button onClick={() => { setView("list"); setActiveQuiz(null); setAttemptResult(null); }} className="flex items-center gap-1.5 text-sm text-teal font-semibold hover:underline">
          <ChevronRight size={14} className="rotate-180" /> Back to Quizzes
        </button>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl p-8 text-center ${pct >= 70 ? "bg-emerald-50 border border-emerald-200" : pct >= 40 ? "bg-amber-50 border border-amber-200" : "bg-red-50 border border-red-200"}`}>
          <div className={`text-6xl font-display font-bold mb-2 ${pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-500"}`}>{pct}%</div>
          <p className={`text-lg font-bold mb-1 ${pct >= 70 ? "text-emerald-700" : pct >= 40 ? "text-amber-700" : "text-red-600"}`}>
            {pct >= 70 ? "🎉 Passed!" : pct >= 40 ? "📚 Average" : "❌ Failed"}
          </p>
          <p className="text-sm text-slate-600">{attemptResult.score} / {attemptResult.total} correct</p>
        </motion.div>
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">Answer Review</h3>
          {attemptResult.breakdown.map((b, i) => (
            <div key={i} className={`bg-white rounded-2xl border p-4 ${b.correct ? "border-emerald-200" : "border-red-200"}`}>
              <div className="flex items-start gap-2 mb-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${b.correct ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>{b.correct ? "✓" : "✗"}</span>
                <p className="text-sm font-semibold text-slate-800">{b.question}</p>
              </div>
              <div className="space-y-1 ml-8">
                {b.selected && <p className={`text-xs ${b.correct ? "text-emerald-700" : "text-red-600"}`}>Your answer: <span className="font-semibold">{b.selected}</span></p>}
                {!b.correct && <p className="text-xs text-emerald-700">Correct: <span className="font-semibold">{b.correctAnswer}</span></p>}
                {b.explanation && <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mt-1">{b.explanation}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === "attempt" && activeQuiz) {
    return (
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => { setView("list"); setActiveQuiz(null); }} className="flex items-center gap-1.5 text-sm text-teal font-semibold hover:underline"><ChevronRight size={14} className="rotate-180" /> Back</button>
          <span className="text-xs text-slate-500 font-medium">{answeredCount} / {totalQ} answered</span>
        </div>
        <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
          <motion.div className="h-full bg-teal rounded-full" animate={{ width: `${(answeredCount / totalQ) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
        <div className="space-y-4">
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
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${answers[idx] === opt ? "bg-white text-teal" : "bg-slate-200 text-slate-500"}`}>{String.fromCharCode(65 + oi)}</span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setView("list"); setActiveQuiz(null); }} className="px-5 py-3 bg-cream border border-cream-dark text-slate-600 text-sm font-semibold rounded-xl hover:bg-cream-dark transition">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || answeredCount < totalQ}
            className="flex-1 py-3 bg-teal text-white font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</> : `Submit Quiz (${answeredCount}/${totalQ})`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-display font-bold text-slate-900">Mock Tests</h1><p className="text-slate-500 mt-1 text-sm">Attempt AI-generated quizzes from your enrolled courses</p></div>

      {quizzesLoading ? <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20" />)}</div>
        : quizzes.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Available Quizzes</h2>
            <div className="space-y-3">
              {quizzes.map((quiz, i) => {
                const course = enrollments.find(e => e.course?._id === quiz.courseId)?.course;
                return (
                  <motion.div key={quiz._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="bg-white rounded-2xl p-5 border border-cream-dark hover:border-teal/20 hover:shadow-md transition-all flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal to-teal-light flex items-center justify-center shrink-0 shadow-md">
                      <ClipboardList size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{course?.title || "Quiz"}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{quiz.questions.length} questions · {new Date(quiz.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => startQuiz(quiz)} className="flex items-center gap-2 px-4 py-2 bg-teal text-white text-xs font-semibold rounded-xl hover:bg-teal-dark transition shrink-0">
                      <PlayCircle size={14} /> Attempt
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Past Results</h2>
        {loading ? <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20" />)}</div>
          : results.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-cream-dark">
              <ClipboardList size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-600 mb-1">No test results yet</p>
              <p className="text-xs text-slate-400">Attempt a quiz above to see your results here.</p>
            </div>
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

/* ══════════════════════════════════════════════════════
   CERTIFICATES TAB
══════════════════════════════════════════════════════ */
function CertificatesTab({ certificates, loading, enrollments, user, onCertGenerated, switchTab }: {
  certificates: Certificate[]; loading: boolean; enrollments: Enrollment[];
  user: { name: string } | null; onCertGenerated: (c: Certificate) => void; switchTab: (t: string) => void;
}) {
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [genError, setGenError] = useState<Record<string, string>>({});

  const certCourseIds = new Set(certificates.map(c => String(c.course?._id ?? c.course)));
  const pendingCerts = enrollments.filter(e => e.progress >= 100 && !certCourseIds.has(String(e.course?._id ?? e.course)));

  const handleGenerate = async (courseId: string) => {
    setGenerating(p => ({ ...p, [courseId]: true })); setGenError(p => ({ ...p, [courseId]: "" }));
    try { const cert = await api.post<Certificate>(`/certificates/${courseId}`, {}); onCertGenerated(cert); }
    catch (err: unknown) { setGenError(p => ({ ...p, [courseId]: err instanceof Error ? err.message : "Failed" })); }
    finally { setGenerating(p => ({ ...p, [courseId]: false })); }
  };

  const handleDownload = (cert: Certificate) => {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Certificate</title><style>body{font-family:Georgia,serif;background:#f0fdf4;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.cert{background:white;border:8px solid #0d9488;border-radius:16px;padding:60px 80px;text-align:center;max-width:700px;box-shadow:0 20px 60px rgba(0,0,0,.15)}.logo{font-size:28px;font-weight:bold;color:#0d9488;margin-bottom:8px}.subtitle{color:#6b7280;font-size:14px;margin-bottom:40px}h1{font-size:42px;color:#1e293b;margin:0 0 8px}.name{font-size:32px;color:#0d9488;font-style:italic;margin:16px 0}.course{font-size:22px;color:#1e293b;font-weight:bold;margin:8px 0 32px}.meta{display:flex;justify-content:space-between;margin-top:40px;padding-top:24px;border-top:2px solid #e2e8f0}.meta div{text-align:center}.meta .label{font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px}.meta .value{font-size:13px;color:#374151;font-weight:bold;margin-top:4px}</style></head><body><div class="cert"><div class="logo">🎓 Learnovora</div><div class="subtitle">Certificate of Completion</div><h1>This certifies that</h1><div class="name">${user?.name || "Student"}</div><p style="color:#6b7280;font-size:16px;">has successfully completed the course</p><div class="course">${cert.course?.title || "Course"}</div><div class="meta"><div><div class="label">Certificate ID</div><div class="value">${cert.certificateId}</div></div><div><div class="label">Issue Date</div><div class="value">${new Date(cert.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</div></div><div><div class="label">Platform</div><div class="value">Learnovora LMS</div></div></div></div></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `certificate-${cert.certificateId}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-display font-bold text-slate-900">Certificates</h1><p className="text-slate-500 mt-1 text-sm">Complete 100% of a course to earn a certificate</p></div>

      {loading ? <div className="grid sm:grid-cols-2 gap-4">{[1,2].map(i => <Skeleton key={i} className="h-36" />)}</div> : (
        <>
          {pendingCerts.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Ready to Claim 🎉</h2>
              <div className="space-y-3">
                {pendingCerts.map(e => {
                  const cid = String(e.course?._id ?? e.course);
                  return (
                    <motion.div key={e._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0"><Award size={24} className="text-amber-600" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{e.course?.title || "Course"}</p>
                        <p className="text-xs text-amber-700 mt-0.5">100% complete — claim your certificate now!</p>
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

          {certificates.length === 0 && pendingCerts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-cream-dark">
              <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4"><Award size={40} className="text-amber-400" /></div>
              <h3 className="text-lg font-display font-bold text-slate-700 mb-2">No certificates yet</h3>
              <p className="text-slate-400 text-sm mb-5">Complete 100% of a course to earn your first certificate.</p>
              <button onClick={() => switchTab("courses")} className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition">
                <BookOpen size={15} /> Start Learning
              </button>
            </div>
          ) : certificates.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Earned Certificates</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {certificates.map((cert, i) => (
                  <motion.div key={cert._id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                    className="relative overflow-hidden bg-gradient-to-br from-teal to-[#14b8a6] rounded-2xl p-6 text-white hover:shadow-xl hover:shadow-teal/30 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy size={24} className="text-white/80" />
                        <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">Certificate</span>
                      </div>
                      <h3 className="font-display font-bold text-lg leading-snug mb-1">{cert.course?.title || "Course"}</h3>
                      <p className="text-xs text-white/70 mb-4">Issued {new Date(cert.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs font-mono bg-white/20 rounded-lg px-3 py-1.5 inline-block mb-4">{cert.certificateId}</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleDownload(cert)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl transition">
                          <Download size={13} /> Download
                        </button>
                      </div>
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

/* ══════════════════════════════════════════════════════
   REVIEWS TAB
══════════════════════════════════════════════════════ */
function ReviewsTab({ enrollments, myReviews, loading, reviewForm, setReviewForm, reviewMsg, onSubmit }: {
  enrollments: Enrollment[]; myReviews: Review[]; loading: boolean;
  reviewForm: Record<string, { rating: number; comment: string }>;
  setReviewForm: React.Dispatch<React.SetStateAction<Record<string, { rating: number; comment: string }>>>;
  reviewMsg: Record<string, string>; onSubmit: (courseId: string) => void;
}) {
  const reviewedIds = new Set(myReviews.map(r => String(r.course?._id ?? r.course)));

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-display font-bold text-slate-900">My Reviews</h1><p className="text-slate-500 mt-1 text-sm">Rate and review courses you've enrolled in</p></div>

      {loading ? <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-32" />)}</div>
        : enrollments.length === 0 ? (
          <div className="text-center py-20"><MessageSquare size={44} className="mx-auto text-slate-300 mb-4" /><h3 className="text-base font-semibold text-slate-600 mb-2">No courses to review</h3><p className="text-slate-400 text-sm">Enroll in a course first to leave a review.</p></div>
        ) : (
          <div className="space-y-5">
            {myReviews.length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Your Reviews</h2>
                <div className="space-y-3">
                  {myReviews.map((r, i) => (
                    <motion.div key={r._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl p-4 border border-cream-dark hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0"><BookOpen size={18} className="text-teal" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{r.course?.title || "Course"}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Stars rating={r.rating} size={12} />
                            <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">{r.rating}/5</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed ml-13 pl-1">{r.comment}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {enrollments.filter(e => !reviewedIds.has(String(e.course?._id))).length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Leave a Review</h2>
                <div className="space-y-4">
                  {enrollments.filter(e => !reviewedIds.has(String(e.course?._id))).map((e, i) => {
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
                          <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold"><CheckCircle2 size={16} /> Review submitted! Thank you.</div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Stars rating={form.rating} size={24} interactive onChange={n => setReviewForm(p => ({ ...p, [courseId]: { ...form, rating: n } }))} />
                              <span className="text-sm text-slate-500 font-medium">{form.rating}/5</span>
                            </div>
                            <textarea value={form.comment} onChange={e2 => setReviewForm(p => ({ ...p, [courseId]: { ...form, comment: e2.target.value } }))}
                              placeholder="Share your experience with this course..." rows={3}
                              className="w-full px-4 py-3 text-sm bg-cream rounded-xl border border-cream-dark focus:outline-none focus:border-teal/40 transition resize-none" />
                            {msg && msg !== "loading" && <p className="text-xs text-red-400">{msg}</p>}
                            <button onClick={() => onSubmit(courseId)} disabled={msg === "loading" || !form.comment.trim()}
                              className="px-5 py-2.5 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                              {msg === "loading" ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</> : <><Send size={14} /> Submit Review</>}
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

/* ══════════════════════════════════════════════════════
   PROFILE TAB
══════════════════════════════════════════════════════ */
function ProfileTab({ user, logout, showToast }: { user: { name: string; email: string; role: string; avatar?: string } | null; logout: () => void; showToast: (msg: string, type?: "success" | "error") => void }) {
  const { updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData(); fd.append("name", name.trim()); if (avatarFile) fd.append("avatar", avatarFile);
      const updated = await api.patchForm<{ id: string; name: string; email: string; role: string; avatar: string }>("/auth/profile", fd);
      updateUser({ name: updated.name, avatar: updated.avatar });
      showToast("Profile updated!"); setAvatarFile(null);
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed", "error"); }
    finally { setSaving(false); }
  };

  const handleChangePw = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { setPwMsg("All fields required"); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg("Passwords don't match"); return; }
    if (pwForm.newPw.length < 8) { setPwMsg("Min 8 characters"); return; }
    setPwLoading(true); setPwMsg("");
    try {
      await api.patch("/auth/change-password", { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwMsg("success"); setPwForm({ current: "", newPw: "", confirm: "" }); setShowPw(false);
      showToast("Password changed!");
    } catch (err: unknown) { setPwMsg(err instanceof Error ? err.message : "Failed"); }
    finally { setPwLoading(false); }
  };

  const avatar = avatarPreview || user?.avatar || "";

  return (
    <div className="max-w-xl">
      <div className="mb-6"><h1 className="text-2xl font-display font-bold text-slate-900">My Profile</h1><p className="text-slate-500 mt-1 text-sm">Manage your student account</p></div>
      <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden shadow-sm">
        <div className="h-28 bg-gradient-to-r from-teal via-teal to-teal-light" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="relative">
              {avatar ? <img src={avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" /> : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal to-teal-light border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl">{user?.name?.[0]?.toUpperCase() ?? "S"}</div>}
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-teal rounded-full flex items-center justify-center cursor-pointer border-2 border-white shadow hover:bg-teal-dark transition">
                <RotateCcw size={13} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }} />
              </label>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200">Student</span>
          </div>
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
              <div><p className="text-sm font-semibold text-slate-700">Password</p>{pwMsg === "success" && <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1"><CheckCircle2 size={12} /> Changed</p>}</div>
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
