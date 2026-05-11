<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import type { PageProps } from "./$types";
	import type { RecipientGroup, Job, JobLog } from "./+page.server";

	const { data }: PageProps = $props();

	let grouped = $state<RecipientGroup[]>(data.grouped ?? []);
	let eventSource: EventSource | null = null;
	let expandedRecipient = $state<string | null>(null);
	let expandedJob = $state<string | null>(null);

	// ── status config ────────────────────────────────────────────────
	const STATUS = {
		success:    { label: "Sukses",       cls: "badge-success" },
		failed:     { label: "Gagal",        cls: "badge-error"   },
		processing: { label: "Diproses",     cls: "badge-info"    },
		queued:     { label: "Antri",        cls: "badge-warn"    },
		invalid:    { label: "Tidak Valid",  cls: "badge-gray"    },
		duplicate:  { label: "Duplikat",     cls: "badge-orange"  },
	} as const;

	const LEVEL = {
		info:  "lvl-info",
		warn:  "lvl-warn",
		error: "lvl-error",
	} as const;

	const INDICATOR_STATUS = {
		success:    "ind-success",
		failed:     "ind-error",
		processing: "ind-processing",
		queued:     "ind-warn",
		invalid:    "ind-gray",
		duplicate:  "ind-orange",
	} as const;

	function badgeCls(status: string) {
		return STATUS[status as keyof typeof STATUS]?.cls ?? "badge-gray";
	}
	function statusLabel(status: string) {
		return STATUS[status as keyof typeof STATUS]?.label ?? status;
	}
	function levelCls(level: string | null) {
		if (!level) return "";
		return LEVEL[level as keyof typeof LEVEL] ?? "";
	}
	function indicatorCls(status: string) {
		return INDICATOR_STATUS[status as keyof typeof INDICATOR_STATUS] ?? "ind-gray";
	}

	function fmt(date: Date | string) {
		return new Date(date).toLocaleString("id-ID", {
			day: "2-digit", month: "short", year: "numeric",
			hour: "2-digit", minute: "2-digit", second: "2-digit",
		});
	}
	function fmtShort(date: Date | string) {
		return new Date(date).toLocaleString("id-ID", {
			hour: "2-digit", minute: "2-digit", second: "2-digit",
		});
	}
	function initials(name: string) {
		return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
	}

	// ── SSE ──────────────────────────────────────────────────────────
	onMount(() => connectSSE());
	onDestroy(() => eventSource?.close());

	function connectSSE() {
		eventSource = new EventSource("/api/logs");

		eventSource.onmessage = (event) => {
			try {
				const log: JobLog & { userName?: string } = JSON.parse(event.data);
				const recipientId = log.meta?.recipientId as string | undefined;
				if (!recipientId) return;

				const idx = grouped.findIndex((g) => g.recipientId === recipientId);

				if (idx === -1) {
					// Unknown recipient — add minimal group
					grouped = [
						{
							recipientId,
							name: `Recipient ${recipientId.slice(0, 8)}`,
							address: "—",
							totalJobs: 1,
							latestStatus: log.status,
							latestAt: new Date(log.createdAt),
							jobs: [{
								jobId: log.jobId ?? "",
								userId: null,
								createdAt: new Date(log.createdAt),
								userName: log.userName ?? null,
								logs: [log],
							}],
						},
						...grouped,
					];
					return;
				}

				// Update existing recipient group
				const group = { ...grouped[idx] };
				group.latestStatus = log.status;
				group.latestAt = new Date(log.createdAt);

				const jobIdx = group.jobs.findIndex((j) => j.jobId === log.jobId);
				if (jobIdx === -1) {
					group.jobs = [
						{
							jobId: log.jobId ?? "",
							userId: null,
							createdAt: new Date(log.createdAt),
							userName: log.userName ?? null,
							logs: [log],
						},
						...group.jobs,
					];
					group.totalJobs = group.jobs.length;
				} else {
					const jobs = [...group.jobs];
					jobs[jobIdx] = { ...jobs[jobIdx], logs: [log, ...jobs[jobIdx].logs] };
					group.jobs = jobs;
				}

				grouped = [
					group,
					...grouped.slice(0, idx),
					...grouped.slice(idx + 1),
				];
			} catch (e) {
				console.error("SSE parse error:", e);
			}
		};

		eventSource.onerror = () => {
			setTimeout(() => {
				if (eventSource?.readyState === EventSource.CLOSED) connectSSE();
			}, 5000);
		};
	}

	function toggleRecipient(id: string) {
		expandedRecipient = expandedRecipient === id ? null : id;
		expandedJob = null;
	}
	function toggleJob(id: string) {
		expandedJob = expandedJob === id ? null : id;
	}

	// Latest log of a job (first in sorted array)
	function latestLog(job: Job): JobLog | null {
		return job.logs[0] ?? null;
	}
