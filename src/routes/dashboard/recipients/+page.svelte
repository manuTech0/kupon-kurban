<script lang="ts">
import { enhance } from "$app/forms";
import { CardSim, Download } from "lucide-svelte";
import { toast } from "svelte-sonner";
import { utils, writeFile } from "xlsx";
import { goto } from "$app/navigation"
import { toTitleCase } from "$lib/helper/titleCase";
import Pagination from "$lib/Pagination.svelte";
    import { onMount } from "svelte";
    import { isWithin3Months } from "$lib/helper/within3Month.js";
const { data } = $props();

const CHAR = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65+i))
const zone = CHAR.concat(CHAR.map((C) => `${C}1`), CHAR.map((C) => `${C}2`))

let recipients = $state(data.recipients);
let search = $state("");
let currentPage = $state(1);
const itemsPerPage = 10;
let showCreateModal = $state(false);
let showEditModal = $state(false);
let showDeleteModal = $state(false);
let selectedRecipient = $state<(typeof data.recipients)[0] | null>(null);
let formData = $state({
	name: "",
	address: "",
});
let loading = $state(false)

function resetForm() {
	formData = { name: "", address: "" };
	selectedRecipient = null;
}

function openCreateModal() {
	resetForm();
	showCreateModal = true;
}

const filteredRecipients = $derived(
	recipients.filter(item => 
		item.name.toLowerCase().includes(search.toLowerCase()) ||
		item.address.toLowerCase().includes(search.toLowerCase())
	)
);

