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

function LabNode({ data }: NodeProps<Node<LabData, "lab">>) {
  const status = STATUS_LABEL[data.status] ?? data.status;
  return (
    <article className="lab-node" data-status={data.status} aria-label={`${data.label}: ${status}`}>
      <Handle type="target" position={Position.Left} />
      <header>
        <span>{data.caption}</span>
        <span className="pip" aria-hidden="true" />
      </header>
      <strong>{data.label}</strong>
      <p>{data.detail || status}</p>
      <Handle type="source" position={Position.Right} />
    </article>
  );
}

const nodeTypes = { lab: LabNode };

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
  const nodes: Node<LabData, "lab">[] = definition.nodes.map((node, index) => {
    const component = statusById.get(node.id);
    return {
      id: node.id,
      type: "lab",
      position: POSITIONS[node.id] ?? {
        x: (index % 3) * 260,
        y: Math.floor(index / 3) * 180,
      },
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
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
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
        proOptions={{ hideAttribution: false }}
      >
        <FrameFit signature={`${definition.id}:${definition.nodes.length}`} />
        <Background color="#e4d9c8" gap={18} />
        <Controls showInteractive={false} aria-label="Zoom do diagrama" />
      </ReactFlow>
    </div>
  );
}
