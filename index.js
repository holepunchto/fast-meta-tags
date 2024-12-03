module.exports = fetchAndParse
module.exports.parse = parse

async function fetchAndParse (url) {
  const r = await fetch(url, {
    headers: {
      userAgent: 'link-preview'
    }
  })

  if (!r.ok) return null

  const t = await r.text()
  return parse(t)
}

function parse (html) {
  const head = getHead(html)
  if (head === null) return null

  const title = getTitle(head)
  const meta = getMeta(head)

  return {
    title,
    meta
  }
}

function getHead (html) {
  let name = 'head'
  let i = html.indexOf('<' + name)

  if (i === -1) {
    name = 'HEAD'
    i = html.indexOf('<' + name)
  }

  if (i === -1) return null

  i = html.indexOf('>', i + 5)
  if (i === -1) return null
  i++

  const end = html.indexOf('</' + name, i)
  if (end === -1) return null

  return html.slice(i, end)
}

function getMeta (html) {
  let i = 0
  const meta = []

  while (true) {
    const offset = i

    i = html.indexOf('<meta', offset)
    if (i === -1) i = html.indexOf('<META', offset)
    if (i === -1) break
    i += 5

    const end = html.indexOf('>', i)
    if (end === -1) break

    const next = {
      name: null,
      property: null,
      content: null
    }

    let tag = html.slice(i, end)

    while (true) {
      const m = tag.match(/\s*(name|property|content)\s*=\s*"([^"]*)"?/i)
      if (!m) break

      const k = m[1]
      const v = m[2]

      if (k === 'name') next.name = v
      else if (k === 'property') next.property = v
      else if (k === 'content') next.content = normalize(v)

      tag = tag.slice(m[0].length)
    }

    if (next.content && (next.name || next.property)) meta.push(next)

    i = end + 1
  }

  return meta
}

function getTitle (html) {
  let name = 'title'
  let i = html.indexOf('<' + name)
  if (i === -1) {
    name = 'TITLE'
    i = html.indexOf('<' + name)
  }

  if (i === -1) return null

  i = html.indexOf('>', i + 6)
  if (i === -1) return null
  i++

  const end = html.indexOf('</' + name, i)
  if (end === -1) return null

  return normalize(html.slice(i, end))
}

function normalize (text) {
  return text.replace(/&#\d+;/g, inlineNumericEntity).replace(/&(amp|nbsp|lt|gt|quot|apos);/g, inlineEntity)
}

function inlineNumericEntity (s) {
  return String.fromCharCode(s.slice(2, -1))
}

function inlineEntity (s) {
  switch (s) {
    case '&amp;': return '&'
    case '&nbsp;': return ' '
    case '&lt;': return '<'
    case '&gt;': return '>'
    case '&quot;': return '"'
    case '&quot;': return '\''
  }

  return s
}
