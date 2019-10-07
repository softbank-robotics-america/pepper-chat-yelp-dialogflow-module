# pepper-chat-yelp-module-dfv2

This module provides functionality to explore Yelp conversationally through a Pepper running the SBRA Pepper Chat solution, using a Dialogflow V2 chatbot. It must be used in conjunction with the (Pepper Chat Dialogflow Fulfillment Library)[https://github.com/softbank-robotics-america/pepper-chat-dialogflow-fulfillment-library]

## Usage

### Dependency Declaration
Include the module in your Node.JS webhook (fulfillment) using the following includes statement in your package.json file. You will also need to include the Yelp Fusion package, the Node Geocoder package, and the Pepper Chat Dialogflow Fulfillment Library:

```     
"pepper-chat-yelp": "softbank-robotics-america/pepper-chat-yelp-module#dialogflow-v2",
"pepper-chat-dialogflow": "softbank-robotics-america/pepper-chat-dialogflow-fulfillment-library#dialogflow-v2",
"node-geocoder": "^3.23.0",
"yelp-fusion": "^3.0.0"
```

### Initialization
Use the module in your index.js file as follows:

```
/**
 * PEPPER CHAT LIBRARY - initialization & configuration:
 */
const PepperChatLibrary = require('pepper-chat-dialogflow');

/**
 * YELP MODULE - initialization & configuration:
 */
const yelpApiKey = 'Insert Yelp API key here';
const googleMapsApiKey = 'Insert Google Maps API key here';
const geocoderApiKey = 'Insert Google Geocoder API key here';
const yelpModule = require('yelp-fusion'); // 
const nodeGeocoderModule = require('node-geocoder');
const yelpConfig = {yelpApiKey, googleMapsApiKey, geocoderApiKey, yelpModule, nodeGeocoderModule}; // Keys must match!
const { YelpPepperChat } = require('pepper-chat-yelp');
const pepper_chat_yelp = new YelpPepperChat(PepperChatLibrary, yelpConfig);
```

