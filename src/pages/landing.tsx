import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  BrainCircuit, 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Globe, 
  Zap,
  Menu,
  X,
  Star,
  Play
} from "lucide-react";
import CountUp from "react-countup";
import Lottie from "lottie-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import onlineLearningAnimation from "../../Online Learning.json";

// Mock Lottie animation data (Simplified)
const animationData = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 180,
  w: 500,
  h: 500,
  nm: "Learning Animation",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0] }, { t: 180, s: [360] }] },
        p: { a: 0, k: [250, 250, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            { d: 1, ty: "el", s: { a: 0, k: [300, 300] }, p: { a: 0, k: [0, 0] }, nm: "Ellipse Path 1" },
            { ty: "st", c: { a: 0, k: [0.2, 0.5, 1, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 2 }, lc: 1, lj: 1, ml: 4, nm: "Stroke 1" },
            { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 }, nm: "Transform" }
          ]
        }
      ]
    }
  ]
};

const NAV_LINKS = [
  { name: "Features", href: "#features" },
  { name: "How it Works", href: "#how-it-works" },
  { name: "Stats", href: "#stats" },
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

export default function Landing() {
  const { user, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const navBackground = useTransform(scrollY, [0, 50], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.8)"]);
  const navShadow = useTransform(scrollY, [0, 50], ["none", "0 4px 20px -5px rgba(0, 0, 0, 0.05)"]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-primary overflow-x-hidden">
      {/* Navbar */}
      <motion.nav
        style={{ backgroundColor: navBackground, boxShadow: navShadow }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-300 border-b border-transparent data-[scrolled=true]:border-slate-100"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <GraduationCap size={26} />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-slate-900">Learnovora</span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-base font-semibold text-slate-700 hover:text-primary transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" onClick={handleLogin} className="font-semibold text-slate-700 h-11 px-5">Log In</Button>
            <Button 
              onClick={handleLogin}
              className="bg-primary hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-primary/20 px-6 h-11 font-semibold transition-all hover:-translate-y-0.5"
            >
              Sign Up Free
            </Button>
          </div>

          <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-semibold text-slate-600"
                  >
                    {link.name}
                  </a>
                ))}
                <div className="pt-4 border-t border-slate-50 flex flex-col gap-3">
                  <Button variant="outline" onClick={handleLogin} className="w-full h-12 rounded-xl">Log In</Button>
                  <Button onClick={handleLogin} className="w-full h-12 rounded-xl bg-primary text-white">Get Started</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden min-h-[600px]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto px-8 lg:px-16 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10"
            >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-primary mb-8">
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">AI-Powered EdTech Platform</span>
            </div>
            <h1 className="text-6xl lg:text-7xl xl:text-8xl font-display font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Learn Smarter, Not <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">Faster with AI.</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed">
              Learnovora is the premium LMS that combines high-quality courses with an intelligent AI tutor to help you master any subject in record time.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
              <Button 
                onClick={handleLogin}
                className="w-full sm:w-auto bg-primary hover:bg-blue-700 text-white rounded-xl h-14 px-8 text-base font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="ghost"
                className="w-full sm:w-auto h-14 px-8 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="flex text-amber-400 mb-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <p className="font-bold text-slate-900">4.9/5 from 2,000+ learners</p>
              </div>
            </div>
          </motion.div>

          {/* Lottie Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="hidden lg:flex items-start justify-center -mt-40"
          >
            <div className="w-full max-w-[800px]">
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
      <section className="py-12 border-y border-slate-50 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-10">Trusted by students from</p>
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-40 grayscale">
            {["Google", "Microsoft", "Amazon", "Meta", "Netflix"].map(brand => (
              <span key={brand} className="text-2xl font-display font-extrabold tracking-tighter text-slate-900">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-6 leading-tight">Powerful features for modern learners</h2>
            <p className="text-lg text-slate-600 leading-relaxed">Everything you need to master your chosen subject, powered by cutting-edge technology.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-8 bg-white rounded-[32px] border border-slate-100 hover:border-primary/20 transition-all duration-300 premium-shadow hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2"
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", feature.color)}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 mb-3 leading-snug">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-base">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-slate-50/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-8 leading-tight">Your path to mastery, <br />simplified.</h2>
            <div className="space-y-12">
              {STEPS.map((step, idx) => (
                <motion.div 
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="flex gap-6"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-primary shadow-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-3 leading-snug">{step.title}</h4>
                    <p className="text-slate-600 leading-relaxed text-base">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12 text-center relative z-10">
          {[
            { label: "Active Learners", value: 15000, suffix: "+" },
            { label: "Expert Tutors", value: 250, suffix: "+" },
            { label: "AI Conversations", value: 1.2, suffix: "M" },
            { label: "Success Rate", value: 98, suffix: "%" }
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-4xl lg:text-6xl font-display font-extrabold mb-2">
                <CountUp end={stat.value} duration={3} decimals={stat.value % 1 !== 0 ? 1 : 0} />
                {stat.suffix}
              </div>
              <p className="text-blue-100 font-bold uppercase tracking-widest text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-6">Loved by learners worldwide</h2>
            <p className="text-lg text-slate-500">Join thousands of students who have transformed their lives with Learnovora.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex Johnson",
                role: "Software Engineer",
                content: "The AI assistant is a game changer. Whenever I get stuck on a coding concept, it explains it perfectly within seconds.",
                avatar: "https://i.pravatar.cc/100?img=11"
              },
              {
                name: "Sarah Chen",
                role: "UI/UX Designer",
                content: "The platform's design is so clean and motivating. It's the first LMS I've used that actually makes me want to log in every day.",
                avatar: "https://i.pravatar.cc/100?img=12"
              },
              {
                name: "Marcus Miller",
                role: "Product Manager",
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
                className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20"
              >
                <div className="flex text-amber-400 mb-6">
                  {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="text-slate-600 mb-8 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <h5 className="font-bold text-slate-900">{testimonial.name}</h5>
                    <p className="text-xs text-slate-400 font-bold uppercase">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-[48px] bg-slate-900 text-white p-12 lg:p-24 text-center">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
          
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-6xl font-display font-bold mb-8 leading-tight">Ready to unlock your <br />full potential?</h2>
            <p className="text-xl text-blue-100/70 mb-12 max-w-2xl mx-auto">Join the future of learning today. Get started for free and master any skill with the help of AI.</p>
            <Button 
              onClick={handleLogin}
              className="bg-white text-slate-900 hover:bg-blue-50 rounded-2xl h-16 px-12 text-lg font-bold shadow-2xl transition-all hover:-translate-y-1 animate-pulse"
            >
              Start Learning Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="mt-8 text-sm font-bold text-slate-500 uppercase tracking-widest">No credit card required • Instant access</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-white border-t border-slate-50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <GraduationCap size={20} />
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-slate-900">Learnovora</span>
            </Link>
            <p className="text-slate-500 leading-relaxed mb-6">The premium AI-powered learning platform designed for modern creators and students.</p>
            <div className="flex gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer">
                  <Globe size={18} />
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h6 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Platform</h6>
            <ul className="space-y-4">
              {["Explore Courses", "AI Assistant", "Creator Tools", "Community"].map(item => (
                <li key={item}><a href="#" className="text-slate-500 hover:text-primary transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h6 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Company</h6>
            <ul className="space-y-4">
              {["About Us", "Careers", "Blog", "Contact"].map(item => (
                <li key={item}><a href="#" className="text-slate-500 hover:text-primary transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h6 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Support</h6>
            <ul className="space-y-4">
              {["Help Center", "Safety Center", "Community Guidelines", "Privacy Policy"].map(item => (
                <li key={item}><a href="#" className="text-slate-500 hover:text-primary transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-400 text-sm font-medium">© 2025 Learnovora Inc. All rights reserved.</p>
          <div className="flex gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-primary">Terms</a>
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}