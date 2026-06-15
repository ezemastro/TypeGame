import type { Plugin } from "@opencode-ai/plugin"

/**
 * Fixes Moonshot AI JSON Schema compatibility.
 * Moonshot requires `type` to be defined inside each `anyOf` item
 * rather than at the parent schema level.
 */
export default (async ({ client, project, directory, $ }) => {
  return {
    "tool.definition": async (input: any, output: any) => {
      // Patch anyOf items to include type when missing
      const patch = (obj: any) => {
        if (!obj || typeof obj !== "object") return
        if (obj.anyOf && Array.isArray(obj.anyOf)) {
          for (const item of obj.anyOf) {
            if (!item.type) {
              item.type = "object"
            }
          }
        }
        // Recurse into nested objects
        for (const key of Object.keys(obj)) {
          if (key === "anyOf") continue // already handled
          const val = obj[key]
          if (val && typeof val === "object") {
            if (Array.isArray(val)) {
              for (const v of val) patch(v)
            } else {
              patch(val)
            }
          }
        }
      }

      if (output?.parameters) {
        patch(output.parameters)
      }
    },
  }
}) satisfies Plugin
