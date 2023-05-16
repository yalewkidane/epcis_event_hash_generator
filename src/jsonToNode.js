const jsonld = require('jsonld');

let _namespaces = {} 

function _collect_namespaces_from_jsonld_context(context) {
  global._namespaces;

  if (typeof context !== 'string') {
    if (Array.isArray(context)) {
      for (let c of context) {
        if (typeof c === 'string') {
          _namespaces[c] = '{' + c + '}';
        } else {
          for (let key of Object.keys(c)) {
            _namespaces[key] = '{' + c[key] + '}';
          }
        }
      }
    }
  }
}

function _namespace_replace(text, is_value = false) {
    if (typeof text !== 'string') {
      return text;
    }
  
    const splitted = text.split(":", 2);
  
    if (splitted.length > 1 && _namespaces.hasOwnProperty(splitted[0])) {
      if (is_value) {
        return _namespaces[splitted[0]].replace('{', '').replace('}', '') + splitted[1];
      }
  
      return _namespaces[splitted[0]] + splitted[1];
    }
  
    return text;
  }


exports.jsonToPy=(jsonObj)=> {
    let pyObj = ["", "", []];
  
    if (Array.isArray(jsonObj)) {
      for (const child of jsonObj) {
        pyObj[2].push(this.jsonToPy(child));
      }
    } else if (typeof jsonObj === "object") {
      if ("type" in jsonObj) {
        pyObj = [jsonObj["type"], "", []];
      }
  
      if ("#text" in jsonObj) {
        pyObj = [pyObj[0], jsonObj["#text"], pyObj[2]];
      }
  
      const toBeIgnored = ["#text", "rdfs:comment", "comment"];
  
      for (const [key, val] of Object.entries(jsonObj).filter(
        (x) => !toBeIgnored.includes(x[0])
      )) {
        if (key.startsWith("@xmlns")) {
          _namespaces[key.slice(7)] = "{" + val + "}";
          console.debug("Namespaces: ", _namespaces);
  
          pyObj = [_namespaceReplace(pyObj[0]), pyObj[1], pyObj[2]];
        } else {
          let child = this.jsonToPy(val);
  
          const namespaceReplacedKey = _namespace_replace(key);
  
          if (Array.isArray(val)) {
            for (const element of child[2]) {
              pyObj[2].push([namespaceReplacedKey, element[1], element[2]]);
            }
          } else {
            child = [namespaceReplacedKey, child[1], child[2]];
            pyObj[2].push(child);
          }
        }
      }
    } else {
      //console.debug("converting '", jsonObj, "' to str");
      return ["", _namespace_replace(String(jsonObj), true), []];
    }
  
    if (!["bizTransaction", "source", "destination"].some((k) => Object.keys(jsonObj).includes(k))) {
        pyObj[2].sort();
    }
  
    return pyObj;
  }

  function _find_expanded_values(expanded, expandedValues) {
    /*
    Find the string values in the expanded JSON document.
    */
    if (typeof expanded === 'string') {
      expandedValues.push(expanded);
      return;
    }
  
    if (Array.isArray(expanded)) {
      for (let item of expanded) {
        _find_expanded_values(item, expandedValues);
      }
      return;
    }
  
    if (typeof expanded === 'object') {
      for (let key of Object.keys(expanded)) {
        _find_expanded_values(expanded[key], expandedValues);
      }
    }
  }

function _find_replacement_string_values(value, expandedValues) {
  /*
  Heuristic matching of value to expanded values.
  */
  const expandedArray = Array.from(expandedValues);
  let matches = expandedArray.filter(x => x.endsWith(`-${value}`) || x.endsWith(`/${value}`));
  if (matches.length === 1) {
    return matches[0];
  } else if (matches.length > 1) {
    console.warn(`More than one matching bare string replacement ${matches}`);
  }

  return;
}

function _replace_bare_string_values(jsonObj, expandedValues) {
  /*
  Find the string values in the jsonObj. Search for matching replacements and replace the values.
  */
  if (typeof jsonObj === 'string') {
    let replacement = _find_replacement_string_values(jsonObj, expandedValues);
    if (replacement) {
      return replacement;
    }
    return jsonObj;
  }

  if (Array.isArray(jsonObj)) {
    let newList = [];
    for (let item of jsonObj) {
      newList.push(_replace_bare_string_values(item, expandedValues));
    }
    return newList;
  }

  if (typeof jsonObj === 'object') {
    for (let key of Object.keys(jsonObj)) {
      jsonObj[key] = _replace_bare_string_values(jsonObj[key], expandedValues);
    }
  }

  return jsonObj;
}

function _bare_string_pre_preocessing(jsonObj){
  /*
  Use JSON-LD Expansion to replace the bare string notation for attribute values
  with the full web-vocabulary URLs.
  Only replacing CBV web vocabulary, (e.g. not EPCIS).
  */
  console.debug(`JSON-LD: ${JSON.stringify(jsonObj, null, 2)}`);
  let expanded = jsonld.expand(jsonObj);
  //console.debug(`Expanded JSON: ${JSON.stringify(expanded, null, 2)}`);

  let expandedValues = [];
  _find_expanded_values(expanded, expandedValues);
  //console.debug(`all expandedValues: ${expandedValues}`);
  expandedValues = new Set(expandedValues.filter(x => x.startsWith('https://ref.gs1.org/cbv') || x.startsWith('https://gs1.org/voc')));
  //console.debug(`expandedValues for replacement: ${expandedValues}`);
  jsonObj = _replace_bare_string_values(jsonObj, expandedValues);

  //console.debug(`bare strings replaced: ${JSON.stringify(jsonObj, null, 2)}`);

  return jsonObj;
}

exports.event_list_from_epcis_document_json=(json_obj) =>{
  /**
  * Convert the json_obj to a simple object.
  * Apply the format corrections to match what we get from the respective xml representation.
  */

  
  //json_obj = _bare_string_pre_preocessing(json_obj);

  if (json_obj["@context"] !== undefined) {
    _collect_namespaces_from_jsonld_context(json_obj["@context"]);
  }

  let event_list = [];
  if (json_obj.epcisBody !== undefined && "eventList" in json_obj.epcisBody) {
    event_list = json_obj.epcisBody.eventList;
  } else if (json_obj.epcisBody !== undefined && "event" in json_obj.epcisBody) {
    // epcisBody may contain a single event
    event_list = [json_obj.epcisBody.event];
  }else{
    //delete json_obj['@context']
    event_list = [json_obj];
  }

  let events = [];

  // Correct JSON/XML data model mismatch
  for (let event of event_list) {
    events.push(this.jsonToPy(event));
    //events.push(json_xml_model_mismatch_correction.deep_structure_correction(_json_to_py(event)));
  }

  return ["EventList", "", events];
}