"use client";

import * as React from "react";
import { FilterIcon, FolderPlusIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { cn } from "../lib/cn";
import { Badge } from "./badge";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { NativeSelect, NativeSelectOption } from "./native-select";
import { Separator } from "./separator";

type QueryBuilderFieldType = "text" | "number" | "date" | "boolean" | "select" | "multi-select";

type QueryBuilderFieldOption = {
  label: string;
  value: string | number | boolean;
};

type QueryBuilderField = {
  id: string;
  label: string;
  type: QueryBuilderFieldType;
  operators?: string[];
  options?: QueryBuilderFieldOption[];
};

type QueryBuilderRuleData = {
  id: string;
  fieldId: string;
  operator: string;
  value: unknown;
};

type QueryBuilderGroupData = {
  id: string;
  combinator: "and" | "or";
  rules: Array<QueryBuilderRuleData | QueryBuilderGroupData>;
};

type QueryBuilderExpression = QueryBuilderGroupData;

type QueryBuilderProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  fields: QueryBuilderField[];
  expression?: QueryBuilderExpression;
  defaultExpression?: QueryBuilderExpression;
  onExpressionChange?: (expression: QueryBuilderExpression) => void;
  maxDepth?: number;
  readOnly?: boolean;
  validationMessages?: Record<string, React.ReactNode>;
};

type QueryBuilderGroupProps = React.ComponentProps<"div"> & {
  group: QueryBuilderGroupData;
  fields: QueryBuilderField[];
  depth?: number;
  maxDepth?: number;
  readOnly?: boolean;
  root?: boolean;
  validationMessages?: Record<string, React.ReactNode>;
  onGroupChange?: (group: QueryBuilderGroupData) => void;
  onRemove?: () => void;
};

type QueryBuilderRuleProps = React.ComponentProps<"div"> & {
  rule: QueryBuilderRuleData;
  fields: QueryBuilderField[];
  readOnly?: boolean;
  validationMessage?: React.ReactNode;
  onRuleChange?: (rule: QueryBuilderRuleData) => void;
  onRemove?: () => void;
};

const queryBuilderOperatorLabels: Record<string, string> = {
  after: "after",
  before: "before",
  contains: "contains",
  contains_all: "contains all",
  empty: "is empty",
  ends_with: "ends with",
  equals: "equals",
  gt: ">",
  gte: ">=",
  includes: "includes",
  lt: "<",
  lte: "<=",
  not_empty: "is not empty",
  not_equals: "does not equal",
  not_includes: "does not include",
  not_on: "is not on",
  on: "is on",
  starts_with: "starts with",
};

