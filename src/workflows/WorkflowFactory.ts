import * as fs from "fs";
import * as yaml from "js-yaml";
import { DataSource } from "typeorm";
import { Workflow } from "../models/Workflow";
import { Task } from "../models/Task";
import { TaskStatus } from "../workers/taskRunner";

export enum WorkflowStatus {
  Initial = "initial",
  InProgress = "in_progress",
  Completed = "completed",
  Failed = "failed",
}

interface WorkflowStep {
  taskType: string;
  stepNumber: number;
  dependsOn?: string;
}

interface WorkflowDefinition {
  name: string;
  steps: WorkflowStep[];
}

export class WorkflowFactory {
  constructor(private dataSource: DataSource) {}

  async createWorkflowFromYAML(
    filePath: string,
    clientId: string,
    geoJson: string
  ): Promise<Workflow> {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const workflowDef = yaml.load(fileContent) as WorkflowDefinition;
    const workflowRepository = this.dataSource.getRepository(Workflow);
    const taskRepository = this.dataSource.getRepository(Task);
    const workflow = new Workflow();

    workflow.clientId = clientId;
    workflow.status = WorkflowStatus.Initial;

    const savedWorkflow = await workflowRepository.save(workflow);

    const tasks: Task[] = workflowDef.steps.map((step) => {
      const task = new Task();
      task.clientId = clientId;
      task.geoJson = geoJson;
      task.status = TaskStatus.Queued;
      task.taskType = step.taskType;
      task.stepNumber = step.stepNumber;
      task.workflow = savedWorkflow;

      if (step.dependsOn) {
        const dependentStep = workflowDef.steps.find(
          (s) => s.taskType === step.dependsOn
        );
        if (dependentStep) {
          task.dependency = step.dependsOn;
        }
      }

      return task;
    });

    await taskRepository.save(tasks);

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const step = workflowDef.steps[i];

      if (step.dependsOn) {
        const dependentTask = tasks.find((t) => t.taskType === step.dependsOn);
        if (dependentTask) {
          task.dependency = dependentTask.taskId;
        }
      }
    }

    await taskRepository.save(tasks);

    return savedWorkflow;
  }
}
