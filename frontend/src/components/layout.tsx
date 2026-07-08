import type { ReactNode } from "react";

interface LayoutProps {
	/** Page content to render inside the layout. */
	children: ReactNode;
}

/** Root layout wrapper, used by Inertia's resolve callback. */
const Layout = ({ children }: LayoutProps) => <>{children}</>;

export default (page: ReactNode) => <Layout>{page}</Layout>;
