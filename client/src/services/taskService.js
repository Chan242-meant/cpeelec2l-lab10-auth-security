// taskService encapsulates all HTTP fetch calls to the Express REST API
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const taskService = {
  // GET /tasks with optional status filter
  async getTasks(status) {
    const url =
      status && status !== "ALL"
        ? `${API_URL}/tasks?status=${encodeURIComponent(status)}`
        : `${API_URL}/tasks`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks (HTTP ${response.status})`);
    }
    return response.json();
  },

  // GET /tasks/:id
  async getTaskById(id) {
    const response = await fetch(`${API_URL}/tasks/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch task ${id} (HTTP ${response.status})`);
    }
    return response.json();
  },

  // POST /tasks
  async createTask(taskData) {
    const response = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData.errors?.join(", ") ||
        errorData.error ||
        `Failed to create task (HTTP ${response.status})`;
      throw new Error(message);
    }
    return response.json();
  },

  // PUT /tasks/:id
  async updateTask(id, updateData) {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData.errors?.join(", ") ||
        errorData.error ||
        `Failed to update task (HTTP ${response.status})`;
      throw new Error(message);
    }
    return response.json();
  },

  // DELETE /tasks/:id
  async deleteTask(id) {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Failed to delete task ${id} (HTTP ${response.status})`);
    }
    return response.json();
  },

  // GET /users (for populating user select dropdown)
  async getUsers() {
    const response = await fetch(`${API_URL}/users`);
    if (!response.ok) {
      throw new Error(`Failed to fetch users (HTTP ${response.status})`);
    }
    return response.json();
  },
};
