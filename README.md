# FountCouver

A Meteor mapping example using the Node ftp package JSFTP and Google Maps.

**Meteor Learning Goal**
 
Plot map coordinates on Google Maps for drinking fountains in Vancouver, BC using

    http://data.vancouver.ca/datacatalogue/drinkingFountains.htm

JSON data was only available by FTP at: 

    ftp://webftp.vancouver.ca/OpenData/json/drinking_fountains.json

so this project couldn't be done with a simple HTTP GET call and instead required an FTP client in the Meteor server code

**Approach**
  
  Since there is no Meteor package to provide FTP client functions (as of Jan 2015), 
  we need to use NPM to wrap a NodeJS package called JSFTP.

**Add FTP Package**

In project root folder:

1.Type in terminal: 
```
meteor add meteorhacks:npm
```
2.Create a packages.json file containing:
```javascript
{
"redis": "0.8.2",
"github": "0.1.8",
"jsftp": "1.4.0"
}
```

