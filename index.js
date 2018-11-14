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
const moment              = require('moment');

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
    const browser = await puppeteer.launch({args: ['--no-sandbox'], headless: true});

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
      item['Title'] = eventTitle;
      console.log(eventTitle);

      // event date
      var rawDate = await page.evaluate(el => el.innerHTML, await page.$('#lblEventDate'));

      // event day and start time
      // sample date 15 May 2019 12:00 AM - 12:00 AM ((GMT-05:00) Eastern Time (US & Canada))
      var rawDateDay = rawDate.split(' - ')[0]; // also grabs start time
      var objectDateDay = new Date(rawDateDay);
      var dateFrom = dateFormat(objectDateDay, "yyyy-mm-dd");
      var startTime = dateFormat(objectDateDay, "h:MMTT");
      item['Date From'] = dateFrom;
      item['Date To'] = dateFrom; // same day event
      console.log('date from ' + dateFrom);
      item['Start Time'] = startTime;
      console.log('start time ' + startTime);

      // end time
      var rawDateEndTimeSplit = rawDate.split(' - ')[1];
      var rawDateEndTime = rawDateEndTimeSplit.split('((')[0];
      var objectDateEndTime = new Date(rawDateEndTime);
      var endTime = moment(objectDateEndTime, "h:MM TT")
      item['End Time'] = endTime;
      console.log('end time ' + endTime);

      // venue
      var rawEventVenue = await page.evaluate(el => el.innerHTML, await page.$('#lblVenue'));
      var eventVenue = rawEventVenue.split('</b> ')[1];
      item['Location'] = eventVenue;
      item['Address'] = eventVenue;
      console.log(eventVenue);

      var rawEventType = await page.evaluate(el => el.innerHTML, await page.$('#lblEventType'));
      var eventType = rawEventType.split('</b> ')[1];
      item['Event Types'] = eventType;
      console.log(eventType);

      var eventContact = await page.evaluate(el => el.innerHTML, await page.$('#lblEventContact'));
      item['Event Contact'] = eventContact;
      console.log(eventContact);

      var eventDescription = await page.evaluate(el => el.innerHTML, await page.$('#lblDescription'));
      item['Description'] = eventDescription;
      console.log(eventDescription);

      var imgSelector = "#eventImg";
      var eventPhoto = await page.$$eval(imgSelector, images => {return images.map((image)=>image.src)});
      var eventPhoto = eventPhoto[0];
      item['Photo URL'] = eventPhoto;
      console.log(eventPhoto);

      var eventMemberPrice = await page.evaluate(el => el.innerHTML, await page.$('#lblMemberPrice'));
      item['Cost'] = eventMemberPrice;
      console.log(eventMemberPrice);

      var eventGuestPrice = await page.evaluate(el => el.innerHTML, await page.$('#lblAdultGuestPrice'));
      item['Guest Cost'] = eventGuestPrice
      console.log(eventGuestPrice);

      item['Event Website'] = url;

      eventObjects.push(item);

      // fixme: write item.blah for json pickup




   } // end for each event url loop

    // close tab and browser
    await page.close();
    await browser.close();

   // array of event objects should be populated
   console.log(eventObjects);


  const fields = ['Title',
  'Description',
  'Date From',
  'Date To',
  'Recurrence',
  'Start Time',
  'End Time',
  'Location',
  'Address',
  'City',
  'State',
  'Event Website',
  'Room',
  'Keywords',
  'Tags',
  'Photo URL',
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
  'Event Types',
  'Guest Cost'];
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
