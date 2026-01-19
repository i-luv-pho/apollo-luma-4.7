import { A, useLocation, type ParentProps } from "@solidjs/router"
import { createSignal, For } from "solid-js"

const navItems = [
  { path: "/", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { path: "/users", label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { path: "/revenue", label: "Revenue", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { path: "/usage", label: "Usage", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { path: "/keys", label: "API Keys", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
  { path: "/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
]

export default function Layout(props: ParentProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = createSignal(true)

  return (
    <div class="flex min-h-screen">
      {/* Sidebar */}
      <aside
        class="fixed left-0 top-0 h-full bg-[#1a1a1a] border-r border-[#2a2a2a] transition-all duration-200 z-50"
        style={{ width: sidebarOpen() ? "240px" : "64px" }}
      >
        {/* Logo */}
        <div class="h-16 flex items-center px-4 border-b border-[#2a2a2a]">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span class="text-white font-bold text-sm">A</span>
            </div>
            {sidebarOpen() && (
              <span class="font-semibold text-white">Apollo Admin</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav class="p-3 space-y-1">
          <For each={navItems}>
            {(item) => (
              <A
                href={item.path}
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                classList={{
                  "bg-[#6366f1] text-white": location.pathname === item.path,
                  "text-[#a1a1aa] hover:bg-[#262626] hover:text-white": location.pathname !== item.path,
                }}
              >
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
                </svg>
                {sidebarOpen() && <span class="text-sm font-medium">{item.label}</span>}
              </A>
            )}
          </For>
        </nav>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen())}
          class="absolute bottom-4 right-3 p-2 rounded-lg text-[#a1a1aa] hover:bg-[#262626] hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d={sidebarOpen() ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"}
            />
          </svg>
        </button>
      </aside>

      {/* Main content */}
      <main
        class="flex-1 transition-all duration-200"
        style={{ "margin-left": sidebarOpen() ? "240px" : "64px" }}
      >
        <div class="p-8">
          {props.children}
        </div>
      </main>
    </div>
  )
}
