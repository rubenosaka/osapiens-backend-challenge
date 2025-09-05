import { Router } from "express";
import { AppDataSource } from "../data-source";
import { WorkflowFactory } from "../workflows/WorkflowFactory";
import {
  validateRequest,
  ValidatedRequest,
  createErrorResponse,
} from "../middleware/validation";
import { AnalysisRequestSchema, AnalysisRequest } from "../validation/schemas";
import path from "path";

const router = Router();
const workflowFactory = new WorkflowFactory(AppDataSource);

router.post(
  "/",
  validateRequest(AnalysisRequestSchema),
  async (req: any, res) => {
    const { clientId, geoJson } = req.validatedData;
    const workflowFile = path.join(
      __dirname,
      "../workflows/example_workflow.yml"
    );

    try {
      console.log(`[ANALYSIS] Creating workflow for client: ${clientId}`);
      console.log(
        `[ANALYSIS] GeoJSON type: ${geoJson.type}, coordinates count: ${geoJson.coordinates.length}`
      );

      const workflow = await workflowFactory.createWorkflowFromYAML(
        workflowFile,
        clientId,
        JSON.stringify(geoJson)
      );

      console.log(
        `[ANALYSIS] ✅ Workflow created successfully: ${workflow.workflowId}`
      );

      res.status(202).json({
        success: true,
        workflowId: workflow.workflowId,
        message: "Workflow created and tasks queued from YAML definition.",
        clientId: clientId,
        geoJsonType: geoJson.type,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(
        `[ANALYSIS] ❌ Error creating workflow for client ${clientId}:`,
        error
      );

      if (
        error.message?.includes("YAML") ||
        error.message?.includes("workflow")
      ) {
        createErrorResponse(res, 422, "Error processing workflow definition", {
          originalError: error.message,
        });
        return;
      }

      if (
        error.message?.includes("database") ||
        error.message?.includes("connection")
      ) {
        createErrorResponse(res, 503, "Database connection error", {
          retryAfter: 30,
        });
        return;
      }

      createErrorResponse(
        res,
        500,
        "Internal server error while creating workflow"
      );
      return;
    }
  }
);

export default router;
