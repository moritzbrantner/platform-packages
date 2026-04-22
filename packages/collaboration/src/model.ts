import * as Automerge from "@automerge/automerge";

export type CollaborationObjectKind = "folder" | "document" | "record" | (string & {});
export type CollaborationSessionStatus = "active" | "idle" | "offline";

export interface CollaborationObject {
  id: string;
  name: string;
  kind: CollaborationObjectKind;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, string>;
}

export interface Collaborator {
  id: string;
  displayName: string;
  color: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  updatedAt: string;
  metadata: Record<string, string>;
}

export interface CollaborationSession {
  id: string;
  collaboratorId: string;
  actorId: string | null;
  deviceId: string | null;
  note: string | null;
  objectIds: string[];
  status: CollaborationSessionStatus;
  startedAt: string;
  updatedAt: string;
}

export interface CollaborationDocument extends Record<string, unknown> {
  objects: Record<string, CollaborationObject>;
  collaborators: Record<string, Collaborator>;
  sessions: Record<string, CollaborationSession>;
}

export interface UpsertCollaborationObjectInput {
  id: string;
  name: string;
  kind?: CollaborationObjectKind;
  parentId?: string | null;
  metadata?: Record<string, string>;
}

export interface UpsertCollaboratorInput {
  id: string;
  displayName?: string;
  color?: string | null;
  avatarUrl?: string | null;
  metadata?: Record<string, string>;
}

export interface UpsertCollaborationSessionInput {
  id: string;
  collaboratorId: string;
  collaboratorName?: string;
  actorId?: string;
  deviceId?: string | null;
  note?: string | null;
  objectIds?: string[];
  status?: CollaborationSessionStatus;
}

export interface UpdateCollaborationSessionInput {
  objectIds?: string[];
  status?: CollaborationSessionStatus;
  deviceId?: string | null;
  note?: string | null;
}

export interface CreateCollaborationStoreOptions {
  actorId?: string;
  initialDocument?: CollaborationDocument;
  now?: () => string;
}

export interface LoadCollaborationStoreOptions {
  actorId?: string;
  now?: () => string;
}

export interface CreateCollaborationOverviewOptions {
  generatedAt?: string;
  includeIdleSessions?: boolean;
}

export interface CollaborationOverviewCollaborator {
  id: string;
  displayName: string;
  color?: string;
}

export interface CollaborationOverviewNode {
  id: string;
  name: string;
  kind: CollaborationObjectKind;
  parentId: string | null;
  path: string;
  depth: number;
  childIds: string[];
  directActiveCollaborators: CollaborationOverviewCollaborator[];
  totalActiveCollaborators: CollaborationOverviewCollaborator[];
  directActiveCollaboratorCount: number;
  totalActiveCollaboratorCount: number;
  directActiveSessionCount: number;
  totalActiveSessionCount: number;
  children: CollaborationOverviewNode[];
}

export interface CollaborationOverviewSummary {
  activeCollaboratorCount: number;
  activeSessionCount: number;
  totalCollaboratorCount: number;
  totalObjectCount: number;
  unassignedActiveCollaboratorCount: number;
  unassignedActiveSessionCount: number;
}

export interface CollaborationOverview {
  generatedAt: string;
  summary: CollaborationOverviewSummary;
  roots: CollaborationOverviewNode[];
  rows: CollaborationOverviewNode[];
  unassignedActiveCollaborators: CollaborationOverviewCollaborator[];
}

export interface CollaborationStore {
  readonly actorId: string | undefined;
  addObject(input: UpsertCollaborationObjectInput): CollaborationObject;
  applyChanges(changes: Automerge.Change[]): Automerge.Doc<CollaborationDocument>;
  closeSession(sessionId: string): CollaborationSession | undefined;
  fork(actorId?: string): CollaborationStore;
  getChangesSince(heads?: Automerge.Heads): Automerge.Change[];
  getDocument(): Automerge.Doc<CollaborationDocument>;
  getHeads(): Automerge.Heads;
  merge(
    incoming: CollaborationStore | Automerge.Doc<CollaborationDocument>,
  ): Automerge.Doc<CollaborationDocument>;
  overview(options?: CreateCollaborationOverviewOptions): CollaborationOverview;
  removeObject(
    objectId: string,
    options?: {
      removeDescendants?: boolean;
    },
  ): Automerge.Doc<CollaborationDocument>;
  save(): Uint8Array;
  setSessionObjects(sessionId: string, objectIds: string[]): CollaborationSession;
  updateSession(sessionId: string, input: UpdateCollaborationSessionInput): CollaborationSession;
  upsertCollaborator(input: UpsertCollaboratorInput): Collaborator;
  upsertObject(input: UpsertCollaborationObjectInput): CollaborationObject;
  upsertSession(input: UpsertCollaborationSessionInput): CollaborationSession;
}

