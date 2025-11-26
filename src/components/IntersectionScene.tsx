// src/components/IntersectionScene.tsx
import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useTrafficSimulation } from "../hooks/useTrafficSimulation";
import { Vehicle } from "./Vehicle";
import { LidarPoints } from "./LidarPoints";
import type { SimConfig } from "../types/SceneTypes";
import type { TrafficEngine, Entity } from "../simulation/TrafficEngine";
import { Html } from "@react-three/drei";

// Geometry constants
const ROAD_WIDTH = 6; // 4 lanes total (1.5 per lane)
const BIKE_LANE_W = 1.2; // bike lane strip width
const SIDEWALK_W = 1.5; // sidewalk strip width
const WORLD_EXTENT = 20;
const INTERSECTION_SIZE = 8; // +/-4 is the intersection square

interface IntersectionSceneProps {
	engine: TrafficEngine;
	config: SimConfig;
	selectedVehicleId: string | null;
	onSelectVehicle: (id: string | null) => void;
}

// Helper: phase -> color
const phaseToColor = (phase: string) => {
	switch (phase) {
		case "green":
			return "#00ff00";
		case "yellow":
			return "#ffff00";
		default:
			return "#ff0000";
	}
};

// 3-light traffic pole for a single direction
const TrafficPole: React.FC<{
	position: [number, number, number];
	phase: string;
	rotationY?: number;
}> = ({ position, phase, rotationY = 0 }) => {
	const redActive = phase === "red";
	const yellowActive = phase === "yellow";
	const greenActive = phase === "green";

	const dim = 0.1;

	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			{/* Pole */}
			<mesh position={[0, 1, 0]}>
				<cylinderGeometry args={[0.05, 0.05, 2, 12]} />
				<meshStandardMaterial color="#444444" />
			</mesh>

			{/* Light housing */}
			<mesh position={[0, 1.5, 0.2]}>
				<boxGeometry args={[0.4, 1.2, 0.3]} />
				<meshStandardMaterial color="#222222" />
			</mesh>

			{/* Red light (top) */}
			<mesh position={[0, 1.9, 0.32]}>
				<sphereGeometry args={[0.09, 12, 12]} />
				<meshStandardMaterial
					color="#ff0000"
					emissive="#ff0000"
					emissiveIntensity={redActive ? 1.0 : dim}
				/>
			</mesh>

			{/* Yellow light (middle) */}
			<mesh position={[0, 1.5, 0.32]}>
				<sphereGeometry args={[0.09, 12, 12]} />
				<meshStandardMaterial
					color="#ffff00"
					emissive="#ffff00"
					emissiveIntensity={yellowActive ? 1.0 : dim}
				/>
			</mesh>

			{/* Green light (bottom) */}
			<mesh position={[0, 1.1, 0.32]}>
				<sphereGeometry args={[0.09, 12, 12]} />
				<meshStandardMaterial
					color="#00ff00"
					emissive="#00ff00"
					emissiveIntensity={greenActive ? 1.0 : dim}
				/>
			</mesh>
		</group>
	);
};

// Simple pulsing arrow indicator (turn signal)
const ArrowSignal: React.FC<{
	position: [number, number, number];
	rotationY: number;
	active: boolean;
}> = ({ position, rotationY, active }) => {
	const ref = useRef<THREE.Mesh>(null);

	useFrame((state) => {
		if (!ref.current) return;
		if (!active) {
			ref.current.scale.set(1, 1, 1);
			return;
		}
		const t = state.clock.getElapsedTime();
		const s = 1 + 0.25 * Math.sin(t * 6);
		ref.current.scale.set(s, s, s);
	});

	return (
		<mesh ref={ref} position={position} rotation={[0, rotationY, 0]}>
			<coneGeometry args={[0.25, 0.5, 16]} />
			<meshStandardMaterial color="#00ff00" emissive="#00ff00" />
		</mesh>
	);
};

