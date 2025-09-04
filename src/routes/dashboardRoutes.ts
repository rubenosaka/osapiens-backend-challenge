import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Workflow } from "../models/Workflow";
import { Task } from "../models/Task";
import { Result } from "../models/Result";

const router = Router();

router.get("/workflows", async (req: Request, res: Response) => {
  try {
    const workflowRepository = AppDataSource.getRepository(Workflow);
    const taskRepository = AppDataSource.getRepository(Task);

    const workflows = await workflowRepository.find({
      order: { workflowId: "DESC" },
      take: 50,
    });

    const workflowsWithStats = await Promise.all(
      workflows.map(async (workflow) => {
        const tasks = await taskRepository.find({
          where: { workflow: { workflowId: workflow.workflowId } },
        });

        const completedTasks = tasks.filter(
          (t) => t.status === "completed"
        ).length;
        const failedTasks = tasks.filter((t) => t.status === "failed").length;
        const inProgressTasks = tasks.filter(
          (t) => t.status === "in_progress"
        ).length;
        const queuedTasks = tasks.filter((t) => t.status === "queued").length;

        return {
          workflowId: workflow.workflowId,
          clientId: workflow.clientId,
          status: workflow.status,
          createdAt: workflow.workflowId, // Using workflowId as timestamp proxy
          totalTasks: tasks.length,
          completedTasks,
          failedTasks,
          inProgressTasks,
          queuedTasks,
          progress:
            tasks.length > 0
              ? Math.round((completedTasks / tasks.length) * 100)
              : 0,
        };
      })
    );

    res.json(workflowsWithStats);
  } catch (error: any) {
    console.error("Error fetching workflows:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/workflows/:id/tasks - Get detailed tasks for a workflow
router.get("/workflows/:id/tasks", async (req: Request, res: Response) => {
  try {
    const workflowId = req.params.id;
    const taskRepository = AppDataSource.getRepository(Task);
    const resultRepository = AppDataSource.getRepository(Result);

    const tasks = await taskRepository.find({
      where: { workflow: { workflowId: workflowId } },
      order: { stepNumber: "ASC" },
    });

    const tasksWithResults = await Promise.all(
      tasks.map(async (task) => {
        let result = null;
        if (task.resultId) {
          const resultData = await resultRepository.findOne({
            where: { resultId: task.resultId },
          });
          if (resultData && resultData.data) {
            try {
              result = JSON.parse(resultData.data);
            } catch (e) {
              result = resultData.data;
            }
          }
        }

        return {
          taskId: task.taskId,
          taskType: task.taskType,
          status: task.status,
          stepNumber: task.stepNumber,
          progress: task.progress,
          dependency: task.dependency,
          result: result,
          createdAt: task.taskId, // Using taskId as timestamp proxy
        };
      })
    );

    res.json(tasksWithResults);
  } catch (error: any) {
    console.error("Error fetching workflow tasks:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/workflows/:id/details - Get full workflow details
router.get("/workflows/:id/details", async (req: Request, res: Response) => {
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

    const finalResult = workflow.finalResult
      ? JSON.parse(workflow.finalResult)
      : null;

    res.json({
      workflowId: workflow.workflowId,
      clientId: workflow.clientId,
      status: workflow.status,
      finalResult: finalResult,
      createdAt: workflow.workflowId,
    });
  } catch (error: any) {
    console.error("Error fetching workflow details:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats - Get system statistics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const workflowRepository = AppDataSource.getRepository(Workflow);
    const taskRepository = AppDataSource.getRepository(Task);

    const totalWorkflows = await workflowRepository.count();
    const totalTasks = await taskRepository.count();

    const workflowsByStatus = await workflowRepository
      .createQueryBuilder("workflow")
      .select("workflow.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("workflow.status")
      .getRawMany();

    const tasksByStatus = await taskRepository
      .createQueryBuilder("task")
      .select("task.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("task.status")
      .getRawMany();

    res.json({
      totalWorkflows,
      totalTasks,
      workflowsByStatus,
      tasksByStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