interface OverviewAccumulator {
  roots: CollaborationOverviewNode[];
  rows: CollaborationOverviewNode[];
}

interface OverviewWorkingNode {
  children: OverviewWorkingNode[];
  childIds: string[];
  depth: number;
  directActiveCollaboratorIds: Set<string>;
  directActiveSessionCount: number;
  id: string;
  kind: CollaborationObjectKind;
  name: string;
  parentId: string | null;
  path: string;
  totalActiveCollaboratorIds: Set<string>;
  totalActiveSessionCount: number;
}

const DEFAULT_OBJECT_KIND: CollaborationObjectKind = "object";
const ACTIVE_STATUSES = new Set<CollaborationSessionStatus>(["active"]);
const ACTIVE_AND_IDLE_STATUSES = new Set<CollaborationSessionStatus>(["active", "idle"]);

export function createEmptyCollaborationDocument(): CollaborationDocument {
  return {
    objects: {},
    collaborators: {},
    sessions: {},
  };
}

export function createCollaborationStore(
  options: CreateCollaborationStoreOptions = {},
): CollaborationStore {
  const initialDocument = normalizeDocument(options.initialDocument);
  const doc = Automerge.from<CollaborationDocument>(
    initialDocument,
    buildInitOptions(options.actorId),
  );

  return createStoreFromDoc(doc, options.now);
}

export function loadCollaborationStore(
  data: Uint8Array,
  options: LoadCollaborationStoreOptions = {},
): CollaborationStore {
  const doc = Automerge.load<CollaborationDocument>(data, buildInitOptions(options.actorId));

  return createStoreFromDoc(doc, options.now);
}

export function createCollaborationOverview(
  document: CollaborationDocument | Automerge.Doc<CollaborationDocument>,
  options: CreateCollaborationOverviewOptions = {},
): CollaborationOverview {
  const includedStatuses = options.includeIdleSessions ? ACTIVE_AND_IDLE_STATUSES : ACTIVE_STATUSES;
  const objects = Object.values(document.objects ?? {});
  const collaborators = document.collaborators ?? {};
  const sessions = Object.values(document.sessions ?? {}).filter((session) =>
    includedStatuses.has(session.status),
  );
  const directCollaboratorIdsByObjectId = new Map<string, Set<string>>();
  const directSessionCountByObjectId = new Map<string, number>();
  const unassignedCollaboratorIds = new Set<string>();
  let unassignedSessionCount = 0;

  for (const session of sessions) {
    const normalizedObjectIds = uniqueObjectIds(session.objectIds);
    const validObjectIds = normalizedObjectIds.filter((objectId) =>
      Boolean(document.objects[objectId]),
    );

    if (validObjectIds.length === 0) {
      unassignedCollaboratorIds.add(session.collaboratorId);
      unassignedSessionCount += 1;
      continue;
    }

    for (const objectId of validObjectIds) {
      const collaboratorIds = directCollaboratorIdsByObjectId.get(objectId) ?? new Set<string>();
      collaboratorIds.add(session.collaboratorId);
      directCollaboratorIdsByObjectId.set(objectId, collaboratorIds);
      directSessionCountByObjectId.set(
        objectId,
        (directSessionCountByObjectId.get(objectId) ?? 0) + 1,
      );
    }
  }

  const nodesById = new Map<string, OverviewWorkingNode>();

  for (const object of objects) {
    nodesById.set(object.id, {
      children: [],
      childIds: [],
      depth: 0,
      directActiveCollaboratorIds: new Set(directCollaboratorIdsByObjectId.get(object.id) ?? []),
      directActiveSessionCount: directSessionCountByObjectId.get(object.id) ?? 0,
      id: object.id,
      kind: object.kind,
      name: object.name,
      parentId: object.parentId,
      path: object.name,
      totalActiveCollaboratorIds: new Set(),
      totalActiveSessionCount: 0,
    });
  }

  const roots = Array.from(nodesById.values()).filter(
    (node) => !node.parentId || !nodesById.has(node.parentId),
  );

  for (const node of nodesById.values()) {
    if (!node.parentId) {
      continue;
    }

    const parent = nodesById.get(node.parentId);

    if (!parent) {
      continue;
    }

    parent.children.push(node);
  }

  for (const node of nodesById.values()) {
    node.children.sort(compareOverviewNode);
    node.childIds = node.children.map((child) => child.id);
  }

  roots.sort(compareOverviewNode);

  const accumulator: OverviewAccumulator = {
    roots: [],
    rows: [],
  };

  for (const root of roots) {
    accumulator.roots.push(finalizeOverviewNode(root, collaborators, document, accumulator, 0));
  }

  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    summary: {
      activeCollaboratorCount: new Set(sessions.map((session) => session.collaboratorId)).size,
      activeSessionCount: sessions.length,
      totalCollaboratorCount: Object.keys(collaborators).length,
      totalObjectCount: objects.length,
      unassignedActiveCollaboratorCount: unassignedCollaboratorIds.size,
      unassignedActiveSessionCount: unassignedSessionCount,
    },
    roots: accumulator.roots,
    rows: accumulator.rows,
    unassignedActiveCollaborators: Array.from(unassignedCollaboratorIds)
      .map((collaboratorId) =>
        toOverviewCollaborator(collaborators[collaboratorId], collaboratorId),
      )
      .sort(compareCollaborator),
  };
}

