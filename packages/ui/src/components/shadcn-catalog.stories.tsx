import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import type { ColumnDef } from "@tanstack/react-table";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleIcon,
  FileIcon,
  FolderIcon,
  Grid2X2Icon,
  HomeIcon,
  InboxIcon,
  InfoIcon,
  LayoutDashboardIcon,
  ListFilterIcon,
  MailIcon,
  MoreHorizontalIcon,
  SearchIcon,
  SettingsIcon,
  ShieldAlertIcon,
  SparklesIcon,
  StarIcon,
  UploadIcon,
  UserIcon,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertAction,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  AspectRatio,
  Avatar,
  AvatarCollection,
  Badge,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  Calendar,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  DataTable,
  DatePicker,
  DateRangePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DotsSpinner,
  DirectionProvider,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Kbd,
  KbdGroup,
  Label,
  LoadingBar,
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  Skeleton,
  Slider,
  Spinner,
  PulseSpinner,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toast,
  ToastAction,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Toaster,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyInlineCode,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
  TypographyTable,
  TypographyTableBody,
  TypographyTableCell,
  TypographyTableElement,
  TypographyTableHead,
  TypographyTableHeader,
  TypographyTableRow,
  defaultUiThemeName,
  uiThemeLabels,
  type UiThemeName,
} from "../index";

const catalogComponents = [
  "accordion",
  "alert",
  "alert-dialog",
  "aspect-ratio",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "button-group",
  "calendar",
  "card",
  "carousel",
  "chart",
  "checkbox",
  "collapsible",
  "combobox",
  "command",
  "context-menu",
  "data-table",
  "date-picker",
  "dialog",
  "direction",
  "drawer",
  "dropdown-menu",
  "empty",
  "field",
  "hover-card",
  "input",
  "input-group",
  "input-otp",
  "item",
  "kbd",
  "label",
  "loading-bar",
  "menubar",
  "native-select",
  "navigation-menu",
  "pagination",
  "popover",
  "progress",
  "radio-group",
  "resizable",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "sidebar",
  "skeleton",
  "slider",
  "sonner",
  "spinner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toast",
  "toggle",
  "toggle-group",
  "tooltip",
  "typography",
] as const;

const chartData = [
  { month: "Jan", packages: 14 },
  { month: "Feb", packages: 22 },
  { month: "Mar", packages: 18 },
] as const;

type PackageRow = {
  packageName: string;
  status: string;
  owner: string;
};

const tableData: PackageRow[] = [
  { packageName: "@moritzbrantner/ui", status: "Ready", owner: "Design" },
  { packageName: "@moritzbrantner/maps", status: "Review", owner: "Geo" },
  { packageName: "@moritzbrantner/speech", status: "Draft", owner: "Audio" },
];

const dataTableColumns: ColumnDef<PackageRow>[] = [
  {
    accessorKey: "packageName",
    header: "Package",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "owner",
    header: "Owner",
  },
];

type CatalogSectionProps = {
  id: (typeof catalogComponents)[number];
  title: string;
  children: React.ReactNode;
};

type CatalogPreviewProps = {
  designSystem?: UiThemeName;
};

