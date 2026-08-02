/**
 * Category management page: list, add, rename, delete
 */

import React, { useEffect, useState } from "react";
import { Category } from "../types";
import {
  ApiError,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../services/api";
import { CategoryForm } from "../components/CategoryForm";
import { TextField, Button, Modal } from "../vibes";
import { COLORS } from "../constants/colors";
import { UNCATEGORIZED_CATEGORY_NAME } from "../constants/categoryNames";
import { formatDate } from "../utils/expenseUtils";

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(date)} ${hours}:${minutes}`;
};

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setCategories(await fetchCategories());
      setLoadError(null);
    } catch {
      setLoadError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditError(null);
  };

  const saveRename = async (category: Category) => {
    const name = editName.trim();
    if (!name) {
      setEditError("Category name is required");
      return;
    }

    setIsSaving(true);
    try {
      await updateCategory(category.id, name);
      cancelEditing();
      await loadCategories();
    } catch (err) {
      setEditError(
        err instanceof ApiError && err.errors.length > 0
          ? err.errors.join(", ")
          : "Failed to update category",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
      await loadCategories();
    } catch (err) {
      setDeleteError(
        err instanceof ApiError && err.errors.length > 0
          ? err.errors.join(", ")
          : "Failed to delete category",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const pageStyle: React.CSSProperties = {
    padding: "48px 64px",
    minHeight: "100vh",
    background: COLORS.secondary.s01,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "24px",
    marginBottom: "32px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "40px",
    fontWeight: 700,
    color: COLORS.secondary.s10,
    margin: 0,
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: COLORS.background.main,
    borderRadius: "0.5rem",
    overflow: "hidden",
    border: `1px solid ${COLORS.border}`,
  };

  const theadStyle: React.CSSProperties = {
    backgroundColor: COLORS.background.card,
  };

  const thStyle: React.CSSProperties = {
    padding: "0.75rem",
    textAlign: "left",
    fontWeight: 600,
    color: COLORS.text.primary,
    borderBottom: `2px solid ${COLORS.border}`,
  };

  const tdStyle: React.CSSProperties = {
    padding: "0.75rem",
    borderBottom: `1px solid ${COLORS.border}`,
    color: COLORS.text.primary,
  };

  const actionButtonsStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "center",
  };

  const emptyStyle: React.CSSProperties = {
    padding: "2rem",
    textAlign: "center",
    color: COLORS.text.secondary,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    color: COLORS.danger,
  };

  const loadingStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "48px",
    fontSize: "18px",
    color: COLORS.secondary.s08,
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Categories</h1>
        <CategoryForm onCreated={loadCategories} variant="primary" />
      </div>

      {loadError && <span style={errorStyle}>{loadError}</span>}

      {loading ? (
        <div style={loadingStyle}>Loading...</div>
      ) : categories.length === 0 ? (
        <div style={tableStyle}>
          <div style={emptyStyle}>
            No categories yet. Add your first one!
          </div>
        </div>
      ) : (
        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Updated</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                {editingId === category.id ? (
                  <>
                    <td style={tdStyle}>
                      <TextField
                        value={editName}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          if (editError) setEditError(null);
                        }}
                        error={editError ?? undefined}
                        autoFocus
                        maxLength={100}
                        fullWidth
                      />
                    </td>
                    <td style={tdStyle}>{formatDateTime(category.created_at)}</td>
                    <td style={tdStyle}>{formatDateTime(category.updated_at)}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <div style={actionButtonsStyle}>
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => saveRename(category)}
                          disabled={isSaving}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={cancelEditing}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={tdStyle}>{category.name}</td>
                    <td style={tdStyle}>{formatDateTime(category.created_at)}</td>
                    <td style={tdStyle}>{formatDateTime(category.updated_at)}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <div style={actionButtonsStyle}>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => startEditing(category)}
                        >
                          Rename
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => setDeletingCategory(category)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        isOpen={deletingCategory !== null}
        onClose={() => {
          if (!isDeleting) {
            setDeletingCategory(null);
            setDeleteError(null);
          }
        }}
        title="Delete Category"
      >
        <div style={{ padding: "1rem 0" }}>
          <p style={{ marginBottom: "1rem", color: COLORS.text.primary }}>
            Delete <strong>{deletingCategory?.name}</strong>?
          </p>
          <p style={{ marginBottom: "1rem", color: COLORS.text.secondary }}>
            Its expenses will be moved to {UNCATEGORIZED_CATEGORY_NAME}.
          </p>
          {deleteError && <p style={errorStyle}>{deleteError}</p>}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => {
                setDeletingCategory(null);
                setDeleteError(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
