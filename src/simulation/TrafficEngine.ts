// ------------------------------------------------------------
// TrafficEngine.ts  (FULL UPDATED VERSION)
// ------------------------------------------------------------

export type EntityType = "Car" | "Truck" | "Bicycle" | "Pedestrian";

export interface Entity {
	id: string;
	type: EntityType;
	position: [number, number, number];
	dir: [number, number, number];
	speed: number;
	active: boolean;
	pathId: number;
	progress: number;
	scale: [number, number, number];
	color: number;
}

export interface SpawnOptions {
	type?: EntityType;
	pathId?: number;
	speed?: number;
}

// ID generator
const makeId = () => Math.random().toString(36).slice(2, 9);

// ----------------------------------------------
// SHARED WORLD CONSTANTS (Matches IntersectionScene)
// ----------------------------------------------
export const ROAD_EXTENT = 20;
export const INTERSECTION_SIZE = 8; // center square +/-4
const STOP_LINE = INTERSECTION_SIZE / 2; // 4.0

const LANE_OFFSETS = [-1.5, -0.5, 0.5, 1.5];

// ----------------------------------------------
// PATH DEFINITIONS (8 lanes total)
// ----------------------------------------------
export const PATHS: Array<[number, number, number][]> = [
	// NS (south → north)
	[
		[LANE_OFFSETS[0], 0, -ROAD_EXTENT],
		[LANE_OFFSETS[0], 0, ROAD_EXTENT],
	],
	[
		[LANE_OFFSETS[1], 0, -ROAD_EXTENT],
		[LANE_OFFSETS[1], 0, ROAD_EXTENT],
	],

	// SN (north → south)
	[
		[LANE_OFFSETS[2], 0, ROAD_EXTENT],
		[LANE_OFFSETS[2], 0, -ROAD_EXTENT],
	],
	[
		[LANE_OFFSETS[3], 0, ROAD_EXTENT],
		[LANE_OFFSETS[3], 0, -ROAD_EXTENT],
	],

	// WE (west → east)
	[
		[-ROAD_EXTENT, 0, LANE_OFFSETS[2]],
		[ROAD_EXTENT, 0, LANE_OFFSETS[2]],
	],
	[
		[-ROAD_EXTENT, 0, LANE_OFFSETS[3]],
		[ROAD_EXTENT, 0, LANE_OFFSETS[3]],
	],

	// EW (east → west)
	[
		[ROAD_EXTENT, 0, LANE_OFFSETS[0]],
		[-ROAD_EXTENT, 0, LANE_OFFSETS[0]],
	],
	[
		[ROAD_EXTENT, 0, LANE_OFFSETS[1]],
		[-ROAD_EXTENT, 0, LANE_OFFSETS[1]],
	],
];

// ----------------------------------------------
// Visual Size Scaling
// ----------------------------------------------
const SCALES: Record<EntityType, [number, number, number]> = {
	Car: [1.2, 0.6, 2.4],
	Truck: [1.2, 1.2, 4.0],
	Bicycle: [0.4, 0.6, 1.2],
	Pedestrian: [0.4, 1.7, 0.4],
};

const SPEEDS: Record<EntityType, number> = {
	Car: 8,
	Truck: 6,
	Bicycle: 7,
	Pedestrian: 2,
};

// ------------------------------------------------------------
// TrafficEngine
// ------------------------------------------------------------
export class TrafficEngine {
	private entities: Entity[] = [];
	private maxEntities: number;
	private minSpacing = 0.06;

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

	// --------------------------------------------
	// Path math helpers
	// --------------------------------------------
	private pointOnPath(pathId: number, progress: number) {
		const [a, b] = PATHS[pathId];
		return [
			a[0] + (b[0] - a[0]) * progress,
			0,
			a[2] + (b[2] - a[2]) * progress,
		] as [number, number, number];
	}

	private tangentOnPath(pathId: number) {
		const [a, b] = PATHS[pathId];
		const dx = b[0] - a[0];
		const dz = b[2] - a[2];
		const len = Math.sqrt(dx * dx + dz * dz) || 1;
		return [dx / len, 0, dz / len] as [number, number, number];
	}

