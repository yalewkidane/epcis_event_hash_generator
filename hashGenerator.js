
//https://github.com/RalphTro/epcis-event-hash-generator/blob/master/epcis_event_hash_generator/hash_generator.py


const { default: copy } = require("copy-deep");

//const { DateTime } = require("luxon");
//const logger = require("some-logging-library"); // Replace with your logging library of choice

//const datetime = require('datetime');
const crypto = require('crypto');
//const copy = require('copy');
//const logging = require('logging');
//const traceback = require('traceback');
//const dateutil = require('dateutil');

const dl_normaliser = require('./dl_normaliser').normaliser;
const PROP_ORDER = require('./prepOrder').PROP_ORDER;


//const JOIN_BY = require('./prepOrder').JOIN_BY;

const JOIN_BY = ""

function _fix_time_stamp_format(timestamp) {
    logger.debug(`correcting timestamp format for '${timestamp}'`);

    try {
        const abstractDateTime = DateTime.fromISO(timestamp, { setZone: true });
        const fixed = abstractDateTime.toUTC().toISO({
            includeOffset: false,
            suppressMilliseconds: false,
        });

        logger.debug(`corrected timestamp '${fixed}'`);
        return fixed;
    } catch (error) {
        logger.warning(`'${timestamp}' is labelled as time but does not match the ISO 8601 dateTime format`);
        return timestamp;
    }
}

function _child_to_pre_hash_string(child, sub_child_order) {
    console.log("Processing '" + child + "'");
    let text = "";
    let grand_child_text = "";
    if (sub_child_order) {
        grand_child_text = _recurse_through_children_in_order(child[2], sub_child_order);
    }
    if (child[1]) {
        text = child[1].trim();
        if (child[0].toLowerCase().includes("time") && !child[0].toLowerCase().includes("offset")) {
            text = _fix_time_stamp_format(text);
        } else {
            text = _canonize_value(text);
        }

        if (text) {
            text = "=" + text;
        }
    }

    if (text || grand_child_text) {
        let re = child[0] + text + grand_child_text;
        console.log("pre hash string element: '" + text + "'");
        return re;
    }

    return "";
}


function _recurse_through_children_in_order(child_list, child_order) {
    /*
    Loop over child order, look for a child of root with matching key and build the pre-hash string (mostly key=value)
    Recurse through the grand children applying the sub order.
    All elements added to the returned pre hash string are removed from the tree below the root.
    After the recursion completes, only elements NOT added to the pre-hash string are left in the tree.
    `child_list`    is to be a list of simple python object, i.e. triples of two strings (key/value) and a list of
                    simple python objects (grand children).
    `child_order`   is expected to be a property order, see PROP_ORDER.
    */
    let pre_hash = "";

    console.log("Calculating pre hash for child list --: ", child_list)
    console.log("With order--: ", child_order)
    //console.log(`Calculating pre hash for child list ${child_list} \nWith order ${child_order}`);

    const user_extensions = _gather_user_extensions(child_list);


    console.log("user_extensions--: ", user_extensions)

    let children = [];

    for (let [child_name, sub_child_order] of child_order) {
        //console.log("child_name--: ", child_name)
        //console.log("sub_child_order--: ", sub_child_order)
        let child = child_list.find(x => x[0] === child_name);
        if (child) {
            children.push(child);
        }
        const list_of_values = [];

        for (const child of children) {
            console.log("child--: ", child)
            console.log("sub_child_order--: ", sub_child_order)
            const child_pre_hash = _child_to_pre_hash_string(child, sub_child_order);
            if (child_pre_hash) {
                list_of_values.push(child_pre_hash);
            } else {
                console.debug(`Empty element ignored: ${child}`);
            }

            if (child[2].length === 0) {
                console.debug(`Finished processing ${child}`);
                child_list.splice(child_list.indexOf(child), 1);
            }
        }

        // sort list of values to fix #10
        list_of_values.sort();

        if (list_of_values.join("")) { // fixes #16
            if (pre_hash) {
                list_of_values.unshift(pre_hash); // yields correct Joining behavior
            }
            pre_hash = list_of_values.join(JOIN_BY);
        }
    }

    if (user_extensions.length > 0) {
        const user_extensions_prehash = _generic_child_list_to_prehash_string(user_extensions);
        pre_hash = pre_hash + JOIN_BY + user_extensions_prehash;
    }

    console.log(`++++++child list pre hash is ${pre_hash}`);
    return pre_hash;
}

function _canonize_value(text) {
    text = _try_format_web_vocabulary(text);
    text = _try_format_numeric(text);
    let converted = dl_normaliser(text);
    if (converted) {
        console.debug(`Converted ${text} to ${converted}`);
        return converted;
    }
    console.debug(`No canonical form for '${text}'`);
    return text;
}

