import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Sprout,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Bot,
  Sparkles,
  UserCheck,
  UserPlus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector, ThemeToggle } from "@/components/krishi/app-shell";
import { useApp, t } from "@/context/app-context";
import { loginUser } from "@/services/auth-service";
import { toast } from "sonner";

export function LoginPage() {
  const { login, language } = useApp();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      const msg = "Please enter a valid 10-digit registered mobile number.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (!password.trim()) {
      const msg = "Please enter your password.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      // Validate credentials against the database
      const result = await loginUser(cleanPhone, password);

      if (!result.success) {
        setLoading(false);
        setErrorMessage(result.message);
        toast.error(result.message);
        return;
      }

      // Valid: log the user in and redirect to home page
      await login(cleanPhone, result.user?.name);
      setLoading(false);
      toast.success(result.message || "Logged in successfully!");
      void navigate({ to: "/dashboard" });
    } catch (err) {
      setLoading(false);
      const msg = "An error occurred during sign in. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="flex items-center justify-between border-b px-6 py-4 bg-card/60 backdrop-blur-md">
        <Link to="/login" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Sprout className="size-6" />
          </span>
          <span>
            <b className="block font-display text-[18px] leading-tight">{t(language, "brand_title")}</b>
            <small className="text-[10px] font-semibold uppercase text-muted-foreground">
              {t(language, "brand_subtitle")}
            </small>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero & Highlights (Hidden on small screens) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 pr-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-xs font-bold text-primary w-fit">
              <Sparkles className="size-4" />
              AI-Powered Government Schemes
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
              Access farmer benefits & subsidies with confidence.
            </h1>

            <p className="text-muted-foreground text-base leading-relaxed">
              Scheme Connect simplifies finding, checking eligibility, and applying for central and state agricultural schemes across India.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Personalized Scheme Recommendations</h2>
                  <p className="text-xs text-muted-foreground">Matched specifically to your crop, land size, and district.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                  <Bot className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">AI Scheme Assistant</h2>
                  <p className="text-xs text-muted-foreground">Ask queries in regional languages with instant guidance.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">100% Browser Safe & Offline Ready</h2>
                  <p className="text-xs text-muted-foreground">Your farmer data stays securely in your browser.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Farmer Portal Sign In
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your registered mobile number and password to access your dashboard.
                </p>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{errorMessage}</p>
                    {errorMessage.includes("register") && (
                      <Link to="/register" className="underline font-bold block mt-1 hover:text-destructive/80">
                        Click here to create your farmer account →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile & Password Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ""));
                        setErrorMessage("");
                      }}
                      placeholder="9876543210"
                      className="h-11 w-full rounded-lg border bg-background pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 tracking-wider"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage("");
                      }}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-lg border bg-background pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-11 font-bold gap-2">
                  {loading ? (
                    "Validating Credentials..."
                  ) : (
                    <>
                      Sign In <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Create Account Link */}
              <div className="mt-6 pt-5 border-t text-center space-y-3">
                <p className="text-xs text-muted-foreground">Don't have an account yet?</p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full h-11 font-bold border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Link to="/register">
                    <UserPlus className="size-4 mr-1.5" />
                    Create New Farmer Account
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t text-center text-xs text-muted-foreground bg-card/40">
        Scheme Connect · AI-Powered Farmer Scheme Assistant Demonstration · Secure Database Authentication
      </footer>
    </div>
  );
}