function createStoreFromDoc(
  initialDoc: Automerge.Doc<CollaborationDocument>,
  now: (() => string) | undefined,
): CollaborationStore {
  let doc = ensureDocumentShape(initialDoc);
  const clock = now ?? defaultNow;

  const change = (
    message: string,
    recipe: (draft: CollaborationDocument) => void,
  ): Automerge.Doc<CollaborationDocument> => {
    doc = Automerge.change(doc, message, recipe);
    return doc;
  };

  const store: CollaborationStore = {
    get actorId() {
      return Automerge.getActorId(doc);
    },
    addObject(input) {
      return store.upsertObject(input);
    },
    applyChanges(changes) {
      if (changes.length === 0) {
        return doc;
      }

      const [nextDoc] = Automerge.applyChanges(Automerge.clone(doc, store.actorId), changes);
      doc = ensureDocumentShape(nextDoc);
      return doc;
    },
    closeSession(sessionId) {
      const current = doc.sessions[sessionId];

      if (!current) {
        return undefined;
      }

      const updatedAt = clock();
      change(`Close session ${sessionId}`, (draft) => {
        const session = draft.sessions[sessionId];

        if (!session) {
          return;
        }

        replaceStringArray(session.objectIds, []);
        session.status = "offline";
        session.updatedAt = updatedAt;
      });

      return doc.sessions[sessionId];
    },
    fork(actorId) {
      const nextDoc = Automerge.clone(doc, normalizeActorId(actorId));
      return createStoreFromDoc(nextDoc, clock);
    },
    getChangesSince(heads) {
      return heads ? Automerge.getChangesSince(doc, heads) : Automerge.getAllChanges(doc);
    },
    getDocument() {
      return doc;
    },
    getHeads() {
      return Automerge.getHeads(doc);
    },
    merge(incoming) {
      const incomingDoc = isCollaborationStore(incoming) ? incoming.getDocument() : incoming;
      const localClone = Automerge.clone(doc, store.actorId);
      const remoteClone = Automerge.clone(incomingDoc);
      doc = ensureDocumentShape(Automerge.merge(localClone, remoteClone));
      return doc;
    },
    overview(options) {
      return createCollaborationOverview(doc, options);
    },
    removeObject(objectId, options = {}) {
      const object = doc.objects[objectId];

      if (!object) {
        return doc;
      }

      const descendants = collectDescendantIds(doc, objectId);
      const idsToRemove = new Set<string>(
        options.removeDescendants ? [objectId, ...descendants] : [objectId],
      );
      const parentId = object.parentId;
      const updatedAt = clock();

      change(`Remove object ${objectId}`, (draft) => {
        for (const session of Object.values(draft.sessions)) {
          replaceStringArray(
            session.objectIds,
            session.objectIds.filter((id) => !idsToRemove.has(id)),
          );
          session.updatedAt = updatedAt;
        }

        if (!options.removeDescendants) {
          for (const childId of descendants) {
            const child = draft.objects[childId];

            if (!child || child.parentId !== objectId) {
              continue;
            }

            child.parentId = parentId;
            child.updatedAt = updatedAt;
          }
        }

        for (const id of idsToRemove) {
          delete draft.objects[id];
        }
      });

      return doc;
    },
    save() {
      return Automerge.save(doc);
    },
    setSessionObjects(sessionId, objectIds) {
      return store.updateSession(sessionId, { objectIds });
    },
    updateSession(sessionId, input) {
      const current = doc.sessions[sessionId];

      if (!current) {
        throw new Error(`Unknown session: ${sessionId}`);
      }

      const normalizedObjectIds =
        input.objectIds === undefined ? current.objectIds : validateObjectIds(doc, input.objectIds);
      const updatedAt = clock();

      change(`Update session ${sessionId}`, (draft) => {
        const session = draft.sessions[sessionId];

        if (!session) {
          return;
        }

        if (input.deviceId !== undefined) {
          session.deviceId = input.deviceId;
        }

        if (input.note !== undefined) {
          session.note = input.note;
        }

        if (input.status !== undefined) {
          session.status = input.status;
        }

        if (input.objectIds !== undefined) {
          replaceStringArray(session.objectIds, normalizedObjectIds);
        }

        session.updatedAt = updatedAt;
      });

      return doc.sessions[sessionId];
    },
    upsertCollaborator(input) {
      const timestamp = clock();
      change(`Upsert collaborator ${input.id}`, (draft) => {
        const existing = draft.collaborators[input.id];

        if (existing) {
          existing.displayName = input.displayName ?? existing.displayName;
          if (input.color !== undefined) {
            existing.color = input.color;
          }

          if (input.avatarUrl !== undefined) {
            existing.avatarUrl = input.avatarUrl;
          }

          existing.metadata = { ...existing.metadata, ...(input.metadata ?? {}) };
          existing.updatedAt = timestamp;
          return;
        }

        draft.collaborators[input.id] = {
          id: input.id,
          displayName: input.displayName ?? input.id,
          color: input.color ?? null,
          avatarUrl: input.avatarUrl ?? null,
          joinedAt: timestamp,
          metadata: { ...(input.metadata ?? {}) },
          updatedAt: timestamp,
        };
      });

      return doc.collaborators[input.id];
    },
    upsertObject(input) {
      const existing = doc.objects[input.id];
      const nextParentId =
        input.parentId === undefined ? (existing?.parentId ?? null) : input.parentId;

      validateParentRelationship(doc, input.id, nextParentId);
      const timestamp = clock();

      change(`Upsert object ${input.id}`, (draft) => {
        const current = draft.objects[input.id];

        if (current) {
          current.name = input.name;
          current.kind = input.kind ?? current.kind;
          current.parentId = nextParentId;
          current.metadata = { ...current.metadata, ...(input.metadata ?? {}) };
          current.updatedAt = timestamp;
          return;
        }

        draft.objects[input.id] = {
          id: input.id,
          name: input.name,
          kind: input.kind ?? DEFAULT_OBJECT_KIND,
          parentId: nextParentId,
          createdAt: timestamp,
          updatedAt: timestamp,
          metadata: { ...(input.metadata ?? {}) },
        };
      });

      return doc.objects[input.id];
    },
    upsertSession(input) {
      const collaborator = doc.collaborators[input.collaboratorId];
      const collaboratorName =
        input.collaboratorName ?? collaborator?.displayName ?? input.collaboratorId;
      const objectIds = validateObjectIds(doc, input.objectIds ?? []);
      const timestamp = clock();

      if (!collaborator) {
        store.upsertCollaborator({
          displayName: collaboratorName,
          id: input.collaboratorId,
        });
      }

      change(`Upsert session ${input.id}`, (draft) => {
        const current = draft.sessions[input.id];
        const normalizedActorId = normalizeActorId(input.actorId);

        if (current) {
          if (input.actorId !== undefined) {
            current.actorId = normalizedActorId ?? null;
          }

          current.collaboratorId = input.collaboratorId;

          if (input.deviceId !== undefined) {
            current.deviceId = input.deviceId;
          }

          if (input.note !== undefined) {
            current.note = input.note;
          }

          replaceStringArray(current.objectIds, objectIds);
          current.status = input.status ?? current.status;
          current.updatedAt = timestamp;
          return;
        }

        draft.sessions[input.id] = {
          actorId: normalizedActorId ?? null,
          collaboratorId: input.collaboratorId,
          deviceId: input.deviceId ?? null,
          id: input.id,
          note: input.note ?? null,
          objectIds: [...objectIds],
          startedAt: timestamp,
          status: input.status ?? "active",
          updatedAt: timestamp,
        };
      });

      return doc.sessions[input.id];
    },
  };

  return store;
}

