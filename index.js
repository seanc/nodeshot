const menubar = require('menubar')
const { globalShortcut, shell, ipcMain } = require('electron')
const envPaths = require('env-paths')
const fs = require('fs')
const resolveFrom = require('resolve-from')
const notifier = require('node-notifier')
const path = require('path')
const serialize = require('node-serialize')
const { exec } = require('child_process')
const random = require('randomstring')
const config = require('./lib/config')

require('electron-debug')({showDevTools: true});

const mb = menubar({
  dir: 'app',
  icon: 'app/assets/icon.png',
  windowPosition: 'center',
  tooltip: 'Nodeshot',
  width: 600
})
const paths = envPaths('nodeshot')

mb.on('ready', () => {
  const settings = config.get('settings')

  if (config.has('settings.shortcut.area') && config.has('settings.shortcut.full')) {
    const shortcutArea = config.get('settings.shortcut.area')
    const shortcutFull = config.get('settings.shortcut.full')
    registerShortcuts(shortcutArea, shortcutFull)
  }

  ipcMain.on('loadExternalURL', (e, arg) => {
    shell.openExternal(arg)
  })

  ipcMain.on('getPlugins', (e, arg) => {
    try {
      const data = fs.readFileSync(path.join(paths.data, 'package.json'), 'utf8')
      const packageJSON = JSON.parse(data)
      const deps = Object.keys(packageJSON.dependencies)
      const plugins = deps.map(dep => {
        return serialize.serialize(require(resolveFrom(paths.data, dep)))
      })
      e.returnValue = plugins
    } catch (err) {
      if (err) {
        if (err.code === 'ENOENT') e.returnValue = []
        else console.log(err)
      }
    }
  })

  ipcMain.on('getSettings', (e, data) => {
    e.returnValue = config.get('settings') || {}
  })
  ipcMain.on('setSettings', (e, data) => {
    const prevSettings = config.get('settings')

    if (config.has('settings.shortcut.area') && !!config.get('settings.shortcut.area'))
      globalShortcut.unregister(config.get('settings.shortcut.area'))
    if (config.has('settings.shortcut.full') && !!config.get('settings.shortcut.full'))
      globalShortcut.unregister(config.get('settings.shortcut.full'))
    config.set('settings', Object.assign(prevSettings, data))

    const settings = config.get('settings')
    const shortcuts = settings.shortcut || {}
    const area = shortcuts.area || null
    const full = shortcuts.area || null
    registerShortcuts(area, full)

    e.sender.send('receiveSettings', settings)
  })
  ipcMain.on('notify', (e, text) => notifier.notify(text))

})

function registerShortcuts(area, full) {
  if (!config.has('settings.uploader')) return
  const uploader = config.get('settings').uploader

  if (area) {
    globalShortcut.register(area, () => {
      const fileName = `${random.generate(16)}.png`
      const saveFile = path.join(paths.data, 'screenshots', fileName)

      setTimeout(() => {
        exec(`./${path.join('bin', 'scrot')} -s -q 100 -e 'mv $f ${saveFile} && echo -n $f'`, (err, out) => {
          if (err) return console.error(err)
          const plugin = require(resolveFrom(paths.data, uploader))
          plugin.fn(saveFile, config, notifier, require('electron'))
        })
      }, 500)
    })
  }

  if (full) {
    globalShortcut.register(full, () => {

    })
  }
}
