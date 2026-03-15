import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, Eye, EyeOff, User, ShieldCheck, ArrowLeft, BookOpen, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/auth-context";

type Role = "student" | "teacher";

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>("student");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = useMemo(() => {
    const p = form.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }, [form.password]);

  const strengthMeta = [
    { label: "Too weak", color: "bg-slate-400" },
    { label: "Weak",     color: "bg-red-400" },
    { label: "Fair",     color: "bg-amber-400" },
    { label: "Good",     color: "bg-blue-400" },
    { label: "Strong",   color: "bg-emerald-400" },
  ][passwordStrength];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) e.password = "At least 8 characters";
    if (form.confirmPassword !== form.password) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      await register(form.name, form.email, form.password, role);
      navigate("/dashboard");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-md px-4 py-3.5 text-white placeholder:text-white/50 outline-none transition focus:border-white/60 focus:bg-white/15";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-10"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(0,70,67,.12), transparent 30%), radial-gradient(circle at bottom right, rgba(20,184,166,.1), transparent 28%), linear-gradient(135deg, #f0ede5 0%, #e8f4f3 45%, #f7f5f0 100%)",
      }}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative overflow-hidden rounded-[2rem] p-8 sm:p-10 bg-gradient-to-br from-[#004643] via-[#006661] to-[#14b8a6] text-white shadow-2xl shadow-teal/30">
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.22), transparent 28%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.18), transparent 26%)" }} />

          <div className="relative z-10">
            <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition mb-6">
              <ArrowLeft size={16} /> Back to home
            </button>

            <div className="text-center mb-6">
              <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-1">Join Learnovora</h1>
              <p className="text-white/70 text-sm">Start your journey today</p>
            </div>

            {/* ── Role selector ── */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-white/70 text-center mb-3 uppercase tracking-wider">I want to join as</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "student", label: "Student",  icon: BookOpen,       desc: "I want to learn" },
                  { value: "teacher", label: "Teacher",  icon: GraduationCap,  desc: "I want to teach" },
                ] as { value: Role; label: string; icon: React.ElementType; desc: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      role === opt.value
                        ? "border-white bg-white/20 shadow-lg"
                        : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${role === opt.value ? "bg-white text-[#004643]" : "bg-white/10 text-white"}`}>
                      <opt.icon size={18} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{opt.label}</p>
                      <p className="text-xs text-white/60">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {apiError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm text-center">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <div className="relative">
                  <input type="text" placeholder="Full Name" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
                  <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50" />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-200">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <div className="relative">
                  <input type="email" placeholder="you@example.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
                  <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50" />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-200">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Create password" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className={`${inputClass} pr-12`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthMeta.color : "bg-white/20"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-white/60">{strengthMeta.label}</span>
                  </div>
                )}
                {errors.password && <p className="mt-1 text-xs text-red-200">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} placeholder="Confirm password" value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    className={`${inputClass} pr-12`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-200">{errors.confirmPassword}</p>}
              </div>

              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                className="w-full rounded-2xl bg-white text-[#004643] py-3.5 font-bold shadow-lg hover:bg-white/95 transition disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? "Creating account..." : `Join as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
              </motion.button>

              <p className="text-sm text-center text-white/70 pt-1">
                Already have an account?{" "}
                <button type="button" onClick={() => navigate("/login")} className="text-white font-semibold hover:underline">
                  Log In
                </button>
              </p>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-white/60 text-xs">
              <ShieldCheck size={14} /> Your data is secure with us.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
