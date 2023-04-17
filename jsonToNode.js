
let _namespaces = {} 
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
      console.debug("converting '", jsonObj, "' to str");
      return ["", _namespace_replace(String(jsonObj), true), []];
    }
  
    if (!["bizTransaction", "source", "destination"].some((k) => Object.keys(jsonObj).includes(k))) {
        pyObj[2].sort();
    }
  
    return pyObj;
  }



  let events = {
    type :  "ObjectEvent",
    action :  "OBSERVE",
    bizStep : "shipping",
    disposition :  "in_transit",
    epcList :  ["urn:epc:id:sgtin:0614141.107346.2017","urn:epc:id:sgtin:0614141.107346.2018"],
    eventTime :  "{{createdAt}}",
    eventTimeZoneOffset : "-06:00",
    readPoint :  {"id": "urn:epc:id:sgln:0614142.56346.1234", "http://example//readPoint//value":"readpointValue"},
    bizTransactionList : [  {"type": "po", "bizTransaction": "http://transaction.acme.com/po/12345678" }]
}

//console.log(jsonToPy(events))