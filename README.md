# FountCouver

A Meteor mapping example using the Node ftp package JSFTP and Google Maps.

**Note:** Ignore commit messages about "Buggy JSFTP..." since those are resolved.

**Meteor Learning Goal**
 
Mark the locations on Google Maps of public drinking fountains in Vancouver BC using

    http://data.vancouver.ca/datacatalogue/drinkingFountains.htm

JSON data was only available by FTP at: 

    ftp://webftp.vancouver.ca/OpenData/json/drinking_fountains.json

so this project couldn't be done with a simple HTTP GET call and instead required an FTP client in the Meteor server code

**Approach**
  
  Since there is no Meteor package to provide FTP client functions (as of Jan 2015), 
  we need to use NPM to wrap a NodeJS package called JSFTP.

**Add FTP Package**

From project root folder:

1.Add Meteor Packages.  Type in terminal: 
```
meteor add meteorhacks:npm
meteor add reactive-var
```
2.Add Node packages by creating ```packages.json``` file containing:
```javascript
{
"redis": "0.8.2",
"github": "0.1.8",
"jsftp": "1.4.0"
}
```

