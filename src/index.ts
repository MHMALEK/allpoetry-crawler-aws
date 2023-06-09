import { Page } from "puppeteer-core";

const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const base_url = "https://allpoetry.com/";

exports.handler = async (event: any, context: any, callback: any) => {
  // Optional: If you'd like to use the legacy headless mode. "new" is the default.
  chromium.setHeadlessMode = true;

  // Optional: If you'd like to disable webgl, true is the default.
  chromium.setGraphicsMode = false;

  let result = null;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();

    const author = event.queryStringParameters["author"];
    const poemUrl = event.queryStringParameters["poem_url"];
    let requestType;

    if (author) {
      requestType = "getPoemList";
      result = await getPoemsListController(page, author);
    }
    if (poemUrl) {
      requestType = "getPoemText";
      result = await getPoemTextController(page, poemUrl);
    }
  } catch (error) {
    return callback(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  return callback(null, result);
};

const getPoemsListController = async (page: Page, author: string) => {
  const loginUrl = `${base_url}/login`;
  // Navigate to the login page
  await page.goto(loginUrl);
  // Fill in the login form and submit
  await page.type("#user_name", "mhos.malek@gmail.com");
  await page.type("#user_password", "Haavin1993!");
  await page.click("#new_user > div:nth-child(7) > div.media-body > input");

  // Wait for navigation to complete
  await page.waitForNavigation();

  // Scrape the hafez page
  await page.goto(`${base_url}/${author}`);

  const elements = await page.$x(
    "/html/body/div[1]/div/div[2]/div[2]/div/div[1]/div[1]/form/div[1]/a[2]"
  );

  if (elements.length > 0) {
    // @ts-ignore
    await elements[0].click();
  }

  const xpathExpression =
    "/html/body/div[1]/div/div[2]/div[2]/div/div[1]/div[4]/ul/li/a";
  await page.waitForXPath(xpathExpression, { visible: true });
  const elementss = await page.$x(xpathExpression);

  const links = await Promise.all(
    // @ts-ignore
    elementss.map(async (element) => {
      // @ts-ignore
      const href = await page.evaluate((el) => el.href, element);
      // @ts-ignore
      const text = await page.evaluate((el) => el.textContent, element);
      return { href, text };
    })
  );

  return links;
};

const getPoemTextController = async (page: Page, poemPageUrl: string) => {
  await page.goto(poemPageUrl);

  const poem = await page.evaluate(() => {
    let poemDiv = document.querySelector(".poem_body > div:nth-child(2)");
    let poemText = poemDiv?.innerHTML.replace(/<[^>]*>/g, "");
    return poemText;
  });

  return poem;
};
