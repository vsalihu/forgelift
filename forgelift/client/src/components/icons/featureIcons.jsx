// ForgeLift's own feature, status and action icons.
import { Dot, createIcon } from "./createIcon.jsx";

const CalendarFrame = () => (
  <>
    <rect height="17" rx="2" width="18" x="3" y="4.5" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
  </>
);

const Person = () => (
  <>
    <circle cx="9.5" cy="7" r="3.75" />
    <path d="M2.5 21v-1a5.5 5.5 0 0 1 5.5-5.5h3a5.5 5.5 0 0 1 5.5 5.5v1z" />
  </>
);

const CircleFrame = () => <circle cx="12" cy="12" r="10" />;

// Calendar

export const RestDayIcon = createIcon("RestDayIcon", (
  <path d="M9.5 3A9 9 0 1 0 21 14.5 9.5 9.5 0 0 1 9.5 3z" />
));

export const PhysioIcon = createIcon("PhysioIcon", (
  <>
    <path d="M9 2.5h6V9h6.5v6H15v6.5H9V15H2.5V9H9z" />
    <path d="M12 6.5v11M12 9.6l1.5 2-1.5 2-1.5-2z" strokeWidth="1.5" />
  </>
));

export const DeloadWeekIcon = createIcon("DeloadWeekIcon", (
  <>
    <CalendarFrame />
    <path d="M12 12v6.5M9 15.5l3 3 3-3" />
  </>
));

export const ClearCalendarIcon = createIcon("ClearCalendarIcon", (
  <>
    <CalendarFrame />
    <path d="M9.5 13l5 5M14.5 13l-5 5" />
  </>
));

// Achievements

export const FirstPlaceIcon = createIcon("FirstPlaceIcon", (
  <>
    <path d="M2.5 7 7.5 11 12 3.5 16.5 11 21.5 7 19 20H5z" />
    <path d="M10.8 13.3 12.4 12v6M10.8 18h3.2" strokeWidth="1.75" />
  </>
));

export const MedalIcon = createIcon("MedalIcon", (
  <>
    <circle cx="12" cy="8.5" r="6.5" />
    <circle cx="12" cy="8.5" r="3.25" />
    <path d="M8.3 13.8 5.5 20.5l2.9-.6 1.6 2.6 2-5.5M15.7 13.8l2.8 6.7-2.9-.6-1.6 2.6-2-5.5" />
  </>
));

export const AwardIcon = createIcon("AwardIcon", (
  <>
    <path d="M12 2.3 13.58 3.61 15.6 3.26 16.31 5.19 18.24 5.9 17.89 7.92 19.2 9.5 17.89 11.08 18.24 13.1 16.31 13.81 15.6 15.74 13.58 15.39 12 16.7 10.42 15.39 8.4 15.74 7.69 13.81 5.76 13.1 6.11 11.08 4.8 9.5 6.11 7.92 5.76 5.9 7.69 5.19 8.4 3.26 10.42 3.61z" />
    <path d="M12 6.6 12.79 8.61 14.95 8.74 13.28 10.12 13.82 12.21 12 11.05 10.18 12.21 10.72 10.12 9.05 8.74 11.21 8.61z" strokeWidth="1.5" />
    <path d="M8.2 15.5 6 21l2.7-.7 1.5 2.2 1-4.5M15.8 15.5 18 21l-2.7-.7-1.5 2.2-1-4.5" />
  </>
));

export const GoalIcon = createIcon("GoalIcon", (
  <>
    <path d="M18.8 8.5A9 9 0 1 1 15.5 5.2" />
    <path d="M15.5 10.9A5 5 0 1 1 13.1 8.5" />
    <Dot cx={11} cy={13} r={1.6} />
    <path d="M11 13 17 7" />
    <path d="M17 7V4l2.5-2.5v3h3L20 7z" />
  </>
));

export const FlameIcon = createIcon("FlameIcon", (
  <>
    <path d="M12 2c1 3.5 6.5 6.5 6.5 12.5a6.5 6.5 0 0 1-13 0c0-3 1.5-5 3-6.5.3 2 1.2 3 2.3 3.5C10.5 8 10.8 5 12 2z" />
    <path d="M12 21c-1.7 0-3-1.3-3-3 0-1.8 1.4-3 2.2-4.5.3 1 .9 1.6 1.6 1.8.3-.9.4-1.6.3-2.6 1.3 1.1 1.9 2.4 1.9 4.3 0 1.7-1.3 3-3 3z" />
  </>
));

// Competition

export const CityIcon = createIcon("CityIcon", (
  <>
    <path d="M12 22 6.7 14.8A7.5 7.5 0 1 1 17.3 14.8z" />
    <path d="M9.5 13V6.5H13V13M13 9h2.5v4M8.5 13h8" strokeWidth="1.5" />
  </>
));

export const WorldIcon = createIcon("WorldIcon", (
  <>
    <CircleFrame />
    <ellipse cx="12" cy="12" rx="5" ry="10" />
    <path d="M12 2v20M2 12h20M3.8 7h16.4M3.8 17h16.4" />
  </>
));

export const ChallengeIcon = createIcon("ChallengeIcon", (
  <>
    <path d="M3.5 3.5H7l10 10M3.5 3.5V7l10 10M12 19l7-7M16 16l4 4M19 21.5l2.5-2.5" />
    <path d="M20.5 3.5H17L7 13.5M20.5 3.5V7l-10 10M12 19l-7-7M8 16l-4 4M5 21.5 2.5 19" />
  </>
));

