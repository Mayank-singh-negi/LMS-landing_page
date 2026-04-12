import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  BrainCircuit, 
  ArrowRight, 
  Users, 
  Zap,
  Menu,
  X,
  Star,
  Github,
  Linkedin,
  Mail
} from "lucide-react";
import Lottie from "lottie-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import onlineLearningAnimation from "../../Online Learning.json";

const NAV_LINKS = [
  { name: "Courses", href: "#courses-section" },
  { name: "Features", href: "#features" },
  { name: "How it Works", href: "#how-it-works" },
  { name: "Testimonials", href: "#testimonials" },
];

const FEATURES = [
  {
    title: "AI Doubt Solver",
    description: "Get instant answers to your complex questions with our integrated AI tutor available 24/7.",
    icon: <BrainCircuit className="w-8 h-8" />,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Premium Content",
    description: "Access high-quality, structured learning materials created by industry experts.",
    icon: <BookOpen className="w-8 h-8" />,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    title: "Progress Tracking",
    description: "Visualize your learning journey with detailed analytics and completion certificates.",
    icon: <Zap className="w-8 h-8" />,
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "Global Community",
    description: "Learn together with students worldwide and share your knowledge on the platform.",
    icon: <Users className="w-8 h-8" />,
    color: "bg-emerald-50 text-emerald-600",
  }
];

const STEPS = [
  {
    title: "Choose Your Path",
    description: "Browse our extensive library of premium courses across various disciplines.",
    icon: <Search className="w-6 h-6" />
  },
  {
    title: "Learn with AI",
    description: "Engage with interactive content and get instant help from your AI assistant.",
    icon: <Sparkles className="w-6 h-6" />
  },
  {
    title: "Master the Skill",
    description: "Complete hands-on projects and quizzes to solidify your understanding.",
    icon: <GraduationCap className="w-6 h-6" />
  }
];