function CatalogSection({ id, title, children }: CatalogSectionProps) {
  return (
    <section
      data-catalog-component={id}
      data-testid={`catalog-${id}`}
      className="grid min-h-40 content-start gap-3 border border-border/60 bg-card/55 p-4 text-sm shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <Badge variant="outline">{id}</Badge>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function CatalogPreview({ designSystem = defaultUiThemeName }: CatalogPreviewProps) {
  return (
    <TooltipProvider>
      <div className="mx-auto grid w-full max-w-7xl gap-6 p-6">
        <div className="grid gap-2">
          <Badge variant="outline" className="w-fit">
            {uiThemeLabels[designSystem]}
          </Badge>
          <TypographyH1 className="text-3xl">Basic components</TypographyH1>
          <TypographyLead>Interactive primitives for package surfaces.</TypographyLead>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CatalogSection id="accordion" title="Accordion">
            <Accordion type="single" defaultValue="one" className="w-full">
              <AccordionItem value="one">
                <AccordionTrigger>Component readiness</AccordionTrigger>
                <AccordionContent>
                  Motion, glass styling, and typed exports are included.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CatalogSection>

          <CatalogSection id="alert" title="Alert">
            <Alert>
              <InfoIcon />
              <AlertTitle>Verification ready</AlertTitle>
              <AlertDescription>Shared package styles are available in Storybook.</AlertDescription>
              <AlertAction>
                <Badge variant="secondary">Live</Badge>
              </AlertAction>
            </Alert>
          </CatalogSection>

          <CatalogSection id="alert-dialog" title="Alert Dialog">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <ShieldAlertIcon />
                  Open review
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia>
                    <ShieldAlertIcon />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Publish package?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Confirm the package catalog before release.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Publish</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CatalogSection>

          <CatalogSection id="aspect-ratio" title="Aspect Ratio">
            <AspectRatio ratio={16 / 9} className="overflow-hidden bg-muted">
              <div className="flex size-full items-center justify-center gap-2">
                <SparklesIcon className="size-5" />
                Preview surface
              </div>
            </AspectRatio>
          </CatalogSection>

          <CatalogSection id="avatar" title="Avatar">
            <div className="grid gap-4">
              <Avatar initials="MB" name="Mira Brandt" online />
              <AvatarCollection
                users={[
                  { initials: "UI", name: "UI Team" },
                  { initials: "DS", name: "Design Systems" },
                  { initials: "RC", name: "Release Crew" },
                  { initials: "QA", name: "Quality" },
                  { initials: "OP", name: "Operations" },
                ]}
                maxVisible={1}
              />
            </div>
          </CatalogSection>

          <CatalogSection id="badge" title="Badge">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CatalogSection>

          <CatalogSection id="breadcrumb" title="Breadcrumb">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Catalog</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </CatalogSection>

          <CatalogSection id="button" title="Button">
            <div className="flex flex-wrap gap-2">
              <Button>Default</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost" size="icon" aria-label="Settings">
                <SettingsIcon />
              </Button>
            </div>
          </CatalogSection>

          <CatalogSection id="button-group" title="Button Group">
            <ButtonGroup>
              <Button variant="outline">Preview</Button>
              <ButtonGroupSeparator />
              <ButtonGroupText>
                <Kbd>P</Kbd>
              </ButtonGroupText>
            </ButtonGroup>
          </CatalogSection>

          <CatalogSection id="calendar" title="Calendar">
            <Calendar
              mode="single"
              defaultMonth={new Date(2026, 3, 1)}
              selected={new Date(2026, 3, 15)}
              className="scale-90 origin-top-left"
            />
          </CatalogSection>

          <CatalogSection id="card" title="Card">
            <Card>
              <CardHeader>
                <CardTitle>Queue health</CardTitle>
                <CardDescription>Shared component status.</CardDescription>
                <CardAction>
                  <Button variant="ghost" size="icon-sm" aria-label="More">
                    <MoreHorizontalIcon />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>18 primitives verified.</CardContent>
              <CardFooter>
                <Badge variant="secondary">Stable</Badge>
              </CardFooter>
            </Card>
          </CatalogSection>

          <CatalogSection id="carousel" title="Carousel">
            <Carousel className="mx-10">
              <CarouselContent>
                {[1, 2, 3].map((item) => (
                  <CarouselItem key={item}>
                    <div className="flex h-24 items-center justify-center border border-border/60 bg-muted/40">
                      Slide {item}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CatalogSection>

          <CatalogSection id="chart" title="Chart">
            <ChartContainer
              config={{
                packages: {
                  label: "Packages",
                  color: "var(--primary)",
                },
              }}
              className="h-44 w-full"
            >
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="packages" fill="var(--color-packages)" radius={0} />
              </BarChart>
            </ChartContainer>
          </CatalogSection>

          <CatalogSection id="checkbox" title="Checkbox">
            <div className="flex items-center gap-3">
              <Checkbox id="catalog-checkbox" defaultChecked />
              <Label htmlFor="catalog-checkbox">Include in release</Label>
            </div>
          </CatalogSection>

          <CatalogSection id="collapsible" title="Collapsible">
            <Collapsible defaultOpen>
              <CollapsibleTrigger asChild>
                <Button variant="outline">Toggle details</Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 text-muted-foreground">
                The catalog story renders inside Storybook.
              </CollapsibleContent>
            </Collapsible>
          </CatalogSection>

          <CatalogSection id="combobox" title="Combobox">
            <Combobox>
              <ComboboxInput placeholder="Search packages" showTrigger={false} />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxLabel>Packages</ComboboxLabel>
                  <ComboboxItem value="ui">@moritzbrantner/ui</ComboboxItem>
                  <ComboboxItem value="maps">@moritzbrantner/maps</ComboboxItem>
                  <ComboboxEmpty>No package found.</ComboboxEmpty>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </CatalogSection>

          <CatalogSection id="command" title="Command">
            <Command className="h-48">
              <CommandInput placeholder="Search commands" />
              <CommandList>
                <CommandEmpty>No command found.</CommandEmpty>
                <CommandGroup heading="Actions">
                  <CommandItem>
                    <SearchIcon />
                    Search packages
                    <CommandShortcut>SP</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <UploadIcon />
                    Publish package
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </CatalogSection>

          <CatalogSection id="context-menu" title="Context Menu">
            <ContextMenu>
              <ContextMenuTrigger className="flex h-24 items-center justify-center border border-dashed border-border/70 bg-muted/35">
                Right click menu target
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuLabel>View</ContextMenuLabel>
                <ContextMenuItem>
                  Refresh <ContextMenuShortcut>R</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuCheckboxItem checked>Show grid</ContextMenuCheckboxItem>
                <ContextMenuSeparator />
                <ContextMenuRadioGroup value="comfortable">
                  <ContextMenuRadioItem value="comfortable">Comfortable</ContextMenuRadioItem>
                </ContextMenuRadioGroup>
              </ContextMenuContent>
            </ContextMenu>
          </CatalogSection>

          <CatalogSection id="data-table" title="Data Table">
            <DataTable
              columns={dataTableColumns}
              data={tableData}
              searchColumn="packageName"
              searchPlaceholder="Filter packages"
            />
          </CatalogSection>

          <CatalogSection id="date-picker" title="Date Picker">
            <div className="grid gap-2">
              <DatePicker defaultValue={new Date(2026, 3, 21)} />
              <DateRangePicker
                defaultValue={{
                  from: new Date(2026, 3, 21),
                  to: new Date(2026, 3, 24),
                }}
              />
            </div>
          </CatalogSection>

          <CatalogSection id="dialog" title="Dialog">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Catalog dialog</DialogTitle>
                  <DialogDescription>
                    A portal dialog styled with the shared glass treatment.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button>Done</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CatalogSection>

          <CatalogSection id="direction" title="Direction">
            <DirectionProvider dir="rtl">
              <div dir="rtl" className="border border-border/60 bg-muted/35 p-3">
                RTL provider preview
              </div>
            </DirectionProvider>
          </CatalogSection>

          <CatalogSection id="drawer" title="Drawer">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline">Open drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Drawer preview</DrawerTitle>
                  <DrawerDescription>Bottom drawer package details.</DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button>Close</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </CatalogSection>

          <CatalogSection id="dropdown-menu" title="Dropdown Menu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Open menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  Open <DropdownMenuShortcut>O</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuCheckboxItem checked>Notify team</DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value="stable">
                  <DropdownMenuRadioItem value="stable">Stable</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </CatalogSection>

          <CatalogSection id="empty" title="Empty">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InboxIcon />
                </EmptyMedia>
                <EmptyTitle>No packages queued</EmptyTitle>
                <EmptyDescription>New packages will appear here.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm">Create package</Button>
              </EmptyContent>
            </Empty>
          </CatalogSection>

          <CatalogSection id="field" title="Field">
            <FieldSet>
              <FieldLegend>Package metadata</FieldLegend>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="catalog-field">Package name</FieldLabel>
                  <Input id="catalog-field" defaultValue="@moritzbrantner/ui" />
                  <FieldDescription>Used for package publishing.</FieldDescription>
                </Field>
                <FieldSeparator>or</FieldSeparator>
                <Field orientation="horizontal">
                  <Checkbox id="catalog-field-check" aria-label="Enable preview" />
                  <FieldContent>
                    <FieldTitle>Enable preview</FieldTitle>
                    <FieldDescription>Show component previews in docs.</FieldDescription>
                  </FieldContent>
                </Field>
                <FieldError>Example validation message.</FieldError>
              </FieldGroup>
            </FieldSet>
          </CatalogSection>

          <CatalogSection id="hover-card" title="Hover Card">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="outline">Hover package</Button>
              </HoverCardTrigger>
              <HoverCardContent>
                <strong>@moritzbrantner/ui</strong>
                <p className="mt-1 text-muted-foreground">
                  Shared primitives for platform packages.
                </p>
              </HoverCardContent>
            </HoverCard>
          </CatalogSection>

          <CatalogSection id="input" title="Input">
            <Input aria-label="Package input" defaultValue="@moritzbrantner/ui" />
          </CatalogSection>

          <CatalogSection id="input-group" title="Input Group">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput aria-label="Search input group" placeholder="Search" />
              <InputGroupAddon align="inline-end">
                <InputGroupText>
                  <Kbd>/</Kbd>
                </InputGroupText>
                <InputGroupButton size="xs">Go</InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <InputGroup className="mt-3">
              <InputGroupTextarea aria-label="Input group textarea" placeholder="Notes" />
            </InputGroup>
          </CatalogSection>

          <CatalogSection id="input-otp" title="Input OTP">
            <InputOTP aria-label="Package verification code" maxLength={6} value="123456">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </CatalogSection>

          <CatalogSection id="item" title="Item">
            <ItemGroup>
              <Item variant="outline" role="listitem">
                <ItemMedia variant="icon">
                  <FolderIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>UI package</ItemTitle>
                  <ItemDescription>Reusable platform primitives.</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button size="sm" variant="outline">
                    Open
                  </Button>
                </ItemActions>
                <ItemFooter>
                  <Badge variant="secondary">Ready</Badge>
                </ItemFooter>
              </Item>
              <ItemSeparator />
            </ItemGroup>
          </CatalogSection>

          <CatalogSection id="kbd" title="Kbd">
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>B</Kbd>
            </KbdGroup>
          </CatalogSection>

          <CatalogSection id="label" title="Label">
            <div className="grid gap-2">
              <Label htmlFor="catalog-label">Release channel</Label>
              <Input id="catalog-label" defaultValue="stable" />
            </div>
          </CatalogSection>

          <CatalogSection id="menubar" title="Menubar">
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                  <MenubarLabel>Package</MenubarLabel>
                  <MenubarItem>
                    New <MenubarShortcut>N</MenubarShortcut>
                  </MenubarItem>
                  <MenubarCheckboxItem checked>Autosave</MenubarCheckboxItem>
                  <MenubarSeparator />
                  <MenubarRadioGroup value="preview">
                    <MenubarRadioItem value="preview">Preview</MenubarRadioItem>
                  </MenubarRadioGroup>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </CatalogSection>

          <CatalogSection id="native-select" title="Native Select">
            <NativeSelect defaultValue="ui" aria-label="Package native select">
              <NativeSelectOptGroup label="Packages">
                <NativeSelectOption value="ui">UI</NativeSelectOption>
                <NativeSelectOption value="maps">Maps</NativeSelectOption>
              </NativeSelectOptGroup>
            </NativeSelect>
          </CatalogSection>

          <CatalogSection id="navigation-menu" title="Navigation Menu">
            <NavigationMenu viewport={false}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Packages</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuLink href="#">
                      <HomeIcon />
                      Overview
                    </NavigationMenuLink>
                    <NavigationMenuLink href="#">
                      <FileIcon />
                      Releases
                    </NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </CatalogSection>

          <CatalogSection id="pagination" title="Pagination">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CatalogSection>

          <CatalogSection id="popover" title="Popover">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Open popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>Package details</PopoverTitle>
                  <PopoverDescription>Popover content for compact controls.</PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
          </CatalogSection>

          <CatalogSection id="progress" title="Progress">
            <Progress aria-label="Catalog completion" value={68} />
          </CatalogSection>

          <CatalogSection id="loading-bar" title="Loading Bar">
            <div className="grid gap-3">
              <LoadingBar value={72} label="Package upload" showValue />
              <LoadingBar indeterminate label="Package analysis" size="sm" />
            </div>
          </CatalogSection>

          <CatalogSection id="radio-group" title="Radio Group">
            <RadioGroup defaultValue="stable">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="radio-stable" value="stable" />
                <Label htmlFor="radio-stable">Stable</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="radio-preview" value="preview" />
                <Label htmlFor="radio-preview">Preview</Label>
              </div>
            </RadioGroup>
          </CatalogSection>

          <CatalogSection id="resizable" title="Resizable">
            <ResizablePanelGroup orientation="horizontal" className="h-28 border border-border/60">
              <ResizablePanel defaultSize="55%" className="grid place-items-center">
                List
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="45%" className="grid place-items-center">
                Detail
              </ResizablePanel>
            </ResizablePanelGroup>
          </CatalogSection>

          <CatalogSection id="scroll-area" title="Scroll Area">
            <ScrollArea className="h-28 border border-border/60 p-3">
              <div className="grid gap-2">
                {Array.from({ length: 8 }, (_, index) => (
                  <Button key={index} size="sm" variant="ghost" className="justify-start">
                    Package row {index + 1}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CatalogSection>

          <CatalogSection id="select" title="Select">
            <Select defaultValue="ui">
              <SelectTrigger aria-label="Package select">
                <SelectValue placeholder="Select package" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Packages</SelectLabel>
                  <SelectItem value="ui">UI</SelectItem>
                  <SelectSeparator />
                  <SelectItem value="maps">Maps</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </CatalogSection>

          <CatalogSection id="separator" title="Separator">
            <div>
              <span>Above</span>
              <Separator className="my-3" />
              <span>Below</span>
            </div>
          </CatalogSection>

          <CatalogSection id="sheet" title="Sheet">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet preview</SheetTitle>
                  <SheetDescription>Side panel package details.</SheetDescription>
                </SheetHeader>
                <SheetFooter>
                  <Button>Save</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </CatalogSection>

          <CatalogSection id="sidebar" title="Sidebar">
            <SidebarProvider className="h-56 min-h-0 overflow-hidden border border-border/60">
              <Sidebar collapsible="none" className="w-52">
                <SidebarHeader>
                  <SidebarInput placeholder="Search" />
                </SidebarHeader>
                <SidebarSeparator />
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Packages</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton isActive>
                            <LayoutDashboardIcon />
                            <span>Overview</span>
                          </SidebarMenuButton>
                          <SidebarMenuAction aria-label="More">
                            <MoreHorizontalIcon />
                          </SidebarMenuAction>
                          <SidebarMenuBadge>3</SidebarMenuBadge>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton>
                            <Grid2X2Icon />
                            <span>Components</span>
                          </SidebarMenuButton>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton href="#">
                                <span>Catalog</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuSkeleton showIcon />
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                  <SidebarTrigger />
                </SidebarFooter>
              </Sidebar>
              <SidebarInset className="p-4">
                <Badge variant="outline" className="w-fit">
                  Inset
                </Badge>
              </SidebarInset>
            </SidebarProvider>
          </CatalogSection>

          <CatalogSection id="skeleton" title="Skeleton">
            <div className="grid gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CatalogSection>

          <CatalogSection id="slider" title="Slider">
            <Slider defaultValue={[30, 70]} />
          </CatalogSection>

          <CatalogSection id="sonner" title="Sonner">
            <div className="flex items-center gap-3">
              <Toaster />
              <BellIcon className="size-4" />
              <span>Sonner toaster mounted</span>
            </div>
          </CatalogSection>

          <CatalogSection id="spinner" title="Spinner">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2">
                <Spinner />
                Loading package
              </span>
              <DotsSpinner label="Syncing package" variant="primary" />
              <PulseSpinner label="Live package check" variant="muted" />
            </div>
          </CatalogSection>

          <CatalogSection id="switch" title="Switch">
            <div className="flex items-center gap-3">
              <Switch id="catalog-switch" defaultChecked />
              <Label htmlFor="catalog-switch">Publish notifications</Label>
            </div>
          </CatalogSection>

          <CatalogSection id="table" title="Table">
            <Table>
              <TableCaption>Package release table.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>UI</TableCell>
                  <TableCell>Ready</TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell>1</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CatalogSection>

          <CatalogSection id="tabs" title="Tabs">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-3">
                Component overview.
              </TabsContent>
              <TabsContent value="activity" className="pt-3">
                Recent activity.
              </TabsContent>
            </Tabs>
          </CatalogSection>

          <CatalogSection id="textarea" title="Textarea">
            <Textarea
              aria-label="Package notes"
              defaultValue="Check Storybook catalog before release."
            />
          </CatalogSection>

          <CatalogSection id="toast" title="Toast">
            <ToastProvider>
              <Toast open>
                <div className="grid gap-1">
                  <ToastTitle>Catalog mounted</ToastTitle>
                  <ToastDescription>Toast primitives render in Storybook.</ToastDescription>
                </div>
                <ToastAction altText="Open package">Open</ToastAction>
              </Toast>
              <ToastViewport className="relative top-auto right-auto max-w-none p-0" />
            </ToastProvider>
          </CatalogSection>

          <CatalogSection id="toggle" title="Toggle">
            <Toggle defaultPressed aria-label="Toggle starred">
              <StarIcon />
              Starred
            </Toggle>
          </CatalogSection>

          <CatalogSection id="toggle-group" title="Toggle Group">
            <ToggleGroup type="multiple" defaultValue={["grid"]}>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid2X2Icon />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <ListFilterIcon />
              </ToggleGroupItem>
            </ToggleGroup>
          </CatalogSection>

          <CatalogSection id="tooltip" title="Tooltip">
            <Tooltip defaultOpen>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover hint</Button>
              </TooltipTrigger>
              <TooltipContent>
                Tooltip content <Kbd>H</Kbd>
              </TooltipContent>
            </Tooltip>
          </CatalogSection>

          <CatalogSection id="typography" title="Typography">
            <div className="grid gap-3">
              <TypographyH2>Documentation heading</TypographyH2>
              <TypographyH3>Release notes</TypographyH3>
              <TypographyP>Typography primitives keep long-form docs readable.</TypographyP>
              <TypographyBlockquote>
                Components are owned, styled, and tested locally.
              </TypographyBlockquote>
              <TypographyList>
                <li>Glass surfaces</li>
                <li>Sharp edges</li>
              </TypographyList>
              <TypographyMuted>
                Inline code uses <TypographyInlineCode>cn()</TypographyInlineCode>.
              </TypographyMuted>
              <TypographyTable>
                <TypographyTableElement>
                  <TypographyTableHeader>
                    <TypographyTableRow>
                      <TypographyTableHead>Name</TypographyTableHead>
                      <TypographyTableHead>Status</TypographyTableHead>
                    </TypographyTableRow>
                  </TypographyTableHeader>
                  <TypographyTableBody>
                    <TypographyTableRow>
                      <TypographyTableCell>Catalog</TypographyTableCell>
                      <TypographyTableCell>Ready</TypographyTableCell>
                    </TypographyTableRow>
                  </TypographyTableBody>
                </TypographyTableElement>
              </TypographyTable>
            </div>
          </CatalogSection>
        </div>
      </div>
    </TooltipProvider>
  );
}

const meta = {
  title: "Reference/Shadcn catalog",
  component: CatalogPreview,
  tags: ["autodocs", "test"],
  args: {
    designSystem: defaultUiThemeName,
  },
  argTypes: {
    designSystem: {
      control: false,
      table: { disable: true },
    },
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CatalogPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

const assertCatalogSections: Story["play"] = async ({ canvas }) => {
  for (const component of catalogComponents) {
    await expect(canvas.getByTestId(`catalog-${component}`)).toBeVisible();
  }
};

export const FullCatalog: Story = {
  globals: { designSystem: defaultUiThemeName },
  play: assertCatalogSections,
};

export const Bobba: Story = {
  args: { designSystem: "bobba" },
  globals: { designSystem: "bobba" },
  play: assertCatalogSections,
};

export const Zleek: Story = {
  args: { designSystem: "zleek" },
  globals: { designSystem: "zleek" },
  play: assertCatalogSections,
};

export const Atlas: Story = {
  args: { designSystem: "atlas" },
  globals: { designSystem: "atlas" },
  play: assertCatalogSections,
};

export const Studio: Story = {
  args: { designSystem: "studio" },
  globals: { designSystem: "studio" },
  play: assertCatalogSections,
};

export const Paper: Story = {
  args: { designSystem: "paper" },
  globals: { designSystem: "paper" },
  parameters: {
    a11y: {
      test: "todo",
    },
  },
  play: assertCatalogSections,
};
