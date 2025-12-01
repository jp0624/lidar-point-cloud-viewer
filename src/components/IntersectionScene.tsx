// src/components/IntersectionScene.tsx
import React from "react";
import { useTrafficSimulation } from "../hooks/useTrafficSimulation";
import { Vehicle } from "./Vehicle";
import type { SimConfig } from "../types/SceneTypes";
import type { TrafficEngine } from "../simulation/TrafficEngine";

// Geometry constants (must match TrafficEngine)
const ROAD_WIDTH = 6; // 4 lanes total (1.5 per lane)
const BIKE_LANE_W = 1.2;
const SIDEWALK_W = 1.5;
const WORLD_EXTENT = 20;
const INTERSECTION_SIZE = 8; // +/- 4 around center

interface IntersectionSceneProps {
	engine: TrafficEngine;
	config: SimConfig;
}

/**
 * Convert light phase -> per-lens colors for a 3-light stack.
 * Only the active lens is bright, others are dimmed.
 */
function phaseToLensColors(phase: "green" | "yellow" | "red") {
	const dimRed = "#550000";
	const dimYellow = "#555500";
	const dimGreen = "#005500";

	switch (phase) {
		case "green":
			return { red: dimRed, yellow: dimYellow, green: "#00ff00" };
		case "yellow":
			return { red: dimRed, yellow: "#ffff00", green: dimGreen };
		case "red":
		default:
			return { red: "#ff0000", yellow: dimYellow, green: dimGreen };
	}
}

/**
 * Small helper to render a 3-stage vertical traffic light on a pole.
 * The group is placed at (x,z) and rotated so that it faces incoming traffic.
 */
const TrafficPole: React.FC<{
	x: number;
	z: number;
	phase: "green" | "yellow" | "red";
	rotationY: number;
}> = ({ x, z, phase, rotationY }) => {
	const { red, yellow, green } = phaseToLensColors(phase);

	return (
		<group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
			{/* Pole */}
			<mesh position={[0, 1.2, 0]}>
				<cylinderGeometry args={[0.05, 0.05, 2.4, 12]} />
				<meshStandardMaterial color="#444444" />
			</mesh>

			{/* Light housing */}
			<mesh position={[0, 2.1, 0.25]}>
				<boxGeometry args={[0.35, 0.9, 0.2]} />
				<meshStandardMaterial color="#111111" />
			</mesh>

			{/* Red lens (top) */}
			<mesh position={[0, 2.35, 0.31]}>
				<sphereGeometry args={[0.08, 16, 16]} />
				<meshStandardMaterial emissive={red} color={red} />
			</mesh>

			{/* Yellow lens (middle) */}
			<mesh position={[0, 2.1, 0.31]}>
				<sphereGeometry args={[0.08, 16, 16]} />
				<meshStandardMaterial emissive={yellow} color={yellow} />
			</mesh>

			{/* Green lens (bottom) */}
			<mesh position={[0, 1.85, 0.31]}>
				<sphereGeometry args={[0.08, 16, 16]} />
				<meshStandardMaterial emissive={green} color={green} />
			</mesh>
		</group>
	);
};

/**
 * Pure R3F scene component.
 * Must only contain 3D objects (no <div> / DOM).
 */
