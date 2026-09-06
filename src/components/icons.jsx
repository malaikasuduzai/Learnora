// Small, dependency-free icon set (stroke-based, 20x20 default) so the UI
// doesn't need an extra npm package just for a handful of glyphs.

function Icon({ children, className = "h-5 w-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (props) => (
  <Icon {...props}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
  </Icon>
);

export const UsersIcon = (props) => (
  <Icon {...props}>
    <circle cx="9" cy="8" r="3.25" />
    <path d="M2.75 19.5c.6-3 2.9-5 6.25-5s5.65 2 6.25 5" />
    <path d="M15.5 5.75c1.4.35 2.4 1.6 2.4 3.1s-1 2.75-2.4 3.1" />
    <path d="M17.25 14.75c2.4.4 4.15 1.9 4.6 4.75" />
  </Icon>
);

export const BookOpenIcon = (props) => (
  <Icon {...props}>
    <path d="M12 6.5c-1.6-1.2-3.9-1.75-6.5-1.75-.7 0-1 .3-1 1v11.5c0 .6.35 1 1 1 2.6 0 4.9.55 6.5 1.75" />
    <path d="M12 6.5c1.6-1.2 3.9-1.75 6.5-1.75.7 0 1 .3 1 1v11.5c0 .6-.35 1-1 1-2.6 0-4.9.55-6.5 1.75V6.5Z" />
  </Icon>
);

export const CalendarCheckIcon = (props) => (
  <Icon {...props}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17" />
    <path d="M8 3v3.5M16 3v3.5" />
    <path d="M8.5 14l2 2 4-4" />
  </Icon>
);

export const ClipboardListIcon = (props) => (
  <Icon {...props}>
    <rect x="5.5" y="4.5" width="13" height="16" rx="2" />
    <path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5" />
    <path d="M9 11h6M9 14.5h6M9 18h3.5" />
  </Icon>
);

export const MessageIcon = (props) => (
  <Icon {...props}>
    <path d="M4 5.5h16v11H9.5L5 20.5v-4H4z" />
  </Icon>
);

export const BellIcon = (props) => (
  <Icon {...props}>
    <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13.5 6 9.5Z" />
    <path d="M10 18.5a2 2 0 0 0 4 0" />
  </Icon>
);

export const SearchIcon = (props) => (
  <Icon {...props}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.3-4.3" />
  </Icon>
);

export const ChevronDownIcon = (props) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const LogOutIcon = (props) => (
  <Icon {...props}>
    <path d="M14.5 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6.5a2 2 0 0 0 2-2v-2" />
    <path d="M9 12h11.5M17.5 8.5l3.5 3.5-3.5 3.5" />
  </Icon>
);

export const CheckCircleIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.5 2.3 2.3 4.7-5.1" />
  </Icon>
);

export const CircleDashedIcon = (props) => (
  <Icon {...props}>
    <path d="M12 3.5a8.5 8.5 0 0 1 5.6 2.1" />
    <path d="M20.1 9a8.5 8.5 0 0 1 .4 4.9" />
    <path d="M17.9 18.4a8.5 8.5 0 0 1-4.7 2" />
    <path d="M8.5 20a8.5 8.5 0 0 1-4.4-3.1" />
    <path d="M3.6 12a8.5 8.5 0 0 1 1.8-5.4" />
  </Icon>
);

export const ShieldIcon = (props) => (
  <Icon {...props}>
    <path d="M12 3.5 5 6.25V11c0 4.8 3 8 7 9.5 4-1.5 7-4.7 7-9.5V6.25L12 3.5Z" />
  </Icon>
);

export const ArrowRightIcon = (props) => (
  <Icon {...props}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Icon>
);

export const GraduationCapIcon = (props) => (
  <Icon {...props}>
    <path d="M2.5 9.5 12 5l9.5 4.5-9.5 4.5-9.5-4.5Z" />
    <path d="M6.5 11.5V16c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.5" />
    <path d="M21.5 9.5v5.5" />
  </Icon>
);

