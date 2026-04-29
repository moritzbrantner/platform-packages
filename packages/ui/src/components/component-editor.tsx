"use client";

import * as React from "react";
import { CheckIcon, CopyIcon, RotateCcwIcon } from "lucide-react";

import { cn } from "../lib/cn";
import { Button } from "./button";
import {
  InspectorPanel,
  type InspectorFieldDefinition,
  type InspectorFieldValue,
  type InspectorPanelSectionData,
} from "./inspector-panel";
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";

type ComponentEditableValue = string | number | boolean | string[] | null | undefined;

type ComponentEditorControlType =
  | "text"
  | "number"
  | "slider"
  | "boolean"
  | "select"
  | "textarea"
  | "color"
  | "className";

type ComponentEditorControl = {
  id: string;
  label: string;
  type: ComponentEditorControlType;
  value: ComponentEditableValue;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number | boolean }>;
};

type EditableComponentDefinition = {
  id: string;
  label: string;
  importName: string;
  importFrom: string;
  controls: ComponentEditorControl[];
  buildSnippet: (values: Record<string, ComponentEditableValue>) => string;
};

type BuildJsxSnippetOptions = {
  importName: string | string[];
  importFrom: string;
  componentName?: string;
  props?: Record<string, ComponentEditableValue>;
  children?: string;
  selfClosing?: boolean;
};

type ComponentEditorContextValue = {
  definitions: EditableComponentDefinition[];
  selectedId?: string;
  selectedDefinition?: EditableComponentDefinition;
  selectedValues?: Record<string, ComponentEditableValue>;
  registerDefinition: (definition: EditableComponentDefinition) => void;
  unregisterDefinition: (id: string) => void;
  selectComponent: (id: string) => void;
  getValues: (definition: EditableComponentDefinition) => Record<string, ComponentEditableValue>;
  updateValues: (id: string, values: Record<string, ComponentEditableValue>) => void;
  resetComponent: (id: string) => void;
};

type ComponentEditorProviderProps = React.PropsWithChildren<{
  defaultSelectedId?: string;
}>;

type EditableComponentProps = Omit<React.ComponentProps<"div">, "children"> & {
  definition: EditableComponentDefinition;
  children: React.ReactNode | ((values: Record<string, ComponentEditableValue>) => React.ReactNode);
};

type ComponentEditorPanelProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
};

type ComponentEditorPreviewFrameProps = React.ComponentProps<"div"> & {
  label?: React.ReactNode;
};

const ComponentEditorContext = React.createContext<ComponentEditorContextValue | null>(null);

function ComponentEditorProvider({ defaultSelectedId, children }: ComponentEditorProviderProps) {
  const [definitionsById, setDefinitionsById] = React.useState<
    Record<string, EditableComponentDefinition>
  >({});
  const [valuesById, setValuesById] = React.useState<
    Record<string, Record<string, ComponentEditableValue>>
  >({});
  const [selectedId, setSelectedId] = React.useState(defaultSelectedId);

  const registerDefinition = React.useCallback((definition: EditableComponentDefinition) => {
    setDefinitionsById((current) => ({ ...current, [definition.id]: definition }));
    setValuesById((current) => {
      if (current[definition.id]) {
        return current;
      }

      return {
        ...current,
        [definition.id]: getDefaultValues(definition),
      };
    });
  }, []);

  const unregisterDefinition = React.useCallback((id: string) => {
    setDefinitionsById((current) => {
      const { [id]: _removed, ...nextDefinitions } = current;
      return nextDefinitions;
    });
  }, []);

  const definitions = React.useMemo(
    () =>
      Object.values(definitionsById).sort((left, right) => left.label.localeCompare(right.label)),
    [definitionsById],
  );
  const selectedDefinition = selectedId ? definitionsById[selectedId] : undefined;
  const selectedValues = selectedId ? valuesById[selectedId] : undefined;

  React.useEffect(() => {
    if (selectedId || definitions.length === 0) {
      return;
    }

    setSelectedId(defaultSelectedId ?? definitions[0]?.id);
  }, [defaultSelectedId, definitions, selectedId]);

  const contextValue = React.useMemo<ComponentEditorContextValue>(
    () => ({
      definitions,
      selectedId,
      selectedDefinition,
      selectedValues,
      registerDefinition,
      unregisterDefinition,
      selectComponent: setSelectedId,
      getValues: (definition) => valuesById[definition.id] ?? getDefaultValues(definition),
      updateValues: (id, values) => {
        setValuesById((current) => ({ ...current, [id]: values }));
      },
      resetComponent: (id) => {
        const definition = definitionsById[id];

        if (!definition) {
          return;
        }

        setValuesById((current) => ({ ...current, [id]: getDefaultValues(definition) }));
      },
    }),
    [
      definitions,
      definitionsById,
      registerDefinition,
      selectedDefinition,
      selectedId,
      selectedValues,
      unregisterDefinition,
      valuesById,
    ],
  );

  return (
    <ComponentEditorContext.Provider value={contextValue}>
      {children}
    </ComponentEditorContext.Provider>
  );
}

function useComponentEditor() {
  const context = React.useContext(ComponentEditorContext);

  if (!context) {
    throw new Error("Component editor primitives must be rendered inside ComponentEditorProvider.");
  }

  return context;
}

