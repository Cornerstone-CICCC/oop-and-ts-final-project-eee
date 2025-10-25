import { Task } from "./Task.js";

export class SampleDataGenerator {
  static generateSampleTasks(): Task[] {
    const sampleTasks = [
      {
        title: "Design Homepage Mockup",
        description:
          "Create a high-fidelity mockup for the new homepage design using Figma. Include mobile and desktop versions.",
        status: "todo" as const,
        priority: "high" as const,
        dueDate: this.getFutureDate(3),
      },
      {
        title: "Setup Development Environment",
        description:
          "Install Node.js, VS Code, and configure Git. Setup the project repository and install all dependencies.",
        status: "done" as const,
        priority: "high" as const,
        dueDate: this.getPastDate(2),
      },
      {
        title: "Implement User Authentication",
        description:
          "Build login and registration functionality with JWT tokens. Include password reset feature.",
        status: "inprogress" as const,
        priority: "high" as const,
        dueDate: this.getFutureDate(5),
      },
      {
        title: "Write Unit Tests",
        description:
          "Create comprehensive unit tests for all core functionality. Aim for 80% code coverage.",
        status: "todo" as const,
        priority: "medium" as const,
        dueDate: this.getFutureDate(7),
      },
      {
        title: "Update Documentation",
        description:
          "Update the README file with latest features and installation instructions. Include API documentation.",
        status: "todo" as const,
        priority: "low" as const,
        dueDate: this.getFutureDate(10),
      },
      {
        title: "Code Review - PR #42",
        description:
          "Review the pull request for the new dashboard feature. Check for code quality and test coverage.",
        status: "inprogress" as const,
        priority: "medium" as const,
        dueDate: this.getFutureDate(1),
      },
      {
        title: "Fix CSS Responsiveness Issues",
        description:
          "Address mobile layout problems on iOS devices. Test on multiple screen sizes.",
        status: "todo" as const,
        priority: "medium" as const,
        dueDate: this.getFutureDate(4),
      },
      {
        title: "Database Migration",
        description:
          "Create and test database migration scripts for the new user profile fields.",
        status: "done" as const,
        priority: "high" as const,
        dueDate: this.getPastDate(1),
      },
      {
        title: "Performance Optimization",
        description:
          "Optimize bundle size and improve page load time. Target: under 3 seconds.",
        status: "inprogress" as const,
        priority: "low" as const,
        dueDate: this.getFutureDate(14),
      },
      {
        title: "Team Meeting Notes",
        description:
          "Prepare agenda and take notes for the weekly team meeting. Share with the team afterwards.",
        status: "done" as const,
        priority: "low" as const,
        dueDate: this.getPastDate(3),
      },
    ];

    return sampleTasks.map((data) => {
      const task = new Task(
        data.title,
        data.description,
        data.status,
        data.priority,
        data.dueDate
      );
      return task;
    });
  }

  private static getFutureDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split("T")[0];
  }

  private static getPastDate(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split("T")[0];
  }

  static shouldLoadSampleData(): boolean {
    const storageKey = "kanban-tasks";
    const existingData = localStorage.getItem(storageKey);
    return !existingData || existingData === "[]";
  }
}
