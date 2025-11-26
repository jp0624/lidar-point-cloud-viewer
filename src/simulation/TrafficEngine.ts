// src/simulation/TrafficEngine.ts

export type EntityType = "Car" | "Truck" | "Bicycle" | "Pedestrian";

export interface Entity {
	id: string;
	type: EntityType;
	position: [number, number, number];
	dir: [number, number, number];
	speed: number;
	active: boolean;
	pathId: number; // -1 for pedestrians (non-lane walkers)
	progress: number; // 0..1 along path
	scale: [number, number, number];
	color: number;
}

export interface SpawnOptions {
	type?: EntityType;
	pathId?: number;
	speed?: number;
}

// Simple id generator
const makeId = () => Math.random().toString(36).slice(2, 9);

// Road geometry assumptions (aligned with IntersectionScene)
const ROAD_EXTENT = 20; // road runs from -20 to +20 in X/Z

// Lane center offsets (4 lanes per direction axis)
const LANE_OFFSETS = [-1.5, -0.5, 0.5, 1.5];

// PATHS: 8 lane paths (2 per direction per side)
// 0,1 = NS (south -> north), 2,3 = SN (north -> south)
// 4,5 = WE (west -> east),   6,7 = EW (east -> west)
export const PATHS: Array<[number, number, number][]> = [
	// NS lanes (south to north, z: -20 -> +20)
	[
		[LANE_OFFSETS[0], 0, -ROAD_EXTENT],
		[LANE_OFFSETS[0], 0, ROAD_EXTENT],
	],
	[
		[LANE_OFFSETS[1], 0, -ROAD_EXTENT],
		[LANE_OFFSETS[1], 0, ROAD_EXTENT],
	],

	// SN lanes (north to south, z: +20 -> -20)
	[
		[LANE_OFFSETS[2], 0, ROAD_EXTENT],
		[LANE_OFFSETS[2], 0, -ROAD_EXTENT],
	],
	[
		[LANE_OFFSETS[3], 0, ROAD_EXTENT],
		[LANE_OFFSETS[3], 0, -ROAD_EXTENT],
	],

	// WE lanes (west to east, x: -20 -> +20)
	[
		[-ROAD_EXTENT, 0, LANE_OFFSETS[2]],
		[ROAD_EXTENT, 0, LANE_OFFSETS[2]],
	],
	[
		[-ROAD_EXTENT, 0, LANE_OFFSETS[3]],
		[ROAD_EXTENT, 0, LANE_OFFSETS[3]],
	],

	// EW lanes (east to west, x: +20 -> -20)
	[
		[ROAD_EXTENT, 0, LANE_OFFSETS[0]],
		[-ROAD_EXTENT, 0, LANE_OFFSETS[0]],
	],
	[
		[ROAD_EXTENT, 0, LANE_OFFSETS[1]],
		[-ROAD_EXTENT, 0, LANE_OFFSETS[1]],
	],
];

// Visual size of each type (world-space-ish)
const SCALES: Record<EntityType, [number, number, number]> = {
	// width (x), height (y), length (z)
	Car: [1.2, 0.6, 2.4], // long low box
	Truck: [1.2, 1.2, 4.0], // taller & longer
	Bicycle: [0.4, 0.6, 1.2], // narrow & short
	Pedestrian: [0.4, 1.7, 0.4], // tall thin cylinder/box
};

const SPEEDS: Record<EntityType, number> = {
	Car: 8.0,
	Truck: 6.0,
	Bicycle: 7.0,
	Pedestrian: 2.0,
};

export class TrafficEngine {
	private entities: Entity[] = [];
	private maxEntities: number;
	private minSpacing = 0.06; // minimum Δprogress between vehicles

	constructor(maxEntities = 256) {
		this.maxEntities = maxEntities;

		for (let i = 0; i < maxEntities; i++) {
			this.entities.push({
				id: `pool-${i}`,
				type: "Car",
				position: [0, 0, 0],
				dir: [0, 0, 1],
				speed: 0,
				active: false,
				pathId: 0,
				progress: 0,
				scale: SCALES.Car,
				color: 0,
			});
		}
	}

	getMaxEntities() {
		return this.maxEntities;
	}

	getPool() {
		return this.entities;
	}

	getActiveEntities() {
		return this.entities.filter((e) => e.active);
	}

	reset() {
		for (const e of this.entities) {
			e.active = false;
			e.progress = 0;
			e.speed = 0;
		}
	}

	private pointOnPath(
		pathId: number,
		progress: number
	): [number, number, number] {
		const [a, b] = PATHS[pathId];
		const x = a[0] + (b[0] - a[0]) * progress;
		const y = a[1] + (b[1] - a[1]) * progress;
		const z = a[2] + (b[2] - a[2]) * progress;
		return [x, y, z];
	}

