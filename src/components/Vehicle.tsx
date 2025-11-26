// src/components/Vehicle.tsx
import React, { useMemo } from "react";
import * as THREE from "three";
import type { Entity } from "../simulation/TrafficEngine";

interface VehicleProps {
	entity: Entity;
	selected?: boolean;
	onSelect?: () => void;
}

// Optional extra color map, used as fallback
const colorMap: Record<number, string> = {
	0: "#ff5555",
	1: "#55ff55",
	2: "#5555ff",
	3: "#ffff55",
	4: "#ff55ff",
};

export const Vehicle: React.FC<VehicleProps> = ({
	entity,
	selected = false,
	onSelect,
}) => {
	const { position, dir, scale, type } = entity;

	let [x, y, z] = position;
	const [sx, sy, sz] = scale;

	// Compute heading from direction vector so the vehicle is long-wise aligned
	const rotationY = useMemo(() => {
		const [dx, , dz] = dir;
		return Math.atan2(dx, dz);
	}, [dir]);

	// Bicycles ride on the right side of the lane in the direction of travel,
	// pushed outward so they visually align closer to the green bike strip.
	if (type === "Bicycle") {
		const [dx, , dz] = dir;
		const len = Math.sqrt(dx * dx + dz * dz) || 1;
		const ndx = dx / len;
		const ndz = dz / len;

		// "Right" vector in XZ plane
		const rightX = ndz;
		const rightZ = -ndx;

		const lateralOffset = 2.3; // tuned to sit near bike lane
		x += rightX * lateralOffset;
		z += rightZ * lateralOffset;
	}

	const isPedestrian = type === "Pedestrian";

	// Color per type
	const meshColor = useMemo(() => {
		if (type === "Bicycle") return 0x00ff00;
		if (type === "Pedestrian") return 0xffff00;
		if (type === "Truck") return 0x5555ff;
		// Car default or fallback to colorMap
		return new THREE.Color(colorMap[entity.color] || colorMap[0]).getHex();
	}, [type, entity.color]);

	const height = sy;
	const width = sx;
	const length = sz;

	const highlight = selected ? 1.4 : 1.0;

	return (
		<group
			position={[x, y, z]}
			rotation={[0, rotationY, 0]}
			onClick={onSelect}
			scale={[highlight, highlight, highlight]}
		>
			{isPedestrian ? (
				// Upright cylinder for pedestrians
				<mesh position={[0, height / 2, 0]}>
					<cylinderGeometry
						args={[
							width * 0.4, // radiusTop
							width * 0.4, // radiusBottom
							height,
							12,
						]}
					/>
					<meshStandardMaterial color={meshColor} />
				</mesh>
			) : (
				// Box for vehicles (car, truck, bike)
				<mesh position={[0, height / 2, 0]}>
					<boxGeometry args={[width, height, length]} />
					<meshStandardMaterial
						color={meshColor}
						emissive={selected ? "#ffffff" : "#000000"}
						emissiveIntensity={selected ? 0.4 : 0}
					/>
				</mesh>
			)}
		</group>
	);
};
