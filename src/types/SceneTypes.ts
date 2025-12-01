// src/types/SceneTypes.ts

// ---- LIDAR RENDERING CONSTANT ----
export const POINT_COUNT = 100_000;

// ---- ENTITY TYPES ----
export type EntityType = "Car" | "Truck" | "Pedestrian" | "Bicycle";

// ---- LIDAR POINT ----
export interface PointData {
	position: [number, number, number];
	intensity: number; // 0..1 normalized brightness
}

// ---- SIMULATION CONFIG ----

/**
 * Manual override for traffic lights.
 * "auto" = follow timer cycle normally.
 * "green", "yellow", "red" = force all directions for debugging.
 */
export type ForcedLightPhase = "auto" | "green" | "yellow" | "red";

/**
 * Configurable parameters injected from UI panel → simulation.
 * All values persist across re-renders and engine updates.
 */
export interface SimConfig {
	/** Global traffic density scalar (0..1), applied to total pool */
	trafficDensity: number;

	/** Ratio sliders for spawn probabilities (0..1 each, normalized internally) */
	carRatio: number;
	truckRatio: number;
	bikeRatio: number;
	pedRatio: number;

	/** Multiplier applied to real-time delta (animation scaling) */
	speedMultiplier: number;

	/** Enable LIDAR point cloud overlay rendering */
	lidarEnabled: boolean;

	/** Override lights for debugging ("auto" recommended during play) */
	forceLightPhase: ForcedLightPhase;
}
