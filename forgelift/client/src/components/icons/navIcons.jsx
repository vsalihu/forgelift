// ForgeLift's own navigation icons. Drawn on a 24×24 grid with currentColor so they
// take the same props and colours as lucide-react icons and can be swapped in directly.
const createIcon = (displayName, children) => {
  const Icon = ({ size = 24, strokeWidth = 2, className = "", ...props }) => (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
};

const Dot = ({ cx, cy, r = 1.3 }) => <circle cx={cx} cy={cy} fill="currentColor" r={r} stroke="none" />;

// Horizontal dumbbell centred at y, with plates `plate` units tall.
const Dumbbell = ({ y, plate = 8 }) => (
  <>
    <path d={`M2.5 ${y - plate / 4}v${plate / 2}M21.5 ${y - plate / 4}v${plate / 2}M7.5 ${y}h9`} />
    <rect height={plate} rx="1" width="3" x="4.5" y={y - plate / 2} />
    <rect height={plate} rx="1" width="3" x="16.5" y={y - plate / 2} />
  </>
);

const ClipboardFrame = () => (
  <>
    <path d="M8.5 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2.5" />
    <rect height="4" rx="1" width="7" x="8.5" y="2" />
  </>
);

export const DashboardIcon = createIcon("DashboardIcon", (
  <>
    <rect height="7.5" rx="1.5" width="7.5" x="3" y="3" />
    <rect height="7.5" rx="1.5" width="7.5" x="13.5" y="3" />
    <rect height="7.5" rx="1.5" width="7.5" x="3" y="13.5" />
    <rect height="7.5" rx="1.5" width="7.5" x="13.5" y="13.5" />
  </>
));

export const GymModeIcon = createIcon("GymModeIcon", (
  <>
    <Dumbbell plate={8} y={7.5} />
    <path d="M10.5 14.5 16 18l-5.5 3.5z" fill="currentColor" />
  </>
));

export const LogWorkoutIcon = createIcon("LogWorkoutIcon", (
  <>
    <ClipboardFrame />
    <path d="M12 10v8M8 14h8" />
  </>
));

export const CompeteIcon = createIcon("CompeteIcon", (
  <>
    <path d="M6 3h12v5.5a6 6 0 0 1-12 0z" />
    <path d="M6 4.5H3.5V6a4.5 4.5 0 0 0 3.1 4.3M18 4.5h2.5V6a4.5 4.5 0 0 1-3.1 4.3" />
    <path d="M12 14.5V18M8.5 21h7M9.5 21c0-1.7 1.1-3 2.5-3s2.5 1.3 2.5 3" />
    <path d="M13 5.5 11 8.5h2.2l-2 3" />
  </>
));

export const CalendarIcon = createIcon("CalendarIcon", (
  <>
    <rect height="17" rx="2" width="18" x="3" y="4.5" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    <Dot cx={8} cy={13.5} r={1.1} />
    <Dot cx={12} cy={13.5} r={1.1} />
    <Dot cx={16} cy={13.5} r={1.1} />
    <Dot cx={8} cy={17.5} r={1.1} />
    <Dot cx={12} cy={17.5} r={1.1} />
  </>
));

export const HistoryIcon = createIcon("HistoryIcon", (
  <>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5M12 7v5l3.5 3.5" />
  </>
));

export const DesignWorkoutIcon = createIcon("DesignWorkoutIcon", (
  <>
    <rect height="6.5" rx="2" width="12" x="2" y="3" />
    <rect height="6.5" rx="2" width="8.5" x="2" y="13" />
    <path d="M20.5 9.5 22.5 11.5 15 19l-3 1 1-3z" />
    <path d="M18.6 11.4l2 2" />
  </>
));

export const ExerciseLibraryIcon = createIcon("ExerciseLibraryIcon", (
  <>
    <path d="M12 6.5C10 4.6 6.3 4 2.5 4.5V19c3.8-.5 7.5.1 9.5 2" />
    <path d="M12 6.5c2-1.9 5.7-2.5 9.5-2V19c-3.8-.5-7.5.1-9.5 2" />
    <path d="M12 6.5V21" />
    <path d="M15.25 10.5v5M18.75 10.5v5M15.25 13h3.5" />
  </>
));

export const BaselinesIcon = createIcon("BaselinesIcon", (
  <>
    <Dumbbell plate={9} y={9.5} />
    <path d="M3 20h18" />
  </>
));

export const RecoveryIcon = createIcon("RecoveryIcon", (
  <>
    <path d="M12 21l-7.6-7.4C2.7 12 2 10.6 2 8.6 2 5.5 4.4 3.2 7.3 3.2c1.9 0 3.4.9 4.7 2.5 1.3-1.6 2.8-2.5 4.7-2.5 2.9 0 5.3 2.3 5.3 5.4 0 2-.7 3.4-2.4 5z" />
    <path d="M6 12h3l1.5-3 2.5 6 1.5-3h3.5" />
  </>
));

export const TrainingLoadIcon = createIcon("TrainingLoadIcon", (
  <>
    <ellipse cx="12" cy="5.5" rx="8" ry="3" />
    <path d="M10.5 5.5h3" />
    <path d="M4 5.5V9c0 1.66 3.58 3 8 3s8-1.34 8-3V5.5" />
    <path d="M4 10.2c-1.3.6-2 1.4-2 2.3v4c0 1.9 4.5 3.5 10 3.5s10-1.6 10-3.5v-4c0-.9-.7-1.7-2-2.3" />
    <path d="M2 12.5c0 1.9 4.5 3.5 10 3.5s10-1.6 10-3.5" />
  </>
));

export const OverloadIcon = createIcon("OverloadIcon", (
  <>
    <Dumbbell plate={8} y={16} />
    <path d="M12 10.5V3M8.5 6.5 12 3l3.5 3.5" />
  </>
));

export const DeloadIcon = createIcon("DeloadIcon", (
  <>
    <Dumbbell plate={8} y={16} />
    <path d="M12 3v7.5M8.5 7 12 10.5 15.5 7" />
  </>
));

export const WeakPointsIcon = createIcon("WeakPointsIcon", (
  <>
    <path d="M12 2a10 10 0 1 0 10 10" />
    <path d="M15.4 2.6a10 10 0 0 1 6 6" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </>
));

export const BalanceIcon = createIcon("BalanceIcon", (
  <>
    <path d="M12 2.5v18M7.5 20.5h9M5 6.5h14" />
    <path d="M5 6.5 2.3 13M5 6.5 7.7 13M2 13h6a3 3 0 0 1-6 0z" />
    <path d="M19 6.5 16.3 13M19 6.5 21.7 13M16 13h6a3 3 0 0 1-6 0z" />
  </>
));

export const FriendsIcon = createIcon("FriendsIcon", (
  <>
    <circle cx="9" cy="7" r="3.5" />
    <path d="M2.5 20v-1.5a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5V20z" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M17 14.5h1a4 4 0 0 1 4 4V20h-3.5" />
  </>
));

export const ChatIcon = createIcon("ChatIcon", (
  <>
    <path d="M7 3h10a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5h-6.5L6 21v-4.2A5 5 0 0 1 2 12V8a5 5 0 0 1 5-5z" />
    <Dot cx={8} cy={10} />
    <Dot cx={12} cy={10} />
    <Dot cx={16} cy={10} />
  </>
));

export const RanksIcon = createIcon("RanksIcon", (
  <>
    <path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" />
    <path d="M8 14l4-4 4 4" />
  </>
));

export const MissionsIcon = createIcon("MissionsIcon", (
  <>
    <path d="M5 22V3" />
    <path d="M5 3.5h15l-3 4.75 3 4.75H5" />
    <path d="M8.5 8.3l2 2 3.5-3.5" />
  </>
));

export const ProgressIcon = createIcon("ProgressIcon", (
  <>
    <rect height="4" rx="0.5" width="4" x="2.5" y="17" />
    <rect height="7.5" rx="0.5" width="4" x="10" y="13.5" />
    <rect height="11" rx="0.5" width="4" x="17.5" y="10" />
    <path d="M3 13 20.5 3.5M16 3.5h4.5V8" />
  </>
));

export const PrTimelineIcon = createIcon("PrTimelineIcon", (
  <>
    <circle cx="3.5" cy="16" r="2" />
    <circle cx="12" cy="16" r="2" />
    <circle cx="20.5" cy="16" r="2" />
    <path d="M5.5 16H10M14 16h4.5" />
    <path
      d="M12 3 13.06 5.74 15.99 5.9 13.71 7.76 14.47 10.6 12 9 9.53 10.6 10.29 7.76 8.01 5.9 10.94 5.74z"
      fill="currentColor"
      strokeWidth="1"
    />
  </>
));

export const AnalyticsIcon = createIcon("AnalyticsIcon", (
  <>
    <rect height="4" rx="0.5" width="4" x="2.5" y="17" />
    <rect height="7" rx="0.5" width="4" x="10" y="14" />
    <rect height="11.5" rx="0.5" width="4" x="17.5" y="9.5" />
    <path d="M3 12 8.5 7.5l3.5 2.5L21 3" />
  </>
));

export const ReportsIcon = createIcon("ReportsIcon", (
  <>
    <path d="M10.5 21.5H6a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2h8l5 5v3.5" />
    <path d="M14 2.5v5h5" />
    <path d="M8 9h3M8 12.5h5M8 16h2" />
    <rect height="7.5" rx="1.5" width="9" x="13" y="14.5" />
    <path d="M13 17.5h9M15.5 13v2.5M19.5 13v2.5" />
  </>
));

export const AssessmentIcon = createIcon("AssessmentIcon", (
  <>
    <ClipboardFrame />
    <path d="M7.5 10.3l1 1 2-2M7.5 14.3l1 1 2-2M7.5 18.3l1 1 2-2" />
    <path d="M13.5 10.3h3M13.5 14.3h3M13.5 18.3h3" />
  </>
));

export const ProfileIcon = createIcon("ProfileIcon", (
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="9.5" r="3.5" />
    <path d="M6.2 19.2a6.5 6.5 0 0 1 11.6 0" />
  </>
));

export const DataIcon = createIcon("DataIcon", (
  <>
    <ellipse cx="10" cy="5" rx="7" ry="3" />
    <path d="M3 5v14c0 1.66 3.13 3 7 3 .7 0 1.4-.04 2-.13M17 5v6" />
    <path d="M3 12c0 1.66 3.13 3 7 3 .7 0 1.4-.04 2-.13" />
    <circle cx="18" cy="17.5" r="2.6" />
    <path d="M21.6 17.5h1.3M20.55 20.05l.9.9M18 21.1v1.3M15.45 20.05l-.9.9M14.4 17.5h-1.3M15.45 14.95l-.9-.9M18 13.9v-1.3M20.55 14.95l.9-.9" />
  </>
));

export const MoreIcon = createIcon("MoreIcon", (
  <>
    <Dot cx={5} cy={12} r={2} />
    <Dot cx={12} cy={12} r={2} />
    <Dot cx={19} cy={12} r={2} />
  </>
));

export const LogoutIcon = createIcon("LogoutIcon", (
  <>
    <path d="M14 8V3.5H5v17h9V16" />
    <path d="M10 12h11M17.5 8.5 21 12l-3.5 3.5" />
  </>
));
