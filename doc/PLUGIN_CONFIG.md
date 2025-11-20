# Plugin Configuration

The core/bundled plugin setup is now defined via `src/plugins/pluginConfig.json` instead of hard-coded arrays. Ops teams can toggle which plugins ship enabled-by-default by editing that JSON (no code changes required) before building/deploying.

Example structure:

```
{
  "core": [
    "./core/nodeInfoPlugin.jsx",
    "./core/templatesPlugin.jsx"
  ],
  "bundled": [
    "./examples/graphLinterPlugin.jsx",
    "./examples/centralityLensPlugin.jsx"
  ]
}
```

Notes:
- Paths are relative to `src/plugins` and should include the `.jsx` extension.
- Order matters: the app preserves the array order when rendering panels/commands.
- Plugins listed under `core` show up in Settings → Plugins as “Core Plugins”; those under `bundled` appear under “Bundled Custom Plugins” (still toggleable per user via plugin prefs).
- If you remove a plugin entry from the config, it will no longer load in the app (until re-added).

## Ops Workflow
1. Copy `src/plugins/pluginConfig.json` and adjust the arrays to match the plugin lineup you want for the deployment.
2. Commit the JSON change (no other code edits needed).
3. Build/deploy as usual.

This separation keeps behavioral plugins in code, but their default availability can be managed via config, which is easier to audit and change for ops teams.
