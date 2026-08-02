/**
 * Button + modal for creating a new category
 */

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Category } from "../types";
import { ApiError, createCategory } from "../services/api";
import { TextField, Button, Modal } from "../vibes";

interface CategoryFormProps {
  onCreated: (category: Category) => void;
  variant?: "primary" | "secondary";
}

export function CategoryForm({ onCreated, variant = "secondary" }: CategoryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  const footerStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "flex-end",
  };

  const open = () => {
    setName("");
    setError(null);
    setIsOpen(true);
  };

  const close = () => {
    if (!isCreating) setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }

    setIsCreating(true);
    try {
      const category = await createCategory(name.trim());
      setIsOpen(false);
      setName("");
      setError(null);
      onCreated(category);
    } catch (err) {
      setError(
        err instanceof ApiError && err.errors.length > 0
          ? err.errors.join(", ")
          : "Failed to create category",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Button type="button" variant={variant} onClick={open}>
        Add Category
      </Button>
      {isOpen &&
        createPortal(
          <Modal isOpen onClose={close} title="Add Category" maxWidth="400px">
            <form onSubmit={handleSubmit} style={formStyle}>
              <TextField
                label="Category Name"
                placeholder="e.g. Pets"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                error={error ?? undefined}
                autoFocus
                fullWidth
                maxLength={100}
              />
              <div style={footerStyle}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={close}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Category"}
                </Button>
              </div>
            </form>
          </Modal>,
          document.body,
        )}
    </>
  );
}
