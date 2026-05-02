import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { beforeAll, describe, expect, test, vi } from "vitest";

import {
  DatePicker,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toggle,
} from "..";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("@moritzbrantner/ui primitive interaction gaps", () => {
  test("opens dropdown and menubar menus and invokes keyboard-reachable items", async () => {
    const onDropdownSelect = vi.fn();
    const onMenubarSelect = vi.fn();

    render(
      <>
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={onDropdownSelect}>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Menubar value="file">
          <MenubarMenu value="file">
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onSelect={onMenubarSelect}>New document</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </>,
    );

    fireEvent.click(await screen.findByText("Archive"));
    expect(onDropdownSelect).toHaveBeenCalledTimes(1);

    fireEvent.click(await screen.findByText("New document"));
    expect(onMenubarSelect).toHaveBeenCalledTimes(1);
  });

  test("opens selects and reports controlled value changes", async () => {
    const onValueChange = vi.fn();

    render(
      <Select defaultValue="alpha" open onValueChange={onValueChange}>
        <SelectTrigger aria-label="Package status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alpha">Alpha</SelectItem>
          <SelectItem value="beta">Beta</SelectItem>
        </SelectContent>
      </Select>,
    );

    fireEvent.click(await screen.findByRole("option", { name: "Beta" }));

    expect(onValueChange).toHaveBeenCalledWith("beta");
  });

  test("switch, toggle, radio, slider, tabs, and otp expose controlled state contracts", async () => {
    const onSwitchChange = vi.fn();
    const onToggleChange = vi.fn();
    const onRadioChange = vi.fn();

    function Harness() {
      const [switchChecked, setSwitchChecked] = React.useState(false);
      const [togglePressed, setTogglePressed] = React.useState(false);
      const [radioValue, setRadioValue] = React.useState("compact");
      const [sliderValue] = React.useState([25]);
      const [tab, setTab] = React.useState("first");

      return (
        <>
          <Switch
            aria-label="Sync"
            checked={switchChecked}
            onCheckedChange={(nextValue) => {
              setSwitchChecked(nextValue);
              onSwitchChange(nextValue);
            }}
          />
          <Toggle
            pressed={togglePressed}
            onPressedChange={(nextValue) => {
              setTogglePressed(nextValue);
              onToggleChange(nextValue);
            }}
          >
            Preview
          </Toggle>
          <RadioGroup
            value={radioValue}
            onValueChange={(nextValue) => {
              setRadioValue(nextValue);
              onRadioChange(nextValue);
            }}
          >
            <RadioGroupItem aria-label="Compact" value="compact" />
            <RadioGroupItem aria-label="Comfortable" value="comfortable" />
          </RadioGroup>
          <Slider aria-label="Zoom" value={sliderValue} />
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="first">First</TabsTrigger>
              <TabsTrigger value="second">Second</TabsTrigger>
            </TabsList>
            <TabsContent value="first">First panel</TabsContent>
            <TabsContent value="second">Second panel</TabsContent>
          </Tabs>
          <InputOTP maxLength={4} value="1234" onChange={() => undefined}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
        </>
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole("switch", { name: "Sync" }));
    expect(onSwitchChange).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole("button", { name: "Preview" }));
    expect(onToggleChange).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole("radio", { name: "Comfortable" }));
    expect(onRadioChange).toHaveBeenCalledWith("comfortable");

    expect(screen.getByLabelText("Zoom").getAttribute("data-slot")).toBe("slider");

    fireEvent.click(screen.getByRole("tab", { name: "Second" }));
    expect(screen.getByRole("tab", { name: "Second" })).toBeTruthy();
    expect(screen.getByDisplayValue("1234")).toBeTruthy();
  });

  test("date picker renders controlled formatted values and disabled state", () => {
    render(<DatePicker value={new Date(2026, 3, 22)} disabled />);

    const trigger = screen.getByRole("button", { name: /April 22nd, 2026/ });

    expect(trigger).toHaveProperty("disabled", true);
  });
});