function Search({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}

interface ApiCourse { _id: string; title: string; description: string; thumbnail?: string; averageRating: number; teacher?: { name: string }; }

function CourseCard({ course, index }: { course: ApiCourse; index: number }) {
  const [, navigate] = useLocation();
  return (
    <motion.div
      onClick={() => navigate(`/courses/${course._id}`)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
    >
      <div className="aspect-video bg-slate-200 overflow-hidden">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-white/30" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1 line-clamp-2">{course.title}</h3>
        <p className="text-xs text-slate-800 mb-2 line-clamp-2">{course.description}</p>
        <p className="text-xs text-slate-700 mb-2">{course.teacher?.name || "Instructor"}</p>
        <div className="flex items-center gap-1 mb-3">
          <span className="text-xs font-bold text-slate-700">{course.averageRating?.toFixed(1) || "New"}</span>
          <div className="flex">
            {[1,2,3,4,5].map(s => (
              <svg key={s} className={`w-3 h-3 ${s <= Math.round(course.averageRating || 0) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            ))}
          </div>
        </div>
        <span className="text-xs font-semibold text-blue-600">View Course →</span>
      </div>
    </motion.div>
  );
}

function CoursesSection() {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [showAll, setShowAll] = useState(false);
  const INITIAL_COUNT = 4;

  useEffect(() => {
    // Fetch real courses from backend — fall back to empty if unauthenticated
    const BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : "/api/v1";
    const token = localStorage.getItem("accessToken");
    fetch(`${BASE}/courses`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => setCourses(Array.isArray(d.courses) ? d.courses : []))
      .catch(() => setCourses([]));
  }, []);

  const visible = showAll ? courses : courses.slice(0, INITIAL_COUNT);

  const handleToggle = () => {
    if (showAll) {
      document.getElementById("courses-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setShowAll(prev => !prev);
  };

  return (
    <section id="courses-section" className="py-16 sm:py-24 bg-[#faf8f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-3 sm:mb-4">Learn from the best</h2>
          <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto">Discover our top-rated courses across various categories. From coding and design to business and wellness, our courses are crafted to deliver results.</p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No published courses yet. Check back soon!</p>
          </div>
        ) : (
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" layout>
            <AnimatePresence mode="sync">
              {visible.map((course, idx) => (
                <CourseCard key={course._id} course={course} index={idx} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {courses.length > INITIAL_COUNT && (
        <div className="text-center mt-12">
          <button
            onClick={handleToggle}
            className="inline-flex items-center gap-2 px-8 py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all duration-200"
          >
            {showAll ? "Show Less" : "Show All Courses"}
            <motion.svg
              animate={{ rotate: showAll ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="w-4 h-4"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>
        </div>
        )}
      </div>
    </section>
  );
}

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, navigate] = useLocation();
  const { scrollY } = useScroll();
  const navBackground = useTransform(scrollY, [0, 50], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.8)"]);
  const navShadow = useTransform(scrollY, [0, 50], ["none", "0 4px 20px -5px rgba(0, 0, 0, 0.05)"]);

  const handleLogin = () => navigate("/login");
  const handleSignup = () => navigate("/signup");

  return (
    <div className="min-h-screen bg-cream text-slate-900 selection:bg-teal/20 selection:text-teal overflow-x-hidden">
      {/* Navbar */}
      <motion.nav
        style={{ backgroundColor: navBackground, boxShadow: navShadow }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="absolute top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-300 border-b border-transparent data-[scrolled=true]:border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo size="md" theme="light" />
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-base font-semibold text-slate-700 hover:text-teal transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" onClick={handleLogin} className="font-semibold text-slate-700 h-11 px-5">Log In</Button>
            <Button 
              onClick={handleSignup}
              className="bg-teal hover:bg-teal-dark text-white rounded-xl shadow-lg shadow-teal/20 px-6 h-11 font-semibold transition-all hover:-translate-y-0.5"
            >
              Sign Up Free
            </Button>
          </div>

          <button className="md:hidden p-2 text-slate-800" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="mx-4 mb-4 rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
                {/* Nav links */}
                <div className="p-2">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-teal/5 hover:text-teal transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-teal/40 shrink-0" />
                      {link.name}
                    </a>
                  ))}
                </div>
                {/* Divider */}
                <div className="mx-4 border-t border-slate-100" />
                {/* Buttons */}
                <div className="p-4 flex flex-col gap-2.5">
                  <Button
                    variant="outline"
                    onClick={() => { handleLogin(); setIsMenuOpen(false); }}
                    className="w-full h-11 rounded-xl border-slate-200 text-slate-700 font-semibold"
                  >
                    Log In
                  </Button>
                  <Button
                    onClick={() => { handleSignup(); setIsMenuOpen(false); }}
                    className="w-full h-11 rounded-xl bg-teal hover:bg-teal-dark text-white font-semibold shadow-lg shadow-teal/20"
                  >
                    Get Started Free
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-24 overflow-hidden min-h-[500px]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[1000px] h-[400px] sm:h-[600px] bg-teal/5 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10"
            >
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-teal/10 border border-teal/20 text-teal mb-6 sm:mb-8">
              <Sparkles size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">AI-Powered EdTech Platform</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-4 sm:mb-6">
              Learn Smarter, Not <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal to-teal-light">Faster with AI.</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-slate-800 mb-8 sm:mb-10 leading-relaxed">
              Learnovora is the premium LMS that combines high-quality courses with an intelligent AI tutor to help you master any subject in record time.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4 mb-8 sm:mb-10">
              <Button 
                onClick={handleSignup}
                className="w-full sm:w-auto bg-teal hover:bg-teal-dark text-white rounded-xl h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-bold shadow-lg shadow-teal/20 transition-all hover:-translate-y-0.5"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button 
                variant="ghost"
                className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                Watch Demo
              </Button>
            </div>
          </motion.div>

          {/* Lottie Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="hidden lg:flex items-start justify-center -mt-32"
          >
            <div className="w-full max-w-[1200px] scale-150">
              <Lottie 
                animationData={onlineLearningAnimation} 
                loop={true}
                className="w-full h-full"
              />
            </div>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-8 sm:py-12 border-y border-cream-dark bg-cream-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-[0.2em] mb-6 sm:mb-10">Trusted by students from</p>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 lg:gap-20">
            {/* Microsoft */}
            <div className="flex items-center gap-2 transition-opacity">
              <svg width="21" height="21" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="10" height="10" fill="#F25022"/>
                <rect x="11" y="0" width="10" height="10" fill="#7FBA00"/>
                <rect x="0" y="11" width="10" height="10" fill="#00A4EF"/>
                <rect x="11" y="11" width="10" height="10" fill="#FFB900"/>
              </svg>
              <span className="text-lg font-semibold text-slate-700 tracking-tight">Microsoft</span>
            </div>
            {/* Walmart */}
            <div className="flex items-center gap-2 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.5l1.2 4.6L17.5 4l-2.1 4.3 4.6 1.2-4.6 1.2 2.1 4.3-4.3-2.1-1.2 4.6-1.2-4.6-4.3 2.1 2.1-4.3L4 9.5l4.6-1.2L6.5 4l4.3 2.1z" fill="#0071CE"/>
              </svg>
              <span className="text-lg font-bold text-[#0071CE] tracking-tight">Walmart</span>
            </div>
            {/* Accenture */}
            <div className="flex items-center gap-1 transition-opacity">
              <span className="text-lg font-semibold text-slate-900 tracking-tight">accenture</span>
              <svg width="10" height="14" viewBox="0 0 10 14" xmlns="http://www.w3.org/2000/svg">
                <polygon points="0,14 10,7 0,0" fill="#A100FF"/>
              </svg>
            </div>
            {/* Adobe */}
            <div className="flex items-center gap-2 transition-opacity">
              <svg width="28" height="24" viewBox="0 0 28 24" xmlns="http://www.w3.org/2000/svg">
                <polygon points="0,24 10,0 20,24" fill="#FF0000"/>
                <polygon points="28,0 18,0 28,24" fill="#FF0000"/>
              </svg>
              <span className="text-lg font-bold text-slate-800 tracking-tight">Adobe</span>
            </div>
            {/* PayPal */}
            <div className="flex items-center gap-2 transition-opacity">
              <svg width="20" height="24" viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.5 4C19.5 1.5 17 0 13.5 0H5C4.2 0 3.5.6 3.4 1.4L0 22.6c-.1.6.4 1.2 1 1.2h5.5l1.4-8.8-.1.4C8 14.6 8.7 14 9.5 14h2c5.5 0 9.8-2.2 11-8.6 0-.2.1-.4.1-.6-.3-.2-.1-.5-.1-.8z" fill="#003087"/>
                <path d="M20.6 4.8c-.1.2-.1.4-.1.6-1.2 6.4-5.5 8.6-11 8.6h-2c-.8 0-1.5.6-1.6 1.4l-1.7 10.8c-.1.5.3 1 .8 1h4.8c.7 0 1.3-.5 1.4-1.2l.1-.3 1.1-7 .1-.4c.1-.7.7-1.2 1.4-1.2h.9c5 0 8.9-2 10-7.8.5-2.4.2-4.4-1.2-5.5z" fill="#009CDE"/>
              </svg>
              <span className="text-lg font-bold text-[#003087] tracking-tight">Pay<span className="text-[#009CDE]">Pal</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-4 sm:mb-6 leading-tight">Powerful features for modern learners</h2>
            <p className="text-base sm:text-lg text-slate-800 leading-relaxed">Everything you need to master your chosen subject, powered by cutting-edge technology.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-5 sm:p-8 bg-white rounded-2xl sm:rounded-[32px] border border-cream-dark hover:border-teal/20 transition-all duration-300 premium-shadow hover:shadow-2xl hover:shadow-teal/5 hover:-translate-y-2"
              >
                <div className={cn("w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-transform group-hover:scale-110", feature.color)}>
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900 mb-2 sm:mb-3 leading-snug">{feature.title}</h3>
                <p className="text-slate-800 leading-relaxed text-sm sm:text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-cream-light relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-6 sm:mb-8 leading-tight">Your path to mastery, <br className="hidden sm:block" />simplified.</h2>
              <div className="space-y-8 sm:space-y-12">
                {STEPS.map((step, idx) => (
                  <motion.div 
                    key={step.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 }}
                    className="flex gap-4 sm:gap-6"
                  >
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-cream-dark flex items-center justify-center font-bold text-teal shadow-sm text-sm sm:text-base">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3 leading-snug">{step.title}</h4>
                      <p className="text-slate-800 leading-relaxed text-sm sm:text-base">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Education Illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="hidden lg:flex items-center justify-center w-full"
            >
              <img 
                src="/assets/icons/SVG/5 SCENE.svg" 
                alt="Students learning together" 
                className="w-full h-auto scale-125"
              />
            </motion.div>
          </div>
        </div>
      </section>



      {/* Courses Section */}
      <CoursesSection />

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 sm:py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-4 sm:mb-6">Loved by learners worldwide</h2>
            <p className="text-base sm:text-lg text-slate-700">Join thousands of students who have transformed their lives with Learnovora.</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8">
            {[
              {
                name: "Mayank Negi",
                role: "University Student",
                content: "The AI assistant is a game changer. Whenever I get stuck on a coding concept, it explains it perfectly within seconds.",
                avatar: "https://i.pravatar.cc/100?img=11"
              },
              {
                name: "Shivang Khathait",
                role: "University Student",
                content: "The platform's design is so clean and motivating. It's the first LMS I've used that actually makes me want to log in every day.",
                avatar: "https://i.pravatar.cc/100?img=12"
              },
              {
                name: "Shantanu Kumar Chaubey",
                role: "University Student",
                content: "Structured content paired with real-time AI help. This is exactly how online learning should have always been.",
                avatar: "https://i.pravatar.cc/100?img=13"
              }
            ].map((testimonial, idx) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-5 sm:p-8 bg-white rounded-2xl sm:rounded-[32px] border border-cream-dark shadow-xl shadow-slate-200/20"
              >
                <div className="flex text-amber-400 mb-4 sm:mb-6">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <p className="text-slate-800 mb-6 sm:mb-8 leading-relaxed italic text-sm sm:text-base">"{testimonial.content}"</p>
                <div className="flex items-center gap-3 sm:gap-4">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm sm:text-base">{testimonial.name}</h5>
                    <p className="text-xs text-slate-800 font-bold uppercase">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl sm:rounded-[48px] bg-teal text-white p-8 sm:p-12 lg:p-24 text-center">
          <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-teal-light/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-teal-dark/10 rounded-full blur-[120px]" />
          
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-display font-bold mb-5 sm:mb-8 leading-tight">Ready to unlock your <br className="hidden sm:block" />full potential?</h2>
            <p className="text-base sm:text-xl text-blue-100 mb-8 sm:mb-12 max-w-2xl mx-auto">Join the future of learning today. Get started for free and master any skill with the help of AI.</p>
            <Button 
              onClick={handleSignup}
              className="bg-white text-teal hover:bg-cream rounded-xl sm:rounded-2xl h-12 sm:h-16 px-8 sm:px-12 text-base sm:text-lg font-bold shadow-2xl transition-all hover:-translate-y-1 animate-pulse"
            >
              Start Learning Now
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <p className="mt-6 sm:mt-8 text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-widest">No credit card required • Instant access</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full overflow-hidden pt-16 pb-8 bg-cream">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute top-0 left-1/2 z-0 h-full w-full -translate-x-1/2 select-none">
          <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-teal/20 blur-3xl" />
          <div className="absolute right-1/4 -bottom-24 h-80 w-80 rounded-full bg-teal-light/20 blur-3xl" />
        </div>

        {/* Glass card */}
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 rounded-2xl border border-teal-dark bg-teal px-6 py-10 shadow-xl md:flex-row md:items-start md:justify-between md:gap-12">

          {/* Left — logo + desc + socials */}
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <Logo size="sm" theme="dark" />
            </Link>
            <p className="text-white/70 mb-6 max-w-xs text-center text-sm md:text-left leading-relaxed">
              The premium AI-powered learning platform designed for modern creators and students.
            </p>
            <div className="flex gap-3 text-white">
              <a href="https://github.com/Mayank-singh-negi" target="_blank" rel="noopener noreferrer"
                aria-label="GitHub" className="hover:text-white/70 transition">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/mayank-negi-55712533b/" target="_blank" rel="noopener noreferrer"
                aria-label="LinkedIn" className="hover:text-white/70 transition">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="mailto:negimayank243@gmail.com" aria-label="Email"
                className="hover:text-white/70 transition">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Right — nav columns */}
          <nav className="flex w-full flex-col gap-8 text-center md:w-auto md:flex-row md:justify-end md:text-left">
            <div>
              <p className="mb-3 text-xs font-semibold tracking-widest text-white/60 uppercase">Platform</p>
              <ul className="space-y-2">
                {["Explore Courses", "AI Assistant", "Creator Tools", "Community"].map(item => (
                  <li key={item}><a href="#" className="text-sm text-white/75 hover:text-white transition">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold tracking-widest text-white/60 uppercase">Company</p>
              <ul className="space-y-2">
                {["About Us", "Careers", "Blog", "Contact"].map(item => (
                  <li key={item}><a href="#" className="text-sm text-white/75 hover:text-white transition">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold tracking-widest text-white/60 uppercase">Support</p>
              <ul className="space-y-2">
                {["Help Center", "Safety Center", "Guidelines", "Privacy Policy"].map(item => (
                  <li key={item}><a href="#" className="text-sm text-white/75 hover:text-white transition">{item}</a></li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="relative z-10 mt-8 text-center text-xs text-slate-400">
          <span>© 2025 Learnovora Inc. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}




