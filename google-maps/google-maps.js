Locations = new Mongo.Collection("location");
  //console.dir(Locations.find().fetch());

if (Meteor.isClient) {

  var locationsMapped = false;
  Template.body.helpers({
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
          if (!locationsMapped) {
            console.log("Waiting for Locations to load");
            }
          if ((Locations.find().count() > 0) && (!locationsMapped) ) {  
            // locations loaded, but not mapped, so map them
            console.log("About to get coords from Locations collection.");
            locationsMapped = true;
            var mapPoints = Locations.find();
            console.log("About to map each point in mapPoints array");
            mapPoints.forEach(function (location) {
                var marker = new google.maps.Marker({
                position: new google.maps.LatLng(location.Lat, location.Lon),
                map: map.instance
              });
            });   // end mapPoints
          } 
        },300);


      });

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

  var locationsLoading = false;

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


    Ftp.get("/OpenData/json/drinking_fountains.json", function(err, socket) {
      if (err) return;

      socket.on("data", function(d) { 
        console.log("* * * building results * * *");
        results.str += d.toString(); 
        });
      socket.on("close", function(hadErr) {
        console.log("Closed");
        results.loaded = true;
        // console.log("*** results ****\n",results.str);
        if (hadErr)
          console.error('There was an error retrieving the file.');
      });
      socket.resume(console.log("Resuming Socket"));
    });




    function LoadLocations( coordpairArr ) {
     // console.log(" Arr=", coordpairArr.geometry.coordinates[0], coordpairArr.geometry.coordinates[1]);
      Locations.insert({
        Lat: coordpairArr.geometry.coordinates[1], 
        Lon: coordpairArr.geometry.coordinates[0]
        });
      }

  // Poll to see if the results are loaded from the ftp site
  Meteor.setInterval( function() {
    if (results.loaded == true && !locationsLoading ) {
      locationsLoading = true;
      console.log("About to parse results into EJSON");
      try {
        ejsonObj = EJSON.parse(results.str);
        }
      catch(e){
         console.log("EJSON parsing error = " + e.name + " - " + e.message)
         }    
      var features = (ejsonObj.features);
      features.forEach(LoadLocations);
      console.log("Locations collection is loaded:");
      }
    }, 500);

  });  // end server startup code

}     // end server code
