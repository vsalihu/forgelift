import { useState } from "react";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";
import MobileNav from "./MobileNav.jsx";
import PageContainer from "./layout/PageContainer.jsx";
import { useUnreadMessages } from "../hooks/useUnreadMessages.js";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const unreadMessages = useUnreadMessages();

  return (
    <div className="min-h-screen">
      <Navbar unreadMessages={unreadMessages} onMenuClick={() => setSidebarOpen(true)} />
      <div className="lg:flex">
        <Sidebar open={sidebarOpen} unreadMessages={unreadMessages} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
      <MobileNav unreadMessages={unreadMessages} />
    </div>
  );
};

export default Layout;
