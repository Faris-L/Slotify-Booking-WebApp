"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import {
  createServiceCategory,
  deleteServiceCategory,
  updateServiceCategory,
  type ActionState,
} from "@/lib/services/actions";
import type { ServiceCategory } from "@/lib/services/queries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = {};

function CategoryForm({
  category,
  onCancel,
}: {
  category?: ServiceCategory;
  onCancel?: () => void;
}) {
  const action = category ? updateServiceCategory : createServiceCategory;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-sky-100 bg-sky-50/50 p-3">
      {category ? (
        <input type="hidden" name="categoryId" value={category.id} />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
        <div className="space-y-1">
          <Label htmlFor={category ? `cat-name-${category.id}` : "new-cat-name"}>
            Name
          </Label>
          <Input
            id={category ? `cat-name-${category.id}` : "new-cat-name"}
            name="name"
            required
            defaultValue={category?.name}
            placeholder="Haircuts"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={category ? `cat-order-${category.id}` : "new-cat-order"}>
            Order
          </Label>
          <Input
            id={category ? `cat-order-${category.id}` : "new-cat-order"}
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={category?.sort_order ?? 0}
          />
        </div>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-600">{state.success}</p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {category ? "Save" : "Add category"}
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

export function CategoryList({ categories }: { categories: ServiceCategory[] }) {
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, deleteAction, deletePending] = useActionState(
    deleteServiceCategory,
    initialState
  );

  return (
    <Card className="border-sky-100">
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>
          Group services for your public booking page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No categories yet. Services can still be added without one.
          </p>
        ) : (
          <ul className="space-y-2">
            {categories.map((category) =>
              editingId === category.id ? (
                <li key={category.id}>
                  <CategoryForm
                    category={category}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li
                  key={category.id}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Sort order: {category.sort_order}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditingId(category.id)}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <form action={deleteAction}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon-sm"
                        disabled={deletePending}
                        aria-label={`Delete ${category.name}`}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </form>
                  </div>
                </li>
              )
            )}
          </ul>
        )}

        {showNew ? (
          <CategoryForm onCancel={() => setShowNew(false)} />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowNew(true)}
          >
            Add category
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
