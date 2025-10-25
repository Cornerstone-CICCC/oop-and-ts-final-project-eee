export interface ITask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = "todo" | "inprogress" | "done";

export type TaskPriority = "low" | "medium" | "high";

export class Task implements ITask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;

  constructor(
    title: string,
    description: string,
    status: TaskStatus = "todo",
    priority: TaskPriority = "medium",
    dueDate?: string
  ) {
    this.id = this.generateId();
    this.title = title;
    this.description = description;
    this.status = status;
    this.priority = priority;
    this.dueDate = dueDate;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  update(updates: Partial<ITask>): void {
    Object.assign(this, updates);
    this.updatedAt = new Date().toISOString();
  }

  toJSON(): ITask {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      dueDate: this.dueDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromJSON(data: ITask): Task {
    const task = new Task(
      data.title,
      data.description,
      data.status,
      data.priority,
      data.dueDate
    );
    task.id = data.id;
    task.createdAt = data.createdAt;
    task.updatedAt = data.updatedAt;
    return task;
  }

  getPriorityColor(): string {
    switch (this.priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "low":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  }

  getPriorityLabel(): string {
    return this.priority.charAt(0).toUpperCase() + this.priority.slice(1);
  }

  isOverdue(): boolean {
    if (!this.dueDate) return false;
    const [year, month, day] = this.dueDate.split("T")[0].split("-");
    const dueDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today && this.status !== "done";
  }

  getFormattedDueDate(): string {
    if (!this.dueDate) return "No due date";
    const [year, month, day] = this.dueDate.split("T")[0].split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}
