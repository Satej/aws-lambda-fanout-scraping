const { chromium: playwright } = require("playwright-core");
const chromium = require("@sparticuz/chromium");
chromium.args.push("--disable-dev-shm-usage");

module.exports.handler = async (event, _) => {
  try {
    const records = event.Records;
    
    for (const record of records) {
      const bookUrl = record.Sns.Message;
      let bookDetails = undefined;
      let retries = 0

      while (!bookDetails && retries++ < 20) bookDetails = await getBookDetails(bookUrl);

      if (!bookDetails) continue;

      // Process book details for your purpose.
    }
  } catch (error) {
    console.log(error);
  }
};

async function getBookDetails(bookUrl) {
  const browser = await playwright.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  const context = await browser.newContext();

  const page = await context.newPage();
  let bookDetails = undefined;

  try {
    page.setDefaultTimeout(5000);
    await page.goto(bookUrl);
    await page.waitForSelector('#productTitle');
    bookDetails = await page.$eval('#productTitle', firstRes => firstRes.innerText);
  } catch (error) {
    console.log(error);
  } finally {
    await browser.close();
    return bookDetails;
  }
}