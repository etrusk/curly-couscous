/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // === Engine isolation ===
    {
      name: "engine-no-react",
      comment: "Engine must not import React or React DOM",
      severity: "error",
      from: { path: "^src/engine/" },
      to: { path: ["react", "react-dom"] },
    },
    {
      name: "engine-no-state-mgmt",
      comment: "Engine must not import Zustand or Immer",
      severity: "error",
      from: { path: "^src/engine/" },
      to: { path: ["zustand", "immer"] },
    },
    {
      name: "engine-no-components",
      comment: "Engine must not import from components",
      severity: "error",
      from: { path: "^src/engine/" },
      to: { path: "^src/components/" },
    },
    {
      name: "engine-no-stores",
      comment: "Engine must not import from stores",
      severity: "error",
      from: { path: "^src/engine/" },
      to: { path: "^src/stores/" },
    },
    {
      name: "engine-no-hooks",
      comment: "Engine must not import from hooks",
      severity: "error",
      from: { path: "^src/engine/" },
      to: { path: "^src/hooks/" },
    },
    {
      name: "engine-no-styles",
      comment: "Engine must not import from styles",
      severity: "error",
      from: { path: "^src/engine/" },
      to: { path: "^src/styles/" },
    },

    // === Store isolation ===
    {
      name: "stores-no-components",
      comment: "Stores must not import from components",
      severity: "error",
      from: { path: "^src/stores/" },
      to: { path: "^src/components/" },
    },
    {
      name: "stores-no-hooks",
      comment: "Stores must not import from hooks",
      severity: "error",
      from: { path: "^src/stores/" },
      to: { path: "^src/hooks/" },
    },

    // === Hooks isolation ===
    {
      name: "hooks-no-components",
      comment: "Hooks must not import from components",
      severity: "error",
      from: { path: "^src/hooks/" },
      to: { path: "^src/components/" },
    },

    // === Circular dependencies ===
    {
      name: "no-circular",
      comment: "No circular dependencies anywhere in src",
      severity: "error",
      from: { path: "^src/" },
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    exclude: {
      path: ["\\.(test|browser\\.test)\\.(ts|tsx)$", "-test-helpers\\.ts$"],
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
