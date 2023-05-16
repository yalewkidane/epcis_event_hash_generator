

# EPCIS Event Hash Generator

This repository contains a Node.js implementation of an EPCIS event hash generator. It is based on the Python implementation available at [https://github.com/RalphTro/epcis-event-hash-generator](https://github.com/RalphTro/epcis-event-hash-generator).

## Overview
The EPCIS Event Hash Generator is a tool that enables the creation of hash values for EPCIS events using Node.js. These hash values are useful for ensuring data integrity and verifying the authenticity of EPCIS events.

## Features
- Generates hash values for EPCIS events
- Implemented in Node.js for ease of use
- Based on the Python implementation by RalphTro
- Designed to cover a wide range of scenarios
- Open to contributions and improvements

## Installation
To use the EPCIS Event Hash Generator, follow these steps:
1. Clone this repository to your local machine.
2. Make sure you have Node.js installed. If not, you can download it from [https://nodejs.org](https://nodejs.org).
3. Open a terminal or command prompt and navigate to the cloned repository's directory.
4. Go to the src folder using `cd src` 
5. Run the command `npm install` to install the required dependencies.
6. Run the command `npm start` to srart hash generator

## Usage
To generate a hash value for an EPCIS event, follow these steps:
1. Prepare your EPCIS event in the json format. As shown bellow
![Alt text](doc/Images/request.PNG?raw=true "Title")
2. Send Post request `http://IP:7085/epcis/hash/events`
3. You will get the event has a response
![Alt text](doc/Images/response.PNG?raw=true "Title")

## JSON Example
An example JSON file is provided in the "doc/examples" directory. You can use this file as a reference to understand the required format for the EPCIS event data.

To generate the hash value for this example JSON file, follow the usage instructions mentioned above.


## Contribution
Contributions to the EPCIS Event Hash Generator are welcome. If you encounter any problems or have ideas for improvements, please feel free to open an issue or submit a pull request on GitHub.

## License
This project is licensed under the [MIT License](LICENSE). Please see the LICENSE file for more details.

## Contact
If you have any questions or need further assistance, you can reach out to the project maintainer at [yalewkidane@gmail.com](mailto:yalewkidane@gmail.com).