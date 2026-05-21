import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-forge-copper">404</p>
        <h1 className="mt-3 text-4xl font-black text-white">Page not found</h1>
        <p className="mt-4 text-slate-400">The route you requested does not exist in ForgeLift Stage 1.</p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-forge-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          to="/dashboard"
        >
          Return to dashboard
        </Link>
      </main>
    </div>
  );
};

export default NotFoundPage;
