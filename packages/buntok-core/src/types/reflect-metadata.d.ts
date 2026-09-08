/**
 * Type declarations for Reflect.getMetadata / Reflect.defineMetadata.
 * These are provided by `reflect-metadata` at runtime.
 * This declaration allows the container's `scan()` method to use them
 * without requiring `reflect-metadata` as a hard dependency.
 */
declare namespace Reflect {
	function getMetadata(metadataKey: any, target: any): any;
	function defineMetadata(metadataKey: any, metadataValue: any, target: any): void;
}
