chrome.runtime.onMessage.addListener(
  function(request) {
    if (!request.requests || !request.requests.length) {
      document.querySelector('.accordion').innerHTML = '<p style="color: #ffffff; margin: 20px;">No data</p>'
    } else {
      const methodFormatter = x => {
        if (x.method === 'DELETE') {
          return 'DEL'
        } else if (x.method === 'OPTIONS') {
          return 'OPT'
        }
        return x.method
      }
      const badge = x => {
        if (x.method === 'GET') {
          return 'bg-primary'
        }
        if (x.method === 'POST') {
          return 'bg-success'
        }
        if (x.method === 'PATCH') {
          return 'bg-warning text-dark'
        }
        if (x.method === 'DELETE') {
          return 'bg-danger'
        }
        if (x.method === 'OPTIONS') {
          return 'bg-secondary'
        }
        if (x.method === 'PUT') {
          return 'bg-info text-dark'
        }
      }
      document.querySelector('.accordion').innerHTML = request.requests.reduce((res, x) => {
        console.log('Incoming Data:', x)
        return `${res}
        <div class="accordion-item">
          <h2 class="accordion-header" id="heading${x.requestId}">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${x.requestId}" aria-expanded="false" aria-controls="collapse${x.requestId}">
              <span class="badge ${badge(x)}">${methodFormatter(x)}</span>&nbsp; ${x.url.substring(0, 40)}${x.url.length > 40 ? '...' : ''}
            </button>
          </h2>
          <div id="collapse${x.requestId}" class="accordion-collapse collapse" aria-labelledby="heading${x.requestId}" data-bs-parent="#accordionRequests">
            <div class="accordion-body">
              <nav>
                <div class="nav nav-pills" id="nav-tab-${x.requestId}" role="tablist">
                  <a class="nav-link active" id="nav-curl-tab-req-${x.requestId}" data-bs-toggle="tab" href="#nav-curl-req-${x.requestId}" role="tab" aria-controls="nav-curl-req-${x.requestId}" aria-selected="true">cURL</a>
                  <a class="nav-link" id="nav-headers-tab-req-${x.requestId}" data-bs-toggle="tab" href="#nav-headers-req-${x.requestId}" role="tab" aria-controls="nav-headers-req-${x.requestId}" aria-selected="false">Headers</a>
                </div>
              </nav>
              <div class="tab-content" id="nav-tabContent-${x.requestId}">
                <div class="tab-pane fade show active" id="nav-curl-req-${x.requestId}" role="tabpanel" aria-labelledby="nav-curl-tab-req-${x.requestId}">
                  <pre><code>curl --location --request ${x.method} '${x.url}'${x.requestHeaders?.length ? ` \\\n${x.requestHeaders.map(header => `--header '${header.name.replace(/\'/gi, '\'\\\'\'')}: ${header.value.replace(/\'/gi, '\'\\\'\'')}'`).join(' \\\n')}` : ''}${x.requestBody && x.requestBody.raw ? ` \\\n--data-raw '${x.requestBody.raw.replace(/\'/gi, '\'\\\'\'')}'` : ''}${x.requestBody && x.requestBody.formData ? ` \\\n${x.requestBody.formData.map(form => `--form '${form.name}="${form.value.replace(/\'/gi, '\'\\\'\'').replace(/\"/gi, '\\\"')}"'`).join(' \\\n')}` : ''}</code></pre>
                </div>
                <div class="tab-pane fade" id="nav-headers-req-${x.requestId}" role="tabpanel" aria-labelledby="nav-headers-tab-req-${x.requestId}">
                  <div class="table-responsive">
                    <table class="table table-dark table-striped">
                      <tbody>
                        ${x.requestHeaders?.map(header => `<tr>
                          <th class="text-nowrap" scope="row">${header.name}</th>
                          <td class="text-nowrap">${header.value}</td>
                        </tr>`).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <p style="text-align: right;">
                <button class="btn btn-primary sendRequest" --data-id="${x.requestId}">Send</button>
              </p>
              <div class="resp-${x.requestId}"></div>
            </div>
          </div>
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
          } catch (error) {}
          document.querySelector(`.resp-${data.requestId}`).innerHTML = `
          <nav>
            <div class="nav nav-pills" id="nav-tab-${data.requestId}" role="tablist">
              <a class="nav-link active" id="nav-body-tab-${data.requestId}" data-bs-toggle="tab" href="#nav-body-${data.requestId}" role="tab" aria-controls="nav-body-${data.requestId}" aria-selected="true">Body: ${resp.status}</a>
              <a class="nav-link" id="nav-headers-tab" data-bs-toggle="tab" href="#nav-headers-${data.requestId}" role="tab" aria-controls="nav-headers-${data.requestId}" aria-selected="false">Headers</a>
              <a class="nav-link" id="nav-log-tab" data-bs-toggle="tab" href="#nav-log-${data.requestId}" role="tab" aria-controls="nav-log-${data.requestId}" aria-selected="false">Log</a>
            </div>
          </nav>
          <div class="tab-content" id="nav-tabContent-${data.requestId}">
            <div class="tab-pane fade show active" id="nav-body-${data.requestId}" role="tabpanel" aria-labelledby="nav-body-tab-${data.requestId}"><pre><code>${responseBody}</code></pre></div>
            <div class="tab-pane fade" id="nav-headers-${data.requestId}" role="tabpanel" aria-labelledby="nav-headers-tab-${data.requestId}">
              <div class="table-responsive">
                <table class="table table-dark table-striped">
                  <tbody>
                    ${Object.keys(resp.headers)?.map(key => `<tr>
                      <th class="text-nowrap" scope="row">${key}</th>
                      <td class="text-nowrap">${resp.headers[key]}</td>
                    </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="tab-pane fade" id="nav-log-${data.requestId}" role="tabpanel" aria-labelledby="nav-contact-tab-${data.requestId}"><pre><code>${JSON.stringify(resp, null, 2)}</code></pre></div>
          </div>`
        }).catch(err => {
          const response = err.response
          if (response) {
            let responseBody = response.data
            try {
              responseBody = JSON.stringify(response.data, null, 2)
            } catch (error) {}
            document.querySelector(`.resp-${data.requestId}`).innerHTML = `
            <nav>
              <div class="nav nav-pills" id="nav-tab-${data.requestId}" role="tablist">
                <a class="nav-link active" id="nav-body-tab-${data.requestId}" data-bs-toggle="tab" href="#nav-body-${data.requestId}" role="tab" aria-controls="nav-body-${data.requestId}" aria-selected="true">Body: ${response.status}</a>
                <a class="nav-link" id="nav-headers-tab" data-bs-toggle="tab" href="#nav-headers-${data.requestId}" role="tab" aria-controls="nav-headers-${data.requestId}" aria-selected="false">Headers</a>
                <a class="nav-link" id="nav-log-tab" data-bs-toggle="tab" href="#nav-log-${data.requestId}" role="tab" aria-controls="nav-log-${data.requestId}" aria-selected="false">Log</a>
              </div>
            </nav>
            <div class="tab-content" id="nav-tabContent-${data.requestId}">
              <div class="tab-pane fade show active" id="nav-body-${data.requestId}" role="tabpanel" aria-labelledby="nav-body-tab-${data.requestId}"><pre><code>${responseBody}</code></pre></div>
              <div class="tab-pane fade" id="nav-headers-${data.requestId}" role="tabpanel" aria-labelledby="nav-headers-tab-${data.requestId}">
                <div class="table-responsive">
                  <table class="table table-dark table-striped">
                    <tbody>
                      ${Object.keys(response.headers)?.map(key => `<tr>
                        <th class="text-nowrap" scope="row">${key}</th>
                        <td class="text-nowrap">${response.headers[key]}</td>
                      </tr>`).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="tab-pane fade" id="nav-log-${data.requestId}" role="tabpanel" aria-labelledby="nav-contact-tab-${data.requestId}"><pre><code>${JSON.stringify(response, null, 2)}</code></pre></div>
            </div>`
          } else {
            document.querySelector(`.resp-${data.requestId}`).innerHTML = `
            <nav>
              <div class="nav nav-pills" id="nav-tab-${data.requestId}" role="tablist">
                <a class="nav-link active" id="nav-body-tab-${data.requestId}" data-bs-toggle="tab" href="#nav-body-${data.requestId}" role="tab" aria-controls="nav-body-${data.requestId}" aria-selected="true">Error log</a>
              </div>
            </nav>
            <div class="tab-content" id="nav-tabContent-${data.requestId}">
              <div class="tab-pane fade show active" id="nav-body-${data.requestId}" role="tabpanel" aria-labelledby="nav-body-tab-${data.requestId}"><pre><code>${err}</code></pre></div>
            </div>`
          }
        })
      })
    }
  }
)

document.querySelector('.close').addEventListener('click', () => parent.postMessage({ event: 'close' }, '*'))
document.querySelector('.reload').addEventListener('click', () => chrome.runtime.sendMessage({ event: 'reload' }))