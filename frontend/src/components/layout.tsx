import type { ReactNode } from "react";

interface LayoutProps {
	children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => (
	<>
		<div>
			<nav className="flex justify-center">
				<div className="flex w-full max-w-7xl items-center border-theme-primary border-b-3 py-4">
					<img src="/static/img/header_logo.png" alt="Oregon Invasive Species Hotline Logo" className="h-12" />
				</div>
			</nav>
			<div className="mt-32 flex items-center justify-center">{children}</div>
		</div>
	</>
);

export default (page: ReactNode) => <Layout>{page}</Layout>;
