<script lang="ts">
    import { env } from "$env/dynamic/public";
  import Barcode from "$lib/Barcode.svelte";
    import { toTitleCase } from "$lib/helper/titleCase";
    import { zone } from "$lib/helper/zone";
  import type { PageProps } from "./$types";
  import "pagedjs";

  const { data: raw }: PageProps = $props();
  let zoneSelect = $state("all") 
  let data = $derived(zoneSelect === "all" ? raw : {
    ...raw,
    recipients: raw.recipients.filter(r => r.zone === zoneSelect)
  })
  const hijri = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
    year: "numeric"
  }).format(new Date()).replace(/AH|Anno Hegirae/i, "").trim()
</script>

<svelte:head>
  <title>Kupon Kurban {hijri} H</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<!-- Toolbar — pagedjs-ignore agar tidak ikut dicetak -->
<div class="toolbar pagedjs-ignore">
  <div class="toolbar-left">
    <span class="toolbar-badge">{hijri} H</span>
    <p class="toolbar-info">
      Kupon Kurban Idul Adha · <strong>{data.recipients.length}</strong> lembar
    </p>
  </div>
  <div class="flex flex-row gap-3 items-center">  
    <div>
			<select name="zone" class="block text-sm font-medium mb-1" bind:value={zoneSelect}>
				{#each zone as z}
					<option value={z}>{z}</option>
				{/each}
				<option value="all">all</option>
			</select>
    </div>
    <button onclick={() => window.print()} class="btn-print">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      Cetak A4
    </button>
  </div>
</div>

<div class="print-root">
  <div class="coupon-grid">
    {#each data.recipients as k}
      <div class="coupon">

        <!-- Header -->
        <div class="coupon-header">
          <div class="header-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path d="M20 6C14.477 6 10 10.477 10 16C10 21.523 14.477 26 20 26C22.1 26 24.05 25.33 25.65 24.19C22.1 23.57 19.5 20.45 19.5 16.7C19.5 12.95 22.1 9.83 25.65 9.21C24.05 7.67 22.1 6 20 6Z" fill="#FCD34D"/>
              <polygon points="27,4 27.7,6.3 30,6.3 28.15,7.7 28.85,10 27,8.6 25.15,10 25.85,7.7 24,6.3 26.3,6.3" fill="#FCD34D"/>
            </svg>
          </div>
          <div class="header-text">
            <span class="header-eyebrow">Panitia Kurban</span>
            <span class="header-title">Idul Adha {hijri} H</span>
          </div>
        </div>

        <!-- Ornament strip -->
        <div class="ornament-strip" aria-hidden="true"></div>

        <!-- Body -->
        <div class="coupon-body">

          <div class="field">
            <span class="field-label">Nama</span>
            <span class="field-val field-val--name">{toTitleCase(k.name)}</span>
          </div>

          <div class="field">
            <span class="field-label">Alamat</span>
            <span class="field-val field-val--addr">{toTitleCase(k.address)}</span>
          </div>

          <div class="field-row">
            <div class="field">
              <span class="field-label">Waktu</span>
              <span class="field-val field-val--time">{k.coupon.time} WIB</span>
            </div>
            <div class="field">
              <span class="field-label">Tanggal</span>
              <span class="field-val field-val--date">{env.PUBLIC_KURBAN_DATE}</span>
            </div>
          </div>

          <!-- Divider -->
          <div class="divider" aria-hidden="true">
            <span class="divider-line"></span>
            <span class="divider-label">Kode Kupon</span>
            <span class="divider-line"></span>
          </div>

          <!-- Barcode -->
          <div class="barcode-block">
            <Barcode value={`#` + k.coupon.code.toString().padStart(4, "0")} />
            <div class="barcode-info">
              <span class="barcode-num">#{k.coupon.code.toString().padStart(4, "0")}</span>
              <span class="barcode-sub">Scan verifikasi</span>
            </div>
          </div>

        </div>

        <!-- Footer bar -->
        <div class="coupon-footer">
          <span class="footer-tag">VALID · {hijri} H</span>
        </div>

      </div>
    {/each}
  </div>
</div>

<style>
  /* ── Base ───────────────────────────────────────────── */
  :global(body) {
    font-family: 'Plus Jakarta Sans', sans-serif;
    margin: 0;
    background: #F0F4F0;
  }

  /* ── Toolbar ────────────────────────────────────────── */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 18px;
    background: #0F2918;
    position: sticky;
    top: 0;
    z-index: 200;
  }

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .toolbar-badge {
    font-size: 10px;
    font-weight: 700;
    color: #0F2918;
    background: #F59E0B;
    padding: 2px 8px;
    letter-spacing: 0.06em;
  }

  .toolbar-info {
    font-size: 12px;
    color: #6ee7b7;
    margin: 0;
  }
  .toolbar-info strong { color: #ffffff; font-weight: 700; }

  .btn-print {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #16A34A;
    color: #ffffff;
    border: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 11px;
    font-weight: 700;
    padding: 7px 14px;
    cursor: pointer;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    transition: background 0.15s;
  }
  .btn-print:hover { background: #15803D; }

  /* ── Print root ─────────────────────────────────────── */
  .print-root {
    padding: 16px;
  }

  /* ── Grid 4 kolom ───────────────────────────────────── */
  .coupon-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2px;
  }

  /* ── Kupon ──────────────────────────────────────────── */
  .coupon {
    background: #ffffff;
    border: 1.5px solid #16A34A;
    display: flex;
    flex-direction: column;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* ── Header ─────────────────────────────────────────── */
  .coupon-header {
    background: #14532D;
    padding: 9px 11px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-icon-wrap {
    width: 30px;
    height: 30px;
    background: #166534;
    border: 1px solid #15803D;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .header-eyebrow {
    font-size: 7px;
    font-weight: 600;
    color: #86EFAC;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    line-height: 1;
  }

  .header-title {
    font-size: 11px;
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1.1;
    letter-spacing: -0.01em;
  }

  /* ── Ornament strip ─────────────────────────────────── */
  .ornament-strip {
    height: 4px;
    background: repeating-linear-gradient(
      90deg,
      #F59E0B 0px,  #F59E0B 7px,
      #14532D 7px,  #14532D 14px,
      #D1FAE5 14px, #D1FAE5 21px,
      #14532D 21px, #14532D 28px
    );
    flex-shrink: 0;
  }

  /* ── Body ───────────────────────────────────────────── */
  .coupon-body {
    padding: 9px 11px 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    background: #F0F4F0;
  }

  /* ── Fields ─────────────────────────────────────────── */
  .field {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .field-label {
    font-size: 6.5px;
    font-weight: 700;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    line-height: 1;
  }

  .field-val {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    line-clamp: 1;
    line-height: 1.25;
  }

  .field-val--name {
    font-size: 12px;
    font-weight: 800;
    color: #111827;
    letter-spacing: -0.02em;
  }

  .field-val--addr {
    font-size: 8px;
    font-weight: 400;
    color: #6B7280;
  }

  .field-val--time {
    font-size: 12px;
    font-weight: 800;
    color: #14532D;
    letter-spacing: -0.01em;
  }

  .field-val--date {
    font-size: 9px;
    font-weight: 500;
    color: #374151;
  }

  /* ── Divider ────────────────────────────────────────── */
  .divider {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: #D1D5DB;
    display: block;
  }

  .divider-label {
    font-size: 6px;
    font-weight: 700;
    color: #9CA3AF;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    white-space: nowrap;
  }

  /* ── Barcode ────────────────────────────────────────── */
  .barcode-block {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    padding: 5px 8px;
  }

  .barcode-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .barcode-num {
    font-family: 'Courier New', monospace;
    font-size: 8px;
    font-weight: 700;
    color: #111827;
    letter-spacing: 0.2em;
    line-height: 1;
  }

  .barcode-sub {
    font-size: 6px;
    color: #9CA3AF;
    line-height: 1;
  }

  /* ── Footer ─────────────────────────────────────────── */
  .coupon-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 11px;
    background: #14532D;
  }

  .footer-tag {
    font-size: 6px;
    font-weight: 700;
    color: #86EFAC;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }


  /* ── Paged.js @page ─────────────────────────────────── */
  @page {
    size: A4 portrait;
    margin: 10mm;
  }

  /* ── Print overrides ────────────────────────────────── */
  @media print {
    .toolbar        { display: none !important; }
    .print-root     { padding: 0 !important; background: none !important; }
    :global(body)   { background: none !important; }

    :global(*) {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
</style>
