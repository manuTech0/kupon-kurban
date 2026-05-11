<script>
  import JsBarcode from "jsbarcode";

  let { value, format = "CODE128" } = $props();

  let svgEl = $state();

  function renderBarcode() {
    if (!svgEl) return;

    JsBarcode(svgEl, value, {
      format,
      lineColor: "black",
      width: 1,
      height: 10,
      margin: 0,
      displayValue: false
    });
  }

  // run setiap value berubah
  $effect(() => {
    renderBarcode();
  });
</script>
<div class="bg-white text-black">
  <svg bind:this={svgEl}></svg>
</div>
