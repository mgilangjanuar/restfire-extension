chrome.runtime.onMessage.addListener(
  function(request) {
    if (!request.requests.length) {
      document.querySelector('.collapse').innerHTML = '<p style="color: #ffffff">No data</p>'
    } else {
      const methodFormatter = x => {
        if (x.method === 'DELETE') {
          return 'DEL'
        } else if (x.method === 'OPTIONS') {
          return 'OPT'
        }
        return x.method
      }
      document.querySelector('.collapse').innerHTML = request.requests.reduce((res, x) => {
        return `${res}<input type="radio" id="accordion-section${x.requestId}" aria-hidden="true" name="accordion">
        <label for="accordion-section${x.requestId}" aria-hidden="true"><mark class="${x.method.toLowerCase()}">${methodFormatter(x)}</mark> ${x.url.substring(0, 43)}${x.url.length > 43 ? '...' : ''}</label>
        <div>
          cURL<br />
          <pre>curl --location --request ${x.method} '${x.url}'${x.requestHeaders?.length ? ` \\\n${x.requestHeaders.map(header => `--header '${header.name.replace(/\'/gi, '\'\\\'\'')}: ${header.value.replace(/\'/gi, '\'\\\'\'')}'`).join(' \\\n')}` : ''}${x.requestBody && x.requestBody.raw ? ` \\\n--data-raw '${x.requestBody.raw.replace(/\'/gi, '\'\\\'\'')}'` : ''}${x.requestBody && x.requestBody.formData ? ` \\\n${x.requestBody.formData.map(form => `--form '${form.name}="${form.value.replace(/\'/gi, '\'\\\'\'').replace(/\"/gi, '\\\"')}"'`).join(' \\\n')}` : ''}</pre>
          <p style="text-align: right;">
            <button class="tertiary sendRequest" --data-id="${x.requestId}">Send</button>
          </p>
          <div class="resp-${x.requestId}"></div>
          <br /><br /><br />
          <mark>debug console</mark>
          <pre>${JSON.stringify(x, null, 2)}</pre>
        </div>`
      }, '')
    }
    const buttons = document.querySelectorAll('.sendRequest')
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', () => {
        const data = request.requests.find(req => req.requestId == buttons[i].getAttribute('--data-id'))
        axios({
          method: data.method.toLowerCase(),
          url: data.url,
          headers: data.requestHeaders.reduce((res, header) => ({ ...res, [header.name]: header.value }), {}),
          data: data.requestBody && data.requestBody.raw ? data.requestBody.raw : (data.requestBody && data.requestBody.formData ? data.requestBody.formData.reduce((res, form) => ({ ...res, [form.name]: form.value }) , {}) : null)
        }).then(resp => {
          let responseBody = resp.data
          try {
            responseBody = JSON.stringify(resp.data, null, 2)
          } catch (error) {
            // ignore
          }
          document.querySelector(`.resp-${data.requestId}`).innerHTML = `Response Header: ${resp.status}<br /><pre>${JSON.stringify(resp.headers, null, 2)}</pre><br />Response body<br /><pre>${responseBody}</pre>`
        }).catch(err => {
          const response = err.response
          if (response) {
            let responseBody = response.data
            try {
              responseBody = JSON.stringify(response.data, null, 2)
            } catch (error) {
              // ignore
            }
            document.querySelector(`.resp-${data.requestId}`).innerHTML = `Response Header: ${response.status}<br /><pre>${JSON.stringify(response.headers, null, 2)}</pre><br />Response body<br /><pre>${responseBody}</pre>`
          } else {
            document.querySelector(`.resp-${data.requestId}`).innerHTML = `Error Log<br /><pre>${err}</pre>`
          }
        })
      })
    }
  }
)

document.querySelector('.close').addEventListener('click', () => parent.postMessage({ event: 'close' }, '*'))
document.querySelector('.reload').addEventListener('click', () => chrome.runtime.sendMessage({ event: 'reload' }))