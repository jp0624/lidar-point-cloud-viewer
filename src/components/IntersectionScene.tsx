import React from "react";
import { OrbitControls } from "@react-three/drei";
import { TrafficEngine } from "../simulation/TrafficEngine";
import type { SimConfig } from "../types/SceneTypes";
import { useTrafficSimulation } from "../hooks/useTrafficSimulation";
import { Vehicle } from "./Vehicle";
import { LidarPoints } from "./LidarPoints";

interface IntersectionSceneProps {
	engine: TrafficEngine;
	config: SimConfig;
}

// Dimensions tuned to match TrafficEngine PATHS:
// - Lanes centered roughly at x/z = ±0.5 and ±1.5
// - Roads extend from -24 to +24 units
// - Sidewalks + bike lanes sit just outside the road
const RoadDimensions = {
	EXTENT: 24,
	ROAD_HALF_WIDTH: 3.5, // covers 4 lanes (±1.5, ±0.5)
	SIDEWALK_WIDTH: 1.5,
	BIKE_LANE_WIDTH: 0.8,
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

	// Static geometry: cross roads, sidewalks, and bike lanes
	const StaticScene: React.FC = () => {
		const { EXTENT, ROAD_HALF_WIDTH, SIDEWALK_WIDTH, BIKE_LANE_WIDTH } =
			RoadDimensions;

		const sidewalkOffset = ROAD_HALF_WIDTH + SIDEWALK_WIDTH / 2;
		const bikeOffset = ROAD_HALF_WIDTH - BIKE_LANE_WIDTH / 2;

		return (
			<group>
				{/* Vertical road (NS / SN) */}
				<mesh position={[0, -0.05, 0]}>
					<boxGeometry args={[ROAD_HALF_WIDTH * 2, 0.1, EXTENT * 2]} />
					<meshStandardMaterial color="#2b2b2b" />
				</mesh>

				{/* Horizontal road (EW / WE) */}
				<mesh position={[0, -0.05, 0]}>
					<boxGeometry args={[EXTENT * 2, 0.1, ROAD_HALF_WIDTH * 2]} />
					<meshStandardMaterial color="#2b2b2b" />
				</mesh>

				{/* Sidewalks - four strips around the roads */}
				{/* North sidewalk (along +Z) */}
				<mesh position={[0, 0, sidewalkOffset]}>
					<boxGeometry args={[EXTENT * 2, 0.1, SIDEWALK_WIDTH]} />
					<meshStandardMaterial color="#777777" />
				</mesh>
				{/* South sidewalk (along -Z) */}
				<mesh position={[0, 0, -sidewalkOffset]}>
					<boxGeometry args={[EXTENT * 2, 0.1, SIDEWALK_WIDTH]} />
					<meshStandardMaterial color="#777777" />
				</mesh>
				{/* East sidewalk (along +X) */}
				<mesh position={[sidewalkOffset, 0, 0]}>
					<boxGeometry args={[SIDEWALK_WIDTH, 0.1, EXTENT * 2]} />
					<meshStandardMaterial color="#777777" />
				</mesh>
				{/* West sidewalk (along -X) */}
				<mesh position={[-sidewalkOffset, 0, 0]}>
					<boxGeometry args={[SIDEWALK_WIDTH, 0.1, EXTENT * 2]} />
					<meshStandardMaterial color="#777777" />
				</mesh>

				{/* Bike lanes (green) between road and sidewalk */}
				{/* NS bike lanes (parallel to Z axis) */}
				<mesh position={[0, 0.01, bikeOffset]}>
					<boxGeometry args={[EXTENT * 2, 0.05, BIKE_LANE_WIDTH]} />
					<meshStandardMaterial color="#1aff1a" />
				</mesh>
				<mesh position={[0, 0.01, -bikeOffset]}>
					<boxGeometry args={[EXTENT * 2, 0.05, BIKE_LANE_WIDTH]} />
					<meshStandardMaterial color="#1aff1a" />
				</mesh>
				{/* EW bike lanes (parallel to X axis) */}
				<mesh position={[bikeOffset, 0.01, 0]}>
					<boxGeometry args={[BIKE_LANE_WIDTH, 0.05, EXTENT * 2]} />
					<meshStandardMaterial color="#1aff1a" />
				</mesh>
				<mesh position={[-bikeOffset, 0.01, 0]}>
					<boxGeometry args={[BIKE_LANE_WIDTH, 0.05, EXTENT * 2]} />
					<meshStandardMaterial color="#1aff1a" />
				</mesh>
			</group>
		);
	};

	// Simple 3D traffic light
	const TrafficLight: React.FC<{
		position: [number, number, number];
		phase: string;
	}> = ({ position, phase }) => {
		const color = lightStateColor[phase] ?? "#ff0000";

		return (
			<group position={position}>
				{/* Pole */}
				<mesh position={[0, 1, 0]}>
					<boxGeometry args={[0.2, 2, 0.2]} />
					<meshStandardMaterial color="#555555" />
				</mesh>
				{/* Light head */}
				<mesh position={[0, 2.2, 0]}>
					<sphereGeometry args={[0.35, 16, 16]} />
					<meshStandardMaterial emissive={color} color={color} />
				</mesh>
			</group>
		);
	};

	const { ROAD_HALF_WIDTH, SIDEWALK_WIDTH } = RoadDimensions;
	// Place lights just outside the sidewalks, at the corners where lanes enter the intersection
	const lightCornerOffset = ROAD_HALF_WIDTH + SIDEWALK_WIDTH + 0.5;

	return (
		<>
			{/* Camera controls */}
			<OrbitControls enableDamping dampingFactor={0.08} />

			{/* Static environment */}
			<StaticScene />

			{/* LIDAR point cloud */}
			{config.lidarEnabled && (
				<LidarPoints entities={entities} enabled={true} />
			)}

			{/* Dynamic entities: Cars, Trucks, Bicycles, Pedestrians */}
			{entities.map((entity) => (
				<Vehicle key={entity.id} entity={entity} />
			))}

			{/* NS-controlled lights (diagonal corners for NS approaches) */}
			<TrafficLight
				position={[lightCornerOffset, 0, lightCornerOffset]}
				phase={trafficLightPhases.NS}
			/>
			<TrafficLight
				position={[-lightCornerOffset, 0, -lightCornerOffset]}
				phase={trafficLightPhases.NS}
			/>

			{/* EW-controlled lights (other two corners) */}
			<TrafficLight
				position={[lightCornerOffset, 0, -lightCornerOffset]}
				phase={trafficLightPhases.EW}
			/>
			<TrafficLight
				position={[-lightCornerOffset, 0, lightCornerOffset]}
				phase={trafficLightPhases.EW}
			/>
		</>
	);
};
