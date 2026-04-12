import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { Search, Star, BookOpen, Users } from "lucide-react";

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  averageRating: number;
  teacher?: { name: string };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "text-amber-400" : "text-slate-200"}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function CourseList() {
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    api.get<{ courses: Course[] }>("/courses")
      .then(d => setCourses(d.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Course List</h1>
            <p className="text-sm text-slate-400 mt-1">
              <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate("/")}>Home</span>
              {" / Course List"}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-white flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input type="text" placeholder="Search for courses" value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="outline-none text-sm text-slate-700 w-full bg-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
                <div className="aspect-video bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-medium">
              {query ? "No courses match your search." : "No published courses yet."}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((course) => (
              <div key={course._id} onClick={() => navigate(`/courses/${course._id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                <div className="aspect-video bg-slate-200 overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-white/40" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1 line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {course.teacher?.name || "Instructor"}
                  </p>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-xs font-bold text-slate-700">{course.averageRating?.toFixed(1) || "New"}</span>
                    <StarRating rating={course.averageRating || 0} />
                  </div>
                  <span className="text-xs font-semibold text-blue-600">View Course →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
