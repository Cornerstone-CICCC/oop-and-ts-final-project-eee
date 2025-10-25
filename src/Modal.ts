import { Task } from "./Task.js";

export type ModalType = "view" | "add" | "edit" | "delete";

interface ModalConfig {
  type: ModalType;
  task?: Task;
  onConfirm?: (data?: any) => void;
  onCancel?: () => void;
}

export class Modal {
  private container: HTMLElement;
  private config: ModalConfig;

  constructor(config: ModalConfig) {
    this.config = config;
    this.container = document.getElementById("modalContainer")!;
  }

  show(): void {
    this.render();
    this.attachEventListeners();
  }

  close(): void {
    this.container.innerHTML = "";
    if (this.config.onCancel) {
      this.config.onCancel();
    }
  }

  private render(): void {
    const modalHTML = this.getModalHTML();
    this.container.innerHTML = modalHTML;
  }

  private getModalHTML(): string {
    switch (this.config.type) {
      case "view":
        return this.getViewModalHTML();
      case "add":
        return this.getAddEditModalHTML("Add New Task");
      case "edit":
        return this.getAddEditModalHTML("Edit Task");
      case "delete":
        return this.getDeleteModalHTML();
      default:
        return "";
    }
  }

  private createModalWrapper(
    content: string,
    maxWidth: string = "max-w-2xl"
  ): string {
    return `
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" id="modalBackdrop">
        <div class="bg-white rounded-lg shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto modal">
          ${content}
        </div>
      </div>
    `;
  }

  private createModalHeader(title: string): string {
    return `
      <div class="p-6 border-b border-custorm-border">
        <div class="flex items-start justify-between gap-4">
          <h2 class="text-xl font-semibold text-custorm-text">${title}</h2>
          <button id="closeModal" class="text-notion-custorm hover:text-custorm-text text-xl leading-none shrink-0">
            ×
          </button>
        </div>
      </div>
    `;
  }

  private createModalFooter(buttons: string): string {
    return `
      <div class="p-4 border-t border-custorm-border flex justify-end gap-2">
        ${buttons}
      </div>
    `;
  }

