import React, { useMemo } from "react";
import { OrbitControls } from "@react-three/drei";
import { TrafficEngine } from "../simulation/TrafficEngine";
import type { SimConfig } from "../types/SceneTypes";
import { useTrafficSimulation } from "../hooks/useTrafficSimulation";
import { Vehicle } from "./Vehicle";
import { LidarPoints } from "./LidarPoints";
import * as THREE from "three";

interface IntersectionSceneProps {
	engine: TrafficEngine;
	config: SimConfig;
}

const RoadDimensions = {
	ROAD_SIZE: 40,
	LANE_WIDTH: 4,
	SIDEWALK_WIDTH: 3,
};

export const IntersectionScene: React.FC<IntersectionSceneProps> = ({
	engine,
	config,
}) => {
	const { entities, trafficLightPhases } = useTrafficSimulation(engine, config);

	const lightStateColor: Record<string, string> = {
		green: "#00ff00",
		yellow: "#ffff00",
		red: "#ff0000",
	};

	// Renders static scene elements (road, sidewalk, markings)
	const StaticScene = () => (
		<group>
			{/* Road (dark gray) */}
			<mesh position={[0, -0.05, 0]}>
				<boxGeometry
					args={[RoadDimensions.ROAD_SIZE, 0.01, RoadDimensions.ROAD_SIZE]}
				/>
				<meshStandardMaterial color="#333333" />
			</mesh>

			{/* Pedestrian Crosswalk Markings (White stripes) - simplified */}
			{[
				[0, 10, 0], // North
				[0, -10, 0], // South
				[10, 0, Math.PI / 2], // East
				[-10, 0, Math.PI / 2], // West
			].map(([x, z, rotationZ], index) => (
				<mesh
					key={index}
					position={[x, 0, z]}
					rotation={[-Math.PI / 2, 0, rotationZ]}
				>
					<planeGeometry args={[RoadDimensions.ROAD_SIZE / 2, 2]} />
					<meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
				</mesh>
			))}
		</group>
	);

	// Simple 3D Traffic Light Visualizer
	const TrafficLight = ({
		position,
		phase,
	}: {
		position: [number, number, number];
		phase: string;
	}) => {
		const color = lightStateColor[phase];
		return (
			<group position={position}>
				<mesh position={[0, 1, 0]}>
					<boxGeometry args={[0.2, 2, 0.2]} />
					<meshStandardMaterial color="gray" />
				</mesh>
				<mesh position={[0, 2, 0]}>
					<sphereGeometry args={[0.3, 16, 16]} />
					{/* Use emissive for glow effect */}
					<meshBasicMaterial color={color} emissive={color} />
				</mesh>
			</group>
		);
	};

	return (
		<>
			{/* Drei OrbitControls is the R3F way to manage camera */}
			<OrbitControls enableDamping dampingFactor={0.1} target={[0, 0, 0]} />

			<StaticScene />

			{/* Render Vehicles and Entities */}
			{entities.map((entity) => (
				<Vehicle key={entity.id} entity={entity} />
			))}

			{/* Render Lidar Points - Only when enabled in config */}
			<LidarPoints entities={entities} enabled={config.lidarEnabled} />

			{/* Render Traffic Lights (Simplified placements) */}
			<TrafficLight
				position={[3, 0, 20]} // NS side
				phase={trafficLightPhases.NS}
			/>
			<TrafficLight
				position={[-3, 0, -20]} // SN side
				phase={trafficLightPhases.NS}
			/>
			<TrafficLight
				position={[20, 0, -3]} // EW side
				phase={trafficLightPhases.EW}
			/>
			<TrafficLight
				position={[-20, 0, 3]} // WE side
				phase={trafficLightPhases.EW}
			/>
		</>
	);
};
