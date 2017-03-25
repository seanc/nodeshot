const html = require('choo/html')
const choo = require('choo')
const ipc = require('electron').ipcRenderer
const app = choo()
const serialize = require('node-serialize')

app.model({
  state: {
    plugins: ipc.sendSync('getPlugins').map(plugin => {
      return serialize.unserialize(plugin)
    }),
    settings: ipc.sendSync('getSettings') || {}
  },
  reducers: {
    addPlugin: (state, data) => {
      return { plugins: state.plugins.concat(data) }
    },
    setSettings: (state, data) => {
      return { settings: data }
    }
  },
  effects: {
    getPlugins: (state, data, send, done) => {
      ipc.on('receivePlugins', (e, plugins) => {
        send('addPlugin', plugins, (err, value) => {
          if (err) return done(err)
          done(null, value)
        })
      })
    },
    getSettings: (state, data, send, done) => {
      send('setSettings', settings, (err, value) => {
        if (err) return done(err)
        done(null, ipc.sendSync('getSettings'))
      })
    }
  }
})

app.router({ default: '/' }, [
  ['/', require('./views/settings')],
  ['/:plugin/settings', require('./views/plugin')]
])

const tree = app.start()
document.querySelector('#app').appendChild(tree)
