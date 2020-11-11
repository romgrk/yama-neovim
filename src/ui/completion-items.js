/*
 * completion-items.js
 */


const gi = require('node-gtk')
const escapeXML = require('xml-escape')

const Gtk = gi.require('Gtk', '3.0')
const Gdk = gi.require('Gdk', '3.0')

const store = require('../store')
// const Icons = require('./icons')

const pixelToSize = px =>
  Math.round(px / 1.33333333333 * 800)

const colors = { fg: '#efefef' }
const style = {
  item: (markup) =>
    `<span font_family="${store.fontFamily}" weight="bold" size="${pixelToSize(store.fontSize)}" foreground="${colors.fg}">${markup}</span>`,
  empty: (markup) => style.item(`<span foreground="#888888">${markup}</span>`),
  muted: (markup) => `<span foreground="#888888">${markup}</span>`,
  match: (markup) => `<span foreground="#ff4444">${markup}</span>`,
  icon: (i) => `<span size="9500" font_family="${store.fontFamily}" foreground="${i.color}">${i.icon}</span>`,
}

class CompletionItems extends Gtk.ListBox {
  constructor(items, reverse) {
    super()
    let itemsToAdd = items
    if (reverse) {
      itemsToAdd = items.slice().reverse()
    }
    for (let i = 0; i < itemsToAdd.length; i++) {
      this.add(new Item(itemsToAdd[i]))
    }
    if (items.length === 0)
      this.add(new EmptyItem(colors))
  }

  getSelectedItem() {
    const row = this.getSelectedRow() || this.getRowAtIndex(0)
    return row?.data.item
  }
}

class EmptyItem extends Gtk.ListBoxRow {
  constructor() {
    super()
    const padding = '      '
    this.element = new Gtk.Label()
    this.element.setMarkup(style.empty(padding + 'No match found'))
    this.element.setXalign(0)
    this.element.marginLeft = 15
    this.element.marginTop = 2
    this.element.marginBottom = 2
    this.add(this.element)
  }
}

class Item extends Gtk.ListBoxRow {
  constructor(m) {
    super()
    this.data = m
    this.element = new Gtk.Label()
    this.element.setMarkup(renderMatch(m))
    this.element.setXalign(0)
    this.element.marginLeft = 15
    this.element.marginTop = 2
    this.element.marginBottom = 2
    this.add(this.element)
  }
}

function renderMatch(m) {
  const [text, kind, source, info] = m
  // const positions = m.positions
  // console.log(positions)

  // const filename = m.item.text
  // const icon = style.icon(Icons.get(filename))
  const label = style.item(style.muted(escapeXML(kind || ' ')) + ' ' + escapeXML(text))
  return label

  // return `${icon}   ${label}`
}

function renderLabel(m) {
  const parts = []
  const text      = m.item.text
  const positions = m.positions
  // console.log(positions)

  if (!positions)
    return escapeXML(text)

  let lastIndex = 0
  for (let i = 0; i < positions.length; i++) {
    const index = positions[i]

    if (index !== 0 || index === lastIndex + 1) {
      const subtext = escapeXML(text.slice(lastIndex, index))
      parts.push(subtext)
    }

    const subtext = escapeXML(text.slice(index, index + 1))
    parts.push(style.match(subtext))

    lastIndex = index + 1
  }
  if (lastIndex < text.length) {
    const subtext = escapeXML(text.slice(lastIndex))
    parts.push(subtext)
  }

  return parts.join('')
}


module.exports = CompletionItems