function normalizeDocument(document: CollaborationDocument | undefined): CollaborationDocument {
  if (!document) {
    return createEmptyCollaborationDocument();
  }

  return {
    collaborators: cloneRecord(document.collaborators, (collaborator) => ({
      ...collaborator,
      avatarUrl: collaborator.avatarUrl ?? null,
      color: collaborator.color ?? null,
      metadata: { ...(collaborator.metadata ?? {}) },
    })),
    objects: cloneRecord(document.objects, (object) => ({
      ...object,
      metadata: { ...(object.metadata ?? {}) },
    })),
    sessions: cloneRecord(document.sessions, (session) => ({
      ...session,
      actorId: session.actorId ?? null,
      deviceId: session.deviceId ?? null,
      note: session.note ?? null,
      objectIds: [...(session.objectIds ?? [])],
    })),
  };
}

function ensureDocumentShape(
  doc: Automerge.Doc<CollaborationDocument>,
): Automerge.Doc<CollaborationDocument> {
  if (doc.objects && doc.collaborators && doc.sessions) {
    return doc;
  }

  return Automerge.change(doc, "Initialize collaboration document", (draft) => {
    draft.objects ??= {};
    draft.collaborators ??= {};
    draft.sessions ??= {};
  });
}

function cloneRecord<T>(
  record: Record<string, T> | undefined,
  mapValue: (value: T) => T = (value) => value,
): Record<string, T> {
  if (!record) {
    return {};
  }

  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, mapValue(value)]));
}

