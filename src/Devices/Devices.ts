/**
 * Generates a standard device id.
 *
 * ```js
 * const id = Device.generateId("12:34:56:78:90", "Fan");
 * ```
 *
 * @param id The current connection id, typically a mac address.
 * @param suffix The suffix for the id, typically fan, uplight, downlight...
 *
 * @returns A standard formatted id string.
 * @private
 */
export function generateId(id: string): string {
    return `KUMO-${id}`;
}
