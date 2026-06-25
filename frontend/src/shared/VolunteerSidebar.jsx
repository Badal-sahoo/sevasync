import React from "react";

const menuItems = [
  { name: "Overview", icon: "⊞" },
  { name: "Tasks", icon: "☰" },
  { name: "Profile", icon: "◍" },
  { name: "Rewards", icon: "★" },
];

const VolunteerSidebar = ({ active, setActive }) => {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[250px] flex-col bg-gradient-to-b from-[#0a1f5c] via-[#1a3a8f] to-[#1e4db7] text-white shadow-[4px_0_24px_rgba(10,31,92,0.18)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-[22px] pb-5 pt-7">
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border-[1.5px] border-white/25 bg-white/15 text-lg font-extrabold">
          V
        </div>
        <div>
          <div className="text-base font-bold tracking-wide">Volunteer</div>
          <div className="mt-px text-[11px] text-white/50">Field Operations</div>
        </div>
      </div>

      <div className="mx-[22px] mb-4 h-px bg-white/10" />

      <nav className="flex flex-1 flex-col gap-1 px-[14px]">
        {menuItems.map(({ name, icon }) => {
          const isActive = active === name;
          return (
            <div
              key={name}
              onClick={() => setActive(name)}
              className={`relative flex cursor-pointer items-center gap-3 rounded-[10px] px-[14px] py-[11px] text-sm font-medium transition ${
                isActive ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className={`w-5 text-center text-[15px] ${isActive ? "opacity-100" : "opacity-70"}`}>{icon}</span>
              <span>{name}</span>
              {isActive && <span className="absolute right-[14px] h-1.5 w-1.5 rounded-full bg-[#60a5fa]" />}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-[22px] py-[18px]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade80]" />
          <span className="text-xs text-white/50">On Duty</span>
        </div>
      </div>
    </aside>
  );
};

export default VolunteerSidebar;
