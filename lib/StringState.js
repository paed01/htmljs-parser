'use strict';

const {
    CODE_BACK_SLASH,
} = require('./constants');

const BaseState = require('./BaseState');

module.exports = class StringState extends BaseState {
    constructor(parser) {
        super(parser, 'STATE_STRING');
        this.ignorePlaceholders = parser.options.ignorePlaceholders;
        this.ignoreNonstandardStringPlaceholders = parser.options.ignoreNonstandardStringPlaceholders;
    }
    placeholder(placeholder) {
        const parser = this.parser;
        if (parser.currentPart.currentText) {
            parser.currentPart.stringParts.push(parser.currentPart.currentText);
            parser.currentPart.currentText = '';
        }
        parser.currentPart.isStringLiteral = false;
        parser.currentPart.stringParts.push(placeholder);
    }
    eol(str) {
    // New line characters are not allowed in JavaScript string expressions. We need to use
    // a different character sequence, but we don't want to through off positions so we need
    // to use a replacement sequence with the same number of characters.
        if (str.length === 2) {
            this.parser.currentPart.currentText += '\\r\\n';
        } else {
            this.parser.currentPart.currentText += '\\n';
        }
    }
    eof() {
        const parser = this.parser;
        if (parser.placeholderDepth > 0) {
            parser.notifyError(parser.pos,
                'INVALID_STRING',
                'EOF reached while parsing string expression found inside placeholder');
            return;
        }
        parser.notifyError(parser.pos,
            'INVALID_STRING',
            'EOF reached while parsing string expression');
    }
    char(ch, code) {
        const parser = this.parser;
        const stringParts = parser.currentPart.stringParts;

        const quoteCharCode = parser.currentPart.quoteCharCode;

        if (code === CODE_BACK_SLASH) {
            if (this.checkForEscapedEscapedPlaceholder(ch, code)) {
                if (this.ignorePlaceholders) {
                    // We are actually adding two escaped backslashes here...
                    parser.currentPart.currentText += '\\\\\\\\';
                } else {
                    parser.currentPart.currentText += '\\';
                }
            } else if (this.checkForEscapedPlaceholder(ch, code)) {
                if (this.ignorePlaceholders) {
                    // We are actually adding one escaped backslashes here...
                    parser.currentPart.currentText += '\\\\$';
                } else {
                    parser.currentPart.currentText += '$';
                }
            } else {
                // Handle string escape sequence
                parser.currentPart.currentText += ch + parser.lookAtCharAhead(1);
            }

            parser.skip(1);
        } else if (code === quoteCharCode) {
            // We encountered the end delimiter
            if (parser.currentPart.currentText) {
                stringParts.push(parser.currentPart.currentText);
            }

            let stringExpr = '';
            const quoteChar = parser.currentPart.quoteChar;

            const len = stringParts.length;
            if (len) {
                let i = 0;
                while (i < len) {
                    if (i !== 0) {
                        stringExpr += '+';
                    }
                    const part = stringParts[i++];

                    if (typeof part === 'string') {
                        stringExpr += quoteChar + part + quoteChar;
                    } else {
                        stringExpr += '(' + part.value + ')';
                    }
                }
            } else {
                // Just an empty string...
                stringExpr = quoteChar + quoteChar;
            }

            if (len > 1) {
                stringExpr = '(' + stringExpr + ')';
            }

            parser.currentPart.value = stringExpr;
            parser.endString();
        } else if (!this.ignorePlaceholders && !this.ignoreNonstandardStringPlaceholders && this.checkForPlaceholder(ch, code)) {
            if (parser.currentPart.currentText) {
                stringParts.push(parser.currentPart.currentText);
            }

            parser.currentPart.currentText = '';
            // We encountered nested placeholder...
            parser.currentPart.isStringLiteral = false;
        } else {
            parser.currentPart.currentText += ch;
        }
    }
};