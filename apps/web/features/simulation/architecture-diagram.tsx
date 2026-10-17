"use client";

import type { SimulationDefinition, SimulationFrame } from "@architecture-lab/simulation-engine";
import {
  Background,
  Controls,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";

const POSITIONS: Record<string, { x: number; y: number }> = {
  client: { x: 0, y: 80 },
  "order-service": { x: 220, y: 80 },
  database: { x: 450, y: 0 },
  worker: { x: 450, y: 180 },
  kafka: { x: 680, y: 180 },
  consumer: { x: 910, y: 180 },
  "transactional-inbox:kafka": { x: 0, y: 40 },
  "transactional-inbox:consumer": { x: 280, y: 40 },
  "transactional-inbox:database": { x: 560, y: 20 },
  "transactional-inbox:rival": { x: 280, y: 220 },
  "direct-consume:kafka": { x: 0, y: 80 },
  "direct-consume:consumer": { x: 280, y: 80 },
  "direct-consume:database": { x: 560, y: 80 },
  "direct-publish:client": { x: 0, y: 80 },
  "direct-publish:order-service": { x: 260, y: 80 },
  "direct-publish:database": { x: 540, y: 0 },
  "direct-publish:kafka": { x: 540, y: 200 },
  "direct-publish:consumer": { x: 820, y: 200 },
  "transactional-outbox:worker-b": { x: 450, y: 320 },
};

const STATUS_LABEL: Record<string, string> = {
  inactive: "em espera",
  processing: "processando",
  success: "concluído",
  failure: "falha",
  waiting: "aguardando",
};

type LabData = {
  label: string;
  caption: string;
  status: string;
  detail: string;
};

const HANDLE_SIDES = [
  ["left", Position.Left],
  ["right", Position.Right],
  ["top", Position.Top],
  ["bottom", Position.Bottom],
] as const;

function LabNode({ data }: NodeProps<Node<LabData, "lab">>) {
  const status = STATUS_LABEL[data.status] ?? data.status;
  return (
    <article className="lab-node" data-status={data.status} aria-label={`${data.label}: ${status}`}>
      {HANDLE_SIDES.map(([side, position]) => (
        <Handle key={`target-${side}`} id={`target-${side}`} type="target" position={position} />
      ))}
      <header>
        <span>{data.caption}</span>
        <span className="pip" aria-hidden="true" />
      </header>
      <strong>{data.label}</strong>
      <p>{data.detail || status}</p>
      {HANDLE_SIDES.map(([side, position]) => (
        <Handle key={`source-${side}`} id={`source-${side}`} type="source" position={position} />
      ))}
    </article>
  );
}

const nodeTypes = { lab: LabNode };

function nodeOrigin(definitionId: string, nodeId: string, index: number) {
  return (
    POSITIONS[`${definitionId}:${nodeId}`] ??
    POSITIONS[nodeId] ?? {
      x: (index % 3) * 260,
      y: Math.floor(index / 3) * 180,
    }
  );
}

function sideFacing(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }
  return dy >= 0 ? "bottom" : "top";
}

export function orientActiveEdge(
  edge: { id: string; source: string; target: string },
  frame: SimulationFrame,
): { source: string; target: string } {
  const event = frame.event;
  const active = frame.activeEdgeIds.includes(edge.id);
  if (!active || !event?.target) {
    return { source: edge.source, target: edge.target };
  }
  const sameWay = event.source === edge.source && event.target === edge.target;
  const reverse = event.source === edge.target && event.target === edge.source;
  if (sameWay || reverse) {
    return { source: event.source, target: event.target };
  }
  return { source: edge.source, target: edge.target };
}

function FrameFit({ signature }: { signature: string }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (signature.length === 0) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      void fitView({ padding: 0.2, duration: 0 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fitView, signature]);

  return null;
}

export function ArchitectureDiagram({
  definition,
  frame,
}: {
  definition: SimulationDefinition;
  frame: SimulationFrame;
}) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const statusById = new Map(frame.components.map((component) => [component.id, component]));
  const originById = new Map<string, { x: number; y: number }>();
  const nodes: Node<LabData, "lab">[] = definition.nodes.map((node, index) => {
    const component = statusById.get(node.id);
    const position = nodeOrigin(definition.id, node.id, index);
    originById.set(node.id, position);
    return {
      id: node.id,
      type: "lab",
      position,
      data: {
        label: node.label,
        caption: node.caption,
        status: component?.status ?? "inactive",
        detail: component?.detail ?? "",
      },
      draggable: false,
      selectable: false,
      width: 188,
      height: 108,
    };
  });

  const edges: Edge[] = definition.edges.map((edge) => {
    const active = frame.activeEdgeIds.includes(edge.id);
    const flow = orientActiveEdge(edge, frame);
    const source = originById.get(flow.source);
    const target = originById.get(flow.target);
    const sourceSide = source && target ? sideFacing(source, target) : "right";
    const targetSide = source && target ? sideFacing(target, source) : "left";
    return {
      id: edge.id,
      source: flow.source,
      target: flow.target,
      sourceHandle: `source-${sourceSide}`,
      targetHandle: `target-${targetSide}`,
      label: active ? edge.label : undefined,
      animated: active && !reduceMotion,
      style: {
        stroke: active ? "#9a3412" : "#cfc4b2",
        strokeWidth: active ? 2.4 : 1.4,
      },
      labelStyle: { fill: "#7c2d12", fontSize: 11, fontWeight: 600 },
    };
  });

  return (
    <div className="diagram-canvas" aria-hidden="true">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        minZoom={0.35}
        maxZoom={1.35}
        panActivationKeyCode={null}
        proOptions={{ hideAttribution: false }}
        ariaLabelConfig={{
          "controls.ariaLabel": "Zoom do diagrama",
          "controls.zoomIn.ariaLabel": "Ampliar",
          "controls.zoomOut.ariaLabel": "Reduzir",
          "controls.fitView.ariaLabel": "Ajustar à tela",
        }}
      >
        <FrameFit signature={`${definition.id}:${definition.nodes.length}`} />
        <Background color="#e4d9c8" gap={18} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
