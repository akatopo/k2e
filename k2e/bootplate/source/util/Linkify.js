/* global k2e:false */
/* eslint max-len: 0, prefer-template: 0 */

(function () {

const API = {
  toHtml,
  toComponents,
};

enyo.kind({
  name: 'k2e.util.Linkify',
  statics: API,
  constructor() {
    Object.keys(API).forEach((key) => {
      this[key] = API[key];
    });

    this.inherited(arguments);
  },
});

/////////////////////////////////////////////////////////////

/* Here is a commented version of the regex (in PHP string format):
$url_pattern = '/# Rev:20100913_0900 github.com\/jmrware\/LinkifyURL
# Match http & ftp URL that is not already linkified.
  # Alternative 1: URL delimited by (parentheses).
  (\()                     # $1  "(" start delimiter.
  ((?:ht|f)tps?:\/\/[a-z0-9\-._~!$&\'()*+,;=:\/?#[\]@%]+)  # $2: URL.
  (\))                     # $3: ")" end delimiter.
| # Alternative 2: URL delimited by [square brackets].
  (\[)                     # $4: "[" start delimiter.
  ((?:ht|f)tps?:\/\/[a-z0-9\-._~!$&\'()*+,;=:\/?#[\]@%]+)  # $5: URL.
  (\])                     # $6: "]" end delimiter.
| # Alternative 3: URL delimited by {curly braces}.
  (\{)                     # $7: "{" start delimiter.
  ((?:ht|f)tps?:\/\/[a-z0-9\-._~!$&\'()*+,;=:\/?#[\]@%]+)  # $8: URL.
  (\})                     # $9: "}" end delimiter.
| # Alternative 4: URL delimited by <angle brackets>.
  (<|&(?:lt|\#60|\#x3c);)  # $10: "<" start delimiter (or HTML entity).
  ((?:ht|f)tps?:\/\/[a-z0-9\-._~!$&\'()*+,;=:\/?#[\]@%]+)  # $11: URL.
  (>|&(?:gt|\#62|\#x3e);)  # $12: ">" end delimiter (or HTML entity).
| # Alternative 5: URL not delimited by (), [], {} or <>.
  (                        # $13: Prefix proving URL not already linked.
    (?: ^                  # Can be a beginning of line or string, or
    | [^=\s\'"\]]          # a non-"=", non-quote, non-"]", followed by
    ) \s*[\'"]?            # optional whitespace and optional quote;
  | [^=\s]\s+              # or... a non-equals sign followed by whitespace.
  )                        # End $13. Non-prelinkified-proof prefix.
  ( \b                     # $14: Other non-delimited URL.
    (?:ht|f)tps?:\/\/      # Required literal http, https, ftp or ftps prefix.
    [a-z0-9\-._~!$\'()*+,;=:\/?#[\]@%]+ # All URI chars except "&" (normal*).
    (?:                    # Either on a "&" or at the end of URI.
      (?!                  # Allow a "&" char only if not start of an...
        &(?:gt|\#0*62|\#x0*3e);                  # HTML ">" entity, or
      | &(?:amp|apos|quot|\#0*3[49]|\#x0*2[27]); # a [&\'"] entity if
        [.!&\',:?;]?        # followed by optional punctuation then
        (?:[^a-z0-9\-._~!$&\'()*+,;=:\/?#[\]@%]|$)  # a non-URI char or EOS.
      ) &                  # If neg-assertion true, match "&" (special).
      [a-z0-9\-._~!$\'()*+,;=:\/?#[\]@%]* # More non-& URI chars (normal*).
    )*                     # Unroll-the-loop (special normal*)*.
    [a-z0-9\-_~$()*+=\/#[\]@%]  # Last char can\'t be [.!&\',;:?]
  )                        # End $14. Other non-delimited URL.
/imx';
*/

const urlRegEx = /(\()((?:ht|f)tps?:\/\/[a-z0-9\-._~!$&'()*+,;=:\/?#[\]@%]+)(\))|(\[)((?:ht|f)tps?:\/\/[a-z0-9\-._~!$&'()*+,;=:\/?#[\]@%]+)(\])|(\{)((?:ht|f)tps?:\/\/[a-z0-9\-._~!$&'()*+,;=:\/?#[\]@%]+)(\})|(<|&(?:lt|#60|#x3c);)((?:ht|f)tps?:\/\/[a-z0-9\-._~!$&'()*+,;=:\/?#[\]@%]+)(>|&(?:gt|#62|#x3e);)|((?:^|[^=\s'"\]])\s*['"]?|[^=\s]\s+)(\b(?:ht|f)tps?:\/\/[a-z0-9\-._~!$'()*+,;=:\/?#[\]@%]+(?:(?!&(?:gt|#0*62|#x0*3e);|&(?:amp|apos|quot|#0*3[49]|#x0*2[27]);[.!&',:?;]?(?:[^a-z0-9\-._~!$&'()*+,;=:\/?#[\]@%]|$))&[a-z0-9\-._~!$'()*+,;=:\/?#[\]@%]*)*[a-z0-9\-_~$()*+=\/#[\]@%])/img;

/* <![CDATA[ */
/* File:        linkify.js
 * Version:     20101010_1000
 * Copyright:   (c) 2010 Jeff Roberson - http://jmrware.com
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * Summary: This script linkifys http URLs on a page.
 *
 * Usage:   See demonstration page: linkify.html
 */
function toHtml(text, options) {
  options = options || { targetBlank: false };
  const urlReplace = '$1$4$7$10$13<a' +
    (options.targetBlank ? ' target="_blank" ' : '') +
    ' href="$2$5$8$11$14">$2$5$8$11$14</a>$3$6$9$12';
  return text.replace(urlRegEx, urlReplace);
}

function toComponents(text, options) {
  options = options || { targetBlank: false };

  return createLinkifiedComponents(text, urlRegEx, options.targetBlank);
}

function createLinkifiedComponents(s, re, targetBlank) {
  const newRe = new RegExp(re);
  const iterable = {
    [Symbol.iterator]() {
      return {
        next() {
          const value = newRe.exec(s);
          return { value: value || undefined, done: !value };
        },
      };
    },
  };
  const components = [];
  let oldEnd = 0;
  for (const res of iterable) {
    const start = res.index;
    const end = newRe.lastIndex;
    const source = res.input;

    const prevNonMatch = source.slice(oldEnd, start);

    if (prevNonMatch) {
      components.push({ tag: null, content: prevNonMatch });
    }

    components.push({
      tag: null,
      content: `${res[1] || ''}${res[4] || ''}${res[7] || ''}${res[10] || ''}${res[13] || ''}`,
    });
    components.push({
      tag: 'a',
      attributes: {
        target: targetBlank ? '_blank' : null,
        href: `${res[2] || ''}${res[5] || ''}${res[8] || ''}${res[11] || ''}${res[14] || ''}`,
      },
      content: `${res[2] || ''}${res[5] || ''}${res[8] || ''}${res[11] || ''}${res[14] || ''}`,
    });
    components.push({
      tag: null,
      content: `${res[3] || ''}${res[6] || ''}${res[9] || ''}${res[12] || ''}`,
    });
    oldEnd = end;
  }

  if (oldEnd < s.length) {
    components.push({ tag: null, content: s.slice(oldEnd) });
  }

  return components;
}

})();
