import Navbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";
import MobileNav from "./MobileNav.jsx";
import PageContainer from "./layout/PageContainer.jsx";
import { useUnreadMessages } from "../hooks/useUnreadMessages.js";
import { useCompetitionStanding } from "../hooks/useCompetitionStanding.js";
import StandingChangeModal from "./compete/StandingChangeModal.jsx";

const Layout = ({ children }) => {
  const unreadMessages = useUnreadMessages();
  const standing = useCompetitionStanding();
  const competePlace = standing?.enabled ? standing.place : null;

  return (
    <div className="min-h-[100dvh]">
      <a
        className="sr-only z-50 rounded-full bg-forge-ember px-4 py-2 font-bold text-[#160a02] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#main-content"
      >
        Skip to content
      </a>
      <Navbar unreadMessages={unreadMessages} />
      <div className="lg:flex">
        <Sidebar competePlace={competePlace} unreadMessages={unreadMessages} />
        <main className="min-w-0 flex-1 overflow-x-clip" id="main-content">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
      <MobileNav competePlace={competePlace} unreadMessages={unreadMessages} />
      <StandingChangeModal />
    </div>
  );
};

export default Layout;
