// src/components/Vehicle.tsx
import React, { useMemo } from "react";
import * as THREE from "three";
import type { Entity } from "../simulation/TrafficEngine";

interface VehicleProps {
	entity: Entity;
}

export const Vehicle: React.FC<VehicleProps> = ({ entity }) => {
	const { position, dir, scale, type } = entity;

	// Base position and scale
	const [sx, sy, sz] = scale;
	let [x, y, z] = position;

	// Compute heading from direction vector
	const rotationY = useMemo(() => {
		const [dx, , dz] = dir;
		return Math.atan2(dx, dz);
	}, [dir]);

	// Pedestrians should be vertical cylinders
	const isPedestrian = type === "Pedestrian";

	// Type-based color mapping (no random hue for main types)
	const meshColor = useMemo(() => {
		switch (type) {
			case "Car":
				return 0xff0000; // red
			case "Truck":
				return 0x0000ff; // blue
			case "Bicycle":
				return 0x00ff00; // green
			case "Pedestrian":
				return 0xffff00; // yellow
			default:
				return new THREE.Color("#ffffff").getHex();
		}
	}, [type]);

	const height = sy;
	const width = sx;
	const length = sz;

	return (
		<group position={[x, y, z]} rotation={[0, rotationY, 0]}>
			{isPedestrian ? (
				// Upright cylinder for pedestrians
				<mesh position={[0, height / 2, 0]}>
					<cylinderGeometry
						args={[
							width * 0.5, // radiusTop
							width * 0.5, // radiusBottom
							height, // height
							12, // radial segments
						]}
					/>
					<meshStandardMaterial color={meshColor} />
				</mesh>
			) : (
				// Box for vehicles (car, truck, bicycle)
				<mesh position={[0, height / 2, 0]}>
					<boxGeometry args={[width, height, length]} />
					<meshStandardMaterial color={meshColor} />
				</mesh>
			)}
		</group>
	);
};
