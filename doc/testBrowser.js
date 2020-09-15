const puppeteer = require('puppeteer');

puppeteer.launch().then(async browser => {
  const page = await browser.newPage();
  await page.goto('https://v.douyin.com/JSCGx65/');
  page.on('request', (request)=>{
    console.log('A request was made:', request.url());
  });
  page.on('response', (response)=>{
    try{
      response.json().then(json=>{
        console.log(json)
      })
    }catch(err){
      console.error(err)
    }
  });
  setTimeout(()=>{
    browser.close();
  }, 3000)
});