import type {
  ComponentSnapshot,
  ComponentStatus,
  FrameDefinition,
  TableRow,
} from "@architecture-lab/simulation-engine";

export function stage(
  nodeIds: readonly string[],
  overrides: Record<string, { status: ComponentStatus; detail?: string } | undefined>,
): ComponentSnapshot[] {
  return nodeIds.map((id) => {
    const override = overrides[id];
    return {
      id,
      status: override?.status ?? "inactive",
      ...(override?.detail ? { detail: override.detail } : {}),
    };
  });
}

export function step(input: {
  id: string;
  title: string;
  narrative: string;
  event: FrameDefinition["event"];
  components: ComponentSnapshot[];
  activeEdgeIds?: string[];
  tables: Record<string, TableRow[]>;
  notes?: string[];
}): FrameDefinition {
  return {
    id: input.id,
    title: input.title,
    narrative: input.narrative,
    event: input.event,
    components: input.components,
    activeEdgeIds: input.activeEdgeIds ?? [],
    tables: input.tables,
    notes: input.notes ?? [],
  };
}

export function order(estado: string): TableRow {
  return {
    id: "ord-1042",
    cells: { Pedido: "ord-1042", Cliente: "cust-18", Estado: estado },
  };
}

export function message(estado: string, tentativas: string): TableRow {
  return {
    id: "ob-1042",
    cells: {
      Mensagem: "ob-1042",
      Tipo: "OrderCreated",
      Estado: estado,
      Tentativas: tentativas,
    },
  };
}

export function delivery(id: string, resultado: string): TableRow {
  return {
    id,
    cells: { Evento: "OrderCreated", Resultado: resultado },
  };
}
