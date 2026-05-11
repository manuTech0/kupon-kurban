<script lang="ts">
import { browser } from "$app/environment";
import { invalidate, invalidateAll } from "$app/navigation";
import dayjs from "dayjs";
import ms from "ms";
import { onMount } from "svelte";

let { data } = $props();

const interval = setInterval(async () => {
	if (browser) {
		await invalidate("dash:stats");
	}
}, 5000);
onMount(() => {
	window.addEventListener("beforeunload", () => clearInterval(interval));
});
let stats = $derived([
	{
		title: "Total Recipients",
		value: data.stats?.recipients || 0,
		icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
		color: "bg-blue-500",
		href: "/dashboard/recipients",
	},
	{
		title: "Total Users",
		value: data.stats?.users || 0,
		icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
		color: "bg-green-500",
		href: "/dashboard/users",
	},
	{
		title: "Active Coupons",
		value: data.stats?.coupons || 0,
		icon: "M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z",
		color: "bg-purple-500",
		href: "/dashboard/coupons",
	},
	{
		title: "Coupon Usage",
		value: data.stats?.couponHistory || 0,
		icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
		color: "bg-orange-500",
		href: "/dashboard/couponHistory",
	},
]);

const recentActivity = $derived(
	data.oldHistory?.map((d) => ({
		type: "Checkout",
		entity: `Coupon ${d.recipients?.name} (${d.recipients?.address})`,
		name: `Coupon #${d.coupons?.code.toString().padStart(4, "0")}`,
		time: ms(Math.floor(Date.now() - d.coupon_history.createdAt.getTime()), {
			long: true,
		}),
		date: dayjs(d.coupon_history.createdAt.getTime()).format(
			"YYYY-MMMM-DD, HH:mm",
		),
	})),
);

function getActivityIcon(type: string) {
	switch (type) {
		case "create":
			return "M12 6v6m0 0v6m0-6h6m-6 0H6";
		case "update":
			return "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z";
		case "delete":
			return "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16";
		default:
			return "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
	}
}

function getActivityColor(type: string) {
	switch (type) {
		case "create":
			return "text-green-500 bg-green-100";
		case "update":
			return "text-blue-500 bg-blue-100";
		case "delete":
			return "text-red-500 bg-red-100";
		default:
			return "text-gray-500 bg-gray-100";
	}
}
</script>

<div class="p-6 max-h-screen">
	<!-- Page Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
		<p class="mt-2 text-gray-600">Welcome to your admin dashboard. Here's what's happening with your data.</p>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		{#each stats as stat}
			<a 
				href={stat.href}
				class="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200"
			>
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div class="{stat.color} rounded-lg p-3">
							<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={stat.icon} />
							</svg>
						</div>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">{stat.title}</p>
						<p class="text-2xl font-bold text-gray-900">{stat.value}</p>
					</div>
				</div>
			</a>
		{/each}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-40 max-h-80">
		<!-- Recent Activity -->
		<div class="lg:col-span-2">
			<div class="bg-white rounded-lg shadow-sm border border-gray-200">
				<div class="px-6 py-4 border-b border-gray-200">
					<h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
				</div>
				<div class="divide-y divide-gray-200 overflow-auto h-full">
					{#each recentActivity as activity}
						<div class="px-6 py-4">
							<div class="flex items-center space-x-3">
								<div class="flex-shrink-0">
									<div class="{getActivityColor(activity.type)} rounded-full p-2">
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getActivityIcon(activity.type)} />
										</svg>
									</div>
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-900">
										{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} {activity.entity}
									</p>
									<p class="text-sm text-gray-500">{activity.name}</p>
								</div>
								<div class="flex-shrink-0 text-sm text-gray-500">
									{activity.time}
									{activity.date}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Quick Actions -->
		<div>
			<div class="bg-white rounded-lg shadow-sm border border-gray-200">
				<div class="px-6 py-4 border-b border-gray-200">
					<h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
				</div>
				<div class="p-6 space-y-3">
					<a 
						href="/dashboard/recipients"
						class="block w-full text-left px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors duration-200"
					>
						<div class="flex items-center">
							<svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
							</svg>
							Add New Recipient
						</div>
					</a>
					
					<a 
						href="/dashboard/users"
						class="block w-full text-left px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors duration-200"
					>
						<div class="flex items-center">
							<svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
							</svg>
							Create New User
						</div>
					</a>
					
					<a 
						href="/dashboard/coupons"
						class="block w-full text-left px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors duration-200"
					>
						<div class="flex items-center">
							<svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
							</svg>
							Generate Coupon
						</div>
					</a>
					
					<a 
						href="/dashboard/couponHistory"
						class="block w-full text-left px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors duration-200"
					>
						<div class="flex items-center">
							<svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							View History
						</div>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
