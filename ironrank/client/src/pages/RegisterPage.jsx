import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import FormInput from "../components/FormInput.jsx";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../hooks/useAuth.js";

const RegisterPage = () => {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      await register(form);
      navigate("/onboarding");
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
          <h1 className="text-3xl font-black text-white">Create your account</h1>
          <p className="mt-2 text-sm text-slate-400">Set up your IronRank profile foundation.</p>
          {error ? <div className="mt-5 rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <FormInput
              label="Name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
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
              minLength={6}
              required
            />
            <Button className="w-full" loading={submitting} type="submit">
              Register
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link className="font-semibold text-iron-ember hover:text-orange-300" to="/login">
              Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
