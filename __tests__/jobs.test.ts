import { PolygonAreaJob } from "../src/jobs/PolygonAreaJob";
import { ReportGenerationJob } from "../src/jobs/ReportGenerationJob";
import { DataAnalysisJob } from "../src/jobs/DataAnalysisJob";
import { Task } from "../src/models/Task";
import { Workflow } from "../src/models/Workflow";
import { WorkflowStatus } from "../src/workflows/WorkflowFactory";
import { TaskStatus } from "../src/workers/taskRunner";

describe("Job Implementations", () => {
  let mockTask: Task;
  let mockWorkflow: Workflow;

  beforeEach(() => {
    // Create mock workflow
    mockWorkflow = new Workflow();
    mockWorkflow.workflowId = "test-workflow-id";
    mockWorkflow.clientId = "test-client";
    mockWorkflow.status = WorkflowStatus.InProgress;

    // Create mock task
    mockTask = new Task();
    mockTask.taskId = "test-task-id";
    mockTask.clientId = "test-client";
    mockTask.status = TaskStatus.Queued;
    mockTask.taskType = "polygonArea";
    mockTask.stepNumber = 1;
    mockTask.workflow = mockWorkflow;
  });

  describe("PolygonAreaJob", () => {
    it("should calculate polygon area correctly", async () => {
      const validPolygon = {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      };

      mockTask.geoJson = JSON.stringify(validPolygon);

      const job = new PolygonAreaJob();
      const result = await job.run(mockTask);

      expect(result).toHaveProperty("areaSqMeters");
      expect(result).toHaveProperty("units");
      expect(result.units).toBe("m2");
      expect(typeof result.areaSqMeters).toBe("number");
      expect(result.areaSqMeters).toBeGreaterThan(0);
    });

    it("should handle MultiPolygon geometry", async () => {
      const validMultiPolygon = {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        ],
      };

      mockTask.geoJson = JSON.stringify(validMultiPolygon);

      const job = new PolygonAreaJob();
      const result = await job.run(mockTask);

      expect(result).toHaveProperty("areaSqMeters");
      expect(result).toHaveProperty("units");
      expect(typeof result.areaSqMeters).toBe("number");
    });

    it("should throw error for invalid GeoJSON", async () => {
      const invalidGeoJson = {
        type: "Point",
        coordinates: [0, 0],
      };

      mockTask.geoJson = JSON.stringify(invalidGeoJson);

      const job = new PolygonAreaJob();

      await expect(job.run(mockTask)).rejects.toThrow(
        "Invalid GeoJSON: expected Polygon or MultiPolygon"
      );
    });

    it("should throw error for malformed JSON", async () => {
      mockTask.geoJson = "invalid json";

      const job = new PolygonAreaJob();

      await expect(job.run(mockTask)).rejects.toThrow();
    });
  });

  describe("DataAnalysisJob", () => {
    it("should analyze polygon and return country", async () => {
      const brazilPolygon = {
        type: "Polygon",
        coordinates: [
          [
            [-63.624885020050996, -10.311050368263523],
            [-63.624885020050996, -10.367865108370523],
            [-63.61278302732815, -10.367865108370523],
            [-63.61278302732815, -10.311050368263523],
            [-63.624885020050996, -10.311050368263523],
          ],
        ],
      };

      mockTask.geoJson = JSON.stringify(brazilPolygon);
      mockTask.taskType = "analysis";

      const job = new DataAnalysisJob();
      const result = await job.run(mockTask);

      expect(typeof result).toBe("string");
      expect(result).toBe("Brazil");
    });

    it('should return "No country found" for polygon outside all countries', async () => {
      const oceanPolygon = {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      };

      mockTask.geoJson = JSON.stringify(oceanPolygon);
      mockTask.taskType = "analysis";

      const job = new DataAnalysisJob();
      const result = await job.run(mockTask);

      expect(typeof result).toBe("string");
      expect(result).toBe("No country found");
    });

    it("should throw error for invalid GeoJSON", async () => {
      const invalidGeoJson = {
        type: "Point",
        coordinates: [0, 0],
      };

      mockTask.geoJson = JSON.stringify(invalidGeoJson);
      mockTask.taskType = "analysis";

      const job = new DataAnalysisJob();

      await expect(job.run(mockTask)).rejects.toThrow(
        "Data analysis failed: Invalid geometry type: Point. Expected Polygon or MultiPolygon"
      );
    });
  });

  describe("ReportGenerationJob", () => {
    it("should have correct job structure", () => {
      const job = new ReportGenerationJob();

      expect(job).toBeDefined();
      expect(typeof job.run).toBe("function");
    });

    it("should throw error when database is not available", async () => {
      mockTask.taskType = "reportGeneration";
      mockTask.stepNumber = 4;

      const job = new ReportGenerationJob();

      await expect(job.run(mockTask)).rejects.toThrow(
        "Report generation failed"
      );
    });
  });
});
