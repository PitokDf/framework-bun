import { Context, getGroupLabels, groupByTimezone } from "@buntok/core"

export class TestService {
	async upload(ctx: Context) {
		const transactions = [
			{ id: 1, createdAt: "2026-08-24T05:00:00+07:00", amount: 100 },
			{ id: 2, createdAt: "2026-08-24T08:30:00+07:00", amount: 200 },
			{ id: 3, createdAt: "2026-08-24T14:00:00+07:00", amount: 150 },
		];

		const test = groupByTimezone(transactions, "createdAt", "Asia/Jakarta", "hour")
		const label = getGroupLabels(test, "hour", "id")

		console.log("test", test, "label", label)
		// const result = await parseUploads(ctx, {
		// 	storage: new LocalDiskStorage("./uploads"),
		// 	fields: {
		// 		avatar: {
		// 			maxFileSize: 1024 * 1024 * 5, // 5MB
		// 			allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
		// 			required: true,
		// 		}
		// 	}
		// })

		return label
	}

}