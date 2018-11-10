// setting variables from dotenv file
require('dotenv').config({path: __dirname + '/.env'});
var login = process.env.EOEMAIL;
var pass = process.env.EOPASSWORD;
var url = process.env.RSSURL;

// adding modules
const puppeteer = require('puppeteer');
const fs = require('fs');
const dateFormat = require('dateformat');

// utility functions
console.log(url);

// grabbing rss feed, converting it to json
var feed = require('rss-to-json');
feed.load(url, function(err, rss){
  // throws an error, you could also catch it here
  if (err) throw err;

  rss.items.forEach((item) => {
    if(item.description.indexOf("Location") > -1) {
      var matches = item.description.match(/Location[^:]*: (.*)$/);

      if(matches && matches[1] != '') {
        item.location = matches[1];
        item.address = matches[1];
        item.description = 'This is an event.';
      } else {
        item.location = 'TBD';
        item.address = 'TBD';
        item.description = 'This is an event.';
      }
    } else {
      item.location = 'TBD2';
      item.address = 'TBD2';
    }

    // assigning standard entriesy
    item.event_website = item.link;

    // parsing start date, start time
    var rawDate = new Date(item.created);

    var parsedDate = dateFormat(rawDate, "yyyy-mm-dd");
    var parsedStartTime = dateFormat(rawDate, "h:MMTT");

    item.date_from = parsedDate;
    item.start_time = parsedStartTime;
 
    // setting contents of returned text out here because we need it for determining if we should send
    var event_image;





(async () => {

  // launch the browser
  const browser = await puppeteer.launch({
    headless: true // headless or non-headless
  });
  // open a new tab
  const page = await browser.newPage();
  
await page.goto(
  'https://www.eonetwork.org/_layouts/15/login.aspx',
  {waitUntil: 'networkidle2'}
);

await page.goto('https://www.eonetwork.org/_layouts/15/login.aspx');
await page.type('#ctl00_PlaceHolderMain_txtUserName', login);
await page.type('#ctl00_PlaceHolderMain_txtPassword', pass);
await page.click('#ctl00_PlaceHolderMain_btnlogin');
await page.waitForNavigation();
await page.goto(item.link);
  
  // close tab and browser
  await page.close();
  await browser.close();
})();















/*
puppeteer.launch({headless: true, args: ['--no-sandbox']}).then(browser => {
  browser.newPage()
  .then(page => page.goto('https://www.eonetwork.org/_layouts/15/login.aspx'));
  .then(resp => page.type('#ctl00_PlaceHolderMain_txtUserName', login));
  .then(resp => page.type('#ctl00_PlaceHolderMain_txtPassword', pass));
  .then(resp => page.click('#ctl00_PlaceHolderMain_btnlogin'));
  .then(resp => page.waitForNavigation());

  .then(resp => page.goto(item.link));
  .then(resp => page.waitFor(1000));

  item.photo_url = ((page.$$('#eventImg')).attr('src'));
  console.log(item.photo_url);

  // close the browser instance
  .then(buffer => browser.close());


});

*/


  });


console.log(rss);
const Json2csvParser = require('json2csv').Parser;
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
  const csv = parser.parse(rss.items);
  //console.log(csv);

  fs.writeFile('eonetwork_feed.csv', csv, (err) => {
    // throws an error, you could also catch it here
    if (err) throw err;
    //success case, the file was saved
    console.log('csv written');
  });


} catch (err) {
  console.error(err);
}



});
