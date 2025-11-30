// src/simulation/TrafficEngine.ts

export type EntityType = "Car" | "Truck" | "Bicycle" | "Pedestrian";

export interface Entity {
	id: string;
	type: EntityType;
	position: [number, number, number];
	dir: [number, number, number];
	speed: number;
	active: boolean;
	pathId: number; // 0..7 for lane-based traffic, -1 for pedestrians (sidewalk-based)
	progress: number; // 0..1 along lane path (for lane-based entities)
	scale: [number, number, number];
	color: number;
}

// Extra metadata only used internally (not strictly required elsewhere)
type PedAxis = "NS" | "EW";

export interface SpawnOptions {
	type?: EntityType;
	pathId?: number;
	speed?: number;
}

// Simple id generator
const makeId = () => Math.random().toString(36).slice(2, 9);

// Geometry assumptions (match IntersectionScene roughly)
const ROAD_EXTENT = 20; // lane endpoints from -20 to +20
const INTERSECTION_SIZE = 8; // center square is approx -4..+4

// Lane center offsets (4 lanes per axis)
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

// Visual size of each base type (world-space)
const BASE_SCALES: Record<EntityType, [number, number, number]> = {
	// width (x), height (y), length (z)
	Car: [1.2, 0.6, 2.4], // long low box
	Truck: [1.2, 1.2, 4.0], // taller & longer
	Bicycle: [0.4, 0.6, 1.2], // narrow & short
	Pedestrian: [0.4, 1.7, 0.4], // tall thin cylinder/box
};

// Base speeds (world units per second)
const BASE_SPEEDS: Record<EntityType, number> = {
	Car: 8.0,
	Truck: 6.0,
	Bicycle: 7.0,
	Pedestrian: 2.0,
};

export class TrafficEngine {
	private entities: Entity[] = [];
	private maxEntities: number;
	private minSpacing = 0.06; // minimum Δprogress along lane between vehicles

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
				scale: BASE_SCALES.Car,
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

	/**
	 * Slight variation in vehicle scale for visual variety.
	 * - Cars => sedan / SUV
	 * - Trucks => semi / smaller box truck
	 */
	private getVariantScale(type: EntityType): [number, number, number] {
		const base = BASE_SCALES[type];

		if (type === "Car") {
			const sedan = Math.random() < 0.5;
			if (sedan) {
				// Slightly lower, shorter
				return [base[0] * 0.9, base[1] * 0.9, base[2] * 0.9];
			}
			// SUV: a bit wider, taller
			return [base[0] * 1.1, base[1] * 1.1, base[2] * 1.05];
		}

		if (type === "Truck") {
			const semi = Math.random() < 0.5;
			if (semi) {
				// Semi: longer
				return [base[0] * 1.0, base[1] * 1.1, base[2] * 1.3];
			}
			// Box truck: slightly shorter, taller
			return [base[0] * 1.1, base[1] * 1.2, base[2] * 0.9];
		}

		// Bikes & pedestrians: tiny random jitter only
		const jitter = 0.1 * (Math.random() - 0.5);
		return [base[0] * (1 + jitter), base[1], base[2] * (1 + jitter)];
	}

	/**
	 * Random vehicle speed with +/- 20% variation
	 */
	private getVariantSpeed(type: EntityType, override?: number): number {
		const base = override ?? BASE_SPEEDS[type];
		const factor = 0.8 + Math.random() * 0.4; // 0.8 .. 1.2
		return base * factor;
	}

