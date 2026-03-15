import { Switch, Route, useLocation } from "wouter";
import { AuthProvider, useAuth } from "./context/auth-context";
import Landing from "./pages/landing";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";
import Dashboard from "./pages/dashboard";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return <Component />;
}

function AuthRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) return null;

  if (user) {
    navigate("/dashboard");
    return null;
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
      <Route path="/signup">
        <AuthRoute component={SignupPage} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
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
