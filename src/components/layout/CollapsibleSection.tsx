import { useState, type ReactNode } from "react";
import { useUIStore } from "../../stores/useUIStore";

interface CollapsibleSectionProps {
  id?: string;
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({
  id,
  title,
  children,
  defaultOpen = true,
}: CollapsibleSectionProps) {
  const storeOpen = useUIStore((state) => id ? state.sectionOpenState[id] : undefined);
  const setStoreOpen = useUIStore((state) => state.setSectionOpen);
  
  const [localOpen, setLocalOpen] = useState(defaultOpen);

  const isOpen = id ? (storeOpen ?? defaultOpen) : localOpen;

  const toggleOpen = () => {
    if (id) {
      setStoreOpen(id, !isOpen);
    } else {
      setLocalOpen(!isOpen);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 transition-all overflow-hidden">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-800/40 transition-colors"
      >
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4 pt-0 border-t border-slate-800/50 mt-0">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