function validateObjectIds(
  document: CollaborationDocument | Automerge.Doc<CollaborationDocument>,
  objectIds: string[],
): string[] {
  const ids = uniqueObjectIds(objectIds);

  for (const objectId of ids) {
    if (!document.objects[objectId]) {
      throw new Error(`Unknown object: ${objectId}`);
    }
  }

  return ids;
}

function validateParentRelationship(
  document: CollaborationDocument | Automerge.Doc<CollaborationDocument>,
  objectId: string,
  parentId: string | null,
): void {
  if (parentId === null) {
    return;
  }

  if (parentId === objectId) {
    throw new Error(`Object ${objectId} cannot be its own parent.`);
  }

  const parent = document.objects[parentId];

  if (!parent) {
    throw new Error(`Unknown parent object: ${parentId}`);
  }

  let cursor = parent.parentId;

  while (cursor) {
    if (cursor === objectId) {
      throw new Error(`Object ${objectId} cannot move under its own descendant ${parentId}.`);
    }

    cursor = document.objects[cursor]?.parentId ?? null;
  }
}

function collectDescendantIds(
  document: CollaborationDocument | Automerge.Doc<CollaborationDocument>,
  objectId: string,
): string[] {
  const descendants: string[] = [];
  const queue = [objectId];

  while (queue.length > 0) {
    const parentId = queue.shift() as string;

    for (const object of Object.values(document.objects)) {
      if (object.parentId !== parentId) {
        continue;
      }

      descendants.push(object.id);
      queue.push(object.id);
    }
  }

  return descendants;
}

