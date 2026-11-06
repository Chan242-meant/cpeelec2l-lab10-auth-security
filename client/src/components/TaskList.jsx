import TaskItem from "./TaskItem";

// TaskList renders a responsive grid of TaskItems, or an accessible empty state message
function TaskList({ tasks = [], onEditTask, onStatusChange, onDeleteTask, updatingTaskId, editingTaskId }) {
  if (tasks.length === 0) {
    return (
      <div className="task-empty-state" role="region" aria-label="No tasks">
        <div className="empty-icon" aria-hidden="true">📋</div>
        <h3>No tasks yet</h3>
        <p>There are no tasks matching the current filter. Try selecting another filter or create a new task using the form.</p>
      </div>
    );
  }

  return (
    <section className="task-list-grid" aria-label="Tasks List">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onEdit={onEditTask}
          onStatusChange={onStatusChange}
          onDelete={onDeleteTask}
          isUpdating={updatingTaskId === task.id}
          isEditing={editingTaskId === task.id}
        />
      ))}
    </section>
  );
}

export default TaskList;
