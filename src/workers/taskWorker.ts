import { AppDataSource } from "../data-source";
import { Task } from "../models/Task";
import { TaskRunner, TaskStatus } from "./taskRunner";

export async function taskWorker() {
  const taskRepository = AppDataSource.getRepository(Task);
  const taskRunner = new TaskRunner(taskRepository);

  while (true) {
    const queuedTasks = await taskRepository.find({
      where: { status: TaskStatus.Queued },
      relations: ["workflow"],
      order: { stepNumber: "ASC" },
    });

    let taskToExecute = null;

    for (const task of queuedTasks) {
      const workflowTasks = await taskRepository.find({
        where: { workflow: { workflowId: task.workflow.workflowId } },
        order: { stepNumber: "ASC" },
      });

      const precedingTasks = workflowTasks.filter(
        (t) => t.stepNumber < task.stepNumber
      );
      const allPrecedingCompleted = precedingTasks.every(
        (t) => t.status === TaskStatus.Completed
      );

      if (allPrecedingCompleted) {
        taskToExecute = task;
        console.log(
          `[WORKER] Found executable task: Step ${task.stepNumber} (${task.taskType}) - all ${precedingTasks.length} preceding steps completed`
        );
        break;
      } else {
        const completedPreceding = precedingTasks.filter(
          (t) => t.status === TaskStatus.Completed
        ).length;
        console.log(
          `[WORKER] Task Step ${task.stepNumber} (${task.taskType}) waiting: ${completedPreceding}/${precedingTasks.length} preceding steps completed`
        );
      }
    }

    if (taskToExecute) {
      try {
        await taskRunner.run(taskToExecute);
      } catch (error) {
        console.error(
          "Task execution failed. Task status has already been updated by TaskRunner."
        );
        console.error(error);
      }
    } else {
      console.log("[WORKER] No tasks ready for execution");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
