import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell.jsx";
import { AuthField, AuthSubmit, FormAlert, PasswordField, RememberMe } from "../components/auth/AuthFields.jsx";
import { RANK_ORDER } from "../components/landing/shared.jsx";
import { useAuth } from "../hooks/useAuth.js";

const LoginPage = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", rememberMe: true });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rankIndex, setRankIndex] = useState(5);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => setRankIndex((index) => (index + 1) % RANK_ORDER.length), 2800);
    return () => window.clearInterval(timer);
  }, []);

  if (!loading && user) {
    return <Navigate to={user.onboardingCompleted ? "/dashboard" : "/onboarding"} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError("Enter your email and password.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const loggedInUser = await login(form);
      const fallback = loggedInUser.onboardingCompleted ? "/dashboard" : "/onboarding";
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      caption={{ title: "Right where you left off.", body: "Your ranks, plans and PRs are waiting for you." }}
      footer={
        <>
          New to ForgeLift?{" "}
          <Link className="font-bold text-orange-300 underline-offset-4 hover:text-orange-200 hover:underline" to="/register">
            Create an account
          </Link>
        </>
      }
      rank={RANK_ORDER[rankIndex]}
      subtitle="Log in to pick up where you left off."
      title="Welcome back."
    >
      <FormAlert>{error}</FormAlert>
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <AuthField
          autoComplete="email"
          id="login-email"
          inputMode="email"
          label="Email"
          name="email"
          placeholder="you@example.com"
          required
          spellCheck={false}
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <PasswordField
          autoComplete="current-password"
          id="login-password"
          name="password"
          required
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <RememberMe checked={form.rememberMe} onChange={(rememberMe) => setForm({ ...form, rememberMe })} />
        <AuthSubmit busy={submitting} busyLabel="Logging in…" type="submit">
          Log in
        </AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
