<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import type { PageProps } from "./$types";
	import type { RecipientGroup, JobLog } from "./+page.server";
	import { toTitleCase } from "$lib/helper/titleCase";

	const { data }: PageProps = $props();

	type LiveLog = JobLog & {
		recipientName: string;
		recipientAddress: string;
		recipientId: string;
		userName: string | null;
		tsDisplay: string;
	};

	let logs = $state<LiveLog[]>([]);
	let filter = $state<string>("all");
	let paused = $state(false);
	let connected = $state(false);
	let pendingWhilePaused = $state<LiveLog[]>([]);

	let totalCount = $state(0);
	let activeRecipients = $state(new Set<string>());
	let successCount = $state(0);
	let failCount = $state(0);
	let throughput = $state<number[]>(Array(15).fill(0));
	let tpBuffer = 0;

	const recipientMap = new Map(data.recipients.map((r) => [r.id, r]));

	const initialLogs: LiveLog[] = data.grouped
		.flatMap((g) =>
			g.jobs.flatMap((j) =>
				j.logs.map((l) => ({
					...l,
					recipientName: g.name,
					recipientAddress: g.address,
					recipientId: g.recipientId,
					userName: j.userName,
					tsDisplay: fmt(l.createdAt),
				})),
			),
		)
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 100);

	logs = initialLogs;
	for (const l of initialLogs) {
		totalCount++;
		activeRecipients.add(l.recipientId);
		if (l.status === "success") successCount++;
		if (l.status === "failed") failCount++;
	}

	function fmt(d: Date | string) {
		return new Date(d).toLocaleTimeString("id-ID", {
			hour: "2-digit", minute: "2-digit", second: "2-digit",
		});
	}
	function fmtFull(d: Date | string) {
		return new Date(d).toLocaleString("id-ID", {
			day: "2-digit", month: "short", year: "numeric",
			hour: "2-digit", minute: "2-digit", second: "2-digit",
		});
	}
	function initials(name: string) {
		return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
	}

	const STATUS_CFG = {
		success:    { label: "Sukses",   cls: "b-ok",    dot: "#16a34a" },
		failed:     { label: "Gagal",    cls: "b-fail",  dot: "#dc2626" },
		processing: { label: "Diproses", cls: "b-proc",  dot: "#2563eb" },
		queued:     { label: "Antri",    cls: "b-queue", dot: "#d97706" },
		invalid:    { label: "Invalid",  cls: "b-inv",   dot: "#9ca3af" },
		duplicate:  { label: "Duplikat", cls: "b-dup",   dot: "#ea580c" },
	} as const;

	function statusCfg(s: string) {
		return STATUS_CFG[s as keyof typeof STATUS_CFG] ?? { label: s, cls: "b-inv", dot: "#9ca3af" };
	}
	function levelCls(l: string | null) {
		if (!l) return "";
		return ({ info: "", warn: "tag-warn", error: "tag-error" } as Record<string,string>)[l] ?? "";
	}

	let visibleLogs = $derived(filter === "all" ? logs : logs.filter((l) => l.status === filter));
	let tpMax = $derived(Math.max(...throughput, 1));
	function barH(v: number) { return Math.max(Math.round((v / tpMax) * 100), 4); }
	let tpRate = $derived((throughput.slice(-3).reduce((a, b) => a + b, 0) / 3).toFixed(1));

	let eventSource: EventSource | null = null;

	onMount(() => {
		connect();
		const ticker = setInterval(() => {
			throughput = [...throughput.slice(1), tpBuffer];
			tpBuffer = 0;
		}, 1000);
		return () => clearInterval(ticker);
	});

	onDestroy(() => eventSource?.close());

	function connect() {
		eventSource = new EventSource("/api/logs");
		eventSource.addEventListener("open", () => (connected = true));
		eventSource.onmessage = (e) => {
			try {
				const raw = JSON.parse(e.data);
				const rid = raw.meta?.recipientId as string | undefined;
				const rec = rid ? recipientMap.get(rid) : undefined;
				const live: LiveLog = {
					...raw,
					createdAt: new Date(raw.createdAt),
					recipientId: rid ?? "",
					recipientName: rec?.name ?? raw.recipient?.name ?? `ID ${(rid ?? "?").slice(0, 8)}`,
					recipientAddress: rec?.address ?? raw.recipient?.address ?? "—",
					userName: raw.userName ?? null,
					tsDisplay: fmt(raw.createdAt),
				};
				totalCount++;
				activeRecipients = new Set([...activeRecipients, live.recipientId]);
				if (live.status === "success") successCount++;
				if (live.status === "failed") failCount++;
				tpBuffer++;
				if (paused) {
					pendingWhilePaused = [live, ...pendingWhilePaused];
				} else {
					ingestLog(live);
				}
			} catch {}
		};
		eventSource.onerror = () => {
			connected = false;
			setTimeout(() => {
				if (eventSource?.readyState === EventSource.CLOSED) connect();
			}, 5000);
		};
	}

	function ingestLog(l: LiveLog) {
		logs = [l, ...logs].slice(0, 200);
	}

	function togglePause() {
		paused = !paused;
		if (!paused) {
			for (const l of pendingWhilePaused.reverse()) ingestLog(l);
			pendingWhilePaused = [];
		}
	}

	function clearAll() {
		logs = [];
		totalCount = 0;
		activeRecipients = new Set();
		successCount = 0;
		failCount = 0;
		throughput = Array(15).fill(0);
	}
