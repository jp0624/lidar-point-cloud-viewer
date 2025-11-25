import React from "react";
import "./ConfigPanel.css";
import type { SimConfig } from "../types/SceneTypes";

interface ConfigPanelProps {
	config: SimConfig;
	// Accepts a partial SimConfig to merge changes
	onChange: (newConfig: Partial<SimConfig>) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
	config,
	onChange,
}) => {
	const {
		trafficDensity,
		pedestrianEnabled,
		bicycleEnabled,
		speedMultiplier,
		lidarEnabled,
	} = config;

	const handleRangeChange = (key: keyof SimConfig, value: string) => {
		onChange({ [key]: Number(value) } as Partial<SimConfig>);
	};

	const handleCheckChange = (key: keyof SimConfig, checked: boolean) => {
		onChange({ [key]: checked } as Partial<SimConfig>);
	};

	return (
		<div className="config-panel">
			<h2>Simulation Control</h2>

			{/* Traffic Density */}
			<label>
				Traffic Density: {Math.round(trafficDensity * 100)}%
				<input
					type="range"
					min={0.1}
					max={1}
					step={0.05}
					value={trafficDensity}
					onChange={(e) => handleRangeChange("trafficDensity", e.target.value)}
				/>
			</label>

			{/* Speed */}
			<label>
				Speed Multiplier: {speedMultiplier.toFixed(1)}x
				<input
					type="range"
					min={0.5}
					max={3}
					step={0.1}
					value={speedMultiplier}
					onChange={(e) => handleRangeChange("speedMultiplier", e.target.value)}
				/>
			</label>

			{/* Pedestrians */}
			<label className="checkbox">
				<input
					type="checkbox"
					checked={pedestrianEnabled}
					onChange={(e) =>
						handleCheckChange("pedestrianEnabled", e.target.checked)
					}
				/>
				Pedestrians
			</label>

			{/* Bicycles */}
			<label className="checkbox">
				<input
					type="checkbox"
					checked={bicycleEnabled}
					onChange={(e) =>
						handleCheckChange("bicycleEnabled", e.target.checked)
					}
				/>
				Bicycles
			</label>

			{/* LIDAR */}
			<label className="checkbox">
				<input
					type="checkbox"
					checked={lidarEnabled}
					onChange={(e) => handleCheckChange("lidarEnabled", e.target.checked)}
				/>
				LIDAR
			</label>
		</div>
	);
};
