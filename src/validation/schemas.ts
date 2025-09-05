import { z } from "zod";

const CoordinateSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);

const LinearRingSchema = z
  .array(CoordinateSchema)
  .min(4)
  .refine(
    (ring) => {
      const first = ring[0];
      const last = ring[ring.length - 1];
      return first[0] === last[0] && first[1] === last[1];
    },
    {
      message:
        "Coordinate ring must be closed (first and last points must be equal)",
    }
  );

const PolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(LinearRingSchema).min(1).max(1),
});

const MultiPolygonSchema = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z.array(z.array(LinearRingSchema).min(1)).min(1),
});

export const GeoJSONSchema = z.discriminatedUnion("type", [
  PolygonSchema,
  MultiPolygonSchema,
]);

export const AnalysisRequestSchema = z.object({
  clientId: z
    .string()
    .min(1, "Client ID is required")
    .max(100, "Client ID cannot exceed 100 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Client ID can only contain letters, numbers, hyphens and underscores"
    ),

  geoJson: GeoJSONSchema.refine(
    (geoJson) => {
      if (geoJson.type === "Polygon") {
        const coords = geoJson.coordinates[0];
        if (coords.length < 4) return false;

        const firstPoint = coords[0];
        return coords.some(
          (coord) => coord[0] !== firstPoint[0] || coord[1] !== firstPoint[1]
        );
      }
      return true;
    },
    {
      message:
        "Polygon must have at least 4 unique points and form a valid area",
    }
  ),
});

export const WorkflowIdSchema = z
  .string()
  .uuid("Workflow ID must be a valid UUID");

export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, "Page must be greater than 0"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),
});

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;
export type GeoJSON = z.infer<typeof GeoJSONSchema>;
export type Polygon = z.infer<typeof PolygonSchema>;
export type MultiPolygon = z.infer<typeof MultiPolygonSchema>;
export type WorkflowId = z.infer<typeof WorkflowIdSchema>;
export type PaginationQuery = z.infer<typeof PaginationSchema>;

export function validateAnalysisRequest(data: unknown): AnalysisRequest {
  return AnalysisRequestSchema.parse(data);
}

export function validateWorkflowId(id: string): WorkflowId {
  return WorkflowIdSchema.parse(id);
}

export function validatePagination(query: any): PaginationQuery {
  return PaginationSchema.parse(query);
}
