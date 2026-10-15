/* Small dependency-free YAML reader for the plain block syntax used by levels. */
(function (root) {
  'use strict';

  function stripComment(raw) {
    let quote = '';
    let escaped = false;
    for (let index = 0; index < raw.length; index++) {
      const char = raw[index];
      if (quote === '"') {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') quote = '';
      } else if (quote === "'") {
        if (char === "'" && raw[index + 1] === "'") index++;
        else if (char === "'") quote = '';
      } else if (char === '"' || char === "'") quote = char;
      else if (char === '#' && (index === 0 || /\s/.test(raw[index - 1]))) return raw.slice(0, index).trimEnd();
    }
    return raw.trimEnd();
  }
  function pairColon(text) {
    let quote = '';
    let escaped = false;
    for (let index = 0; index < text.length; index++) {
      const char = text[index];
      if (quote === '"') {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') quote = '';
      } else if (quote === "'") {
        if (char === "'" && text[index + 1] === "'") index++;
        else if (char === "'") quote = '';
      } else if (char === '"' || char === "'") quote = char;
      else if (char === ':' && (index === text.length - 1 || /\s/.test(text[index + 1]))) return index;
    }
    return -1;
  }

  function parseYaml(source) {
    const lines = String(source).replace(/^\uFEFF/, '').split(/\r?\n/)
      .map((raw, index) => {
        if (/\t/.test(raw.match(/^\s*/)?.[0] || '')) throw new Error(`Tab indentation on YAML line ${index + 1}.`);
        const content = stripComment(raw);
        return { indent: content.length - content.trimStart().length, text: content.trimStart(), line: index + 1 };
      })
      .filter(line => line.text && line.text !== '---' && line.text !== '...');
    let cursor = 0;

    function scalar(value, line) {
      const text = value.trim();
      if (text === '' || text === 'null' || text === '~') return null;
      if (text === 'true') return true;
      if (text === 'false') return false;
      if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(text)) return Number(text);
      if (text === '[]') return [];
      if (text === '{}') return {};
      if (text.startsWith('"')) {
        try { return JSON.parse(text); } catch (_) { throw new Error(`Invalid quoted string on YAML line ${line}.`); }
      }
      if (text.startsWith("'")) {
        if (!text.endsWith("'")) throw new Error(`Unclosed quoted string on YAML line ${line}.`);
        return text.slice(1, -1).replace(/''/g, "'");
      }
      return text;
    }

    function pair(text, object, indent, line) {
      const colon = pairColon(text);
      if (colon < 1) throw new Error(`Expected a key/value pair on YAML line ${line}.`);
      const key = text.slice(0, colon).trim();
      const value = text.slice(colon + 1).trim();
      if (!value && cursor < lines.length && lines[cursor].indent > indent) {
        object[key] = block(lines[cursor].indent);
      } else object[key] = scalar(value, line);
    }

    function block(indent) {
      const isSequence = lines[cursor]?.indent === indent && /^-(?:\s|$)/.test(lines[cursor].text);
      if (isSequence) {
        const result = [];
        while (cursor < lines.length && lines[cursor].indent === indent && /^-(?:\s|$)/.test(lines[cursor].text)) {
          const current = lines[cursor++];
          const item = current.text.replace(/^-\s?/, '');
          if (!item) {
            result.push(cursor < lines.length && lines[cursor].indent > indent ? block(lines[cursor].indent) : null);
          } else if (pairColon(item) > 0) {
            const object = {};
            pair(item, object, indent + 2, current.line);
            while (cursor < lines.length && lines[cursor].indent === indent + 2 && !/^-(?:\s|$)/.test(lines[cursor].text)) {
              const entry = lines[cursor++];
              pair(entry.text, object, indent + 2, entry.line);
            }
            result.push(object);
          } else result.push(scalar(item, current.line));
        }
        return result;
      }

      const result = {};
      while (cursor < lines.length && lines[cursor].indent === indent && !/^-(?:\s|$)/.test(lines[cursor].text)) {
        const current = lines[cursor++];
        pair(current.text, result, indent, current.line);
      }
      return result;
    }

    if (!lines.length) return null;
    const result = block(lines[0].indent);
    if (cursor !== lines.length) throw new Error(`Unexpected indentation on YAML line ${lines[cursor].line}.`);
    return result;
  }

  function stringifyYaml(value) {
    const scalar = item => {
      if (item === null || item === undefined) return 'null';
      if (typeof item === 'number' || typeof item === 'boolean') return String(item);
      return JSON.stringify(String(item));
    };
    const isNode = item => Array.isArray(item) || (item && typeof item === 'object');
    function emit(item, indent, sequenceItem = false) {
      const pad = ' '.repeat(indent);
      if (Array.isArray(item)) {
        if (!item.length) return [`${pad}[]`];
        return item.flatMap(entry => {
          if (!isNode(entry)) return [`${pad}- ${scalar(entry)}`];
          if (Array.isArray(entry) && !entry.length) return [`${pad}- []`];
          if (!Array.isArray(entry) && !Object.keys(entry).length) return [`${pad}- {}`];
          if (Array.isArray(entry)) return [`${pad}-`, ...emit(entry, indent + 2)];
          const pairs = Object.entries(entry);
          return pairs.flatMap(([key, child], index) => {
            const prefix = `${pad}${index === 0 ? '- ' : '  '}${key}:`;
            if (isNode(child) && ((Array.isArray(child) && child.length) || (!Array.isArray(child) && Object.keys(child).length))) {
              return [`${prefix}`, ...emit(child, indent + 4)];
            }
            return [`${prefix} ${isNode(child) ? (Array.isArray(child) ? '[]' : '{}') : scalar(child)}`];
          });
        });
      }
      if (item && typeof item === 'object') {
        const pairs = Object.entries(item);
        if (!pairs.length) return [`${pad}{}`];
        return pairs.flatMap(([key, child]) => {
          const prefix = `${pad}${key}:`;
          if (isNode(child) && ((Array.isArray(child) && child.length) || (!Array.isArray(child) && Object.keys(child).length))) {
            return [`${prefix}`, ...emit(child, indent + 2)];
          }
          return [`${prefix} ${isNode(child) ? (Array.isArray(child) ? '[]' : '{}') : scalar(child)}`];
        });
      }
      return [`${pad}${sequenceItem ? '- ' : ''}${scalar(item)}`];
    }
    return `${emit(value, 0).join('\n')}\n`;
  }

  root.parseYaml = parseYaml;
  root.stringifyYaml = stringifyYaml;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = parseYaml;
    module.exports.stringifyYaml = stringifyYaml;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
