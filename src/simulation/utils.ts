import type { Entity } from "./TrafficEngine";

export function computeLidarPoints(objects: Entity[]): Float32Array {
	const pts: number[] = [];
	// The original logic simply scatters points around the center of the entity.
	// We keep this behavior but ensure we only process active objects.
	for (const obj of objects) {
		if (!obj.active) continue;
		for (let i = 0; i < 40; i++) {
			pts.push(
				obj.position[0] + (Math.random() - 0.5) * 0.8,
				obj.position[1] + (Math.random() - 0.5) * 0.2 + obj.scale[1] * 5, // Add height offset
				obj.position[2] + (Math.random() - 0.5) * 0.8
			);
		}
	}
	return new Float32Array(pts);
}