	spawn(opts: SpawnOptions = {}): string | null {
		const slot = this.entities.find((e) => !e.active);
		if (!slot) return null;

		const type: EntityType = opts.type ?? "Car";

		slot.id = makeId();
		slot.type = type;
		slot.scale = this.getVariantScale(type);
		slot.color = Math.floor(Math.random() * 5);
		slot.speed = this.getVariantSpeed(type, opts.speed);

		// --- PEDESTRIANS: sidewalk-based, no more corner loops ---
		if (type === "Pedestrian") {
			// Choose whether they walk along NS sidewalks or EW sidewalks
			const axis: PedAxis = Math.random() < 0.5 ? "NS" : "EW";

			if (axis === "NS") {
				// Vertical sidewalks: x is approx constant, z varies
				const xSide = Math.random() < 0.5 ? -6.0 : 6.0; // approx sidewalk positions
				const zStart = Math.random() < 0.5 ? -ROAD_EXTENT - 1 : ROAD_EXTENT + 1;
				const dirZ = zStart < 0 ? 1 : -1;

				slot.position = [xSide, 0, zStart];
				slot.dir = [0, 0, dirZ];
			} else {
				// Horizontal sidewalks: z is approx constant, x varies
				const zSide = Math.random() < 0.5 ? -6.0 : 6.0;
				const xStart = Math.random() < 0.5 ? -ROAD_EXTENT - 1 : ROAD_EXTENT + 1;
				const dirX = xStart < 0 ? 1 : -1;

				slot.position = [xStart, 0, zSide];
				slot.dir = [dirX, 0, 0];
			}

			slot.pathId = -1; // not using car lane paths
			slot.progress = 0;
			slot.active = true;
			return slot.id;
		}

		// --- VEHICLES & BICYCLES: lane-based paths ---
		const pathId =
			opts.pathId ??
			(() => {
				// All vehicle types occupy any of the 8 lane paths
				const lanes = [0, 1, 2, 3, 4, 5, 6, 7];
				return lanes[Math.floor(Math.random() * lanes.length)];
			})();

		slot.pathId = pathId;
		slot.progress = Math.random(); // randomize so they don't spawn clumped
		slot.position = this.pointOnPath(pathId, slot.progress);
		slot.dir = this.tangentOnPath(pathId);
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
				.filter(
					(e) => e.active && e.pathId === lane && e.type !== "Pedestrian" // pedestrians are handled separately
				)
				.sort((a, b) => a.progress - b.progress);

			for (const ent of onLane) {
				const speed = ent.speed || BASE_SPEEDS[ent.type];
				if (speed <= 0) continue;

				// Path length (simple straight line)
				const pathLength = ROAD_EXTENT * 2;
				let deltaProgress = (speed * dt) / pathLength;

				let next = ent.progress + deltaProgress;

				const isNSLane = lane < 4; // 0-3 are NS/SN
				const lightIsGreen = isNSLane
					? trafficLights?.NS ?? true
					: trafficLights?.EW ?? true;

				const STOP_WORLD = INTERSECTION_SIZE / 2; // 4

				// Car stopping logic: if light is red and car hasn't entered intersection yet,
				// it should stop exactly at the outer edge of the center square.
				const [x, , z] = ent.position;

				if (isNSLane) {
					const dz = ent.dir[2] * speed * dt;
					const nextZ = z + dz;

					const beforeIntersection = Math.abs(z) > STOP_WORLD;
					const wouldEnterIntersection = Math.abs(nextZ) <= STOP_WORLD + 0.01;

					if (!lightIsGreen && beforeIntersection && wouldEnterIntersection) {
						// Hold position (no progress)
						next = ent.progress;
					}
				} else {
					const dx = ent.dir[0] * speed * dt;
					const nextX = x + dx;

					const beforeIntersection = Math.abs(x) > STOP_WORLD;
					const wouldEnterIntersection = Math.abs(nextX) <= STOP_WORLD + 0.01;

					if (!lightIsGreen && beforeIntersection && wouldEnterIntersection) {
						next = ent.progress;
					}
				}

				// Enforce minimum spacing along lane
				const ahead = onLane.find((v) => v.progress > ent.progress);
				if (ahead && ahead.progress - next < this.minSpacing) {
					next = Math.max(ent.progress, ahead.progress - this.minSpacing);
				}

				// Wrap around at end of lane
				if (next > 1) next -= 1;

				ent.progress = next;
				ent.position = this.pointOnPath(lane, next);
				ent.dir = this.tangentOnPath(lane);
			}
		}

		// 2) Update pedestrians (sidewalk walkers, not looping at corners)
		for (const ent of this.entities) {
			if (!ent.active || ent.type !== "Pedestrian") continue;

			const speed = ent.speed || BASE_SPEEDS.Pedestrian;
			let [x, y, z] = ent.position;
			const [dx, , dz] = ent.dir;

			// Decide which axis they're effectively walking along
			const axis: PedAxis = Math.abs(dz) > Math.abs(dx) ? "NS" : "EW";

			const STOP_WORLD = INTERSECTION_SIZE / 2; // 4
			const isBeforeIntersection =
				axis === "NS" ? Math.abs(z) > STOP_WORLD : Math.abs(x) > STOP_WORLD;

			let nextX = x + dx * speed * dt;
			let nextZ = z + dz * speed * dt;

			const trafficIsWalk =
				axis === "NS" ? trafficLights?.NS ?? true : trafficLights?.EW ?? true;

			// If red and pedestrian is about to enter intersection area, they should wait.
			if (!trafficIsWalk && isBeforeIntersection) {
				// Check if this step would enter the center area
				const willEnter =
					axis === "NS"
						? Math.abs(nextZ) <= STOP_WORLD + 0.01
						: Math.abs(nextX) <= STOP_WORLD + 0.01;

				if (willEnter) {
					// Cancel movement this frame (wait on sidewalk)
					nextX = x;
					nextZ = z;
				}
			}

			// Move
			x = nextX;
			z = nextZ;

			ent.position = [x, y, z];

			// Despawn when far beyond world extents (no infinite cycles)
			const LIMIT = ROAD_EXTENT + 5;
			if (x > LIMIT || x < -LIMIT || z > LIMIT || z < -LIMIT) {
				ent.active = false;
			}
		}
	}
}