function _gather_user_extensions(childList) {
    /**
     * Collect user extensions enclosed in child like sensorElementList, readPoint, etc.
     * So that user extensions can be appended to its enclosing element only
     **/
    let userExtensions = [];

    if (childList.length <= 1) {
        return userExtensions;
    }

    // ignore top level user extensions
    for (let child of childList) {
        if (child['name'].includes('eventTime') || child['name'].includes('action')) {
            return userExtensions;
        }
    }

    // collect user extensions in a separate list
    for (let x of childList) {
        if (typeof x === 'object' && x['name'].includes('{') && x['name'].includes('/}')) {
            userExtensions.push(x);
        }
    }

    // remove user extensions from original list
    if (userExtensions.length) {
        for (let elementToRemove of userExtensions) {
            const index = childList.indexOf(elementToRemove);
            if (index > -1) {
                childList.splice(index, 1);
            }
        }
    }

    return userExtensions;
}


function _try_format_web_vocabulary(text) {
    /* Replace old CBV URNs by new web vocabulary equivalents. */
    return text.replace(
        'urn:epcglobal:cbv:bizstep:', 'https://ref.gs1.org/cbv/BizStep-'
    ).replace(
        'urn:epcglobal:cbv:disp:', 'https://ref.gs1.org/cbv/Disp-'
    ).replace(
        'urn:epcglobal:cbv:btt:', 'https://ref.gs1.org/cbv/BTT-'
    ).replace(
        'urn:epcglobal:cbv:sdt:', 'https://ref.gs1.org/cbv/SDT-'
    ).replace('urn:epcglobal:cbv:er:', 'https://ref.gs1.org/cbv/ER-');
}


function _try_format_numeric(text) {
    /* remove leading/trailing zeros, leading "+", etc. from numbers. Non numeric values are left untouched. */
    try {
        if (/^[+-]?\d+$/.test(text)) {
            let numeric = parseFloat(text);
            if (parseInt(numeric) === numeric) { // remove trailing .0
                numeric = parseInt(numeric);
            }
            text = numeric.toString();}
        
    } catch (err) {
        // ignore error and return the original text
    }
    return text;
}


function _generic_child_list_to_prehash_string(children) {
    let list_of_values = [];

    console.log("Parsing remaining elements in: ", children);

    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        console.log(Array.isArray(child),"  " ,child.length == 2, "  " ,Array.isArray(child['name']) );
       
        if (Array.isArray(child) && child.length == 2 && Array.isArray(child['name'])) {
            list_of_values.push(_generic_child_list_to_prehash_string(child));
        } else {
            let text = child['value'].trim();
            if (text) {
                text = _canonize_value(text);
                text = "=" + text;
            }

            list_of_values.push(child['name'] + text + _generic_child_list_to_prehash_string(child['children']));
        }
    }

    if (children.length > 1 && shouldSort(children)) {
        list_of_values.sort();
    }
    return list_of_values.join(JOIN_BY);
}

function shouldSort(children) {
    /*
    avoid sort for 'bizTransaction', 'source', 'destination' to match order as defined in CBV 2.0
    :param children:
    :return: True/False
    */
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        if (child[0] === 'bizTransaction' || child[0] === 'source' || child[0] === 'destination') {
            return false;
        }
    }
    return true;
}

function _gather_elements_not_in_order(children, child_order) {
    /*
    * Collects vendor extensions not covered by the defined child order.
    * Consumes the root.
    */
    // remove fields that are to be ignored in the hash:
    // remove all elements from XML tree which do shouldn't take part in hash calculation
    const to_be_ignored = ["recordTime", "eventID", "type", "errorDeclaration"];
    children = children.filter(child => !to_be_ignored.includes(child['name']));
    if (children.length) {
        return _generic_child_list_to_prehash_string(children);
    }

    return "";
}


function derive_prehashes_from_events(events, join_by) {
    /*"""
    Compute a normalized form (pre-hash string) for each event.
    This is the main functionality of the hash generator.
    """*/
    const deepCopy = JSON.parse(JSON.stringify(events)); // do not change parameter!
    let JOIN_BY = join_by.replace(/\n/g, "\n").replace(/\t/g, "\t");

    console.log("Setting JOIN_BY='%s'", join_by)
    JOIN_BY = join_by

    console.info(`#events = ${deepCopy['children'].length}`);
    for (let i = 0; i < deepCopy['children'].length; i++) {
        console.info(`${i}: ${deepCopy['children'][i]}\n`);
    }

    const prehash_string_list = [];
    for (const event of deepCopy['children']) {
        console.log(`prehashing event:\n${event}`);
        try {

            const val1=_recurse_through_children_in_order(event['children'], PROP_ORDER)
            const val2=_gather_elements_not_in_order(event['children'], PROP_ORDER)
            console.log("val1 : ", val1);
            console.log("val2 : ", val2);
            prehash_string_list.push(`eventType=${event['name']}${JOIN_BY}` +
                `${val1}${JOIN_BY}` +
                `${val2}`);
        } catch (ex) {
            console.error(`could not parse event:\n${event}\n\nerror: ${ex}`);
            console.log(`${ex.stack}`);
        }
    }
    // To see/check concatenated value string before hash algorithm is performed:
    console.log(`prehash_string_list = ${prehash_string_list}`);
    return prehash_string_list;
}



