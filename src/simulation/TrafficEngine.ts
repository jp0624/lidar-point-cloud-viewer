// src/simulation/TrafficEngine.ts

export type EntityType = "Car" | "Truck" | "Bicycle" | "Pedestrian";

export interface Entity {
	id: string;
	type: EntityType;
	position: [number, number, number];
	dir: [number, number, number];
	speed: number;
	active: boolean;
	pathId: number; // -1 for pedestrians, 0..7 car/truck lanes, 0..3 bike lanes (separate arrays)
	progress: number; // 0..1 along path
	scale: [number, number, number];
	color: number;
}

export interface SpawnOptions {
	type?: EntityType;
	pathId?: number;
	speed?: number;
}

// ------------ SHARED GEOMETRY CONSTANTS (keep in sync with IntersectionScene) ------------
const ROAD_WIDTH = 6; // 4 lanes total (1.5 per lane)
const BIKE_LANE_W = 1.2;
const SIDEWALK_W = 1.5;
const WORLD_EXTENT = 20;
const INTERSECTION_SIZE = 8; // +/-4 around center (used for stop lines)

// Derived offsets
const HALF_ROAD = ROAD_WIDTH / 2; // 3
const BIKE_LANE_OFFSET = HALF_ROAD + BIKE_LANE_W / 2; // 3.6
const SIDEWALK_OFFSET = HALF_ROAD + BIKE_LANE_W + SIDEWALK_W / 2; // 4.95 ≈ 5

// Simple id generator
const makeId = () => Math.random().toString(36).slice(2, 9);

// ---------------------------------
// CAR/TRUCK LANE PATHS (8 lanes)
// ---------------------------------
// Lane centers for motor vehicles (inside the ROAD_WIDTH)
const LANE_OFFSETS = [-1.5, -0.5, 0.5, 1.5];

// PATHS: 8 lane paths (2 per direction per side)
// 0,1 = NS (south -> north) lanes
// 2,3 = SN (north -> south) lanes
// 4,5 = WE (west -> east) lanes
// 6,7 = EW (east -> west) lanes
export const PATHS: Array<[number, number, number][]> = [
	// NS lanes (south to north, z: -WORLD_EXTENT -> +WORLD_EXTENT)
	[
		[LANE_OFFSETS[0], 0, -WORLD_EXTENT],
		[LANE_OFFSETS[0], 0, WORLD_EXTENT],
	],
	[
		[LANE_OFFSETS[1], 0, -WORLD_EXTENT],
		[LANE_OFFSETS[1], 0, WORLD_EXTENT],
	],

	// SN lanes (north to south, z: +WORLD_EXTENT -> -WORLD_EXTENT)
	[
		[LANE_OFFSETS[2], 0, WORLD_EXTENT],
		[LANE_OFFSETS[2], 0, -WORLD_EXTENT],
	],
	[
		[LANE_OFFSETS[3], 0, WORLD_EXTENT],
		[LANE_OFFSETS[3], 0, -WORLD_EXTENT],
	],

	// WE lanes (west to east, x: -WORLD_EXTENT -> +WORLD_EXTENT)
	[
		[-WORLD_EXTENT, 0, LANE_OFFSETS[2]],
		[WORLD_EXTENT, 0, LANE_OFFSETS[2]],
	],
	[
		[-WORLD_EXTENT, 0, LANE_OFFSETS[3]],
		[WORLD_EXTENT, 0, LANE_OFFSETS[3]],
	],

	// EW lanes (east to west, x: +WORLD_EXTENT -> -WORLD_EXTENT)
	[
		[WORLD_EXTENT, 0, LANE_OFFSETS[0]],
		[-WORLD_EXTENT, 0, LANE_OFFSETS[0]],
	],
	[
		[WORLD_EXTENT, 0, LANE_OFFSETS[1]],
		[-WORLD_EXTENT, 0, LANE_OFFSETS[1]],
	],
];

// ---------------------------------
// BICYCLE PATHS (only on green lanes)
// ---------------------------------
// 4 dedicated bike paths that line up with the green strips in IntersectionScene
// 0,1 = vertical (NS/SN) on ±BIKE_LANE_OFFSET (x)
// 2,3 = horizontal (WE/EW) on ±BIKE_LANE_OFFSET (z)
const BIKE_PATHS: Array<[number, number, number][]> = [
	// Vertical bike northbound (x = +BIKE_LANE_OFFSET, z: -WORLD_EXTENT -> +WORLD_EXTENT)
	[
		[BIKE_LANE_OFFSET, 0, -WORLD_EXTENT],
		[BIKE_LANE_OFFSET, 0, WORLD_EXTENT],
	],
	// Vertical bike southbound (x = -BIKE_LANE_OFFSET, z: +WORLD_EXTENT -> -WORLD_EXTENT)
	[
		[-BIKE_LANE_OFFSET, 0, WORLD_EXTENT],
		[-BIKE_LANE_OFFSET, 0, -WORLD_EXTENT],
	],

	// Horizontal bike eastbound (z = +BIKE_LANE_OFFSET, x: -WORLD_EXTENT -> +WORLD_EXTENT)
	[
		[-WORLD_EXTENT, 0, BIKE_LANE_OFFSET],
		[WORLD_EXTENT, 0, BIKE_LANE_OFFSET],
	],
	// Horizontal bike westbound (z = -BIKE_LANE_OFFSET, x: +WORLD_EXTENT -> -WORLD_EXTENT)
	[
		[WORLD_EXTENT, 0, -BIKE_LANE_OFFSET],
		[-WORLD_EXTENT, 0, -BIKE_LANE_OFFSET],
	],
];

