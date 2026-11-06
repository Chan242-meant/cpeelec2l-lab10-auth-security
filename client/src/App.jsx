import { useState } from "react";
import { useTasks } from "./hooks/useTasks";
import TaskList from "./components/TaskList";
import TaskForm from "./components/TaskForm";
import TaskFilter from "./components/TaskFilter";
import StatusMessage from "./components/StatusMessage";
import "./App.css";

function App() {
  const {
    tasks,
    users,
    filter,
    setFilter,
    counts,
    loading,
    error,
    successMessage,
    clearMessages,
    updatingTaskId,
    updateTaskStatus,
    editTask,
    deleteTask,
    createTask,
    refreshTasks,
  } = useTasks("ALL");

  // Track task currently selected for editing (null = create mode)
  const [editingTask, setEditingTask] = useState(null);

  const handleStartEdit = (task) => {
    setEditingTask(task);
    clearMessages();
    // Smoothly focus or scroll to form on mobile/tablet
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  const handleFormSubmit = async (payload) => {
    if (editingTask) {
      const res = await editTask(editingTask.id, payload);
      if (res && res.success) {
        setEditingTask(null);
      }
      return res;
    }
    return await createTask(payload);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1 className="app-title">Task Management Client</h1>
            <p className="app-subtitle">
              CPEELEC2L Lab 07 — Interactive Full-Stack React Client
            </p>
          </div>
          <button
            type="button"
            className="refresh-btn"
            onClick={refreshTasks}
            disabled={loading}
            title="Reload tasks from MySQL database"
            aria-label="Refresh tasks from server"
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Global Status / Alert Banners with Retry Option */}
      <section className="status-section" aria-label="System Notifications">
        {loading && <StatusMessage type="loading" message="Fetching tasks from server..." />}
        {error && (
          <StatusMessage
            type="error"
            message={error}
            onDismiss={clearMessages}
            onRetry={refreshTasks}
          />
        )}
        {successMessage && (
          <StatusMessage
            type="success"
            message={successMessage}
            onDismiss={clearMessages}
          />
        )}
      </section>

      {/* Main Layout */}
      <main className="main-layout">
        {/* Left Column: Form (Create or Edit) */}
        <div className="form-column">
          <TaskForm
            users={users}
            onSubmit={handleFormSubmit}
            isSubmitting={Boolean(updatingTaskId)}
            editingTask={editingTask}
            onCancelEdit={handleCancelEdit}
          />
        </div>

        {/* Right Column: Filters and Task List */}
        <div className="tasks-column">
          <section className="tasks-section" aria-labelledby="tasks-heading">
            <div className="tasks-header">
              <h2 id="tasks-heading" className="section-title">
                Tasks ({tasks.length})
              </h2>
              <TaskFilter
                currentFilter={filter}
                onFilterChange={setFilter}
                counts={counts}
              />
            </div>

            {loading && tasks.length === 0 ? (
              <div className="loading-placeholder" role="status">
                <p>⏳ Loading tasks from database...</p>
              </div>
            ) : (
              <TaskList
                tasks={tasks}
                onEditTask={handleStartEdit}
                onStatusChange={updateTaskStatus}
                onDeleteTask={deleteTask}
                updatingTaskId={updatingTaskId}
                editingTaskId={editingTask?.id}
              />
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Connected to Express API at <code>{import.meta.env.VITE_API_URL || "http://localhost:5000"}</code>
        </p>
      </footer>
    </div>
  );
}

export default App;
