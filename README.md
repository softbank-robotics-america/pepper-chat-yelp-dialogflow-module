# pepper-chat-yelp-dialogflow-module

This module provides functionality to explore Yelp conversationally through a Pepper running the SBRA Pepper Chat solution, using a Dialogflow V2 chatbot. It must be used in conjunction with the [Pepper Chat Dialogflow Fulfillment Library](https://github.com/softbank-robotics-america/pepper-chat-dialogflow-fulfillment-library).

## Usage
### Step 1 - Copy intents into your Agent
Download the zip of the agent in this module called Agent.Yelp-Module. Copy the 5 intents (and associated entities) into your agent.

### Step 2 - Declare all dependencies in your Webhook's manifest
Include the module in your Node.JS webhook (fulfillment) naming the following dependencies statement in your package.json file. In addition to the Pepper Chat Yelp module, you will also need to include the Pepper Chat Dialogflow Fulfillment Library:

```     
"pepper-chat-yelp": "softbank-robotics-america/pepper-chat-yelp-dialogflow-module#dialogflow-v2",
"pepper-chat-dialogflow": "softbank-robotics-america/pepper-chat-dialogflow-fulfillment-library#dialogflow-v2"
```

### Step 3 - Initialize the modules in your Webhook
Initialize the module in your index.js file as follows:

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

### Step 4 - Setup your action handler in your Webhook

Actually using the library in your index.js file to handle requests is as easy as:
```
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
 let agent = new WebhookClient({request: request, response: response});
 let action = agent.action; // https://dialogflow.com/docs/actions-and-parameters
 // Specify the above handlers in an action handler object
 const actionHandlers = {
      'yelp.search': localBusinessHandler,
      'yelp.search.business_selected.map_selected': localBusinessHandler,
      'yelp.search.business_selected.more_info': localBusinessHandler,
      'yelp.search.business_selected': localBusinessHandler
  };   
  actionHandlers[action]();
  
  /****************************************************
  * YELP MODULE:                                      *
  ****************************************************/
  function localBusinessHandler() {
      pepper_chat_yelp.localBusinessHandler(request, response, agent);
  }
}
  ```
### Step 5 - Customize the module for a given robot from within the Pepper Chat CMS
Provide the latitude and longitude to the module through the Pepper Chat CMS via parameters
```
LATITUDE: ##.#####,
LONGITUDE: ###.#####

E.g. LATITUDE: 37.7749,
LONGITUDE: -122.4194

NOTE: North & East values are represented as positive numbers, while South & West values 
are represented as negative numbers
```
