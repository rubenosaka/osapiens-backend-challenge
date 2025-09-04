import { Job } from './Job';
import { Task } from '../models/Task';

export class EmailNotificationJob implements Job {
    async run(task: Task): Promise<void> {
        console.log(`[NOTIFICATION] Sending email notification for task ${task.taskId} (Step ${task.stepNumber})...`);
        // Perform notification work
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('[NOTIFICATION] ✅ Email sent!');
    }
}