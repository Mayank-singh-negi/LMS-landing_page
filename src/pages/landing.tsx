import { useState } from "react";
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
import onlineLearningAnimation from "../../Online Learning.json";

const NAV_LINKS = [
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
            <img src="/logo.png" alt="Learnovora Logo" className="w-20 h-20" />
            <span className="font-display font-extrabold text-2xl tracking-tight text-teal">Learnovora</span>
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
                  <Button onClick={handleSignup} className="w-full h-12 rounded-xl bg-teal hover:bg-teal-dark text-white">Get Started</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden min-h-[600px]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-teal/5 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto px-8 lg:px-16 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10"
            >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal/10 border border-teal/20 text-teal mb-8">
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">AI-Powered EdTech Platform</span>
            </div>
            <h1 className="text-6xl lg:text-7xl xl:text-8xl font-display font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Learn Smarter, Not <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal to-teal-light">Faster with AI.</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed">
              Learnovora is the premium LMS that combines high-quality courses with an intelligent AI tutor to help you master any subject in record time.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
              <Button 
                onClick={handleSignup}
                className="w-full sm:w-auto bg-teal hover:bg-teal-dark text-white rounded-xl h-14 px-8 text-base font-bold shadow-lg shadow-teal/20 transition-all hover:-translate-y-0.5"
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
      <section className="py-12 border-y border-cream-dark bg-cream-light">
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
                className="group p-8 bg-white rounded-[32px] border border-cream-dark hover:border-teal/20 transition-all duration-300 premium-shadow hover:shadow-2xl hover:shadow-teal/5 hover:-translate-y-2"
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
      <section id="how-it-works" className="py-24 bg-cream-light relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
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
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border border-cream-dark flex items-center justify-center font-bold text-teal shadow-sm">
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
                className="p-8 bg-white rounded-[32px] border border-cream-dark shadow-xl shadow-slate-200/20"
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
        <div className="max-w-5xl mx-auto relative overflow-hidden rounded-[48px] bg-teal text-white p-12 lg:p-24 text-center">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-light/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-dark/10 rounded-full blur-[120px]" />
          
          <div className="relative z-10">
            <h2 className="text-4xl lg:text-6xl font-display font-bold mb-8 leading-tight">Ready to unlock your <br />full potential?</h2>
            <p className="text-xl text-blue-100/70 mb-12 max-w-2xl mx-auto">Join the future of learning today. Get started for free and master any skill with the help of AI.</p>
            <Button 
              onClick={handleSignup}
              className="bg-white text-teal hover:bg-cream rounded-2xl h-16 px-12 text-lg font-bold shadow-2xl transition-all hover:-translate-y-1 animate-pulse"
            >
              Start Learning Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="mt-8 text-sm font-bold text-slate-500 uppercase tracking-widest">No credit card required • Instant access</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-cream text-white overflow-hidden pt-48">
        {/* Animated Wavy Teal Background - Extra tall */}
        <div className="absolute inset-0 z-0">
          {/* Multiple wave layers for depth - much taller */}
          <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150vw] h-[900px] animate-wave" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,450 Q360,350 720,450 T1440,450 L1440,900 L0,900 Z" fill="#004643" opacity="0.9"/>
          </svg>
          <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150vw] h-[900px] animate-wave-slow" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,480 Q360,380 720,480 T1440,480 L1440,900 L0,900 Z" fill="#14b8a6" opacity="0.7"/>
          </svg>
          <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150vw] h-[800px] animate-wave-slower" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,400 Q360,320 720,400 T1440,400 L1440,800 L0,800 Z" fill="#2dd4bf" opacity="0.5"/>
          </svg>
        </div>

        <div className="relative z-20 w-full px-12 py-16">
          {/* Links Section */}
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-8 lg:gap-14 mb-12">
            {/* Logo and Social Icons */}
            <div className="flex flex-col gap-6">
              <Link href="/" className="flex items-center gap-2.5">
                <img src="/logo.png" alt="Learnovora Logo" className="w-16 h-16" />
                <span className="font-display font-extrabold text-2xl tracking-tight text-white drop-shadow-lg">Learnovora</span>
              </Link>
              <p className="text-sm text-white leading-relaxed max-w-xs drop-shadow-md">The premium AI-powered learning platform designed for modern creators and students.</p>
              
              <div className="flex gap-4">
                <a href="mailto:negimayank243@gmail.com" className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white hover:text-white transition-colors backdrop-blur-sm" title="Email Us">
                  <Mail size={18} />
                </a>
                <a href="https://github.com/Mayank-singh-negi" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white hover:text-white transition-colors backdrop-blur-sm" title="GitHub">
                  <Github size={18} />
                </a>
                <a href="https://www.linkedin.com/in/mayank-negi-55712533b/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white hover:text-white transition-colors backdrop-blur-sm" title="LinkedIn">
                  <Linkedin size={18} />
                </a>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-12">
              {/* Platform */}
              <div>
                <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-white drop-shadow-md">Platform</h4>
                <ul className="space-y-3">
                  {["Explore Courses", "AI Assistant", "Creator Tools", "Community"].map(item => (
                    <li key={item}><a href="#" className="text-white/95 hover:text-white transition-colors text-sm drop-shadow-md font-medium">{item}</a></li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-white drop-shadow-md">Company</h4>
                <ul className="space-y-3">
                  {["About Us", "Careers", "Blog", "Contact"].map(item => (
                    <li key={item}><a href="#" className="text-white/95 hover:text-white transition-colors text-sm drop-shadow-md font-medium">{item}</a></li>
                  ))}
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="font-bold mb-4 uppercase text-xs tracking-widest text-white drop-shadow-md">Support</h4>
                <ul className="space-y-3">
                  {["Help Center", "Safety Center", "Community Guidelines", "Privacy Policy"].map(item => (
                    <li key={item}><a href="#" className="text-white/95 hover:text-white transition-colors text-sm drop-shadow-md font-medium">{item}</a></li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          {/* Copyright */}
          <div className="max-w-7xl mx-auto pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-white/90 text-sm font-medium drop-shadow-md">© 2025 Learnovora Inc. All rights reserved.</p>
            <div className="flex gap-8 text-sm font-medium text-white/90">
              <a href="#" className="hover:text-white transition-colors drop-shadow-md">Terms</a>
              <a href="#" className="hover:text-white transition-colors drop-shadow-md">Privacy</a>
              <a href="#" className="hover:text-white transition-colors drop-shadow-md">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}