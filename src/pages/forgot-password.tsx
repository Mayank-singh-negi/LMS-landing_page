import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowLeft, RefreshCw, KeyRound, Mail, Lock } from "lucide-react";
import { api } from "@/lib/api";

type Step = "email" | "otp" | "password" | "success";

const RESEND_COOLDOWN = 30;

/* ── Password strength ── */
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 6 characters", ok: password.length >= 6 },
    { label: "Contains a number",      ok: /\d/.test(password) },
    { label: "Contains a letter",      ok: /[a-zA-Z]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["bg-red-400", "bg-amber-400", "bg-emerald-500"];
  const labels = ["Weak", "Fair", "Strong"];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2].map(i => (
          <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : "bg-[#2e2e2e]"}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${score === 3 ? "text-emerald-400" : score === 2 ? "text-amber-400" : "text-red-400"}`}>
        {labels[score - 1] || ""}
      </p>
      <div className="space-y-0.5">
        {checks.map(c => (
          <p key={c.label} className={`text-xs flex items-center gap-1.5 ${c.ok ? "text-emerald-400" : "text-[#555]"}`}>
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${c.ok ? "bg-emerald-500 text-white" : "bg-[#2e2e2e] text-[#555]"}`}>
              {c.ok ? "✓" : "·"}
            </span>
            {c.label}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("email");

  // Step 1
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");

  // Step 2
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [resetToken, setResetToken] = useState("");

  // Step 3
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-submit OTP when all 6 digits filled
  useEffect(() => {
    if (step === "otp" && otp.every(d => d !== "") && !loading) {
      handleVerifyOtp();
    }
  }, [otp]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) { setEmailErr("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailErr("Enter a valid email"); return; }
    setEmailErr(""); setError(""); setLoading(true);
    try {
      await api.post("/auth/forgot-password/send-otp", { email: email.trim().toLowerCase() });
      setStep("otp");
      setCountdown(RESEND_COOLDOWN);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally { setLoading(false); }
  };

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[idx] = digit; setOtp(next); setError("");
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split("").forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Enter all 6 digits"); return; }
    if (loading) return;
    setLoading(true); setError("");
    try {
      const data = await api.post<{ resetToken: string }>("/auth/forgot-password/verify-otp", {
        email: email.trim().toLowerCase(), otp: code,
      });
      setResetToken(data.resetToken);
      setStep("password");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/auth/forgot-password/reset", {
        email: email.trim().toLowerCase(), resetToken, newPassword: newPw,
      });
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally { setLoading(false); }
  };

  const inputCls = "w-full rounded-xl border border-[#2e2e2e] bg-[#242424] px-4 py-3 text-white placeholder:text-[#555] outline-none transition focus:border-[#444] focus:bg-[#2a2a2a] text-sm";

  const stepLabels = ["Email", "Verify OTP", "New Password"];
  const stepIdx = step === "email" ? 0 : step === "otp" ? 1 : step === "password" ? 2 : 3;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d0d0d]"
      style={{ backgroundImage: "radial-gradient(ellipse at 60% 0%, rgba(0,70,67,0.25) 0%, transparent 60%), radial-gradient(ellipse at 0% 100%, rgba(20,184,166,0.1) 0%, transparent 50%)" }}>
      <motion.div className="w-full max-w-[420px]"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        <div className="rounded-2xl border border-[#222] bg-[#161616] shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-[#222]">
            <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 text-[#666] hover:text-white transition text-sm mb-5">
              <ArrowLeft size={14} /> Back to Login
            </button>
            <h1 className="text-xl font-bold text-white mb-1 tracking-tight">Reset your password</h1>
            <p className="text-sm text-[#666]">We'll send a one-time code to your email</p>

            {/* Step indicator */}
            {step !== "success" && (
              <div className="flex items-center gap-2 mt-5">
                {stepLabels.map((label, i) => (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < stepIdx ? "bg-teal-500 text-white" : i === stepIdx ? "bg-white text-[#0d0d0d]" : "bg-[#2e2e2e] text-[#555]"}`}>
                        {i < stepIdx ? <CheckCircle2 size={14} /> : i + 1}
                      </div>
                      <span className={`text-xs font-semibold hidden sm:block ${i === stepIdx ? "text-white" : i < stepIdx ? "text-teal-400" : "text-[#444]"}`}>{label}</span>
                    </div>
                    {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${i < stepIdx ? "bg-teal-500" : "bg-[#2e2e2e]"}`} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            <AnimatePresence mode="wait">

              {/* ── Step 1: Email ── */}
              {step === "email" && (
                <motion.div key="email" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-[#1e1e1e] border border-[#2e2e2e]">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
                      <Mail size={18} className="text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Enter your email</p>
                      <p className="text-xs text-[#666]">We'll send a 6-digit OTP to verify it's you</p>
                    </div>
                  </div>

                  {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#ccc] mb-1.5">Email address</label>
                      <input type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailErr(""); }}
                        placeholder="Enter your registered email" autoFocus className={inputCls} />
                      {emailErr && <p className="mt-1 text-xs text-red-400">{emailErr}</p>}
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-[#0d0d0d] py-3 font-bold text-sm shadow-lg hover:bg-[#f0f0f0] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? <><span className="w-4 h-4 border-2 border-[#0d0d0d]/30 border-t-[#0d0d0d] rounded-full animate-spin" /> Sending OTP...</> : "Send OTP →"}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── Step 2: OTP ── */}
              {step === "otp" && (
                <motion.div key="otp" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-[#1e1e1e] border border-[#2e2e2e]">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
                      <KeyRound size={18} className="text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Check your inbox</p>
                      <p className="text-xs text-[#666]">OTP sent to <span className="text-teal-400 font-medium">{email}</span></p>
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-[#ccc] mb-3 text-center">Enter 6-digit OTP</label>
                      <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                        {otp.map((digit, idx) => (
                          <input key={idx} ref={el => { otpRefs.current[idx] = el; }}
                            type="text" inputMode="numeric" maxLength={1} value={digit}
                            onChange={e => handleOtpChange(idx, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(idx, e)}
                            className={`w-11 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all bg-[#1e1e1e] text-white ${digit ? "border-teal-500 bg-teal-500/10" : "border-[#2e2e2e] focus:border-[#444]"} ${error ? "border-red-500/50 bg-red-500/5" : ""}`}
                            style={{ height: "52px" }} />
                        ))}
                      </div>
                      <p className="text-center text-xs text-[#555] mt-2">Expires in 5 minutes</p>
                    </div>

                    <button type="submit" disabled={loading || otp.some(d => !d)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-[#0d0d0d] py-3 font-bold text-sm shadow-lg hover:bg-[#f0f0f0] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? <><span className="w-4 h-4 border-2 border-[#0d0d0d]/30 border-t-[#0d0d0d] rounded-full animate-spin" /> Verifying...</> : "Verify OTP →"}
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <button type="button" onClick={() => { setStep("email"); setError(""); setOtp(["","","","","",""]); }}
                        className="text-xs text-[#555] hover:text-white transition">
                        ← Change email
                      </button>
                      {countdown > 0 ? (
                        <span className="text-xs text-[#555] flex items-center gap-1">
                          <RefreshCw size={11} /> Resend in {countdown}s
                        </span>
                      ) : (
                        <button type="button" onClick={handleSendOtp} disabled={loading}
                          className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 disabled:opacity-50 transition">
                          <RefreshCw size={11} /> Resend OTP
                        </button>
                      )}
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── Step 3: New Password ── */}
              {step === "password" && (
                <motion.div key="password" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                  <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-[#1e1e1e] border border-[#2e2e2e]">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Lock size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Set new password</p>
                      <p className="text-xs text-[#666]">Choose a strong password for your account</p>
                    </div>
                  </div>

                  {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#ccc] mb-1.5">New password</label>
                      <div className="relative">
                        <input type={showPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)}
                          placeholder="Min 6 characters" className={`${inputCls} pr-11`} />
                        <button type="button" onClick={() => setShowPw(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#999] transition">
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <PasswordStrength password={newPw} />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#ccc] mb-1.5">Confirm password</label>
                      <div className="relative">
                        <input type={showConfirm ? "text" : "password"} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                          placeholder="Repeat your password" className={`${inputCls} pr-11`} />
                        <button type="button" onClick={() => setShowConfirm(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#999] transition">
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {confirmPw && newPw !== confirmPw && (
                        <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                      )}
                      {confirmPw && newPw === confirmPw && newPw.length >= 6 && (
                        <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> Passwords match</p>
                      )}
                    </div>

                    <button type="submit" disabled={loading || newPw.length < 6 || newPw !== confirmPw}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-[#0d0d0d] py-3 font-bold text-sm shadow-lg hover:bg-[#f0f0f0] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                      {loading ? <><span className="w-4 h-4 border-2 border-[#0d0d0d]/30 border-t-[#0d0d0d] rounded-full animate-spin" /> Resetting...</> : "Reset Password →"}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── Success ── */}
              {step === "success" && (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
                  className="text-center py-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={36} className="text-emerald-400" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
                  <p className="text-[#666] text-sm mb-6">Your password has been updated successfully. You can now sign in with your new password.</p>
                  <button onClick={() => navigate("/login")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-[#0d0d0d] py-3 font-bold text-sm shadow-lg hover:bg-[#f0f0f0] transition-all duration-200">
                    Go to Login →
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer */}
          {step !== "success" && (
            <div className="px-8 py-4 border-t border-[#222] text-center">
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