function finalizeOverviewNode(
  node: OverviewWorkingNode,
  collaborators: Record<string, Collaborator>,
  document: CollaborationDocument | Automerge.Doc<CollaborationDocument>,
  accumulator: OverviewAccumulator,
  depth: number,
): CollaborationOverviewNode {
  node.depth = depth;
  const insertionIndex = accumulator.rows.length;

  for (const collaboratorId of node.directActiveCollaboratorIds) {
    node.totalActiveCollaboratorIds.add(collaboratorId);
  }

  node.totalActiveSessionCount = node.directActiveSessionCount;

  const children = node.children.map((child) =>
    finalizeOverviewNode(child, collaborators, document, accumulator, depth + 1),
  );

  for (const child of node.children) {
    for (const collaboratorId of child.totalActiveCollaboratorIds) {
      node.totalActiveCollaboratorIds.add(collaboratorId);
    }

    node.totalActiveSessionCount += child.totalActiveSessionCount;
  }

  const finalizedNode: CollaborationOverviewNode = {
    childIds: node.childIds,
    children,
    depth,
    directActiveCollaborators: Array.from(node.directActiveCollaboratorIds)
      .map((collaboratorId) =>
        toOverviewCollaborator(collaborators[collaboratorId], collaboratorId),
      )
      .sort(compareCollaborator),
    directActiveCollaboratorCount: node.directActiveCollaboratorIds.size,
    directActiveSessionCount: node.directActiveSessionCount,
    id: node.id,
    kind: node.kind,
    name: node.name,
    parentId: node.parentId,
    path: buildPath(document, node.id),
    totalActiveCollaborators: Array.from(node.totalActiveCollaboratorIds)
      .map((collaboratorId) =>
        toOverviewCollaborator(collaborators[collaboratorId], collaboratorId),
      )
      .sort(compareCollaborator),
    totalActiveCollaboratorCount: node.totalActiveCollaboratorIds.size,
    totalActiveSessionCount: node.totalActiveSessionCount,
  };

  accumulator.rows.splice(insertionIndex, 0, finalizedNode);

  return finalizedNode;
}

function buildPath(
  document: CollaborationDocument | Automerge.Doc<CollaborationDocument>,
  objectId: string,
): string {
  const path: string[] = [];
  let cursor: CollaborationObject | undefined = document.objects[objectId];
  const visited = new Set<string>();

  while (cursor && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    path.unshift(cursor.name);
    cursor = cursor.parentId ? document.objects[cursor.parentId] : undefined;
  }

  return path.join("/");
}

function compareOverviewNode(left: OverviewWorkingNode, right: OverviewWorkingNode): number {
  const leftFolderWeight = left.kind === "folder" ? 0 : 1;
  const rightFolderWeight = right.kind === "folder" ? 0 : 1;

  if (leftFolderWeight !== rightFolderWeight) {
    return leftFolderWeight - rightFolderWeight;
  }

  return left.name.localeCompare(right.name);
}

function toOverviewCollaborator(
  collaborator: Collaborator | undefined,
  collaboratorId: string,
): CollaborationOverviewCollaborator {
  return {
    color: collaborator?.color ?? undefined,
    displayName: collaborator?.displayName ?? collaboratorId,
    id: collaboratorId,
  };
}

function compareCollaborator(
  left: CollaborationOverviewCollaborator,
  right: CollaborationOverviewCollaborator,
): number {
  return left.displayName.localeCompare(right.displayName);
}

function uniqueObjectIds(objectIds: string[]): string[] {
  return Array.from(new Set(objectIds));
}

function replaceStringArray(target: string[], values: string[]): void {
  target.splice(0, target.length, ...values);
}

function defaultNow(): string {
  return new Date().toISOString();
}

function buildInitOptions(
  actorId: string | undefined,
): Automerge.InitOptions<CollaborationDocument> | undefined {
  const normalizedActorId = normalizeActorId(actorId);

  return normalizedActorId ? { actor: normalizedActorId } : undefined;
}

function normalizeActorId(actorId: string | undefined): string | undefined {
  if (!actorId) {
    return undefined;
  }

  const trimmed = actorId.trim().toLowerCase();

  if (/^[0-9a-f]+$/u.test(trimmed) && trimmed.length % 2 === 0) {
    return trimmed;
  }

  return Buffer.from(trimmed, "utf8").toString("hex");
}

function isCollaborationStore(
  value: CollaborationStore | Automerge.Doc<CollaborationDocument>,
): value is CollaborationStore {
  return typeof (value as CollaborationStore).getDocument === "function";
}
