import { globalLayer } from "@vanilla-extract/css";

/**
 * CSS Cascade Layers for Next.js + Vanilla Extract
 *
 * Layer priority (lowest to highest):
 * 1. reset - CSS reset styles
 * 2. base - Base theme variables and global styles
 * 3. utilities - Utility classes
 * 4. components - Component-specific styles (highest priority)
 *
 * This solves the CSS ordering issue in Next.js where production builds
 * may load CSS in an unpredictable order.
 */

// Define layers in order of increasing priority
export const resetLayer = globalLayer("reset");
export const baseLayer = globalLayer("base");
export const utilitiesLayer = globalLayer("utilities");
export const componentsLayer = globalLayer("components");
