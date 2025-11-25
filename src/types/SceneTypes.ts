export const POINT_COUNT = 100_000;

export interface SimConfig {
	trafficDensity: number;
	speedMultiplier: number;
	pedestrianEnabled: boolean;
	bicycleEnabled: boolean;
	lidarEnabled: boolean;
}

export type EntityType =
	| "Car"
	| "Truck"
	| "Pedestrian"
	| "Bicycle"
	| "Road"
	| "Sidewalk";

export interface PointData {
	position: [number, number, number];
	intensity: number;
}

export const OBJECT_TEMPLATES: Record<
	EntityType,
	{
		scale: [number, number, number];
		intensity: number;
		speed: number;
		pointRatio: number;
	}
> = {
	Road: { scale: [1.2, 0.01, 1.2], intensity: 0.1, speed: 0, pointRatio: 0.4 },
	Sidewalk: {
		scale: [0.1, 0.03, 1.2],
		intensity: 0.2,
		speed: 0,
		pointRatio: 0.2,
	},
	Car: { scale: [0.4, 0.08, 0.2], intensity: 0.8, speed: 0.6, pointRatio: 0.1 },
	Truck: {
		scale: [0.5, 0.12, 0.25],
		intensity: 0.9,
		speed: 0.45,
		pointRatio: 0.1,
	},
	Pedestrian: {
		scale: [0.1, 0.1, 0.1],
		intensity: 1.0,
		speed: 0.25,
		pointRatio: 0.05,
	},
	Bicycle: {
		scale: [0.15, 0.1, 0.1],
		intensity: 0.9,
		speed: 0.8,
		pointRatio: 0.05,
	},
};
