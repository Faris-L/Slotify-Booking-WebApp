"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import {
  createService,
  deleteService,
  toggleServiceActive,
  updateService,
  type ActionState,
} from "@/lib/services/actions";
import type { Service, ServiceCategory } from "@/lib/services/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = {};

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function ServiceFormFields({
  service,
  categories,
  currency,
}: {
  service?: Service;
  categories: ServiceCategory[];
  currency: string;
}) {
  return (
    <>
      {service ? <input type="hidden" name="serviceId" value={service.id} /> : null}
      <div className="space-y-1">
        <Label htmlFor={service ? `svc-name-${service.id}` : "new-svc-name"}>
          Name
        </Label>
        <Input
          id={service ? `svc-name-${service.id}` : "new-svc-name"}
          name="name"
          required
          defaultValue={service?.name}
          placeholder="Haircut"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={service ? `svc-desc-${service.id}` : "new-svc-desc"}>
          Description
        </Label>
        <Textarea
          id={service ? `svc-desc-${service.id}` : "new-svc-desc"}
          name="description"
          rows={2}
          defaultValue={service?.description ?? ""}
          placeholder="Optional short description"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={service ? `svc-cat-${service.id}` : "new-svc-cat"}>
          Category
        </Label>
        <select
          id={service ? `svc-cat-${service.id}` : "new-svc-cat"}
          name="categoryId"
          defaultValue={service?.category_id ?? ""}
          className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor={service ? `svc-dur-${service.id}` : "new-svc-dur"}>
            Duration (min)
          </Label>
          <Input
            id={service ? `svc-dur-${service.id}` : "new-svc-dur"}
            name="durationMinutes"
            type="number"
            min={5}
            max={480}
            required
            defaultValue={service?.duration_minutes ?? 30}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={service ? `svc-buf-${service.id}` : "new-svc-buf"}>
            Buffer (min)
          </Label>
          <Input
            id={service ? `svc-buf-${service.id}` : "new-svc-buf"}
            name="bufferMinutes"
            type="number"
            min={0}
            max={120}
            defaultValue={service?.buffer_minutes ?? 0}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={service ? `svc-price-${service.id}` : "new-svc-price"}>
            Price ({currency})
          </Label>
          <Input
            id={service ? `svc-price-${service.id}` : "new-svc-price"}
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={service?.price ?? 0}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="hidden"
          name="isActive"
          value={service?.is_active !== false ? "true" : "false"}
          id={service ? `svc-active-hidden-${service.id}` : "new-svc-active-hidden"}
        />
        <Switch
          defaultChecked={service?.is_active !== false}
          onCheckedChange={(checked) => {
            const hidden = document.getElementById(
              service ? `svc-active-hidden-${service.id}` : "new-svc-active-hidden"
            ) as HTMLInputElement | null;
            if (hidden) {
              hidden.value = checked ? "true" : "false";
            }
          }}
        />
        <Label>Active on public page</Label>
      </div>
    </>
  );
}

function ServiceForm({
  service,
  categories,
  currency,
  onCancel,
}: {
  service?: Service;
  categories: ServiceCategory[];
  currency: string;
  onCancel?: () => void;
}) {
  const action = service ? updateService : createService;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-sky-100 bg-sky-50/50 p-4"
    >
      <ServiceFormFields
        service={service}
        categories={categories}
        currency={currency}
      />
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {service ? "Save service" : "Add service"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function ServiceRow({
  service,
  categories,
  currency,
}: {
  service: Service;
  categories: ServiceCategory[];
  currency: string;
}) {
  const [editing, setEditing] = useState(false);
  const [, deleteAction, deletePending] = useActionState(
    deleteService,
    initialState
  );
  const [, toggleAction, togglePending] = useActionState(
    toggleServiceActive,
    initialState
  );

  const categoryName =
    categories.find((c) => c.id === service.category_id)?.name ?? null;

  if (editing) {
    return (
      <ServiceForm
        service={service}
        categories={categories}
        currency={currency}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{service.name}</p>
          {!service.is_active ? (
            <Badge variant="secondary">Hidden</Badge>
          ) : null}
          {categoryName ? (
            <Badge variant="outline">{categoryName}</Badge>
          ) : null}
        </div>
        {service.description ? (
          <p className="text-sm text-muted-foreground">{service.description}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {service.duration_minutes} min
          {service.buffer_minutes > 0
            ? ` + ${service.buffer_minutes} min buffer`
            : ""}
          {" · "}
          {formatPrice(service.price, currency)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <form action={toggleAction} className="flex items-center gap-2 pr-2">
          <input type="hidden" name="serviceId" value={service.id} />
          <input
            type="hidden"
            name="isActive"
            value={service.is_active ? "false" : "true"}
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={togglePending}
          >
            {service.is_active ? "Hide" : "Show"}
          </Button>
        </form>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${service.name}`}
        >
          <Pencil className="size-3.5" />
        </Button>
        <form action={deleteAction}>
          <input type="hidden" name="serviceId" value={service.id} />
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            disabled={deletePending}
            aria-label={`Delete ${service.name}`}
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function ServiceList({
  services,
  categories,
  currency,
}: {
  services: Service[];
  categories: ServiceCategory[];
  currency: string;
}) {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-4">
      {services.length === 0 && !showNew ? (
        <p className="text-sm text-muted-foreground">
          No services yet. Add your first service to start configuring staff
          assignments.
        </p>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <ServiceRow
              key={service.id}
              service={service}
              categories={categories}
              currency={currency}
            />
          ))}
        </div>
      )}

      {showNew ? (
        <ServiceForm
          categories={categories}
          currency={currency}
          onCancel={() => setShowNew(false)}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowNew(true)}
        >
          Add service
        </Button>
      )}
    </div>
  );
}