  private getViewModalHTML(): string {
    const task = this.config.task!;
    const priorityIcon = this.getPriorityIcon(task.priority);
    const isOverdue = task.isOverdue();

    const content = `
      ${this.createModalHeader(this.escapeHtml(task.title))}
      
      <div class="p-6 space-y-5">
        <div>
          <label class="text-xs font-medium text-custorm-textLight uppercase tracking-wide">Priority</label>
          <div class="mt-2">
            <span class="inline-flex items-center gap-1.5 text-sm">
              <span>${priorityIcon}</span>
              <span class="text-custorm-text">${task.getPriorityLabel()}</span>
            </span>
          </div>
        </div>
        <div>
          <label class="text-xs font-medium text-custorm-textLight uppercase tracking-wide">Status</label>
          <div class="mt-2">
            <span class="inline-block px-2.5 py-1 text-sm bg-custorm-hover rounded text-custorm-text">
              ${this.getStatusLabel(task.status)}
            </span>
          </div>
        </div>
        ${
          task.dueDate
            ? `
          <div>
            <label class="text-xs font-medium text-custorm-textLight uppercase tracking-wide">Due Date</label>
            <div class="mt-2 flex items-center gap-2">
              <span class="text-sm text-custorm-text">${task.getFormattedDueDate()}</span>
              ${
                isOverdue
                  ? '<span class="text-xs text-red-600 font-medium">⚠️ Overdue</span>'
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }
        <div>
          <label class="text-xs font-medium text-custorm-textLight uppercase tracking-wide">Description</label>
          <p class="mt-2 text-sm text-custorm-text whitespace-pre-wrap leading-relaxed">${this.escapeHtml(
            task.description
          )}</p>
        </div>
        <div class="pt-4 border-t border-custorm-border">
          <div class="text-xs text-custorm-textLight space-y-1">
            <p>Created: ${new Date(task.createdAt).toLocaleString("en-CA", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</p>
            <p>Updated: ${new Date(task.updatedAt).toLocaleString("en-CA", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</p>
          </div>
        </div>
      </div>

      ${this.createModalFooter(`
        <button id="editTaskBtn" class="button px-4 py-1.5 bg-custorm-black hover:opacity-90 text-white text-sm rounded font-medium">
          Edit
        </button>
        <button id="deleteTaskBtn" class="button px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-medium">
          Delete
        </button>
        <button id="closeModalBtn" class="button px-4 py-1.5 bg-white hover:bg-custorm-hover border border-custorm-border text-custorm-text text-sm rounded font-medium">
          Close
        </button>
      `)}
    `;

    return this.createModalWrapper(content);
  }

  private getAddEditModalHTML(title: string): string {
    const task = this.config.task;
    const isEdit = this.config.type === "edit";

    const formContent = `
      ${this.createModalHeader(title)}
      
      <form id="taskForm" class="p-6 space-y-5">
        <div>
          <label for="taskTitle" class="block text-xs font-medium text-custorm-textLight uppercase tracking-wide mb-2">
            Title <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="taskTitle"
            name="title"
            required
            value="${isEdit ? this.escapeHtml(task!.title) : ""}"
            class="w-full px-3 py-2 text-sm bg-white border border-custorm-border rounded focus:outline-none focus:border-custorm-black transition-colors"
            placeholder="Task title..."
          >
        </div>
        <div>
          <label for="taskDescription" class="block text-xs font-medium text-custorm-textLight uppercase tracking-wide mb-2">
            Description <span class="text-red-500">*</span>
          </label>
          <textarea
            id="taskDescription"
            name="description"
            required
            rows="4"
            class="w-full px-3 py-2 text-sm bg-white border border-custorm-border rounded focus:outline-none focus:border-custorm-black resize-none transition-colors"
            placeholder="Add description..."
          >${isEdit ? this.escapeHtml(task!.description) : ""}</textarea>
        </div>
        <div>
          <label for="taskPriority" class="block text-xs font-medium text-custorm-textLight uppercase tracking-wide mb-2">
            Priority
          </label>
          <select
            id="taskPriority"
            name="priority"
            class="w-full px-3 py-2 text-sm bg-white border border-custorm-border rounded focus:outline-none focus:border-custorm-black transition-colors"
          >
            <option value="low" ${
              isEdit && task!.priority === "low" ? "selected" : ""
            }>🟢 Low</option>
            <option value="medium" ${
              isEdit && task!.priority === "medium" ? "selected" : "selected"
            }>🟡 Medium</option>
            <option value="high" ${
              isEdit && task!.priority === "high" ? "selected" : ""
            }>🔴 High</option>
          </select>
        </div>
        ${
          isEdit
            ? `
          <div>
            <label for="taskStatus" class="block text-xs font-medium text-custorm-textLight uppercase tracking-wide mb-2">
              Status
            </label>
            <select
              id="taskStatus"
              name="status"
              class="w-full px-3 py-2 text-sm bg-white border border-custorm-border rounded focus:outline-none focus:border-custorm-black transition-colors"
            >
              <option value="todo" ${
                task!.status === "todo" ? "selected" : ""
              }>To Do</option>
              <option value="inprogress" ${
                task!.status === "inprogress" ? "selected" : ""
              }>In Progress</option>
              <option value="done" ${
                task!.status === "done" ? "selected" : ""
              }>Done</option>
            </select>
          </div>
        `
            : ""
        }
        <div>
          <label for="taskDueDate" class="block text-xs font-medium text-custorm-textLight uppercase tracking-wide mb-2">
            Due Date (Optional)
          </label>
          <input
            type="date"
            id="taskDueDate"
            name="dueDate"
            value="${
              isEdit && task!.dueDate ? task!.dueDate.split("T")[0] : ""
            }"
            class="w-full px-3 py-2 text-sm bg-white border border-custorm-border rounded focus:outline-none focus:border-custorm-black transition-colors"
          >
        </div>
      </form>

      ${this.createModalFooter(`
        <button id="cancelBtn" class="button px-4 py-1.5 bg-white hover:bg-custorm-hover border border-custorm-border text-custorm-text text-sm rounded font-medium">
          Cancel
        </button>
        <button id="saveBtn" class="button px-4 py-1.5 bg-custorm-black hover:opacity-90 text-white text-sm rounded font-medium">
          ${isEdit ? "Save" : "Create"}
        </button>
      `)}
    `;

    return this.createModalWrapper(formContent);
  }

  private getDeleteModalHTML(): string {
    const task = this.config.task!;

    const deleteContent = `
      <div class="p-6">
        <div class="flex items-center justify-center w-12 h-12 mx-auto bg-red-50 rounded-full mb-4">
          <span class="text-2xl">⚠️</span>
        </div>
        <h2 class="text-lg font-semibold text-custorm-text text-center mb-2">Delete Task</h2>
        <p class="text-sm text-custorm-textLight text-center">
          Are you sure you want to delete <strong class="text-custorm-text">"${this.escapeHtml(
            task.title
          )}"</strong>?<br/>
          This action cannot be undone.
        </p>
      </div>

      ${this.createModalFooter(`
        <button id="cancelBtn" class="button px-4 py-1.5 bg-white hover:bg-custorm-hover border border-custorm-border text-custorm-text text-sm rounded font-medium">
          Cancel
        </button>
        <button id="confirmDeleteBtn" class="button px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-medium">
          Delete
        </button>
      `)}
    `;

    return this.createModalWrapper(deleteContent, "max-w-md");
  }

  private attachEventListeners(): void {
    const closeButtons = [
      document.getElementById("closeModal"),
      document.getElementById("closeModalBtn"),
      document.getElementById("cancelBtn"),
      document.getElementById("modalBackdrop"),
    ];

    closeButtons.forEach((btn) => {
      if (btn) {
        if (btn.id === "modalBackdrop") {
          btn.addEventListener("click", (e) => {
            if (e.target === btn) {
              this.close();
            }
          });
        } else {
          btn.addEventListener("click", () => this.close());
        }
      }
    });

    switch (this.config.type) {
      case "view":
        this.attachViewModalListeners();
        break;
      case "add":
      case "edit":
        this.attachFormModalListeners();
        break;
      case "delete":
        this.attachDeleteModalListeners();
        break;
    }
  }

  private attachViewModalListeners(): void {
    const editBtn = document.getElementById("editTaskBtn");
    const deleteBtn = document.getElementById("deleteTaskBtn");

    if (editBtn && this.config.task) {
      editBtn.addEventListener("click", () => {
        this.container.innerHTML = "";

        if (this.config.onConfirm) {
          this.config.onConfirm({ action: "edit", task: this.config.task });
        }
      });
    }

    if (deleteBtn && this.config.task) {
      deleteBtn.addEventListener("click", () => {
        this.container.innerHTML = "";

        if (this.config.onConfirm) {
          this.config.onConfirm({ action: "delete", task: this.config.task });
        }
      });
    }
  }

  private attachFormModalListeners(): void {
    const form = document.getElementById("taskForm") as HTMLFormElement;
    const saveBtn = document.getElementById("saveBtn");

    if (saveBtn) {
      saveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (form.checkValidity()) {
          const formData = new FormData(form);
          const data = {
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            priority: formData.get("priority") as any,
            status: formData.get("status") as any,
            dueDate: (formData.get("dueDate") as string) || undefined,
          };

          if (this.config.onConfirm) {
            this.config.onConfirm(data);
          }
          this.close();
        } else {
          form.reportValidity();
        }
      });
    }
  }

  private attachDeleteModalListeners(): void {
    const confirmBtn = document.getElementById("confirmDeleteBtn");

    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        if (this.config.onConfirm) {
          this.config.onConfirm();
        }
        this.close();
      });
    }
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "inprogress":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "done":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case "todo":
        return "To Do";
      case "inprogress":
        return "In Progress";
      case "done":
        return "Done";
      default:
        return status;
    }
  }

  private getPriorityIcon(priority: string): string {
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

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
