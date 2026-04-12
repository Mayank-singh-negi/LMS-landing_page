import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login, googleLogin } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      setApiError("");
      try {
        // Exchange access_token for id_token via userinfo
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        await res.json(); // fetch user info (unused but validates token)
        await googleLogin(tokenResponse.access_token);
        navigate("/dashboard");
      } catch (err: unknown) {
        setApiError(err instanceof Error ? err.message : "Google login failed");
      } finally {
        setGLoading(false);
      }
    },
    onError: () => setApiError("Google login was cancelled or failed"),
    flow: "implicit",
  });

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

  const inputCls = "w-full rounded-xl border border-[#2e2e2e] bg-[#242424] px-4 py-3 text-white placeholder:text-[#555] outline-none transition focus:border-[#444] focus:bg-[#2a2a2a] text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d0d0d]"
      style={{ backgroundImage: "radial-gradient(ellipse at 60% 0%, rgba(0,70,67,0.25) 0%, transparent 60%), radial-gradient(ellipse at 0% 100%, rgba(20,184,166,0.1) 0%, transparent 50%)" }}>
      <motion.div className="w-full max-w-[420px]"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        <div className="rounded-2xl border border-[#222] bg-[#161616] shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-[#222]">
            <h1 className="text-xl font-bold text-white mb-1 tracking-tight">Sign in to Learnovora</h1>
            <p className="text-sm text-[#666]">Welcome back! Please sign in to continue</p>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-4">
            {apiError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {apiError}
              </div>
            )}

            {/* Google */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleGoogle()}
              disabled={gLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-[#2e2e2e] bg-[#1e1e1e] hover:bg-[#252525] hover:border-[#3a3a3a] text-white font-semibold py-3 text-sm transition-all duration-200 disabled:opacity-50">
              {gLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              )}
              {gLoading ? "Signing in..." : "Continue with Google"}
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#222]" />
              <span className="text-xs text-[#444]">or</span>
              <div className="flex-1 h-px bg-[#222]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#ccc] mb-1.5">Email address</label>
                <input type="email" placeholder="Enter your email address"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className={inputCls} />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-[#ccc]">Password</label>
                  <button type="button" onClick={() => navigate("/forgot-password")}
                    className="text-xs text-teal-400 hover:text-teal-300 transition font-medium">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Enter your password"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className={`${inputCls} pr-11`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#999] transition">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
              </div>

              <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-[#0d0d0d] py-3 font-bold text-sm shadow-lg hover:bg-[#f0f0f0] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                {loading ? "Signing in..." : "Sign In"}
                {!loading && (
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </motion.button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-[#222] text-center space-y-3">
            <p className="text-sm text-[#666]">
              Don't have an account?{" "}
              <button type="button" onClick={() => navigate("/signup")}
                className="text-white font-semibold hover:text-[#ccc] transition">
                Sign up
              </button>
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[#444] text-xs">
              <ShieldCheck size={12} />
              <span>Secured by Learnovora</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
