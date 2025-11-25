import React from "react";

// Simplified type based on TrafficEngine EntityType for display purposes
type DisplayEntityType = "Car" | "Truck" | "Bicycle" | "Pedestrian";

const entityColors: Record<DisplayEntityType, string> = {
	Car: "#ff5555",
	Truck: "#ffff55",
	Bicycle: "#00ff00",
	Pedestrian: "#ff55ff",
};

export const LidarLegend: React.FC = () => {
	const entityEntries = Object.entries(entityColors) as [
		DisplayEntityType,
		string
	][];

	return (
		<div
			style={{
				position: "absolute",
				bottom: 20,
				left: 20,
				backgroundColor: "rgba(0,0,0,0.6)",
				padding: "8px 12px",
				borderRadius: 6,
				color: "white",
				fontSize: 14,
				zIndex: 20,
			}}
		>
			<h4 style={{ margin: "0 0 6px 0" }}>Entity Legend (LIDAR)</h4>
			{entityEntries.map(([name, color]) => (
				<div
					key={name}
					style={{ display: "flex", alignItems: "center", marginBottom: 4 }}
				>
					<div
						style={{
							width: 16,
							height: 16,
							backgroundColor: color,
							borderRadius: 4,
							marginRight: 8,
						}}
					/>
					<span>{name}</span>
				</div>
			))}
		</div>
	);
};
