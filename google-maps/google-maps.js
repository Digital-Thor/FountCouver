Locations = new Mongo.Collection("location");
  //console.dir(Locations.find().fetch());


if (Meteor.isClient) {


  Template.body.helpers({
    exampleMapOptions2: function() {
    // Make sure the maps API has loaded
    if (GoogleMaps.loaded()) {
      // We can use the `ready` callback to interact with the map API once the map is ready.
      GoogleMaps.ready('exampleMap', function(map) {
        // Add a marker to the map once it's ready
        
        //for loop to create markers
        // var marker = new google.maps.Marker({
        //   position: map.options.center,
        //   map: map.instance
        // });
        var clientDelay = 0;
        if (Locations.find().count() === 0) clientDelay = 14000;
        Meteor.setTimeout( function() {
          var mapPoints = Locations.find();
          //  debugger;
          mapPoints.forEach(function (location) {
            console.log(location.Lat, location.Lon);
            // console.dir(location);
              var marker = new google.maps.Marker({
              position: new google.maps.LatLng(location.Lat, location.Lon),
              map: map.instance
            });
          });   // end mapPoints
        },clientDelay);
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

    var results = ""; // Will store the contents of the file

    Ftp.get("/OpenData/json/drinking_fountains.json", function(err, socket) {
      if (err) return;

      socket.on("data", function(d) { 
        console.log("* * * building results * * *");
        results += d.toString(); 
        });
      socket.on("close", function(hadErr) {
        console.log("Closed");
        // console.log("*** results ****\n",results);
        if (hadErr)
          console.error('There was an error retrieving the file.');
      });
      socket.resume(console.log("Resuming Socket"));
    });


    Locations.remove({});  // remove any old locations in the database, ie: the old data we hard-coded into Locations.



    function LoadLocations( coordpairArr ) {
     console.log(" Arr=", coordpairArr.geometry.coordinates[0], coordpairArr.geometry.coordinates[1]);
      Locations.insert({
        Lat: coordpairArr.geometry.coordinates[1], 
        Lon: coordpairArr.geometry.coordinates[0]
        });
      }


  Meteor.setTimeout( function() {
    console.log("About to parse results into EJSON");
    try {
      ejsonObj = EJSON.parse(results);
      }
    catch(e){
       console.log("EJSON parsing error = " + e.name + " - " + e.message)
       }    
    var features = (ejsonObj.features);
    features.forEach(LoadLocations);
    }, 12000);

  });  // end server startup code

}     // end server code


