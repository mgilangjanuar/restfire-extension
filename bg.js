let data = []

chrome.browserAction.onClicked.addListener(tab => {
  chrome.tabs.executeScript(tab.id, {
    code: `document.querySelector('.inspector').style.display = document.querySelector('.inspector').style.display === 'none' ? 'block' : 'none'`
	})
})

chrome.tabs.onRemoved.addListener(id => {
  data = data.filter(d => d.tabId !== id)
  console.log('Data Length:', data.length)
})

chrome.webRequest.onBeforeRequest.addListener(function (details) {
  if (details.type !== 'xmlhttprequest' || !/^http/.test(details.initiator)) return
  const request = data.find(d => d.id === details.requestId)
  const beforeRequest = {
    ...details,
    requestBody: details.requestBody && details.requestBody.raw ? {
      raw: new TextDecoder('utf-8').decode(new Uint8Array(details.requestBody.raw[0].bytes))
    } : details.requestBody && details.requestBody.formData ? {
      formData: Object.keys(details.requestBody.formData).map(key => ({ name: [key], value: details.requestBody.formData[key][0] }))
    } : null
  }
  if (!request) {
    data = [{
      id: details.requestId,
      ...beforeRequest
    }, ...data].filter((req, i) => req.tabId !== details.tabId || req.tabId === details.tabId && i < 50)
  } else {
    data[data.indexOf(request)] = {
      ...data[data.indexOf(request)],
      ...beforeRequest
    }
  }
}, { urls: ['<all_urls>'] }, ['requestBody'])

chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
  if (details.type !== 'xmlhttprequest' || !/^http/.test(details.initiator)) return
  const request = data.find(d => d.id === details.requestId)
  if (!request) {
    data = [{
      id: details.requestId,
      ...details
    }, ...data].filter((req, i) => req.tabId !== details.tabId || req.tabId === details.tabId && i < 50)
  } else {
    data[data.indexOf(request)] = {
      ...data[data.indexOf(request)],
      ...details
    }
  }
}, { urls: ['<all_urls>'] }, ['requestHeaders', 'extraHeaders'])

chrome.webRequest.onCompleted.addListener(function (details) {
  if (details.type !== 'xmlhttprequest' || !/^http/.test(details.initiator)) return
  const request = data.find(d => d.id === details.requestId)
  if (!request) {
    data = [{
      id: details.requestId,
      ...details
    }, ...data].filter((req, i) => req.tabId !== details.tabId || req.tabId === details.tabId && i < 50)
  } else {
    data[data.indexOf(request)] = {
      ...data[data.indexOf(request)],
      ...details
    }
  }
  chrome.tabs.query({ active: true, currentWindow: true }, () => {
    chrome.tabs.sendMessage(details.tabId, { requests: data.filter(d => d.tabId === details.tabId) })
  })
}, { urls: ['<all_urls>'] })

chrome.runtime.onMessage.addListener(
  function(request, sender) {
    if (request.event === 'reload') {
      data = data.filter(d => d.tabId !== sender.tab.id)
      chrome.tabs.query({ active: true, currentWindow: true }, () => {
        chrome.tabs.sendMessage(sender.tab.id, { requests: data.filter(d => d.tabId === sender.tab.id) })
      })
    }
  }
)