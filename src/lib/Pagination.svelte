<script lang="ts">
	let { currentPage = 1, totalPages = 1, onPageChange }: {
		currentPage?: number;
		totalPages?: number;
		onPageChange: (page: number) => void;
	} = $props();

	const itemsPerPage = 5;
	const startPage = Math.max(1, currentPage - Math.floor(itemsPerPage / 2));
	const endPage = Math.min(totalPages, startPage + itemsPerPage - 1);
	const adjustedStartPage = Math.max(1, endPage - itemsPerPage + 1);

	const pages = Array.from(
		{ length: endPage - adjustedStartPage + 1 },
		(_, i) => adjustedStartPage + i
	);

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			onPageChange(page);
		}
	}
</script>

<div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
	<div class="flex justify-between sm:hidden">
		<button
			onclick={() => goToPage(currentPage - 1)}
			disabled={currentPage === 1}
			class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			Previous
		</button>
		<button
			onclick={() => goToPage(currentPage + 1)}
			disabled={currentPage === totalPages}
			class="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			Next
		</button>
	</div>
	<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
		<div>
			<p class="text-sm text-gray-700">
				Showing page <span class="font-medium">{currentPage}</span> of{' '}
				<span class="font-medium">{totalPages}</span>
			</p>
		</div>
		<div>
			<nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
				<button
					onclick={() => goToPage(currentPage - 1)}
					disabled={currentPage === 1}
					class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="sr-only">Previous</span>
					<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
					</svg>
				</button>
				
				{#if adjustedStartPage > 1}
					<button onclick={() => goToPage(1)} class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
						1
					</button>
					{#if adjustedStartPage > 2}
						<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
							...
						</span>
					{/if}
				{/if}
				
				{#each pages as page}
					<button
						onclick={() => goToPage(page)}
						class="relative inline-flex items-center px-4 py-2 border text-sm font-medium {page === currentPage
							? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
							: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
					>
						{page}
					</button>
				{/each}
				
				{#if endPage < totalPages}
					{#if endPage < totalPages - 1}
						<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
							...
						</span>
					{/if}
					<button onclick={() => goToPage(totalPages)} class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
						{totalPages}
					</button>
				{/if}
				
				<button
					onclick={() => goToPage(currentPage + 1)}
					disabled={currentPage === totalPages}
					class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<span class="sr-only">Next</span>
					<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
					</svg>
				</button>
			</nav>
		</div>
	</div>
</div>
