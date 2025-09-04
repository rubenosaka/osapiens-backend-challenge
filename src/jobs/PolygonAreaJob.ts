import { Job } from "./Job";
import { Task } from "../models/Task";
import area from "@turf/area";

export class PolygonAreaJob implements Job {
  async run(task: Task): Promise<{ areaSqMeters: number; units: string }> {
    console.log(`[POLYGON] Calculating area for task ${task.taskId} (Step ${task.stepNumber})...`);
    
    const inputGeometry = JSON.parse(task.geoJson);

    if (
      inputGeometry.type !== "Polygon" &&
      inputGeometry.type !== "MultiPolygon"
    ) {
      throw new Error("Invalid GeoJSON: expected Polygon or MultiPolygon");
    }

    const value = area(inputGeometry);
    const output = { areaSqMeters: value, units: "m2" };

    console.log(`[POLYGON] ✅ Area calculated: ${value.toFixed(2)} m²`);
    return output;
  }
}
