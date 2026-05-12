<script lang="ts">
import type { PageProps } from "./$types";

const { form }: PageProps = $props();
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-50 px-4">
  <div class="w-full max-w-md bg-white shadow-lg border border-gray-200 rounded-xl p-6 text-wrap">
    
    <h1 class="text-center text-xl font-semibold mb-6 underline underline-offset-4">
      Login
    </h1>

    {#if typeof form === "object" && form && "success" in form}
        <div class="bg-red-400 text-black border border-red-800 p-2">{ form.message }</div>
    {:else if form !== null}
      <div class="bg-red-400 text-black border border-red-800 p-2">Unexpected Error</div>
    {/if}
    {#if form === null}
      
    <form action="?/signin" class="space-y-4" method="post">
      
      <div class="flex flex-col gap-1">
        <label for="token" class="text-sm font-medium text-gray-700">
          Token
        </label>
        <input
          id="token"
          name="token"
          type="password"
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          class="w-full px-3 py-2 border border-gray-300 rounded-md 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        class="w-full bg-blue-600 text-white py-2 rounded-md font-medium
               hover:bg-blue-700 transition"
      >
        Login
      </button>

    </form>
    {/if }

  </div>
</div>
