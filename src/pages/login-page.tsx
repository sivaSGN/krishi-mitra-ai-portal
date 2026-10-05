import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Sprout,
  Smartphone,
  Mail,
  ShieldCheck,
  ArrowRight,
  Bot,
  Sparkles,
  Lock,
  UserCheck,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector, ThemeToggle } from "@/components/krishi/app-shell";
import { useApp, t } from "@/context/app-context";
import { toast } from "sonner";

export function LoginPage() {
  const { login, profile, isAuthenticated, language } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("9876543210");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("ramesh.kumar@example.com");
  const [password, setPassword] = useState("farmer123");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setOtpSent(true);
    setOtp("4829");
    toast.success("Demo OTP sent! Code '4829' auto-filled for quick login.");
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      handleSendOtp();
      return;
    }
    if (!otp) {
      toast.error("Please enter the 4-digit OTP");
      return;
    }
    setLoading(true);
    try {
      await login(phone, profile.name);
      setLoading(false);
      void navigate({ to: "/dashboard" });
    } catch {
      setLoading(false);
      void navigate({ to: "/dashboard" });
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await login(email, profile.name);
      setLoading(false);
      void navigate({ to: "/dashboard" });
    } catch {
      setLoading(false);
      void navigate({ to: "/dashboard" });
    }
  };

  const handleQuickDemoLogin = async (name: string, farmerType: string) => {
    setLoading(true);
    try {
      await login("9876543210", name);
      setLoading(false);
      void navigate({ to: "/dashboard" });
    } catch {
      setLoading(false);
      void navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="flex items-center justify-between border-b px-6 py-4 bg-card/60 backdrop-blur-md">
        <Link to="/dashboard" className="flex items-center gap-3">
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
                  Farmer Portal Login
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in with your mobile number or email to view your schemes.
                </p>
              </div>

              {/* Login Method Tabs */}
              <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setTab("phone");
                    setOtpSent(false);
                  }}
                  className={`flex items-center justify-center gap-2 rounded-md py-2 transition-all ${
                    tab === "phone"
                      ? "bg-background text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone className="size-3.5" />
                  Mobile OTP
                </button>
                <button
                  type="button"
                  onClick={() => setTab("email")}
                  className={`flex items-center justify-center gap-2 rounded-md py-2 transition-all ${
                    tab === "email"
                      ? "bg-background text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="size-3.5" />
                  Email / Password
                </button>
              </div>

              {/* Phone OTP Login Form */}
              {tab === "phone" && (
                <form onSubmit={handlePhoneLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Farmer Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="9876543210"
                        className="h-11 w-full rounded-lg border bg-background pl-12 pr-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  {otpSent && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Enter 4-Digit OTP
                        </label>
                        <span className="text-[11px] text-success font-semibold">Demo code: 4829</span>
                      </div>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                          type="text"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="4829"
                          className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm font-bold tracking-widest outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full h-11 font-bold">
                    {loading ? (
                      "Signing in..."
                    ) : otpSent ? (
                      <>
                        Verify OTP & Login <ArrowRight className="size-4" />
                      </>
                    ) : (
                      <>
                        Send Verification OTP <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Email / Password Login Form */}
              {tab === "email" && (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Email or Aadhaar ID
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="farmer@example.com"
                        className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full h-11 font-bold">
                    {loading ? "Signing in..." : "Sign In with Password"}
                  </Button>
                </form>
              )}

              {/* Quick Demo Logins */}
              <div className="mt-6 pt-5 border-t">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 text-center">
                  Quick Demo 1-Click Access
                </p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin("Ramesh Kumar", "Small Farmer")}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border bg-secondary/50 hover:bg-secondary transition text-left text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        RK
                      </span>
                      <div>
                        <b className="block text-foreground">Ramesh Kumar</b>
                        <span className="text-muted-foreground text-[10px]">Small Farmer · Telangana</span>
                      </div>
                    </div>
                    <UserCheck className="size-4 text-primary" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin("Sunita Patel", "Organic Farmer")}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border bg-secondary/50 hover:bg-secondary transition text-left text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        SP
                      </span>
                      <div>
                        <b className="block text-foreground">Sunita Patel</b>
                        <span className="text-muted-foreground text-[10px]">Organic Farming · Gujarat</span>
                      </div>
                    </div>
                    <UserCheck className="size-4 text-primary" />
                  </button>
                </div>
              </div>

              {/* Create Account Link */}
              <div className="mt-5 pt-4 border-t text-center space-y-2">
                <p className="text-xs text-muted-foreground">Don't have an account yet?</p>
                <Button asChild variant="outline" className="w-full h-11 font-bold border-primary/30 text-primary hover:bg-primary/10">
                  <Link to="/register">
                    <UserCheck className="size-4 mr-1.5" />
                    Create New Farmer Account
                  </Link>
                </Button>
                <div className="pt-2">
                  <Link
                    to="/dashboard"
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Continue as Guest to Schemes Dashboard →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t text-center text-xs text-muted-foreground">
        Scheme Connect · AI-Powered Farmer Scheme Assistant Demonstration · Offline Frontend
      </footer>
    </div>
  );
}
