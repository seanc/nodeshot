const menubar = require('menubar')
const { globalShortcut, shell, ipcMain } = require('electron')
const config = require('./lib/config')
const envPaths = require('env-paths')
const fs = require('fs')
const resolveFrom = require('resolve-from')
const notifier = require('node-notifier')
const path = require('path')
const serialize = require('node-serialize')
const { exec } = require('child_process')
const random = require('randomstring')

const mb = menubar({
  dir: 'app',
  // icon: 'app/assets/images/icon.png',
  windowPosition: 'center',
  tooltip: 'Nodeshot',
  width: 600
})
const paths = envPaths('nodeshot')

mb.on('ready', () => {
  const settings = config.get('settings')

  registerShortcuts(settings['shortcut-area'], settings['shortcut-full'])

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
    e.returnValue = config.get('settings')
  })
  ipcMain.on('setSettings', (e, data) => {
    const prevSettings = config.get('settings')
    globalShortcut.unregister(prevSettings['shortcut-area'])
    globalShortcut.unregister(prevSettings['shortcut-full'])
    config.set('settings', data)
    registerShortcuts(data['shortcut-area'], data['shortcut-full'])
    e.sender.send('receiveSettings', config.get('settings'))
  })
  ipcMain.on('notify', (e, text) => notifier.notify(text))

})

function registerShortcuts(area, full) {
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
