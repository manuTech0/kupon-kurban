<script lang="ts">
import { enhance } from "$app/forms";
import { toast } from "svelte-sonner";
    import type { PageProps } from "./$types";
    import { toTitleCase } from "$lib/helper/titleCase";
import Pagination from "$lib/Pagination.svelte";
    import { toLowerCase } from "zod";

const { data }: PageProps = $props();

let history = $state(data.history);
let recipient = $state(data.recipient)
let search = $state("");
let currentPage = $state(1);
const itemsPerPage = 10;
let showCreateModal = $state(false);
let showEditModal = $state(false);
let showDeleteModal = $state(false);
let selectedHistory = $state<(typeof data.history)[0] | null>(null);
let formData = $state({
	couponCodeId: "",
	recipientId: "",
	used: false,
	status: "USED" as "USED" | "DUPLICATE" | "VALID",
});

function resetForm() {
	formData = {
		couponCodeId: "",
		recipientId: "",
		used: false,
		status: "USED",
	};
	selectedHistory = null;
}

function openCreateModal() {
	resetForm();
	showCreateModal = true;
}

const filteredHistory = $derived(
	history.filter(item => 
		item.couponCode?.toString().includes(search) ||
		recipient.find(r => r.id === item.recipientId)?.name.toLowerCase().includes(search.toLowerCase()) ||
		recipient.find(r => r.id === item.recipientId)?.address.toLowerCase().includes(search.toLowerCase()) ||
		item.status?.toLowerCase().includes(search.toLowerCase())
	)
);

const totalPages = $derived(Math.ceil(filteredHistory.length / itemsPerPage));
const paginatedHistory = $derived(
	filteredHistory.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	)
);

function handlePageChange(page: number) {
	currentPage = page;
}

$effect(() => {
	currentPage = 1;
});