</script>

<div class="page">
	<div class="hdr">
		<div class="hdr-left">
			<h1>Jobs &amp; Logs</h1>
			<p>Feed real-time per penerima</p>
		</div>
		<div class="hdr-right">
			{#if pendingWhilePaused.length > 0}
				<span class="pending-badge">{pendingWhilePaused.length} pending</span>
			{/if}
			<button class="ctrl-btn" onclick={togglePause}>
				{paused ? "▶ Lanjutkan" : "⏸ Jeda"}
			</button>
			<div class="live-pill" class:disconnected={!connected}>
				<span class="dot" class:paused-dot={paused}></span>
				<span>{!connected ? "Terputus" : paused ? "Dijeda" : "Live"}</span>
			</div>
		</div>
	</div>

	{#if paused}
		<div class="paused-bar">
			⏸ Feed dijeda — {pendingWhilePaused.length} log baru belum tampil. Klik "Lanjutkan" untuk memuat.
		</div>
	{/if}

	<div class="stats">
		<div class="stat"><span class="stat-n">{totalCount.toLocaleString("id-ID")}</span><span class="stat-l">Total log</span></div>
		<div class="stat"><span class="stat-n">{activeRecipients.size}</span><span class="stat-l">Penerima aktif</span></div>
		<div class="stat"><span class="stat-n ok">{successCount.toLocaleString("id-ID")}</span><span class="stat-l">Sukses</span></div>
		<div class="stat"><span class="stat-n fail">{failCount.toLocaleString("id-ID")}</span><span class="stat-l">Gagal</span></div>
	</div>

	<div class="filters">
		{#each ["all","success","failed","processing","queued","duplicate","invalid"] as f}
			<button class="filter-btn" class:active={filter === f} onclick={() => (filter = f)}>
				{f === "all" ? "Semua" : statusCfg(f).label}
				{#if f !== "all"}
					<span class="filter-count">{logs.filter((l) => l.status === f).length}</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="feed-wrap">
		<div class="feed-hdr">
			<span class="feed-hdr-l">⚡ Live stream <span class="feed-total">— {visibleLogs.length.toLocaleString("id-ID")} entries</span></span>
			<button class="clear-btn" onclick={clearAll}>Hapus semua</button>
		</div>

		<div class="feed" aria-live="polite" aria-relevant="additions">
			{#if visibleLogs.length === 0}
				<div class="empty-feed"><p>Menunggu log masuk…</p></div>
			{:else}
				{#each visibleLogs.slice(0, 150) as log (log.id)}
					{@const cfg = statusCfg(log.status)}
					<div class="log-row">
						<div class="tl-col">
							<span class="tl-dot" style="background:{cfg.dot}"></span>
							<span class="tl-line"></span>
						</div>
						<div class="log-main">
							<div class="log-top">
								<span class="badge {cfg.cls}">{cfg.label}</span>
								<span class="tag">{log.source}</span>
								{#if log.workerId}<span class="tag tag-worker">{log.workerId}</span>{/if}
								{#if log.level && log.level !== "info"}<span class="tag {levelCls(log.level)}">{log.level}</span>{/if}
								<code class="job-code">{log.jobId?.slice(0, 7) ?? "—"}…</code>
							</div>
							<div class="recipient-row">
								<div class="avatar">{initials(log.recipientName)}</div>
								<div>
									<div class="recipient-name">{log.recipientName}</div>
									<div class="recipient-addr">{log.recipientAddress}</div>
								</div>
							</div>
							{#if log.meta}
								<div class="log-pills">
									{#if log.meta.couponCode !== undefined}
										<span class="pill p-coupon">Kupon #{log.meta.couponCode}</span>
									{/if}
									{#if log.meta.recipientId}
										<span class="pill p-rid">ID: {String(log.meta.recipientId).slice(0, 8)}…</span>
									{/if}
									{#each Object.entries(log.meta).filter(([k]) => !["couponCode","recipientId"].includes(k)) as [k, v]}
										<span class="pill p-extra">{toTitleCase(k)}: {String(v)}</span>
									{/each}
								</div>
							{/if}
						</div>
						<div class="log-ts" title={fmtFull(log.createdAt)}>{log.tsDisplay}</div>
					</div>
				{/each}
			{/if}
		</div>

		<div class="spark-wrap">
			<div class="spark-hdr">
				<span class="spark-lbl">Throughput 15 detik terakhir</span>
				<span class="spark-rate">{tpRate} log/s</span>
			</div>
			<div class="spark-bars">
				{#each throughput as v}
					<div class="sbar" class:sbar-active={v > 0} style="height:{barH(v)}%" title="{v} log"></div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.page { max-width: 900px; margin: 0 auto; padding: 1.5rem 1.25rem 3rem; font-family: var(--font-sans, system-ui, sans-serif); }
	.hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.25rem; gap: 1rem; }
	.hdr-left h1 { font-size: 1.05rem; font-weight: 500; color: var(--color-text-primary); margin: 0 0 3px; }
	.hdr-left p { font-size: 0.8rem; color: var(--color-text-secondary); margin: 0; }
	.hdr-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
	.live-pill { display: flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; border: 0.5px solid #16a34a44; background: #f0fdf4; font-size: 11px; font-weight: 500; color: #15803d; }
	.live-pill.disconnected { border-color: var(--color-border-secondary); background: var(--color-background-secondary); color: var(--color-text-secondary); }
	.dot { width: 7px; height: 7px; border-radius: 50%; background: #16a34a; animation: blink 1.8s ease-in-out infinite; }
	.paused-dot { background: #d97706; }
	@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
	.ctrl-btn { padding: 4px 12px; border-radius: 8px; border: 0.5px solid var(--color-border-secondary); background: transparent; font-size: 11px; font-weight: 500; color: var(--color-text-secondary); cursor: pointer; }
	.ctrl-btn:hover { background: var(--color-background-secondary); }
	.pending-badge { font-size: 11px; padding: 3px 9px; border-radius: 20px; background: #fef9c3; color: #854d0e; font-weight: 500; }
	.paused-bar { font-size: 12px; color: #854d0e; background: #fefce8; border: 0.5px solid #fde68a; border-radius: 8px; padding: 8px 14px; margin-bottom: 1rem; }
	.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 1rem; }
	.stat { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: .8rem 1rem; display: flex; flex-direction: column; gap: 3px; }
	.stat-n { font-size: 1.35rem; font-weight: 500; color: var(--color-text-primary); line-height: 1; font-variant-numeric: tabular-nums; }
	.stat-n.ok { color: #15803d; } .stat-n.fail { color: #b91c1c; }
	.stat-l { font-size: 11px; color: var(--color-text-secondary); }
	.filters { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: .85rem; }
	.filter-btn { display: flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 500; border: 0.5px solid var(--color-border-secondary); background: transparent; color: var(--color-text-secondary); cursor: pointer; transition: all .12s; }
	.filter-btn:hover { background: var(--color-background-secondary); }
	.filter-btn.active { background: var(--color-text-primary); color: var(--color-background-primary); border-color: var(--color-text-primary); }
	.filter-count { background: var(--color-background-secondary); color: var(--color-text-tertiary); padding: 0 5px; border-radius: 10px; font-size: 10px; }
	.filter-btn.active .filter-count { background: rgba(255,255,255,.18); color: inherit; }
	.feed-wrap { border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); overflow: hidden; background: var(--color-background-primary); }
	.feed-hdr { display: flex; align-items: center; justify-content: space-between; padding: .55rem 1rem; border-bottom: 0.5px solid var(--color-border-tertiary); background: var(--color-background-secondary); }
	.feed-hdr-l { font-size: 12px; font-weight: 500; color: var(--color-text-secondary); }
	.feed-total { font-weight: 400; color: var(--color-text-tertiary); }
	.clear-btn { font-size: 11px; padding: 3px 9px; border-radius: 6px; border: 0.5px solid var(--color-border-secondary); background: transparent; color: var(--color-text-secondary); cursor: pointer; }
	.clear-btn:hover { background: var(--color-background-secondary); }
	.feed { max-height: 520px; overflow-y: auto; scrollbar-width: thin; }
	.empty-feed { display: flex; align-items: center; justify-content: center; padding: 3rem; color: var(--color-text-tertiary); font-size: 13px; }
	.log-row { display: flex; align-items: flex-start; gap: 10px; padding: .65rem 1rem; border-bottom: 0.5px solid var(--color-border-tertiary); animation: slide-in .18s ease-out; }
	.log-row:last-child { border-bottom: none; }
	.log-row:hover { background: var(--color-background-secondary); }
	@keyframes slide-in { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
	.tl-col { display: flex; flex-direction: column; align-items: center; padding-top: 4px; width: 10px; flex-shrink: 0; }
	.tl-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
	.tl-line { width: 1px; background: var(--color-border-tertiary); flex: 1; min-height: 10px; margin-top: 4px; }
	.log-row:last-child .tl-line { display: none; }
	.log-main { flex: 1; min-width: 0; }
	.log-top { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-bottom: 5px; }
	.badge { display: inline-flex; align-items: center; padding: 1px 8px; border-radius: 20px; font-size: 10px; font-weight: 500; white-space: nowrap; }
	.b-ok{background:#dcfce7;color:#15803d} .b-fail{background:#fee2e2;color:#b91c1c} .b-proc{background:#dbeafe;color:#1d4ed8} .b-queue{background:#fef9c3;color:#854d0e} .b-inv{background:#f3f4f6;color:#374151} .b-dup{background:#ffedd5;color:#9a3412}
	.tag { font-size: 10px; padding: 1px 6px; border-radius: 4px; border: 0.5px solid var(--color-border-tertiary); background: var(--color-background-secondary); color: var(--color-text-secondary); white-space: nowrap; }
	.tag-worker { background: #f5f3ff; color: #6d28d9; border-color: #ede9fe; }
	.tag-warn { background: #fffbeb; color: #92400e; border-color: #fde68a; }
	.tag-error { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
	.job-code { font-family: var(--font-mono, monospace); font-size: 9px; padding: 1px 5px; border-radius: 3px; background: var(--color-background-secondary); color: var(--color-text-tertiary); border: 0.5px solid var(--color-border-tertiary); }
	.recipient-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
	.avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--color-background-info); color: var(--color-text-info); font-size: 8px; font-weight: 500; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.recipient-name { font-size: 12px; font-weight: 500; color: var(--color-text-primary); }
	.recipient-addr { font-size: 11px; color: var(--color-text-secondary); }
	.log-pills { display: flex; gap: 5px; flex-wrap: wrap; }
	.pill { font-size: 10px; padding: 1px 7px; border-radius: 4px; white-space: nowrap; }
	.p-coupon{background:#eff6ff;color:#1e40af} .p-rid{background:#f5f3ff;color:#5b21b6} .p-extra{background:var(--color-background-secondary);color:var(--color-text-secondary);border:0.5px solid var(--color-border-tertiary)}
	.log-ts { font-size: 10px; color: var(--color-text-tertiary); white-space: nowrap; flex-shrink: 0; padding-top: 4px; font-variant-numeric: tabular-nums; }
	.spark-wrap { padding: .65rem 1rem; border-top: 0.5px solid var(--color-border-tertiary); background: var(--color-background-secondary); }
	.spark-hdr { display: flex; justify-content: space-between; margin-bottom: 6px; }
	.spark-lbl, .spark-rate { font-size: 11px; color: var(--color-text-secondary); }
	.spark-rate { font-variant-numeric: tabular-nums; }
	.spark-bars { display: flex; align-items: flex-end; gap: 3px; height: 28px; }
	.sbar { flex: 1; border-radius: 2px 2px 0 0; background: var(--color-border-secondary); transition: height .35s ease; }
	.sbar-active { background: #16a34a; }
	@media(max-width:560px){ .stats{grid-template-columns:repeat(2,1fr)} .hdr-right{flex-wrap:wrap;justify-content:flex-end} }
</style>
