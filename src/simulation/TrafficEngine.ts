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

// Random ID generator
const makeId = () => Math.random().toString(36).slice(2, 9);

// Paths: NS, SN, WE, EW
export const PATHS: Array<[number, number, number][]> = [
	[
		[0.5, 0, -10],
		[0.5, 0, 10],
	], // NS (Northbound lane)
	[
		[-0.5, 0, 10],
		[-0.5, 0, -10],
	], // SN (Southbound lane)
	[
		[-10, 0, 0.5],
		[10, 0, 0.5],
	], // WE (Eastbound lane)
	[
		[10, 0, -0.5],
		[-10, 0, -0.5],
	], // EW (Westbound lane)
];

const SCALES: Record<EntityType, [number, number, number]> = {
	Car: [0.35, 0.08, 0.18],
	Truck: [0.5, 0.12, 0.25],
	Bicycle: [0.15, 0.06, 0.18],
	Pedestrian: [0.08, 0.14, 0.08],
};

const SPEEDS: Record<EntityType, number> = {
	Car: 0.6,
	Truck: 0.45,
	Bicycle: 0.8,
	Pedestrian: 0.25,
};

export class TrafficEngine {
	private entities: Entity[] = [];
	private maxEntities: number;
	private minSpacing = 0.5;

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

	getActiveEntities() {
		return this.entities.filter((e) => e.active);
	}

	// --- MODIFIED: Fixed default type to be random, not just "Car" ---
	spawn(opts: SpawnOptions = {}): string | null {
		const slot = this.entities.find((e) => !e.active);
		if (!slot) return null;

		const possibleTypes: EntityType[] = [
			"Car",
			"Truck",
			"Bicycle",
			"Pedestrian",
		];
		const randomType =
			possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
		const type = opts.type ?? randomType;

		const pathId = opts.pathId ?? Math.floor(Math.random() * PATHS.length);
		const speed = SPEEDS[type] * (0.9 + Math.random() * 0.2);

		slot.id = makeId();
		slot.type = type;
		slot.pathId = pathId;
		slot.progress = 0;
		slot.speed = speed;
		slot.scale = SCALES[type];
		slot.color = Math.floor(Math.random() * 5);
		slot.active = true;
		slot.position = this.pointOnPath(pathId, 0);
		slot.dir = this.tangentOnPath(pathId);

		return slot.id;
	}
	// --- END MODIFIED ---

	despawn(id: string) {
		const e = this.entities.find((x) => x.id === id);
		if (!e) return;
		e.active = false;
	}

	pointOnPath(pathId: number, progress: number): [number, number, number] {
		const [a, b] = PATHS[pathId];
		const x = a[0] + (b[0] - a[0]) * progress;
		const y = a[1] + (b[1] - a[1]) * progress;
		const z = a[2] + (b[2] - a[2]) * progress;
		return [x, y, z];
	}

	tangentOnPath(pathId: number): [number, number, number] {
		const [a, b] = PATHS[pathId];
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const dz = b[2] - a[2];
		const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
		return [dx / len, dy / len, dz / len];
	}

	update(dt: number, trafficLights?: { NS: boolean; EW: boolean }) {
		for (let pathId = 0; pathId < PATHS.length; pathId++) {
			const onPath = this.entities
				.filter((e) => e.active && e.pathId === pathId)
				.sort((a, b) => a.progress - b.progress);

			for (const ent of onPath) {
				let newProgress = ent.progress + (ent.speed * dt) / 2.0;

				const pathIsNS = pathId < 2;
				const lightIsGreen = pathIsNS
					? trafficLights?.NS ?? true
					: trafficLights?.EW ?? true;

				// Simplified stop logic at the intersection (0.45 progress)
				if (!lightIsGreen && ent.progress < 0.45 && newProgress >= 0.45) {
					newProgress = ent.progress;
				}

				if (newProgress > 1) {
					// Despawn/reset entity when it exits the scene (progress > 1)
					if (ent.type === "Pedestrian" || ent.type === "Bicycle") {
						ent.active = false; // Simple despawn for non-cars
						continue;
					}
					newProgress = 0; // Loop cars/trucks
				}

				const ahead = onPath.find(
					(o) => o.progress > ent.progress && o.id !== ent.id
				);
				if (ahead && ahead.progress - newProgress < this.minSpacing)
					newProgress = ahead.progress - this.minSpacing;

				ent.progress = newProgress;
				ent.position = this.pointOnPath(pathId, newProgress);
				ent.dir = this.tangentOnPath(pathId);

				// Old despawn logic was confusing, removed from here
			}
		}
	}

	// --- NEW HELPER METHODS ---
	getMaxEntities() {
		return this.maxEntities;
	}

	reset() {
		this.entities.forEach((e) => (e.active = false));
	}
	// --- END NEW HELPER METHODS ---

	// populate() has been simplified/modified and is now handled primarily by useTrafficSimulation hook.
	populate(n = 10) {
		for (let i = 0; i < n; i++) this.spawn();
	}

	getPool() {
		return this.entities;
	}
}
