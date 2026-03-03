# Prompt Library

A VS Code extension that allows you to browse, preview, and download GitHub Copilot customizations from community repositories, including the [awesome-copilot repository](https://github.com/github/awesome-copilot).

## Features

- **🔍 Browse**: Explore chat modes, instructions, prompts, agents, and skills in a convenient tree view
- **📖 Preview**: View file content before downloading
- **⬇️ Download**: Save files to appropriate `.github/` folders in your workspace
- **🔃 Refresh**: Update repository data with manual refresh
- **💾 Caching**: Smart caching for better performance

## How to Use

1. **Open the Extension**: Click the **Prompt Library** icon in the Activity Bar.
2. **Browse Categories**: Expand Chat Modes, Instructions, Prompts, Agents, or Skills sections
3. **Preview Content**: Click the preview icon on any file to see its content
4. **Download Files**: Click the download icon to save files to your workspace
5. **Refresh Data**: Click the refresh icon in the view title to update repository data

## Folder Structure

Downloaded files are organized in your workspace as follows:

- **Chat Modes** → `.github/chatmodes/` (individual files)
- **Instructions** → `.github/instructions/` (individual files)
- **Prompts** → `.github/prompts/` (individual files)
- **Agents** → `.github/agents/` (individual files)
- **Skills** → `.github/skills/` (entire folders with SKILL.md and supporting files)

These folders will be created automatically if they don't exist.

**Note:** Skills are unique in that each skill is a complete folder containing a `SKILL.md` file and potentially other supporting files. When you download a skill, the entire folder structure is preserved.

## Requirements

- VS Code version 1.103.0 or higher
- Internet connection to fetch repository data
- A workspace folder open in VS Code (for downloads)

## Extension Commands

- `Refresh`: Update repository data from GitHub
- `Download`: Save a file to your workspace
- `Preview`: View file content in VS Code

---

## Development

This extension was built with:

- TypeScript
- VS Code Extension API
- Axios for HTTP requests
- ESBuild for bundling

### Building

```bash
npm install
npm run compile
```

### Testing

```bash
npm run test
```

## UI Placement / Custom View Container

The extension contributes a custom Activity Bar view container named **Prompt Library**. If you prefer to move or hide it:

- Right-click the Activity Bar to toggle visibility.
- Drag the view into a different location if desired (VS Code will persist your layout).

**Enjoy browsing and downloading community Copilot customizations!**
