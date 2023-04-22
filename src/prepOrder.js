

JOIN_BY = ""
/*"""
Join the substrings to the pre hash string using this deliminator.
By the specification in https://github.com/RalphTro/epcis-event-hash-generator this is to be the empty string,
but using e.g. newline might be helpful for debugging.
When using the command line utility, this can be changed via the -j flag.
"""*/

exports.PROP_ORDER =[    ['eventTime', null],
['eventTimeZoneOffset', null],
['certificationInfo', null],
['parentID', null],
['epcList', [{ 'epc': null }]],
['inputEPCList', [{ 'epc': null }]],
['childEPCs', [{ 'epc': null }]],
['quantityList', [{        'quantityElement': [            ['epcClass', null],
        ['quantity', null],
        ['uom', null]
    ]
}]],
['childQuantityList', [{        'quantityElement': [            ['epcClass', null],
        ['quantity', null],
        ['uom', null]
    ]
}]],
['inputQuantityList', [{        'quantityElement': [            ['epcClass', null],
        ['quantity', null],
        ['uom', null]
    ]
}]],
['outputEPCList', [{ 'epc': null }]],
['outputQuantityList', [{        'quantityElement': [            ['epcClass', null],
        ['quantity', null],
        ['uom', null]
    ]
}]],
['action', null],
['transformationID', null],
['bizStep', null],
['disposition', null],
['persistentDisposition', [        ['set', null],
    ['unset', null]
]],
['readPoint', [{ 'id': null }]],
['bizLocation', [{ 'id': null }]],
['bizTransactionList', [[        ['type', null],
    ['bizTransaction', null]
]]],
['sourceList', [[        ['type', null],
    ['source', null]
]]],
['destinationList', [[        ['type', null],
    ['destination', null]
]]],
['sensorElementList', [{        'sensorElement': [{            'sensorMetadata': [                ['time', null],
            ['startTime', null],
            ['endTime', null],
            ['deviceID', null],
            ['deviceMetadata', null],
            ['rawData', null],
            ['dataProcessingMethod', null],
            ['bizRules', null]
        ]
    }, {
        'sensorReport': [                ['type', null],
            ['exception', null],
            ['deviceID', null],
            ['deviceMetadata', null],
            ['rawData', null],
            ['dataProcessingMethod', null],
            ['time', null],
            ['microorganism', null],
            ['chemicalSubstance', null],
            ['value', null],
            ['component', null],
            ['stringValue', null],
            ['booleanValue', null],
            ['hexBinaryValue', null],
            ['uriValue', null],
            ['minValue', null],
            ['maxValue', null],
            ['meanValue', null],
            ['sDev', null],
            ['percRank', null],
            ['percValue', null],
            ['uom', null],
            ['coordinateReferenceSystem', null]
        ]
    }]
}]]
]
/*The property order data structure describes the ordering in which
to concatenate the contents of an EPCIS event. It is a list
of pairs. The first part of each pair is a string, naming the xml
element. If the element might have children whose order needs to be
defined, the second element is a property order for the children,
otherwise the second element is None.
*/




//jsonld.set_document_loader(file_document_loader.file_document_loader())