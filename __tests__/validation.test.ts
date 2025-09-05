import {
  AnalysisRequestSchema,
  GeoJSONSchema,
  WorkflowIdSchema,
} from "../src/validation/schemas";
import { z } from "zod";

describe("Zod Validation Schemas", () => {
  describe("GeoJSONSchema", () => {
    it("should validate a valid Polygon", () => {
      const validPolygon = {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      };

      expect(() => GeoJSONSchema.parse(validPolygon)).not.toThrow();
    });

    it("should validate a valid MultiPolygon", () => {
      const validMultiPolygon = {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        ],
      };

      expect(() => GeoJSONSchema.parse(validMultiPolygon)).not.toThrow();
    });

    it("should reject invalid geometry types", () => {
      const invalidGeometry = {
        type: "Point",
        coordinates: [0, 0],
      };

      expect(() => GeoJSONSchema.parse(invalidGeometry)).toThrow();
    });

    it("should reject unclosed polygon rings", () => {
      const unclosedPolygon = {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
        ],
      };

      expect(() => GeoJSONSchema.parse(unclosedPolygon)).toThrow();
    });

    it("should reject coordinates outside valid ranges", () => {
      const invalidCoordinates = {
        type: "Polygon",
        coordinates: [
          [
            [200, 0], // Invalid longitude
            [1, 0],
            [1, 1],
            [0, 1],
            [200, 0],
          ],
        ],
      };

      expect(() => GeoJSONSchema.parse(invalidCoordinates)).toThrow();
    });
  });

  describe("AnalysisRequestSchema", () => {
    it("should validate a complete valid request", () => {
      const validRequest = {
        clientId: "test-client-123",
        geoJson: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        },
      };

      expect(() => AnalysisRequestSchema.parse(validRequest)).not.toThrow();
    });

    it("should reject empty clientId", () => {
      const invalidRequest = {
        clientId: "",
        geoJson: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        },
      };

      expect(() => AnalysisRequestSchema.parse(invalidRequest)).toThrow();
    });

    it("should reject clientId with invalid characters", () => {
      const invalidRequest = {
        clientId: "test@client#123",
        geoJson: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        },
      };

      expect(() => AnalysisRequestSchema.parse(invalidRequest)).toThrow();
    });

    it("should reject clientId that is too long", () => {
      const invalidRequest = {
        clientId: "a".repeat(101), // 101 characters
        geoJson: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        },
      };

      expect(() => AnalysisRequestSchema.parse(invalidRequest)).toThrow();
    });

    it("should reject degenerate polygons", () => {
      const invalidRequest = {
        clientId: "test-client",
        geoJson: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [0, 0],
              [0, 0],
              [0, 0],
            ],
          ],
        },
      };

      expect(() => AnalysisRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe("WorkflowIdSchema", () => {
    it("should validate a valid UUID", () => {
      const validUUID = "550e8400-e29b-41d4-a716-446655440000";
      expect(() => WorkflowIdSchema.parse(validUUID)).not.toThrow();
    });

    it("should reject invalid UUID format", () => {
      const invalidUUID = "not-a-uuid";
      expect(() => WorkflowIdSchema.parse(invalidUUID)).toThrow();
    });

    it("should reject empty string", () => {
      expect(() => WorkflowIdSchema.parse("")).toThrow();
    });
  });

  describe("Error Messages", () => {
    it("should provide clear error messages for validation failures", () => {
      const invalidRequest = {
        clientId: "test@client",
        geoJson: {
          type: "InvalidType",
          coordinates: [],
        },
      };

      try {
        AnalysisRequestSchema.parse(invalidRequest);
        fail("Should have thrown an error");
      } catch (error) {
        if (error instanceof z.ZodError) {
          expect(error.issues).toHaveLength(2); // clientId and geoJson errors
          expect(error.issues[0].message).toContain("can only contain letters");
          expect(error.issues[1].message).toContain("Invalid input");
        }
      }
    });
  });
});