export const SettingsIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.15-1.45l2-1.55-2-3.46-2.35.95a7 7 0 0 0-2.5-1.45L13.6 2.5h-3.2l-.4 2.54a7 7 0 0 0-2.5 1.45l-2.35-.95-2 3.46 2 1.55A7 7 0 0 0 5 12c0 .5.05 1 .15 1.45l-2 1.55 2 3.46 2.35-.95c.75.62 1.6 1.1 2.5 1.45l.4 2.54h3.2l.4-2.54a7 7 0 0 0 2.5-1.45l2.35.95 2-3.46-2-1.55c.1-.45.15-.95.15-1.45Z" />
  </Icon>
);

export const PlayCircleIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M10.25 9.25v5.5l4.5-2.75-4.5-2.75Z" />
  </Icon>
);

export const BarChartIcon = (props) => (
  <Icon {...props}>
    <path d="M4.5 20V11M12 20V4M19.5 20v-7.5" />
  </Icon>
);

export const LockIcon = (props) => (
  <Icon {...props}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M7.5 10.5V7.25a4.5 4.5 0 0 1 9 0v3.25" />
  </Icon>
);

export const MailIcon = (props) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5 12 13l8.5-6.5" />
  </Icon>
);

export const PhoneIcon = (props) => (
  <Icon {...props}>
    <path d="M5.5 4h3l1.5 4.5-2 1.5a11 11 0 0 0 6 6l1.5-2 4.5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3.5 6.2 2 2 0 0 1 5.5 4Z" />
  </Icon>
);

export const ArrowLeftIcon = (props) => (
  <Icon {...props}>
    <path d="M20 12H4" />
    <path d="M10 6l-6 6 6 6" />
  </Icon>
);

export const MenuIcon = (props) => (
  <Icon {...props}>
    <path d="M3.5 6.5h17" />
    <path d="M3.5 12h17" />
    <path d="M3.5 17.5h17" />
  </Icon>
);

export const XIcon = (props) => (
  <Icon {...props}>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </Icon>
);

export const PlusIcon = (props) => (
  <Icon {...props}>
    <path d="M12 4.5v15M4.5 12h15" />
  </Icon>
);

export const PencilIcon = (props) => (
  <Icon {...props}>
    <path d="M14.5 4.5 19.5 9.5 8 21H3v-5L14.5 4.5Z" />
    <path d="M12.5 6.5 17.5 11.5" />
  </Icon>
);

export const TrashIcon = (props) => (
  <Icon {...props}>
    <path d="M4.5 7h15" />
    <path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" />
    <path d="M6.5 7 7.3 19.5a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 7" />
    <path d="M10.25 11v6M13.75 11v6" />
  </Icon>
);

export const TagIcon = (props) => (
  <Icon {...props}>
    <path d="M11.5 3.5H5.5A2 2 0 0 0 3.5 5.5v6a2 2 0 0 0 .6 1.4l9 9a2 2 0 0 0 2.8 0l6-6a2 2 0 0 0 0-2.8l-9-9a2 2 0 0 0-1.4-.6Z" />
    <circle cx="8.25" cy="8.25" r="1.4" />
  </Icon>
);

export const XCircleIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m9.5 9.5 5 5M14.5 9.5l-5 5" />
  </Icon>
);

export const UserIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="8.25" r="3.75" />
    <path d="M4.5 20c.85-3.75 3.7-6 7.5-6s6.65 2.25 7.5 6" />
  </Icon>
);

export const VideoIcon = (props) => (
  <Icon {...props}>
    <rect x="2.5" y="6" width="13" height="12" rx="2" />
    <path d="m15.5 10.5 6-3.5v10l-6-3.5" />
  </Icon>
);

export const FileIcon = (props) => (
  <Icon {...props}>
    <path d="M6.5 3h7l4 4v13a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M13.5 3v4h4" />
  </Icon>
);

