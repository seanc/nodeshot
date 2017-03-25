const html = require('choo/html')
const ipc = require('electron').ipcRenderer;

function pluginSettingsView (state, prev, send) {
  const id = state.location.params.plugin
  const plugin = state.plugins.filter(p => p.id === id).pop()

  if (!plugin) {
    return html`<p>No plugin found</p>`
  }

  const settings = plugin.settings(ipc, html)

  return settings(state, prev, send)
}

module.exports = pluginSettingsView
