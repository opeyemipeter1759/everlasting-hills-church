
type NotificationTabsProps = {
  activeTab: "all" | "read" | "unread";
  setActiveTab: (tab: "all" | "read" | "unread") => void;
};

export function NotificationTab({ activeTab, setActiveTab }: NotificationTabsProps) {
  return (
    <div className="flex items-center gap-6 border-b border-gray-200 px-6 mt-4 mb-3 relative">
      {["all", "read", "unread"].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab as "all" | "read" | "unread")}
          className={`relative text-sm font-semibold capitalize font-open-sans pb-2 ${
            activeTab === tab
              ? "text-black after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:h-[2px] after:w-full after:bg-black"
              : "text-gray-500 hover:text-black"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
