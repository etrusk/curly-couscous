/**
 * EmptyPanel - Placeholder panel preserving grid layout space.
 * Replaces RuleEvaluations panel with instruction message.
 */

import styles from "./EmptyPanel.module.css";

export function EmptyPanel() {
  return (
    <div className={styles.panel} role="region" aria-label="Rule Evaluations">
      <h2 className={styles.header}>Rule Evaluations</h2>
      <div className={styles.message}>
        Hover over characters to see evaluations
      </div>
    </div>
  );
}
