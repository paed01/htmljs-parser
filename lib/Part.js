'use strict';

class TagNamePart {
  constructor(parent, type) {
      this.parent = parent;
      this._parser = parent._parser;
      this.type = type;
      this.stringParts = [];
      this.rawParts = [];
      this.text = '';
  }
  _endText() {
      const text = this.text;
      if (!text) return;
      const parser = this._parser;

      this.stringParts.push(JSON.stringify(text));
      this.rawParts.push({
          text: text,
          pos: parser.pos - text.length,
          endPos: parser.pos
      });

      this.text = '';
  }
  addPlaceholder(placeholder) {
      const startPos = placeholder.pos + (placeholder.escape ? 2 : 3);
      const endPos = placeholder.endPos - 1;
      this._endText();
      this.stringParts.push('(' + placeholder.value + ')');
      this.rawParts.push({
          expression: this._parser.src.slice(startPos, endPos),
          pos: startPos,
          endPos: endPos
      });
  }
  end() {
      this._endText();

      const expression = this.stringParts.join('+');

      if (this.type === 'id') {
          this._parser.currentOpenTag.shorthandId = {
              value: expression,
              rawParts: this.rawParts
          };
      } else if (this.type === 'class') {
          const parser = this._parser;
          if (!parser.currentOpenTag.shorthandClassNames) {
              parser.currentOpenTag.shorthandClassNames = [];
          }

          parser.currentOpenTag.shorthandClassNames.push({
              value: expression,
              rawParts: this.rawParts
          });
      }
  }
}

module.exports = class Part {
  constructor(parser) {
      this._parser = parser;
      this.pos = parser.pos;
      this.parentState = parser.state;
      this.currentPart = null;
      this.hasId = false;
  }
  beginPart(type) {
      this.currentPart = new TagNamePart(this, type);
  }
};
