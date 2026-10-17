import { z } from "zod";
import { SimulationError } from "./errors";

export const PLAYBACK_STATUSES = ["idle", "running", "paused", "completed"] as const;
export const STEP_OUTCOMES = ["success", "failure", "pending"] as const;
export const COMPONENT_STATUSES = [
  "inactive",
  "processing",
  "success",
  "failure",
  "waiting",
] as const;

export const playbackStatusSchema = z.enum(PLAYBACK_STATUSES);
export const stepOutcomeSchema = z.enum(STEP_OUTCOMES);
export const componentStatusSchema = z.enum(COMPONENT_STATUSES);

export const simulationEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1).optional(),
  outcome: stepOutcomeSchema,
});

export const componentSnapshotSchema = z.object({
  id: z.string().min(1),
  status: componentStatusSchema,
  detail: z.string().min(1).optional(),
});

export const tableRowSchema = z.object({
  id: z.string().min(1),
  cells: z.record(z.string().min(1)),
});

export const tableSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  columns: z.array(z.string().min(1)).min(1),
});

export const diagramNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  caption: z.string().min(1),
});

export const diagramEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().min(1).optional(),
});

export const frameDefinitionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  narrative: z.string().min(1),
  event: simulationEventSchema,
  components: z.array(componentSnapshotSchema).min(1),
  activeEdgeIds: z.array(z.string().min(1)),
  tables: z.record(z.array(tableRowSchema)),
  notes: z.array(z.string().min(1)).default([]),
});

export const failureScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  lesson: z.string().min(1),
  frames: z.array(frameDefinitionSchema).min(1),
});

export const simulationDefinitionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    lesson: z.string().min(1),
    nodes: z.array(diagramNodeSchema).min(1),
    edges: z.array(diagramEdgeSchema),
    tables: z.array(tableSchema),
    initial: z.object({
      title: z.string().min(1),
      narrative: z.string().min(1),
      components: z.array(componentSnapshotSchema).min(1),
      tables: z.record(z.array(tableRowSchema)),
      notes: z.array(z.string().min(1)).default([]),
    }),
    frames: z.array(frameDefinitionSchema).min(1),
    failures: z.array(failureScenarioSchema),
  })
  .superRefine((definition, context) => {
    const nodeIds = new Set(definition.nodes.map((node) => node.id));
    const edgeIds = new Set<string>();

    if (nodeIds.size !== definition.nodes.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Node ids must be unique.",
        path: ["nodes"],
      });
    }

    for (const [index, edge] of definition.edges.entries()) {
      if (edgeIds.has(edge.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate edge id "${edge.id}".`,
          path: ["edges", index, "id"],
        });
      }
      edgeIds.add(edge.id);
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Edge "${edge.id}" references an unknown node.`,
          path: ["edges", index],
        });
      }
    }

    const tableIds = definition.tables.map((table) => table.id);
    if (new Set(tableIds).size !== tableIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Table ids must be unique.",
        path: ["tables"],
      });
    }

    const failureIds = new Set<string>();
    for (const [index, failure] of definition.failures.entries()) {
      if (failureIds.has(failure.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate failure id "${failure.id}".`,
          path: ["failures", index, "id"],
        });
      }
      failureIds.add(failure.id);
    }

    const scripts = [
      {
        path: ["initial"],
        components: definition.initial.components,
        tables: definition.initial.tables,
      },
      ...definition.frames.map((frame, index) => ({
        path: ["frames", index],
        components: frame.components,
        tables: frame.tables,
        activeEdgeIds: frame.activeEdgeIds,
        event: frame.event,
      })),
      ...definition.failures.flatMap((failure, failureIndex) =>
        failure.frames.map((frame, frameIndex) => ({
          path: ["failures", failureIndex, "frames", frameIndex],
          components: frame.components,
          tables: frame.tables,
          activeEdgeIds: frame.activeEdgeIds,
          event: frame.event,
        })),
      ),
    ];

    for (const script of scripts) {
      if (script.components.length !== nodeIds.size) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Every frame must describe each diagram node exactly once.",
          path: [...script.path, "components"],
        });
      }

      const seen = new Set<string>();
      for (const component of script.components) {
        if (!nodeIds.has(component.id) || seen.has(component.id)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Component "${component.id}" is unknown or duplicated.`,
            path: [...script.path, "components"],
          });
        }
        seen.add(component.id);
      }

      const tableKeys = Object.keys(script.tables);
      if (tableKeys.length !== tableIds.length || tableIds.some((id) => !tableKeys.includes(id))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Frame tables must match the definition table schema.",
          path: [...script.path, "tables"],
        });
      }

      for (const table of definition.tables) {
        for (const row of script.tables[table.id] ?? []) {
          const cellKeys = Object.keys(row.cells);
          const sameColumns =
            cellKeys.length === table.columns.length &&
            table.columns.every((column) => cellKeys.includes(column));
          if (!sameColumns) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Row "${row.id}" does not match the columns of table "${table.id}".`,
              path: [...script.path, "tables", table.id],
            });
          }
        }
      }

      if ("activeEdgeIds" in script) {
        for (const edgeId of script.activeEdgeIds) {
          if (!edgeIds.has(edgeId)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Unknown active edge "${edgeId}".`,
              path: [...script.path, "activeEdgeIds"],
            });
          }
        }
      }

      if ("event" in script) {
        if (!nodeIds.has(script.event.source)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Event source "${script.event.source}" is not a node.`,
            path: [...script.path, "event", "source"],
          });
        }
        if (script.event.target && !nodeIds.has(script.event.target)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Event target "${script.event.target}" is not a node.`,
            path: [...script.path, "event", "target"],
          });
        }
      }
    }
  });

export type PlaybackStatus = z.infer<typeof playbackStatusSchema>;
export type StepOutcome = z.infer<typeof stepOutcomeSchema>;
export type ComponentStatus = z.infer<typeof componentStatusSchema>;
export type SimulationEvent = z.infer<typeof simulationEventSchema>;
export type ComponentSnapshot = z.infer<typeof componentSnapshotSchema>;
export type TableRow = z.infer<typeof tableRowSchema>;
export type TableSchema = z.infer<typeof tableSchema>;
export type DiagramNode = z.infer<typeof diagramNodeSchema>;
export type DiagramEdge = z.infer<typeof diagramEdgeSchema>;
export type FrameDefinition = z.infer<typeof frameDefinitionSchema>;
export type FailureScenario = z.infer<typeof failureScenarioSchema>;
export type SimulationDefinition = z.infer<typeof simulationDefinitionSchema>;

export interface SimulationFrame {
  index: number;
  title: string;
  narrative: string;
  event: SimulationEvent | null;
  components: ComponentSnapshot[];
  activeEdgeIds: string[];
  tables: Record<string, TableRow[]>;
  notes: string[];
}

export function parseSimulationDefinition(input: unknown): SimulationDefinition {
  const result = simulationDefinitionSchema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
      .join("\n");
    throw new SimulationError(`Invalid simulation definition.\n${details}`);
  }
  return result.data;
}
