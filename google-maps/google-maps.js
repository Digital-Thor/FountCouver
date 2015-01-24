/*

FountCouver

    A Meteor mapping example using the Node ftp package JSFTP and Google Maps.

Meteor Learning Goal
 
    Mark the locations on Google Maps of public drinking fountains in Vancouver BC using

      http://data.vancouver.ca/datacatalogue/drinkingFountains.htm

    JSON data was only available by FTP at: 

      ftp://webftp.vancouver.ca/OpenData/json/drinking_fountains.json

    so this project couldn't be done with a simple HTTP GET call and instead required an FTP client in the Meteor server code.

Approach
  
  Since there is no Meteor package to provide FTP client functions (as of Jan 2015), 
  we need to use NPM to wrap a NodeJS package called JSFTP.

In project root folder:

  1. type in terminal: meteor add meteorhacks:npm
  2. Create a packages.json file containing:
    {
      "redis": "0.8.2",
      "github": "0.1.8",
      "jsftp": "1.4.0"
    }

*/

Locations = new Mongo.Collection("locations");
  //console.dir(Locations.find().fetch());
ProgStatus = new Mongo.Collection("progstatus");  // program status info and flags

if (Meteor.isClient) {

  var locationsMapped = false;
  Template.body.helpers({
    sourceLocationsCount: function(){
      var initSourceCount = ProgStatus.findOne({statusName: "sourceCount"});
      return(initSourceCount.statusValue);
      },
    exampleMapOptions2: function() {
    // Google Docs: https://developers.google.com/maps/documentation/javascript/tutorial
    //              https://developers.google.com/maps/documentation/javascript/events
    // Meteor Docs: https://github.com/dburles/meteor-google-maps

    // Make sure the maps API has loaded
    if (GoogleMaps.loaded()) {
      GoogleMaps.ready('exampleMap', function(map) {
        // Add markers to the map once it's ready
        // Poll every 300ms to see if Locations collection has been loaded
        Meteor.setInterval( function() {
          if (!locationsMapped) {     // if locations are not mapped
            // console.log("Waiting for Locations to load");         

            Meteor.call('checkIfLocationsLoaded', function(error,result) {
              if (error) { console.log(error.reason); }
              else if ( result == true ) {  
                Meteor.call('checkNumberOfSourceLocations', function(error2,result2) {
                  if (error2) { console.log("Source Location error: ",error2.reason); }
                  else console.log("Number of Source Locations = " + result2);
                  });
                // locations loaded, but not mapped, so map them
                // console.log("Locations loaded. About to get coords from Locations collection.");
                locationsMapped = true; // not quite true, but need to prevent repeat triggers of this code block
                var mapPoints = Locations.find();
                // console.log("About to map each point in mapPoints array");
                mapPoints.forEach(function (location) {
                    var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(location.Lat, location.Lon),
                    map: map.instance
                  });
                });   // end mapPoints
              }       // end else if (data ready to send to Google Maps)
            });       // end of Meteor.call callback

          }           // end of check to see if locations need to be mapped
        },300);       // end of Meteor.setInterval
      });             // end of GoogleMaps.ready

      // Map initialization options
      return {
        center: new google.maps.LatLng(49.2701294, -123.104467),
        zoom: 12
      };
    }
  }
});  // end body helpers

  Meteor.startup(function() {
    GoogleMaps.load();
  });
} // end client code


if (Meteor.isServer) {

  var locationsLoading = false; // this flag is set true as soon as loading starts
  var locationsLoaded = false;  // this flag is set true once loading completes. 
  var locationsCounter = 0;     // number of locations inserted into Locations

  // method called by client to see if Locations collection is ready. 
  Meteor.methods({
    checkIfLocationsLoaded: function () {                   // triggers client to start plotting map points.
      // console.log("locationsLoaded: ",locationsLoaded); 
      return locationsLoaded ;
      },
    checkNumberOfSourceLocations: function () {             // used by client to log (on server) inital number of source locations
      console.log("locationsCounter = ",locationsCounter);
      return locationsCounter;
      }      
    });

  // Approach:  wrap NPM/jsftp for use by meteor
  // Link:      https://www.npmjs.com/package/jsftp

  Meteor.startup(function () {
    // code to run on server at startup

    var Jsftp = Meteor.npmRequire('jsftp');
    var Ftp = new Jsftp({
      host: "webftp.vancouver.ca",
      // debugMode: true,
      port:21
      });

    Ftp.on('jsftp_debug', function(eventType, data) {
      console.log('DEBUG: ', eventType);
      console.log(JSON.stringify(data, null, 2));
    });

    var results = {"str":"","loaded":false};  
    // .str will store the contents of the file, .loaded flag indicates if ftp is complete


    Locations.remove({});  // remove any old locations in the database
    ProgStatus.remove({});     // initialize any program status info and flags

    Ftp.get("/OpenData/json/drinking_fountains.json", function(err, socket) {
      if (err) return;

      socket.on("data", function(d) { 
        console.log("* * * building results * * *");
        results.str += d.toString(); 
        });
      socket.on("close", function(hadErr) {
        console.log("Closed Socket");
        results.loaded = true;
        // console.log("*** results ****\n",results.str);
        if (hadErr)
          console.error('There was an error retrieving the file.');
      });
      socket.resume(console.log("Resuming Socket"));
    });



    // Add a pair of coordinates [longitude, latitude] into the Locations collection
    function LoadLocations( coordpairArr ) {
     // console.log(" Arr=", coordpairArr.geometry.coordinates[0], coordpairArr.geometry.coordinates[1]);
      Locations.insert({
        Lat: coordpairArr.geometry.coordinates[1], 
        Lon: coordpairArr.geometry.coordinates[0]
        });
      locationsCounter++;
      }

  // Poll every 500ms to see if the results are loaded from the ftp site
  Meteor.setInterval( function() {
    if (results.loaded == true && !locationsLoading ) { // initially, locationsLoading is false
      locationsLoading = true;                          // set to true to debounce (prevent further trigger of code block)
      console.log("About to parse results into EJSON");
      try {
        ejsonObj = EJSON.parse(results.str);            // convert contents of the ftp transfer from string to ejson object
        }
      catch(e){
         console.log("EJSON parsing error = " + e.name + " - " + e.message)
         }    
      var features = (ejsonObj.features);               // traverse to the correct records
      features.forEach(LoadLocations);                  // for each set of coordinates, place them in the Locations collection
      locationsLoaded = true;                           // this flag is polled by client to trigger plotting points on map
      ProgStatus.insert({
        statusName: "sourceCount",
        statusValue: locationsCounter
        });
      console.log("Locations collection is loaded.");
      }
    }, 500);

  });  // end server startup code

}     // end server code
