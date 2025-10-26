import { Task, TaskStatus, TaskPriority } from "./Task.js";
import { TaskList } from "./TaskList.js";
import { Modal } from "./Modal.js";
import { SampleDataGenerator } from "./SampleDataGenerator.js";

export class KanbanBoard {
  private taskList: TaskList;
  private currentFilter: TaskPriority | "all" = "all";
  private searchTimeout: number | null = null;
  private dragDropInitialized: boolean = false;

  constructor() {
    this.taskList = new TaskList();

    if (SampleDataGenerator.shouldLoadSampleData()) {
      const sampleTasks = SampleDataGenerator.generateSampleTasks();
      this.taskList.setTasks(sampleTasks);
    }

    this.init();
  }
  private init(): void {
    this.attachEventListeners();
    this.attachDragDropListenersOnce();
    this.render();
    this.updateStatistics();
    this.attachBannerListener();
    this.initializeFilterButtons();
  }

  private initializeFilterButtons(): void {
    const allButton = document.getElementById("filterAll");
    if (allButton) {
      allButton.classList.add("bg-custorm-black", "text-white", "active");
      allButton.classList.remove("bg-white", "text-custorm-text");
    }
  }
  private attachBannerListener(): void {
    const closeBannerBtn = document.getElementById("closeBanner");
    const banner = closeBannerBtn?.closest(".bg-blue-50");

    if (closeBannerBtn && banner) {
      const bannerClosed = localStorage.getItem("kanban-banner-closed");
      if (bannerClosed === "true") {
        (banner as HTMLElement).style.display = "none";
      }

      closeBannerBtn.addEventListener("click", () => {
        (banner as HTMLElement).style.display = "none";
        localStorage.setItem("kanban-banner-closed", "true");
      });
    }
  }
  render(): void {
    this.renderColumn("todo");
    this.renderColumn("inprogress");
    this.renderColumn("done");
    this.updateStatistics();
  }
  private renderColumn(status: TaskStatus): void {
    const column = document.getElementById(`${status}Column`);
    if (!column) return;

    let tasks = this.taskList.getTasksByStatus(status);

    if (this.currentFilter !== "all") {
      tasks = tasks.filter((task) => task.priority === this.currentFilter);
    }

    tasks = this.taskList.sortByPriority(tasks);

    column.innerHTML =
      tasks.length === 0
        ? this.getEmptyStateHTML(status)
        : tasks.map((task) => this.getTaskCardHTML(task)).join("");

    const countBadge = document.querySelector(`[data-count="${status}"]`);
    if (countBadge) {
      countBadge.textContent = tasks.length.toString();
    }

    this.attachTaskCardListenersForColumn(status);
  }
  private attachTaskCardListenersForColumn(status: TaskStatus): void {
    const column = document.getElementById(`${status}Column`);
    if (!column) return;

    const taskCards = column.querySelectorAll(".task-card");
    taskCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        if ((card as HTMLElement).classList.contains("dragging")) return;

        const taskId = (card as HTMLElement).dataset.taskId;
        if (taskId) {
          const task = this.taskList.getTaskById(taskId);
          if (task) {
            this.showViewTaskModal(task);
          }
        }
      });
    });
  }
  private getTaskCardHTML(task: Task): string {
    const priorityIcon = this.getPriorityIcon(task.priority);
    const isOverdue = task.isOverdue();

    return `
      <div 
        class="task-card bg-white border border-custorm-border rounded p-3 cursor-pointer shadow-sm"
        draggable="true"
        data-task-id="${task.id}"
      >
        <div class="flex items-start gap-2 mb-2">
          <span class="text-sm">${priorityIcon}</span>
          <h3 class="text-sm font-medium text-custorm-text flex-1 leading-snug">${this.escapeHtml(
            task.title
          )}</h3>
        </div>
        
        ${
          task.description
            ? `
          <p class="text-xs text-custorm-textLight mb-2 line-clamp-2 leading-relaxed">${this.escapeHtml(
            task.description
          )}</p>
        `
            : ""
        }
        
        ${
          task.dueDate
            ? `
          <div class="flex items-center gap-1.5 text-xs ${
            isOverdue ? "text-red-600" : "text-custorm-textLight"
          }">
            <span>📅</span>
            <span>${task.getFormattedDueDate()}</span>
            ${isOverdue ? '<span class="ml-1">⚠️</span>' : ""}
          </div>
        `
            : ""
        }
      </div>
    `;
  }
  private getPriorityIcon(priority: TaskPriority): string {
    switch (priority) {
      case "high":
        return "🔴";
      case "medium":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  }
  private getEmptyStateHTML(status: TaskStatus): string {
    const messages = {
      todo: "No tasks",
      inprogress: "No tasks in progress",
      done: "No completed tasks",
    };

    return `
      <div class="flex flex-col items-center justify-center py-8 text-custorm-textLight">
        <span class="text-3xl mb-2 opacity-50">📭</span>
        <p class="text-xs">${messages[status]}</p>
      </div>
    `;
  }
  private attachEventListeners(): void {
    const addTaskBtn = document.getElementById("addTaskBtn");
    if (addTaskBtn) {
      addTaskBtn.addEventListener("click", () => this.showAddTaskModal());
    }

    const clearAllBtn = document.getElementById("clearAllBtn");
    if (clearAllBtn) {
      clearAllBtn.addEventListener("click", () => this.handleClearAll());
    }

    const searchInput = document.getElementById(
      "searchInput"
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener("input", (e) => this.handleSearch(e));
      searchInput.addEventListener("focus", () => this.showSearchResults());

      document.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (
          !searchInput.contains(target) &&
          !document.getElementById("searchResults")?.contains(target)
        ) {
          this.hideSearchResults();
        }
      });
    }

    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleFilter(e));
    });

    this.attachKeyboardShortcuts();
  }
  private attachKeyboardShortcuts(): void {
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById(
          "searchInput"
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        this.showAddTaskModal();
      }

      if (e.key === "Escape") {
        this.hideSearchResults();
      }
    });
  }
  private handleClearAll(): void {
    if (
      confirm(
        "Are you sure you want to delete ALL tasks? This action cannot be undone."
      )
    ) {
      this.taskList.clear();
      this.render();
    }
  }
  private attachDragDropListenersOnce(): void {
    if (this.dragDropInitialized) return;

    const board = document.getElementById("kanbanBoard");
    if (!board) return;

    board.addEventListener("dragstart", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("task-card")) {
        this.onDragStart(e);
      }
    });

    board.addEventListener("dragend", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("task-card")) {
        this.onDragEnd(e);
      }
    });

    board.addEventListener("dragover", (e) => {
      const target = e.target as HTMLElement;
      const column = target.closest("[data-column]");
      if (column) {
        this.onDragOver(e);
      }
    });

    board.addEventListener("dragleave", (e) => {
      const target = e.target as HTMLElement;
      const column = target.closest("[data-column]");
      if (column && !column.contains(e.relatedTarget as Node)) {
        this.onDragLeave(e);
      }
    });

    board.addEventListener("drop", (e) => {
      const target = e.target as HTMLElement;
      const column = target.closest("[data-column]");
      if (column) {
        this.onDrop(e);
      }
    });

    this.dragDropInitialized = true;
  }
  private onDragStart(e: Event): void {
    const dragEvent = e as DragEvent;
    const target = dragEvent.target as HTMLElement;

    target.classList.add("dragging");

    if (dragEvent.dataTransfer) {
      dragEvent.dataTransfer.effectAllowed = "move";
      dragEvent.dataTransfer.setData("text/html", target.innerHTML);
      dragEvent.dataTransfer.setData("taskId", target.dataset.taskId || "");
    }
  }
  private onDragEnd(e: Event): void {
    const target = e.target as HTMLElement;
    target.classList.remove("dragging");

    document.querySelectorAll("[data-column]").forEach((col) => {
      col.classList.remove("drag-over");
    });
  }
  private onDragOver(e: Event): void {
    e.preventDefault();
    const dragEvent = e as DragEvent;
    const target = dragEvent.target as HTMLElement;
    const column = target.closest("[data-column]") as HTMLElement;

    if (dragEvent.dataTransfer && column) {
      dragEvent.dataTransfer.dropEffect = "move";
      column.classList.add("drag-over");
    }
  }
  private onDragLeave(e: Event): void {
    const dragEvent = e as DragEvent;
    const target = dragEvent.target as HTMLElement;
    const column = target.closest("[data-column]") as HTMLElement;

    if (column) {
      column.classList.remove("drag-over");
    }
  }
  private onDrop(e: Event): void {
    e.preventDefault();
    e.stopPropagation();

    const dragEvent = e as DragEvent;
    const target = dragEvent.target as HTMLElement;
    const column = target.closest("[data-column]") as HTMLElement;

    document.querySelectorAll("[data-column]").forEach((col) => {
      col.classList.remove("drag-over");
    });

    if (dragEvent.dataTransfer && column) {
      const taskId = dragEvent.dataTransfer.getData("taskId");
      const newStatus = column.dataset.column as TaskStatus;

      if (taskId && newStatus) {
        const task = this.taskList.getTaskById(taskId);
        if (task && task.status !== newStatus) {
          this.taskList.moveTask(taskId, newStatus);
          this.render();
        }
      }
    }
  }
  private handleSearch(e: Event): void {
    const input = e.target as HTMLInputElement;
    const query = input.value.trim();

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = window.setTimeout(() => {
      this.performSearch(query);
    }, 300);
  }
  private performSearch(query: string): void {
    const resultsContainer = document.getElementById("searchResults");
    if (!resultsContainer) return;

    if (!query) {
      this.hideSearchResults();
      return;
    }

    const results = this.taskList.search(query);

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="p-3 text-center text-xs text-custorm-textLight">
          No results found
        </div>
      `;
    } else {
      resultsContainer.innerHTML = results
        .map((task) => {
          const priorityIcon = this.getPriorityIcon(task.priority);
          return `
        <div 
          class="p-2.5 border-b border-custorm-border last:border-b-0 cursor-pointer search-result-item transition-colors"
          data-task-id="${task.id}"
        >
          <div class="text-sm font-medium text-custorm-text flex items-center gap-1.5">
            <span class="text-xs">${priorityIcon}</span>
            <span>${this.escapeHtml(task.title)}</span>
          </div>
          <div class="text-xs text-custorm-textLight mt-1">
            ${this.getStatusLabel(task.status)}
          </div>
        </div>
      `;
        })
        .join("");

      resultsContainer
        .querySelectorAll(".search-result-item")
        .forEach((item) => {
          item.addEventListener("click", () => {
            const taskId = (item as HTMLElement).dataset.taskId;
            if (taskId) {
              const task = this.taskList.getTaskById(taskId);
              if (task) {
                this.showViewTaskModal(task);
                this.hideSearchResults();
                (
                  document.getElementById("searchInput") as HTMLInputElement
                ).value = "";
              }
            }
          });
        });
    }

    this.showSearchResults();
  }
  private showSearchResults(): void {
    const resultsContainer = document.getElementById("searchResults");
    if (resultsContainer && resultsContainer.innerHTML) {
      resultsContainer.classList.remove("hidden");
    }
  }
  private hideSearchResults(): void {
    const resultsContainer = document.getElementById("searchResults");
    if (resultsContainer) {
      resultsContainer.classList.add("hidden");
    }
  }
  private handleFilter(e: Event): void {
    const button = e.target as HTMLElement;
    const filterId = button.id;

    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("bg-custorm-black", "text-white", "active");
      btn.classList.add(
        "bg-white",
        "border-custorm-border",
        "text-custorm-text"
      );
    });
    button.classList.remove(
      "bg-white",
      "border-custorm-border",
      "text-custorm-text"
    );
    button.classList.add("bg-custorm-black", "text-white", "active");

    switch (filterId) {
      case "filterAll":
        this.currentFilter = "all";
        break;
      case "filterLow":
        this.currentFilter = "low";
        break;
      case "filterMedium":
        this.currentFilter = "medium";
        break;
      case "filterHigh":
        this.currentFilter = "high";
        break;
    }

    this.render();
  }
  private showAddTaskModal(): void {
    const modal = new Modal({
      type: "add",
      onConfirm: (data) => {
        const task = new Task(
          data.title,
          data.description,
          "todo",
          data.priority,
          data.dueDate
        );
        this.taskList.add(task);
        this.render();
      },
    });
    modal.show();
  }
  private showViewTaskModal(task: Task): void {
    const modal = new Modal({
      type: "view",
      task,
      onConfirm: (data) => {
        if (data.action === "edit") {
          this.showEditTaskModal(task);
        } else if (data.action === "delete") {
          this.showDeleteTaskModal(task);
        }
      },
    });
    modal.show();
  }
  private showEditTaskModal(task: Task): void {
    const modal = new Modal({
      type: "edit",
      task,
      onConfirm: (data) => {
        this.taskList.update(task.id, data);
        this.render();
      },
    });
    modal.show();
  }
  private showDeleteTaskModal(task: Task): void {
    const modal = new Modal({
      type: "delete",
      task,
      onConfirm: () => {
        this.taskList.delete(task.id);
        this.render();
      },
    });
    modal.show();
  }
  private updateStatistics(): void {
    const stats = this.taskList.getStatistics();
    const taskCountElement = document.getElementById("taskCount");

    if (taskCountElement) {
      taskCountElement.textContent = `${stats.total} task${
        stats.total !== 1 ? "s" : ""
      }`;
    }
  }
  private getStatusLabel(status: TaskStatus): string {
    const labels = {
      todo: "To Do",
      inprogress: "In Progress",
      done: "Done",
    };
    return labels[status];
  }
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
