import type { ReactNode } from "react";

interface LayoutProps {
	children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => (
	<>
		<main>{children}</main>
	</>
);

export default (page: ReactNode) => <Layout>{page}</Layout>;