	// --------------------------------------------
	// SPAWN
	// --------------------------------------------
	spawn(opts: SpawnOptions = {}): string | null {
		const slot = this.entities.find((e) => !e.active);
		if (!slot) return null;

		const type = opts.type ?? "Car";
		slot.id = makeId();
		slot.type = type;
		slot.scale = SCALES[type];
		slot.color = Math.floor(Math.random() * 5);
		slot.speed = opts.speed ?? SPEEDS[type];

		// ----------------------------------------
		// PEDESTRIANS
		// ----------------------------------------
		if (type === "Pedestrian") {
			const side = Math.floor(Math.random() * 4);
			const offset = ROAD_EXTENT - 2;

			let pos: [number, number, number];
			let dir: [number, number, number];

			switch (side) {
				case 0:
					pos = [-offset, 0, 10];
					dir = [1, 0, 0];
					break;
				case 1:
					pos = [10, 0, offset];
					dir = [0, 0, -1];
					break;
				case 2:
					pos = [offset, 0, -10];
					dir = [-1, 0, 0];
					break;
				default:
					pos = [-10, 0, -offset];
					dir = [0, 0, 1];
					break;
			}

			slot.active = true;
			slot.pathId = -1;
			slot.position = pos;
			slot.dir = dir;
			slot.progress = 0;
			return slot.id;
		}

		// ----------------------------------------
		// VEHICLES + BIKES
		// ----------------------------------------
		const pathId = opts.pathId ?? Math.floor(Math.random() * PATHS.length);

		slot.pathId = pathId;
		slot.progress = Math.random();
		slot.position = this.pointOnPath(pathId, slot.progress);
		slot.dir = this.tangentOnPath(pathId);
		slot.active = true;

		return slot.id;
	}

	// --------------------------------------------
	// UPDATE
	// --------------------------------------------
	update(dt: number, lights?: { NS: boolean; EW: boolean }) {
		for (let lane = 0; lane < PATHS.length; lane++) {
			const laneVehicles = this.entities
				.filter((e) => e.active && e.pathId === lane && e.type !== "Pedestrian")
				.sort((a, b) => a.progress - b.progress);

			for (const ent of laneVehicles) {
				const speed = ent.speed || SPEEDS[ent.type];
				const delta = (speed * dt) / (ROAD_EXTENT * 2);
				let next = ent.progress + delta;

				const isNS = lane < 4;
				const green = isNS ? lights?.NS ?? true : lights?.EW ?? true;

				const [wx, , wz] = ent.position;

				if (!green) {
					// STOP NS/SN
					if (isNS) {
						const nextZ = wz + ent.dir[2] * speed * dt;
						if (Math.abs(wz) > STOP_LINE && Math.abs(nextZ) <= STOP_LINE) {
							next = ent.progress;
						}
					}

					// STOP WE/EW
					else {
						const nextX = wx + ent.dir[0] * speed * dt;
						if (Math.abs(wx) > STOP_LINE && Math.abs(nextX) <= STOP_LINE) {
							next = ent.progress;
						}
					}
				}

				// Vehicle spacing
				const ahead = laneVehicles.find((v) => v.progress > ent.progress);
				if (ahead && ahead.progress - next < this.minSpacing) {
					next = Math.max(ent.progress, ahead.progress - this.minSpacing);
				}

				if (next > 1) next -= 1;

				ent.progress = next;
				ent.position = this.pointOnPath(lane, next);
				ent.dir = this.tangentOnPath(lane);
			}
		}

		// ----------------------------------------
		// PEDESTRIANS
		// ----------------------------------------
		for (const ent of this.entities) {
			if (!ent.active || ent.type !== "Pedestrian") continue;

			const dx = ent.dir[0];
			const dz = ent.dir[2];
			const step = ent.speed * dt;

			let [x, y, z] = ent.position;
			x += dx * step;
			z += dz * step;

			const limit = ROAD_EXTENT + 2;
			if (x > limit || x < -limit || z > limit || z < -limit) {
				ent.dir = [-dx, 0, -dz];
			} else {
				ent.position = [x, y, z];
			}
		}
	}
}
