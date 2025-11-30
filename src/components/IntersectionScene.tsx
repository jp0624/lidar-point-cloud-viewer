// src/components/IntersectionScene.tsx
import React from "react";
import { useTrafficSimulation } from "../hooks/useTrafficSimulation";
import { Vehicle } from "./Vehicle";
import { TrafficSignal } from "./TrafficSignal";
import { PedestrianSignal } from "./PedestrianSignal";
import type { SimConfig } from "../types/SceneTypes";
import type { TrafficEngine } from "../simulation/TrafficEngine";

// Geometry constants
const ROAD_WIDTH = 6; // 4 lanes total (1.5 per lane)
const BIKE_LANE_W = 1.2;
const SIDEWALK_W = 1.5;
const WORLD_EXTENT = 20;
export const INTERSECTION_SIZE = 8; // +/- 4

interface IntersectionSceneProps {
	engine: TrafficEngine;
	config: SimConfig;
}

type PedPhase = "walk" | "dontWalk" | "blink";

export function IntersectionScene({ engine, config }: IntersectionSceneProps) {
	const { entities, trafficLightPhases } = useTrafficSimulation(engine, config);

	const nsPhase = trafficLightPhases.NS; // "green" | "yellow" | "red"
	const ewPhase = trafficLightPhases.EW;
	const countdown = trafficLightPhases.countdown;

	// Pedestrians crossing the N-S roadway (i.e. E-W crosswalks)
	const pedAcrossNSRoad: PedPhase =
		nsPhase === "red" ? (countdown <= 3 ? "blink" : "walk") : "dontWalk";

	// Pedestrians crossing the E-W roadway (i.e. N-S crosswalks)
	const pedAcrossEWRoad: PedPhase =
		ewPhase === "red" ? (countdown <= 3 ? "blink" : "walk") : "dontWalk";

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

	return (
		<>
			{/* ----- GLOBAL LIGHTING ----- */}
			<hemisphereLight args={[0xffffff, 0x404040, 1]} />
			<directionalLight position={[50, 80, -30]} intensity={0.7} />

			{/* ----- GROUND PLANE ----- */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
				<planeGeometry args={[200, 200]} />
				<meshStandardMaterial color="#2a2a2a" />
			</mesh>

			{/* ----- ROADS (CROSS) ----- */}
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

			{/* ----- BIKE LANES (green strips) ----- */}
			{/* Vertical bike lanes, left/right of NS road */}
			<mesh position={[-(ROAD_WIDTH / 2) - BIKE_LANE_W / 2, 0.06, 0]}>
				<boxGeometry args={[BIKE_LANE_W, 0.1, WORLD_EXTENT * 2]} />
				<meshStandardMaterial color="#00aa00" />
			</mesh>
			<mesh position={[+(ROAD_WIDTH / 2) + BIKE_LANE_W / 2, 0.06, 0]}>
				<boxGeometry args={[BIKE_LANE_W, 0.1, WORLD_EXTENT * 2]} />
				<meshStandardMaterial color="#00aa00" />
			</mesh>

			{/* Horizontal bike lanes, above/below E–W road */}
			<mesh position={[0, 0.06, +(ROAD_WIDTH / 2) + BIKE_LANE_W / 2]}>
				<boxGeometry args={[WORLD_EXTENT * 2, 0.1, BIKE_LANE_W]} />
				<meshStandardMaterial color="#00aa00" />
			</mesh>
			<mesh position={[0, 0.06, -(ROAD_WIDTH / 2) - BIKE_LANE_W / 2]}>
				<boxGeometry args={[WORLD_EXTENT * 2, 0.1, BIKE_LANE_W]} />
				<meshStandardMaterial color="#00aa00" />
			</mesh>

			{/* ----- SIDEWALKS (outer beige strips) ----- */}
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

			{/* Horizontal sidewalks */}
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

			{/* ----- INTERSECTION CENTER ----- */}
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
				<planeGeometry args={[INTERSECTION_SIZE, INTERSECTION_SIZE]} />
				<meshStandardMaterial color="#333333" transparent opacity={0.85} />
			</mesh>

			{/* =========================================================
			    CROSSWALKS (simple zebra stripes)
			   ========================================================= */}
			{/* E–W crosswalks (across N–S roadway) - north & south */}
			{["north", "south"].map((side, index) => {
				const z = (side === "north" ? 1 : -1) * (INTERSECTION_SIZE / 2 + 0.3);
				return (
					<group key={side} position={[0, 0.081, z]}>
						{Array.from({ length: 6 }).map((_, i) => {
							const offset = (i - 2.5) * 0.6; // spread strips along X over road width
							return (
								<mesh key={i} position={[offset, 0, 0]}>
									<boxGeometry args={[0.4, 0.02, 2.5]} />
									<meshStandardMaterial color="#fdfdfd" />
								</mesh>
							);
						})}
					</group>
				);
			})}

			{/* N–S crosswalks (across E–W roadway) - east & west */}
			{["east", "west"].map((side, index) => {
				const x = (side === "east" ? 1 : -1) * (INTERSECTION_SIZE / 2 + 0.3);
				return (
					<group key={side} position={[x, 0.081, 0]}>
						{Array.from({ length: 6 }).map((_, i) => {
							const offset = (i - 2.5) * 0.6; // spread strips along Z over road width
							return (
								<mesh key={i} position={[0, 0, offset]}>
									<boxGeometry args={[2.5, 0.02, 0.4]} />
									<meshStandardMaterial color="#fdfdfd" />
								</mesh>
							);
						})}
					</group>
				);
			})}

			{/* =========================================================
			    VEHICLE TRAFFIC SIGNALS (3-light poles)
			   ========================================================= */}
			{/* NS pair (controls N/S lanes) */}
			<TrafficSignal
				position={[
					-INTERSECTION_SIZE / 2 - 1.2,
					0,
					-INTERSECTION_SIZE / 2 - 1.2,
				]}
				rotationY={Math.PI / 4}
				state={nsPhase}
			/>
			<TrafficSignal
				position={[INTERSECTION_SIZE / 2 + 1.2, 0, INTERSECTION_SIZE / 2 + 1.2]}
				rotationY={(-3 * Math.PI) / 4}
				state={nsPhase}
			/>

			{/* EW pair (controls E/W lanes) */}
			<TrafficSignal
				position={[
					INTERSECTION_SIZE / 2 + 1.2,
					0,
					-INTERSECTION_SIZE / 2 - 1.2,
				]}
				rotationY={(3 * Math.PI) / 4}
				state={ewPhase}
			/>
			<TrafficSignal
				position={[
					-INTERSECTION_SIZE / 2 - 1.2,
					0,
					INTERSECTION_SIZE / 2 + 1.2,
				]}
				rotationY={-Math.PI / 4}
				state={ewPhase}
			/>

			{/* =========================================================
			    PEDESTRIAN SIGNALS (realistic, blinking WALK)
			   ========================================================= */}
			{/* E–W crossings use pedAcrossNSRoad (crossing N–S lanes) */}
			<PedestrianSignal
				position={[INTERSECTION_SIZE / 2 + 0.8, 0, INTERSECTION_SIZE / 2 + 0.2]}
				rotationY={-Math.PI / 2}
				phase={pedAcrossNSRoad}
			/>
			<PedestrianSignal
				position={[
					-INTERSECTION_SIZE / 2 - 0.8,
					0,
					-INTERSECTION_SIZE / 2 - 0.2,
				]}
				rotationY={Math.PI / 2}
				phase={pedAcrossNSRoad}
			/>

			{/* N–S crossings use pedAcrossEWRoad (crossing E–W lanes) */}
			<PedestrianSignal
				position={[
					INTERSECTION_SIZE / 2 + 0.2,
					0,
					-INTERSECTION_SIZE / 2 - 0.8,
				]}
				rotationY={0}
				phase={pedAcrossEWRoad}
			/>
			<PedestrianSignal
				position={[
					-INTERSECTION_SIZE / 2 - 0.2,
					0,
					INTERSECTION_SIZE / 2 + 0.8,
				]}
				rotationY={Math.PI}
				phase={pedAcrossEWRoad}
			/>

			{/* =========================================================
			    ENTITIES (Cars, Trucks, Bikes, Pedestrians)
			   ========================================================= */}
			{entities.map((e) => (
				<Vehicle key={e.id} entity={e} />
			))}
		</>
	);
}