export const LinkIcon = (props) => (
  <Icon {...props}>
    <path d="M9.5 14.5 14.5 9.5" />
    <path d="M11 6.5 13.5 4a3.5 3.5 0 0 1 5 5L16 11.5" />
    <path d="M13 17.5 10.5 20a3.5 3.5 0 0 1-5-5L8 12.5" />
  </Icon>
);

export const ChevronUpIcon = (props) => (
  <Icon {...props}>
    <path d="m6 15 6-6 6 6" />
  </Icon>
);

export const ChevronRightIcon = (props) => (
  <Icon {...props}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);

export const ClockIcon = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Icon>
);

// --- Course-topic icons (used for featured-course cover tiles) ---

export const CodeIcon = (props) => (
  <Icon {...props}>
    <path d="m9 8-4 4 4 4" />
    <path d="m15 8 4 4-4 4" />
  </Icon>
);

export const TerminalIcon = (props) => (
  <Icon {...props}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="m7 9 3 3-3 3" />
    <path d="M12.5 15h4.5" />
  </Icon>
);

export const PaletteIcon = (props) => (
  <Icon {...props}>
    <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.1 0 1.8-.9 1.8-1.85 0-.47-.19-.9-.5-1.22-.31-.32-.5-.75-.5-1.22 0-.95.8-1.71 1.8-1.71H16A4.5 4.5 0 0 0 20.5 10c0-3.59-3.8-6.5-8.5-6.5Z" />
    <circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="9.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="7" r="1" fill="currentColor" stroke="none" />
    <circle cx="17" cy="10.5" r="1" fill="currentColor" stroke="none" />
  </Icon>
);

export const DatabaseIcon = (props) => (
  <Icon {...props}>
    <ellipse cx="12" cy="6" rx="7" ry="2.5" />
    <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
    <path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
  </Icon>
);

export const LayersIcon = (props) => (
  <Icon {...props}>
    <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8Z" />
    <path d="m3.5 12.5 8.5 4.5 8.5-4.5" />
    <path d="m3.5 16.5 8.5 4.5 8.5-4.5" />
  </Icon>
);

export const SmartphoneIcon = (props) => (
  <Icon {...props}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2" />
    <path d="M10.5 18.5h3" />
  </Icon>
);

export const MapPinIcon = (props) => (
  <Icon {...props}>
    <path d="M12 21.5s7-6.2 7-11.6a7 7 0 1 0-14 0c0 5.4 7 11.6 7 11.6Z" />
    <circle cx="12" cy="9.9" r="2.4" />
  </Icon>
);

export const StarIcon = (props) => (
  <Icon {...props}>
    <path d="M12 3.5 14.6 9l6 .8-4.4 4.1 1.1 6-5.3-2.9-5.3 2.9 1.1-6-4.4-4.1 6-.8Z" />
  </Icon>
);

export const EyeIcon = (props) => (
  <Icon {...props}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

export const EyeOffIcon = (props) => (
  <Icon {...props}>
    <path d="M3.5 3.5l17 17" />
    <path d="M10.6 5.63A10.7 10.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a13.4 13.4 0 0 1-3.14 3.9M6.6 6.6C3.9 8.3 2.5 12 2.5 12s3.5 6.5 9.5 6.5a10 10 0 0 0 4.4-.98" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Icon>
);

export const QuoteIcon = (props) => (
  <Icon {...props}>
    <path d="M8.5 7.5c-2.5 1-4 3.2-4 6.2 0 2 1.1 3.3 2.8 3.3 1.5 0 2.7-1.2 2.7-2.7 0-1.4-1-2.5-2.3-2.6.2-1.6 1.3-2.9 2.8-3.5l-2-.7Z" />
    <path d="M17 7.5c-2.5 1-4 3.2-4 6.2 0 2 1.1 3.3 2.8 3.3 1.5 0 2.7-1.2 2.7-2.7 0-1.4-1-2.5-2.3-2.6.2-1.6 1.3-2.9 2.8-3.5l-2-.7Z" />
  </Icon>
);
