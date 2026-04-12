import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, PlayCircle, FileCheck, Upload,
  Users, Settings, BarChart3, CheckCircle2, ArrowLeft,
  Plus, Radio, Trash2, Edit2, Check, X as XIcon,
} from "lucide-react";
import { api } from "@/lib/api";

interface Lesson { _id: string; title: string; type: "video" | "pdf" | "ppt" | "live"; url: string; liveLink?: string; liveStartedAt?: string; order: number; }
interface Module { _id: string; title: string; order: number; lessons: Lesson[]; }
interface TeacherAnalytics { _id: string; title: string; totalStudents: number; avgProgress: number; }
interface Course { _id: string; title: string; description: string; averageRating: number; status?: string; isPublished?: boolean; thumbnail?: string; }

const CLOUDINARY_CLOUD = "dg8or6094";
const CLOUDINARY_PRESET = "elearning_unsigned";

function LessonRow({ lesson, onDelete }: { lesson: Lesson; onDelete: (id: string) => void }) {
  const [confirm, setConfirm] = useState(false);
  const icon = lesson.type === "video" ? <PlayCircle size={13} className="text-blue-500" /> :
               lesson.type === "live"  ? <Radio size={13} className="text-red-500" /> :
               <FileCheck size={13} className="text-amber-500" />;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">{lesson.title || "Untitled"}</p>
        <p className="text-[10px] text-slate-400 capitalize">{lesson.type}</p>
      </div>
      <a href={lesson.url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal hover:underline shrink-0">Preview</a>
      {confirm ? (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onDelete(lesson._id)} className="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Delete</button>
          <button onClick={() => setConfirm(false)} className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setConfirm(true)} className="p-1 text-slate-400 hover:text-red-500 transition shrink-0"><Trash2 size={13} /></button>
      )}
    </div>
  );
}

