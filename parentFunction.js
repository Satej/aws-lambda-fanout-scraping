const { chromium: playwright } = require("playwright-core");
const chromium = require("@sparticuz/chromium");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const snsClient = new SNSClient({ region: "ap-south-1" });

module.exports.handler = async (_, _) => {
  let browser = null;

  try {
    browser = await playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    let bookItems = undefined;
    let retries = 0;

    while (!bookItems && retries++ < 5) bookItems = await searchBooks(page);

    for (const bookItem of bookItems) {
      const link = await bookItem.$('a');
      let href = await link.getAttribute('href');
      const bookUrl = href.split('?')[0];
    
      try {
        await snsClient.send(new PublishCommand({
          Message: bookUrl,
          TopicArn: process.env.CHILD_DETAILS_TOPIC_ARN,
        }));
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }  
};

async function searchBooks(page) {
  page.setDefaultTimeout(5000);
  let bookItems = undefined;

  try {
    await page.goto(`https://www.amazon.com/b/?_encoding=UTF8&node=2479428011&bbn=11091801&ref_=Oct_d_odnav_d_1821_0&pd_rd_w=zOEjk&content-id=amzn1.sym.e53119de-65b6-4b94-9bfa-75b790992aa8&pf_rd_p=e53119de-65b6-4b94-9bfa-75b790992aa8&pf_rd_r=B21R743WSCYEW84A08JK&pd_rd_wg=NQoCO&pd_rd_r=ca7c7201-594d-4ed5-bff0-56f7421402ca`);
    await page.waitForSelector('.a-unordered-list');

    const bookList = await page.$('.a-unordered-list');
    bookItems = bookList.$$('li');
  } catch (error) {
    console.log(error);
  } finally {
    return bookItems;
  }
}
