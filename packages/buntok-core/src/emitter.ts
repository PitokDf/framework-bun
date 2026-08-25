/**
 * Lightweight event emitter for loose coupling between modules.
 *
 * @example
 * ```ts
 * import { emitter } from "buntok";
 *
 * // Subscribe to events
 * emitter.on("user:created", async ({ user, ctx }) => {
 *   await sendWelcomeEmail(user.email);
 * });
 *
 * // Emit events
 * emitter.emit("user:created", { user, ctx });
 *
 * // One-time listener
 * emitter.once("app:ready", () => {
 *   console.log("App is ready!");
 * });
 * ```
 */

type EventMap = Record<string, any>;

type Listener<T> = (data: T) => Promise<void> | void;

export class EventEmitter<TEvents extends EventMap = EventMap> {
	private listeners = new Map<keyof TEvents, Set<Listener<any>>>();

	/**
	 * Subscribe to an event.
	 * @returns Unsubscribe function
	 */
	on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): () => void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(listener);

		// Return unsubscribe function
		return () => {
			this.listeners.get(event)?.delete(listener);
		};
	}

	/**
	 * Subscribe to an event, but only fire once.
	 * @returns Unsubscribe function
	 */
	once<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): () => void {
		const wrapper: Listener<TEvents[K]> = async (data) => {
			unsub();
			await listener(data);
		};
		const unsub = this.on(event, wrapper);
		return unsub;
	}

	/**
	 * Emit an event with data.
	 * Returns a promise that resolves when all listeners have finished.
	 */
	async emit<K extends keyof TEvents>(event: K, data: TEvents[K]): Promise<void> {
		const listeners = this.listeners.get(event);
		if (!listeners || listeners.size === 0) return;

		const promises: Promise<void>[] = [];
		for (const listener of listeners) {
			promises.push(Promise.resolve(listener(data)));
		}
		await Promise.all(promises);
	}

	/**
	 * Remove all listeners for an event, or all listeners entirely.
	 */
	off<K extends keyof TEvents>(event?: K): void {
		if (event) {
			this.listeners.delete(event);
		} else {
			this.listeners.clear();
		}
	}

	/**
	 * Get the number of listeners for an event.
	 */
	listenerCount<K extends keyof TEvents>(event: K): number {
		return this.listeners.get(event)?.size ?? 0;
	}
}

/**
 * Default emitter instance with common application events.
 *
 * @example
 * ```ts
 * import { emitter } from "buntok";
 *
 * emitter.on("user:created", ({ user }) => {
 *   console.log("New user:", user.name);
 * });
 * ```
 */
export interface AppEvents {
	// Auth events
	"user:created": { user: any; ctx?: any };
	"user:updated": { user: any; ctx?: any };
	"user:deleted": { userId: string | number; ctx?: any };
	"user:logged_in": { user: any; ctx?: any };
	"user:logged_out": { user: any; ctx?: any };

	// Request events
	"request:start": { method: string; path: string; ctx?: any };
	"request:end": { method: string; path: string; status: number; duration: number; ctx?: any };
	"request:error": { method: string; path: string; error: Error; ctx?: any };

	// App events
	"app:ready": void;
	"app:shutdown": void;

	// Custom events (extensible)
	[key: string]: any;
}

export const emitter = new EventEmitter<AppEvents>();
