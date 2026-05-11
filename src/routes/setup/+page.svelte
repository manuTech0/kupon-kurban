<script lang="ts">
import { Copy } from "lucide-svelte";
import type { PageProps } from "./$types";

const { form }: PageProps = $props();
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-50 px-4">
  <div class="w-full max-w-md bg-white shadow-lg border border-gray-200 rounded-xl p-6 text-wrap">
    
    <h1 class="text-center text-xl font-semibold mb-6 underline underline-offset-4">
      Setup Admin Account
    </h1>

    {#if typeof form === "object" && form && "success" in form}
      {#if form.success && form.userToken}
        <div class="bg-green-400 text-black border border-green-800 p-2 break-all">
          <p class="pb-2 text-center">This your token</p>
          <div class="text-sm bg-gray-700/40 p-2 flex justify-between items-center">
            { form.userToken }
            <button class="bg-transparent border-black" onclick={() => navigator.clipboard.writeText(form.userToken)}>
              <Copy />
            </button>
          </div>
          <form action="?/complete" method="post" class="text-center">
            <input type="hidden" value="{form.userToken}" name="token"/>
            <button class="bg-transparent cursor-pointer border-0 text-blue-800 text-center underline" type="submit">Complete</button>
          </form>
        </div>
      {:else}
        <div class="bg-red-400 text-black border border-red-800 p-2">{ form.message }</div>
      {/if}      
    {:else if form !== null}
      <div class="bg-red-400 text-black border border-red-800 p-2">Unexpected Error</div>
    {/if}
    {#if form === null}
      
    <form action="?/setup" class="space-y-4" method="post">
      
      <div class="flex flex-col gap-1">
        <label for="name" class="text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Joe Doe"
          class="w-full px-3 py-2 border border-gray-300 rounded-md 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        class="w-full bg-blue-600 text-white py-2 rounded-md font-medium
               hover:bg-blue-700 transition"
      >
        Create Account
      </button>

    </form>
    {/if }

  </div>
</div>
