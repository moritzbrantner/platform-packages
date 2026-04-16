import type { ReactNode } from "react";

import {
  createCollaborationOverview,
  type CollaborationDocument,
  type CollaborationOverview as CollaborationOverviewData,
  type CollaborationOverviewNode,
  type CollaborationStore,
} from "./model";

export interface CollaborationOverviewTableProps {
  emptyMessage?: ReactNode;
  overview: CollaborationOverviewData;
}

export interface CollaborationOverviewTreeProps {
  emptyMessage?: ReactNode;
  overview: CollaborationOverviewData;
}

export interface CollaborationOverviewViewProps {
  document: CollaborationDocument | CollaborationStore;
  emptyMessage?: ReactNode;
  includeIdleSessions?: boolean;
  layout?: "table" | "tree";
}

export function CollaborationOverviewTable({
  emptyMessage = "No objects are being tracked yet.",
  overview,
}: CollaborationOverviewTableProps) {
  if (overview.rows.length === 0) {
    return <div>{emptyMessage}</div>;
  }

  return (
    <table aria-label="Collaboration overview">
      <thead>
        <tr>
          <th align="left">Object</th>
          <th align="left">Kind</th>
          <th align="right">Direct people</th>
          <th align="right">Subtree people</th>
          <th align="right">Sessions</th>
          <th align="left">Who</th>
        </tr>
      </thead>
      <tbody>
        {overview.rows.map((node) => (
          <tr key={node.id}>
            <td>{`${"  ".repeat(node.depth)}${node.name}`}</td>
            <td>{node.kind}</td>
            <td align="right">{node.directActiveCollaboratorCount}</td>
            <td align="right">{node.totalActiveCollaboratorCount}</td>
            <td align="right">{node.totalActiveSessionCount}</td>
            <td>{formatCollaboratorNames(node)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CollaborationOverviewTree({
  emptyMessage = "No objects are being tracked yet.",
  overview,
}: CollaborationOverviewTreeProps) {
  if (overview.roots.length === 0) {
    return <div>{emptyMessage}</div>;
  }

  return (
    <div aria-label="Collaboration tree">
      <ul>
        {overview.roots.map((node) => (
          <CollaborationOverviewTreeNode key={node.id} node={node} />
        ))}
      </ul>
    </div>
  );
}

export function CollaborationOverviewView({
  document,
  emptyMessage,
  includeIdleSessions = false,
  layout = "table",
}: CollaborationOverviewViewProps) {
  const overview = resolveOverview(document, includeIdleSessions);

  if (layout === "tree") {
    return <CollaborationOverviewTree emptyMessage={emptyMessage} overview={overview} />;
  }

  return <CollaborationOverviewTable emptyMessage={emptyMessage} overview={overview} />;
}

function CollaborationOverviewTreeNode({ node }: { node: CollaborationOverviewNode }) {
  return (
    <li>
      <span>{node.name}</span>
      <span>{` (${node.directActiveCollaboratorCount} direct, ${node.totalActiveCollaboratorCount} in subtree)`}</span>
      {node.totalActiveCollaborators.length > 0 ? (
        <span>{`: ${node.totalActiveCollaborators.map((collaborator) => collaborator.displayName).join(", ")}`}</span>
      ) : null}
      {node.children.length > 0 ? (
        <ul>
          {node.children.map((child) => (
            <CollaborationOverviewTreeNode key={child.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function resolveOverview(
  document: CollaborationDocument | CollaborationStore,
  includeIdleSessions: boolean,
): CollaborationOverviewData {
  if (isCollaborationStore(document)) {
    return document.overview({
      includeIdleSessions,
    });
  }

  return createCollaborationOverview(document, { includeIdleSessions });
}

function formatCollaboratorNames(node: CollaborationOverviewNode): string {
  const names =
    node.directActiveCollaborators.length > 0
      ? node.directActiveCollaborators.map((collaborator) => collaborator.displayName)
      : node.totalActiveCollaborators.map((collaborator) => collaborator.displayName);

  return names.length > 0 ? names.join(", ") : "None";
}

function isCollaborationStore(
  document: CollaborationDocument | CollaborationStore,
): document is CollaborationStore {
  return typeof (document as CollaborationStore).overview === "function";
}