function calculate_hashes_from_pre_hashes(prehashStringList, hashAlg = 'sha256') {
    const hashValueList = [];
    prehashStringList.forEach(preHashString => {
        let hashString;
        switch (hashAlg) {
            case 'sha256':
                hashString = `ni:///sha-256;${crypto.createHash('sha256').update(preHashString).digest('hex')}?ver=CBV2.0`;
                break;
            case 'sha3-256':
                hashString = `ni:///sha3-256;${crypto.createHash('sha3-256').update(preHashString).digest('hex')}?ver=CBV2.0`;
                break;
            case 'sha384':
                hashString = `ni:///sha-384;${crypto.createHash('sha384').update(preHashString).digest('hex')}?ver=CBV2.0`;
                break;
            case 'sha512':
                hashString = `ni:///sha-512;${crypto.createHash('sha512').update(preHashString).digest('hex')}?ver=CBV2.0`;
                break;
            default:
                throw new Error(`Unsupported Hashing Algorithm: ${hashAlg}`);
        }
        hashValueList.push(hashString);
    });
    return hashValueList;
}

function epcis_hashes_from_events(events, hashalg = "sha256") {
    //Calculate the list of hashes from the given events list
    //hashing algorithm through the pre hash string using default parameters.
    console.log(typeof JOIN_BY)
    prehash_string_list = derive_prehashes_from_events(events, JOIN_BY)
    return calculate_hashes_from_pre_hashes(prehash_string_list, hashalg)
}



function main() {

    /*
    let events = [{
        eventID : "ni:///sha-256;df7bb3c352fef055578554f09f5e2aa41782150ced7bd0b8af24dd3ccb30ba69?ver=CBV2.0",
        type :  "ObjectEvent",
        action :  "OBSERVE",
        bizStep : "shipping",
        disposition :  "in_transit",
        epcList :  ["urn:epc:id:sgtin:0614141.107346.2017","urn:epc:id:sgtin:0614141.107346.2018"],
        eventTime :  "{{createdAt}}",
        eventTimeZoneOffset : "-06:00",
        readPoint :  {"id": "urn:epc:id:sgln:0614142.56346.1234", "http://example//readPoint//value":"readpointValue"},
        bizTransactionList : [  {"type": "po", "bizTransaction": "http://transaction.acme.com/po/12345678" }]
    }]
    */

    let events = {
        "name": "event",
        "value": "",
        "children": [
            {
                "name": "ObjectEvent",
                "value": "",
                "children": [
                    {
                        "name": "eventTime",
                        "value": "2019-04-02T15:00:00.000+01:00",
                        "children": []
                    },
                    {
                        "name": "eventTimeZoneOffset",
                        "value": "+01:00",
                        "children": []
                    },
                    {
                        "name": "epcList",
                        "value": "",
                        "children": [
                            {
                                "name": "epc",
                                "value": "urn:epc:id:sgtin:4012345.011111.5432",
                                "children": []
                            },
                            {
                                "name": "epc",
                                "value": "urn:epc:id:sgtin:4012345.011111.9876",
                                "children": []
                            }
                        ]
                    },
                    {
                        "name": "action",
                        "value": "OBSERVE",
                        "children": []
                    }
                ]
            },
            {
                "name": "ObjectEvent",
                "value": "",
                "children": [
                    {
                        "name": "eventTimeZoneOffset",
                        "value": "+01:00",
                        "children": []
                    },
                    {
                        "name": "eventTime",
                        "value": "2020-04-02T15:00:00.000+01:00",
                        "children": []
                    },
                    
                    {
                        "name": "epcList",
                        "value": "",
                        "children": [
                            {
                                "name": "epc",
                                "value": "urn:epc:id:sgtin:4012345.011111.5432",
                                "children": []
                            },
                            {
                                "name": "epc",
                                "value": "urn:epc:id:sgtin:4012345.011111.9876",
                                "children": []
                            }
                        ]
                    },
                    {
                        "name": "action",
                        "value": "OBSERVE",
                        "children": []
                    }
                ]
            }
        ]
    }

    const hashval = epcis_hashes_from_events(events);
    console.log(hashval)

}

main();