import { useState, useEffect } from "react";

// TaskForm handles both creating new tasks and editing existing tasks
function TaskForm({
  users = [],
  onSubmit,
  isSubmitting = false,
  editingTask = null,
  onCancelEdit = null,
}) {
  const isEditMode = Boolean(editingTask);

  // Form input state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO",
    userId: users.length > 0 ? String(users[0].id) : "1",
  });

  // Client-side validation errors
  const [fieldErrors, setFieldErrors] = useState({});

  // Prefill form when an existing task is selected for editing, or reset when canceled
  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title || "",
        description: editingTask.description || "",
        status: editingTask.status || "TODO",
        userId: String(editingTask.userId || (users[0]?.id ?? "1")),
      });
      setFieldErrors({});
    } else {
      setFormData({
        title: "",
        description: "",
        status: "TODO",
        userId: users.length > 0 ? String(users[0].id) : "1",
      });
      setFieldErrors({});
    }
  }, [editingTask, users]);

  // Update input and clear error dynamically
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Client validation logic
  const validateForm = () => {
    const errors = {};
    const trimmedTitle = formData.title.trim();

    if (!trimmedTitle) {
      errors.title = "Task title is required.";
    } else if (trimmedTitle.length > 100) {
      errors.title = `Title cannot exceed 100 characters (currently ${trimmedTitle.length}/100).`;
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = `Description cannot exceed 500 characters (currently ${formData.description.length}/500).`;
    }

    if (!formData.userId) {
      errors.userId = "Please select an assigned user.";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Run client-side validation
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // 2. Prepare payload
    setFieldErrors({});
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      status: formData.status,
      userId: Number(formData.userId),
    };

    // 3. Submit (creates or updates based on mode)
    const result = await onSubmit(payload);

    // 4. Reset form if newly created
    if (result && result.success && !isEditMode) {
      setFormData({
        title: "",
        description: "",
        status: "TODO",
        userId: users.length > 0 ? String(users[0].id) : "1",
      });
    }
  };

  const titleLength = formData.title.length;
  const isTitleOverLimit = titleLength > 100;
  const descLength = formData.description.length;
  const isDescOverLimit = descLength > 500;

  return (
    <section className="form-card" aria-labelledby="form-heading">
      <div className="form-header-bar">
        <h2 id="form-heading" className="section-title">
          {isEditMode ? `✏️ Edit Task #${editingTask.id}` : "➕ Create New Task"}
        </h2>
        {isEditMode && (
          <button
            type="button"
            className="cancel-link-btn"
            onClick={onCancelEdit}
            title="Cancel editing and switch back to Create mode"
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate className="task-form">
        {/* Title Input */}
        <div className="form-group">
          <div className="label-row">
            <label htmlFor="task-title" className="form-label">
              Title <span className="required-star">*</span>
            </label>
            <span
              className={`char-counter-badge ${isTitleOverLimit ? "counter-over" : ""}`}
              aria-label={`Title length: ${titleLength} out of 100 characters`}
            >
              {titleLength}/100
            </span>
          </div>

          <input
            id="task-title"
            name="title"
            type="text"
            className={`form-input ${fieldErrors.title ? "input-error" : ""}`}
            placeholder="e.g., Implement login authentication"
            value={formData.title}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={!!fieldErrors.title}
            aria-describedby={fieldErrors.title ? "title-error" : "title-help"}
          />

          <div className="input-meta">
            {fieldErrors.title ? (
              <span id="title-error" className="error-text" role="alert">
                {fieldErrors.title}
              </span>
            ) : (
              <small id="title-help" className="help-text">
                Required, 1-100 characters.
              </small>
            )}
          </div>
        </div>

        {/* Description Input */}
        <div className="form-group">
          <div className="label-row">
            <label htmlFor="task-description" className="form-label">
              Description <span className="optional-tag">(Optional)</span>
            </label>
            <span
              className={`char-counter-badge ${isDescOverLimit ? "counter-over" : ""}`}
              aria-label={`Description length: ${descLength} out of 500 characters`}
            >
              {descLength}/500
            </span>
          </div>

          <textarea
            id="task-description"
            name="description"
            className={`form-textarea ${fieldErrors.description ? "input-error" : ""}`}
            rows="3"
            placeholder="Describe the task details or requirements..."
            value={formData.description}
            onChange={handleChange}
            aria-invalid={!!fieldErrors.description}
            aria-describedby={fieldErrors.description ? "desc-error" : "desc-help"}
          />

          <div className="input-meta">
            {fieldErrors.description ? (
              <span id="desc-error" className="error-text" role="alert">
                {fieldErrors.description}
              </span>
            ) : (
              <small id="desc-help" className="help-text">
                Max 500 characters.
              </small>
            )}
          </div>
        </div>

        {/* Two-column layout for Status and User */}
        <div className="form-row">
          <div className="form-group form-col">
            <label htmlFor="task-status" className="form-label">
              Status
            </label>
            <select
              id="task-status"
              name="status"
              className="form-select"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div className="form-group form-col">
            <label htmlFor="task-user" className="form-label">
              Assign To <span className="required-star">*</span>
            </label>
            <select
              id="task-user"
              name="userId"
              className={`form-select ${fieldErrors.userId ? "input-error" : ""}`}
              value={formData.userId}
              onChange={handleChange}
              aria-invalid={!!fieldErrors.userId}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {fieldErrors.userId && (
              <span className="error-text" role="alert">
                {fieldErrors.userId}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Save & Cancel */}
        <div className="form-button-row">
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting
              ? isEditMode
                ? "Updating..."
                : "Saving..."
              : isEditMode
              ? "💾 Save Changes"
              : "➕ Create Task"}
          </button>

          {isEditMode && (
            <button
              type="button"
              className="cancel-btn"
              onClick={onCancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default TaskForm;
