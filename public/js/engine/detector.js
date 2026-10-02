// AgroSmart Rwanda — scan image loading helper.
// The crop diagnosis is made ONLY by the live server-side Crop AI Doctor (vision
// model). There is no on-device colour engine: we never fabricate a disease name
// or confidence number from pixel ratios. This module just turns a picked file
// into an <img>/<video> element the Scan screen can send to the real AI.
(function () {
  const AS = (window.AS = window.AS || {})

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      if (file.type.startsWith('video')) {
        const v = document.createElement('video')
        v.preload = 'metadata'
        v.muted = true
        v.playsInline = true
        v.src = url
        v.onerror = () => reject(new Error('video-error'))
        resolve({ el: v, url, isVideo: true })
      } else {
        const img = new Image()
        img.onload = () => resolve({ el: img, url, isVideo: false })
        img.onerror = () => reject(new Error('img-error'))
        img.src = url
      }
    })
  }

  AS.loadImageFromFile = loadImageFromFile
})()
