// src/ui/ConfigPanel.tsx
import React from "react";
import type { SimConfig, ForcedLightPhase } from "../types/SceneTypes";
import "./ConfigPanel.css";

interface ConfigPanelProps {
	config: SimConfig;
	onChange: (partial: Partial<SimConfig>) => void;
}

const formatPercent = (v: number) => `${Math.round(v * 100)}%`;

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
	config,
	onChange,
}) => {
	const {
		trafficDensity,
		carRatio,
		truckRatio,
		bikeRatio,
		pedRatio,
		speedMultiplier,
		lidarEnabled,
		forceLightPhase,
	} = config;

	const handleRatioChange =
		(key: keyof SimConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange({ [key]: parseFloat(e.target.value) } as Partial<SimConfig>);
		};

	const handleSelectLightPhase = (e: React.ChangeEvent<HTMLSelectElement>) => {
		onChange({ forceLightPhase: e.target.value as ForcedLightPhase });
	};

	return (
		<div className="config-panel">
			<h2 className="config-title">Simulation Controls</h2>

			{/* Global traffic density */}
			<section className="config-section">
				<div className="config-label-row">
					<label>Traffic Density</label>
					<span className="config-value">{formatPercent(trafficDensity)}</span>
				</div>
				<input
					type="range"
					min={0}
					max={1}
					step={0.05}
					value={trafficDensity}
					onChange={(e) =>
						onChange({ trafficDensity: parseFloat(e.target.value) })
					}
				/>
				<p className="config-help">
					Controls overall number of entities (cars, trucks, bikes,
					pedestrians).
				</p>
			</section>

			{/* Per-type density ratios */}
			<section className="config-section">
				<h3 className="config-subtitle">Type Mix (Balanced Urban)</h3>

				<div className="config-label-row">
					<label>Cars</label>
					<span className="config-value">{formatPercent(carRatio)}</span>
				</div>
				<input
					type="range"
					min={0}
					max={1}
					step={0.05}
					value={carRatio}
					onChange={handleRatioChange("carRatio")}
				/>

				<div className="config-label-row">
					<label>Trucks</label>
					<span className="config-value">{formatPercent(truckRatio)}</span>
				</div>
				<input
					type="range"
					min={0}
					max={1}
					step={0.05}
					value={truckRatio}
					onChange={handleRatioChange("truckRatio")}
				/>

				<div className="config-label-row">
					<label>Bicycles</label>
					<span className="config-value">{formatPercent(bikeRatio)}</span>
				</div>
				<input
					type="range"
					min={0}
					max={1}
					step={0.05}
					value={bikeRatio}
					onChange={handleRatioChange("bikeRatio")}
				/>

				<div className="config-label-row">
					<label>Pedestrians</label>
					<span className="config-value">{formatPercent(pedRatio)}</span>
				</div>
				<input
					type="range"
					min={0}
					max={1}
					step={0.05}
					value={pedRatio}
					onChange={handleRatioChange("pedRatio")}
				/>

				<p className="config-help">
					Ratios are normalized internally. Set to shape the mix of road users.
				</p>
			</section>

			{/* Speed / LIDAR */}
			<section className="config-section">
				<div className="config-label-row">
					<label>Speed</label>
					<span className="config-value">{speedMultiplier.toFixed(2)}x</span>
				</div>
				<input
					type="range"
					min={0.1}
					max={3}
					step={0.05}
					value={speedMultiplier}
					onChange={(e) =>
						onChange({ speedMultiplier: parseFloat(e.target.value) })
					}
				/>
				<label className="config-toggle">
					<input
						type="checkbox"
						checked={lidarEnabled}
						onChange={(e) => onChange({ lidarEnabled: e.target.checked })}
					/>
					LIDAR Overlay
				</label>
			</section>

			{/* Traffic light override */}
			<section className="config-section">
				<h3 className="config-subtitle">Traffic Lights</h3>
				<label className="config-label-row">
					<span>Override Phase</span>
					<select value={forceLightPhase} onChange={handleSelectLightPhase}>
						<option value="auto">Cycle (auto)</option>
						<option value="green">Force Green NS</option>
						<option value="yellow">Force Yellow NS</option>
						<option value="red">Force Red NS</option>
					</select>
				</label>
				<p className="config-help">
					Override sets NS phase; EW will use the opposite so the intersection
					remains safe.
				</p>
			</section>
		</div>
	);
};
