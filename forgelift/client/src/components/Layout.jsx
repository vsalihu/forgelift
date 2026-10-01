import { useState } from "react";
import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";
import MobileNav from "./MobileNav.jsx";
import PageContainer from "./layout/PageContainer.jsx";
import { useUnreadMessages } from "../hooks/useUnreadMessages.js";
import { useCompetitionStanding } from "../hooks/useCompetitionStanding.js";
import StandingChangeModal from "./compete/StandingChangeModal.jsx";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const unreadMessages = useUnreadMessages();
  const standing = useCompetitionStanding();
  const competePlace = standing?.enabled ? standing.place : null;

  return (
    <div className="min-h-screen">
      <Navbar competePlace={competePlace} unreadMessages={unreadMessages} onMenuClick={() => setSidebarOpen(true)} />
      <div className="lg:flex">
        <Sidebar competePlace={competePlace} open={sidebarOpen} unreadMessages={unreadMessages} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
      <MobileNav competePlace={competePlace} unreadMessages={unreadMessages} />
      <StandingChangeModal />
    </div>
  );
};

export default Layout;
