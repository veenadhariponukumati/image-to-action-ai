import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSearch } from "wouter";

export default function ResetPassword() {
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">This reset link is missing its token.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-foreground">Your password has been reset.</p>
        <Button asChild size="lg">
          <a href="/">Sign in</a>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setDone(true);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm w-full">
        <div className="flex flex-col items-center gap-4 text-center mb-2">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
            <Zap size={18} className="text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Set a new password</h1>
        </div>

        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : "Reset password"}
        </Button>
      </form>
    </div>
  );
}
