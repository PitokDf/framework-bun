import { HttpError } from "../helpers/async-handler";

export class PaymentError extends HttpError {
	provider: string;
	providerCode?: string;

	constructor(
		message: string,
		status: number,
		provider: string,
		providerCode?: string,
	) {
		super(status, message);
		this.name = "PaymentError";
		this.provider = provider;
		this.providerCode = providerCode;
	}
}

export class PaymentVerificationError extends PaymentError {
	constructor(provider: string, message = "Webhook signature verification failed") {
		super(message, 400, provider, "VERIFICATION_FAILED");
		this.name = "PaymentVerificationError";
	}
}

export class PaymentIdempotencyError extends PaymentError {
	constructor(provider: string, message = "Idempotency key reuse detected") {
		super(message, 409, provider, "IDEMPOTENCY_CONFLICT");
		this.name = "PaymentIdempotencyError";
	}
}

export class PaymentProviderError extends PaymentError {
	constructor(provider: string, providerCode: string, message: string) {
		super(message, 502, provider, providerCode);
		this.name = "PaymentProviderError";
	}
}

export class PaymentConfigurationError extends PaymentError {
	constructor(provider: string, message = "Invalid payment driver configuration") {
		super(message, 500, provider, "CONFIGURATION_ERROR");
		this.name = "PaymentConfigurationError";
	}
}
