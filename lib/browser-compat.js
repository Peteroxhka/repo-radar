// DOM methods used by the main interface and missing in older WebKit.
(function () {
  // UTF-8 fallback for browsers without the Encoding API.
  if (!window.TextEncoder) window.TextEncoder = function () {};
  if (!window.TextEncoder.prototype.encode) {
    window.TextEncoder.prototype.encode = function (value) {
      var text = String(value === undefined ? "" : value)
        .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g,
          function (part) { return part.length === 2 ? part : "\uFFFD"; });
      var encoded = unescape(encodeURIComponent(text));
      var bytes = new Uint8Array(encoded.length);
      for (var i = 0; i < encoded.length; i++) bytes[i] = encoded.charCodeAt(i);
      return bytes;
    };
  }
  if (!window.TextDecoder) {
    window.TextDecoder = function () {};
    window.TextDecoder.prototype.decode = function (value) {
      var bytes = value instanceof Uint8Array ? value :
        value && value.buffer ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength) :
        new Uint8Array(value || 0);
      var chars = [];
      for (var i = 0; i < bytes.length; i++) chars.push("%" + ("0" + bytes[i].toString(16)).slice(-2));
      return decodeURIComponent(chars.join("")).replace(/^\uFEFF/, "");
    };
  }
  function append() {
    for (var i = 0; i < arguments.length; i++) {
      var item = arguments[i];
      this.appendChild(item instanceof Node ? item : document.createTextNode(String(item)));
    }
  }
  if (!Element.prototype.append) Element.prototype.append = append;
  if (!DocumentFragment.prototype.append) DocumentFragment.prototype.append = append;
  if (!Element.prototype.replaceChildren) {
    Element.prototype.replaceChildren = function () {
      while (this.firstChild) this.removeChild(this.firstChild);
      append.apply(this, arguments);
    };
  }
  if (!Element.prototype.remove) {
    Element.prototype.remove = function () { if (this.parentNode) this.parentNode.removeChild(this); };
  }
  // Older DOMTokenList implementations ignore the force argument.
  var probe = document.createElement("div").classList;
  probe.toggle("probe", false);
  if (probe.contains("probe")) {
    var original = DOMTokenList.prototype.toggle;
    DOMTokenList.prototype.toggle = function (token, force) {
      if (arguments.length === 1) return original.call(this, token);
      if (force) this.add(token);
      else this.remove(token);
      return Boolean(force);
    };
  }
  if (!window.CSS || !window.CSS.supports || !window.CSS.supports("display", "grid"))
    document.documentElement.className += " no-grid";
}());
