/**
 * GSD Milestone Summary Tests
 *
 * Validates the milestone-summary command and workflow files exist
 * and follow expected patterns. Tests artifact discovery logic.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const commandPath = path.join(repoRoot, 'commands', 'gsd', 'milestone-summary.md');
const workflowPath = path.join(repoRoot, 'get-shit-done', 'workflows', 'milestone-summary.md');

describe('milestone-summary command', () => {
  test('command file exists', () => {
    assert.ok(fs.existsSync(commandPath), 'commands/gsd/milestone-summary.md should exist');
  });

  test('command has correct frontmatter name', () => {
    const content = fs.readFileSync(commandPath, 'utf-8');
    assert.ok(content.includes('name: gsd:milestone-summary'), 'should have correct command name');
  });

  test('command references workflow in execution_context', () => {
    const content = fs.readFileSync(commandPath, 'utf-8');
    assert.ok(
      content.includes('workflows/milestone-summary.md'),
      'should reference the milestone-summary workflow'
    );
  });

  test('command accepts optional version argument', () => {
    const content = fs.readFileSync(commandPath, 'utf-8');
    assert.ok(content.includes('argument-hint'), 'should have argument-hint');
    assert.ok(content.includes('[version]'), 'version should be optional (bracketed)');
  });
});

describe('milestone-summary workflow', () => {
  test('workflow file exists', () => {
    assert.ok(fs.existsSync(workflowPath), 'workflows/milestone-summary.md should exist');
  });

  test('workflow reads milestone artifacts', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const requiredArtifacts = [
      'ROADMAP.md',
      'REQUIREMENTS.md',
      'PROJECT.md',
      'SUMMARY.md',
      'VERIFICATION.md',
      'CONTEXT.md',
      'RETROSPECTIVE.md',
    ];
    for (const artifact of requiredArtifacts) {
      assert.ok(
        content.includes(artifact),
        `workflow should reference ${artifact}`
      );
    }
  });

  test('workflow writes to reports directory', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(
      content.includes('.planning/reports/MILESTONE_SUMMARY'),
      'should write summary to .planning/reports/'
    );
  });

  test('workflow has interactive Q&A mode', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(
      content.includes('Interactive Mode') || content.includes('ask anything'),
      'should offer interactive Q&A after summary'
    );
  });

  test('workflow handles both archived and current milestones', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(content.includes('Archived milestone'), 'should handle archived milestones');
    assert.ok(content.includes('Current') || content.includes('in-progress'), 'should handle current milestones');
  });

  test('workflow generates all 7 summary sections', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const sections = [
      'Project Overview',
      'Architecture',
      'Phases Delivered',
      'Requirements Coverage',
      'Key Decisions',
      'Tech Debt',
      'Getting Started',
    ];
    for (const section of sections) {
      assert.ok(
        content.includes(section),
        `summary should include "${section}" section`
      );
    }
  });

  test('workflow updates STATE.md', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(
      content.includes('state record-session'),
      'should update STATE.md via gsd-tools'
    );
  });

  test('workflow has overwrite guard for existing summaries', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(
      content.includes('already exists'),
      'should check for existing summary before overwriting'
    );
  });

  test('workflow handles empty phase directories gracefully', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(
      content.includes('no phase directories') || content.includes('No phases'),
      'should handle case where no phases exist'
    );
  });

  test('workflow checks both audit file locations for archived milestones', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    assert.ok(
      content.includes('.planning/milestones/v${VERSION}-MILESTONE-AUDIT.md'),
      'should check milestones/ directory for archived audit file'
    );
  });
});

describe('milestone-summary command structure', () => {
  test('command has success_criteria section', () => {
    const content = fs.readFileSync(commandPath, 'utf-8');
    assert.ok(
      content.includes('<success_criteria>'),
      'should have success_criteria section (follows complete-milestone pattern)'
    );
  });

  test('command context lists RESEARCH.md', () => {
    const content = fs.readFileSync(commandPath, 'utf-8');
    assert.ok(
      content.includes('RESEARCH.md'),
      'should list RESEARCH.md in context block'
    );
  });
});

describe('milestone-summary artifact path resolution', () => {
  const { createTempProject, cleanup } = require('./helpers.cjs');
  let tmpDir;

  test('archived milestone paths point to milestones/ directory', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    // Archived roadmap path should be under milestones/
    assert.ok(
      content.includes('.planning/milestones/v${VERSION}-ROADMAP.md'),
      'archived ROADMAP path should be under .planning/milestones/'
    );
    assert.ok(
      content.includes('.planning/milestones/v${VERSION}-REQUIREMENTS.md'),
      'archived REQUIREMENTS path should be under .planning/milestones/'
    );
    assert.ok(
      content.includes('.planning/milestones/v${VERSION}-MILESTONE-AUDIT.md'),
      'archived AUDIT path should be under .planning/milestones/'
    );
  });

  test('current milestone paths point to .planning/ root', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    // Current milestone should read from .planning/ root
    const lines = content.split('\n');
    const currentSection = lines.slice(
      lines.findIndex(l => l.includes('Current/in-progress')),
      lines.findIndex(l => l.includes('Current/in-progress')) + 10
    ).join('\n');
    assert.ok(
      currentSection.includes('ROADMAP_PATH=".planning/ROADMAP.md"'),
      'current ROADMAP path should be at .planning/ root'
    );
  });
});
