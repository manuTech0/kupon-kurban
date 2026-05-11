<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import type { PageProps } from "./$types";
import Fuse from "fuse.js";
import { TicketCheck, TicketMinus, ChevronRight } from "lucide-svelte";
import { toast } from "svelte-sonner";
import { isWithin3Months } from "$lib/helper/within3Month";
import type { LogMeta } from "$lib/types/log";
    import { browser } from "$app/environment";

const { data }: PageProps = $props();

// ---------------- TYPES ----------------
type CheckedEntry = {
	status: "terpakai" | "invalid" | "dalam-3-bulan" | "valid";
	checked: boolean;
	id: string;
};

type Log = {
	id: number;
	jobId: string;
	status: string;
	source: string;
	createdAt: Date;
	level: "info" | "warn" | "error";
	meta?: LogMeta;
};

// ---------------- STATE ----------------
let scanning = $state(false);
let result = $state<typeof data.recipients | null>(null);
let search = $state("");
let videoEl = $state<HTMLVideoElement | null>(null);
let controls = $state<IScannerControls | null>(null);
let ticketBtnHover = $state<{ [key: number]: boolean }>({});

// ✅ Map: O(1) lookup & update
let checkedData = $state<Map<string, CheckedEntry>>(new Map());

let logs = $state<Log[]>([]);
let openGroups = $state<Set<string>>(new Set());

// ---------------- SYNC dari server data ----------------
$effect(() => {
	const updates = new Map<string, CheckedEntry>();

	for (const recipient of data.recipients) {
		if (checkedData.has(recipient.id)) continue;

		const coupon = recipient.coupon;
		if (!coupon) continue;

		const history =
			coupon.history.length > 0
				? coupon.history.reduce((a, b) =>
						new Date(b.createdAt) > new Date(a.createdAt) ? b : a,
					)
				: null;

		if (!history) continue;

		const isUsed = history.status === "USED";
		const isRecent = isWithin3Months(history.createdAt);

		// USED tapi > 3 bulan → skip
		if (isUsed && !isRecent) continue;

		updates.set(recipient.id, {
			id: recipient.id,
			checked: isUsed && isRecent,
			status: isUsed && isRecent ? "dalam-3-bulan" : "valid",
		});
	}

	if (updates.size > 0) {
		checkedData = new Map([...checkedData, ...updates]);
	}
});

// ---------------- DERIVED: log groups ----------------
const logGroups = $derived.by(() => {
	const groups = new Map<string, Log[]>();
	for (const log of logs) {
		const key = log.meta?.recipientId ?? "unknown";
		const existing = groups.get(key);
		if (existing) existing.push(log);
		else groups.set(key, [log]);
	}
	return groups;
});

// ---------------- FUSE ----------------
const fuseData = new Fuse(data.recipients, {
	keys: ["name", "address", "coupon.code"],
	threshold: 0.4,
});

// ---------------- SCANNER ----------------
const codeReader = new BrowserMultiFormatReader();
let cooldown = false;
let debounceTimer: ReturnType<typeof setTimeout>;

// ---------------- SEARCH ----------------
function runSearch(value: string) {
	result = value ? fuseData.search(value).map((d) => d.item) : null;
}

function handleInput(value: string) {
	search = value;
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => runSearch(search), 250);
}

// ---------------- SCAN ----------------
function handleScanResult(text: string) {
	if (cooldown) return;
	cooldown = true;
	const clean = text.replace("#", "");
	search = clean;
	runSearch(clean);
	setTimeout(() => (cooldown = false), 200);
}

// ---------------- CHECK DATA ----------------
function checkData(payload: { id: string; code: number }) {
	const idLoading = toast.loading("Sedang menceklis kupon...");

	// ✅ O(1) update dengan Map
	const updated = new Map(checkedData);
	updated.set(payload.id, {
		id: payload.id,
		checked: true,
		status: "terpakai",
	});
	checkedData = updated;

	fetch("/api/check", {
		method: "POST",
		body: JSON.stringify(payload),
	});

	toast.success("Kupon sudah di ceklis", { id: idLoading });
}
let deviceId = $state(0)
let devices = $state<MediaDeviceInfo[]>([])
$effect(() => {
  if(browser && devices.length <= 0) {
    (async () => {
      devices = await BrowserMultiFormatReader.listVideoInputDevices();
    })()
  }
})
// ---------------- SCANNER CONTROL ----------------
async function startScan() {
	result = null;
	try {
		const selectedDeviceId = devices[deviceId]?.deviceId;
		scanning = true;
		controls = await codeReader.decodeFromVideoDevice(
			selectedDeviceId,
			videoEl!,
			(res) => {
				if (res) handleScanResult(parseInt(res.getText().replace("#", "")).toString());
			},
		);
	} catch (e: any) {
		scanning = false;
		toast.error("Gagal kamera: " + (e.message ?? String(e)));
	}
}

function stopScan() {
	controls?.stop();
	controls = null;
	scanning = false;
}

// ---------------- LOG GROUP TOGGLE ----------------
function toggleGroup(recipientId: string) {
	const next = new Set(openGroups);
	if (next.has(recipientId)) next.delete(recipientId);
	else next.add(recipientId);
	openGroups = next;
}