export const PinnedIcon = createIcon("PinnedIcon", (
  <>
    <path d="M9.5 7.5H4.5a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1V8.5a1 1 0 0 0-1-1h-3.5" />
    <g transform="rotate(25 13 8)">
      <path d="M10.5 2h5M11.5 2v3l-2 2h7l-2-2V2M13 7v5" />
    </g>
  </>
));

// Stats

export const WeightPlateIcon = createIcon("WeightPlateIcon", (
  <>
    <CircleFrame />
    <path d="M9.8 5.9A6.5 6.5 0 0 0 9.8 18.1M14.2 5.9a6.5 6.5 0 0 1 0 12.2" />
    <circle cx="12" cy="12" r="2.5" />
  </>
));

export const TrendingUpIcon = createIcon("TrendingUpIcon", (
  <path d="M2.5 18 9 11.5l4 4L21.5 7M15.5 7h6v6" />
));

export const TrendingDownIcon = createIcon("TrendingDownIcon", (
  <path d="M2.5 6 9 12.5l4-4L21.5 17M15.5 17h6v-6" />
));

export const DetrainingIcon = createIcon("DetrainingIcon", (
  <path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M12 5.5 9.88 3.38M12 5.5l2.12-2.12M17.63 8.75l.78-2.9M17.63 8.75l2.9.78M17.63 15.25l2.9-.78M17.63 15.25l.78 2.9M12 18.5l2.12 2.12M12 18.5l-2.12 2.12M6.37 15.25l-.78 2.9M6.37 15.25l-2.9-.78M6.37 8.75l-2.9.78M6.37 8.75l-.78-2.9" />
));

export const ActivityIcon = createIcon("ActivityIcon", (
  <path d="M2 12h3.5l2 3L10 3l3.5 18 2.5-8.5H22" />
));

export const LineChartIcon = createIcon("LineChartIcon", (
  <>
    <path d="M3 3v18h18" />
    <path d="M7 16.5 11 11l3 1.5 5-6" />
    <Dot cx={7} cy={16.5} r={1.6} />
    <Dot cx={11} cy={11} r={1.6} />
    <Dot cx={14} cy={12.5} r={1.6} />
    <Dot cx={19} cy={6.5} r={1.6} />
  </>
));

export const BarChartIcon = createIcon("BarChartIcon", (
  <>
    <path d="M3 3v18h18" />
    <rect height="5" rx="0.5" width="3" x="6.5" y="13" />
    <rect height="9" rx="0.5" width="3" x="11.5" y="9" />
    <rect height="13" rx="0.5" width="3" x="16.5" y="5" />
  </>
));

// Social and safety

export const PrivateIcon = createIcon("PrivateIcon", (
  <>
    <path d="M7 10.5V7a5 5 0 0 1 10 0v3.5" />
    <rect height="11" rx="2" width="17" x="3.5" y="10.5" />
    <Dot cx={12} cy={15} r={1.5} />
    <path d="M12 15.5V18" />
  </>
));

export const BlockIcon = createIcon("BlockIcon", (
  <>
    <CircleFrame />
    <path d="M4.9 19.1 19.1 4.9" />
  </>
));

export const ReportIcon = createIcon("ReportIcon", (
  <>
    <path d="M5 22V3" />
    <path d="M5 3.5c3-1.5 5.5-1 7.5 0s4.5 1.5 7.5 0v10c-3 1.5-5.5 1-7.5 0s-4.5-1.5-7.5 0" />
  </>
));

export const AddFriendIcon = createIcon("AddFriendIcon", (
  <>
    <Person />
    <path d="M19 8v6M16 11h6" />
  </>
));

export const RemoveFriendIcon = createIcon("RemoveFriendIcon", (
  <>
    <Person />
    <path d="M16 11h6" />
  </>
));

export const FriendAddedIcon = createIcon("FriendAddedIcon", (
  <>
    <Person />
    <path d="m16 11 2 2 4-4" />
  </>
));

// Messages

export const SuccessIcon = createIcon("SuccessIcon", (
  <>
    <CircleFrame />
    <path d="m7.5 12.5 3 3 6-6.5" />
  </>
));

export const ErrorIcon = createIcon("ErrorIcon", (
  <>
    <CircleFrame />
    <path d="m9 9 6 6M15 9l-6 6" />
  </>
));

export const InfoIcon = createIcon("InfoIcon", (
  <>
    <CircleFrame />
    <Dot cx={12} cy={7.5} r={1.3} />
    <path d="M11 11h1v5.5c0 .6.4 1 1 1" />
  </>
));

export const HelpIcon = createIcon("HelpIcon", (
  <>
    <CircleFrame />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-2.9 2.4-2.9 4.5" />
    <Dot cx={12} cy={17.5} r={1.3} />
  </>
));

// Actions and timer

export const ViewIcon = createIcon("ViewIcon", (
  <>
    <path d="M1.5 12C4 7.5 7.7 5 12 5s8 2.5 10.5 7c-2.5 4.5-6.2 7-10.5 7S4 16.5 1.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </>
));

export const RepeatIcon = createIcon("RepeatIcon", (
  <>
    <path d="M4.9 8.2A8 8 0 0 1 19.7 9.9M20.5 5.5V10H16" />
    <path d="M19.1 15.8A8 8 0 0 1 4.3 14.1M3.5 18.5V14H8" />
  </>
));

export const PlayIcon = createIcon("PlayIcon", (
  <>
    <CircleFrame />
    <path d="M10 8l6 4-6 4z" />
  </>
));

export const PauseIcon = createIcon("PauseIcon", (
  <>
    <CircleFrame />
    <path d="M10 8.5v7M14 8.5v7" />
  </>
));

export const ResetIcon = createIcon("ResetIcon", (
  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5" />
));
