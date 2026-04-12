import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, PlayCircle, FileText, ChevronDown, CheckCircle2,
  BookOpen, Radio, Download, ExternalLink, ChevronRight,
  SkipForward, Volume2, Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

interface Lesson {
  _id: string; title: string; type: "video" | "pdf" | "ppt" | "live";
  url: string; liveLink?: string; liveStartedAt?: string; duration?: number; order: number;
  module?: string;
}
interface Module { _id: string; title: string; order: number; lessons: Lesson[]; }
interface Enrollment {
  _id: string; progress: number; createdAt: string;
  course: { _id: string; title: string; description?: string; thumbnail?: string; };
}

const STORAGE_KEY = (enrollmentId: string) => `lms_progress_${enrollmentId}`;

function formatDuration(secs: number) {
  if (!secs) return "";
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function LessonIcon({ type }: { type: string }) {
  if (type === "video") return <PlayCircle size={14} className="text-blue-500 shrink-0" />;
  if (type === "live")  return <Radio size={14} className="text-red-500 shrink-0" />;
  return <FileText size={14} className="text-amber-500 shrink-0" />;
}

export default function CoursePlayer() {
  const params = useParams<{ enrollmentId: string }>();
  const [, navigate] = useLocation();

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [unassigned, setUnassigned] = useState<Lesson[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSpeed, setVideoSpeed] = useState(1);
  const [videoTime, setVideoTime] = useState(0);

  // Load saved progress from localStorage
  const loadSaved = useCallback((enrollmentId: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(enrollmentId));
      if (raw) return JSON.parse(raw) as { completedIds: string[]; lastLessonId: string };
    } catch { /* ignore */ }
    return null;
  }, []);

  const saveSaved = useCallback((enrollmentId: string, completedIds: string[], lastLessonId: string) => {
    localStorage.setItem(STORAGE_KEY(enrollmentId), JSON.stringify({ completedIds, lastLessonId }));
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const enrollments = await api.get<Enrollment[]>("/enrollments/me");
        const found = Array.isArray(enrollments) ? enrollments.find(e => e._id === params.enrollmentId) : null;
        if (!found) { setLoading(false); return; }
        setEnrollment(found);

        const data = await api.get<{ modules: Module[]; unassigned: Lesson[] }>(`/modules/${found.course._id}`);
        const mods = data.modules || [];
        const unass = data.unassigned || [];
        setModules(mods);
        setUnassigned(unass);

        // Flatten all lessons in order
        const flat: Lesson[] = [];
        mods.forEach(m => flat.push(...(m.lessons || [])));
        flat.push(...unass);
        flat.sort((a, b) => a.order - b.order);
        setAllLessons(flat);

        // Expand all modules by default
        setExpandedModules(new Set(mods.map(m => m._id)));

        // Restore saved progress
        const saved = loadSaved(found._id);
        if (saved) {
          setCompletedIds(new Set(saved.completedIds));
          const last = flat.find(l => l._id === saved.lastLessonId) || flat[0];
          if (last) setActiveLesson(last);
        } else if (flat.length > 0) {
          setActiveLesson(flat[0]);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [params.enrollmentId]);

  // Save video time for resume
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setVideoTime(v.currentTime);
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [activeLesson]);

  // Apply speed
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = videoSpeed;
  }, [videoSpeed]);

  const markComplete = useCallback((lessonId: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      next.add(lessonId);
      if (enrollment) {
        saveSaved(enrollment._id, Array.from(next), lessonId);
        // Update progress on backend
        const pct = Math.round((next.size / Math.max(allLessons.length, 1)) * 100);
        api.patch(`/enrollments/${enrollment._id}/progress`, { progress: Math.min(pct, 100) }).catch(() => {});
      }
      return next;
    });
  }, [enrollment, allLessons.length, saveSaved]);

  const selectLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setSidebarOpen(false);
    if (enrollment) saveSaved(enrollment._id, Array.from(completedIds), lesson._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    if (!activeLesson) return;
    const idx = allLessons.findIndex(l => l._id === activeLesson._id);
    if (idx < allLessons.length - 1) selectLesson(allLessons[idx + 1]);
  };

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const progress = allLessons.length > 0 ? Math.round((completedIds.size / allLessons.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal animate-spin" />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-3">Course not found</h1>
          <button onClick={() => navigate("/dashboard")} className="text-teal hover:underline">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!activeLesson) return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center text-white/50">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p>Select a lesson to start learning</p>
        </div>
      </div>
    );

    if (activeLesson.type === "video") return (
      <div className="flex-1 bg-black flex flex-col">
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <video
            ref={videoRef}
            key={activeLesson._id}
            src={activeLesson.url}
            controls
            className="absolute inset-0 w-full h-full"
            onEnded={() => markComplete(activeLesson._id)}
            onLoadedMetadata={() => {
              // Resume from saved time if same lesson
              if (videoRef.current && videoTime > 0) {
                videoRef.current.currentTime = videoTime;
              }
            }}
          />
        </div>
        {/* Video controls bar */}
        <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Volume2 size={14} className="text-slate-400" />
            <span className="text-xs text-slate-400">Speed:</span>
            {[0.75, 1, 1.25, 1.5, 2].map(s => (
              <button key={s} onClick={() => setVideoSpeed(s)}
                className={`px-2 py-0.5 text-xs rounded font-semibold transition ${videoSpeed === s ? "bg-teal text-white" : "text-slate-400 hover:text-white"}`}>
                {s}x
              </button>
            ))}
          </div>
          <button onClick={() => markComplete(activeLesson._id)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${completedIds.has(activeLesson._id) ? "bg-emerald-500/20 text-emerald-400" : "bg-teal/20 text-teal hover:bg-teal/30"}`}>
            <CheckCircle2 size={13} />
            {completedIds.has(activeLesson._id) ? "Completed" : "Mark Complete"}
          </button>
          <button onClick={goNext} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 text-white hover:bg-white/20 transition">
            <SkipForward size={13} /> Next
          </button>
        </div>
      </div>
    );

    if (activeLesson.type === "live") return (
      <div className="flex-1 bg-slate-900 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center border border-red-500/30">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Radio size={32} className="text-red-400 animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-bold text-sm uppercase tracking-widest">Live Now</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{activeLesson.title}</h2>
          {activeLesson.liveStartedAt && (
            <p className="text-slate-400 text-sm mb-6">Started {new Date(activeLesson.liveStartedAt).toLocaleTimeString()}</p>
          )}
          <a href={activeLesson.liveLink || activeLesson.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition text-sm">
            <ExternalLink size={16} /> Join Live Class
          </a>
          <button onClick={() => markComplete(activeLesson._id)}
            className="mt-4 block w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition">
            {completedIds.has(activeLesson._id) ? "✓ Marked as attended" : "Mark as attended"}
          </button>
        </motion.div>
      </div>
    );

    // PDF / PPT
    return (
      <div className="flex-1 bg-slate-900 flex flex-col">
        <div className="flex-1 relative">
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(activeLesson.url)}&embedded=true`}
            className="w-full h-full min-h-[60vh]"
            title={activeLesson.title}
          />
        </div>
        <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-3">
          <a href={activeLesson.url} download target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal/20 text-teal text-xs font-semibold rounded-lg hover:bg-teal/30 transition">
            <Download size={13} /> Download
          </a>
          <a href={activeLesson.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-xs font-semibold rounded-lg hover:bg-white/20 transition">
            <ExternalLink size={13} /> Open in new tab
          </a>
          <button onClick={() => markComplete(activeLesson._id)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${completedIds.has(activeLesson._id) ? "bg-emerald-500/20 text-emerald-400" : "bg-teal/20 text-teal hover:bg-teal/30"}`}>
            <CheckCircle2 size={13} />
            {completedIds.has(activeLesson._id) ? "Completed" : "Mark Complete"}
          </button>
        </div>
      </div>
    );
  };

  const renderSidebar = () => (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700/50">
      {/* Course header */}
      <div className="p-4 border-b border-slate-700/50 shrink-0">
        <h2 className="font-bold text-white text-sm leading-snug mb-2">{enrollment.course.title}</h2>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>{completedIds.size}/{allLessons.length} completed</span>
          <span className="font-bold text-teal">{progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <motion.div className="h-full bg-teal rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
        </div>
      </div>

      {/* Lesson list */}
      <div className="flex-1 overflow-y-auto">
        {modules.map(mod => (
          <div key={mod._id} className="border-b border-slate-700/30">
            <button onClick={() => toggleModule(mod._id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition text-left">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{mod.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-slate-500">{mod.lessons?.length || 0} lessons</span>
                <motion.div animate={{ rotate: expandedModules.has(mod._id) ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={14} className="text-slate-500" />
                </motion.div>
              </div>
            </button>
            <AnimatePresence initial={false}>
              {expandedModules.has(mod._id) && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  {(mod.lessons || []).map(lesson => (
                    <LessonRow key={lesson._id} lesson={lesson} active={activeLesson?._id === lesson._id}
                      completed={completedIds.has(lesson._id)} onClick={() => selectLesson(lesson)} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Unassigned lessons */}
        {unassigned.length > 0 && (
          <div>
            {unassigned.map(lesson => (
              <LessonRow key={lesson._id} lesson={lesson} active={activeLesson?._id === lesson._id}
                completed={completedIds.has(lesson._id)} onClick={() => selectLesson(lesson)} />
            ))}
          </div>
        )}

        {allLessons.length === 0 && (
          <div className="p-6 text-center text-slate-500 text-sm">No lessons available yet.</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top bar */}
      <header className="h-14 bg-slate-800 border-b border-slate-700/50 flex items-center gap-4 px-4 shrink-0 z-30">
        <button onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm font-medium">
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{enrollment.course.title}</p>
          {activeLesson && <p className="text-slate-400 text-xs truncate">{activeLesson.title}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-bold text-teal">{progress}%</span>
          </div>
          {/* Mobile sidebar toggle */}
          <button onClick={() => setSidebarOpen(p => !p)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white text-xs font-semibold rounded-lg">
            <BookOpen size={13} /> Lessons
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          {renderContent()}

          {/* Lesson title below player */}
          {activeLesson && (
            <div className="bg-slate-800 px-5 py-4 border-t border-slate-700/50">
              <div className="flex items-start justify-between gap-4 max-w-4xl">
                <div>
                  <h1 className="text-white font-bold text-lg leading-snug">{activeLesson.title}</h1>
                  <p className="text-slate-400 text-sm mt-1 capitalize">{activeLesson.type} lesson</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {allLessons.findIndex(l => l._id === activeLesson._id) > 0 && (
                    <button onClick={() => {
                      const idx = allLessons.findIndex(l => l._id === activeLesson._id);
                      if (idx > 0) selectLesson(allLessons[idx - 1]);
                    }} className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-xs font-semibold rounded-lg hover:bg-slate-600 transition">
                      <ChevronRight size={13} className="rotate-180" /> Prev
                    </button>
                  )}
                  {allLessons.findIndex(l => l._id === activeLesson._id) < allLessons.length - 1 && (
                    <button onClick={goNext} className="flex items-center gap-1 px-3 py-2 bg-teal text-white text-xs font-semibold rounded-lg hover:bg-teal-dark transition">
                      Next <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex w-80 xl:w-96 shrink-0 flex-col overflow-hidden">
          {renderSidebar()}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 lg:hidden overflow-hidden">
              {renderSidebar()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function LessonRow({ lesson, active, completed, onClick }: {
  lesson: Lesson; active: boolean; completed: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${active ? "bg-teal/15 border-l-2 border-teal" : "hover:bg-slate-800/60 border-l-2 border-transparent"}`}>
      <div className="shrink-0">
        {completed ? <CheckCircle2 size={16} className="text-emerald-400" /> : <LessonIcon type={lesson.type} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium leading-snug truncate ${active ? "text-teal" : completed ? "text-slate-400" : "text-slate-300"}`}>
          {lesson.title || "Untitled"}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-500 capitalize">{lesson.type}</span>
          {lesson.duration ? <span className="text-[10px] text-slate-500">{formatDuration(lesson.duration)}</span> : null}
          {lesson.type === "live" && lesson.liveStartedAt && (
            <span className="text-[10px] text-red-400 font-bold flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" /> LIVE
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