export default function TeacherCourseDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [unassigned, setUnassigned] = useState<Lesson[]>([]);
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState(false);
  const [publishMsg, setPublishMsg] = useState("");
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [liveLink, setLiveLink] = useState("");
  const [liveTitle, setLiveTitle] = useState("Live Class");
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveMsg, setLiveMsg] = useState("");
  const [showLiveForm, setShowLiveForm] = useState(false);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState("");
  const [thumbUploading, setThumbUploading] = useState(false);
  const [thumbMsg, setThumbMsg] = useState("");

  const loadData = async () => {
    try {
      const [courseData, modulesData, analyticsData] = await Promise.all([
        api.get<Course>(`/courses/${params.id}`),
        api.get<{ modules: Module[]; unassigned: Lesson[] }>(`/modules/${params.id}`),
        api.get<{ totalCourses: number; courseAnalytics: TeacherAnalytics[] }>("/courses/teacher/dashboard"),
      ]);
      setCourse(courseData);
      setModules(modulesData.modules || []);
      setUnassigned(modulesData.unassigned || []);
      setExpandedModules(new Set((modulesData.modules || []).map((m: Module) => m._id)));
      const found = analyticsData.courseAnalytics?.find(a => a._id === params.id);
      if (found) setAnalytics(found);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [params.id]);

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);
    try {
      const mod = await api.post<Module>(`/modules/${params.id}`, { title: newModuleTitle.trim() });
      setModules(p => [...p, { ...mod, lessons: [] }]);
      setExpandedModules(p => new Set([...p, mod._id]));
      setNewModuleTitle("");
    } catch { /* ignore */ }
    finally { setAddingModule(false); }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await api.delete(`/modules/${moduleId}`);
      setModules(p => p.filter(m => m._id !== moduleId));
    } catch { /* ignore */ }
  };

  const handleRenameModule = async (moduleId: string) => {
    if (!editModuleTitle.trim()) return;
    try {
      await api.put(`/modules/${moduleId}`, { title: editModuleTitle.trim() });
      setModules(p => p.map(m => m._id === moduleId ? { ...m, title: editModuleTitle.trim() } : m));
      setEditingModuleId(null);
    } catch { /* ignore */ }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await api.delete(`/content/${lessonId}`);
      setModules(p => p.map(m => ({ ...m, lessons: m.lessons.filter(l => l._id !== lessonId) })));
      setUnassigned(p => p.filter(l => l._id !== lessonId));
    } catch { /* ignore */ }
  };

  const handleStartLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveLink.trim()) return;
    setLiveLoading(true); setLiveMsg("");
    try {
      const res = await api.post<{ content: Lesson; notified: number }>(`/content/${params.id}/live`, {
        title: liveTitle, liveLink: liveLink.trim(),
      });
      setLiveMsg(`Live class started! ${res.notified} student${res.notified !== 1 ? "s" : ""} notified by email.`);
      setLiveLink(""); setShowLiveForm(false);
      loadData();
    } catch (err: unknown) {
      setLiveMsg(err instanceof Error ? err.message : "Failed to start live class");
    } finally { setLiveLoading(false); }
  };

  const handlePublish = async () => {
    if (!course) return;
    setPublishingId(true);
    try {
      await api.patch(`/courses/${course._id}/publish`);
      setCourse(p => p ? { ...p, isPublished: true } : p);
      setPublishMsg("published");
    } catch (err: unknown) {
      setPublishMsg(err instanceof Error ? err.message : "Failed");
    } finally { setPublishingId(false); }
  };

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setThumbMsg("Please select an image file."); return; }
    setThumbFile(f); setThumbPreview(URL.createObjectURL(f)); setThumbMsg("");
  };

  const handleThumbUpload = async () => {
    if (!thumbFile || !course) return;
    setThumbUploading(true); setThumbMsg("");
    try {
      const fd = new FormData();
      fd.append("file", thumbFile);
      fd.append("upload_preset", CLOUDINARY_PRESET);
      fd.append("resource_type", "image");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Upload failed");
      await api.patch(`/courses/${course._id}/thumbnail`, { thumbnailUrl: data.secure_url, thumbnailPublicId: data.public_id });
      setCourse(p => p ? { ...p, thumbnail: data.secure_url } : p);
      setThumbMsg("success"); setThumbFile(null); setThumbPreview("");
    } catch (err: unknown) {
      setThumbMsg(err instanceof Error ? err.message : "Upload failed");
    } finally { setThumbUploading(false); }
  };

  const statusBadge = () => {
    if (!course) return null;
    if (course.isPublished) return <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-teal/10 text-teal border border-teal/20"><CheckCircle2 size={11} /> Live</span>;
    if (course.status === "approved") return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Approved</span>;
    if (course.status === "pending") return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100">Pending Review</span>;
    if (course.status === "rejected") return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-100">Rejected</span>;
    return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">Draft</span>;
  };

  if (loading) return <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" /></div>;
  if (!course) return <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-slate-900 mb-3">Course not found</h1><button onClick={() => navigate("/dashboard")} className="text-teal font-semibold hover:underline">Back</button></div></div>;

  const allLessons = [...modules.flatMap(m => m.lessons || []), ...unassigned];

  return (
    <div className="min-h-screen bg-[#f8f9fb] overflow-x-hidden">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs sm:text-sm text-slate-500 flex-wrap">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-teal hover:underline font-medium"><ArrowLeft size={14} /> Dashboard</button>
          <span>/</span>
          <span className="text-slate-700 font-medium truncate max-w-xs">{course.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{course.title}</h1>
              <p className="text-sm text-slate-600 mb-3">{course.description || "No description."}</p>
              <div className="flex items-center gap-2">{statusBadge()}</div>
            </div>

            {course.status === "pending" && <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-700">Waiting for admin approval.</div>}
            {course.status === "rejected" && <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-sm text-red-600">Course rejected. Edit and resubmit.</div>}
            {publishMsg === "published" && <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 size={16} /> Course is now live!</div>}
            {liveMsg && <div className={`p-4 rounded-xl border text-sm ${liveMsg.includes("started") ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}>{liveMsg}</div>}

            {/* Live Class */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Radio size={16} className="text-red-500" /></div>
                  <h2 className="font-bold text-slate-900 text-sm">Live Class</h2>
                </div>
                <button onClick={() => setShowLiveForm(p => !p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-xl transition">
                  <Radio size={12} /> {showLiveForm ? "Cancel" : "Start Live Class"}
                </button>
              </div>
              <AnimatePresence>
                {showLiveForm && (
                  <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden" onSubmit={handleStartLive}>
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Session Title</label>
                        <input value={liveTitle} onChange={e => setLiveTitle(e.target.value)} placeholder="e.g. Week 3 Live Q&A"
                          className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-red-400/50 transition" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Live Link (Zoom / Meet / Teams) *</label>
                        <input value={liveLink} onChange={e => setLiveLink(e.target.value)} placeholder="https://zoom.us/j/..." required
                          className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-red-400/50 transition" />
                      </div>
                      <p className="text-xs text-slate-400">All enrolled students will receive an email notification.</p>
                      <button type="submit" disabled={liveLoading || !liveLink.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                        {liveLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Radio size={14} />}
                        {liveLoading ? "Starting..." : "Start & Notify Students"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Module Management */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
                <PlayCircle size={16} className="text-teal" /> Course Structure
                <span className="text-xs text-slate-400 font-normal">({allLessons.length} lessons)</span>
              </h2>
              <div className="flex gap-2 mb-4">
                <input value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)}
                  placeholder="New module title..." onKeyDown={e => e.key === "Enter" && handleAddModule()}
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-teal/40 transition" />
                <button onClick={handleAddModule} disabled={addingModule || !newModuleTitle.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal text-white text-xs font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50">
                  {addingModule ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={14} />}
                  Add Module
                </button>
              </div>

              {modules.length === 0 && unassigned.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Upload size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No content yet. Add a module above, then upload content from the dashboard.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {modules.map(mod => (
                    <div key={mod._id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50">
                        <button onClick={() => setExpandedModules(p => { const n = new Set(p); n.has(mod._id) ? n.delete(mod._id) : n.add(mod._id); return n; })} className="shrink-0">
                          <motion.div animate={{ rotate: expandedModules.has(mod._id) ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={14} className="text-slate-500" />
                          </motion.div>
                        </button>
                        {editingModuleId === mod._id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input value={editModuleTitle} onChange={e => setEditModuleTitle(e.target.value)} autoFocus
                              className="flex-1 px-2 py-1 text-sm bg-white rounded-lg border border-teal/40 focus:outline-none" />
                            <button onClick={() => handleRenameModule(mod._id)} className="p-1 text-emerald-500"><Check size={14} /></button>
                            <button onClick={() => setEditingModuleId(null)} className="p-1 text-slate-400"><XIcon size={14} /></button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 font-semibold text-slate-800 text-sm">{mod.title}</span>
                            <span className="text-xs text-slate-400">{mod.lessons?.length || 0} lessons</span>
                            <button onClick={() => { setEditingModuleId(mod._id); setEditModuleTitle(mod.title); }} className="p-1 text-slate-400 hover:text-teal transition"><Edit2 size={13} /></button>
                            <button onClick={() => handleDeleteModule(mod._id)} className="p-1 text-slate-400 hover:text-red-500 transition"><Trash2 size={13} /></button>
                          </>
                        )}
                      </div>
                      <AnimatePresence initial={false}>
                        {expandedModules.has(mod._id) && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            {(mod.lessons || []).length === 0
                              ? <p className="text-xs text-slate-400 px-4 py-3">No lessons yet.</p>
                              : <div className="divide-y divide-slate-100">{(mod.lessons || []).map(l => <LessonRow key={l._id} lesson={l} onDelete={handleDeleteLesson} />)}</div>
                            }
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  {unassigned.length > 0 && (
                    <div className="border border-dashed border-slate-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50/50"><span className="text-xs font-semibold text-slate-500">Unassigned ({unassigned.length})</span></div>
                      <div className="divide-y divide-slate-100">{unassigned.map(l => <LessonRow key={l._id} lesson={l} onDelete={handleDeleteLesson} />)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-1 self-start">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="aspect-video overflow-hidden relative group">
                  {course.thumbnail ? (
                    <>
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => document.getElementById("detail-thumb-input")?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 text-xs font-semibold rounded-lg">
                          <Upload size={12} /> Change
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal to-teal-light flex flex-col items-center justify-center cursor-pointer"
                      onClick={() => document.getElementById("detail-thumb-input")?.click()}>
                      <Upload size={28} className="text-white/60 mb-2" />
                      <p className="text-white/80 text-xs font-semibold">Upload Thumbnail</p>
                    </div>
                  )}
                  <input id="detail-thumb-input" type="file" accept="image/*" className="hidden" onChange={handleThumbChange} />
                </div>

                {thumbPreview && (
                  <div className="px-4 pt-3 space-y-2">
                    <img src={thumbPreview} alt="preview" className="w-full h-24 object-cover rounded-xl" />
                    <div className="flex gap-2">
                      <button onClick={handleThumbUpload} disabled={thumbUploading}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-teal text-white text-xs font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50">
                        {thumbUploading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={12} />}
                        {thumbUploading ? "Uploading..." : "Save"}
                      </button>
                      <button onClick={() => { setThumbFile(null); setThumbPreview(""); }}
                        className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-200 transition">Cancel</button>
                    </div>
                    {thumbMsg && thumbMsg !== "success" && <p className="text-xs text-red-500">{thumbMsg}</p>}
                    {thumbMsg === "success" && <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={11} /> Saved!</p>}
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {statusBadge()}
                    {course.status === "approved" && !course.isPublished && (
                      <button onClick={handlePublish} disabled={publishingId}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-teal text-white text-xs font-semibold rounded-xl hover:bg-teal-dark transition disabled:opacity-50">
                        {publishingId ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={12} />}
                        Publish
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-1"><Users size={13} className="text-slate-400" /><span>{analytics?.totalStudents ?? 0} students</span></div>
                    <div className="flex items-center gap-1"><PlayCircle size={13} className="text-slate-400" /><span>{allLessons.length} lessons</span></div>
                  </div>
                  {analytics && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>Avg progress</span><span className="font-semibold">{Math.round(analytics.avgProgress)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-teal rounded-full" initial={{ width: 0 }} animate={{ width: `${analytics.avgProgress}%` }} transition={{ duration: 0.8 }} />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition">
                      <Settings size={13} /> Edit Course Details
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition">
                      <BarChart3 size={13} /> View Analytics
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
