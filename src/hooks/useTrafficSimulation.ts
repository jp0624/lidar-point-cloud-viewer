import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { TrafficEngine } from "../simulation/TrafficEngine";
import type { Entity } from "../simulation/TrafficEngine"; // FIX: Added 'type' for type-only import
import { TrafficLights } from "../simulation/TrafficLights";
import type { SimConfig } from "../types/SceneTypes";
import * as THREE from "three";

export interface SimulationState {
	entities: Entity[];
	trafficLightPhases: { NS: string; EW: string; countdown: number };
}

export function useTrafficSimulation(
	engine: TrafficEngine,
	config: SimConfig
): SimulationState {
	const [state, setState] = useState<SimulationState>({
		entities: [],
		trafficLightPhases: { NS: "green", EW: "red", countdown: 0 },
	});
	const clockRef = useRef(new THREE.Clock());
	const trafficLightsRef = useRef(new TrafficLights());

	// Initial Population and Density Management
	useEffect(() => {
		// Calculate the target number of vehicles (excluding pedestrians/bicycles)
		const vehicleTypes = ["Car", "Truck"];
		const pedestrianTypes = ["Pedestrian", "Bicycle"];

		const maxVehicleCount = Math.floor(engine.getMaxEntities() * 0.8);
		const targetVehicleCount = Math.ceil(
			config.trafficDensity * maxVehicleCount
		);

		// Simple reset and repopulate for quick config changes
		engine.reset();

		for (let i = 0; i < targetVehicleCount; i++) {
			const type =
				vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
			engine.spawn({ type: type as Entity["type"] });
		}

		// Spawn pedestrians/bicycles if enabled (fixed count for simplicity)
		if (config.pedestrianEnabled) {
			for (let i = 0; i < 5; i++) {
				engine.spawn({ type: "Pedestrian" });
			}
		}
		if (config.bicycleEnabled) {
			for (let i = 0; i < 5; i++) {
				engine.spawn({ type: "Bicycle" });
			}
		}
	}, [
		engine,
		config.trafficDensity,
		config.pedestrianEnabled,
		config.bicycleEnabled,
	]);

	useFrame(() => {
		// Use R3F's delta time * speed multiplier for smooth, scaled animation
		const delta = clockRef.current.getDelta() * config.speedMultiplier;

		// 1. Update Traffic Lights (pass delta in milliseconds for accurate timer)
		trafficLightsRef.current.update(delta * 1000);

		const NS_GREEN = trafficLightsRef.current.getNSPhase() === "green";
		const EW_GREEN = trafficLightsRef.current.getEWPhase() === "green";

		// 2. Update Traffic Engine
		engine.update(delta, { NS: NS_GREEN, EW: EW_GREEN });

		// 3. Update State for Rendering
		setState({
			entities: engine.getActiveEntities(),
			trafficLightPhases: {
				NS: trafficLightsRef.current.getNSPhase(),
				EW: trafficLightsRef.current.getEWPhase(),
				countdown: trafficLightsRef.current.getCountdownSecRounded(),
			},
		});
	});

	return state;
}
