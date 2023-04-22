/*
Correct the missmatch of EPCIS 2.0 XML and JSON data models, taking a JSON and producing the XML model.
For example
{
  "type": "ObjectEvent",
  "eventTime": "2019-04-02T15:00:00.000+01:00",
  "eventTimeZoneOffset": "+01:00",
  "epcList": [
    "urn:epc:id:sgtin:4012345.011111.9876",
"urn:epc:id:sgtin:4012345.011111.5432"
  ],
  "action": "OBSERVE",
}
is converted to
("ObjectEvent","",[
  ("eventTime","2019-04-02T15:00:00.000+01:00", []),
  ("eventTimeZoneOffset","+01:00", []),
  ("epcList", "", [
    ("epc", "urn:epc:id:sgtin:4012345.011111.5432", []),
    ("epc", "urn:epc:id:sgtin:4012345.011111.9876", [])
  ],
  ("action", "OBSERVE", [])
])
.. module:: json_xml_model_mismatch_correction
.. moduleauthor:: Sebastian Schmittner <schmittner@eecc.info>
Copyright 2020 Ralph Troeger, Sebastian Schmittner
This program is free software: you can redistribute it and/or modify
it under the terms given in the LICENSE file.
This program is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the LICENSE
file for details.

*/

