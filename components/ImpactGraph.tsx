"use client"

import { useMemo, useState } from "react"
import type { PRAnalysisReport } from "@/types"

interface Props {
  report: PRAnalysisReport
}

type NodeType = "core" | "impact" | "file" | "critical" | "test" | "context" | "action" | "more"

interface GraphNode {
  id: string
  type: NodeType
  label: string
  subtitle: string
  detail: string
  chips?: string[]
  x: number
  y: number
  radius: number
}

interface GraphEdge {
  from: string
  to: string
  tone: "primary" | "risk" | "support" | "file"
}

const NODE_STYLE: Record<NodeType, { fill: string; stroke: string; text: string; ring: string }> = {
  core: {
    fill: "rgba(37,99,235,0.22)",
    stroke: "rgba(147,197,253,0.9)",
    text: "fill-blue-100",
    ring: "rgba(59,130,246,0.24)",
  },
  impact: {
    fill: "rgba(14,165,233,0.12)",
    stroke: "rgba(125,211,252,0.7)",
    text: "fill-cyan-100",
    ring: "rgba(14,165,233,0.16)",
  },
  file: {
    fill: "rgba(99,102,241,0.18)",
    stroke: "rgba(165,180,252,0.82)",
    text: "fill-indigo-100",
    ring: "rgba(99,102,241,0.17)",
  },
  critical: {
    fill: "rgba(239,68,68,0.18)",
    stroke: "rgba(252,165,165,0.85)",
    text: "fill-red-100",
    ring: "rgba(239,68,68,0.18)",
  },
  test: {
    fill: "rgba(16,185,129,0.16)",
    stroke: "rgba(110,231,183,0.78)",
    text: "fill-emerald-100",
    ring: "rgba(16,185,129,0.16)",
  },
  context: {
    fill: "rgba(168,85,247,0.16)",
    stroke: "rgba(216,180,254,0.72)",
    text: "fill-purple-100",
    ring: "rgba(168,85,247,0.16)",
  },
  action: {
    fill: "rgba(234,179,8,0.16)",
    stroke: "rgba(253,224,71,0.75)",
    text: "fill-yellow-100",
    ring: "rgba(234,179,8,0.16)",
  },
  more: {
    fill: "rgba(148,163,184,0.12)",
    stroke: "rgba(203,213,225,0.55)",
    text: "fill-slate-200",
    ring: "rgba(148,163,184,0.12)",
  },
}

const EDGE_STYLE: Record<GraphEdge["tone"], string> = {
  primary: "rgba(96,165,250,0.36)",
  risk: "rgba(248,113,113,0.45)",
  support: "rgba(45,212,191,0.32)",
  file: "rgba(165,180,252,0.42)",
}

const MAX_FILE_NODES = 14

