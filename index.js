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

// loading rss feed to grab just the event links
feed.load(url, function(err, rss){
  // throws an error, you could also catch it here
  if (err) throw err;

  rss.items.forEach(item => {
    /*
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

    // parsing start date, start time
    /* not needed because we'll be scraping this from the page
    var rawDate = new Date(item.created);

    item.date_from = dateFormat(rawDate, "yyyy-mm-dd");
    item.start_time = dateFormat(rawDate, "h:MMTT");
    */


    // pushing event link to urls array
    eventUrls.push(item.link);

    //var photo_url = await page.$$('#eventImg').attr('src');
    //console.log(photo_url);

    // assigning json variables, which will later be converted to the localist csv
    // item.photo_url = photo_url;
  });



  // show links in the array
  console.log(eventUrls);




  // browse to the page and do stuff
  (async () => {
    // launch the browser
    const browser = await puppeteer.launch({
      headless: true // headless or non-headless
    });

    // open a new tab
    const page = await browser.newPage();

    // login to the eonetwork site
    await page.goto('https://www.eonetwork.org/_layouts/15/login.aspx',{waitUntil: 'networkidle2'});
    await page.goto('https://www.eonetwork.org/_layouts/15/login.aspx');
    await page.type('#ctl00_PlaceHolderMain_txtUserName', login);
    await page.type('#ctl00_PlaceHolderMain_txtPassword', pass);
    await page.click('#ctl00_PlaceHolderMain_btnlogin');
    await page.waitForNavigation();
    await page.setJavaScriptEnabled(false)

    // loop over array of event links and write it to json values
    for (let i = 0; i < eventUrls.length; i++) {
      const url = eventUrls[i];
      await page.goto(`${url}`);
      //await page.waitForNavigation({ waitUntil: 'networkidle2' });

      //await page.waitForSelector('#eventImg');

      var photo_url = await page.$('#eventImg');
      //console.log(photo_url);
    }

    // close tab and browser
    await page.close();
    await browser.close();
  })(); // end of async


  //console.log(rss);

}); // end of rss feed pulldown










/*
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

*/








