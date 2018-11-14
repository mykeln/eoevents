// setting variables from dotenv file
require('dotenv').config({path: __dirname + '/.env'});
var login = process.env.EOEMAIL;
var pass = process.env.EOPASSWORD;
var url = process.env.RSSURL;

// adding modules
const puppeteer           = require('puppeteer');
const fs                  = require('fs');
const dateFormat          = require('dateformat');
const feed                = require('rss-to-json');
const Json2csvParser      = require('json2csv').Parser;


// setting urls array here since it'll be looped over later
var eventUrls = [];

// loading rss feed to grab just the event page urls
feed.load(url, function(err, rss){
  // throws an error, you could also catch it here
  if (err) throw err;

  rss.items.forEach(item => {
    // pushing event link to urls array
    eventUrls.push(item.link);
  });

  // create an array of event objects
  var eventObjects = [];

  // browse to the page and do stuff
  (async () => {
    // launch the browser
    const browser = await puppeteer.launch({
      headless: true // headless or non-headless
    });

    // open a new tab
    const page = await browser.newPage();

    // hitting the login url for eo's site
    console.log('going to login page: https://www.eonetwork.org/_layouts/15/login.aspx');
    await page.goto('https://www.eonetwork.org/_layouts/15/login.aspx',{waitUntil: 'networkidle2'});

    // logging in
    await page.type('#ctl00_PlaceHolderMain_txtUserName', login);
    await page.type('#ctl00_PlaceHolderMain_txtPassword', pass);
    await page.click('#ctl00_PlaceHolderMain_btnlogin');
    console.log('logging in');
    await page.waitForNavigation();

    // disabling js for speed
    console.log('disabling js');
    await page.setJavaScriptEnabled(false);

    // loop over array of event links and write it to json values
    //DEBUG, limit to 1
    //for (let i = 1; i < 2; i++) {
    for (let i = 0; i < eventUrls.length; i++) {
      // setting the event url for this iteration
      const url = eventUrls[i];

      // creating the item object for this iteration
      var item = {};

      // go to the url for scraping
      console.log('scraping event url: ' + url);
      await page.goto(url,{waitUntil: 'networkidle2'});

      // event title
      var eventTitle = await page.evaluate(el => el.innerHTML, await page.$('#lblEventTitle'));
      item.title = eventTitle;
      console.log(eventTitle);

      // event date
      var rawDate = await page.evaluate(el => el.innerHTML, await page.$('#lblEventDate'));
      var parsedDate = new Date(rawDate);

      //var dateFrom = dateFormat(rawDate, "yyyy-mm-dd");
      //var startTime = dateFormat(rawDate, "h:MMTT");
      //var endTime = dateFormat(rawDate, "h:MMTT"); // FIXME, split on dash

      var eventVenue = await page.evaluate(el => el.innerHTML, await page.$('#lblVenue'));
      console.log(eventVenue);


      var eventType = await page.evaluate(el => el.innerHTML, await page.$('#lblEventType'));
      console.log(eventType);

      var eventContact = await page.evaluate(el => el.innerHTML, await page.$('#lblEventContact'));
      console.log(eventContact);

      var eventDescription = await page.evaluate(el => el.innerHTML, await page.$('#lblDescription'));
      console.log(eventDescription);

      var imgSelector = "#eventImg";
      var eventPhoto = await page.$$eval(imgSelector, images => {return images.map((image)=>image.src)});
      var eventPhoto = eventPhoto[0];
      console.log(eventPhoto);

      var eventMemberPrice = await page.evaluate(el => el.innerHTML, await page.$('#lblMemberPrice'));
      console.log(eventMemberPrice);

      var eventGuestPrice = await page.evaluate(el => el.innerHTML, await page.$('#lblAdultGuestPrice'));
      console.log(eventGuestPrice);




      eventObjects.push(item);

      // fixme: write item.blah for json pickup




   } // end for each event url loop

    // close tab and browser
    await page.close();
    await browser.close();

   // array of event objects should be populated
   console.log(eventObjects);


  const fields = ['title',
  'description',
  'date_from',
  'date_to',
  'Recurrence',
  'start_time',
  'end_time',
  'location',
  'address',
  'City',
  'State',
  'event_website',
  'Room',
  'Keywords',
  'Tags',
  'photo_url',
  'Ticket URL',
  'Cost',
  'Hashtag',
  'Facebook URL',
  'Group',
  'Department',
  'Allow User Activity',
  'Allow User Interest',
  'Visibility',
  'Featured Tabs',
  'Sponsored',
  'Venue Page Only',
  'Widget Only',
  'Channels Only',
  'Exclude From Trending',
  'Event Types'];
  const opts = { fields };

  try {
    const parser = new Json2csvParser(opts);
    const csv = parser.parse(eventObjects);

    fs.writeFile('eonetwork_feed.csv', csv, (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;
      //success case, the file was saved
      console.log('csv written');
    });


  } catch (err) {
    console.error(err);
  }

})(); // end of async
}); // end of rss feed pulldown