<script lang="ts">
import type { LayoutProps } from "./$types";
import { Toaster } from "svelte-sonner";
const { children }: LayoutProps = $props();
</script>

<main>
  <Toaster position="bottom-center" />
  {@render children()}
</main>
