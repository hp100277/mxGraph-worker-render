const DOMParser = require("xmldom").DOMParser;

/**
 * Class: mxUtils
 *
 * A singleton class that provides cross-browser helper methods.
 * This is a global functionality. To access the functions in this
 * class, use the global classname appended by the functionname.
 * You may have to load chrome://global/content/contentAreaUtils.js
 * to disable certain security restrictions in Mozilla for the <open>,
 * <save>, <saveAs> and <copy> function.
 *
 * For example, the following code displays an error message:
 *
 * (code)
 * mxUtils.error('Browser is not supported!', 200, false);
 * (end)
 *
 * Variable: errorResource
 *
 * Specifies the resource key for the title of the error window. If the
 * resource for this key does not exist then the value is used as
 * the title. Default is 'error'.
 */
var mxUtils = {
  /**
   * Function: parseXml
   *
   * Parses the specified XML string into a new XML document and returns the
   * new document.
   *
   * Example:
   *
   * (code)
   * var doc = mxUtils.parseXml(
   *   '<mxGraphModel><root><MyDiagram id="0"><mxCell/></MyDiagram>'+
   *   '<MyLayer id="1"><mxCell parent="0" /></MyLayer><MyObject id="2">'+
   *   '<mxCell style="strokeColor=blue;fillColor=red" parent="1" vertex="1">'+
   *   '<mxGeometry x="10" y="10" width="80" height="30" as="geometry"/>'+
   *   '</mxCell></MyObject></root></mxGraphModel>');
   * (end)
   *
   * Parameters:
   *
   * xml - String that contains the XML data.
   */
  parseXml(xml) {
    const parser = new DOMParser();
    return parser.parseFromString(xml, "text/xml");
  },
  /**
   * Function: indexOf
   *
   * Returns the index of obj in array or -1 if the array does not contain
   * the given object.
   *
   * Parameters:
   *
   * array - Array to check for the given obj.
   * obj - Object to find in the given array.
   */
  indexOf: function (array, obj) {
    if (array != null && obj != null) {
      for (var i = 0; i < array.length; i++) {
        if (array[i] == obj) {
          return i;
        }
      }
    }

    return -1;
  },

  /**
   * Function: getFunctionName
   *
   * Returns the name for the given function.
   *
   * Parameters:
   *
   * f - JavaScript object that represents a function.
   */
  getFunctionName: function (f) {
    var str = null;

    if (f != null) {
      if (f.name != null) {
        str = f.name;
      } else {
        str = mxUtils.trim(f.toString());

        if (/^function\s/.test(str)) {
          str = mxUtils.ltrim(str.substring(9));
          var idx2 = str.indexOf("(");

          if (idx2 > 0) {
            str = str.substring(0, idx2);
          }
        }
      }
    }

    return str;
  },
  /**
   * Function: isNumeric
   *
   * Returns true if the specified value is numeric, that is, if it is not
   * null, not an empty string, not a HEX number and isNaN returns false.
   *
   * Parameters:
   *
   * n - String representing the possibly numeric value.
   */
  isNumeric: function (n) {
    return (
      !isNaN(parseFloat(n)) &&
      isFinite(n) &&
      (typeof n != "string" || n.toLowerCase().indexOf("0x") < 0)
    );
  },
  /**
   * Function: ltrim
   *
   * Strips all whitespaces from the beginning of the string. Without the
   * second parameter, this will trim these characters:
   *
   * - " " (ASCII 32 (0x20)), an ordinary space
   * - "\t" (ASCII 9 (0x09)), a tab
   * - "\n" (ASCII 10 (0x0A)), a new line (line feed)
   * - "\r" (ASCII 13 (0x0D)), a carriage return
   * - "\0" (ASCII 0 (0x00)), the NUL-byte
   * - "\x0B" (ASCII 11 (0x0B)), a vertical tab
   */
  ltrim: function (str, chars) {
    chars = chars || "\\s";

    return str != null
      ? str.replace(new RegExp("^[" + chars + "]+", "g"), "")
      : null;
  },

  /**
   * Function: rtrim
   *
   * Strips all whitespaces from the end of the string. Without the second
   * parameter, this will trim these characters:
   *
   * - " " (ASCII 32 (0x20)), an ordinary space
   * - "\t" (ASCII 9 (0x09)), a tab
   * - "\n" (ASCII 10 (0x0A)), a new line (line feed)
   * - "\r" (ASCII 13 (0x0D)), a carriage return
   * - "\0" (ASCII 0 (0x00)), the NUL-byte
   * - "\x0B" (ASCII 11 (0x0B)), a vertical tab
   */
  rtrim: function (str, chars) {
    chars = chars || "\\s";

    return str != null
      ? str.replace(new RegExp("[" + chars + "]+$", "g"), "")
      : null;
  },

  /**
   * Function: trim
   *
   * Strips all whitespaces from both end of the string.
   * Without the second parameter, Javascript function will trim these
   * characters:
   *
   * - " " (ASCII 32 (0x20)), an ordinary space
   * - "\t" (ASCII 9 (0x09)), a tab
   * - "\n" (ASCII 10 (0x0A)), a new line (line feed)
   * - "\r" (ASCII 13 (0x0D)), a carriage return
   * - "\0" (ASCII 0 (0x00)), the NUL-byte
   * - "\x0B" (ASCII 11 (0x0B)), a vertical tab
   */
  trim: function (str, chars) {
    return mxUtils.ltrim(mxUtils.rtrim(str, chars), chars);
  },
};

module.exports = { ...mxUtils };
