import { useState } from "react";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";
import MobileNav from "./MobileNav.jsx";
import PageContainer from "./layout/PageContainer.jsx";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="lg:flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

export default Layout;
