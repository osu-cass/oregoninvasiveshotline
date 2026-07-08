import type { ReactNode } from "react";

interface AnnouncementBannerProps {
  /** Content to include in the banner */
  children: ReactNode;
}

/** Displays a compact informational announcement. */
export default function AnnouncementBanner({
	children,
}: AnnouncementBannerProps) {
	return <div className="alert alert-info mb-3 px-3 py-2">{children}</div>;
}