function getStatusColor(status: string | null) {
	switch (status) {
		case "USED":
			return "bg-green-100 text-green-800";
		case "DUPLICATE":
			return "bg-red-100 text-red-800";
		case "VALID":
			return "bg-blue-100 text-blue-800";
		case null:
		case undefined:
			return "bg-gray-100 text-gray-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

async function handleCreate() {
	const form = document.querySelector("#createForm") as HTMLFormElement;
	if (form) {
		form.requestSubmit();
	}
}

async function handleUpdate() {
	const form = document.querySelector("#editForm") as HTMLFormElement;
	if (form) {
		form.requestSubmit();
	}
}

async function handleDelete() {
	const form = document.querySelector("#deleteForm") as HTMLFormElement;
	if (form) {
		form.requestSubmit();
	}
}
</script>

{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h2 class="text-xl font-bold mb-4">Create Coupon History</h2>
			
			<form 
				id="createForm"
				method="POST" 
				action="?/create"
				use:enhance={() => {
					return async ({ result }) => {
					console.log(result)
						if (result.type === 'success') {
							toast.success('Coupon history created successfully');
							showCreateModal = false;
							location.reload();
						} else if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to create coupon history');
						}
					};
				}}
			>
				<div class="mb-4">
					<label for="coupon" class="block text-sm font-medium mb-1">Coupon</label>
					<select 
						id="coupon"
						name="couponCodeId" 
						bind:value={formData.couponCodeId}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="">Select a coupon</option>
						{#each recipient.filter(d => d.id === formData.recipientId) as coupon}
							<option value={coupon.coupon.couponId}>#{coupon.coupon.code.toString().padStart(4, "0")}</option>
						{/each}
					</select>
				</div>
				
				<div class="mb-4">
					<label for="recipient" class="block text-sm font-medium mb-1">Recipient</label>
					<select 
						id="recipient"
						name="recipientId" 
						bind:value={formData.recipientId}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="">Select a recipient</option>
						{#each recipient as r}
							<option value={r.id}>{toTitleCase(r.name)}</option>
						{/each}
					</select>
				</div>	
				
				<div class="mb-4">
					<label for="used" class="block text-sm font-medium mb-1">Used</label>
					<input 
						id="used"
						type="checkbox" 
						name="used" 
						bind:checked={formData.used}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
				</div>
				
				<div class="mb-4">
					<label for="status" class="block text-sm font-medium mb-1">Status</label>
					<select 
						id="status"
						name="status" 
						bind:value={formData.status}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="USED">Used</option>
						<option value="DUPLICATE">Duplicate</option>
						<option value="VALID">Valid</option>
					</select>
				</div>
				
				<div class="flex justify-end gap-2">
					<button 
						type="button" 
						onclick={() => showCreateModal = false}
						class="px-4 py-2 border rounded-lg hover:bg-gray-100"
					>
						Cancel
					</button>
					<button 
						type="submit"
						class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
					>
						Create
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showEditModal && selectedHistory}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h2 class="text-xl font-bold mb-4">Edit Coupon History</h2>
			
			<form 
				id="editForm"
				method="POST" 
				action="?/update"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							toast.success('Coupon history updated successfully');
							showEditModal = false;
							location.reload();
						} else if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to update coupon history');
						}
					};
				}}
			>
				<input type="hidden" name="id" value={selectedHistory.id} />
				
				<div class="mb-4">
					<label for="edit-coupon" class="block text-sm font-medium mb-1">Coupon</label>
					<select 
						id="edit-coupon"
						name="couponCodeId" 
						bind:value={formData.couponCodeId}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="">Select a coupon</option>
						{#each recipient as coupon}
							<option value={coupon.coupon.couponId}>#{coupon.coupon.code}</option>
						{/each}
					</select>
				</div>
				
				<div class="mb-4">
					<label for="edit-recipient" class="block text-sm font-medium mb-1">Recipient</label>
					<select 
						id="edit-recipient"
						name="recipientId" 
						bind:value={formData.recipientId}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					>
						<option value="">Select a recipient</option>
						{#each recipient as r}
							<option value={r.id}>{toTitleCase(r.name)}</option>
						{/each}
					</select>
				</div>	
				
				<div class="mb-4">
					<label for="edit-used" class="block text-sm font-medium mb-1">Used</label>
					<input 
						id="edit-used"
						type="checkbox" 
						name="used" 
						bind:checked={formData.used}
						class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
				</div>
				
				<div class="mb-4">
					<label for="edit-status" class="block text-sm font-medium mb-1">Status</label>
					<select 
						id="edit-status"
						name="status" 
						bind:value={formData.status}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="USED">Used</option>
						<option value="DUPLICATE">Duplicate</option>
						<option value="VALID">Valid</option>
					</select>
				</div>
				
				<div class="flex justify-end gap-2">
					<button 
						type="button" 
						onclick={() => showEditModal = false}
						class="px-4 py-2 border rounded-lg hover:bg-gray-100"
					>
						Cancel
					</button>
					<button 
						type="submit"
						class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
					>
						Update
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showDeleteModal && selectedHistory}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h2 class="text-xl font-bold mb-4">Delete Coupon History</h2>
			<p class="mb-4">Are you sure you want to delete this coupon history entry?</p>
			
			<form 
				id="deleteForm"
				method="POST" 
				action="?/delete"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							toast.success('Coupon history deleted successfully');
							showDeleteModal = false;
							location.reload();
						} else if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to delete coupon history');
						}
					};
				}}
			>
				<input type="hidden" name="id" value={selectedHistory.id} />
				
				<div class="flex justify-end gap-2">
					<button 
						type="button" 
						onclick={() => showDeleteModal = false}
						class="px-4 py-2 border rounded-lg hover:bg-gray-100"
					>
						Cancel
					</button>
					<button 
						type="submit"
						class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
					>
						Delete
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<div class="p-6">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-2xl font-bold">Coupon History</h1>
		<button 
			onclick={openCreateModal}
			class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
		>
			Add History Entry
		</button>
	</div>

	<div class="mb-4">
		<label for="search" class="sr-only">Search history</label>
		<input 
			id="search"
			type="text" 
			placeholder="Search history..." 
			bind:value={search}
			class="w-full max-w-md px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
	</div>

	<div class="bg-white rounded-lg shadow overflow-hidden">
		<table class="w-full">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coupon</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each paginatedHistory as item}
					<tr>
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
							<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full font-mono">
								#{item.recipient.coupon.code}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{item.recipient.name || 'N/A'} ({item.recipient.address})
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{item?.user?.name || 'N/A'}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{#if item.used}
								<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Yes</span>
							{:else}
								<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">No</span>
							{/if}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							<span class="px-2 py-1 text-xs rounded-full {getStatusColor(item.status)}">
								{item.status || 'N/A'}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{new Date(item.createdAt).toLocaleString()}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							<div class="flex gap-2">
								<button 
									class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
									onclick={() => {
										selectedHistory = item;
										formData = {
											couponCodeId: item.couponCodeId || '',
											recipientId: item.recipientId || '',
											used: item.used || false,
											status: item.status || 'USED'
										};
										showEditModal = true;
									}}
								>
									Edit
								</button>
								<button 
									class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
									onclick={() => {
										selectedHistory = item;
										showDeleteModal = true;
									}}
								>
									Delete
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		
		{#if filteredHistory.length === 0}
			<div class="text-center py-8 text-gray-500">
				No coupon history found
			</div>
		{:else if totalPages > 1}
			<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
		{/if}
	</div>
</div>
