<script lang="ts">
    import Barcode from "$lib/Barcode.svelte";
    import type { PageProps } from "./$types";
    const { data }: PageProps = $props()
</script>

<!-- Screen wrapper -->
<div class="bg-stone-300 p-3 min-h-screen print:p-0 print:bg-white">

  <!-- Toolbar (hidden on print) -->
  <div class="flex items-center justify-between mb-3 print:hidden gap-2">
    <p class="text-xs font-medium text-stone-700">Kupon Kurban Idul Adha 1446 H · {data.recipients.map(d => d.coupon).length} lembar</p>
    <button
      onclick={() => window.print()}
      class="bg-emerald-800 hover:bg-emerald-900 text-emerald-50 text-xs font-medium px-4 py-1.5 rounded transition-colors cursor-pointer border-0"
    >
      Cetak A4
    </button>
  </div>

  <!-- A4 page -->
  <div class="bg-white mx-auto print:mx-0 shadow-lg print:shadow-none"
       style="width:210mm; min-height:297mm; padding:10mm; box-sizing:border-box; print:padding:10mm;">

    <!-- Grid vertikal: 1 kolom, cocok buat 6-10 tiket per halaman -->
    <div class="flex gap-2 flex-wrap">

      {#each data.recipients as k}

        <!-- Kupon vertikal compact: 62mm height (fit 6 di A4) -->
        <div class="bg-white w-56 border border-green-300 overflow-hidden flex flex-col print:break-inside-avoid print:page-break-inside-avoid"
             style="page-break-inside:initial;">

          <!-- Header hijau dengan ornamen -->
          <div class="bg-emerald-800 px-3 pt-2.5 pb-2 relative overflow-hidden">
            <div class="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none"></div>

            <div class="flex items-center gap-2 mb-1 relative z-10">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" class="shrink-0">
                <path d="M20 6C14.477 6 10 10.477 10 16C10 21.523 14.477 26 20 26C22.1 26 24.05 25.33 25.65 24.19C22.1 23.57 19.5 20.45 19.5 16.7C19.5 12.95 22.1 9.83 25.65 9.21C24.05 7.67 22.1 6 20 6Z" fill="#FCD34D"/>
                <polygon points="27,4 27.7,6.3 30,6.3 28.15,7.7 28.85,10 27,8.6 25.15,10 25.85,7.7 24,6.3 26.3,6.3" fill="#FCD34D"/>
              </svg>
              <div>
                <p class="text-[8px] text-emerald-300 uppercase tracking-wider leading-none">Panitia Kurban</p>
                <p class="text-[11px] font-bold text-white leading-tight">Idul Adha 1446 H</p>
              </div>
            </div>
            <!-- <p class="text-[10px] text-emerald-300 text-right tracking-widest font-serif">بسم الله</p> -->
          </div>

          <!-- Ornament strip -->
          <div class="h-[3px]" style="background: repeating-linear-gradient(90deg, #F59E0B 0px, #F59E0B 8px, #065f46 8px, #065f46 16px, #fff 16px, #fff 24px, #065f46 24px, #065f46 32px);"></div>

          <!-- Body - compact spacing -->
          <div class="px-3 py-2 flex flex-col gap-2 flex-1 overflow-hidden bg-slate-300">

            <!-- Nama -->
            <div class="min-h-fit">
              <p class="text-[7px] text-stone-400 uppercase tracking-wider leading-none mb-0.5 font-medium">Nama</p>
              <p class="text-[12px] font-bold text-stone-800 leading-tight line-clamp-1">{k.name}</p>
            </div>

            <!-- Alamat - truncate ke 1 line -->
            <div class="min-h-fit">
              <p class="text-[7px] text-stone-400 uppercase tracking-wider leading-none mb-0.5 font-medium">Alamat</p>
              <p class="text-[9px] text-stone-500 leading-tight line-clamp-1">{k.address}</p>
            </div>

            <!-- Waktu & Tanggal -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <p class="text-[7px] text-stone-400 uppercase tracking-wider leading-none mb-0.5 font-medium">Waktu</p>
                <p class="text-[12px] font-bold text-emerald-700 leading-tight">{k.coupon.time} WIB</p>
              </div>
              <div>
                <p class="text-[7px] text-stone-400 uppercase tracking-wider leading-none mb-0.5 font-medium">Tanggal</p>
                <p class="text-[9px] font-medium text-stone-700 leading-tight">6 Jun 2025</p>
              </div>
            </div>

            <!-- Divider -->
            <div class="flex items-center gap-1.5 text-[7px] text-stone-300 tracking-wider font-medium">
              <span class="flex-1 h-px bg-stone-200"></span>
              Kode
              <span class="flex-1 h-px bg-stone-200"></span>
            </div>

            <!-- Barcode -->
            <div class=" rounded-lg px-2 py-1.5 flex items-center gap-2 border border-stone-100">
              <Barcode value={"#"+k.coupon.code.toString().padStart(4, "0")} />
              <div class="flex-1 min-w-0">
                <p class="font-mono text-stone-600 tracking-widest leading-none mb-0.5" style="font-size:6px;">#{k.coupon.code.toString().padStart(4, "0")}</p>
                <p class="text-[6px] text-stone-400">Scan verifikasi</p>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <!-- <div class="bg-stone-50 px-3 py-1 border-t border-stone-200 flex items-center justify-between"> -->
          <!--   <p class="text-[7px] text-stone-400">Masjid Al-Hikmah, Cirebon</p> -->
          <!--   <span class="text-[7px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-300"> -->
          <!--     Valid -->
          <!--   </span> -->
          <!-- </div> -->

        </div>
      {/each}

    </div>

  </div>
</div>

<style>
  @media print {
    @page {
      size: A4;
      margin: 0;
      padding: 0;
    }
    :global(html), :global(body) {
      margin: 0;
      padding: 0;
    }
    :global(*) {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
</style>
