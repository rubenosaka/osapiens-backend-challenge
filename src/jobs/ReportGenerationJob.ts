import { Job } from "./Job";
import { Task } from "../models/Task";
import { Result } from "../models/Result";
import { AppDataSource } from "../data-source";

interface TaskReport {
  taskId: string;
  type: string;
  output: any;
  status: string;
  stepNumber: number;
}

interface WorkflowReport {
  workflowId: string;
  tasks: TaskReport[];
  finalReport: string;
  summary: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalArea?: number;
    countriesFound?: string[];
  };
}

export class ReportGenerationJob implements Job {
  async run(task: Task): Promise<WorkflowReport> {
    console.log(
      `[REPORT] Generating report for workflow ${task.workflow.workflowId} (Step ${task.stepNumber})...`
    );

    try {
      // Get all tasks from the same workflow
      const taskRepository = AppDataSource.getRepository(Task);
      const resultRepository = AppDataSource.getRepository(Result);

      // First, get the workflow ID from the task
      const workflowId = task.workflow.workflowId;
      console.log(`[REPORT] Looking for tasks in workflow: ${workflowId}`);

      const workflowTasks = await taskRepository.find({
        where: { workflow: { workflowId: workflowId } },
        order: { stepNumber: "ASC" },
      });

      console.log(`[REPORT] Found ${workflowTasks.length} tasks in workflow`);
      
      // Check if all preceding tasks are completed
      const precedingTasks = workflowTasks.filter(t => t.stepNumber < task.stepNumber);
      const completedPrecedingTasks = precedingTasks.filter(t => t.status === 'completed');
      const failedPrecedingTasks = precedingTasks.filter(t => t.status === 'failed');
      
      console.log(`[REPORT] Preceding tasks status: ${completedPrecedingTasks.length}/${precedingTasks.length} completed, ${failedPrecedingTasks.length} failed`);
      
      if (failedPrecedingTasks.length > 0) {
        console.log(`[REPORT] ⚠️  Warning: ${failedPrecedingTasks.length} preceding tasks failed, but continuing with report generation`);
      }

      // Get results for all tasks
      const tasksWithResults: TaskReport[] = await Promise.all(
        workflowTasks.map(async (workflowTask) => {
          let output = null;
          if (workflowTask.resultId) {
            const result = await resultRepository.findOne({
              where: { resultId: workflowTask.resultId },
            });
            if (result && result.data) {
              try {
                output = JSON.parse(result.data);
              } catch (e) {
                output = result.data; // Fallback to raw data
              }
            }
          }

          return {
            taskId: workflowTask.taskId,
            type: workflowTask.taskType,
            output: output,
            status: workflowTask.status,
            stepNumber: workflowTask.stepNumber,
          };
        })
      );

      // Generate summary
      const summary = this.generateSummary(tasksWithResults);

      // Generate final report
      const finalReport = this.generateFinalReport(tasksWithResults, summary);

      const report: WorkflowReport = {
        workflowId: task.workflow.workflowId,
        tasks: tasksWithResults,
        finalReport: finalReport,
        summary: summary,
      };

      console.log(
        `[REPORT] ✅ Report generated successfully for workflow ${task.workflow.workflowId}`
      );
      return report;
    } catch (error: any) {
      console.error(
        `Error generating report for workflow ${task.workflow.workflowId}:`,
        error.message
      );
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  private generateSummary(tasks: TaskReport[]): WorkflowReport["summary"] {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const failedTasks = tasks.filter((t) => t.status === "failed").length;

    // Extract specific data from different job types
    let totalArea = 0;
    const countriesFound: string[] = [];

    tasks.forEach((task) => {
      if (
        task.type === "polygonArea" &&
        task.output &&
        task.output.areaSqMeters
      ) {
        totalArea += task.output.areaSqMeters;
      }
      if (
        task.type === "analysis" &&
        task.output &&
        typeof task.output === "string"
      ) {
        if (
          task.output !== "No country found" &&
          !countriesFound.includes(task.output)
        ) {
          countriesFound.push(task.output);
        }
      }
    });

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      totalArea: totalArea > 0 ? totalArea : undefined,
      countriesFound: countriesFound.length > 0 ? countriesFound : undefined,
    };
  }

  private generateFinalReport(
    tasks: TaskReport[],
    summary: WorkflowReport["summary"]
  ): string {
    const reportLines: string[] = [];

    reportLines.push(`=== WORKFLOW ANALYSIS REPORT ===`);
    reportLines.push(
      `Workflow Status: ${summary.failedTasks > 0 ? "FAILED" : "COMPLETED"}`
    );
    reportLines.push(
      `Tasks: ${summary.completedTasks}/${summary.totalTasks} completed`
    );

    if (summary.failedTasks > 0) {
      reportLines.push(`Failed Tasks: ${summary.failedTasks}`);
    }

    if (summary.totalArea) {
      const areaKm2 = (summary.totalArea / 1000000).toFixed(2);
      reportLines.push(
        `Total Area Analyzed: ${areaKm2} km² (${summary.totalArea.toFixed(
          2
        )} m²)`
      );
    }

    if (summary.countriesFound && summary.countriesFound.length > 0) {
      reportLines.push(`Countries Found: ${summary.countriesFound.join(", ")}`);
    } else if (tasks.some((t) => t.type === "analysis")) {
      reportLines.push(`Countries Found: None (polygon outside all countries)`);
    }

    reportLines.push(`\n=== TASK DETAILS ===`);
    tasks.forEach((task) => {
      reportLines.push(
        `Step ${task.stepNumber}: ${task.type} - ${task.status.toUpperCase()}`
      );
      if (task.status === "failed") {
        reportLines.push(`  ❌ Task failed`);
      } else if (task.output) {
        if (task.type === "polygonArea" && task.output.areaSqMeters) {
          reportLines.push(
            `  ✅ Area: ${task.output.areaSqMeters.toFixed(2)} m²`
          );
        } else if (task.type === "analysis") {
          reportLines.push(`  ✅ Country: ${task.output}`);
        } else if (task.type === "notification") {
          reportLines.push(`  ✅ Notification sent`);
        }
      }
    });

    return reportLines.join("\n");
  }
}
