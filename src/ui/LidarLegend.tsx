// src/ui/LidarLegend.tsx
import React from "react";

export const LidarLegend: React.FC = () => {
	const entries = [
		{ label: "Car", color: "#ff5555" },
		{ label: "Truck", color: "#5555ff" },
		{ label: "Bicycle", color: "#00ff00" },
		{ label: "Pedestrian", color: "#ffff00" },
	];

	return (
		<div
			style={{
				backgroundColor: "rgba(0,0,0,0.65)",
				padding: "8px 12px",
				borderRadius: 6,
				color: "white",
				fontSize: 13,
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<div style={{ fontWeight: 600, marginBottom: 4 }}>LIDAR Legend</div>
			{entries.map((e) => (
				<div
					key={e.label}
					style={{
						display: "flex",
						alignItems: "center",
						marginBottom: 2,
					}}
				>
					<div
						style={{
							width: 14,
							height: 14,
							borderRadius: 3,
							backgroundColor: e.color,
							marginRight: 6,
						}}
					/>
					<span>{e.label}</span>
				</div>
			))}
		</div>
	);
};
