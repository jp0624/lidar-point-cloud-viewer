// src/components/PedestrianSignal.tsx
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type PedPhase = "walk" | "dontWalk" | "blink";

interface PedestrianSignalProps {
	position: [number, number, number];
	rotationY?: number;
	phase: PedPhase;
}

/**
 * Realistic-style pedestrian head:
 * - Top: Red "hand" icon
 * - Bottom: Green standing-person silhouette
 * - WALK state: green person fully lit
 * - DON'T WALK state: red hand lit
 * - BLINK state: green person emissive flickers
 */
export const PedestrianSignal: React.FC<PedestrianSignalProps> = ({
	position,
	rotationY = 0,
	phase,
}) => {
	const walkGroupRef = useRef<THREE.Group | null>(null);
	const handMeshRef = useRef<THREE.Mesh | null>(null);

	useFrame((state) => {
		const t = state.clock.getElapsedTime();

		if (walkGroupRef.current) {
			const materials: THREE.Material[] = [];
			walkGroupRef.current.traverse((obj) => {
				if ((obj as THREE.Mesh).isMesh) {
					materials.push((obj as THREE.Mesh).material as THREE.Material);
				}
			});

			for (const mat of materials) {
				const m = mat as THREE.MeshStandardMaterial;
				if (!m.emissive) continue;

				if (phase === "walk") {
					m.emissiveIntensity = 1.8;
				} else if (phase === "blink") {
					// Flicker green person icon
					const on = Math.sin(t * 8) > 0;
					m.emissiveIntensity = on ? 2.0 : 0.2;
				} else {
					m.emissiveIntensity = 0.1;
				}
			}
		}

		if (handMeshRef.current) {
			const mat = handMeshRef.current.material as THREE.MeshStandardMaterial;
			if (phase === "dontWalk") {
				mat.emissiveIntensity = 2.0;
			} else {
				mat.emissiveIntensity = 0.3;
			}
		}
	});

	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			{/* Pole */}
			<mesh position={[0, 1.0, 0]}>
				<cylinderGeometry args={[0.06, 0.06, 2.0, 12]} />
				<meshStandardMaterial color="#444444" />
			</mesh>

			{/* Head housing */}
			<mesh position={[0, 2.1, 0.18]}>
				<boxGeometry args={[0.6, 0.9, 0.3]} />
				<meshStandardMaterial color="#111111" />
			</mesh>

			{/* Red "hand" icon (top) */}
			<mesh ref={handMeshRef} position={[0, 2.3, 0.33]}>
				<boxGeometry args={[0.26, 0.26, 0.03]} />
				<meshStandardMaterial
					color="#ff3333"
					emissive={"#550000"}
					emissiveIntensity={0.3}
				/>
			</mesh>

			{/* Green standing person silhouette (bottom) */}
			<group ref={walkGroupRef} position={[0, 1.92, 0.33]}>
				{/* Body */}
				<mesh position={[0, 0.17, 0]}>
					<boxGeometry args={[0.14, 0.34, 0.03]} />
					<meshStandardMaterial
						color="#33ff33"
						emissive={"#003300"}
						emissiveIntensity={0.2}
					/>
				</mesh>
				{/* Head */}
				<mesh position={[0, 0.42, 0]}>
					<sphereGeometry args={[0.09, 12, 12]} />
					<meshStandardMaterial
						color="#33ff33"
						emissive={"#003300"}
						emissiveIntensity={0.2}
					/>
				</mesh>
			</group>
		</group>
	);
};
