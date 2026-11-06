// TaskItem displays an individual task card with edit, status change, and delete capabilities
function TaskItem({ task, onEdit, onStatusChange, onDelete, isUpdating = false, isEditing = false }) {
  const formattedDate = task.createdAt
    ? new Date(task.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const handleStatusSelect = (e) => {
    const newStatus = e.target.value;
    if (newStatus !== task.status && onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(task.id, task.title);
    }
  };

  return (
    <article className={`task-card status-border-${task.status.toLowerCase()} ${isEditing ? "card-editing" : ""}`}>
      <div className="task-header">
        <h3 className="task-title">
          {task.title}
          {isEditing && <span className="editing-badge">Editing now</span>}
        </h3>
        <span className={`task-badge badge-${task.status.toLowerCase()}`}>
          {task.status.replace("_", " ")}
        </span>
      </div>

      <p className="task-description">
        {task.description ? task.description : <em className="text-muted">No description provided.</em>}
      </p>

      <div className="task-meta">
        <span className="task-user" title="Assigned User">
          👤 <strong>{task.user?.name || `User #${task.userId}`}</strong>
        </span>
        {formattedDate && (
          <span className="task-date" title="Created date">
            📅 {formattedDate}
          </span>
        )}
      </div>

      <div className="task-actions">
        {/* Quick status dropdown */}
        <label className="action-label" htmlFor={`status-select-${task.id}`}>
          Status:
        </label>
        <select
          id={`status-select-${task.id}`}
          className="status-dropdown"
          value={task.status}
          onChange={handleStatusSelect}
          disabled={isUpdating}
          aria-label={`Update status for ${task.title}`}
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>

        {/* Edit Button */}
        <button
          type="button"
          className="edit-btn"
          onClick={handleEditClick}
          disabled={isUpdating}
          aria-label={`Edit task: ${task.title}`}
        >
          ✏️ Edit
        </button>

        {/* Delete Button */}
        <button
          type="button"
          className="delete-btn"
          onClick={handleDeleteClick}
          disabled={isUpdating}
          aria-label={`Delete task: ${task.title}`}
        >
          🗑️ Delete
        </button>
      </div>
    </article>
  );
}

export default TaskItem;
