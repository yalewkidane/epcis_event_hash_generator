/*
GS1 Digital Link Normaliser.

This script accepts any valid URI scheme accommodating a GS1 ID,
i.e. EPC URIs, EPC Class URIs, EPC ID Pattern URIs, or GS1 Digital Link URIs.
It converts all of them into one normalised form, meaning that it
(a) converts it into a canonical GS1 DL URI,
(b) ensures that it only contains the most fine-granular ID level,
(c) strips off any further attributes.

.. module:: dl_normaliser
   :synopsis: Normalises the gs1 id formats to digital link for https://github.com/RalphTro/epcis-event-hash-generator/

.. moduleauthor:: Ralph Troeger <ralph.troeger@gs1.de>

Copyright 2019-2023 Ralph Troeger

This program is free software: you can redistribute it and/or modify
it under the terms given in the LICENSE file.

This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the LICENSE
file for details.

*/


function  __web_uri_percent_encoder(input) {
    /*Function percent-encodes URL-unsafe characters in GS1 Digital Link URIs.
 
     Table 7-1 in the GS1 Digital Link Standard requires
     the following symbols to be percent-encoded:
     '!', space, '#', '%', '&', '(', ')', '*', '+', ',', '/', ':'
     EPC URIs already prohibit some of them (e.g. '#')
     Function 'webURIPercentEncoder' is called to ensure that
     data elements accommodating these symbols are percent-encoded.
 
     Parameters
     ----------
     input : str
         Character requiring percent-encoding.
 
     Returns
     -------
     str
         Percent-encoded equivalent of character.
    */

    return input.replace('!', '%21')
        .replace('(', '%28')
        .replace(')', '%29')
        .replace('*', '%2A')
        .replace('+', '%2B')
        .replace(',', '%2C')
        .replace(':', '%3A');
}


function check_digit(key_wo_checkdigit) {
    /*Returns check digit for GTIN-8, GTIN-12, GTIN-13, GLN, GTIN-14, SSCC, GSIN, GSRN, GSRN-P.
    For further details, see GS1 GenSpecs, section 7.9.1: Standard check digit calculations for GS1 data structures.

    Parameters
    ----------
    key_wo_checkdigit : str
        GS1 key without check digit.

    Returns
    -------
        str: Check digit for GS1 key.
    */

    // Reverse string
    key_wo_checkdigit = key_wo_checkdigit.split("").reverse().join("");
    // Alternatively fetch digits, multiply them by 3 or 1, and sum them up
    let summation = 0;
    for (let i = key_wo_checkdigit.length - 1; i >= 0; i--) {
        if (parseInt(key_wo_checkdigit[i]) === 0) {
            continue;
        } else if (i % 2 !== 0) {
            summation += parseInt(key_wo_checkdigit[i]) * 1;
        } else {
            summation += parseInt(key_wo_checkdigit[i]) * 3;
        }
    }
    // Subtract sum from nearest equal or higher multiple of ten
    const checkdigit = Math.ceil(summation / 10) * 10 - summation;
    return checkdigit;
}


