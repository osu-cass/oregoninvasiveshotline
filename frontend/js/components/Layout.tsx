import { Link } from "@inertiajs/react";
import type { ReactNode } from "react";

interface LayoutProps {
	children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => (
	<>
		<div>
			<nav className="flex items-start justify-center">
				<ul className="flex space-x-4">
					<li>
						<Link href="/">Home</Link>
					</li>
				</ul>
			</nav>
			<div className="mt-32 flex items-center justify-center">{children}</div>
		</div>
	</>
);

export default (page: ReactNode) => <Layout>{page}</Layout>;
