import type { ReactNode } from "react";

interface LayoutProps {
	children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => (
	<>
		<div>{children}</div>
	</>
);

export default (page: ReactNode) => <Layout>{page}</Layout>;