exports.normaliser=(uri) =>{
    /*
    Function converts any standard URI conveying a GS1 Key in Canonical GS1 DL URI.

    Function 'normaliser' expects any URI to be used in EPCIS events
    that convey a GS1 key, i.e. EPC URIs, EPC Class URIs,
    EPC ID Pattern URIs, or GS1 Digital Link URIs.
    It returns a corresponding, constrained version of a
    canonical GS1 Digital Link URI, i.e. with
    the lowest level of identification and without CPV/query string.

    Parameters
    ----------
    uri : str
        Valid EPC URI, EPC Pattern URI, EPC Class URI, GS1 Digital Link URI.

    Returns
    -------
    str
        Constrained, canonicalised GS1 Digital Link URI equivalent.
    None
    */
    if (typeof uri !== 'string') {
        console.warn('dl normaliser called with non-string argument');
        return null;
    }

    try {
        var partition = uri.indexOf('.');
    } catch (e) {
        console.debug(`No '.' in ${uri}. Not a normalisable uri.`);
        return null;
    }

    // # EPC URIs
    if (/^urn:epc:id:sgtin:((\d{6}\.\d{7})|(\d{7}\.\d{6})|(\d{8}\.\d{5})|(\d{9}\.\d{4})|(\d{10}\.\d{3})|(\d{11}\.\d{2})|(\d{12}\.\d{1}))\.(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,20}$/.test(uri)) {
        var gs1companyprefix = uri.slice(17, partition);
        var itemref = uri.slice(partition + 1, partition + 1 + (13 - gs1companyprefix.length));
        var raw_gtin = itemref.slice(0, 1) + gs1companyprefix + itemref.slice(1);
        var serial = uri.slice(32);
        return 'https://id.gs1.org/01/' + raw_gtin + check_digit(raw_gtin) + '/21/' + __web_uri_percent_encoder(serial);
    }

    if (/^urn:epc:id:sscc:((\d{6}\.\d{11}$)|(\d{7}\.\d{10}$)|(\d{8}\.\d{9}$)|(\d{9}\.\d{8}$)|(\d{10}\.\d{7}$)|(\d{11}\.\d{6}$)|(\d{12}\.\d{5}$))/.test(uri)) {
        var gs1companyprefix = uri.slice(16, partition);
        var serialref = uri.slice(partition + 2);
        var rawSSCC = uri.slice(partition + 1, partition + 2) + gs1companyprefix + serialref;
        return 'https://id.gs1.org/00/' + rawSSCC + check_digit(rawSSCC);
    }

    if (/^urn:epc:id:sgln:((\d{6}\.\d{6})|(\d{7}\.\d{5})|(\d{8}\.\d{4})|(\d{9}\.\d{3})|(\d{10}\.\d{2})|(\d{11}\.\d{1})|(\d{12}\.))\.(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,20}$/.test(uri)) {
        var gs1companyprefix = uri.slice(16, partition);
        const locationref = uri.slice(partition + 1, partition + 1 + (12 - gs1companyprefix.length));
        const rawGLN = gs1companyprefix + locationref;
        const extension = uri.slice(30);

        if (extension === '0') {
            return 'https://id.gs1.org/414/' + rawGLN + check_digit(rawGLN);
        } else {
            return 'https://id.gs1.org/414/' + rawGLN + check_digit(rawGLN) + '/254/' + __web_uri_percent_encoder(extension);
        }
    }

    if (/^urn:epc:id:grai:(([\d]{6}\.[\d]{6})|([\d]{7}\.[\d]{5})|([\d]{8}\.[\d]{4})|([\d]{9}\.[\d]{3})|([\d]{10}\.[\d]{2})|([\d]{11}\.[\d]{1})|([\d]{12}\.\.))\.(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,16}$/.test(uri)) {
        const gs1companyprefix = uri.slice(16, partition);
        const assetref = uri.slice(partition + 1, partition + 1 + (12 - gs1companyprefix.length));
        const raw_grai = '0' + gs1companyprefix + assetref;
        const serial = uri.slice(30);

        return 'https://id.gs1.org/8003/' + raw_grai + check_digit(raw_grai) + __web_uri_percent_encoder(serial);
    }

    if (/^urn:epc:id:giai:(([\d]{6}\.(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,24})|([\d]{7}\.(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,23})|([\d]{8}\.(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,22})|([\d]{9}\.(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,21})|([\d]{10}\.(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,20})|([\d]{11}\.(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,19})|([\d]{12}\.(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,18}))$/.test(uri)) {
        const gs1companyprefix = uri.slice(16, partition);
        const assetref = uri.slice(partition + 1);
        const encodedAssetRef = __web_uri_percent_encoder(assetref);

        return 'https://id.gs1.org/8004/' + gs1companyprefix + encodedAssetRef;
    }

    

    if (/^urn:epc:id:gsrn:(([\d]{6}\.[\d]{11}$)|([\d]{7}\.[\d]{10}$)|([\d]{8}\.[\d]{9}$)|([\d]{9}\.[\d]{8}$)|([\d]{10}\.[\d]{7}$)|([\d]{11}\.[\d]{6}$)|([\d]{12}\.[\d]{5}$))$/.test(uri)) {
        const gs1companyprefix = uri.slice(16, partition);
        const serviceref = uri.slice(partition + 1);
        const rawGSRN = gs1companyprefix + serviceref;

        return 'https://id.gs1.org/8018/' + rawGSRN + check_digit(rawGSRN);
    }


    if (/^urn:epc:id:gsrnp:(([\d]{6}\.[\d]{11}$)|([\d]{7}\.[\d]{10}$)|([\d]{8}\.[\d]{9}$)|([\d]{9}\.[\d]{8}$)|([\d]{10}\.[\d]{7}$)|([\d]{11}\.[\d]{6}$)|([\d]{12}\.[\d]{5}$))/.test(uri)) {
        gs1companyprefix = uri.slice(17,partition)
        serviceref = uri.slice((partition + 1))
        rawGSRNP = gs1companyprefix + serviceref
        return ('https://id.gs1.org/8017/' + rawGSRNP + check_digit(rawGSRNP))
    }


    if (/^urn:epc:id:gdti:(([\d]{6}\.[\d]{6})|([\d]{7}\.[\d]{5})|([\d]{8}\.[\d]{4})|([\d]{9}\.[\d]{3})|([\d]{10}\.[\d]{2})|([\d]{11}\.[\d]{1})|([\d]{12}\.\.))(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,20}$/.test(uri)) {
        gs1companyprefix = uri.slice(16,partition)
        documenttype = uri.slice((partition + 1),(partition + 1 +(12 - gs1companyprefix.length)))
        raw_gdti = gs1companyprefix + documenttype
        serial = uri.slice(30)
        return 'https://id.gs1.org/253/' + raw_gdti + check_digit(raw_gdti) + __web_uri_percent_encoder(serial)
    }



    if (/^urn:epc:id:cpi:((\d{6}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,24})|(\d{7}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,23})|(\d{8}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,22})|(\d{9}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,21})|(\d{10}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,20})|(\d{11}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,19})|(\d{12}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,18}))\.[\d]{1,12}$/.test(uri)) {
        gs1companyprefix = uri.slice(15,partition)
        separator = uri.rfind('.')
        cpref = uri.slice((partition + 1),separator)
        raw_cpi = gs1companyprefix + cpref
        serial = uri.slice((separator + 1))
        return 'https://id.gs1.org/8010/' + __web_uri_percent_encoder(raw_cpi) + '/8011/' + serial
    }



    if (/^urn:epc:id:sgcn:(([\d]{6}\.[\d]{6})|([\d]{7}\.[\d]{5})|([\d]{8}\.[\d]{4})|([\d]{9}\.[\d]{3})|([\d]{10}\.[\d]{2})|([\d]{11}\.[\d]{1})|([\d]{12}\.))\.[\d]{1,12}$/.test(uri)) {
        gs1companyprefix = uri.slice(16,partition)
        couponref = uri.slice((partition + 1), (partition + 1 + (12 - gs1companyprefix.length)))
        raw_sgcn = gs1companyprefix + couponref
        serial = uri.slice(30)
        return 'https://id.gs1.org/255/' + raw_sgcn + check_digit(raw_sgcn) + serial
    }




    //if (/^urn:epc:id:ginc:([\d]{6}.(%2[125-9A-Fa-f]|%3[0-9A-Fa-f]|%4[1-9A-Fa-f]|%5[0-9AaFf]|%6[1-9A-Fa-f]|%7[0-9Aa]|[!')(+,.0-9:;=A-Za-z_-]){1,24}|[\d]{7}.(%2[125-9A-Fa-f]|%3[0-9A-Fa-f]|%4[1-9A-Fa-f]|%5[0-9AaFf]|%6[1-9A-Fa-f]|%7[0-9Aa]|[!')(+,.0-9:;=A-Za-z_-]){1,23}|[\d]{8}.(%2[125-9A-Fa-f]|%3[0-9A-Fa-f]|%4[1-9A-Fa-f]|%5[0-9AaFf]|%6[1-9A-Fa-f]|%7[0-9Aa]|[!')(+,.0-9:;=A-Za-z_-]){1,22}|[\d]{9}.(%2[125-9A-Fa-f]|%3[0-9A-Fa-f]|%4[1-9A-Fa-f]|%5[0-9AaFf]|%6[1-9A-Fa-f]|%7[0-9Aa]|[!')(+,.0-9:;=A-Za-z_-]){1,21}|[\d]{10}.(%2[125-9A-Fa-f]|%3[0-9A-Fa-f]|%4[1-9A-Fa-f]|%5[0-9AaFf]|%6[1-9A-Fa-f]|%7[0-9Aa]|[!')(+,.0-9:;=A-Za-z_-]){1,20}|[\d]{11}.(%2[125-9A-Fa-f]|%3[0-9A-Fa-f]|%4[1-9A-Fa-f]|%5[0-9AaFf]|%6[1-9A-Fa-f]|%7[0-9Aa]|[!')(+,.0-9:;=A-Za-z_-]){1,19}|[\d]{12}.(%2[125-9A-Fa-f]|%3[0-9A-Fa-f]|%4[1-9A-Fa-f]|%5[0-9AaFf]|%6[1-9A-Fa-f]|%7[0-9Aa]|[!')(*+,.0-9:;=A-Za-z_-]){1,18})$)/.test(uri)) {
    //    gs1companyprefix = uri.slice(16,partition)
    //    consignmentref = uri.slice((partition + 1))
    //    return 'https://id.gs1.org/401/' + gs1companyprefix + __web_uri_percent_encoder(consignmentref)
   // }



    if (/^urn:epc:id:gsin:(([\d]{6}\.[\d]{10}$)|([\d]{7}\.[\d]{9}$)|([\d]{8}\.[\d]{8}$)|([\d]{9}\.[\d]{7}$)|([\d]{10}\.[\d]{6}$)|([\d]{11}\.[\d]{5}$)|([\d]{12}\.[\d]{4}$))/.test(uri)) {
        gs1companyprefix = uri.slice(16,partition)
        shipperref = uri.slice((partition + 1))
        rawGSIN = gs1companyprefix + shipperref
        return 'https://id.gs1.org/402/' + rawGSIN + check_digit(rawGSIN)
    }

    if (/^urn:epc:id:itip:(([\d]{6}\.[\d]{7})|([\d]{7}\.[\d]{6})|([\d]{8}\.[\d]{5})|([\d]{9}\.[\d]{4})|([\d]{10}\.[\d]{3})|([\d]{11}\.[\d]{2})|([\d]{12}\.[\d]{1}))\.[\d]{2}\.[\d]{2}\.(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,20}$/.test(uri)) {
        gs1companyprefix = uri.slice(16,partition)
        itemref = uri.slice((partition + 1), (partition + 1 + (13 - gs1companyprefix.length)))
        raw_gtin = itemref.slice(0, 1)+ gs1companyprefix + itemref.slice(1)
        piece = uri.slice(31, 33)
        total = uri.slice(34, 36)
        serial = uri.slice(37)
        return 'https://id.gs1.org/8006/' + raw_gtin + check_digit(raw_gtin) + piece + total + '/21/' + __web_uri_percent_encoder(serial)
    }



    if (/^urn:epc:id:upui:((\d{6}\.\d{7})|(\d{7}\.\d{6})|(\d{8}\.\d{5})|(\d{9}\.\d{4})|(\d{10}\.\d{3})|(\d{11}\.\d{2})|(\d{12}\.\d{1}))\.(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,28}$/.test(uri)) {
        gs1companyprefix = uri.slice(16,partition)
        itemref = uri.slice((partition + 1), (partition + 1 + (13 - gs1companyprefix.length)))
        raw_gtin = itemref.slice(0, 1)+ gs1companyprefix + itemref.slice(1)
        serial = uri.slice(31)
        return 'https://id.gs1.org/01/' + raw_gtin + check_digit(raw_gtin) + '/235/' + __web_uri_percent_encoder(serial)
    }


    if (/^urn:epc:id:pgln:(([\d]{6}\.[\d]{6})|([\d]{7}\.[\d]{5})|([\d]{8}\.[\d]{4})|([\d]{9}\.[\d]{3})|([\d]{10}\.[\d]{2})|([\d]{11}\.[\d]{1})|([\d]{12}\.))$/.test(uri)) {
        gs1companyprefix = uri.slice(16,partition)
        partyref = uri.slice((partition + 1), (partition + 1 + (12 - gs1companyprefix.length)))
        rawGLN = gs1companyprefix + partyref
        return 'https://id.gs1.org/417/' + rawGLN + check_digit(rawGLN)
    }



    if (/^urn:epc:class:lgtin:(([\d]{6}\.[\d]{7})|([\d]{7}\.[\d]{6})|([\d]{8}\.[\d]{5})|([\d]{9}\.[\d]{4})|([\d]{10}\.[\d]{3})|([\d]{11}\.[\d]{2})|([\d]{12}\.[\d]{1}))\.(\%2[125-9A-Fa-f]|\%3[0-9A-Fa-f]|\%4[1-9A-Fa-f]|\%5[0-9AaFf]|\%6[1-9A-Fa-f]|\%7[0-9Aa]|[!\')(*+,.0-9:;=A-Za-z_-]){1,20}$/.test(uri)) {
        gs1companyprefix = uri.slice(20,partition)
        itemref = uri.slice((partition + 1), (partition + 1 + (13 - gs1companyprefix.length)))
        raw_gtin = itemref.slice(0, 1)+ gs1companyprefix + itemref.slice(1)
        lot = uri.slice(35)
        return 'https://id.gs1.org/01/' + raw_gtin + check_digit(raw_gtin) + '/10/' + __web_uri_percent_encoder(lot)

    }

    //# EPC ID Pattern URIs
    if (/^urn:epc:idpat:sgtin:((\d{6}\.\d{7})|(\d{7}\.\d{6})|(\d{8}\.\d{5})|(\d{9}\.\d{4})|(\d{10}\.\d{3})|(\d{11}\.\d{2})|(\d{12}\.\d{1}))\.\*$/.test(uri)) {
        gs1companyprefix = uri.slice(20,partition)
        itemref = uri.slice((partition + 1), (partition + 1 + (13 - gs1companyprefix.length)))
        raw_gtin = itemref.slice(0, 1)+ gs1companyprefix + itemref.slice(1)
        return 'https://id.gs1.org/01/' + raw_gtin + check_digit(raw_gtin)
    }



    if (/^urn:epc:idpat:grai:(([\d]{6}\.[\d]{6})|([\d]{7}\.[\d]{5})|([\d]{8}\.[\d]{4})|([\d]{9}\.[\d]{3})|([\d]{10}\.[\d]{2})|([\d]{11}\.[\d]{1})|([\d]{12}\.\.))\.\*$/.test(uri)) {
        gs1companyprefix = uri.slice(19,partition)
        assetref = uri.slice((partition + 1), (partition + 1 + (12 - len(gs1companyprefix))))
        raw_grai = '0' + gs1companyprefix + assetref
        return 'https://id.gs1.org/8003/' + raw_grai + check_digit(raw_grai)
    }


    if (/^urn:epc:idpat:gdti:(([\d]{6}\.[\d]{6})|([\d]{7}\.[\d]{5})|([\d]{8}\.[\d]{4})|([\d]{9}\.[\d]{3})|([\d]{10}\.[\d]{2})|([\d]{11}\.[\d]{1})|([\d]{12}\.\.))\.\*$/.test(uri)) {
        gs1companyprefix = uri.slice(19,partition)
        documenttype = uri.slice((partition + 1), (partition + 1 +
            (12 - len(gs1companyprefix))))
        raw_gdti = gs1companyprefix + documenttype
        return 'https://id.gs1.org/253/' + raw_gdti + check_digit(raw_gdti)
    }

    if (/^urn:epc:idpat:sgcn:(([\d]{6}\.[\d]{6})|([\d]{7}\.[\d]{5})|([\d]{8}\.[\d]{4})|([\d]{9}\.[\d]{3})|([\d]{10}\.[\d]{2})|([\d]{11}\.[\d]{1})|([\d]{12}\.\.))\.\*$/.test(uri)) {
        gs1companyprefix = uri.slice(19,partition)
        couponref = uri.slice((partition + 1), (partition + 1 + (12 - gs1companyprefix.length)))
        raw_sgcn = gs1companyprefix + couponref
        return 'https://id.gs1.org/255/' + raw_sgcn + check_digit(raw_sgcn)
    }


    if (/^urn:epc:idpat:cpi:((\d{6}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,24})|(\d{7}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,23})|(\d{8}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,22})|(\d{9}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,21})|(\d{10}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,20})|(\d{11}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,19})|(\d{12}\.(\%2[3dfDF]|\%3[0-9]|\%4[1-9A-Fa-f]|\%5[0-9Aa]|[0-9A-Z-]){1,18}))\.\*$/.test(uri)) {
        gs1companyprefix = uri.slice(18,partition)
        separator = uri.rfind('.')
        cpref = uri.slice((partition + 1), (separator))
        raw_cpi = gs1companyprefix + cpref
        return 'https://id.gs1.org/8010/' + __web_uri_percent_encoder(raw_cpi)
    }


    if (/^urn:epc:idpat:itip:(([\d]{6}\.[\d]{7})|([\d]{7}\.[\d]{6})|([\d]{8}\.[\d]{5})|([\d]{9}\.[\d]{4})|([\d]{10}\.[\d]{3})|([\d]{11}\.[\d]{2})|([\d]{12}\.[\d]{1}))\.[\d]{2}\.[\d]{2}\.\*$/.test(uri)) {
        gs1companyprefix = uri.slice(19,partition)
        itemref = uri.slice((partition + 1), (partition + 1 + (13 - gs1companyprefix.length)))
        raw_gtin = itemref.slice(0, 1)+ gs1companyprefix + itemref.slice(1)
        piece = uri.slice(34, 36)
        total = uri.slice(37, 39)
        return 'https://id.gs1.org/8006/' + raw_gtin + check_digit(raw_gtin) + piece + total
    }


    if (/^urn:epc:idpat:upui:((\d{6}\.\d{7})|(\d{7}\.\d{6})|(\d{8}\.\d{5})|(\d{9}\.\d{4})|(\d{10}\.\d{3})|(\d{11}\.\d{2})|(\d{12}\.\d{1}))\.\*$/.test(uri)) {
        gs1companyprefix = uri.slice(19,partition)
        itemref = uri.slice((partition + 1), (partition + 1 + (13 - gs1companyprefix.length)))
        raw_gtin = itemref.slice(0, 1)+ gs1companyprefix + itemref.slice(1)
        return 'https://id.gs1.org/01/' + raw_gtin + check_digit(raw_gtin)
    }

    //# GS1 DL URIs
    //if (/^https?:\/\/((([^\/?#]*)@)?([^\/?#:]*)(:([^\/?#]*))?))?((([^?#]*)(\/(01|gtin|8006|itip|8010|cpid|414|gln|417|party|8017|gsrnp|8018|gsrn|255|gcn|00|sscc|253|gdti|401|ginc|402|gsin|8003|grai|8004|giai)\/)(\d{4}[^\/]+)(\/[^/]+\/[^/]+)?[/]?(\?([^?\n]*))?(#([^\n]*))?)|(\/[A-Za-z_-]{10}$/.test(uri)) {
    //    return None
    //}

    

    //# remove query string
    if (uri.includes('?')) {
        uri = uri.slice(0, uri.indexOf('?'));
    }

    //# replace short names for keys/key extensions with AIs
    uri = (uri.replace('/gtin/', '/01/')
        .replace('/itip/', '/8006/')
        .replace('/cpid/', '/8010/')
        .replace('/gln/', '/414/')
        .replace('/party/', '/417/')
        .replace('/gsrnp/', '/8017/')
        .replace('/gsrn/', '/8018/')
        .replace('/gcn/', '/255/')
        .replace('/sscc/', '/00/')
        .replace('/gdti/', '/253/')
        .replace('/ginc/', '/401/')
        .replace('/gsin/', '/402/')
        .replace('/grai/', '/8003/')
        .replace('/giai/', '/8004/')
        .replace('/cpv/', '/22/')
        .replace('/lot/', '/10/')
        .replace('/ser/', '/21/'))

    //# prefix with canonical domain name
    if (/^https:\/\/id.gs1.org\/(01|8006|8010|414|417|8017|8018|255|00|253|401|402|8003|8004)\/(\d{4}[^\/]+)(\/[^\/]+\/[^\/]+)?[\/]?(\?([^?\n]*))?(#([^\n]*))?|(\/[A-Za-z_-]{10}$)/.test(uri)) {
        if (uri.includes('/00/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/00/'));
        } else if (uri.includes('/01/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/01/'));
        } else if (uri.includes('/253/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/253/'));
        } else if (uri.includes('/255/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/255/'));
        } else if (uri.includes('/401/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/401/'));
        } else if (uri.includes('/402/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/402/'));
        } else if (uri.includes('/414/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/414/'));
        } else if (uri.includes('/417/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/417/'));
        } else if (uri.includes('/8003/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/8003/'));
        } else if (uri.includes('/8004/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/8004/'));
        } else if (uri.includes('/8006/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/8006/'));
        } else if (uri.includes('/8010/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/8010/'));
        } else if (uri.includes('/8017/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/8017/'));
        } else if (uri.includes('/8018/')) {
            uri = 'https://id.gs1.org' + uri.substring(uri.indexOf('/8018/'));
        }
    }

    // # ensure that all GTIN formats are padded to 14 digits
    if (/^https:\/\/id.gs1.org\/01\/\d{14}/.test(uri)) {
        if (/^https:\/\/id.gs1.org\/01\/\d{13}/.test(uri)) {
            uri = uri.replace('/01/', '/01/0')
        } else if (/^https:\/\/id.gs1.org\/01\/\d{12}/.test(uri)) {
            uri = uri.replace('/01/', '/01/00')
        } else if (/^https:\/\/id.gs1.org\/01\/\d{8}/.test(uri)) {
            uri = uri.replace('/01/', '/01/000000')
        }
    }

    //# remove cpv
    const x = uri.slice(uri.indexOf('/22/') + 4);
    
    if ((/^https:\/\/id.gs1.org\/8006\/\d{18}\/22\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,20})$/.test(uri))
        || (/^https:\/\/id.gs1.org\/01\/\d{14}\/22\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,20})$/.test(uri))) {
        uri = uri.slice(0, uri.find("/22/")) + x.slice(x.find("/"), -1);
    }

    //# for 01/8006 followed by other key qualifiers:
    if ((/^https:\/\/id.gs1.org\/8006\/\d{18}\/22\/([\x2F\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,20})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/01\/\d{14}\/22\/([\x2F\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,20})$/.test(uri))) {
        uri = uri.slice(0, uri.find("/22/")) + x.slice(x.find("/"));
    }

    //# take only lowest ID granularity level (i.e. if serial is present, omit lot)
    if ((/^https:\/\/id.gs1.org\/8006\/\d{18}\/10\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,20})\/21\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,20})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/01\/(\d{14})\/10\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,20})\/21\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,20})$/.test(uri))) {
        y = uri.slice(uri.find("/10/") + 4);
        uri = uri.slice(0, uri.find("/10/")) + y.slice(y.find("/"));
    }

    //# ensure that output has a valid syntax
    if ((/^https:\/\/id.gs1.org\/00\/(\d{18})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/01\/(\d{14})\/21\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,20})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/01\/(\d{14})\/10\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,20})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/01\/(\d{14})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/01\/(\d{14})\/235\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,28})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/253\/(\d{13})([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,17})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/255\/(\d{13})(\d{0,12})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/401\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,30})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/402\/(\d{17})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/414\/(\d{13})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/414\/(\d{13})\/254\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,20})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/417\/(\d{13})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/8003\/(\d{14})([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,16})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/8004\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,30})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/8006\/(\d{18})\/21\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,20})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/8006\/(\d{18})\/10\/([\x22\x27\x2D\x2E\x30-\x39\x3B-\x3F\x41-\x5A\x5F\x61-\x7A]{0,20})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/8006\/(\d{18})$/.test(uri)) ||
        (/^https:\/\/id\.gs1\.org\/8010\/([\x23\x2D\x2F\x30-\x39\x41-\x5A]{0,30})\/8011\/(\d{0,12})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/8010\/([\x23\x2D\x2F\x30-\x39\x41-\x5A]{0,30})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/8017\/(\d{18})$/.test(uri)) ||
        (/^https:\/\/id.gs1.org\/8018\/(\d{18})$/.test(uri))) {
        return uri
    }



    return null;
}