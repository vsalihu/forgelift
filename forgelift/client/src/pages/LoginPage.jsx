import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import Footer from "../components/layout/Footer.jsx";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../hooks/useAuth.js";

const LoginPage = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={user.onboardingCompleted ? "/dashboard" : "/onboarding"} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const loggedInUser = await login(form);
      const fallback = loggedInUser.onboardingCompleted ? "/dashboard" : "/onboarding";
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto flex max-w-md flex-col justify-center px-4 py-12">
        <div className="metal-panel rounded-lg p-6 shadow-metal">
          <h1 className="text-3xl font-black text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">Login to continue your progression setup.</p>
          {error ? <div className="mt-5 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <FormInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
            <FormInput
              label="Password"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
            <Button className="w-full" loading={submitting} type="submit">
              Login
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-400">
            Need an account?{" "}
            <Link className="font-semibold text-forge-ember hover:text-orange-300" to="/register">
              Register
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;
