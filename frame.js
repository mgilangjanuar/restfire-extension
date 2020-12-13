const iframe = document.createElement('iframe')
iframe.className = 'inspector'
iframe.style.height = '100vh'
iframe.style.width = '480px'
iframe.style.position = 'fixed'
iframe.style.display = 'none'
iframe.style.top = '0px'
iframe.style.right = '0px'
iframe.style.zIndex = '9999999999999'
iframe.frameBorder = 'none'
iframe.src = chrome.extension.getURL('index.html')
document.body.appendChild(iframe)

iframe.onload = () => {
  window.onmessage = e => {
    if (e.data.event === 'close') {
      iframe.style.display = 'none'
    }
  }
}