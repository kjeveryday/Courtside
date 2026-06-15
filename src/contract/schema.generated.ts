/* GENERATED — do not edit. Source of truth: spec/state.schema.json.
 * Regenerate with `npm run codegen`; `npm run check` fails on drift (rule 13). */
export const stateSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://courtside.dev/spec/state.schema.json",
  "title": "Courtside state contract v0",
  "description": "Machine-readable mirror of /plan state. Markdown remains canonical for humans. Derive mechanically (git, hooks) where possible; agent-written where necessary. Every event carries provenance.",
  "type": "object",
  "required": ["schema", "phase", "agent", "gates", "tasks", "events"],
  "additionalProperties": false,
  "properties": {
    "schema": { "const": "courtside/v0" },
    "phase": { "type": "string", "description": "Framework phase, e.g. '0', '1.5', '5'" },
    "slice": { "type": "string" },
    "generatedAt": { "type": "string", "format": "date-time" },
    "agent": {
      "type": "object",
      "required": ["state", "since"],
      "additionalProperties": false,
      "properties": {
        "state": { "enum": ["working", "parked_at_gate", "blocked", "idle"] },
        "since": { "type": "string", "format": "date-time" },
        "narration": { "type": "string", "maxLength": 280 },
        "currentTask": { "$ref": "#/definitions/taskId" }
      }
    },
    "gates": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "status", "postedAt"],
        "additionalProperties": false,
        "properties": {
          "id": { "type": "string", "pattern": "^G[0-5](-[A-Z0-9-]+)?$" },
          "type": {
            "enum": ["scope", "slicing", "harness", "spec", "tasks", "sequence", "task_review"]
          },
          "status": { "enum": ["pending", "approved", "rejected", "superseded"] },
          "postedAt": { "type": "string", "format": "date-time" },
          "taskId": { "$ref": "#/definitions/taskId" },
          "payloadRef": { "type": "string", "description": "Path to /plan/gates/<id>.json" },
          "commit": { "$ref": "#/definitions/sha" },
          "tape": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Paths under /plan/tape/"
          },
          "verifySteps": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["text"],
              "additionalProperties": false,
              "properties": {
                "text": { "type": "string" },
                "criterionRef": {
                  "type": "string",
                  "description": "Acceptance criterion this step proves; audited by F11 anti-gaming check"
                }
              }
            }
          },
          "decisionRef": {
            "type": "string",
            "description": "Path to /plan/decisions-inbox/<id>.json once decided"
          }
        }
      }
    },
    "tasks": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "title", "status", "sourceRef"],
        "additionalProperties": false,
        "properties": {
          "id": { "$ref": "#/definitions/taskId" },
          "title": { "type": "string" },
          "status": { "enum": ["todo", "in-progress", "in-review", "revise", "blocked", "done"] },
          "risk": { "enum": ["low", "med", "high"] },
          "deps": { "type": "array", "items": { "$ref": "#/definitions/taskId" } },
          "slice": { "type": "string" },
          "visualCriterion": {
            "type": "string",
            "description": "Required unless logicOnly is true"
          },
          "logicOnly": { "type": "boolean", "default": false },
          "surfacesAt": {
            "$ref": "#/definitions/taskId",
            "description": "Required when logicOnly; the visual checkpoint task"
          },
          "sourceRef": {
            "type": "string",
            "description": "doc#section the task derives from; no source = scope creep"
          },
          "rejections": {
            "type": "integer",
            "minimum": 0,
            "description": "3 auto-blocks the task (F19)"
          },
          "commit": { "$ref": "#/definitions/sha" }
        }
      }
    },
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "text", "openedAt", "status"],
        "additionalProperties": false,
        "properties": {
          "id": { "type": "string" },
          "text": { "type": "string" },
          "options": {
            "type": "array",
            "items": { "type": "string" },
            "minItems": 2,
            "maxItems": 4
          },
          "recommendation": { "type": "string" },
          "blocking": { "type": "array", "items": { "$ref": "#/definitions/taskId" } },
          "openedAt": { "type": "string", "format": "date-time" },
          "status": { "enum": ["open", "answered"] },
          "answerRef": { "type": "string" }
        }
      }
    },
    "debt": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "text", "incurredAt"],
        "additionalProperties": false,
        "properties": {
          "id": { "type": "string" },
          "text": { "type": "string" },
          "incurredAt": { "type": "string", "format": "date-time" },
          "taskId": { "$ref": "#/definitions/taskId" }
        }
      }
    },
    "decisions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "text", "decidedAt", "by"],
        "additionalProperties": false,
        "properties": {
          "id": { "type": "string" },
          "text": { "type": "string" },
          "decidedAt": { "type": "string", "format": "date-time" },
          "by": { "enum": ["human", "agent"] },
          "gateId": { "type": "string" },
          "commit": { "$ref": "#/definitions/sha" }
        }
      }
    },
    "events": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["ts", "kind", "provenance", "text"],
        "additionalProperties": false,
        "properties": {
          "ts": { "type": "string", "format": "date-time" },
          "kind": { "enum": ["narration", "test_run", "lint", "audit", "gate", "capture", "push"] },
          "provenance": {
            "enum": ["verified", "claimed"],
            "description": "verified = Courtside executed/parsed it (doctor, lint, hook output, git). claimed = agent-authored prose. UI must render these distinctly (F18)."
          },
          "text": { "type": "string", "maxLength": 500 },
          "artifactRef": {
            "type": "string",
            "description": "Raw output file backing a verified event"
          }
        }
      }
    }
  },
  "definitions": {
    "taskId": { "type": "string", "pattern": "^TASK-[0-9]+$" },
    "sha": { "type": "string", "pattern": "^[0-9a-f]{7,40}$" }
  }
} as const;
