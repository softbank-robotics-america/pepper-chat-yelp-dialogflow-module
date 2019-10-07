class YelpPepperChat {
    constructor(pepperChatResponses, config) {
        // Pepper Chat Library responses required
        if (!('CarouselImage' in pepperChatResponses)) {
            throw "Yelp Module requires Pepper Chat Library's CarouselImage"
        }
        if (!('Carousel' in pepperChatResponses)) {
            throw "Yelp Module requires Pepper Chat Library's Carousel"
        }
        if (!('FullScreenImage' in pepperChatResponses)) {
            throw "Yelp Module requires Pepper Chat Library's FullScreenImage"
        }
        if (!('BasicText' in pepperChatResponses)) {
            throw "Yelp Module requires Pepper Chat Library's BasicText"
        }
        if (!('TriggerIntent' in pepperChatResponses)) {
            throw "Yelp Module requires Pepper Chat Library's TriggerIntent"
        }
        if (!('PepperResponse' in pepperChatResponses)) {
            throw "Yelp Module requires Pepper Chat Library's PepperResponse"
        }
        if (!('randomlyChoose' in pepperChatResponses)) {
            throw "Yelp Module requires Pepper Chat Library's randomlyChoose"
        }        
        this.CarouselImage = pepperChatResponses.CarouselImage;
        this.Carousel = pepperChatResponses.Carousel;
        this.FullScreenImage = pepperChatResponses.FullScreenImage;
        this.BasicText = pepperChatResponses.BasicText;
        this.TriggerIntent = pepperChatResponses.TriggerIntent;
        this.PepperResponse = pepperChatResponses.PepperResponse;
        this.randomlyChoose = pepperChatResponses.randomlyChoose;

        // Yelp API Key
        if (!('yelpApiKey' in config)) {
            throw "Please provide Yelp API key as property 'yelpApiKey' in config object"
        }
        // Google Maps API key required
        if (!('googleMapsApiKey' in config)) {
            throw "Please provide Google Static Maps API key as property 'googleMapsApiKey' in config object"
        }
        // Geocoder API key optional -- allows for impromptu searching of other cities
        if ('nodeGeocoderModule' in config) {
            if (!('geocoderApiKey' in config)) {
                throw "Please provide Geocoder API key as property 'geocoderApiKey' in config object"
            }
            let options = {
                provider: 'google',
                apiKey: config.geocoderApiKey,
                httpAdapter: 'https', // Default
                formatter: null // 'gpx', 'string', ...
            };
            //this.geocoder = new config.nodeGeocoderModule(options);
            this.geocoder_enabled = true;
        } else {
            this.geocoder_enabled = false;
        }
        try {
            this.yelp_client = config.yelpModule.client(config.yelpApiKey)
            this.googleMapsApiKey = config.googleMapsApiKey;
        } catch (err) {
            throw `Could not properly initialize Yelp client: ${err}`
        }
        this.latitude = 'latitude' in config ? config.latitude : '40.723402';
        this.longitude = 'longitude' in config ? config.longitude : '-74.006673';
    }
    localBusinessHandler( { body }, response, { action, contexts, parameters } ) {
        let { session } = body;
        let localContext, local = (localContext = contexts.filter(context => context.name == "local")[0]) ? localContext.parameters || {} : {}; // Local context stores Pepper Chat CMS parameters
        let initContext, init = (initContext = contexts.filter(context => context.name == "init")[0]) ? initContext.parameters || {} : {}; // Init context stores init1234 Chatbot-wide parameters (used for SmallTalk intents)
        console.log(`local: ${JSON.stringify(local)}`)
        console.log(`init: ${JSON.stringify(init)}`)
        let localiRegex = /[\w\/\-]+contexts\/([\w\-]+)/, [localiContext, locali = (localiContext = contexts.filter(context => localiRegex.exec(context.name)[1] == "local")[0]) ? localiContext.parameters || {} : {}; // Local context stores Pepper Chat CMS parameters
        let initiRegex = /[\w\/\-]+contexts\/([\w\-]+)/, initiContext, initi = (initiContext = contexts.filter(context => initiRegex.exec(context.name)[1] == "init")[0]) ? initiContext.parameters || {} : {}; // Init context stores init1234 Chatbot-wide parameters (used for SmallTalk intents)
        console.log(`locali: ${JSON.stringify(locali)}`)
        console.log(`initi: ${JSON.stringify(initi)}`)
        let localBizHandlers = {
            'yelp.search': () => {
                /* First, define the Yelp API querying function, which will be used below.
                 *
                 * @param <array> searchTerms - an array of the search terms parameters
                 * @param <string> filterBy - enum value (review_count, rating, distance) or else null
                 * @param <number> latitude - values range from -90 - 90
                 * @param <number> longitude - values range from -180 - 180
                 * @return Promise => then => returns Yelp results in the form of a Pepper Chat this.Carousel object
                 */
                let getYelpRecommendations = (searchTerms, filterBy, latitude, longitude) => {
                    return new Promise((resolve, reject) => {
                        let message = "",
                            searchRequest = {
                                term: searchTerms,
                                latitude: latitude,
                                longitude: longitude
                            };
                        if (filterBy) {
                            searchRequest.sort_by = filterBy;
                            message = "The best option by " + filterBy + " that I found on Yelp is ";
                        }
                        this.yelp_client.search(searchRequest).then(yelp_response => {
                            var numResponses = yelp_response.jsonBody.businesses.length;
                            if (numResponses === 0) {
                                throw "No results returned by Yelp API query for the search terms [" + searchTerms + "] " +
                                    "for the coordinates (" + latitude + ", " + longitude + " ).";
                            }
                            console.log("Success! Yelp API query returned " + numResponses + " results for the search terms [" + searchTerms +
                                "] for the coordinates (" + latitude + ", " + longitude + " ).");
                            numResponses = numResponses > 9 ? 9 : numResponses;
                            console.log("Displaying the first " + numResponses + " results...");
                            let businessData = [];
                            let businessContextStorageObj = {};
                            const pepperIconUrl = "https://pepperstorageprod.blob.core.windows.net/pepperdrive/bac93eda-99a5-4ad3-b620-7ac7885a42155306449d-7527-4887-b073-9ae1d1ae00a1.png";
                            const locationPepperUrl = latitude + "," + longitude;
                            for (let x = 0; x < numResponses; x++) {
                                const businessRaw = yelp_response.jsonBody.businesses[x];
                                // console.log(businessRaw);
                                let businessCarousel = new this.CarouselImage(
                                    (x + 1) + ") " + businessRaw.name, /* title */
                                    businessRaw.image_url, /* url */
                                    "business " + (x + 1) /* trigger new intent string */ );
                                const locationBusinessUrl = encodeURI(businessRaw.location.address1) + "," + encodeURI(businessRaw.location.city);
                                const contextObj = {
                                    "name": businessRaw.name,
                                    "rating": businessRaw.rating,
                                    "phone": businessRaw.phone,
                                    "location": businessRaw.location.address1,
                                    "image_url": businessRaw.image_url,
                                    "is_open": !businessRaw.is_closed,
                                    "id": businessRaw.id,
                                    "distance": Math.round(businessRaw.distance),
                                    "google_map_url": "https://maps.googleapis.com/maps/api/staticmap?markers=icon:" + pepperIconUrl + "%7C" + locationPepperUrl + "&markers=color:red%7C" + locationBusinessUrl + "&size=1280x800&path=color:red|weight:5|" + locationPepperUrl + "|" + locationBusinessUrl + "&key=" + this.googleMapsApiKey
                                };
                                businessContextStorageObj["business_" + (x + 1)] = contextObj;
                                businessData.push(businessCarousel);
                            }
                            // Store business attribute information as context parameters so subsequent requests won't need to re-query Yelp API
                            var context = {
                                "name": "yelp_storage",
                                "lifespan": 6,
                                "parameters": businessContextStorageObj
                            };
                            if (message.length > 0) {
                                message += yelp_response.jsonBody.businesses[0].name;
                                message = message + ". \\pau=500\\ Either click or say the number of which option interests you. || " + message + ":";
                            } else
                                message = "Here is what I found on Yelp. \\pau=500\\ Click or say the number of the option that interests you. || Here is what I found on Yelp:";
                            let carousel = new this.Carousel(message, businessData);
                            console.log(carousel);
                            let carouselResponse = new this.PepperResponse(carousel);
                            carouselResponse.setContext(context, session);
                            resolve(carouselResponse);
                        }).catch(e => {
                            console.log('Error getting Yelp listings: ' + e);
                            reject(e);
                        });
                    });
                }

                // Begin Main:
                let search_terms, filter_by, which_city;
                let lat = local.latitude || local.LATITUDE || init.latitude || this.latitude;
                let long = local.longitude || local.LONGITUDE || init.longitude || this.longitude;
                console.log("lat:", lat);
                console.log("long:", long);
                // If a repeat query:
                if (parameters.go_back) {
                    const original = contexts.filter(context => context.name == "yelp");
                    if (original.length > 0) {
                        search_terms = original[0].parameters.search_term;
                        filter_by = original[0].parameters.filter_by;
                        which_city = original[0].parameters.which_city;
                    }
                    // If a new query:    
                } else {
                    search_terms = parameters.search_term;
                    filter_by = parameters.filter_by;
                    which_city = parameters.which_city;
                }
                search_terms = search_terms ? Array.isArray(search_terms) && search_terms.length > 1 ? search_terms.join(" ") : search_terms.toString() : "restaurants";
                filter_by = filter_by ? filter_by.toString() : null;
                console.log("search terms: ", search_terms);
                console.log("filter by: ", filter_by);
                let yelp_error_message = "Hum. My friend Yelp did not answer my call. Please try again later. In the meantime, is there something else I can help you with? || Hmm. My friend Yelp did not answer my call. Please try again later. In the meantime, is there something else I can help you with?";

                // If a specific city is asked about, grab the coordinates for that city
                if (which_city) {
                    console.log("Searching for latitude and longitude for " + which_city + " ...");
                    try {
                        this.geocoder.geocode(which_city)
                            .then(function(resp) {
                                console.log("Results for " + which_city + " query: " + resp[0]);
                                let {
                                    latitude,
                                    longitude
                                } = resp[0];
                                getYelpRecommendations(search_terms, filter_by, latitude, longitude).then(carousel => carousel.send((response)));
                            })
                            .catch(function(err) {
                                console.log(err);
                            });
                    } catch (err) {
                        console.log("No coordinates could be determined for " + which_city);
                    }
                } else {
                    // For all standard queries
                    getYelpRecommendations(search_terms, filter_by, lat, long).then(carousel => carousel.send((response)));
                }
            },
            'yelp.search.business_selected': () => {
                try {
                    console.log("yelp.search.business_selected has been triggered");
                    console.log("Contexts -> " + JSON.stringify(contexts));
                    let yelpContext = contexts.filter(context => context.name == "yelp_storage");
                    let id = parameters.business_id;
                    console.log("business id: ", id);
                    console.log("1st Yelp Storage context: ", yelpContext[0]);
                    let businessData = yelpContext[0].parameters["business_" + id];
                    businessData.prettylocation = businessData.location.replace(/St$/, "Street").replace(/Blvd$/, "Boulevard").replace(/Ave$/, "Avenue").replace(/Cir$/, "Circle").replace(/Dr$/, "Drive");
                    console.log("typeof businessData: " + (typeof businessData));
                    let pause = " \\pau=300\\ ";
                    let spokenMessage = ["I love  \\pau=100\\" + businessData.name + ". They are located not too far from here at  \\pau=50\\ " + businessData.prettylocation + "." + pause,
                        "I hear " + businessData.name + " is a great business \\pau=400\\. They are located close by at \\pau=50\\ " + businessData.prettylocation + "." + pause,
                        "Great choice!  \\pau=400\\ " + businessData.name + " \\pau=50\\ is located nearby at \\pau=50\\" + businessData.prettylocation + "." + pause,
                    ];
                    let spokenMapFollowUp = "You can click or say the following " + pause +
                        /*" Browse images " + pause +*/
                        " View Business \\pau=50\\ information " + pause + " Show me a map " + pause + "or say" + pause + "Go back";
                    businessData.message = this.randomlyChoose(spokenMessage) + spokenMapFollowUp + " || " + businessData.name + " : " + businessData.location;
                    let previouslyVisitedContext = contexts.filter(context => context.name == session + "yelp_biz_visited");
                    if (previouslyVisitedContext.length > 0) {
                        let orSayGoBack = "Or say \\pau=50\\ Go back \\pau=50\\ to go back to the results. ";
                        businessData.message = "Here are your options again for the business " + businessData.name + ". " + orSayGoBack + " || " + businessData.name + " : " + businessData.location;
                    }
                    console.log(businessData);
                    console.log("BUILDING RICH CARDS");
                    let yelpBizInfoCard = new this.CarouselImage(
                        "Information",
                        "https://pepperstorageprod.blob.core.windows.net/pepperdrive/6263cc44-7fef-49b3-bda7-1dda908ca19b55e59677-801d-48ba-bc36-beb7727cb7f3",
                        "Yelp Business Information");
                    let yelpBizMapCard = new this.CarouselImage(
                        "Map",
                        "https://pepperstorageprod.blob.core.windows.net/pepperdrive/6263cc44-7fef-49b3-bda7-1dda908ca19b33f76445-34e6-482e-a7ec-08c89956c84f",
                        "Map this location");
                    let yelpMenuCardsArray = [yelpBizInfoCard, yelpBizMapCard];
                    let yelpBizMenuCarousel = new this.Carousel(businessData.message, yelpMenuCardsArray);
                    let yelpBizMenuParameters = {
                        business_info: {
                            name: businessData.name,
                            location: businessData.location,
                            image_url: businessData.google_map_url,
                            distance: businessData.distance,
                            phone: businessData.phone,
                            is_open: businessData.is_open,
                            rating: businessData.rating,
                            id: id
                        }
                    };
                    let carouselResponse = new this.PepperResponse(yelpBizMenuCarousel);
                    carouselResponse.setContext({
                        name: "yelp_business_selected",
                        lifespan: 2,
                        parameters: yelpBizMenuParameters
                    }, session);
                    carouselResponse.send((response));
                } catch (err) {
                    console.log(err);
                    let errorResponse = new this.PepperResponse("What else would you like to talk about?");
                    errorResponse.send((response));
                }
            },
            'yelp.search.business_selected.map_selected': () => {
                console.log("Contexts -> " + JSON.stringify(contexts));
                let mapContext = contexts.filter(context => context.name == session + "/contexts/" + "yelp_business_selected");
                let mapped_business = mapContext[0].parameters.business_info;
                console.log("Map Parameters: ", JSON.stringify(mapped_business));
                let mapSpeech = "Here is a general sense of how to get to " + mapped_business.name + " \\pau=10000\\ || :)";
                let map = new this.FullScreenImage(mapSpeech, mapped_business.image_url);
                let returnToBizMenu = new this.TriggerIntent("Business " + mapped_business.id);
                let followUpQuestion = new this.BasicText("What else can I help you with?");
                let mapThenReturnToBizMenu = new this.PepperResponse(map, returnToBizMenu);
                mapThenReturnToBizMenu.setContext({
                    name: "yelp_biz_visited",
                    lifespan: 2,
                    parameters: {
                        visited: true
                    }
                }, session);
                mapThenReturnToBizMenu.send((response));
            },
            'yelp.search.business_selected.more_info': () => {
                let yelpBizContext = contexts.filter(context => context.name == session + "/contexts/" + "yelp_business_selected");
                let business = yelpBizContext[0].parameters.business_info;
                // console.log("Yelp Business Info Selected - Context: ", yelpBizContext[0]);
                // console.log("Yelp Selected Business Info Parameters: ", business);
                let message = "Here is the requested information! \\pau=8000\\ || Name: " + business.name + " | Phone Number: " +
                    business.phone + " |  Address: " + business.location + " | Rating: " + business.rating +
                    " | Open now: " + (business.rating ? "Yes " : "No") + " | Distance from here:  " + business.distance + "m";
                let returnToBizMenu = new this.TriggerIntent("Business " + business.id);
                let moreBizInfoResponse = new this.PepperResponse(message, returnToBizMenu);
                moreBizInfoResponse.setContext({
                    name: "yelp_biz_visited",
                    lifespan: 2,
                    parameters: {
                        visited: true
                    }
                }, session);
                moreBizInfoResponse.send((response));
            }
        };
        localBizHandlers[action]();
    }
}

module.exports = {
    YelpPepperChat
};