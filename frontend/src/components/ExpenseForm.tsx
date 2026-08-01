/**
 * Form component for adding/editing expenses
 */

import React, { useEffect, useState } from "react";
import { ExpenseFormData, Category } from "../types";
import { fetchCategories } from "../services/api";
import { TextField, SelectBox, Button, FormControl } from "../vibes";
import { useExpenseForm } from "../hooks/useExpenseForm";
import { CategoryForm } from "./CategoryForm";

interface ExpenseFormProps {
  initialData?: Partial<ExpenseFormData>;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function ExpenseForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Add Expense",
}: ExpenseFormProps) {
  const { formData, errors, isSubmitting, handleChange, handleSubmit } =
    useExpenseForm({
      initialData,
      onSubmit,
    });

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
      setCategoriesError(null);
    } catch {
      setCategoriesError("Failed to load categories");
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const formStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem",
  };

  const categoryRowStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    alignItems: "flex-end",
  };

  const categorySelectWrapperStyle: React.CSSProperties = {
    flex: 1,
  };

  const categoryOptions = categories.map((category) => ({
    value: category.name,
    label: category.name,
  }));

  const handleCategoryCreated = async (category: Category) => {
    await loadCategories();
    handleChange("category", category.name);
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={formStyle}>
      <TextField
        label="Amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        value={formData.amount}
        onChange={(e) => handleChange("amount", e.target.value)}
        error={errors.amount}
        fullWidth
        required
      />

      <TextField
        label="Description"
        type="text"
        placeholder="Enter description"
        value={formData.description}
        onChange={(e) => handleChange("description", e.target.value)}
        error={errors.description}
        fullWidth
        required
      />

      <FormControl label="Category" error={errors.category} fullWidth>
        <div style={categoryRowStyle}>
          <div style={categorySelectWrapperStyle}>
            <SelectBox
              options={categoryOptions}
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              error={errors.category}
              hideErrorText
              fullWidth
              required
            />
          </div>
          <CategoryForm onCreated={handleCategoryCreated} />
        </div>
      </FormControl>
      {categoriesError && (
        <span style={{ fontSize: "0.75rem", color: "inherit" }}>
          {categoriesError}
        </span>
      )}

      <TextField
        label="Date"
        type="date"
        value={formData.date}
        onChange={(e) => handleChange("date", e.target.value)}
        error={errors.date}
        fullWidth
        required
      />

      <div style={buttonGroupStyle}>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? "Submitting..." : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
