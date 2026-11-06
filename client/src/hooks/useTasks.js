import { useState, useEffect, useCallback } from "react";
import { taskService } from "../services/taskService";

// useTasks encapsulates state, network requests, and synchronization for the tasks resource
export function useTasks(initialFilter = "ALL") {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Clear feedback messages
  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  // Helper to format network or server error messages
  const formatErrorMessage = (err, fallback = "Operation failed") => {
    if (err.name === "TypeError" && err.message?.includes("fetch")) {
      return "Cannot connect to server. Please check that your Express backend is running at http://localhost:5000.";
    }
    return err.message || fallback;
  };

  // 1. Fetch tasks from backend based on active filter
  const fetchTasks = useCallback(async (activeFilter = filter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getTasks(activeFilter);
      setTasks(data);
    } catch (err) {
      setError(formatErrorMessage(err, "Failed to load tasks from server."));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // 2. Fetch users for dropdown
  const fetchUsers = useCallback(async () => {
    try {
      const userData = await taskService.getUsers();
      setUsers(userData);
    } catch (err) {
      console.warn("Could not load users:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchTasks(filter);
  }, [fetchTasks, filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 3. Quick status update (PUT /tasks/:id with status)
  const updateTaskStatus = async (id, newStatus) => {
    setUpdatingTaskId(id);
    clearMessages();
    try {
      const updated = await taskService.updateTask(id, { status: newStatus });
      // Update local state with the exact server response
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? updated : task))
      );
      setSuccessMessage(`Updated status for "${updated.title}" to ${newStatus.replace("_", " ")}.`);
    } catch (err) {
      setError(formatErrorMessage(err, "Failed to update task status."));
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // 4. Full task edit (PUT /tasks/:id with title, description, status, userId)
  const editTask = async (id, updateData) => {
    setUpdatingTaskId(id);
    clearMessages();
    try {
      const updated = await taskService.updateTask(id, updateData);
      // Synchronize with server record
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? updated : task))
      );
      setSuccessMessage(`Task "${updated.title}" updated successfully!`);
      return { success: true, task: updated };
    } catch (err) {
      const message = formatErrorMessage(err, "Failed to update task.");
      setError(message);
      return { success: false, error: message };
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // 5. Delete task (DELETE /tasks/:id) with confirmation
  const deleteTask = async (id, title = "Task") => {
    const confirmed = window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setUpdatingTaskId(id);
    clearMessages();
    try {
      await taskService.deleteTask(id);
      // Remove from state only after server confirmation
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
      setSuccessMessage(`Deleted "${title}" successfully.`);
    } catch (err) {
      setError(formatErrorMessage(err, "Failed to delete task."));
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // 6. Create task (POST /tasks)
  const createTask = async (taskData) => {
    clearMessages();
    try {
      const created = await taskService.createTask(taskData);
      setTasks((prevTasks) => [created, ...prevTasks]);
      setSuccessMessage(`Task "${created.title}" created successfully!`);
      return { success: true, task: created };
    } catch (err) {
      const message = formatErrorMessage(err, "Failed to create task.");
      setError(message);
      return { success: false, error: message };
    }
  };

  // Live counts for status badges
  const counts = {
    ALL: tasks.length,
    TODO: tasks.filter((t) => t.status === "TODO").length,
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    DONE: tasks.filter((t) => t.status === "DONE").length,
  };

  return {
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
    refreshTasks: () => fetchTasks(filter),
  };
}
