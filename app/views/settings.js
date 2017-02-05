const html = require('choo/html')
const ipc = require('electron').ipcRenderer;
const getFormData = require('get-form-data')

function settingsView (state, prev, send) {
  const plugins = state.plugins.map(plugin => {
    console.log(plugin)
    return html`<option value="${plugin.id}" ${state.settings.uploader === plugin.id ? 'selected' : ''}>
      ${plugin.uploader}
    </option>`
  })


  return html`
    <form onsubmit=${submit}>
      <div class="form-group">
        <label for="shortuct-full">Shortcut (Full size)</label>
        <input type="text" class="form-control" placeholder="Ctrl+7" name="shortcut-full" value="${state.settings['shortcut-full']}" />
        <small>Not sure what to put here? Look at <a href="https://github.com/electron/electron/blob/master/docs/api/accelerator.md" onclick=${openExternalURL} target="_blank">this</a></small>
      </div>
      <div class="form-group">
        <label for="shortcut-area">Shortcut (Area)</label>
        <input type="text" class="form-control" placeholder="Ctrl+8" name="shortcut-area" value="${state.settings['shortcut-area']}" />
      </div>
      <div class="form-group">
        <label for="uploader">Uploader</label>
        <select name="uploader" id="uploader" class="form-control">
        ${plugins}
        </select>
      </div>
      <div class="form-group">
        <input type="submit" class="btn btn primary" value="Save">
      </div>
    </form>
  `

  function openExternalURL(e) {
    e.preventDefault()
    ipc.send('loadExternalURL', e.target.getAttribute('href'))
  }

  function submit(e) {
    e.preventDefault()

    const data = getFormData(e.target)
    ipc.send('setSettings', data)
    ipc.send('notify', 'Settings Saved')
  }
}

module.exports = settingsView
