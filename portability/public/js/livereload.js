// Development live reload for the preview: the server watches public/ and
// pushes a reload event over SSE. Only enabled when /api/config says so.
(function () {
  if (!window.EventSource) return
  fetch('/api/config')
    .then(r => r.json())
    .then(cfg => {
      if (!cfg || !cfg.liveReload) return
      const es = new EventSource('/__reload')
      es.onmessage = e => { if (e.data === 'reload') location.reload() }
    })
    .catch(() => {})
})()