export default function ImpactGraph({ report }: Props) {
  const { nodes, edges } = useMemo(() => buildGraph(report), [report])
  const [selectedId, setSelectedId] = useState(nodes[0]?.id ?? "")
  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0]
  const selectedConnections = getConnections(selected?.id, nodes, edges)

  if (!nodes.length) return null

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="border-b border-white/10 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">PR Impact Constellation</p>
            <h3 className="mt-2 text-3xl font-black tracking-tight text-white">Affected file knowledge graph</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              A clickable graph of the files touched by this PR, grouped by impact area and connected to risk, tests, and
              review evidence.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <Legend color="bg-blue-300" label="PR" />
            <Legend color="bg-cyan-300" label="Impact" />
            <Legend color="bg-indigo-300" label="File" />
            <Legend color="bg-red-300" label="Critical" />
            <Legend color="bg-emerald-300" label="Tests" />
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[1fr_360px]">
        <div className="relative min-h-[620px] overflow-hidden bg-slate-950/35">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_68%_48%,rgba(99,102,241,0.18),transparent_30rem),radial-gradient(circle_at_22%_40%,rgba(14,165,233,0.12),transparent_24rem)]" />
          <svg viewBox="0 0 1120 660" className="relative h-full min-h-[620px] w-full">
            <defs>
              <filter id="nodeGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="7" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="edgeGradient" x1="0%" x2="100%">
                <stop offset="0%" stopColor="rgba(96,165,250,0.1)" />
                <stop offset="50%" stopColor="rgba(125,211,252,0.7)" />
                <stop offset="100%" stopColor="rgba(96,165,250,0.1)" />
              </linearGradient>
              <pattern id="graphGrid" width="42" height="42" patternUnits="userSpaceOnUse">
                <path d="M 42 0 L 0 0 0 42" fill="none" stroke="rgba(148,163,184,0.07)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="1120" height="660" fill="url(#graphGrid)" />

            {edges.map((edge, index) => {
              const from = nodes.find((node) => node.id === edge.from)
              const to = nodes.find((node) => node.id === edge.to)
              if (!from || !to) return null
              const connectedToSelected = selectedId === edge.from || selectedId === edge.to

              return (
                <g key={`${edge.from}-${edge.to}`}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={EDGE_STYLE[edge.tone]}
                    strokeWidth={connectedToSelected ? 2.4 : 1.15}
                    strokeDasharray={edge.tone === "support" ? "5 8" : undefined}
                  />
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={connectedToSelected ? "url(#edgeGradient)" : EDGE_STYLE[edge.tone]}
                    strokeLinecap="round"
                    strokeWidth={connectedToSelected ? 2.8 : 1.6}
                    strokeDasharray="1 18"
                    opacity={connectedToSelected ? 0.95 : 0.38}
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-120"
                      dur={`${5 + (index % 4)}s`}
                      repeatCount="indefinite"
                    />
                  </line>
                </g>
              )
            })}

            {nodes.map((node, index) => {
              const style = NODE_STYLE[node.type]
              const selectedNode = selectedId === node.id
              const pulseNode = selectedNode || node.type === "critical" || node.type === "core"

              return (
                <g
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={node.label}
                  onClick={() => setSelectedId(node.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") setSelectedId(node.id)
                  }}
                  className="cursor-pointer outline-none"
                >
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`0 0; ${nodeDrift(index).x} ${nodeDrift(index).y}; 0 0`}
                    dur={`${7 + (index % 5)}s`}
                    begin={`${(index % 6) * 0.35}s`}
                    repeatCount="indefinite"
                  />
                  <circle cx={node.x} cy={node.y} r={node.radius + 12} fill={style.ring} opacity={selectedNode ? 0.95 : 0.35} />
                  {pulseNode && (
                    <circle cx={node.x} cy={node.y} r={node.radius + 16} fill="none" stroke={style.stroke} strokeWidth="1.5" opacity="0.28">
                      <animate attributeName="r" values={`${node.radius + 7};${node.radius + 26};${node.radius + 7}`} dur="2.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.42;0;0.42" dur="2.8s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {node.type === "file" || node.type === "critical" ? (
                    <rect
                      x={node.x - node.radius}
                      y={node.y - node.radius * 0.72}
                      width={node.radius * 2}
                      height={node.radius * 1.44}
                      rx="16"
                      fill={style.fill}
                      stroke={style.stroke}
                      strokeWidth={selectedNode ? 3 : 1.5}
                      filter={selectedNode ? "url(#nodeGlow)" : undefined}
                    >
                      {selectedNode && (
                        <animate
                          attributeName="stroke-width"
                          values="2.2;4;2.2"
                          dur="1.8s"
                          repeatCount="indefinite"
                        />
                      )}
                    </rect>
                  ) : (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={selectedNode ? 3 : 1.5}
                    filter={selectedNode ? "url(#nodeGlow)" : undefined}
                  >
                    {selectedNode && (
                      <animate
                        attributeName="stroke-width"
                        values="2.2;4;2.2"
                        dur="1.8s"
                        repeatCount="indefinite"
                      />
                    )}
                  </circle>
                  )}
                  <text
                    x={node.x}
                    y={node.y - 3}
                    textAnchor="middle"
                    className={`pointer-events-none text-[12px] font-black ${style.text}`}
                  >
                    {shortLabel(node.label, node.type === "file" || node.type === "critical" ? 20 : 16)}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 16}
                    textAnchor="middle"
                    className="pointer-events-none fill-slate-400 text-[10px] font-semibold uppercase tracking-wider"
                  >
                    {node.subtitle}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <aside className="border-t border-white/10 bg-slate-950/65 p-6 xl:border-l xl:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">Selected node</p>
          <h4 className="mt-3 break-words text-2xl font-black tracking-tight text-white">{selected.label}</h4>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{selected.subtitle}</p>
          <p className="mt-5 whitespace-pre-line break-words text-sm leading-7 text-slate-300">{selected.detail}</p>

          {selected.chips && selected.chips.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {selected.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 text-xs font-medium text-slate-300"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          {selectedConnections.length > 0 && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Connected nodes</p>
              <div className="mt-3 space-y-2">
                {selectedConnections.slice(0, 6).map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedId(node.id)}
                    className="flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-blue-400/40 hover:text-white"
                  >
                    <span className="min-w-0 truncate">{node.label}</span>
                    <span className="shrink-0 uppercase tracking-wider text-slate-500">{node.type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">How to use this</p>
            <p className="mt-2 text-xs leading-6 text-slate-400">
              Click a file node first. Follow its impact-area edge to understand the feature surface, then check whether
              it has red risk links or green test evidence before reviewing the diff.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

function buildGraph(report: PRAnalysisReport) {
  const nodes: GraphNode[] = [
    {
      id: "core",
      type: "core",
      label: "PR Core",
      subtitle: `${report.risk.level} ${report.risk.score}/10`,
      detail: `${report.summary}\n\nChanged files: ${report.meta.files_changed}. Additions: +${report.meta.additions}. Deletions: -${report.meta.deletions}.`,
      chips: [report.meta.head_branch, report.meta.base_branch, `${report.meta.files_changed} files`],
      x: 185,
      y: 330,
      radius: 58,
    },
  ]
  const edges: GraphEdge[] = []

  const criticalByFile = new Map(report.critical_files.map((file) => [file.file, file]))
  const fileToImpactIds = new Map<string, string[]>()
  const visibleFiles = Array.from(new Set(report.impact_map.flatMap((impact) => impact.files))).slice(0, MAX_FILE_NODES)
  const hiddenFileCount = Math.max(report.meta.files_changed - visibleFiles.length, 0)
  const impactPositions = positionOnArc(report.impact_map.slice(0, 5).length, 390, 330, 210, -72, 72)

  report.impact_map.slice(0, 5).forEach((impact, index) => {
    const position = impactPositions[index]
    const id = `impact-${index}`
    nodes.push({
      id,
      type: "impact",
      label: impact.area,
      subtitle: `${impact.files.length} files`,
      detail: `${impact.description}\n\nReview focus: ${impact.review_focus}\n\nFiles:\n${impact.files.join("\n")}`,
      chips: impact.signals.slice(0, 4),
      x: position.x,
      y: position.y,
      radius: 46,
    })
    edges.push({ from: "core", to: id, tone: "primary" })

    impact.files.forEach((file) => {
      const ids = fileToImpactIds.get(file) ?? []
      ids.push(id)
      fileToImpactIds.set(file, ids)
    })
  })

  const filePositions = positionOnArc(visibleFiles.length, 780, 330, 245, -112, 112)
  visibleFiles.forEach((file, index) => {
    const critical = criticalByFile.get(file)
    const position = filePositions[index]
    const id = fileNodeId(file)
    const impactIds = fileToImpactIds.get(file) ?? []
    nodes.push({
      id,
      type: critical ? "critical" : "file",
      label: basename(file),
      subtitle: critical ? `${critical.risk_contribution} risk` : "affected file",
      detail: critical
        ? `${file}\n\nWhy it matters: ${critical.reason}`
        : `${file}\n\nThis file is part of the PR change set. Use its connected impact-area nodes to understand what behavior it may affect.`,
      chips: [directoryName(file), ...impactIds.map((impactId) => nodes.find((node) => node.id === impactId)?.label ?? "").filter(Boolean)],
      x: position.x,
      y: position.y,
      radius: critical ? 52 : 48,
    })

    edges.push({ from: "core", to: id, tone: critical ? "risk" : "file" })
    impactIds.forEach((impactId) => edges.push({ from: impactId, to: id, tone: critical ? "risk" : "file" }))
  })

  if (hiddenFileCount > 0) {
    nodes.push({
      id: "more-files",
      type: "more",
      label: `+${hiddenFileCount} more`,
      subtitle: "files",
      detail: `${hiddenFileCount} additional changed files are included in the PR but hidden here to keep the graph readable. See the Impact Map below for the full grouped list.`,
      x: 970,
      y: 330,
      radius: 44,
    })
    edges.push({ from: "core", to: "more-files", tone: "file" })
  }

  const tests = report.repo_context?.related_tests ?? []
  if (tests.length > 0) {
    nodes.push({
      id: "tests",
      type: "test",
      label: `${tests.length} tests`,
      subtitle: "related",
      detail: `Related tests found by Repo Context Lite:\n${tests.map((file) => file.path).join("\n")}`,
      chips: tests.slice(0, 4).map((file) => basename(file.path)),
      x: 250,
      y: 560,
      radius: 39,
    })
    edges.push({ from: "core", to: "tests", tone: "support" })
    connectEvidenceToFiles("tests", tests.map((file) => file.path), visibleFiles, edges)
  } else {
    nodes.push({
      id: "tests",
      type: "test",
      label: "No tests",
      subtitle: "sampled",
      detail: "Repo Context Lite did not find likely related tests in the sampled paths. Treat this as a prompt to verify coverage manually.",
      x: 250,
      y: 560,
      radius: 39,
    })
    edges.push({ from: "core", to: "tests", tone: "support" })
  }

  const contextCount =
    (report.repo_context?.manifests.length ?? 0) +
    (report.repo_context?.docs.length ?? 0) +
    (report.repo_context?.nearby_files.length ?? 0) +
    (report.repo_context?.similar_files.length ?? 0)

  nodes.push({
    id: "context",
    type: "context",
    label: `${contextCount} context`,
    subtitle: "repo hints",
    detail:
      report.repo_context?.notes.join("\n") ||
      "Repo Context Lite samples manifests, docs, nearby files, similar files, imports, and tests to improve the briefing.",
    chips: [
      `${report.repo_context?.manifests.length ?? 0} manifests`,
      `${report.repo_context?.nearby_files.length ?? 0} nearby`,
      `${report.repo_context?.similar_files.length ?? 0} similar`,
    ],
    x: 92,
    y: 122,
    radius: 39,
  })
  edges.push({ from: "core", to: "context", tone: "support" })

  const firstAction = report.review_checklist?.[0] ?? report.review_strategy[0]
  nodes.push({
    id: "action",
    type: "action",
    label: "Next action",
    subtitle: "review",
    detail: firstAction
      ? "task" in firstAction
        ? `${firstAction.task}: ${firstAction.reason}`
        : `${firstAction.action}: ${firstAction.reason}`
      : "Use the critical files and impact areas to choose the first review action.",
    x: 92,
    y: 538,
    radius: 42,
  })
  edges.push({ from: "core", to: "action", tone: "primary" })

  return { nodes, edges }
}

function getConnections(selectedId: string | undefined, nodes: GraphNode[], edges: GraphEdge[]) {
  if (!selectedId) return []

  return edges
    .filter((edge) => edge.from === selectedId || edge.to === selectedId)
    .map((edge) => nodes.find((node) => node.id === (edge.from === selectedId ? edge.to : edge.from)))
    .filter((node): node is GraphNode => Boolean(node))
}

function connectEvidenceToFiles(evidenceId: string, evidencePaths: string[], visibleFiles: string[], edges: GraphEdge[]) {
  visibleFiles.forEach((file) => {
    const base = normalizeName(file)
    const related = evidencePaths.some((path) => normalizeName(path).includes(base) || base.includes(normalizeName(path)))

    if (related) {
      edges.push({ from: evidenceId, to: fileNodeId(file), tone: "support" })
    }
  })
}

function positionOnArc(count: number, centerX: number, centerY: number, radius: number, startDeg: number, endDeg: number) {
  if (count <= 0) return []
  if (count === 1) return [{ x: centerX, y: centerY }]

  return Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1)
    const angle = degreesToRadians(startDeg + (endDeg - startDeg) * progress)

    return {
      x: Math.round(centerX + Math.cos(angle) * radius),
      y: Math.round(centerY + Math.sin(angle) * radius),
    }
  })
}

function degreesToRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}

function nodeDrift(index: number) {
  const angle = degreesToRadians((index * 57) % 360)
  const distance = 4 + (index % 4)

  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
  }
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/45 px-2.5 py-1">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  )
}

function basename(value: string) {
  return value.split("/").pop() ?? value
}

function directoryName(value: string) {
  const parts = value.split("/")
  if (parts.length <= 1) return "root"
  return parts.slice(0, -1).join("/")
}

function fileNodeId(value: string) {
  return `file-${value.replace(/[^a-zA-Z0-9_-]/g, "-")}`
}

function normalizeName(value: string) {
  return basename(value).replace(/\.(test|spec)?\.[^.]+$/, "").replace(/\.[^.]+$/, "").toLowerCase()
}

function shortLabel(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 3)}...`
}
