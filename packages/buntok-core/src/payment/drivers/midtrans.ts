import type { PaymentDriver } from "../driver";
import type {
	CreateCheckoutInput,
	CreateRefundInput,
	CreateSubscriptionInput,
	CheckoutResult,
	PaymentOptions,
	RefundResult,
	SubscriptionResult,
	WebhookEvent,
} from "../types";
import {
	normalizeCheckoutStatus,
	normalizeRefundStatus,
} from "../helpers";
import {
	PaymentProviderError,
} from "../errors";

export interface MidtransDriverConfig {
	/** Your Midtrans server key (e.g., "SB-Mid-server-...") */
	serverKey: string;
	/** Your Midtrans client key (for frontend Snap integration) */
	clientKey?: string;
	/** Use sandbox mode (default: false) */
	isProduction?: boolean;
	/** Webhook notification URL for Midtrans to POST to */
	notificationUrl?: string;
}

// ─── API Request/Response Types ───────────────────────────────────────────────

interface MidtransSnapRequest {
	transaction_details: {
		order_id: string;
		gross_amount: number;
	};
	credit_card: { secure: boolean };
	customer_details?: {
		email?: string;
		first_name?: string;
		last_name?: string;
	};
	item_details?: Array<{
		id: string;
		price: number;
		quantity: number;
		name: string;
	}>;
	callbacks?: { finish: string };
	custom_field1?: string;
}

interface MidtransSnapResponse {
	token: string;
	redirect_url: string;
}

interface MidtransRefundRequest {
	refund_type: "full" | "partial";
	refund_amount?: number;
	reason?: string;
}

interface MidtransRefundResponse {
	status_code: string;
	status_message: string;
	transaction_status: string;
}

interface MidtransSubscriptionRequest {
	name: string;
	amount: number;
	currency: string;
	interval: string;
	interval_count: number;
	customer_email?: string;
}

interface MidtransSubscriptionResponse {
	id: string;
	status: string;
	created_at: string;
}

interface MidtransWebhookBody {
	signature_key: string;
	order_id: string;
	status_code: string;
	transaction_status: string;
	gross_amount: string;
	transaction_time: string;
	custom_field1?: string;
	[key: string]: unknown;
}

interface MidtransErrorResponse {
	status_code?: string;
	status_message?: string;
	error_messages?: string[];
	[key: string]: unknown;
}

// ─── Base URLs ────────────────────────────────────────────────────────────────

const SNAP_BASE_DEV = "https://app.sandbox.midtrans.com/snap";
const SNAP_BASE_PROD = "https://app.midtrans.com/snap";
const API_BASE_DEV = "https://api.sandbox.midtrans.com/v2";
const API_BASE_PROD = "https://api.midtrans.com/v2";

// ─── Driver ───────────────────────────────────────────────────────────────────

export class MidtransDriver implements PaymentDriver {
	readonly id = "midtrans";

	private serverKey: string;
	private snapBase: string;
	private apiBase: string;
	private notificationUrl?: string;

	constructor(config: MidtransDriverConfig) {
		if (!config.serverKey) {
			throw new PaymentProviderError(
				this.id,
				"CONFIGURATION_ERROR",
				"Midtrans serverKey is required",
			);
		}
		this.serverKey = config.serverKey;
		const isProd = config.isProduction ?? false;
		this.snapBase = isProd ? SNAP_BASE_PROD : SNAP_BASE_DEV;
		this.apiBase = isProd ? API_BASE_PROD : API_BASE_DEV;
		this.notificationUrl = config.notificationUrl;
	}

	// ─── HTTP ──────────────────────────────────────────────────────────────

	private authHeader(): string {
		const encoded = btoa(`${this.serverKey}:`);
		return `Basic ${encoded}`;
	}

	private async request<T>(
		method: string,
		base: string,
		path: string,
		body?: MidtransSnapRequest | MidtransRefundRequest | MidtransSubscriptionRequest,
	): Promise<T> {
		const url = `${base}${path}`;
		const headers: Record<string, string> = {
			Authorization: this.authHeader(),
			"Content-Type": "application/json",
		};

		const res = await fetch(url, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});

		const data = (await res.json()) as Record<string, unknown>;

		if (!res.ok || data.error_messages) {
			const errData = data as unknown as MidtransErrorResponse;
			throw new PaymentProviderError(
				this.id,
				errData.status_code ?? "api_error",
				errData.error_messages?.join(", ") ??
					errData.status_message ??
					"Midtrans API error",
			);
		}

