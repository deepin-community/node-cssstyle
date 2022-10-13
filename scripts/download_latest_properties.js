'use strict';

/*
 * W3C provides JSON list of all CSS properties and their status in the standard
 *
 * documentation: https://www.w3.org/Style/CSS/all-properties.en.html
 * JSON url: ( https://www.w3.org/Style/CSS/all-properties.en.json )
 *
 * Download that file, filter out duplicates and filter the properties based on the wanted standard level
 *
 * ED   - Editors' Draft (not a W3C Technical Report)
 * FPWD - First Public Working Draft
 * WD   - Working Draft
 * LC   - Last Call Working Draft
 * CR   - Candidate Recommendation
 * PR   - Proposed Recommendation
 * REC  - Recommendation
 * NOTE - Working Group Note
 */

var fs = require('fs');
var path = require('path');

var request = require('request');

const { camelToDashed } = require('../lib/parsers');

var url = 'https://www.w3.org/Style/CSS/all-properties.en.json';

console.log('Downloading CSS properties...');

function toCamelCase(propName) {
  return propName.replace(/-([a-z])/g, function(g) {
    return g[1].toUpperCase();
  });
}

request(url, function(error, response, body) {
  if (!error && response.statusCode === 200) {
    var allCSSProperties = JSON.parse(body);

    // Filter out all properties newer than Working Draft
    var workingDraftAndOlderProperties = allCSSProperties.filter(function(cssProp) {
      // TODO: --* css Needs additional logic to this module, so filter it out for now
      return cssProp.status !== 'ED' && cssProp.status !== 'FPWD' && cssProp.property !== '--*';
    });

    // Remove duplicates, there can be many properties in different states of standard
    // and add only property names to the list
    var CSSpropertyNames = [];
    workingDraftAndOlderProperties.forEach(function(cssProp) {
      const camelCaseName = toCamelCase(cssProp.property);

      if (CSSpropertyNames.indexOf(camelCaseName) === -1) {
        CSSpropertyNames.push(camelCaseName);
      }
    });

    var out_file = fs.createWriteStream(path.resolve(__dirname, './../lib/allProperties.js'), {
      encoding: 'utf-8',
    });

    var date_today = new Date();
    out_file.write(
      "'use strict';\n\n// autogenerated - " +
        (date_today.getMonth() + 1 + '/' + date_today.getDate() + '/' + date_today.getFullYear()) +
        '\n\n'
    );
    out_file.write('/*\n *\n * https://www.w3.org/Style/CSS/all-properties.en.html\n */\n\n');
    out_file.write(
      'module.exports = new Set(' +
        JSON.stringify(CSSpropertyNames.map(camelToDashed), null, 2) +
        ');\n'
    );

    out_file.end(function(err) {
      if (err) {
        throw err;
      }

      console.log('Generated ' + Object.keys(CSSpropertyNames).length + ' properties.');
    });
  } else {
    throw error;
  }
});
