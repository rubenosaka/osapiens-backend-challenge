import { Job } from "./Job";
import { Task } from "../models/Task";
import booleanWithin from "@turf/boolean-within";
import * as fs from "fs";
import * as path from "path";

export class DataAnalysisJob implements Job {
  async run(task: Task): Promise<string> {
    console.log(`Running data analysis for task ${task.taskId}...`);

    try {
      const inputGeometry = JSON.parse(task.geoJson);

      if (!inputGeometry || !inputGeometry.type) {
        throw new Error("Invalid GeoJSON: missing type property");
      }

      if (
        inputGeometry.type !== "Polygon" &&
        inputGeometry.type !== "MultiPolygon"
      ) {
        throw new Error(
          `Invalid geometry type: ${inputGeometry.type}. Expected Polygon or MultiPolygon`
        );
      }

      if (
        !inputGeometry.coordinates ||
        !Array.isArray(inputGeometry.coordinates)
      ) {
        throw new Error("Invalid GeoJSON: missing or invalid coordinates");
      }

      const worldDataPath = path.join(__dirname, "../data/world_data.json");
      const worldData = JSON.parse(fs.readFileSync(worldDataPath, "utf8"));

      for (const country of worldData.features) {
        if (booleanWithin(inputGeometry as any, country.geometry)) {
          console.log(`The polygon is within ${country.properties.NAME}`);
          return country.properties.NAME;
        }
      }

      return "No country found";
    } catch (error: any) {
      console.error(
        `Error running data analysis for task ${task.taskId}:`,
        error.message
      );
      throw new Error(`Data analysis failed: ${error.message}`);
    }
  }
}