export function IntersectionScene({ engine, config }: IntersectionSceneProps) {
	const { entities, trafficLightPhases } = useTrafficSimulation(engine, config);

	return (
		<>
			{/* GLOBAL LIGHTING */}
			<hemisphereLight args={[0xffffff, 0x404040, 1]} />
			<directionalLight position={[50, 80, -30]} intensity={0.7} />

			{/* GROUND PLANE */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
				<planeGeometry args={[200, 200]} />
				<meshStandardMaterial color="#2a2a2a" />
			</mesh>

			{/* ROADS (CROSS) */}
			{/* Vertical (N–S) road */}
			<mesh position={[0, 0.05, 0]}>
				<boxGeometry args={[ROAD_WIDTH, 0.1, WORLD_EXTENT * 2]} />
				<meshStandardMaterial color="#111111" />
			</mesh>

			{/* Horizontal (E–W) road */}
			<mesh position={[0, 0.05, 0]}>
				<boxGeometry args={[WORLD_EXTENT * 2, 0.1, ROAD_WIDTH]} />
				<meshStandardMaterial color="#111111" />
			</mesh>

			{/* BIKE LANES (green strips) */}
			{/* Vertical bike lanes, left/right of vertical road */}
			<mesh position={[-(ROAD_WIDTH / 2) - BIKE_LANE_W / 2, 0.06, 0]}>
				<boxGeometry args={[BIKE_LANE_W, 0.1, WORLD_EXTENT * 2]} />
				<meshStandardMaterial color="#00aa00" />
			</mesh>
			<mesh position={[ROAD_WIDTH / 2 + BIKE_LANE_W / 2, 0.06, 0]}>
				<boxGeometry args={[BIKE_LANE_W, 0.1, WORLD_EXTENT * 2]} />
				<meshStandardMaterial color="#00aa00" />
			</mesh>

			{/* Horizontal bike lanes, above/below horizontal road */}
			<mesh position={[0, 0.06, ROAD_WIDTH / 2 + BIKE_LANE_W / 2]}>
				<boxGeometry args={[WORLD_EXTENT * 2, 0.1, BIKE_LANE_W]} />
				<meshStandardMaterial color="#00aa00" />
			</mesh>
			<mesh position={[0, 0.06, -(ROAD_WIDTH / 2) - BIKE_LANE_W / 2]}>
				<boxGeometry args={[WORLD_EXTENT * 2, 0.1, BIKE_LANE_W]} />
				<meshStandardMaterial color="#00aa00" />
			</mesh>

			{/* SIDEWALKS (outer beige strips) */}
			{/* Vertical sidewalks, outside bike lanes */}
			<mesh
				position={[-(ROAD_WIDTH / 2 + BIKE_LANE_W + SIDEWALK_W / 2), 0.07, 0]}
			>
				<boxGeometry args={[SIDEWALK_W, 0.1, WORLD_EXTENT * 2]} />
				<meshStandardMaterial color="#bababa" />
			</mesh>
			<mesh position={[ROAD_WIDTH / 2 + BIKE_LANE_W + SIDEWALK_W / 2, 0.07, 0]}>
				<boxGeometry args={[SIDEWALK_W, 0.1, WORLD_EXTENT * 2]} />
				<meshStandardMaterial color="#bababa" />
			</mesh>

			{/* Horizontal sidewalks, outside bike lanes */}
			<mesh position={[0, 0.07, ROAD_WIDTH / 2 + BIKE_LANE_W + SIDEWALK_W / 2]}>
				<boxGeometry args={[WORLD_EXTENT * 2, 0.1, SIDEWALK_W]} />
				<meshStandardMaterial color="#bababa" />
			</mesh>
			<mesh
				position={[0, 0.07, -(ROAD_WIDTH / 2 + BIKE_LANE_W + SIDEWALK_W / 2)]}
			>
				<boxGeometry args={[WORLD_EXTENT * 2, 0.1, SIDEWALK_W]} />
				<meshStandardMaterial color="#bababa" />
			</mesh>

			{/* INTERSECTION CENTER (debug square / center box) */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
				<planeGeometry args={[INTERSECTION_SIZE, INTERSECTION_SIZE]} />
				<meshStandardMaterial color="#333333" transparent opacity={0.8} />
			</mesh>

			{/* TRAFFIC POLES (one per corner, facing incoming traffic) */}
			{/* NS lights (control NS/SN flow) */}
			{/* South-west corner, facing northbound traffic (towards +z) */}
			<TrafficPole
				x={-INTERSECTION_SIZE / 2 - 1}
				z={-INTERSECTION_SIZE / 2 - 1}
				phase={trafficLightPhases.NS}
				rotationY={Math.PI} // faces +z
			/>
			{/* North-east corner, facing southbound traffic (towards -z) */}
			<TrafficPole
				x={INTERSECTION_SIZE / 2 + 1}
				z={INTERSECTION_SIZE / 2 + 1}
				phase={trafficLightPhases.NS}
				rotationY={0} // faces -z
			/>

			{/* EW lights (control WE/EW flow) */}
			{/* North-west corner, facing eastbound traffic (towards +x) */}
			<TrafficPole
				x={-INTERSECTION_SIZE / 2 - 1}
				z={INTERSECTION_SIZE / 2 + 1}
				phase={trafficLightPhases.EW}
				rotationY={-Math.PI / 2} // faces +x
			/>
			{/* South-east corner, facing westbound traffic (towards -x) */}
			<TrafficPole
				x={INTERSECTION_SIZE / 2 + 1}
				z={-INTERSECTION_SIZE / 2 - 1}
				phase={trafficLightPhases.EW}
				rotationY={Math.PI / 2} // faces -x
			/>

			{/* VEHICLES / BIKES / PEDESTRIANS */}
			{entities.map((e) => (
				<Vehicle key={e.id} entity={e} />
			))}
		</>
	);
}