const totalPages = $derived(Math.ceil(filteredRecipients.length / itemsPerPage));
const paginatedRecipients = $derived(
	filteredRecipients.slice(
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
let inputFocus = $state(false)
function focus(node: HTMLInputElement) {
	node.focus()
	return {
		destroy() {}
	}
}

async function exportEXCEL() {
	// const res = await fetch("/api/recipient", {
	// 	method: "GET"
	// })
	// const data = await res.json() as typeof recipients
	const recipientsSheet = recipients.map((d, index) => ({
		no: index+1, 
		no_kupon: `#${d.coupon.code.toString().padStart(4, "0")}`,
		nama: toTitleCase(d.name),
		alamat: toTitleCase(d.address),
		diterima: d.coupon.history.find(h => 	isWithin3Months(h.createdAt))?.status === "USED" ? "Iya" : "Tidak"
	}));
	const worksheetRecipient = utils.json_to_sheet(recipientsSheet);
	const workbook = utils.book_new();
	utils.book_append_sheet(workbook, worksheetRecipient, "Recipients");
	writeFile(workbook, `data-${new Date().toISOString()}.xlsx`);
}

onMount(() => {
	window.addEventListener("keydown", (event) => {
		if(event.shiftKey && event.key.toLowerCase() === "a") {
			event.preventDefault()
			event.stopPropagation()
			if(showCreateModal) {
				showCreateModal = false
				inputFocus = false
			} else {
				openCreateModal()
				inputFocus = true
				resetForm()
			}
		}
	})
})
</script>

{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h2 class="text-xl font-bold mb-4">Create Recipient</h2>
			
			<form 
				id="createForm"
				method="POST" 
				action="?/create"
				onsubmit={() => loading = true}
				use:enhance={() => {
					return async ({ result }) => {
						loading = false
						if (result.type === 'success') {
							toast.success('Recipient created successfully');
							showCreateModal = false;
							location.reload();
						} else if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to create recipient');
						}
					};
				}}
			>
				<div class="mb-4">
					<label for="name" class="block text-sm font-medium mb-1">Name</label>
					<input 
						id="name"
						type="text" 
						name="name"
						use:focus
						bind:value={formData.name}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
				
        <div class="mb-4">
					<label for="zone" class="block text-sm font-medium mb-1">Zone</label>
					<select name="zone" id="zone" class="block text-sm font-medium mb-1">
					  {#each zone as z}
					    <option value={z}>{z}</option>
					  {/each}
					</select>
        </div>

				<div class="mb-4">
					<label for="address" class="block text-sm font-medium mb-1">Address</label>
					<textarea 
						id="address"
						name="address" 
						bind:value={formData.address}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						rows="3"
						required
					></textarea>
				</div>
				
				<div class="flex justify-end gap-2">
					<button 
						type="button" 
						onclick={() => {
							showCreateModal = false
							inputFocus = false
						}}
						class="px-4 py-2 border rounded-lg hover:bg-gray-100"
					>
						Cancel
					</button>
					<button 
						type="submit"
						class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
						disabled={loading}
					>
						{loading ? "Creating..." : "Create"}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showEditModal && selectedRecipient}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h2 class="text-xl font-bold mb-4">Edit Recipient</h2>
			
			<form 
				id="editForm"
				method="POST" 
				action="?/update"
				onsubmit={() => loading = true}
				use:enhance={() => {
					return async ({ result }) => {
						loading = true
						if (result.type === 'success') {
							toast.success('Recipient updated successfully');
							showEditModal = false;
							location.reload();
						} else if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to update recipient');
						}
					};
				}}
			>
				<input type="hidden" name="id" value={selectedRecipient.id} />
				
				<div class="mb-4">
					<label for="edit-name" class="block text-sm font-medium mb-1">Name</label>
					<input 
						id="edit-name"
						type="text" 
						name="name" 
						bind:value={formData.name}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
				
        <div class="mb-4">
					<label for="zone" class="block text-sm font-medium mb-1">Zone</label>
					<select name="zone" id="zone" class="block text-sm font-medium mb-1">
					  {#each zone as z}
					    <option value={z}>{z}</option>
					  {/each}
					</select>
        </div>

				<div class="mb-4">
					<label for="edit-address" class="block text-sm font-medium mb-1">Address</label>
					<textarea 
						id="edit-address"
						name="address" 
						bind:value={formData.address}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						rows="3"
						required
					></textarea>
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
						disabled={loading}
					>
						{loading ? "Updateing.." : "Update"}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showDeleteModal && selectedRecipient}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h2 class="text-xl font-bold mb-4">Delete Recipient</h2>
			<p class="mb-4">Are you sure you want to delete "{toTitleCase(selectedRecipient.name)}"?</p>
			
			<form 
				id="deleteForm"
				method="POST" 
				action="?/delete"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							toast.success('Recipient deleted successfully');
							showDeleteModal = false;
							location.reload();
						} else if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to delete recipient');
						}
					};
				}}
			>
				<input type="hidden" name="id" value={selectedRecipient.id} />
				
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
		<h1 class="text-2xl font-bold">Recipients</h1>
		<button 
			onclick={openCreateModal}
			class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
		>
			Add Recipient (Shift+a)
		</button>
	</div>
	<div class="mb-4 flex justify-between items-centert">
		<div>
			<label for="search" class="sr-only">Search recipients</label>
			<input 
				id="search"
				type="text" 
				placeholder="Search recipients..." 
				bind:value={search}
				class="w-full max-w-md px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
		<div class="flex">
			<button type="button" class="hover:scale-90 p-2 rounded-l-md flex items-center justify-around gap-2 bg-black/20 border cursor-pointer" onclick={() => goto("recipients/download")}>
				<CardSim /> <span>Coupon</span>
			</button>
			<button type="button" class="hover:scale-90 p-2 rounded-r-md flex items-center justify-around gap-2 bg-black/20 border cursor-pointer" onclick={exportEXCEL}>
				<Download /> <span>Excel</span>
			</button>
		</div>
	</div>

	<div class="bg-white rounded-lg shadow">
		<table class="w-full overflow-x-auto">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each paginatedRecipients as recipient}
					<tr>
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{toTitleCase(recipient.name)}</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{recipient.zone?.toUpperCase() ?? "Reguler"}</td>
						<td class="px-6 py-4 text-sm text-gray-500">{recipient.address}</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{new Date(recipient.createdAt).toLocaleDateString()}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							<div class="flex gap-2">
								<button 
									class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
									onclick={() => {
										selectedRecipient = recipient;
										formData = {
											name: recipient.name,
											address: recipient.address
										};
										showEditModal = true;
									}}
								>
									Edit
								</button>
								<button 
									class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
									onclick={() => {
										selectedRecipient = recipient;
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
		
		{#if filteredRecipients.length === 0}
			<div class="text-center py-8 text-gray-500">
				No recipients found
			</div>
		{:else if totalPages > 1}
			<Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
		{/if}
	</div>
</div>