	private tangentOnPath(pathId: number): [number, number, number] {
		const [a, b] = PATHS[pathId];
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const dz = b[2] - a[2];
		const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
		return [dx / len, dy / len, dz / len];
	}

	spawn(opts: SpawnOptions = {}): string | null {
		const slot = this.entities.find((e) => !e.active);
		if (!slot) return null;

		const type: EntityType = opts.type ?? "Car";

		slot.id = makeId();
		slot.type = type;
		slot.scale = SCALES[type];
		slot.color = Math.floor(Math.random() * 5);
		slot.speed = opts.speed ?? SPEEDS[type];

		if (type === "Pedestrian") {
			// Pedestrians walk along sidewalks: a simple loop around the intersection
			const side = Math.floor(Math.random() * 4); // 0=N,1=E,2=S,3=W
			const offset = ROAD_EXTENT - 2; // near edge of road for sidewalk

			let pos: [number, number, number];
			let dir: [number, number, number];

			switch (side) {
				case 0: // North sidewalk: left->right along +z (~+10)
					pos = [-offset, 0, 10];
					dir = [1, 0, 0];
					break;
				case 1: // East sidewalk: top->bottom along +x (~+10)
					pos = [10, 0, offset];
					dir = [0, 0, -1];
					break;
				case 2: // South sidewalk: right->left along -z (~-10)
					pos = [offset, 0, -10];
					dir = [-1, 0, 0];
					break;
				default: // West sidewalk
					pos = [-10, 0, -offset];
					dir = [0, 0, 1];
					break;
			}

			slot.pathId = -1; // non-lane
			slot.progress = 0;
			slot.position = pos;
			slot.dir = dir;
		} else {
			// Cars, trucks, bikes spawn into lane paths
			const pathId =
				opts.pathId ??
				(() => {
					// Cars & trucks mostly on car lanes, bikes can be anywhere but we offset visually
					const carTruckLanes = [0, 1, 2, 3, 4, 5, 6, 7];
					const bikeLanes = [0, 1, 2, 3, 4, 5, 6, 7];
					const pool = type === "Bicycle" ? bikeLanes : carTruckLanes;
					return pool[Math.floor(Math.random() * pool.length)];
				})();

			slot.pathId = pathId;
			slot.progress = Math.random(); // randomize to avoid clumping at spawn
			slot.position = this.pointOnPath(pathId, slot.progress);
			slot.dir = this.tangentOnPath(pathId);
		}

		slot.active = true;
		return slot.id;
	}

	despawn(id: string) {
		const e = this.entities.find((x) => x.id === id);
		if (!e) return;
		e.active = false;
	}

	update(dt: number, trafficLights?: { NS: boolean; EW: boolean }) {
		// 1) Update lane-based entities (cars, trucks, bikes)
		for (let lane = 0; lane < PATHS.length; lane++) {
			const onLane = this.entities
				.filter((e) => e.active && e.pathId === lane && e.type !== "Pedestrian")
				.sort((a, b) => a.progress - b.progress);

			for (const ent of onLane) {
				const speed = ent.speed || SPEEDS[ent.type];
				if (speed <= 0) continue;

				// delta progress based on world speed
				const pathLength = ROAD_EXTENT * 2;
				const deltaProgress = (speed * dt) / pathLength;

				let next = ent.progress + deltaProgress;

				const isNSLane = lane < 4; // 0-3 are NS/SN
				const lightIsGreen = isNSLane
					? trafficLights?.NS ?? true
					: trafficLights?.EW ?? true;

				// Stop BEFORE entering intersection if red:
				// intersection is roughly central; stop around progress ~0.4
				const stopThreshold = 0.4;
				if (!lightIsGreen && ent.progress < stopThreshold) {
					// don't move if still before stop line
					next = ent.progress;
				}

				// Enforce spacing
				const ahead = onLane.find((v) => v.progress > ent.progress);
				if (ahead && ahead.progress - next < this.minSpacing) {
					next = Math.max(ent.progress, ahead.progress - this.minSpacing);
				}

				// Wrap around when finishing lane
				if (next > 1) next -= 1;

				ent.progress = next;
				ent.position = this.pointOnPath(lane, next);
				ent.dir = this.tangentOnPath(lane);
			}
		}

		// 2) Update pedestrians (walkers along sidewalks)
		for (const ent of this.entities) {
			if (!ent.active || ent.type !== "Pedestrian") continue;

			const [dx, , dz] = ent.dir;
			const step = (ent.speed || SPEEDS.Pedestrian) * dt;

			let [x, y, z] = ent.position;
			x += dx * step;
			z += dz * step;

			// Simple bounding box around the outer sidewalks
			const limit = ROAD_EXTENT + 2;
			if (x > limit || x < -limit || z > limit || z < -limit) {
				// loop around: flip direction
				ent.dir = [-dx, 0, -dz];
			} else {
				ent.position = [x, y, z];
			}
		}
	}
}
