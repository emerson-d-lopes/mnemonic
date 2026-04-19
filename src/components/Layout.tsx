import { NavLink, Outlet } from "react-router";
import { ThemeToggle } from "./ThemeToggle";

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "text-accent"
    : "text-text-secondary hover:text-text transition-colors";

export function Layout() {
  return (
    <>
      <header>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <nav className="flex items-center gap-6 text-sm">
            <NavLink to="/" end className={navClass}>
              mnemonic
            </NavLink>
            <NavLink to="/stats" className={navClass}>
              stats
            </NavLink>
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <main>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <Outlet />
        </div>
      </main>
    </>
  );
}
