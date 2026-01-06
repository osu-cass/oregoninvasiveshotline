import { Link } from "@inertiajs/react";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div>
			<nav className="flex items-start justify-center">
				<ul className="flex space-x-4">
					<li>
						<a href="/">Home!</a>
					</li>
				</ul>
			</nav>
			<div className="flex items-center justify-center mt-32">{children}</div>
		</div>
	);
}
