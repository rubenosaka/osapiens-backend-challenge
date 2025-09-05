import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Workflow } from "../models/Workflow";
import {
  validateParams,
  ValidatedRequest,
  createErrorResponse,
} from "../middleware/validation";
import { WorkflowIdSchema, WorkflowId } from "../validation/schemas";

const router = Router();

router.get(
  "/:id/status",
  validateParams(WorkflowIdSchema),
  async (req: any, res: Response) => {
    try {
      const workflowId = req.validatedData;

      const workflowRepository = AppDataSource.getRepository(Workflow);
      const workflow = await workflowRepository.findOne({
        where: { workflowId: workflowId },
        relations: ["tasks"],
      });

      if (!workflow) {
        createErrorResponse(res, 404, "Workflow not found", {
          workflowId,
        });
        return;
      }

      const completedTasks = workflow.tasks.filter(
        (t) => t.status === "completed"
      ).length;
      const failedTasks = workflow.tasks.filter(
        (t) => t.status === "failed"
      ).length;
      const totalTasks = workflow.tasks.length;

      res.json({
        success: true,
        workflowId: workflow.workflowId,
        status: workflow.status,
        completedTasks: completedTasks,
        failedTasks: failedTasks,
        totalTasks: totalTasks,
        progress:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error fetching workflow status:", error);
      createErrorResponse(
        res,
        500,
        "Internal server error while getting workflow status"
      );
      return;
    }
  }
);

router.get(
  "/:id/results",
  validateParams(WorkflowIdSchema),
  async (req: any, res: Response) => {
    try {
      const workflowId = req.validatedData;

      const workflowRepository = AppDataSource.getRepository(Workflow);
      const workflow = await workflowRepository.findOne({
        where: { workflowId: workflowId },
      });

      if (!workflow) {
        createErrorResponse(res, 404, "Workflow not found", {
          workflowId,
        });
        return;
      }

      if (workflow.status !== "completed" && workflow.status !== "failed") {
        createErrorResponse(res, 400, "Workflow has not finished yet", {
          currentStatus: workflow.status,
          message:
            "Results are only available for completed or failed workflows",
        });
        return;
      }

      let finalResult = null;
      try {
        finalResult = workflow.finalResult
          ? JSON.parse(workflow.finalResult)
          : null;
      } catch (parseError) {
        console.error("Error parsing final result:", parseError);
        createErrorResponse(res, 500, "Error processing workflow results");
        return;
      }

      res.json({
        success: true,
        workflowId: workflow.workflowId,
        status: workflow.status,
        finalResult: finalResult,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error fetching workflow results:", error);
      createErrorResponse(
        res,
        500,
        "Internal server error while getting workflow results"
      );
      return;
    }
  }
);

export default router;
