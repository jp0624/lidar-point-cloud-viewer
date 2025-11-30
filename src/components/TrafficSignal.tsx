// src/components/TrafficSignal.tsx
import React from "react";
import * as THREE from "three";

interface TrafficSignalProps {
	position: [number, number, number];
	rotationY?: number;
	state: "red" | "yellow" | "green";
}

export function TrafficSignal({
	position,
	rotationY = 0,
	state,
}: TrafficSignalProps) {
	// Helper: returns color ON vs dark
	const bulbColor = (phase: string) => (state === phase ? phase : "#222222");

	const POLE_H = 3;
	const BULB_R = 0.22;
	const BULB_Y = 1.8;
	const BULB_G = 1.2;

	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			{/* Pole */}
			<mesh position={[0, POLE_H / 2, 0]}>
				<boxGeometry args={[0.1, POLE_H, 0.1]} />
				<meshStandardMaterial color="#333" />
			</mesh>

			{/* Signal Housing */}
			<mesh position={[0, 2, 0]}>
				<boxGeometry args={[0.6, 1.8, 0.4]} />
				<meshStandardMaterial color="#111111" />
			</mesh>

			{/* RED */}
			<mesh position={[0, BULB_R, 0.21]}>
				<sphereGeometry args={[0.18, 12, 12]} />
				<meshStandardMaterial emissive={new THREE.Color(bulbColor("red"))} />
			</mesh>

			{/* YELLOW */}
			<mesh position={[0, BULB_Y, 0.21]}>
				<sphereGeometry args={[0.18, 12, 12]} />
				<meshStandardMaterial emissive={new THREE.Color(bulbColor("yellow"))} />
			</mesh>

			{/* GREEN */}
			<mesh position={[0, BULB_G, 0.21]}>
				<sphereGeometry args={[0.18, 12, 12]} />
				<meshStandardMaterial emissive={new THREE.Color(bulbColor("green"))} />
			</mesh>
		</group>
	);
}
