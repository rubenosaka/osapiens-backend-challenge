import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

const openApiPath = path.join(__dirname, "openapi.yaml");
const openApiDocument = yaml.load(fs.readFileSync(openApiPath, "utf8")) as any;

export const setupSwagger = (app: Express): void => {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Osapiens Backend Challenge API",
    })
  );
};