		return data as T;
	}

	// ─── Checkout ─────────────────────────────────────────────────────────

	async createCheckout(
		input: CreateCheckoutInput,
		opts?: PaymentOptions,
	): Promise<CheckoutResult> {
		const orderId = opts?.idempotencyKey ?? `ORDER-${crypto.randomUUID().slice(0, 8)}`;

		const params: MidtransSnapRequest = {
			transaction_details: {
				order_id: orderId,
				gross_amount: input.amount,
			},
			credit_card: {
				secure: true,
			},
		};

		if (input.customerEmail || input.customerName) {
			const nameParts = input.customerName?.split(" ") ?? [];
			params.customer_details = {
				email: input.customerEmail,
				first_name: nameParts[0],
				last_name: nameParts.slice(1).join(" ") || undefined,
			};
		}

		if (input.description) {
			params.item_details = [
				{
					id: orderId,
					price: input.amount,
					quantity: 1,
					name: input.description,
				},
			];
		}

		if (this.notificationUrl) {
			params.callbacks = {
				finish: input.successUrl ?? "https://example.com/success",
			};
		}

		if (input.metadata) {
			params.custom_field1 = JSON.stringify(input.metadata);
		}

		const res = await this.request<MidtransSnapResponse>(
			"POST",
			this.snapBase,
			"/transactions",
			params,
		);

		return {
			id: orderId,
			status: "pending",
			amount: input.amount,
			currency: input.currency.toUpperCase(),
			provider: this.id,
			checkoutUrl: res.redirect_url,
			providerPaymentId: res.token,
			metadata: input.metadata,
			createdAt: new Date(),
		};
	}

	// ─── Refund ───────────────────────────────────────────────────────────

	async createRefund(
		input: CreateRefundInput,
		opts?: PaymentOptions,
	): Promise<RefundResult> {
		const params: MidtransRefundRequest = {
			refund_type: input.amount ? "partial" : "full",
		};
		if (input.amount) {
			params.refund_amount = input.amount;
		}
		if (input.reason) {
			params.reason = input.reason;
		}

		const res = await this.request<MidtransRefundResponse>(
			"POST",
			this.apiBase,
			`/transactions/${input.paymentId}/refund`,
			params,
		);

		return {
			id: `${input.paymentId}-refund-${crypto.randomUUID().slice(0, 8)}`,
			status: normalizeRefundStatus(this.id, res.transaction_status),
			amount: input.amount ?? 0,
			currency: "IDR",
			provider: this.id,
			paymentId: input.paymentId,
			reason: input.reason,
			metadata: input.metadata,
			createdAt: new Date(),
		};
	}

	// ─── Subscription (Midtrans Recurring) ────────────────────────────────

	async createSubscription(
		input: CreateSubscriptionInput,
		opts?: PaymentOptions,
	): Promise<SubscriptionResult> {
		const params: MidtransSubscriptionRequest = {
			name: input.planId,
			amount: 0,
			currency: "IDR",
			interval: "month",
			interval_count: 1,
		};

		if (input.customerEmail) {
			params.customer_email = input.customerEmail;
		}

		const res = await this.request<MidtransSubscriptionResponse>(
			"POST",
			this.apiBase,
			"/subscriptions",
			params,
		);

		return {
			id: res.id,
			status: res.status === "active" ? "active" : "incomplete",
			provider: this.id,
			planId: input.planId,
			customerEmail: input.customerEmail,
			metadata: input.metadata,
			createdAt: new Date(res.created_at),
		};
	}

	// ─── Webhook Verification ─────────────────────────────────────────────

	async verifyWebhookSignature(
		payload: string,
		signature: string,
		secret: string,
	): Promise<boolean> {
		try {
			const body = JSON.parse(payload) as MidtransWebhookBody;
			if (!body.signature_key || !body.order_id || !body.status_code) {
				return false;
			}
			const serverKey = secret || this.serverKey;
			const raw = `${body.order_id}${body.status_code}${serverKey}`;
			const computed = await this.sha512(raw);
			return computed === body.signature_key;
		} catch {
			return false;
		}
	}

	private async sha512(message: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(message);
		const hashBuffer = await crypto.subtle.digest("SHA-512", data);
		return Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}

	parseWebhookEvent(payload: string): WebhookEvent {
		const body = JSON.parse(payload) as MidtransWebhookBody;

		const typeMap: Record<string, WebhookEvent["type"]> = {
			settlement: "payment.completed",
			capture: "payment.completed",
			pending: "payment.created",
			deny: "payment.failed",
			failure: "payment.failed",
			cancel: "payment.failed",
			expire: "payment.expired",
			refund: "refund.completed",
			partial_refund: "refund.completed",
		};

		return {
			id: body.order_id,
			type: typeMap[body.transaction_status] ?? "payment.created",
			provider: this.id,
			rawData: body,
			entityId: body.order_id,
			amount: body.gross_amount ? Number(body.gross_amount) : undefined,
			currency: "IDR",
			status: body.transaction_status,
			metadata: body.custom_field1
				? JSON.parse(body.custom_field1)
				: undefined,
			createdAt: body.transaction_time
				? new Date(body.transaction_time)
				: new Date(),
		};
	}
}
