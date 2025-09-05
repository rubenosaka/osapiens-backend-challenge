import "reflect-metadata";
import express from "express";
import path from "path";
import analysisRoutes from "./routes/analysisRoutes";
import defaultRoute from "./routes/defaultRoute";
import debugRoutes from "./routes/debugRoutes";
import workflowRoutes from "./routes/workflowRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { taskWorker } from "./workers/taskWorker";
import { AppDataSource } from "./data-source";
import { setupSwagger } from "./config/swagger";

const app = express();
app.use(express.json());
app.use(express.static("public"));

setupSwagger(app);

app.get(["/dashboard", "/dashboard.html"], (_req, res) => {
  const dashboardPath = path.join(__dirname, "..", "public", "dashboard.html");
  res.sendFile(dashboardPath);
});

app.use("/analysis", analysisRoutes);
app.use("/debug", debugRoutes);
app.use("/workflow", workflowRoutes);
app.use("/api", dashboardRoutes);
app.use("/", defaultRoute);

AppDataSource.initialize()
  .then(() => {
    taskWorker();

    const port = parseInt(process.env.PORT || "3000", 10);
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  })
  .catch((error: any) => console.log(error));
