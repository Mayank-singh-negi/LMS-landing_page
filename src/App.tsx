import { Switch, Route, useLocation, Redirect } from "wouter";
import { AuthProvider, useAuth } from "./context/auth-context";
import Landing from "./pages/landing";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";
import Dashboard from "./pages/dashboard";
import CourseList from "./pages/course-list";
import CourseDetail from "./pages/course-detail";
import TeacherCourseDetail from "./pages/teacher-course-detail";
import StudentCourseDetail from "./pages/student-course-detail";
import CoursePlayer from "./pages/course-player";
import TeacherDashboard from "./pages/teacher-dashboard";
import StudentDashboard from "./pages/student-dashboard";
import ForgotPassword from "./pages/forgot-password";
import LogoPreview from "./pages/logo-preview";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  // Teacher accessing /dashboard → send to /teacher
  if (user.role === "teacher" && location === "/dashboard") {
    return <Redirect to="/teacher" />;
  }
  // Student accessing /dashboard → send to /student
  if (user.role === "student" && location === "/dashboard") {
    return <Redirect to="/student" />;
  }

  return <Component />;
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user) {
    // Role-based redirect after login
    if (user.role === "teacher") return <Redirect to="/teacher" />;
    if (user.role === "student") return <Redirect to="/student" />;
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Routes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login">
        <AuthRoute component={LoginPage} />
      </Route>
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/signup">
        <AuthRoute component={SignupPage} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/courses" component={CourseList} />
      <Route path="/courses/:id" component={CourseDetail} />
      <Route path="/teacher/courses/:id" component={TeacherCourseDetail} />
      <Route path="/my-learning/:enrollmentId" component={StudentCourseDetail} />
      <Route path="/learn/:enrollmentId">
        <ProtectedRoute component={CoursePlayer} />
      </Route>
      <Route path="/teacher">
        <ProtectedRoute component={TeacherDashboard} />
      </Route>
      <Route path="/student">
        <ProtectedRoute component={StudentDashboard} />
      </Route>
      <Route path="/logo-preview" component={LogoPreview} />
      <Route>
        {/* 404 fallback */}
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="text-center">
            <h1 className="text-6xl font-display font-bold text-teal mb-4">404</h1>
            <p className="text-slate-500 mb-6">Page not found</p>
            <a href="/" className="text-teal font-semibold hover:underline">Go home</a>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
