import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, Zap } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

type Mode = "login" | "signup" | "forgot";

export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    const switchMode = (next: Mode) => {
      setMode(next);
      setError(null);
      setMessage(null);
    };

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);
      setMessage(null);

      try {
        if (mode === "forgot") {
          const response = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = await response.json();
          if (!response.ok) {
            setError(data.error ?? "Something went wrong");
            return;
          }
          setMessage(data.message ?? "If an account exists for that email, a reset link has been sent.");
          return;
        }

        const response = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mode === "login" ? { email, password } : { email, password, name }),
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Something went wrong");
          return;
        }

        await utils.auth.me.invalidate();
      } catch {
        setError("Could not reach the server. Please try again.");
      } finally {
        setSubmitting(false);
      }
    };

    const titles: Record<Mode, string> = {
      login: "Sign in to Image-to-Action",
      signup: "Create your account",
      forgot: "Reset your password",
    };

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm w-full">
          <div className="flex flex-col items-center gap-4 text-center mb-2">
            <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
              <Zap size={18} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{titles[mode]}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "forgot"
                  ? "Enter your email and we'll send you a reset link."
                  : "Your extractions and task history are tied to your account."}
              </p>
            </div>
          </div>

          {mode === "signup" && (
            <Input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          {mode !== "forgot" && (
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "signup" ? 8 : undefined}
              required
            />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-muted-foreground">{message}</p>}

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : mode === "login" ? (
              "Sign in"
            ) : mode === "signup" ? (
              "Create account"
            ) : (
              "Send reset link"
            )}
          </Button>

          {mode === "login" && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="text-xs text-muted-foreground underline underline-offset-2"
              >
                Need an account? Sign up
              </button>
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-xs text-muted-foreground underline underline-offset-2"
              >
                Forgot password?
              </button>
            </div>
          )}
          {mode !== "login" && (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-xs text-muted-foreground underline underline-offset-2 text-center"
            >
              Back to sign in
            </button>
          )}
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
