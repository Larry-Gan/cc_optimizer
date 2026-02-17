import { NavLink } from "react-router-dom";

const tabs = [
  { label: "Browse", to: "/" },
  { label: "Portfolio", to: "/portfolio" },
  { label: "Optimize", to: "/optimize" },
  { label: "Compare", to: "/compare" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="text-lg font-semibold text-white">Vibe CC Optimizer</div>
        <nav className="flex gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm transition ${
                  isActive ? "bg-indigo-500 text-white" : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
