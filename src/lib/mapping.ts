// export function toExcelRows(data: RecipientWithCoupons[]): ExcelRow[] {
// 	const rows: ExcelRow[] = [];
//
// 	for (const r of data) {
// 		// tidak ada coupon
// 		if (r.coupons.size === 0) {
// 			rows.push({
// 				recipient_id: r.id,
// 				recipient_name: r.name,
// 				recipient_address: r.address,
//
// 				coupon_id: null,
// 				coupon_code: null,
// 				coupon_time: null,
//
// 				history_id: null,
// 				history_status: null,
// 				history_used: null,
// 				history_created_at: null,
// 			});
// 			continue;
// 		}
//
// 		for (const c of r.coupons.values()) {
// 			// tidak ada history
// 			if (c.history.length === 0) {
// 				rows.push({
// 					recipient_id: r.id,
// 					recipient_name: r.name,
// 					recipient_address: r.address,
//
// 					coupon_id: c.couponId,
// 					coupon_code: c.code,
// 					coupon_time: c.time ?? null,
//
// 					history_id: null,
// 					history_status: null,
// 					history_used: null,
// 					history_created_at: null,
// 				});
// 				continue;
// 			}
//
// 			// ada history
// 			for (const h of c.history) {
// 				rows.push({
// 					recipient_id: r.id,
// 					recipient_name: r.name,
// 					recipient_address: r.address,
//
// 					coupon_id: c.couponId,
// 					coupon_code: c.code,
// 					coupon_time: c.time ?? null,
//
// 					history_id: h.id,
// 					history_status: h.status,
// 					history_used: h.used,
// 					history_created_at: h.createdAt,
// 				});
// 			}
// 		}
// 	}
//
// 	return rows;
// }
