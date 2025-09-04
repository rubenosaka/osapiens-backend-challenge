import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Workflow } from "../models/Workflow";

const router = Router();

// Tarea 5: GET /workflow/:id/status
router.get("/:id/status", async (req: Request, res: Response) => {
  try {
    const workflowId = req.params.id;

    const workflowRepository = AppDataSource.getRepository(Workflow);
    const workflow = await workflowRepository.findOne({
      where: { workflowId: workflowId },
      relations: ["tasks"],
    });

    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    const completedTasks = workflow.tasks.filter(
      (t) => t.status === "completed"
    ).length;
    const totalTasks = workflow.tasks.length;

    res.json({
      workflowId: workflow.workflowId,
      status: workflow.status,
      completedTasks: completedTasks,
      totalTasks: totalTasks,
    });
    return;
  } catch (error: any) {
    console.error("Error fetching workflow status:", error);
    res.status(500).json({ error: error.message });
    return;
  }
});

// Tarea 6: GET /workflow/:id/results
router.get("/:id/results", async (req: Request, res: Response) => {
  try {
    const workflowId = req.params.id;

    const workflowRepository = AppDataSource.getRepository(Workflow);
    const workflow = await workflowRepository.findOne({
      where: { workflowId: workflowId },
    });

    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    if (workflow.status !== "completed" && workflow.status !== "failed") {
      res.status(400).json({
        error: "Workflow is not yet completed",
        currentStatus: workflow.status,
      });
      return;
    }

    const finalResult = workflow.finalResult
      ? JSON.parse(workflow.finalResult)
      : null;

    res.json({
      workflowId: workflow.workflowId,
      status: workflow.status,
      finalResult: finalResult,
    });
    return;
  } catch (error: any) {
    console.error("Error fetching workflow results:", error);
    res.status(500).json({ error: error.message });
    return;
  }
});

export default router;
