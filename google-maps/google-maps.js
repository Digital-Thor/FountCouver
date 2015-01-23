Locations = new Mongo.Collection("location");
  //console.dir(Locations.find().fetch());
locationsLoading = false;
locationsLoaded = false;


if (Meteor.isClient) {

  var locationsMapped = false;
  Template.body.helpers({
    exampleMapOptions2: function() {
    // Google Docs: https://developers.google.com/maps/documentation/javascript/tutorial
    //              https://developers.google.com/maps/documentation/javascript/events
    // Meteor Docs: https://github.com/dburles/meteor-google-maps

    // Make sure the maps API has loaded
    if (GoogleMaps.loaded()) {
      // We can use the `ready` callback to interact with the map API once the map is ready.
      GoogleMaps.ready('exampleMap', function(map) {
        // Add a marker to the map once it's ready

        // var clientDelay = 0;
        // if (Locations.find().count() === 0) clientDelay = 14000;

        Meteor.setInterval( function() {
          if (!locationsMapped) {
            console.log("Waiting for Locations to load");
            console.log(locationsLoaded, !locationsMapped);
            }
          if ((Locations.find().count() > 0) && (!locationsMapped) ) {
            console.log("About to get coords from Locations collection.");
            locationsMapped = true;
            var mapPoints = Locations.find();
            //  debugger;
            console.log("About to map each point in mapPoints array");
            mapPoints.forEach(function (location) {
                var marker = new google.maps.Marker({
                position: new google.maps.LatLng(location.Lat, location.Lon),
                map: map.instance
              });
            });   // end mapPoints
          } // end of if locationsLoaded
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

  // Approach:  NPM/jsftp documentation
  // Link:      https://www.npmjs.com/package/jsftp
  // Notes:     data does show up, but not converting to ejson

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

    var results = {"str":"","loaded":false};  // str will store the contents of the file, loaded indicates if ftp is complete


    Locations.remove({});  // remove any old locations in the database, ie: the old data we hard-coded into Locations.


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
      locationsLoaded = true;
      console.log("Locations collection is loaded:", locationsLoaded);
      }
    }, 500);

  });  // end server startup code

}     // end server code
