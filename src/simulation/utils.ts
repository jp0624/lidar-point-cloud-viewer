// src/simulation/utils.ts
import type { Entity } from "./TrafficEngine";

// Keep last frame's LIDAR points for simple Kalman-style smoothing
let lastPoints: Float32Array | null = null;

// Box-Muller transform for Gaussian noise
function gaussianNoise(mean = 0, stdDev = 1): number {
	let u = 0,
		v = 0;
	while (u === 0) u = Math.random();
	while (v === 0) v = Math.random();
	const mag = Math.sqrt(-2.0 * Math.log(u));
	const z0 = mag * Math.cos(2.0 * Math.PI * v);
	return z0 * stdDev + mean;
}

/**
 * Compute LIDAR points from entities, with noise + simple Kalman-like filter.
 * - Each moving entity gets a small cluster of points within its bounding box.
 * - Noise is added to each coordinate.
 * - Then we apply an exponential smoothing vs the previous frame.
 */
export function computeLidarPoints(entities: Entity[]): Float32Array {
	const dynamic = entities.filter((e) => e.active); // assume caller filters out road/sidewalk if needed

	if (!dynamic.length) {
		lastPoints = null;
		return new Float32Array();
	}

	const POINTS_PER_ENTITY = 80;
	const totalPoints = dynamic.length * POINTS_PER_ENTITY;
	const data = new Float32Array(totalPoints * 3);

	let idx = 0;

	for (const e of dynamic) {
		const [cx, cy, cz] = e.position;
		const [sx, sy, sz] = e.scale;

		for (let i = 0; i < POINTS_PER_ENTITY; i++) {
			const px = cx + (Math.random() - 0.5) * sx + gaussianNoise(0, sx * 0.05);
			const py = cy + (Math.random() - 0.5) * sy + gaussianNoise(0, sy * 0.05);
			const pz = cz + (Math.random() - 0.5) * sz + gaussianNoise(0, sz * 0.05);

			data[idx * 3 + 0] = px;
			data[idx * 3 + 1] = py;
			data[idx * 3 + 2] = pz;
			idx++;
		}
	}

	// Simple Kalman-like (exponential) smoothing
	if (lastPoints && lastPoints.length === data.length) {
		const alpha = 0.8; // prior weight
		for (let i = 0; i < data.length; i++) {
			data[i] = alpha * lastPoints[i] + (1 - alpha) * data[i];
		}
	}

	lastPoints = data;
	return data;
}
