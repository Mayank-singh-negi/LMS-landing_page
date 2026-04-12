import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, PlayCircle, FileCheck, Clock, CheckCircle2, BookOpen } from "lucide-react";
import { api } from "@/lib/api";

interface ContentItem { _id: string; title: string; type: "video" | "pdf"; url: string; }
interface Enrollment {
  _id: string;
  progress: number;
  createdAt: string;
  course: {
    _id: string; title: string; description?: string;
    thumbnail?: string; averageRating?: number;
  };
}

function MaterialRow({ item, idx }: { item: ContentItem; idx: number }) {
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

export default function StudentCourseDetail() {
  const params = useParams<{ enrollmentId: string }>();
  const [, navigate] = useLocation();

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const enrollments = await api.get<Enrollment[]>("/enrollments/me");
        const found = Array.isArray(enrollments)
          ? enrollments.find(e => e._id === params.enrollmentId)
          : null;
        if (found) {
          setEnrollment(found);
          const items = await api.get<ContentItem[]>(`/content/${found.course._id}`);
          setContent(Array.isArray(items) ? items : []);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [params.enrollmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Course not found</h1>
          <button onClick={() => navigate("/dashboard")} className="text-teal font-semibold hover:underline">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const course = enrollment.course;

  return (
    <div className="min-h-screen bg-[#f8f9fb] scroll-smooth overflow-x-hidden">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs sm:text-sm text-slate-500 flex-wrap">
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1 text-teal hover:underline font-medium">
            <ArrowLeft size={14} /> Dashboard
          </button>
          <span>/</span>
          <span className="text-teal cursor-pointer hover:underline" onClick={() => navigate("/dashboard")}>My Learning</span>
          <span>/</span>
          <span className="text-slate-700 font-medium truncate max-w-[180px] sm:max-w-xs">{course.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 min-w-0 space-y-6">

            {/* Title + meta */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 leading-tight">{course.title}</h1>
              <p className="text-sm sm:text-base text-slate-600 mb-4 leading-relaxed">{course.description || "No description available."}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500">
                <span className="flex items-center gap-1"><Clock size={12} /> Enrolled {new Date(enrollment.createdAt).toLocaleDateString()}</span>
                <span className={`font-bold px-2.5 py-1 rounded-full ${enrollment.progress >= 100 ? "bg-emerald-50 text-emerald-600" : enrollment.progress > 0 ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                  {enrollment.progress >= 100 ? "✓ Completed" : enrollment.progress > 0 ? "In Progress" : "Not Started"}
                </span>
              </div>
            </div>

            {/* Study Materials */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">Study Materials</h2>
              {content.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
                  <BookOpen size={28} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500 mb-1">No materials available yet.</p>
                  <p className="text-xs text-slate-400">The teacher hasn't uploaded content for this course yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {content.map((item, idx) => (
                    <MaterialRow key={item._id} item={item} idx={idx} />
                  ))}
                </div>
              )}
            </div>

            {/* Course Description */}
            <div className="border-t border-slate-200 pt-8">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">Course Description</h2>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2">About {course.title}</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{course.description || "No description available."}</p>
            </div>
          </div>

          {/* RIGHT — sticky card */}
          <div className="lg:col-span-1 self-start">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">

                {/* Thumbnail */}
                <div className="aspect-video overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal to-teal-light flex items-center justify-center">
                      <BookOpen size={40} className="text-white/40" />
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5">
                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Your Progress</span>
                      <span className="font-bold text-slate-700">{enrollment.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div className={`h-full rounded-full ${enrollment.progress >= 100 ? "bg-emerald-500" : "bg-teal"}`}
                        initial={{ width: 0 }} animate={{ width: `${enrollment.progress}%` }} transition={{ duration: 1 }} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-1"><PlayCircle size={13} className="text-slate-400" /><span>{content.length} materials</span></div>
                    {course.averageRating ? (
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        <span>{course.averageRating.toFixed(1)}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => navigate(`/learn/${enrollment._id}`)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-teal hover:bg-teal-dark text-white font-bold text-sm rounded-xl transition-all active:scale-95 shadow-lg shadow-teal/20 mb-4">
                    <PlayCircle size={16} />
                    {enrollment.progress > 0 ? "Continue Learning" : "Start Learning"}
                  </button>
                  <ul className="space-y-1.5">
                    {["Lifetime access", "Step-by-step guidance", "Downloadable resources", "Certificate on completion"].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
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
    </div>
  );
}
