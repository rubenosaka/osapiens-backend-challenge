import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Task } from "../models/Task";
import { Result } from "../models/Result";
import { Workflow } from "../models/Workflow";

const router = Router();

router.get("/tasks", async (req: Request, res: Response) => {
  try {
    const taskRepository = AppDataSource.getRepository(Task);
    const resultRepository = AppDataSource.getRepository(Result);

    const tasks = await taskRepository.find({
      relations: ["workflow"],
      order: { taskId: "DESC" },
      take: 10,
    });

    const tasksWithResults = await Promise.all(
      tasks.map(async (task) => {
        let result = null;
        if (task.resultId) {
          result = await resultRepository.findOne({
            where: { resultId: task.resultId },
          });
        }
        return {
          taskId: task.taskId,
          taskType: task.taskType,
          status: task.status,
          stepNumber: task.stepNumber,
          workflowId: task.workflow.workflowId,
          result: result && result.data ? JSON.parse(result.data) : null,
        };
      })
    );

    res.json(tasksWithResults);
    return;
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: error.message });
    return;
  }
});

export default router;
