<script lang="ts">
import { enhance } from "$app/forms";
import { toast } from "svelte-sonner";

const { data } = $props();

let coupons = $state(data.coupons);
let search = $state("");
let showEditModal = $state(false);
let showDeleteModal = $state(false);
let selectedCoupon = $state<
	| ((typeof data.coupons)[0] & {
			recipient?: (typeof data.recipient)[0];
	  })
	| null
>(null);
let formData = $state({
	time: "",
	recipientId: "",
});

function resetForm() {
	formData = { time: "", recipientId: "" };
	selectedCoupon = null;
}

let recipients = $state(data.recipient);

function formatDateForInput(date: Date | string | null | undefined): string {
	if (!date) return "";
	const d = new Date(date);
	return d.toISOString().slice(0, 16);
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

{#if showEditModal && selectedCoupon}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h2 class="text-xl font-bold mb-4">Edit Coupon</h2>
			
			<form 
				id="editForm"
				method="POST" 
				action="?/update"
				use:enhance={() => {
					return async ({ result }) => {
						console.log("Update actions", result)
						if (result.type === 'success') {
							toast.success('Coupon updated successfully');
							showEditModal = false;
							location.reload();
						} else if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to update coupon');
						}
					};
				}}
			>
				<input type="hidden" name="couponId" value={selectedCoupon.couponId} />
				
				<div class="mb-4">
					<label for="coupon-code" class="block text-sm font-medium mb-1">Coupon Code (Auto-generated)</label>
					<input 
						id="coupon-code"
						type="text" 
						value={selectedCoupon.code}
						disabled
						class="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500"
					/>
				</div>
				
				<div class="mb-4">
					<label for="edit-time" class="block text-sm font-medium mb-1">Time</label>
					<input 
						id="edit-time"
						type="datetime-local" 
						name="time" 
						bind:value={formData.time}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
					
				<div class="mb-4">
					<label for="recipientId" class="block text-sm font-medium mb-1">Recipient</label>
					<select 
						name="recipientId"
						id="recipient"
						bind:value={formData.recipientId}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{#each recipients as recip}
							<option value={recip.id}>{recip.name} / {recip.address}</option>
						{/each}
					</select>
				</div>
				<div class="mb-4">
					<label for="coupon-id" class="block text-sm font-medium mb-1">Coupon ID (Read-only)</label>
					<input 
						id="coupon-id"
						type="text" 
						value={selectedCoupon.couponId}
						disabled
						class="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500"
					/>
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

{#if showDeleteModal && selectedCoupon}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h2 class="text-xl font-bold mb-4">Delete Coupon</h2>
			<p class="mb-4">Are you sure you want to delete coupon code "{selectedCoupon.code}"?</p>
			
			<form 
				id="deleteForm"
				method="POST" 
				action="?/delete"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							toast.success('Coupon deleted successfully');
							showDeleteModal = false;
							location.reload();
						} else if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to delete coupon');
						}
					};
				}}
			>
				<input type="hidden" name="couponId" value={selectedCoupon.couponId} />
				
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
	<!-- <div class="flex justify-between items-center mb-6"> -->
	<!-- 	<h1 class="text-2xl font-bold">Coupons</h1> -->
	<!-- 	<button  -->
	<!-- 		onclick={openCreateModal} -->
	<!-- 		class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" -->
	<!-- 	> -->
	<!-- 		Add Coupon -->
	<!-- 	</button> -->
	<!-- </div> -->

	<div class="mb-4">
		<label for="search" class="sr-only">Search coupons</label>
		<input 
			id="search"
			type="text" 
			placeholder="Search coupons..." 
			bind:value={search}
			class="w-full max-w-md px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
	</div>

	<div class="bg-white rounded-lg shadow overflow-hidden">
		<table class="w-full">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each coupons.filter(coupon => 
					coupon.code?.toString().includes(search) ||
					coupon.couponId?.toLowerCase().includes(search.toLowerCase())
				) as coupon}
					<tr>
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
							<span class="px-2 py-1 bg-green-100 text-green-800 rounded-full font-mono">
								#{coupon.code.toString().padStart(10, "0")}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{coupon.time}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{recipients.find(d => d.id === coupon.recipientId)?.name} / {recipients.find(d => d.id === coupon.recipientId)?.address}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							{new Date(coupon.createdAt).toLocaleString()}
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							<div class="flex gap-2">
								<button 
									class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
									onclick={() => {
										selectedCoupon = coupon;
										formData = {
											time: formatDateForInput(coupon.time),
											recipientId: recipients.find(d => d.id === coupon.recipientId)?.id ?? ""
										};
										showEditModal = true;
									}}
								>
									Edit
								</button>
								<button 
									class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
									onclick={() => {
										selectedCoupon = { ...coupon, recipient: recipients.find(d => d.id === coupon.recipientId) };
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
		
		{#if coupons.length === 0}
			<div class="text-center py-8 text-gray-500">
				No coupons found
			</div>
		{/if}
	</div>
</div>
