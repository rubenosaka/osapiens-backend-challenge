import { Repository } from "typeorm";
import { Task } from "../models/Task";
import { getJobForTaskType } from "../jobs/JobFactory";
import { WorkflowStatus } from "../workflows/WorkflowFactory";
import { Workflow } from "../models/Workflow";
import { Result } from "../models/Result";

export enum TaskStatus {
  Queued = "queued",
  InProgress = "in_progress",
  Completed = "completed",
  Failed = "failed",
}

export class TaskRunner {
  constructor(private taskRepository: Repository<Task>) {}

  async run(task: Task): Promise<void> {
    if (task.dependency) {
      await this.waitForDependency(task);
    }
    task.status = TaskStatus.InProgress;
    task.progress = "starting job...";
    await this.taskRepository.save(task);
    const job = getJobForTaskType(task.taskType);

    try {
      console.log(
        `[${new Date().toISOString()}] [STEP ${task.stepNumber}] Starting job ${
          task.taskType
        } for task ${task.taskId} (workflow: ${task.workflow.workflowId})...`
      );
      const resultRepository =
        this.taskRepository.manager.getRepository(Result);
      const taskResult = await job.run(task);
      console.log(
        `[${new Date().toISOString()}] [STEP ${task.stepNumber}] ✅ Job ${
          task.taskType
        } for task ${task.taskId} completed successfully.`
      );
      const result = new Result();
      result.taskId = task.taskId!;
      result.data = JSON.stringify(taskResult || {});
      await resultRepository.save(result);
      task.resultId = result.resultId!;
      task.status = TaskStatus.Completed;
      task.progress = null;
      await this.taskRepository.save(task);
    } catch (error: any) {
      console.error(
        `[${new Date().toISOString()}] [STEP ${
          task.stepNumber
        }] ❌ Error running job ${task.taskType} for task ${task.taskId}:`,
        error
      );

      task.status = TaskStatus.Failed;
      task.progress = null;
      await this.taskRepository.save(task);

      throw error;
    }

    const workflowRepository =
      this.taskRepository.manager.getRepository(Workflow);
    const currentWorkflow = await workflowRepository.findOne({
      where: { workflowId: task.workflow.workflowId },
      relations: ["tasks"],
    });

    if (currentWorkflow) {
      const allCompleted = currentWorkflow.tasks.every(
        (t) => t.status === TaskStatus.Completed
      );
      const anyFailed = currentWorkflow.tasks.some(
        (t) => t.status === TaskStatus.Failed
      );

      if (anyFailed) {
        currentWorkflow.status = WorkflowStatus.Failed;
      } else if (allCompleted) {
        currentWorkflow.status = WorkflowStatus.Completed;
      } else {
        currentWorkflow.status = WorkflowStatus.InProgress;
      }

      await workflowRepository.save(currentWorkflow);
    }
  }

  private async waitForDependency(task: Task): Promise<void> {
    console.log(
      `[DEPENDENCY] Task ${task.taskId} waiting for dependency ${task.dependency}...`
    );

    const dependentTask = await this.taskRepository.findOne({
      where: { taskId: task.dependency },
      relations: ["workflow"],
    });

    if (!dependentTask) {
      throw new Error(`Dependent task ${task.dependency} not found`);
    }
    while (
      dependentTask.status !== TaskStatus.Completed &&
      dependentTask.status !== TaskStatus.Failed
    ) {
      console.log(
        `[DEPENDENCY] Waiting for dependent task ${task.dependency} (status: ${dependentTask.status})...`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const refreshedDependentTask = await this.taskRepository.findOne({
        where: { taskId: task.dependency },
      });

      if (refreshedDependentTask) {
        dependentTask.status = refreshedDependentTask.status;
      }
    }

    if (dependentTask.status === TaskStatus.Failed) {
      throw new Error(
        `Dependent task ${task.dependency} failed, cannot proceed with task ${task.taskId}`
      );
    }

    console.log(
      `[DEPENDENCY] ✅ Dependent task ${task.dependency} completed, proceeding with task ${task.taskId}`
    );
  }
}
