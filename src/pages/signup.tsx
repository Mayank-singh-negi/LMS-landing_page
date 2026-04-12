import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, BookOpen, GraduationCap, CheckCircle2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";

type Role = "student" | "teacher";
type Step = 1 | 2 | 3 | 4; // 4 = success

const STEP_LABELS = ["Your Info", "Verify Email", "Set Password"];

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { register, googleLogin } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role>("student");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      setApiError("");
      try {
        await googleLogin(tokenResponse.access_token);
        navigate("/dashboard");
      } catch (err: unknown) {
        setApiError(err instanceof Error ? err.message : "Google signup failed");
      } finally {
        setGLoading(false);
      }
    },
    onError: () => setApiError("Google signup was cancelled or failed"),
    flow: "implicit",
  });

  // Timer countdown for OTP
  useEffect(() => {
    if (step !== 2) return;
    setTimer(60);
    setCanResend(false);
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const passwordStrength = useMemo(() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }, [form.password]);

  const strengthMeta = [
    { label: "Too weak", color: "bg-[#444]" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-amber-400" },
    { label: "Good", color: "bg-blue-400" },
    { label: "Strong", color: "bg-emerald-400" },
  ][passwordStrength];

  // Step 1 — Send OTP
  const handleSendOtp = async () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    setApiError("");
    try {
      await api.post("/auth/send-otp", { name: form.name, email: form.email });
      setStep(2);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { setErrors({ otp: "Enter the 6-digit code" }); return; }
    setLoading(true);
    setApiError("");
    try {
      await api.post("/auth/verify-otp", { email: form.email, otp: code });
      setStep(3);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Invalid OTP");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!canResend) return;
    setLoading(true);
    setApiError("");
    try {
      await api.post("/auth/send-otp", { name: form.name, email: form.email });
      setOtp(["", "", "", "", "", ""]);
      setTimer(60);
      setCanResend(false);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — Complete signup
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "At least 8 characters";
    if (form.confirmPassword !== form.password) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setApiError("");
    try {
      await register(form.name, form.email, form.password, role);
      setStep(4);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const inputCls = "w-full rounded-xl border border-[#2e2e2e] bg-[#242424] px-4 py-3 text-white placeholder:text-[#555] outline-none transition focus:border-[#444] focus:bg-[#2a2a2a] text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10 bg-[#0d0d0d]"
      style={{ backgroundImage: "radial-gradient(ellipse at 60% 0%, rgba(0,70,67,0.25) 0%, transparent 60%), radial-gradient(ellipse at 0% 100%, rgba(20,184,166,0.1) 0%, transparent 50%)" }}>
      <motion.div className="w-full max-w-[420px]"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        <div className="rounded-2xl border border-[#222] bg-[#161616] shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-5 border-b border-[#222]">
            <h1 className="text-xl font-bold text-white mb-1 tracking-tight text-center">Create your account</h1>
            <p className="text-sm text-[#666] text-center mb-5">Start your learning journey today</p>

            {/* Step indicator — only show for steps 1-3 */}
            {step !== 4 && (
              <div className="flex items-center justify-center gap-0">
                {STEP_LABELS.map((label, i) => {
                  const s = i + 1;
                  const active = step === s;
                  const done = step > s;
                  return (
                    <div key={s} className="flex items-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          done ? "bg-emerald-500 text-white" : active ? "bg-white text-[#0d0d0d]" : "bg-[#2a2a2a] text-[#555]"
                        }`}>
                          {done ? <CheckCircle2 size={14} /> : s}
                        </div>
                        <span className={`text-[10px] font-medium ${active ? "text-white" : done ? "text-emerald-400" : "text-[#555]"}`}>
                          {label}
                        </span>
                      </div>
                      {i < 2 && <div className={`w-10 h-px mb-4 mx-1 ${step > s ? "bg-emerald-500" : "bg-[#2a2a2a]"}`} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            {apiError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {apiError}
              </div>
            )}

            <AnimatePresence mode="wait">

              {/* STEP 1 — Name + Email */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
                  className="space-y-4">

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
                    {gLoading ? "Signing up..." : "Continue with Google"}
                  </motion.button>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#222]" />
                    <span className="text-xs text-[#444]">or</span>
                    <div className="flex-1 h-px bg-[#222]" />
                  </div>

                  {/* Role selector */}
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: "student", label: "Student", icon: BookOpen, desc: "I want to learn" },
                      { value: "teacher", label: "Teacher", icon: GraduationCap, desc: "I want to teach" },
                    ] as { value: Role; label: string; icon: React.ElementType; desc: string }[]).map(opt => (
                      <button key={opt.value} type="button" onClick={() => setRole(opt.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${
                          role === opt.value ? "border-[#004643] bg-[#004643]/20 text-white" : "border-[#2e2e2e] bg-[#1e1e1e] text-[#888] hover:border-[#3a3a3a] hover:text-white"
                        }`}>
                        <opt.icon size={16} />
                        <span className="text-xs font-semibold">{opt.label}</span>
                        <span className="text-[10px] text-[#555]">{opt.desc}</span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#ccc] mb-1.5">Full name</label>
                    <input type="text" placeholder="Enter your full name" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#ccc] mb-1.5">Email address</label>
                    <input type="email" placeholder="Enter your email address" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                  </div>

                  <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={handleSendOtp} disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-[#0d0d0d] py-3 font-bold text-sm shadow-lg hover:bg-[#f0f0f0] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Sending OTP..." : "Send OTP"}
                    {!loading && <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>}
                  </motion.button>
                </motion.div>
              )}

              {/* STEP 2 — OTP Verification */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}
                  className="space-y-5">
                  <div className="text-center">
                    <p className="text-sm text-[#888]">We sent a 6-digit code to</p>
                    <p className="text-white font-semibold text-sm mt-0.5">{form.email}</p>
                  </div>

                  {/* OTP inputs */}
                  <div>
                    <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input key={i} ref={el => { otpRefs.current[i] = el; }}
                          type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          autoFocus={i === 0}
                          className={`w-11 h-12 text-center text-lg font-bold rounded-xl border bg-[#242424] text-white outline-none transition ${
                            digit ? "border-white" : "border-[#2e2e2e]"
                          } focus:border-[#555]`}
                        />
                      ))}
                    </div>
                    {errors.otp && <p className="mt-2 text-xs text-red-400 text-center">{errors.otp}</p>}
                  </div>

                  {/* Timer */}
                  <div className="text-center text-sm">
                    {canResend ? (
                      <button type="button" onClick={handleResend} disabled={loading}
                        className="text-white font-semibold hover:text-[#ccc] transition disabled:opacity-50">
                        Resend OTP
                      </button>
                    ) : (
                      <span className="text-[#555]">Resend in <span className="text-[#888] font-semibold">{timer}s</span></span>
                    )}
                  </div>

                  <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={handleVerifyOtp} disabled={loading || otp.join("").length < 6}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-[#0d0d0d] py-3 font-bold text-sm shadow-lg hover:bg-[#f0f0f0] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Verifying..." : "Verify OTP"}
                    {!loading && <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>}
                  </motion.button>

                  <button type="button" onClick={() => setStep(1)} className="w-full text-center text-xs text-[#555] hover:text-[#888] transition">
                    ← Change email
                  </button>
                </motion.div>
              )}

              {/* STEP 3 — Set Password */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#ccc] mb-1.5">Password</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="Create a password"
                          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                          className={`${inputCls} pr-11`} autoFocus />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#999] transition">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {form.password && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex gap-1 flex-1">
                            {[1,2,3,4].map(i => (
                              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthMeta.color : "bg-[#2e2e2e]"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-[#666]">{strengthMeta.label}</span>
                        </div>
                      )}
                      {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#ccc] mb-1.5">Confirm password</label>
                      <div className="relative">
                        <input type={showConfirm ? "text" : "password"} placeholder="Confirm your password"
                          value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                          className={`${inputCls} pr-11`} />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#999] transition">
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
                    </div>

                    <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-[#0d0d0d] py-3 font-bold text-sm shadow-lg hover:bg-[#f0f0f0] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? "Creating account..." : "Create Account"}
                      {!loading && <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* STEP 4 — Success */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
                  className="text-center py-4 space-y-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} className="text-emerald-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Account created!</h2>
                    <p className="text-sm text-[#666]">Welcome to Learnovora, {form.name.split(" ")[0]}!</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate("/dashboard")}
                    className="w-full rounded-xl bg-white text-[#0d0d0d] py-3 font-bold text-sm hover:bg-[#f0f0f0] transition-all">
                    Go to Dashboard →
                  </motion.button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer */}
          {step !== 4 && (
            <div className="px-8 py-5 border-t border-[#222] text-center space-y-3">
              <p className="text-sm text-[#666]">
                Already have an account?{" "}
                <button type="button" onClick={() => navigate("/login")}
                  className="text-white font-semibold hover:text-[#ccc] transition">
                  Sign in
                </button>
              </p>
              <div className="flex items-center justify-center gap-1.5 text-[#444] text-xs">
                <ShieldCheck size={12} />
                <span>Secured by Learnovora</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
