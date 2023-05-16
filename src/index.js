// Import the Express framework
const express = require('express');

const jsonToNode=require("./jsonToNode")
const hash_generator=require("./mod_hashGenerator")
// Create an instance of the Express app
const express_app = express();
const PORT=7085;
express_app.use(express.json());
// Define a route for the root URL
express_app.post('/epcis/hash/events', (req, res) => {
  let eventList= jsonToNode.event_list_from_epcis_document_json(req.body);
  hashes = hash_generator.epcis_hashes_from_events(eventList, req.headers.hashalg)
  res.status(200).send(hashes);
});

express_app.get('/', (req, res) => {
  //console.log(req.body)
  res.status(200).send('EPCIS Hash Generator Micro Server. Send events to "/epcis/hash/events" to generate epcis event');
});
// Start the server and listen on port 3000
express_app.listen(PORT, () => {
  console.log('EPCIS Hash Generator Micro Server started on port : ', PORT);
});