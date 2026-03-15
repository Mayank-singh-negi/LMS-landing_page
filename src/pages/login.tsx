import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
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
          {/* Decorative blobs */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,.22), transparent 28%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.18), transparent 26%)",
            }}
          />

          <div className="relative z-10">
            {/* Back link */}
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition mb-8"
            >
              <ArrowLeft size={16} />
              Back to home
            </button>

            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-2">
                Welcome back
              </h1>
              <p className="text-white/70 text-sm">Sign in to continue learning</p>
            </div>

            {apiError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm text-center">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-md px-4 py-3.5 text-white placeholder:text-white/50 outline-none transition focus:border-white/60 focus:bg-white/15"
                  />
                  <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50" />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-200">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-md px-4 py-3.5 pr-12 text-white placeholder:text-white/50 outline-none transition focus:border-white/60 focus:bg-white/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-200">{errors.password}</p>}
              </div>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white text-[#004643] py-3.5 font-bold shadow-lg hover:bg-white/95 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Log In"}
              </motion.button>

              <p className="text-sm text-center text-white/70 pt-1">
                New here?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="text-white font-semibold hover:underline"
                >
                  Create an account
                </button>
              </p>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 text-white/60 text-xs">
              <ShieldCheck size={14} />
              Your data is secure with us.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
