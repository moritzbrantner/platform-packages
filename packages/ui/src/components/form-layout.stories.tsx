import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import { Field, FieldDescription, FieldLabel, FieldLegend } from "./field";
import {
  FieldGrid,
  FieldRow,
  Fieldset,
  FormActions,
  FormSection,
  FormSectionDescription,
  FormSectionHeader,
  FormSectionTitle,
  ValidationSummary,
} from "./form-layout";
import { Input } from "./input";
import { Switch } from "./switch";

function FormLayoutDemo() {
  return (
    <form className="grid max-w-3xl gap-4">
      <ValidationSummary errors={["Workspace name is required.", "Notification email is invalid."]} />
      <FormSection>
        <FormSectionHeader>
          <FormSectionTitle>Workspace settings</FormSectionTitle>
          <FormSectionDescription>Shared form structure without product-specific state.</FormSectionDescription>
        </FormSectionHeader>
        <Fieldset>
          <FieldLegend>Details</FieldLegend>
          <FieldGrid>
            <Field>
              <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
              <Input id="workspace-name" placeholder="Research workspace" />
            </Field>
            <Field>
              <FieldLabel htmlFor="workspace-owner">Owner email</FieldLabel>
              <Input id="workspace-owner" type="email" placeholder="owner@example.com" />
            </Field>
          </FieldGrid>
          <FieldRow align="center">
            <Switch id="workspace-sync" />
            <FieldLabel htmlFor="workspace-sync">Sync automatically</FieldLabel>
            <FieldDescription>Keep connected surfaces updated when data changes.</FieldDescription>
          </FieldRow>
        </Fieldset>
      </FormSection>
      <FormActions>
        <Button variant="outline">Cancel</Button>
        <Button>Save changes</Button>
      </FormActions>
    </form>
  );
}

const meta = {
  title: "Components/FormLayout",
  component: FormLayoutDemo,
  tags: ["autodocs", "test"],
} satisfies Meta<typeof FormLayoutDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SettingsForm: Story = {};

export const StickyActions: Story = {
  render: () => (
    <div className="h-96 overflow-auto">
      <FormLayoutDemo />
      <FormActions sticky>
        <Button>Sticky save</Button>
      </FormActions>
    </div>
  ),
};
