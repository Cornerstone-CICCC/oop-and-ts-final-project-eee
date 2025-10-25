import { KanbanBoard } from "./KanbanBoard.js";

function main() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    initializeApp();
  }
}

function initializeApp() {
  try {
    const kanbanBoard = new KanbanBoard();
    (window as any).kanbanBoard = kanbanBoard;
  } catch (error) {
    const errorMessage = document.createElement("div");
    errorMessage.className =
      "fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50";
    errorMessage.innerHTML = `
      <strong class="font-bold">Error!</strong>
      <span class="block sm:inline">Failed to initialize the application. Please refresh the page.</span>
    `;
    document.body.appendChild(errorMessage);

    setTimeout(() => {
      errorMessage.remove();
    }, 5000);
  }
}

main();