onMount(() => {
	const es = new EventSource(`/api/logs`);
	es.onmessage = (e) => {
		const log = JSON.parse(e.data);
		logs = [log, ...logs];
	};
	return () => es.close();
});

onDestroy(() => {
	stopScan();
	clearTimeout(debounceTimer);
});
</script>

<!-- Page -->
<main class="min-h-screen bg-[#0a0a0f] text-slate-100 font-['Sora',sans-serif] flex flex-col items-center py-12 px-4">

  <!-- Header -->
  <div class="mb-10 text-center">
    <p class="text-[11px] tracking-[0.35em] uppercase text-slate-500 mb-2">Scan Kurban</p>
    <h1 class="text-4xl font-bold tracking-tight bg-linear-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
      QR Scanner
    </h1>
    <div class="mt-3 h-px w-24 mx-auto bg-linear-to-r from-transparent via-teal-500 to-transparent"></div>
  </div>

  <div class="w-full max-w-md">

    <!-- Scanner Card -->
    <div class="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur overflow-hidden shadow-2xl shadow-black/60">

      <!-- Video area -->
      <div class="relative aspect-video bg-black flex items-center justify-center overflow-hidden">

        {#if !scanning}
          <div class="flex flex-col items-center gap-4 text-slate-500">
            <div class="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center">
              <svg class="w-9 h-9" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"/>
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75V16.5zM16.5 6.75h.75v.75h-.75v-.75z"/>
              </svg>
            </div>
            <p class="text-sm">Kamera tidak aktif</p>
          </div>
        {/if}

        <!-- svelte-ignore a11y_media_has_caption -->
        <video
          bind:this={videoEl}
          class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-100"
          autoplay
          playsinline
          muted
        ></video>

        {#if scanning}
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="relative w-52 h-20">
              <span class="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400 rounded-tl-sm"></span>
              <span class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400 rounded-tr-sm"></span>
              <span class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400 rounded-bl-sm"></span>
              <span class="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400 rounded-br-sm"></span>
              <div class="scan-line absolute left-2 right-2 h-0.5 bg-linear-to-r from-transparent via-cyan-400 to-transparent"></div>
            </div>
          </div>
          <div class="absolute inset-0 bg-black/25 pointer-events-none"></div>
        {/if}
      </div>

      <!-- Action Buttons -->
      <div class="p-5 flex flex-col gap-3">
        {#if !scanning}
          <button
            onclick={startScan}
            class="w-full py-3 rounded-xl font-semibold text-sm tracking-wide
              bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950
              hover:from-cyan-400 hover:to-teal-400 active:scale-[0.98]
              transition-all duration-150 shadow-lg shadow-teal-900/40"
          >
            Mulai Scan
          </button>
          <div class="flex flex-wrap gap-2 justify-center">
            {#each devices as item, i}
               <button disabled={i === deviceId} class="border h-6 w-6 bg-slate-700/20 disabled:bg-slate-700 disabled:text-gray-500 rounded-sm" onclick={() => deviceId = i}>{i + 1}</button>
            {/each}
          </div>
        {:else}
          <button
            onclick={stopScan}
            class="w-full py-3 rounded-xl font-semibold text-sm tracking-wide
              bg-slate-800 border border-slate-700 text-slate-300
              hover:bg-slate-700 active:scale-[0.98] transition-all duration-150"
          >
            Berhenti
          </button>
          <div class="flex flex-wrap gap-2 justify-center">
            {#each devices as item, i}
               <button disabled={i === deviceId} class="border h-6 w-6 bg-slate-700/20 disabled:bg-slate-700 disabled:text-gray-500 rounded-sm" onclick={() => deviceId = i}>{i + 1}</button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Fallback Form -->
    <div class="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur p-5">
      <p class="text-[10px] tracking-[0.3em] uppercase text-slate-500 mb-4 font-semibold">Input Manual</p>
      <div class="space-y-3">
        <div>
          <label class="block text-[11px] uppercase tracking-widest text-slate-500 mb-1.5" for="fname">Cari</label>
          <input
            id="fname"
            type="search"
            placeholder="Masukkan nama atau id"
            class="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700
              text-slate-100 text-sm placeholder:text-slate-600
              focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-700
              transition-colors duration-150"
            oninput={(e) => handleInput(e.currentTarget.value)}
          />
        </div>
      </div>
    </div>

    <!-- Result Card -->
    {#if result}
      <div class="mt-5 result-card p-5 shadow-xl bg-green-600/40 rounded-2xl">
        <h2 class="text-xl text-center font-semibold mb-4">Hasil Pencarian dari: {search}</h2>
        <div class="flex flex-col gap-3.5">
          {#each result as item, index}
            <!-- ✅ O(1) lookup -->
            {@const entry = checkedData.get(item.id)}
            <div
              class="flex justify-between p-2 items-center rounded-lg shadow-sm
                {entry?.checked
                  ? entry.status === 'dalam-3-bulan'
                    ? 'bg-yellow-600/60'
                    : 'bg-red-500'
                  : 'bg-white/20'}"
            >
              <div class="flex justify-start gap-3 flex-row items-center flex-4">
                <h3 class="underline flex-1">#{item.coupon.code.toString().padStart(4, '0')}</h3>
                <div class="flex flex-col flex-4">
                  <p>
                    {item.name}
                    {#if entry}
                      <span
                        class="uppercase text-xs font-bold ml-1
                          {entry.status === 'dalam-3-bulan'
                            ? 'text-yellow-200'
                            : entry.status === 'terpakai'
                            ? 'text-red-200'
                            : 'text-gray-400'}"
                      >
                        ({entry.status})
                      </span>
                    {/if}
                  </p>
                  <div class="border"></div>
                  <p class="text-gray-300 me-4">{item.address}</p>
                </div>
              </div>
              <button
                onclick={() => checkData({ id: item.id, code: item.coupon.code })}
                class="active:scale-75 disabled:scale-100 flex-2 flex justify-center cursor-pointer
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:text-red-800"
                onpointerenter={() => (ticketBtnHover[index] = true)}
                onpointerleave={() => (ticketBtnHover[index] = false)}
              >
                {#if !ticketBtnHover[index] || entry?.checked}
                  <TicketMinus />
                {:else}
                  <TicketCheck />
                {/if}
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Log Panel -->
    {#if logs.length > 0}
      <div class="mt-6 rounded-2xl border border-slate-700 bg-slate-900/60 backdrop-blur overflow-hidden">

        <!-- Log Header -->
        <div class="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <p class="text-[10px] tracking-[0.3em] uppercase text-slate-400 font-semibold">
            Activity Log
          </p>
          <span class="text-[10px] text-slate-600">
            {logGroups.size} grup · {logs.length} entri
          </span>
        </div>

        <!-- Log Groups -->
        <div class="divide-y divide-slate-800/60">
          {#each logGroups as [recipientId, groupLogs]}
            {@const isOpen = openGroups.has(recipientId)}
            {@const hasError = groupLogs.some((l) => l.level === 'error')}
            {@const hasWarn = groupLogs.some((l) => l.level === 'warn')}
            {@const recipient = data.recipients.find(d => d.id === recipientId)}

            <div>
              <!-- Dropdown trigger -->
              <button
                onclick={() => toggleGroup(recipientId)}
                class="w-full flex items-center gap-3 px-5 py-3 text-left
                  hover:bg-slate-800/40 transition-colors duration-150"
              >
                <span
                  class="transition-transform duration-200 text-slate-500 shrink-0"
                  style="transform: rotate({isOpen ? 90 : 0}deg)"
                >
                  <ChevronRight size={14} />
                </span>

                <!-- Level indicator dot -->
                <span
                  class="w-2 h-2 rounded-full shrink-0
                    {hasError ? 'bg-red-500' : hasWarn ? 'bg-yellow-400' : 'bg-emerald-400'}"
                ></span>

                <span class="flex-1 font-mono text-[11px] text-slate-300 truncate">
                  {!recipient  ? '— no recipient —' : recipient.name} {recipient ? `(${recipient.address})` : ""} / <span class="text-xs">{recipientId}</span>
                </span>

                <span class="text-[10px] text-slate-600 shrink-0 ml-2">
                  {groupLogs.length} log
                </span>
              </button>

              <!-- Dropdown content -->
              {#if isOpen}
                <div class="px-5 pb-3 flex flex-col gap-1.5">
                  {#each groupLogs as log}
                    <div
                      class="flex items-start gap-2.5 py-1.5 px-3 rounded-lg text-xs font-mono
                        {log.level === 'error'
                          ? 'bg-red-950/60 text-red-300'
                          : log.level === 'warn'
                          ? 'bg-yellow-950/60 text-yellow-300'
                          : 'bg-slate-800/50 text-slate-400'}"
                    >
                      <!-- Level badge -->
                      <span
                        class="uppercase text-[9px] tracking-widest flex-shrink-0 mt-0.5
                          {log.level === 'error'
                            ? 'text-red-400'
                            : log.level === 'warn'
                            ? 'text-yellow-400'
                            : 'text-emerald-400'}"
                      >
                        {log.level}
                      </span>

                      <span class="flex-1 leading-relaxed break-all">{log.status}</span>

                      <span class="text-[9px] text-slate-600 flex-shrink-0 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Logout -->
    <div class="mt-10 rounded-2xl border border-red-800 bg-red-400/40 backdrop-blur p-5 text-center">
      <button
        class="hover:scale-110 cursor-pointer"
        onclick={async () => {
          const ok = confirm('Yakin untuk logout?');
          if (ok) {
            await fetch('/api/auth/logout');
            location.reload();
          }
        }}
      >
        Logout
      </button>
    </div>

  </div>
</main>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');

  .scan-line {
    animation: scanline 2s ease-in-out infinite;
    top: 8px;
  }

  @keyframes scanline {
    0%   { top: 8px; opacity: 1; }
    50%  { top: calc(100% - 8px); opacity: 0.8; }
    100% { top: 8px; opacity: 1; }
  }

  .result-card {
    animation: fadeUp 0.4s ease forwards;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>
