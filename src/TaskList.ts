import { Task, TaskStatus, TaskPriority, ITask } from "./Task.js";

export class TaskList {
  private tasks: Task[] = [];
  private storageKey = "kanban-tasks";

  constructor(loadSampleData: boolean = false) {
    this.loadFromStorage();

    if (loadSampleData && this.tasks.length === 0) {
      this.loadSampleData();
    }
  }

  private loadSampleData(): void {}

  setTasks(tasks: Task[]): void {
    this.tasks = tasks;
    this.saveToStorage();
  }

  getTasks(): Task[] {
    return this.tasks;
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.find((task) => task.id === id);
  }

  getTasksByStatus(status: TaskStatus): Task[] {
    return this.tasks.filter((task) => task.status === status);
  }

  getTasksByPriority(priority: TaskPriority): Task[] {
    return this.tasks.filter((task) => task.priority === priority);
  }

  add(task: Task): void {
    this.tasks.push(task);
    this.saveToStorage();
  }

  update(id: string, updates: Partial<ITask>): void {
    const task = this.getTaskById(id);
    if (task) {
      task.update(updates);
      this.saveToStorage();
    }
  }

  delete(id: string): void {
    const index = this.tasks.findIndex((task) => task.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      this.saveToStorage();
    }
  }

  moveTask(id: string, newStatus: TaskStatus): void {
    const task = this.getTaskById(id);
    if (task) {
      task.update({ status: newStatus });
      this.saveToStorage();
    }
  }

  search(query: string): Task[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return this.tasks;

    return this.tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description.toLowerCase().includes(lowerQuery)
    );
  }

  sortByDueDate(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }

  sortByPriority(tasks: Task[]): Task[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...tasks].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  getStatistics() {
    return {
      total: this.tasks.length,
      todo: this.getTasksByStatus("todo").length,
      inprogress: this.getTasksByStatus("inprogress").length,
      done: this.getTasksByStatus("done").length,
      high: this.getTasksByPriority("high").length,
      medium: this.getTasksByPriority("medium").length,
      low: this.getTasksByPriority("low").length,
      overdue: this.tasks.filter((task) => task.isOverdue()).length,
    };
  }

  private saveToStorage(): void {
    try {
      const data = this.tasks.map((task) => task.toJSON());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const tasks: ITask[] = JSON.parse(data);
        this.tasks = tasks.map((taskData) => Task.fromJSON(taskData));
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      this.tasks = [];
    }
  }

  clear(): void {
    this.tasks = [];
    this.saveToStorage();
  }
}
