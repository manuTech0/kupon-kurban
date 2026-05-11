<script lang="ts">
  import { page } from "$app/stores";
  import { LogOut, Menu } from "lucide-svelte";

  let { children, data } = $props();

  let mobileSidebarOpen = $state(false);

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { href: "/dashboard/recipients", label: "Recipients", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { href: "/dashboard/users", label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { href: "/dashboard/coupons", label: "Coupons", icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" },
    { href: "/dashboard/couponHistory", label: "Coupon History", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { href: "/dashboard/jobs", label: "Jobs & Logs", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { href: "/dashboard/jobs/live", label: "Monitor Live", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  ];

  function toggleMobileSidebar() {
    mobileSidebarOpen = !mobileSidebarOpen;
  }

  function isActive(href: string) {
    return $page.url.pathname === href;
  }
</script>

<div class="min-h-screen bg-gray-50 flex">

  <!-- MOBILE BACKDROP -->
  {#if mobileSidebarOpen}
    <button
      class="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
      onclick={() => (mobileSidebarOpen = false)}
    >Backdrop</button>
  {/if}

  <!-- SIDEBAR (DESKTOP = STATIC, MOBILE = OVERLAY) -->
  <aside
    class="
      fixed
      top-0 left-0
      h-screen w-64
      bg-white shadow-lg
      flex flex-col
      z-50

      transform transition-transform duration-300 ease-in-out will-change-transform
      md:translate-x-0!
    "
    class:translate-x-0={mobileSidebarOpen}
    class:-translate-x-full={!mobileSidebarOpen}
  >
    <!-- HEADER -->
    <div class="flex items-center justify-between h-16 px-6 border-b print:hidden">
      <h1 class="text-xl font-semibold">Dashboard</h1>

      <button
        class="lg:hidden p-2 rounded hover:bg-gray-100"
        onclick={toggleMobileSidebar}
      >
        ✕
      </button>
    </div>

    <!-- MENU -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {#each menuItems as item}
        <a
          href={item.href}
          class="
            flex items-center gap-3 px-3 py-2 rounded-md text-sm
            transition-colors duration-200
            hover:bg-gray-100
            {isActive(item.href)
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700'}
          "
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
          </svg>
          {item.label}
        </a>
      {/each}
    </nav>

    <!-- FOOTER -->
    <div class="border-t p-3 flex justify-between items-center">
      <div>
        <div class="font-semibold">{data.user?.name ?? "N/A"}</div>
        <div class="text-xs text-gray-500">
          role: {data.user?.role ?? "N/A"}
        </div>
      </div>

      <button
        class="hover:scale-110 transition"
        onclick={async () => {
          await fetch("/api/auth/logout");
          location.reload();
        }}
      >
        <LogOut size={18} />
      </button>
    </div>
  </aside>

  <!-- MAIN -->
  <div class="flex-1 flex flex-col min-w-0 lg:ml-64">

    <!-- TOP BAR -->
    <header class="h-16 bg-white border-b flex items-center px-4 lg:hidden print:hidden">
      <button
        class="p-2 rounded hover:bg-gray-100"
        onclick={toggleMobileSidebar}
      >
        <Menu />
      </button>
      <span class="ml-3 font-medium">Dashboard</span>
    </header>

    <main class="flex-1">
      {@render children()}
    </main>
  </div>
</div>