// ---------------------------------
// VISUAL SCALES
// ---------------------------------
const SCALES: Record<EntityType, [number, number, number]> = {
	// width (x), height (y), length (z)
	Car: [1.2, 0.6, 2.4], // long low box
	Truck: [1.2, 1.2, 4.0], // taller & longer
	Bicycle: [0.4, 0.6, 1.2], // narrow & short
	Pedestrian: [0.4, 1.7, 0.4], // tall thin
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
	private minSpacing = 0.08; // minimum Δprogress between same-lane actors

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

	// --------- PATH HELPERS ---------
	private pointOnCarPath(
		pathId: number,
		progress: number
	): [number, number, number] {
		const [a, b] = PATHS[pathId];
		const x = a[0] + (b[0] - a[0]) * progress;
		const y = a[1] + (b[1] - a[1]) * progress;
		const z = a[2] + (b[2] - a[2]) * progress;
		return [x, y, z];
	}

	private tangentOnCarPath(pathId: number): [number, number, number] {
		const [a, b] = PATHS[pathId];
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const dz = b[2] - a[2];
		const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
		return [dx / len, dy / len, dz / len];
	}

	private pointOnBikePath(
		pathId: number,
		progress: number
	): [number, number, number] {
		const [a, b] = BIKE_PATHS[pathId];
		const x = a[0] + (b[0] - a[0]) * progress;
		const y = a[1] + (b[1] - a[1]) * progress;
		const z = a[2] + (b[2] - a[2]) * progress;
		return [x, y, z];
	}

	private tangentOnBikePath(pathId: number): [number, number, number] {
		const [a, b] = BIKE_PATHS[pathId];
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const dz = b[2] - a[2];
		const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
		return [dx / len, dy / len, dz / len];
	}

	// --------- SPAWN LOGIC ---------
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
			// Walkers on sidewalks: 4 simple sidewalks at ±SIDEWALK_OFFSET
			// They move along one axis and bounce at WORLD_EXTENT.
			const side = Math.floor(Math.random() * 4); // 0=N,1=E,2=S,3=W

			let pos: [number, number, number];
			let dir: [number, number, number];

			switch (side) {
				case 0: // North sidewalk: along +z (~ +SIDEWALK_OFFSET)
					pos = [-WORLD_EXTENT, 0, SIDEWALK_OFFSET];
					dir = [1, 0, 0]; // left -> right
					break;
				case 1: // East sidewalk: along +x (~ +SIDEWALK_OFFSET)
					pos = [SIDEWALK_OFFSET, 0, WORLD_EXTENT];
					dir = [0, 0, -1]; // top -> bottom
					break;
				case 2: // South sidewalk: along -z (~ -SIDEWALK_OFFSET)
					pos = [WORLD_EXTENT, 0, -SIDEWALK_OFFSET];
					dir = [-1, 0, 0]; // right -> left
					break;
				default: // 3: West sidewalk
					pos = [-SIDEWALK_OFFSET, 0, -WORLD_EXTENT];
					dir = [0, 0, 1]; // bottom -> top
					break;
			}

			slot.pathId = -1; // non-lane
			slot.progress = 0;
			slot.position = pos;
			slot.dir = dir;
		} else if (type === "Bicycle") {
			// Bicycles ONLY on bike lanes (green strips).
			const bikePathId =
				opts.pathId ?? Math.floor(Math.random() * BIKE_PATHS.length);
			const progress = Math.random(); // spread them along the lane

			slot.pathId = bikePathId;
			slot.progress = progress;
			slot.position = this.pointOnBikePath(bikePathId, progress);
			slot.dir = this.tangentOnBikePath(bikePathId);
		} else {
			// Cars and Trucks: 8 lane paths
			const pathId =
				opts.pathId ??
				(() => {
					const carTruckLanes = [0, 1, 2, 3, 4, 5, 6, 7];
					return carTruckLanes[
						Math.floor(Math.random() * carTruckLanes.length)
					];
				})();

			const progress = Math.random(); // spread them along the lane

			slot.pathId = pathId;
			slot.progress = progress;
			slot.position = this.pointOnCarPath(pathId, progress);
			slot.dir = this.tangentOnCarPath(pathId);
		}

		slot.active = true;
		return slot.id;
	}

	despawn(id: string) {
		const e = this.entities.find((x) => x.id === id);
		if (!e) return;
		e.active = false;
	}

	// --------- UPDATE ---------
	update(dt: number, trafficLights?: { NS: boolean; EW: boolean }) {
		// Intersection thresholds (world space, same as IntersectionScene)
		const STOP_WORLD = INTERSECTION_SIZE / 2; // 4
		const pathLength = WORLD_EXTENT * 2; // for normalized progress step

		// 1) Cars & Trucks on lane PATHS
		for (let lane = 0; lane < PATHS.length; lane++) {
			const onLane = this.entities
				.filter(
					(e) =>
						e.active &&
						e.pathId === lane &&
						(e.type === "Car" || e.type === "Truck")
				)
				.sort((a, b) => a.progress - b.progress);

			for (const ent of onLane) {
				const speed = ent.speed || SPEEDS[ent.type];
				if (speed <= 0) continue;

				let next = ent.progress + (speed * dt) / pathLength;

				const isNSLane = lane < 4; // 0..3 = NS/SN, 4..7 = WE/EW
				const lightIsGreen = isNSLane
					? trafficLights?.NS ?? true
					: trafficLights?.EW ?? true;

				// world position BEFORE movement
				const [x, , z] = ent.position;

				if (isNSLane) {
					const nextZ = z + ent.dir[2] * speed * dt;

					if (
						!lightIsGreen &&
						Math.abs(z) > STOP_WORLD && // outside the intersection now
						Math.abs(nextZ) <= STOP_WORLD // would cross into center
					) {
						// stop right at the stop line
						next = ent.progress;
					}
				} else {
					const nextX = x + ent.dir[0] * speed * dt;

					if (
						!lightIsGreen &&
						Math.abs(x) > STOP_WORLD &&
						Math.abs(nextX) <= STOP_WORLD
					) {
						next = ent.progress;
					}
				}

				// Enforce spacing on this lane
				const ahead = onLane.find((v) => v.progress > ent.progress);
				if (ahead && ahead.progress - next < this.minSpacing) {
					next = Math.max(ent.progress, ahead.progress - this.minSpacing);
				}

				// Wrap around lane
				if (next > 1) next -= 1;

				ent.progress = next;
				ent.position = this.pointOnCarPath(lane, next);
				ent.dir = this.tangentOnCarPath(lane);
			}
		}

		// 2) Bicycles on BIKE_PATHS (obey same lights, but on BIKE_LANE offsets)
		for (let bikeLane = 0; bikeLane < BIKE_PATHS.length; bikeLane++) {
			const onBikeLane = this.entities
				.filter(
					(e) => e.active && e.type === "Bicycle" && e.pathId === bikeLane
				)
				.sort((a, b) => a.progress - b.progress);

			for (const ent of onBikeLane) {
				const speed = ent.speed || SPEEDS.Bicycle;
				if (speed <= 0) continue;

				let next = ent.progress + (speed * dt) / pathLength;

				const isVertical = bikeLane < 2; // 0,1 vertical; 2,3 horizontal
				const lightIsGreen = isVertical
					? trafficLights?.NS ?? true
					: trafficLights?.EW ?? true;

				const [x, , z] = ent.position;

				if (isVertical) {
					const nextZ = z + ent.dir[2] * speed * dt;

					if (
						!lightIsGreen &&
						Math.abs(z) > STOP_WORLD &&
						Math.abs(nextZ) <= STOP_WORLD
					) {
						next = ent.progress;
					}
				} else {
					const nextX = x + ent.dir[0] * speed * dt;

					if (
						!lightIsGreen &&
						Math.abs(x) > STOP_WORLD &&
						Math.abs(nextX) <= STOP_WORLD
					) {
						next = ent.progress;
					}
				}

				// Spacing between bikes on same lane
				const ahead = onBikeLane.find((v) => v.progress > ent.progress);
				if (ahead && ahead.progress - next < this.minSpacing) {
					next = Math.max(ent.progress, ahead.progress - this.minSpacing);
				}

				if (next > 1) next -= 1;

				ent.progress = next;
				ent.position = this.pointOnBikePath(bikeLane, next);
				ent.dir = this.tangentOnBikePath(bikeLane);
			}
		}

		// 3) Pedestrians: walk on sidewalks at ±SIDEWALK_OFFSET and bounce at WORLD_EXTENT
		for (const ent of this.entities) {
			if (!ent.active || ent.type !== "Pedestrian") continue;

			const speed = ent.speed || SPEEDS.Pedestrian;
			const step = speed * dt;

			let [x, y, z] = ent.position;
			const [dx, , dz] = ent.dir;

			x += dx * step;
			z += dz * step;

			// Simple bounding box for sidewalks
			const limit = WORLD_EXTENT;

			if (x > limit || x < -limit || z > limit || z < -limit) {
				// flip direction
				ent.dir = [-dx, 0, -dz];
			} else {
				ent.position = [x, y, z];
			}
		}
	}
}
