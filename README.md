# pepper-chat-yelp-dialogflow-module

This module provides functionality to explore Yelp conversationally through a Pepper running the SBRA Pepper Chat solution, using a Dialogflow V2 chatbot. It must be used in conjunction with the [Pepper Chat Dialogflow Fulfillment Library](https://github.com/softbank-robotics-america/pepper-chat-dialogflow-fulfillment-library).

## Usage
### Step 1 - Copy intents into your Agent
Download the zip of the agent in this module called SBRA.Yelp-Module. Copy the 5 intents (and associated entities) into your agent.

### Step 2 - Declare all dependencies into your Webhook
Include the module in your Node.JS webhook (fulfillment) using the following includes statement in your package.json file. You will also need to include the Yelp Fusion package, the Node Geocoder package, and the Pepper Chat Dialogflow Fulfillment Library:

```     
"pepper-chat-yelp": "softbank-robotics-america/pepper-chat-yelp-dialogflow-module#dialogflow-v2",
"pepper-chat-dialogflow": "softbank-robotics-america/pepper-chat-dialogflow-fulfillment-library#dialogflow-v2",
"node-geocoder": "^3.23.0",
"yelp-fusion": "^3.0.0"
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

Actually using the library in action is as easy as:
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
