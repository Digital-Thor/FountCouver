Locations = new Mongo.Collection("location");
  //console.dir(Locations.find().fetch());


if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault("counter", 0);

  Template.hello.helpers({
    counter: function () {
      return Session.get("counter");
    }
  });

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      Session.set("counter", Session.get("counter") + 1);
    }


  });

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



        var mapPoints = Locations.find();
        //  debugger;

        mapPoints.forEach(function (location) {
          console.log(location.Lat, location.Lon);
          // console.dir(location);
            var marker = new google.maps.Marker({
            position: new google.maps.LatLng(location.Lat, location.Lon),
            map: map.instance
          });
        });  

      });

      // Map initialization options
      return {
        center: new google.maps.LatLng(49, -122.9631),
        zoom: 8
      };
    }
  }


});

  Meteor.startup(function() {
    GoogleMaps.load();
  });
}

if (Meteor.isServer) {



  Meteor.startup(function () {
    // code to run on server at startup

    var Jsftp = Meteor.npmRequire('jsftp');
    var Ftp = new Jsftp({
      host: "webftp.vancouver.ca",
      debugMode: true,
      port:21
      });
    var results = ""; // Will store the contents of the file
    Ftp.on('jsftp_debug', function(eventType, data) {
      console.log('DEBUG: ', eventType);
      console.log(JSON.stringify(data, null, 2));
    });

    // Approach Source: https://www.npmjs.com/package/jsftp
    // Example: https://sourcegraph.com/github.com/ajaxorg/jsftp
    // Note:    The example looks like it's for jsftp, but I'm not positive.
    Ftp.get("/OpenData/json/drinking_fountains.json", function(err, data) {
        if (err)
            return console.error(err);

        // Do something with the buffer
        console.log(data);
        results += data.toString(); 
        // console.dir(results);
        // debugger;

        try {
          ejsonObj = EJSON.parse(results);
          }
        catch(e){
           console.log("EJSON.parse Error = " + e.name + ", " + e.message)
           }      
        /* var features = (ejsonObj.features);
        features.forEach(LoadLocations); */

        // We can use raw FTP commands directly as well. In this case we use FTP
        // 'QUIT' method, which accepts no parameters and returns the farewell
        // message from the server
        /* Ftp.raw.quit(function(err, res) {
            if (err)
                return console.error(err);

            console.log("FTP session finished.");
        }); */
    });







    Locations.remove({});  // remove any old locations in the database, ie: the old data we hard-coded into Locations.

    // var url = "webftp.vancouver.ca/OpenData/json/drinking_fountains.json";
    // var results = HTTP.get(url);

    // results = Assets.getText("results.json");

    // console.dir(results);


    function LoadLocations( coordpairArr ) {
     // console.log(" Arr=", coordpairArr.geometry.coordinates[0], coordpairArr.geometry.coordinates[1]);
      Locations.insert({
        Lat: coordpairArr.geometry.coordinates[1], 
        Lon: coordpairArr.geometry.coordinates[0]
        });
      }


  });

}