function QueryBuilder({
  fields,
  expression,
  defaultExpression,
  onExpressionChange,
  maxDepth = 3,
  readOnly = false,
  validationMessages,
  className,
  ...props
}: QueryBuilderProps) {
  const [internalExpression, setInternalExpression] = React.useState<QueryBuilderExpression>(
    defaultExpression ?? createQueryBuilderGroup(fields),
  );
  const currentExpression = expression ?? internalExpression;

  const commitExpression = (nextExpression: QueryBuilderExpression) => {
    setInternalExpression(nextExpression);
    onExpressionChange?.(nextExpression);
  };

  return (
    <div
      data-slot="query-builder"
      data-read-only={readOnly ? "true" : undefined}
      className={cn("space-y-3 rounded-md border bg-card p-3 text-card-foreground", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FilterIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          Query
          <Badge variant="secondary">{countQueryBuilderRules(currentExpression)} rules</Badge>
        </div>
        {validationMessages?.[currentExpression.id] ? (
          <div className="text-xs text-destructive">{validationMessages[currentExpression.id]}</div>
        ) : null}
      </div>
      <QueryBuilderGroup
        group={currentExpression}
        fields={fields}
        root
        readOnly={readOnly}
        maxDepth={maxDepth}
        validationMessages={validationMessages}
        onGroupChange={commitExpression}
      />
    </div>
  );
}

function QueryBuilderGroup({
  group,
  fields,
  depth = 0,
  maxDepth = 3,
  readOnly,
  root,
  validationMessages,
  onGroupChange,
  onRemove,
  className,
  ...props
}: QueryBuilderGroupProps) {
  const canNest = depth < maxDepth;

  const updateRuleAt = (index: number, nextRule: QueryBuilderRuleData | QueryBuilderGroupData) => {
    onGroupChange?.({
      ...group,
      rules: group.rules.map((rule, ruleIndex) => (ruleIndex === index ? nextRule : rule)),
    });
  };

  const removeRuleAt = (index: number) => {
    onGroupChange?.({
      ...group,
      rules: group.rules.filter((_, ruleIndex) => ruleIndex !== index),
    });
  };

  return (
    <div
      data-slot="query-builder-group"
      data-depth={depth}
      className={cn(
        "space-y-3 rounded-md border bg-background p-3",
        depth > 0 && "border-dashed bg-muted/20",
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          aria-label={root ? "Root combinator" : "Group combinator"}
          value={group.combinator}
          disabled={readOnly}
          onChange={(event) =>
            onGroupChange?.({ ...group, combinator: event.currentTarget.value as "and" | "or" })
          }
        >
          <NativeSelectOption value="and">All rules</NativeSelectOption>
          <NativeSelectOption value="or">Any rule</NativeSelectOption>
        </NativeSelect>
        <span className="text-xs text-muted-foreground">match in this group</span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={readOnly || fields.length === 0}
            onClick={() =>
              onGroupChange?.({
                ...group,
                rules: [...group.rules, createQueryBuilderRule(fields)],
              })
            }
          >
            <PlusIcon />
            Add rule
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={readOnly || !canNest || fields.length === 0}
            onClick={() =>
              onGroupChange?.({
                ...group,
                rules: [...group.rules, createQueryBuilderGroup(fields)],
              })
            }
          >
            <FolderPlusIcon />
            Add group
          </Button>
          {!root ? (
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove group" disabled={readOnly} onClick={onRemove}>
              <Trash2Icon />
            </Button>
          ) : null}
        </div>
      </div>
      {group.rules.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          No rules in this group.
        </div>
      ) : (
        <div className="space-y-2">
          {group.rules.map((rule, index) =>
            isQueryBuilderGroup(rule) ? (
              <QueryBuilderGroup
                key={rule.id}
                group={rule}
                fields={fields}
                depth={depth + 1}
                maxDepth={maxDepth}
                readOnly={readOnly}
                validationMessages={validationMessages}
                onGroupChange={(nextGroup) => updateRuleAt(index, nextGroup)}
                onRemove={() => removeRuleAt(index)}
              />
            ) : (
              <QueryBuilderRule
                key={rule.id}
                rule={rule}
                fields={fields}
                readOnly={readOnly}
                validationMessage={validationMessages?.[rule.id]}
                onRuleChange={(nextRule) => updateRuleAt(index, nextRule)}
                onRemove={() => removeRuleAt(index)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function QueryBuilderRule({
  rule,
  fields,
  readOnly,
  validationMessage,
  onRuleChange,
  onRemove,
  className,
  ...props
}: QueryBuilderRuleProps) {
  const field = fields.find((item) => item.id === rule.fieldId) ?? fields[0];
  const operators = field ? getQueryBuilderOperators(field) : [];
  const operator = operators.includes(rule.operator) ? rule.operator : operators[0] ?? "equals";

  const changeField = (fieldId: string) => {
    const nextField = fields.find((item) => item.id === fieldId) ?? fields[0];
    const nextOperator = nextField ? getQueryBuilderOperators(nextField)[0] ?? "equals" : "equals";
    onRuleChange?.({
      id: rule.id,
      fieldId,
      operator: nextOperator,
      value: getDefaultQueryBuilderValue(nextField),
    });
  };

  return (
    <div
      data-slot="query-builder-rule"
      className={cn("rounded-md border bg-card p-2", className)}
      {...props}
    >
      <div className="grid gap-2 md:grid-cols-[minmax(9rem,1fr)_minmax(8rem,0.8fr)_minmax(10rem,1fr)_auto] md:items-center">
        <NativeSelect
          aria-label="Rule field"
          value={field?.id ?? ""}
          disabled={readOnly}
          onChange={(event) => changeField(event.currentTarget.value)}
        >
          {fields.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Rule operator"
          value={operator}
          disabled={readOnly}
          onChange={(event) => onRuleChange?.({ ...rule, operator: event.currentTarget.value })}
        >
          {operators.map((operatorName) => (
            <NativeSelectOption key={operatorName} value={operatorName}>
              {queryBuilderOperatorLabels[operatorName] ?? operatorName}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <QueryBuilderValueEditor
          field={field}
          rule={{ ...rule, operator }}
          readOnly={readOnly || operator === "empty" || operator === "not_empty"}
          onValueChange={(value) => onRuleChange?.({ ...rule, operator, value })}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remove rule"
          disabled={readOnly}
          onClick={onRemove}
        >
          <Trash2Icon />
        </Button>
      </div>
      {validationMessage ? (
        <>
          <Separator className="my-2" />
          <div className="text-xs text-destructive">{validationMessage}</div>
        </>
      ) : null}
    </div>
  );
}

function QueryBuilderValueEditor({
  field,
  rule,
  readOnly,
  onValueChange,
}: {
  field?: QueryBuilderField;
  rule: QueryBuilderRuleData;
  readOnly?: boolean;
  onValueChange?: (value: unknown) => void;
}) {
  if (!field || rule.operator === "empty" || rule.operator === "not_empty") {
    return <Input aria-label="Rule value" value="" disabled placeholder="No value" />;
  }

  if (field.type === "boolean") {
    return (
      <label className="flex h-8 items-center gap-2 rounded-md border px-2 text-sm">
        <Checkbox
          aria-label="Rule value"
          checked={Boolean(rule.value)}
          disabled={readOnly}
          onCheckedChange={(checked) => onValueChange?.(checked === true)}
        />
        true
      </label>
    );
  }

  if (field.type === "select" || field.type === "multi-select") {
    return (
      <NativeSelect
        aria-label="Rule value"
        value={String(Array.isArray(rule.value) ? rule.value[0] ?? "" : rule.value ?? "")}
        disabled={readOnly}
        onChange={(event) =>
          onValueChange?.(
            field.type === "multi-select" ? [event.currentTarget.value] : event.currentTarget.value,
          )
        }
      >
        {(field.options ?? []).map((option) => (
          <NativeSelectOption key={String(option.value)} value={String(option.value)}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    );
  }

  return (
    <Input
      aria-label="Rule value"
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      value={String(rule.value ?? "")}
      disabled={readOnly}
      onChange={(event) =>
        onValueChange?.(
          field.type === "number" ? Number(event.currentTarget.value) : event.currentTarget.value,
        )
      }
    />
  );
}

function evaluateQueryBuilderExpression(
  expression: QueryBuilderExpression,
  row: Record<string, unknown>,
  fields: QueryBuilderField[] = [],
): boolean {
  const evaluations = expression.rules.map((rule) =>
    isQueryBuilderGroup(rule)
      ? evaluateQueryBuilderExpression(rule, row, fields)
      : evaluateQueryBuilderRule(rule, row, fields.find((field) => field.id === rule.fieldId)),
  );

  if (expression.combinator === "or") {
    return evaluations.some(Boolean);
  }

  return evaluations.every(Boolean);
}

function serializeQueryBuilderExpression(expression: QueryBuilderExpression): string {
  return JSON.stringify(expression);
}

function evaluateQueryBuilderRule(
  rule: QueryBuilderRuleData,
  row: Record<string, unknown>,
  field?: QueryBuilderField,
): boolean {
  const actual = row[rule.fieldId];
  const expected = rule.value;

  if (rule.operator === "empty") {
    return actual === undefined || actual === null || actual === "" || (Array.isArray(actual) && actual.length === 0);
  }
  if (rule.operator === "not_empty") {
    return !evaluateQueryBuilderRule({ ...rule, operator: "empty" }, row, field);
  }

  if (field?.type === "number") {
    const left = Number(actual);
    const right = Number(expected);
    if (rule.operator === "gt") return left > right;
    if (rule.operator === "gte") return left >= right;
    if (rule.operator === "lt") return left < right;
    if (rule.operator === "lte") return left <= right;
  }

  if (field?.type === "date") {
    const left = new Date(String(actual)).getTime();
    const right = new Date(String(expected)).getTime();
    if (rule.operator === "before") return left < right;
    if (rule.operator === "after") return left > right;
    if (rule.operator === "on") return new Date(left).toDateString() === new Date(right).toDateString();
    if (rule.operator === "not_on") return new Date(left).toDateString() !== new Date(right).toDateString();
  }

  if (rule.operator === "contains") {
    return String(actual ?? "").toLowerCase().includes(String(expected ?? "").toLowerCase());
  }
  if (rule.operator === "starts_with") {
    return String(actual ?? "").toLowerCase().startsWith(String(expected ?? "").toLowerCase());
  }
  if (rule.operator === "ends_with") {
    return String(actual ?? "").toLowerCase().endsWith(String(expected ?? "").toLowerCase());
  }
  if (rule.operator === "includes") {
    return Array.isArray(actual) && actual.map(String).includes(String(expected));
  }
  if (rule.operator === "not_includes") {
    return !evaluateQueryBuilderRule({ ...rule, operator: "includes" }, row, field);
  }
  if (rule.operator === "contains_all") {
    const expectedValues = Array.isArray(expected) ? expected.map(String) : [String(expected)];
    return Array.isArray(actual) && expectedValues.every((value) => actual.map(String).includes(value));
  }
  if (rule.operator === "not_equals") {
    return String(actual) !== String(expected);
  }

  return String(actual) === String(expected);
}

function getQueryBuilderOperators(field: QueryBuilderField) {
  if (field.operators?.length) {
    return field.operators;
  }

  if (field.type === "text") {
    return ["contains", "equals", "not_equals", "starts_with", "ends_with", "empty", "not_empty"];
  }
  if (field.type === "number") {
    return ["equals", "not_equals", "gt", "gte", "lt", "lte", "empty", "not_empty"];
  }
  if (field.type === "date") {
    return ["on", "not_on", "before", "after", "empty", "not_empty"];
  }
  if (field.type === "boolean") {
    return ["equals"];
  }
  if (field.type === "multi-select") {
    return ["includes", "not_includes", "contains_all", "empty", "not_empty"];
  }
  return ["equals", "not_equals", "empty", "not_empty"];
}

function createQueryBuilderGroup(fields: QueryBuilderField[]): QueryBuilderGroupData {
  return {
    id: createQueryBuilderId("group"),
    combinator: "and",
    rules: fields.length > 0 ? [createQueryBuilderRule(fields)] : [],
  };
}

function createQueryBuilderRule(fields: QueryBuilderField[]): QueryBuilderRuleData {
  const field = fields[0];

  return {
    id: createQueryBuilderId("rule"),
    fieldId: field?.id ?? "",
    operator: field ? getQueryBuilderOperators(field)[0] ?? "equals" : "equals",
    value: getDefaultQueryBuilderValue(field),
  };
}

function getDefaultQueryBuilderValue(field?: QueryBuilderField) {
  if (!field) {
    return "";
  }
  if (field.type === "number") {
    return 0;
  }
  if (field.type === "boolean") {
    return true;
  }
  if (field.type === "multi-select") {
    return field.options?.[0] ? [String(field.options[0].value)] : [];
  }
  if (field.type === "select") {
    return field.options?.[0]?.value ?? "";
  }
  return "";
}

function countQueryBuilderRules(group: QueryBuilderGroupData): number {
  return group.rules.reduce(
    (count, rule) => count + (isQueryBuilderGroup(rule) ? countQueryBuilderRules(rule) : 1),
    0,
  );
}

function isQueryBuilderGroup(
  rule: QueryBuilderRuleData | QueryBuilderGroupData,
): rule is QueryBuilderGroupData {
  return "rules" in rule;
}

function createQueryBuilderId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export {
  QueryBuilder,
  QueryBuilderGroup,
  QueryBuilderRule,
  evaluateQueryBuilderExpression,
  serializeQueryBuilderExpression,
};
export type {
  QueryBuilderExpression,
  QueryBuilderField,
  QueryBuilderFieldOption,
  QueryBuilderFieldType,
  QueryBuilderGroupData,
  QueryBuilderProps,
  QueryBuilderRuleData,
};
