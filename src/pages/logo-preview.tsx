import { Logo } from "@/components/Logo";

export default function LogoPreview() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-20 p-12"
      style={{ background: "#F8FAFC" }}
    >
      {/* Hero display */}
      <div className="flex flex-col items-center gap-4">
        <Logo size="xl" />
        <p style={{ fontFamily: "Inter", fontSize: 13, color: "#94A3B8", letterSpacing: "0.1em" }}>
          LEARNOVORA — BRAND IDENTITY
        </p>
      </div>

      {/* Light bg — all sizes */}
      <section className="flex flex-col items-center gap-6 w-full max-w-3xl">
        <label style={{ fontFamily: "Inter", fontSize: 11, color: "#CBD5E1", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          On Light
        </label>
        <div className="flex flex-wrap items-center justify-center gap-10 bg-white rounded-2xl px-14 py-10 w-full"
          style={{ boxShadow: "0 4px 40px rgba(79,70,229,0.07)" }}>
          <Logo size="sm" />
          <Logo size="md" />
          <Logo size="lg" />
          <Logo size="xl" />
        </div>
      </section>

      {/* Dark bg */}
      <section className="flex flex-col items-center gap-6 w-full max-w-3xl">
        <label style={{ fontFamily: "Inter", fontSize: 11, color: "#CBD5E1", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          On Dark
        </label>
        <div className="flex flex-wrap items-center justify-center gap-10 rounded-2xl px-14 py-10 w-full"
          style={{ background: "#0F172A" }}>
          <Logo size="sm" theme="dark" />
          <Logo size="md" theme="dark" />
          <Logo size="lg" theme="dark" />
          <Logo size="xl" theme="dark" />
        </div>
      </section>

      {/* Gradient bg */}
      <section className="flex flex-col items-center gap-6 w-full max-w-3xl">
        <label style={{ fontFamily: "Inter", fontSize: 11, color: "#CBD5E1", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          On Brand Gradient
        </label>
        <div className="flex flex-wrap items-center justify-center gap-10 rounded-2xl px-14 py-10 w-full"
          style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #0e7490 100%)" }}>
          <Logo size="md" theme="dark" />
          <Logo size="lg" theme="dark" />
          <Logo size="xl" theme="dark" />
        </div>
      </section>

      {/* Icon only */}
      <section className="flex flex-col items-center gap-6">
        <label style={{ fontFamily: "Inter", fontSize: 11, color: "#CBD5E1", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Icon Mark Only
        </label>
        <div className="flex items-center gap-8">
          <Logo variant="icon" size="sm" />
          <Logo variant="icon" size="md" />
          <Logo variant="icon" size="lg" />
          <Logo variant="icon" size="xl" />
        </div>
      </section>

      {/* Navbar simulation */}
      <section className="flex flex-col items-center gap-6 w-full max-w-3xl">
        <label style={{ fontFamily: "Inter", fontSize: 11, color: "#CBD5E1", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          In a Navbar
        </label>
        <div className="flex items-center justify-between w-full bg-white rounded-2xl px-8 py-4"
          style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>
          <Logo size="md" />
          <div className="flex gap-6" style={{ fontFamily: "Inter", fontSize: 14, color: "#64748B" }}>
            <span>Courses</span>
            <span>Features</span>
            <span>Pricing</span>
          </div>
          <div className="flex gap-3">
            <div style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, fontFamily: "Inter", color: "#475569" }}>Log in</div>
            <div style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(120deg,#4F46E5,#06B6D4)", fontSize: 13, fontFamily: "Inter", color: "white", fontWeight: 600 }}>Get Started</div>
          </div>
        </div>
        {/* Dark navbar */}
        <div className="flex items-center justify-between w-full rounded-2xl px-8 py-4"
          style={{ background: "#0F172A" }}>
          <Logo size="md" theme="dark" />
          <div className="flex gap-6" style={{ fontFamily: "Inter", fontSize: 14, color: "#94A3B8" }}>
            <span>Courses</span>
            <span>Features</span>
            <span>Pricing</span>
          </div>
          <div style={{ padding: "8px 18px", borderRadius: 8, background: "linear-gradient(120deg,#4F46E5,#06B6D4)", fontSize: 13, fontFamily: "Inter", color: "white", fontWeight: 600 }}>Get Started</div>
        </div>
      </section>
    </div>
  );
}
