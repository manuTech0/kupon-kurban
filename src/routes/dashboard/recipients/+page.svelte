<script lang="ts">
import { enhance } from "$app/forms";
import { CardSim, Download } from "lucide-svelte";
import { toast } from "svelte-sonner";
import { utils, writeFile } from "xlsx";
import { goto } from "$app/navigation"
const { data } = $props();

let recipients = $state(data.recipients);
let search = $state("");
let showCreateModal = $state(false);
let showEditModal = $state(false);
let showDeleteModal = $state(false);
let selectedRecipient = $state<(typeof data.recipients)[0] | null>(null);
let formData = $state({
	name: "",
	address: "",
});

function resetForm() {
	formData = { name: "", address: "" };
	selectedRecipient = null;
}

function openCreateModal() {
	resetForm();
	showCreateModal = true;
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

function exportEXCEL() {
	const recipientsSheet = recipients.map((d) => ({
		uuid: d.id,
		nama: d.name,
		alamat: d.address,
		no_kupon: "#" + d.coupon.code.toString().padStart(4, "0"),
	}));
	const couponSheet = recipients.map((d) => d.coupon.history.map(h => ({
		historyId: h.id,
		recipientsId: d.id,
		nama: d.name,
		alamat: d.address,
		status: h.status?.toLocaleLowerCase(),
		date: h.createdAt,
		code: d.coupon.code
	})))
	const worksheetRecipient = utils.json_to_sheet(recipientsSheet);
	const worksheetCoupons = utils.json_to_sheet(couponSheet.flat())
	const workbook = utils.book_new();
	utils.book_append_sheet(workbook, worksheetRecipient, "Recipients");
	utils.book_append_sheet(workbook, worksheetCoupons, "Coupons History")
	writeFile(workbook, `data-${new Date().toISOString()}.xlsx`);
}
</script>

{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h2 class="text-xl font-bold mb-4">Create Recipient</h2>
			
			<form 
				id="createForm"
				method="POST" 
				action="?/create"
				use:enhance={() => {
					return async ({ result }) => {
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
						bind:value={formData.name}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
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

{#if showEditModal && selectedRecipient}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h2 class="text-xl font-bold mb-4">Edit Recipient</h2>
			
			<form 
				id="editForm"
				method="POST" 
				action="?/update"
				use:enhance={() => {
					return async ({ result }) => {
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
					>
						Update
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
			<p class="mb-4">Are you sure you want to delete "{selectedRecipient.name}"?</p>
			
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
			Add Recipient
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
			<button type="button" class="hover:scale-90 p-2 rounded-md flex items-center justify-around gap-2 bg-black/20 border cursor-pointer" onclick={() => goto("recipients/download")}>
				<CardSim /> <span>Download Coupon</span>
			</button>
			<button type="button" class="hover:scale-90 p-2 rounded-md flex items-center justify-around gap-2 bg-black/20 border cursor-pointer" onclick={exportEXCEL}>
				<Download /> <span>Excel</span>
			</button>
		</div>
	</div>

	<div class="bg-white rounded-lg shadow overflow-hidden">
		<table class="w-full">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each recipients.filter(item => 
					item.name.toLowerCase().includes(search.toLowerCase()) ||
					item.address.toLowerCase().includes(search.toLowerCase())
				) as recipient}
					<tr>
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{recipient.name}</td>
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
		
		{#if recipients.length === 0}
			<div class="text-center py-8 text-gray-500">
				No recipients found
			</div>
		{/if}
	</div>
</div>