function EditableComponent({
  definition,
  children,
  className,
  onClickCapture,
  ...props
}: EditableComponentProps) {
  const { registerDefinition, unregisterDefinition, selectComponent, selectedId, getValues } =
    useComponentEditor();
  const selected = selectedId === definition.id;
  const values = getValues(definition);

  React.useEffect(() => {
    registerDefinition(definition);

    return () => unregisterDefinition(definition.id);
  }, [definition, registerDefinition, unregisterDefinition]);

  return (
    <div
      aria-label={`Edit ${definition.label}`}
      data-slot="editable-component"
      data-selected={selected ? "true" : undefined}
      className={cn(
        "relative rounded-lg outline-none transition-[box-shadow,background-color]",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className,
      )}
      onClickCapture={(event) => {
        selectComponent(definition.id);
        onClickCapture?.(event);
      }}
      {...props}
    >
      {typeof children === "function" ? children(values) : children}
    </div>
  );
}

function ComponentEditorPanel({
  emptyTitle = "Select a component",
  emptyDescription = "Click a preview in the gallery to adjust its props and copy JSX.",
  className,
  ...props
}: ComponentEditorPanelProps) {
  const { selectedDefinition, selectedValues, updateValues, resetComponent } = useComponentEditor();
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setCopied(false);
  }, [selectedDefinition?.id, selectedValues]);

  if (!selectedDefinition || !selectedValues) {
    return (
      <div
        data-slot="component-editor-panel"
        className={cn("flex min-h-[28rem] flex-col rounded-md border bg-card p-4", className)}
        {...props}
      >
        <h2 className="text-sm font-semibold">{emptyTitle}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  const snippet = selectedDefinition.buildSnippet(selectedValues);
  const sections: InspectorPanelSectionData[] = [
    {
      id: "props",
      title: "Props",
      defaultOpen: true,
      fields: selectedDefinition.controls.map(controlToInspectorField),
    },
  ];

  const copySnippet = async () => {
    await navigator.clipboard?.writeText(snippet);
    setCopied(true);
  };

  return (
    <div
      data-slot="component-editor-panel"
      className={cn(
        "flex min-h-[32rem] flex-col overflow-hidden rounded-md border bg-card",
        className,
      )}
      {...props}
    >
      <InspectorPanel
        title={selectedDefinition.label}
        description={`Import from ${selectedDefinition.importFrom}`}
        sections={sections}
        values={selectedValues as Record<string, InspectorFieldValue>}
        onValuesChange={(values) =>
          updateValues(selectedDefinition.id, values as Record<string, ComponentEditableValue>)
        }
        onReset={() => resetComponent(selectedDefinition.id)}
        onApply={() => undefined}
        className="min-h-0 flex-1 rounded-none border-0"
      />
      <Separator />
      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">JSX</h3>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => resetComponent(selectedDefinition.id)}
            >
              <RotateCcwIcon />
              Reset
            </Button>
            <Button type="button" size="sm" onClick={copySnippet}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        <ScrollArea className="max-h-64 rounded-md border bg-muted/25">
          <pre className="overflow-x-auto p-3 text-xs leading-5">
            <code>{snippet}</code>
          </pre>
        </ScrollArea>
      </div>
    </div>
  );
}

function ComponentEditorPreviewFrame({
  label,
  className,
  children,
  ...props
}: ComponentEditorPreviewFrameProps) {
  return (
    <div
      data-slot="component-editor-preview-frame"
      className={cn("space-y-3 rounded-md border bg-background p-4", className)}
      {...props}
    >
      {label ? <p className="text-xs font-medium text-muted-foreground">{label}</p> : null}
      {children}
    </div>
  );
}

function buildJsxSnippet({
  importName,
  importFrom,
  componentName,
  props,
  children,
  selfClosing,
}: BuildJsxSnippetOptions) {
  const importNames = Array.isArray(importName) ? importName : [importName];
  const renderedComponentName = componentName ?? importNames[0] ?? "Component";
  const renderedProps = renderJsxProps(props ?? {});
  const openTag = renderedProps
    ? `<${renderedComponentName} ${renderedProps}`
    : `<${renderedComponentName}`;
  const importLine = `import { ${importNames.join(", ")} } from "${importFrom}";`;

  if (selfClosing ?? !children) {
    return `${importLine}\n\n${openTag} />`;
  }

  return `${importLine}\n\n${openTag}>\n  ${children}\n</${renderedComponentName}>`;
}

function controlToInspectorField(control: ComponentEditorControl): InspectorFieldDefinition {
  return {
    id: control.id,
    label: control.label,
    type: control.type,
    value: control.value,
    description: control.description,
    min: control.min,
    max: control.max,
    step: control.step,
    placeholder: control.placeholder,
    options: control.options,
  };
}

function getDefaultValues(definition: EditableComponentDefinition) {
  return definition.controls.reduce<Record<string, ComponentEditableValue>>((values, control) => {
    values[control.id] = control.value;
    return values;
  }, {});
}

function renderJsxProps(props: Record<string, ComponentEditableValue>) {
  return Object.entries(props)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${formatJsxValue(value)}`)
    .join(" ");
}

function formatJsxValue(value: ComponentEditableValue) {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return `{${String(value)}}`;
  }

  if (Array.isArray(value)) {
    return `{${JSON.stringify(value)}}`;
  }

  return "{undefined}";
}

export {
  ComponentEditorPanel,
  ComponentEditorPreviewFrame,
  ComponentEditorProvider,
  EditableComponent,
  buildJsxSnippet,
  useComponentEditor,
};
export type {
  BuildJsxSnippetOptions,
  ComponentEditableValue,
  ComponentEditorControl,
  ComponentEditorControlType,
  ComponentEditorPanelProps,
  ComponentEditorPreviewFrameProps,
  EditableComponentDefinition,
  EditableComponentProps,
};
