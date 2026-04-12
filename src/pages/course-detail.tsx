import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { BookOpen, Clock, Star, Users, CheckCircle2, PlayCircle, ChevronDown, Loader2 } from "lucide-react";

interface ContentItem { _id: string; title: string; type: "video" | "pdf"; url: string; }
interface Review { _id: string; student: { name: string; avatar?: string }; rating: number; comment: string; createdAt: string; }
interface CourseDetail {
  _id: string; title: string; description: string; thumbnail?: string;
  averageRating: number; teacher?: { name: string; avatar?: string };
  isPublished: boolean; status: string;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`${cls} ${s <= Math.round(rating) ? "text-amber-400" : "text-slate-200"}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ContentAccordion({ item, idx }: { item: ContentItem; idx: number }) {
  const [open, setOpen] = useState(idx === 0);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
          </motion.div>
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${item.type === "video" ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-500"}`}>
            <PlayCircle className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-800 text-sm truncate">{item.title}</span>
        </div>
        <span className="text-xs text-slate-400 capitalize shrink-0 ml-3">{item.type}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-white">
              <span className="text-sm text-slate-600 truncate">{item.title}</span>
              <span className="text-xs font-semibold text-blue-600 ml-3 shrink-0">Preview locked</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CourseDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [enrollError, setEnrollError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [courseData, reviewData] = await Promise.all([
          api.get<CourseDetail>(`/courses/${params.id}`),
          api.get<Review[]>(`/reviews/course/${params.id}`).catch(() => [] as Review[]),
        ]);
        setCourse(courseData);
        setReviews(Array.isArray(reviewData) ? reviewData : []);

        // Try to fetch content (requires auth)
        if (user) {
          const contentData = await api.get<ContentItem[]>(`/content/${params.id}`).catch(() => [] as ContentItem[]);
          setContent(Array.isArray(contentData) ? contentData : []);

          // Check if already enrolled
          const enrollments = await api.get<{ _id: string; course: { _id: string } }[]>("/enrollments/me").catch(() => []);
          const enrolled = Array.isArray(enrollments) && enrollments.some(e => {
            const cid = typeof e.course === "object" ? e.course._id : e.course;
            return String(cid) === String(params.id);
          });
          setIsEnrolled(enrolled);
          if (enrolled) setEnrollStatus("success");
        }
      } catch {
        // course not found handled below
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [params.id, user]);

  const handleEnroll = async () => {
    if (!user) { navigate("/login"); return; }
    setEnrollStatus("loading");
    setEnrollError("");
    try {
      await api.post(`/enrollments/${params.id}`, {});
      setEnrollStatus("success");
      setIsEnrolled(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Enrollment failed";
      if (msg.toLowerCase().includes("already enrolled")) {
        setEnrollStatus("success");
        setIsEnrolled(true);
      } else {
        setEnrollStatus("error");
        setEnrollError(msg);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Course not found</h1>
          <button onClick={() => navigate("/")} className="text-blue-600 hover:underline font-semibold">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] overflow-x-hidden">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs sm:text-sm text-slate-500 flex-wrap">
          <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate("/")}>Home</span>
          <span>/</span>
          <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate("/courses")}>Courses</span>
          <span>/</span>
          <span className="text-slate-700 font-medium truncate max-w-[180px] sm:max-w-xs">{course.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* LEFT */}
          <div className="lg:col-span-2 min-w-0 space-y-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">{course.title}</h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{course.description || "No description provided."}</p>

            {/* Rating + instructor */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800 text-sm">{course.averageRating?.toFixed(1) || "New"}</span>
                <StarRating rating={course.averageRating || 0} size="md" />
                <span className="text-xs text-slate-500">({reviews.length} reviews)</span>
              </div>
              {course.teacher && (
                <span className="text-xs text-slate-500">
                  by <span className="text-blue-600 font-semibold">{course.teacher.name}</span>
                </span>
              )}
            </div>

            {/* Course Content */}
            {content.length > 0 && (
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">Course Content</h2>
                <p className="text-xs text-slate-500 mb-3">{content.length} lesson{content.length !== 1 ? "s" : ""}</p>
                <div className="space-y-2">
                  {content.map((item, i) => (
                    <ContentAccordion key={item._id} item={item} idx={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="border-t border-slate-200 pt-8">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Student Reviews</h2>
                <div className="space-y-4">
                  {reviews.slice(0, 5).map(r => (
                    <div key={r._id} className="bg-white rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                          {r.student?.name?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{r.student?.name || "Student"}</p>
                          <StarRating rating={r.rating} />
                        </div>
                        <span className="ml-auto text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — sticky card */}
          <div className="lg:col-span-1 self-start">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                {/* Thumbnail */}
                <div className="aspect-video overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white/30" />
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-5">
                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
                      <span>{course.averageRating?.toFixed(1) || "New"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{content.length} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{reviews.length} reviews</span>
                    </div>
                  </div>

                  {/* CTA */}
                  {isEnrolled || enrollStatus === "success" ? (
                    <button onClick={() => navigate("/dashboard")}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all duration-200 text-sm mb-4">
                      <CheckCircle2 className="w-4 h-4" /> Go to My Learning
                    </button>
                  ) : (
                    <button onClick={handleEnroll} disabled={enrollStatus === "loading"}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 rounded-xl transition-all duration-200 text-sm mb-4 disabled:opacity-60">
                      {enrollStatus === "loading"
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Enrolling...</>
                        : user ? "Enroll Now — Free" : "Sign Up to Enroll"}
                    </button>
                  )}

                  {enrollStatus === "error" && (
                    <p className="text-xs text-red-500 mb-3 text-center">{enrollError}</p>
                  )}

                  {/* What's included */}
                  <h4 className="font-bold text-slate-800 text-sm mb-2">What's included</h4>
                  <ul className="space-y-1.5">
                    {[
                      "Lifetime access with free updates",
                      "Step-by-step, hands-on guidance",
                      "Downloadable resources",
                      "Quizzes to test your knowledge",
                      "Certificate of completion",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        {item}
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