export function IntersectionScene({
	engine,
	config,
	selectedVehicleId,
	onSelectVehicle,
}: IntersectionSceneProps) {
	const { camera } = useThree();
	const { entities, trafficLightPhases } = useTrafficSimulation(engine, config);

	// Camera follow logic
	const selectedRef = useRef<Entity | null>(null);

	useEffect(() => {
		selectedRef.current =
			entities.find((e) => e.id === selectedVehicleId) ?? null;
	}, [entities, selectedVehicleId]);

	useFrame((_, delta) => {
		if (!selectedRef.current) return;

		const e = selectedRef.current;
		const [ex, ey, ez] = e.position;
		const [dx, , dz] = e.dir;

		const backOffset = 10;
		const height = 6;

		const targetX = ex - dx * backOffset;
		const targetY = ey + height;
		const targetZ = ez - dz * backOffset;

		camera.position.x += (targetX - camera.position.x) * 3 * delta;
		camera.position.y += (targetY - camera.position.y) * 3 * delta;
		camera.position.z += (targetZ - camera.position.z) * 3 * delta;

		camera.lookAt(ex, ey, ez);
	});

	return (
		<>
			{/* LIGHTS */}
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
			<mesh position={[+(ROAD_WIDTH / 2) + BIKE_LANE_W / 2, 0.06, 0]}>
				<boxGeometry args={[BIKE_LANE_W, 0.1, WORLD_EXTENT * 2]} />
				<meshStandardMaterial color="#00aa00" />
			</mesh>

			{/* Horizontal bike lanes, above/below horizontal road */}
			<mesh position={[0, 0.06, +(ROAD_WIDTH / 2) + BIKE_LANE_W / 2]}>
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

			{/* INTERSECTION CENTER (debug square) */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
				<planeGeometry args={[INTERSECTION_SIZE, INTERSECTION_SIZE]} />
				<meshStandardMaterial color="#333333" transparent opacity={0.8} />
			</mesh>

			{/* CROSSWALK STRIPES (simple zebra crossings) */}
			{[INTERSECTION_SIZE / 2, -INTERSECTION_SIZE / 2].map((z, idx) => (
				<group key={`crosswalk-ns-${idx}`} position={[0, 0.081, z]}>
					{Array.from({ length: 5 }).map((_, i) => (
						<mesh key={i} position={[i - 2, 0, 0]}>
							<boxGeometry args={[0.6, 0.02, 1.2]} />
							<meshStandardMaterial color="#f5f5f5" />
						</mesh>
					))}
				</group>
			))}
			{[INTERSECTION_SIZE / 2, -INTERSECTION_SIZE / 2].map((x, idx) => (
				<group key={`crosswalk-ew-${idx}`} position={[x, 0.081, 0]}>
					{Array.from({ length: 5 }).map((_, i) => (
						<mesh key={i} position={[0, 0, i - 2]}>
							<boxGeometry args={[1.2, 0.02, 0.6]} />
							<meshStandardMaterial color="#f5f5f5" />
						</mesh>
					))}
				</group>
			))}

			{/* TRAFFIC LIGHT POLES */}
			{/* NS light (controls N–S) – placed at NW corner */}
			<TrafficPole
				position={[
					-INTERSECTION_SIZE / 2 - 1.2,
					0,
					-INTERSECTION_SIZE / 2 - 1.2,
				]}
				phase={trafficLightPhases.NS}
				rotationY={Math.PI / 4}
			/>
			{/* EW light (controls E–W) – placed at SE corner */}
			<TrafficPole
				position={[INTERSECTION_SIZE / 2 + 1.2, 0, INTERSECTION_SIZE / 2 + 1.2]}
				phase={trafficLightPhases.EW}
				rotationY={-3 * (Math.PI / 4)}
			/>

			{/* ARROW TURN SIGNALS (simple visual arrows near each pole) */}
			{/* NS arrow (for straight/turn indication) */}
			<ArrowSignal
				position={[
					-INTERSECTION_SIZE / 2 - 1.2,
					1.5,
					-INTERSECTION_SIZE / 2 - 1.8,
				]}
				rotationY={0}
				active={
					trafficLightPhases.NS === "green" ||
					trafficLightPhases.NS === "yellow"
				}
			/>

			{/* EW arrow */}
			<ArrowSignal
				position={[
					INTERSECTION_SIZE / 2 + 1.2,
					1.5,
					INTERSECTION_SIZE / 2 + 1.8,
				]}
				rotationY={Math.PI}
				active={
					trafficLightPhases.EW === "green" ||
					trafficLightPhases.EW === "yellow"
				}
			/>

			{/* VEHICLES / PEDESTRIANS / BICYCLES */}
			{entities.map((e) => (
				<Vehicle
					key={e.id}
					entity={e}
					selected={e.id === selectedVehicleId}
					onSelect={() =>
						onSelectVehicle(e.id === selectedVehicleId ? null : e.id)
					}
				/>
			))}

			{/* LIDAR POINT CLOUD OVERLAY */}
			{config.lidarEnabled && <LidarPoints entities={entities} enabled />}

			{/* COUNTDOWN HUD (3D overlay using Html, so no DOM directly in Canvas) */}
			<Html position={[0, 10, 0]} center>
				<div
					style={{
						padding: "6px 10px",
						borderRadius: 6,
						background: "rgba(0,0,0,0.7)",
						color: "#fff",
						fontFamily: "monospace",
						fontSize: 12,
						textAlign: "center",
					}}
				>
					<div>NS: {trafficLightPhases.NS}</div>
					<div>EW: {trafficLightPhases.EW}</div>
					<div>{trafficLightPhases.countdown}s</div>
					{selectedVehicleId && <div>Follow: {selectedVehicleId}</div>}
				</div>
			</Html>
		</>
	);
}
