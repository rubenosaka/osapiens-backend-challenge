import "reflect-metadata";
import express from "express";
import analysisRoutes from "./routes/analysisRoutes";
import defaultRoute from "./routes/defaultRoute";
import debugRoutes from "./routes/debugRoutes";
import workflowRoutes from "./routes/workflowRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { taskWorker } from "./workers/taskWorker";
import { AppDataSource } from "./data-source";

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use("/analysis", analysisRoutes);
app.use("/debug", debugRoutes);
app.use("/workflow", workflowRoutes);
app.use("/api", dashboardRoutes);
app.use("/", defaultRoute);

AppDataSource.initialize()
  .then(() => {
    taskWorker();

    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  })
  .catch((error: any) => console.log(error));
