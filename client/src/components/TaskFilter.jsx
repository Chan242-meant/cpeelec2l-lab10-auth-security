// TaskFilter renders accessible filter buttons to filter tasks by status
function TaskFilter({ currentFilter = "ALL", onFilterChange, counts = {} }) {
  const filterOptions = [
    { key: "ALL", label: "All Tasks" },
    { key: "TODO", label: "To Do" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "DONE", label: "Done" },
  ];

  return (
    <nav className="task-filter-nav" aria-label="Task Status Filters">
      <div className="filter-button-group" role="group" aria-label="Filter tasks">
        {filterOptions.map(({ key, label }) => {
          const isActive = currentFilter === key;
          const count = counts[key];

          return (
            <button
              key={key}
              type="button"
              className={`filter-btn ${isActive ? "active" : ""}`}
              onClick={() => onFilterChange(key)}
              aria-pressed={isActive}
            >
              <span>{label}</span>
              {typeof count === "number" && (
                <span className="filter-badge" aria-label={`${count} tasks`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default TaskFilter;
