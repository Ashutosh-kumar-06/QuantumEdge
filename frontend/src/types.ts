// ============================================================================
// types.ts — TypeScript Type Definitions
// This file defines the "shapes" (interfaces) of the data used throughout
// the application. Think of interfaces like blueprints — they describe what
// properties an object must have and what type each property should be.
// ============================================================================

// 'export' makes this interface available to other files that import it.
// 'interface' defines a custom data type (a blueprint for an object).
// 'Module' represents a single learning module in the quantum computing curriculum.
export interface Module {
  // 'id' is a unique text identifier for this module (e.g., "module-1").
  id: string;

  // 'title' is the display name of the module (e.g., "Introduction to Qubits").
  title: string;

  // 'description' is a short summary of what the module teaches.
  description: string;

  // 'prerequisites' is a list (array) of module IDs that should be completed
  // before starting this one. Each item in the array is a string.
  prerequisites: string[];

  // 'estHours' is the estimated number of hours it takes to complete this module.
  // It is a number (can be a decimal like 1.5).
  estHours: number;

  // 'starterCode' is the initial code that appears in the code editor when
  // a student opens the lab for this module.
  starterCode: string;

  // 'content' holds the full tutorial text for this module, written in Markdown
  // format (a simple text formatting language used for rich text).
  content: string;
}

// 'Progress' represents a student's progress on a specific module.
// It tracks whether the module has been completed and what score was achieved.
export interface Progress {
  // 'moduleId' links this progress record to a specific Module by its id.
  moduleId: string;

  // 'completed' is a boolean (true/false) indicating whether the student
  // has finished this module.
  completed: boolean;

  // 'score' is a numeric score the student earned on this module
  // (e.g., a grade from 0 to 100).
  score: number;
}
