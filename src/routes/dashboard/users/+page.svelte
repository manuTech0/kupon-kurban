<script lang="ts">
import { browser } from "$app/environment";
import { enhance } from "$app/forms";
import { ClosedCaption, Cross, X } from "lucide-svelte";
import { toast } from "svelte-sonner";

const { data, form } = $props();

let users = $state(data.users);
let search = $state("");
let showCreateModal = $state(false);
let showEditModal = $state(false);
let showDeleteModal = $state(false);
let userToken = $state<string | undefined>(undefined);
let selectedUser = $state<(typeof data.users)[0] | null>(null);
let formData = $state({
	name: "",
	role: "SCANNER" as "ADMIN" | "SCANNER",
});

function resetForm() {
	formData = { name: "", role: "SCANNER" };
	selectedUser = null;
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

if (browser) {
	userToken = localStorage.getItem("userToken") ?? "";
}
$effect(() => {
	if (browser) {
		localStorage.setItem("userToken", userToken ?? "");
	}
});

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
			<h2 class="text-xl font-bold mb-4">Create User</h2>
			
			<form 
				id="createForm"
				method="POST" 
				action="?/create"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							toast.success('User created successfully');
							showCreateModal = false;
							userToken = result.data?.userToken as string ?? undefined
							location.reload();
						} else if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to create user');
						}
					};
				}}
			>
				<div class="mb-4">
					<label for="name"class="block text-sm font-medium mb-1">Name</label>
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
					<label class="block text-sm font-medium mb-1" for="role">Role</label>
					<select 
						name="role" 
						id="role"
						bind:value={formData.role}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="SCANNER">Scanner</option>
						<option value="ADMIN">Admin</option>
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

{#if showEditModal && selectedUser}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h2 class="text-xl font-bold mb-4">Edit User</h2>
			
			<form 
				id="editForm"
				method="POST" 
				action="?/update"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							toast.success('User updated successfully');
							showEditModal = false;
							location.reload();
						} else if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to update user');
						}
					};
				}}
			>
				<input type="hidden" name="userId" value={selectedUser.userId} />
				
				<div class="mb-4">
					<label for="ename" class="block text-sm font-medium mb-1">Name</label>
					<input 
						type="text" 
						name="name" 
						id="ename"
						bind:value={formData.name}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>
				
				<div class="mb-4">
					<label for="edit-role" class="block text-sm font-medium mb-1">Role</label>
					<select 
						name="role" 
						id="edit-role"
						bind:value={formData.role}
						class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="SCANNER">Scanner</option>
						<option value="ADMIN">Admin</option>
					</select>
				</div>
				
				<div class="mb-4">
					<label for="user-id" class="block text-sm font-medium mb-1">User ID (Read-only)</label>
					<input 
						id="user-id"
						type="text" 
						value={selectedUser.userId}
						disabled
						class="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500"
					/>
				</div>
				
				<div class="mb-4">
					<label for="token-hash" class="block text-sm font-medium mb-1">Token Hash (Read-only)</label>
					<input 
						type="text" 
						value={selectedUser.token_hash || 'N/A'}
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

{#if showDeleteModal && selectedUser}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h2 class="text-xl font-bold mb-4">Delete User</h2>
			<p class="mb-4">Are you sure you want to delete user "{selectedUser.name}"?</p>
			
			<form 
				id="deleteForm"
				method="POST" 
				action="?/delete"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							toast.success('User deleted successfully');
							showDeleteModal = false;
							location.reload();
						} else if (result.type === 'failure') {
							toast.error(result.data?.error as string || 'Failed to delete user');
						}
					};
				}}
			>
				<input type="hidden" name="userId" value={selectedUser.userId} />
				
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
		<h1 class="text-2xl font-bold">Users</h1>
		<button 
			onclick={openCreateModal}
			class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
		>
			Add User
		</button>
	</div>

	<div class="mb-4">
		<label for="search" class="sr-only">Search users</label>
		<input 
			id="search"
			type="text" 
			placeholder="Search users..." 
			bind:value={search}
			class="w-full max-w-md px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
	</div>

	{#if userToken }	
		<div class="shadow-sm m-2 p-2 bg-green-400 break-all">
			<div class="bg-green-800/20 p-1 text-center flex justify-between items-center">
				<div class="me-2">
					{ userToken }
				</div>
				<button class="p-2 cursor-pointer hover:scale-75" type="button" onclick={() => userToken = undefined}>
					<X />
				</button>
			</div>
		</div>
	{/if}

	<div class="bg-white rounded-lg shadow overflow-hidden">
		<table class="w-full">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
				</tr>
			</thead>
			<tbody class="bg-white divide-y divide-gray-200">
				{#each users.filter(user => 
					user.name?.toLowerCase().includes(search.toLowerCase()) ||
					user.role?.toLowerCase().includes(search.toLowerCase())
				) as user}
					<tr class={`${user.role === "ADMIN" ? "bg-red-400" : ""}`}>
						<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							<span class="px-2 py-1 text-xs rounded-full {user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
								{user.role}
							</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							<code class="text-xs bg-gray-100 px-1 py-0.5 rounded">{user.userId}</code>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
							<div class="flex gap-2">
								<button 
									class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
									onclick={() => {
										selectedUser = user;
										formData = {
											name: user.name || '',
											role: user.role || 'SCANNER'
										};
										showEditModal = true;
									}}
								>
									Edit
								</button>
								{#if user.role !== "ADMIN"}	
									<button 
										class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
										onclick={() => {
											selectedUser = user;
											showDeleteModal = true;
										}}
									>
										Delete
									</button>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		
		{#if users.length === 0}
			<div class="text-center py-8 text-gray-500">
				No users found
			</div>
		{/if}
	</div>
</div>
