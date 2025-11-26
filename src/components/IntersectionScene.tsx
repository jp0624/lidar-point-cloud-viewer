// ------------------------------------------------------------
// IntersectionScene.tsx (FULL FIXED VERSION)
// ------------------------------------------------------------
import React from "react";
import { useTrafficSimulation } from "../hooks/useTrafficSimulation";
import { Vehicle } from "./Vehicle";
import type { SimConfig } from "../types/SceneTypes";
import type { TrafficEngine } from "../simulation/TrafficEngine";

import { INTERSECTION_SIZE, ROAD_EXTENT } from "../simulation/TrafficEngine";

// Geometry
const ROAD_WIDTH = 6;
const BIKE_W = 1.2;
const SIDEWALK_W = 1.5;

interface Props {
	engine: TrafficEngine;
	config: SimConfig;
}

export function IntersectionScene({ engine, config }: Props) {
	const { entities, trafficLightPhases } = useTrafficSimulation(engine, config);

	const colorFor = (phase: string) =>
		phase === "green" ? "#00ff00" : phase === "yellow" ? "#ffff00" : "#ff0000";

	return (
		<>
			{/* LIGHTING */}
			<ambientLight intensity={0.5} />
			<hemisphereLight args={[0xffffff, 0x404040, 1]} />
			<directionalLight position={[50, 80, -20]} intensity={0.7} />

			{/* GROUND */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
				<planeGeometry args={[200, 200]} />
				<meshStandardMaterial color="#2a2a2a" />
			</mesh>

			{/* ROADS */}
			<mesh position={[0, 0.05, 0]}>
				<boxGeometry args={[ROAD_WIDTH, 0.1, ROAD_EXTENT * 2]} />
				<meshStandardMaterial color="#111" />
			</mesh>

			<mesh position={[0, 0.05, 0]}>
				<boxGeometry args={[ROAD_EXTENT * 2, 0.1, ROAD_WIDTH]} />
				<meshStandardMaterial color="#111" />
			</mesh>

			{/* BIKE LANES */}
			<mesh position={[-(ROAD_WIDTH / 2 + BIKE_W / 2), 0.06, 0]}>
				<boxGeometry args={[BIKE_W, 0.1, ROAD_EXTENT * 2]} />
				<meshStandardMaterial color="#00aa00" />
			</mesh>
			<mesh position={[ROAD_WIDTH / 2 + BIKE_W / 2, 0.06, 0]}>
				<boxGeometry args={[BIKE_W, 0.1, ROAD_EXTENT * 2]} />
				<meshStandardMaterial color="#00aa00" />
			</mesh>

			<mesh position={[0, 0.06, ROAD_WIDTH / 2 + BIKE_W / 2]}>
				<boxGeometry args={[ROAD_EXTENT * 2, 0.1, BIKE_W]} />
				<meshStandardMaterial color="#00aa00" />
			</mesh>

			<mesh position={[0, 0.06, -(ROAD_WIDTH / 2 + BIKE_W / 2)]}>
				<boxGeometry args={[ROAD_EXTENT * 2, 0.1, BIKE_W]} />
				<meshStandardMaterial color="#00aa00" />
			</mesh>

			{/* SIDEWALKS */}
			<mesh position={[-(ROAD_WIDTH / 2 + BIKE_W + SIDEWALK_W / 2), 0.07, 0]}>
				<boxGeometry args={[SIDEWALK_W, 0.1, ROAD_EXTENT * 2]} />
				<meshStandardMaterial color="#bababa" />
			</mesh>

			<mesh position={(ROAD_WIDTH / 2 + BIKE_W + SIDEWALK_W / 2, 0.07, 0)}>
				<boxGeometry args={[SIDEWALK_W, 0.1, ROAD_EXTENT * 2]} />
				<meshStandardMaterial color="#bababa" />
			</mesh>

			<mesh position={[0, 0.07, ROAD_WIDTH / 2 + BIKE_W + SIDEWALK_W / 2]}>
				<boxGeometry args={[ROAD_EXTENT * 2, 0.1, SIDEWALK_W]} />
				<meshStandardMaterial color="#bababa" />
			</mesh>

			<mesh position={[0, 0.07, -(ROAD_WIDTH / 2 + BIKE_W + SIDEWALK_W / 2)]}>
				<boxGeometry args={[ROAD_EXTENT * 2, 0.1, SIDEWALK_W]} />
				<meshStandardMaterial color="#bababa" />
			</mesh>

			{/* INTERSECTION SQUARE */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
				<planeGeometry args={[INTERSECTION_SIZE, INTERSECTION_SIZE]} />
				<meshStandardMaterial color="#333" opacity={0.5} transparent />
			</mesh>

			{/* TRAFFIC LIGHTS */}
			<mesh
				position={[-INTERSECTION_SIZE / 2 - 1, 2, -INTERSECTION_SIZE / 2 - 1]}
			>
				<boxGeometry args={[0.4, 1.2, 0.4]} />
				<meshStandardMaterial color={colorFor(trafficLightPhases.NS)} />
			</mesh>

			<mesh
				position={[INTERSECTION_SIZE / 2 + 1, 2, INTERSECTION_SIZE / 2 + 1]}
			>
				<boxGeometry args={[0.4, 1.2, 0.4]} />
				<meshStandardMaterial color={colorFor(trafficLightPhases.EW)} />
			</mesh>

			{/* VEHICLES / BIKES / PEDESTRIANS */}
			{entities.map((e) => (
				<Vehicle key={e.id} entity={e} />
			))}
		</>
	);
}