</script>

<div class="page">
	<!-- Header -->
	<div class="page-header">
		<div>
			<h1>Jobs &amp; Logs</h1>
			<p class="subtitle">Log real-time dikelompokkan per penerima</p>
		</div>
		<div class="live-badge">
			<span class="pulse"></span>
			<span>Live</span>
		</div>
	</div>

	<!-- Stats strip -->
	<div class="stats">
		<div class="stat">
			<span class="stat-value">{grouped.length}</span>
			<span class="stat-label">Penerima</span>
		</div>
		<div class="stat">
			<span class="stat-value">{grouped.reduce((s, g) => s + g.totalJobs, 0)}</span>
			<span class="stat-label">Total Job</span>
		</div>
		<div class="stat">
			<span class="stat-value">{grouped.filter((g) => g.latestStatus === "success").length}</span>
			<span class="stat-label">Sukses</span>
		</div>
		<div class="stat">
			<span class="stat-value">{grouped.filter((g) => g.latestStatus === "failed").length}</span>
			<span class="stat-label">Gagal</span>
		</div>
	</div>

	<!-- Empty state -->
	{#if grouped.length === 0}
		<div class="empty">
			<div class="empty-icon">📭</div>
			<p class="empty-title">Belum ada job</p>
			<p class="empty-sub">Job dan log akan muncul di sini secara real-time.</p>
		</div>
	{:else}
		<!-- Recipient list -->
		<div class="recipient-list">
			{#each grouped as group (group.recipientId)}
				{@const isOpen = expandedRecipient === group.recipientId}
				<div class="recipient-card" class:open={isOpen}>
					<!-- Recipient header row -->
					<button
						class="recipient-row"
						onclick={() => toggleRecipient(group.recipientId)}
						aria-expanded={isOpen}
					>
						<div class="avatar">{initials(group.name)}</div>

						<div class="recipient-info">
							<div class="recipient-name">{group.name}</div>
							<div class="recipient-address">{group.address}</div>
						</div>

						<div class="recipient-meta">
							<span class="badge {badgeCls(group.latestStatus)}">{statusLabel(group.latestStatus)}</span>
							<span class="job-count">{group.totalJobs} job{group.totalJobs !== 1 ? "s" : ""}</span>
							<span class="ts">{fmtShort(group.latestAt)}</span>
						</div>

						<svg class="chevron" class:rotated={isOpen} width="16" height="16" viewBox="0 0 16 16" fill="none">
							<path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>

					<!-- Jobs list (expanded) -->
					{#if isOpen}
						<div class="jobs-panel">
							{#each group.jobs as job (job.jobId)}
								{@const latest = latestLog(job)}
								{@const jobOpen = expandedJob === job.jobId}
								<div class="job-block">
									<!-- Job summary row -->
									<button
										class="job-row"
										onclick={() => toggleJob(job.jobId)}
										aria-expanded={jobOpen}
									>
										<span class="indicator {indicatorCls(latest?.status ?? 'queued')}"></span>

										<div class="job-info">
											<span class="job-id">Job <code>{job.jobId.slice(0, 8)}…</code></span>
											{#if job.userName}
												<span class="job-user">oleh {job.userName}</span>
											{/if}
										</div>

										<div class="job-meta">
											{#if latest}
												<span class="badge {badgeCls(latest.status)}">{statusLabel(latest.status)}</span>
												<span class="source-tag">{latest.source}</span>
											{/if}
											<span class="ts">{fmt(job.createdAt)}</span>
										</div>

										<svg class="chevron-sm" class:rotated={jobOpen} width="14" height="14" viewBox="0 0 14 14" fill="none">
											<path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									</button>

									<!-- Logs timeline (expanded) -->
									{#if jobOpen}
										<div class="logs-timeline">
											{#each job.logs as log (log.id)}
												<div class="log-entry">
													<div class="timeline-col">
														<span class="tl-dot {indicatorCls(log.status)}"></span>
														<span class="tl-line"></span>
													</div>
													<div class="log-body">
														<div class="log-header">
															<span class="badge {badgeCls(log.status)}">{statusLabel(log.status)}</span>
															{#if log.level}
																<span class="level-tag {levelCls(log.level)}">{log.level}</span>
															{/if}
															<span class="source-tag">{log.source}</span>
															{#if log.workerId}
																<span class="worker-tag">worker: {log.workerId}</span>
															{/if}
															<span class="ts">{fmt(log.createdAt)}</span>
														</div>
														{#if log.meta}
															<div class="log-meta-pills">
																{#if log.meta.couponCode !== undefined}
																	<span class="meta-pill coupon">Kupon #{log.meta.couponCode}</span>
																{/if}
																{#if log.meta.recipientId}
																	<span class="meta-pill recipient">ID: {String(log.meta.recipientId).slice(0, 8)}…</span>
																{/if}
																{#each Object.entries(log.meta).filter(([k]) => !["couponCode","recipientId"].includes(k)) as [k, v]}
																	<span class="meta-pill extra">{k}: {String(v)}</span>
																{/each}
															</div>
														{/if}
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* ── layout ─────────────────────────────────── */
	.page {
		max-width: 860px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
		font-family: var(--font-sans, system-ui, sans-serif);
	}

	/* ── header ─────────────────────────────────── */
	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}
	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-text-primary, #111);
		margin: 0 0 0.2rem;
	}
	.subtitle {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #666);
		margin: 0;
	}
	.live-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		font-weight: 500;
		color: #16a34a;
		background: #dcfce7;
		padding: 4px 10px;
		border-radius: 20px;
	}
	.pulse {
		width: 7px;
		height: 7px;
		background: #16a34a;
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;
	}
	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(0.85); }
	}

	/* ── stats ──────────────────────────────────── */
	.stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}
	.stat {
		background: var(--color-background-secondary, #f8f8f7);
		border-radius: 10px;
		padding: 0.9rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.stat-value {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-text-primary, #111);
		line-height: 1;
	}
	.stat-label {
		font-size: 0.75rem;
		color: var(--color-text-secondary, #666);
	}

	/* ── empty ──────────────────────────────────── */
	.empty {
		text-align: center;
		padding: 4rem 2rem;
		border: 1px dashed var(--color-border-tertiary, #e0dfdb);
		border-radius: 14px;
	}
	.empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
	.empty-title {
		font-size: 1rem;
		font-weight: 500;
		color: var(--color-text-primary, #111);
		margin: 0 0 0.25rem;
	}
	.empty-sub {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #666);
		margin: 0;
	}

	/* ── recipient card ──────────────────────────── */
	.recipient-list { display: flex; flex-direction: column; gap: 0.6rem; }

	.recipient-card {
		border: 1px solid var(--color-border-tertiary, #e5e4df);
		border-radius: 12px;
		background: var(--color-background-primary, #fff);
		overflow: hidden;
		transition: box-shadow 0.15s;
	}
	.recipient-card.open {
		border-color: var(--color-border-secondary, #ccc);
	}
	.recipient-card:hover {
		box-shadow: 0 2px 8px rgba(0,0,0,0.06);
	}

	.recipient-row {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem 1.1rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
	}
	.recipient-row:hover { background: var(--color-background-secondary, #f9f8f6); }

	.avatar {
		width: 38px;
		height: 38px;
		flex-shrink: 0;
		border-radius: 50%;
		background: var(--color-background-info, #e6f1fb);
		color: var(--color-text-info, #185fa5);
		font-size: 0.75rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.recipient-info { flex: 1; min-width: 0; }
	.recipient-name {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--color-text-primary, #111);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.recipient-address {
		font-size: 0.75rem;
		color: var(--color-text-secondary, #666);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.recipient-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}
	.job-count {
		font-size: 0.75rem;
		color: var(--color-text-secondary, #666);
	}
	.ts {
		font-size: 0.72rem;
		color: var(--color-text-tertiary, #999);
		white-space: nowrap;
	}

	.chevron, .chevron-sm {
		flex-shrink: 0;
		color: var(--color-text-tertiary, #aaa);
		transition: transform 0.2s;
	}
	.chevron.rotated, .chevron-sm.rotated { transform: rotate(180deg); }

	/* ── jobs panel ──────────────────────────────── */
	.jobs-panel {
		border-top: 1px solid var(--color-border-tertiary, #e5e4df);
		padding: 0.5rem 0.75rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.job-block {
		border: 1px solid var(--color-border-tertiary, #ece9e3);
		border-radius: 8px;
		overflow: hidden;
	}

	.job-row {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.6rem 0.85rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
	}
	.job-row:hover { background: var(--color-background-secondary, #f9f8f6); }

	.job-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
	.job-id { font-size: 0.82rem; color: var(--color-text-primary, #111); }
	.job-id code {
		font-family: var(--font-mono, monospace);
		font-size: 0.78rem;
		background: var(--color-background-secondary, #f3f2ee);
		padding: 0 3px;
		border-radius: 3px;
	}
	.job-user { font-size: 0.72rem; color: var(--color-text-secondary, #666); }

	.job-meta { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }

	/* ── logs timeline ────────────────────────────── */
	.logs-timeline {
		border-top: 1px solid var(--color-border-tertiary, #ece9e3);
		padding: 0.6rem 0.85rem 0.75rem 0.85rem;
		background: var(--color-background-secondary, #fafaf8);
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.log-entry {
		display: flex;
		gap: 0.65rem;
	}
	.timeline-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-shrink: 0;
		width: 14px;
	}
	.tl-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
		margin-top: 4px;
	}
	.tl-line {
		width: 1.5px;
		flex: 1;
		min-height: 12px;
		background: var(--color-border-tertiary, #e0dfdb);
		margin: 3px 0;
	}
	.log-entry:last-child .tl-line { display: none; }

	.log-body { flex: 1; padding-bottom: 0.75rem; }
	.log-header {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin-bottom: 0.35rem;
	}

	.log-meta-pills { display: flex; flex-wrap: wrap; gap: 0.3rem; }

	/* ── indicators ──────────────────────────────── */
	.indicator {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.ind-success { background: #16a34a; }
	.ind-error   { background: #dc2626; }
	.ind-warn    { background: #d97706; }
	.ind-info, .ind-processing { background: #2563eb; animation: pulse 1.5s ease-in-out infinite; }
	.ind-gray    { background: #9ca3af; }
	.ind-orange  { background: #ea580c; }

	/* ── badges ──────────────────────────────────── */
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 1px 7px;
		border-radius: 20px;
		font-size: 0.7rem;
		font-weight: 500;
		white-space: nowrap;
	}
	.badge-success  { background: #dcfce7; color: #15803d; }
	.badge-error    { background: #fee2e2; color: #b91c1c; }
	.badge-info     { background: #dbeafe; color: #1d4ed8; }
	.badge-warn     { background: #fef9c3; color: #92400e; }
	.badge-gray     { background: #f3f4f6; color: #374151; }
	.badge-orange   { background: #ffedd5; color: #9a3412; }

	/* ── tags ────────────────────────────────────── */
	.source-tag, .worker-tag, .level-tag {
		font-size: 0.68rem;
		padding: 1px 6px;
		border-radius: 4px;
		white-space: nowrap;
	}
	.source-tag  { background: var(--color-background-secondary, #f3f2ee); color: var(--color-text-secondary, #666); border: 1px solid var(--color-border-tertiary, #e0dfdb); }
	.worker-tag  { background: #f3e8ff; color: #7e22ce; }
	.lvl-info    { background: #eff6ff; color: #1e40af; }
	.lvl-warn    { background: #fffbeb; color: #92400e; }
	.lvl-error   { background: #fef2f2; color: #991b1b; }

	/* ── meta pills ──────────────────────────────── */
	.meta-pill {
		font-size: 0.68rem;
		padding: 1px 6px;
		border-radius: 4px;
		white-space: nowrap;
	}
	.coupon    { background: #eff6ff; color: #1e40af; }
	.recipient { background: #f5f3ff; color: #5b21b6; }
	.extra     { background: var(--color-background-secondary, #f3f2ee); color: var(--color-text-secondary, #666); border: 1px solid var(--color-border-tertiary, #e0dfdb); }

	/* ── responsive ──────────────────────────────── */
	@media (max-width: 560px) {
		.stats { grid-template-columns: repeat(2, 1fr); }
		.recipient-meta { flex-wrap: wrap; }
		.job-meta { flex-wrap: wrap; }
	}
</style>
