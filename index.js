"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const base_url = "https://allpoetry.com/";
exports.handler = (event, context, callback) => __awaiter(void 0, void 0, void 0, function* () {
    // Optional: If you'd like to use the legacy headless mode. "new" is the default.
    chromium.setHeadlessMode = true;
    // Optional: If you'd like to disable webgl, true is the default.
    chromium.setGraphicsMode = false;
    let result = null;
    const browser = yield puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: yield chromium.executablePath(),
        headless: chromium.headless,
    });
    try {
        const page = yield browser.newPage();
        const author = event.queryStringParameters["author"];
        const poemUrl = event.queryStringParameters["poem_url"];
        let requestType;
        if (author) {
            requestType = "getPoemList";
            result = yield getPoemsListController(page, author);
        }
        if (poemUrl) {
            requestType = "getPoemText";
            result = yield getPoemTextController(page, poemUrl);
        }
    }
    catch (error) {
        return callback(error);
    }
    finally {
        if (browser !== null) {
            yield browser.close();
        }
    }
    return callback(null, result);
});
const getPoemsListController = (page, author) => __awaiter(void 0, void 0, void 0, function* () {
    const loginUrl = `${base_url}/login`;
    // Navigate to the login page
    yield page.goto(loginUrl);
    // Fill in the login form and submit
    yield page.type("#user_name", "mhos.malek@gmail.com");
    yield page.type("#user_password", "Haavin1993!");
    yield page.click("#new_user > div:nth-child(7) > div.media-body > input");
    // Wait for navigation to complete
    yield page.waitForNavigation();
    // Scrape the hafez page
    yield page.goto(`${base_url}/${author}`);
    const elements = yield page.$x("/html/body/div[1]/div/div[2]/div[2]/div/div[1]/div[1]/form/div[1]/a[2]");
    if (elements.length > 0) {
        // @ts-ignore
        yield elements[0].click();
    }
    const xpathExpression = "/html/body/div[1]/div/div[2]/div[2]/div/div[1]/div[4]/ul/li/a";
    yield page.waitForXPath(xpathExpression, { visible: true });
    const elementss = yield page.$x(xpathExpression);
    const links = yield Promise.all(
    // @ts-ignore
    elementss.map((element) => __awaiter(void 0, void 0, void 0, function* () {
        // @ts-ignore
        const href = yield page.evaluate((el) => el.href, element);
        // @ts-ignore
        const text = yield page.evaluate((el) => el.textContent, element);
        return { href, text };
    })));
    return links;
});
const getPoemTextController = (page, poemPageUrl) => __awaiter(void 0, void 0, void 0, function* () {
    yield page.goto(poemPageUrl);
    const poem = yield page.evaluate(() => {
        let poemDiv = document.querySelector(".poem_body > div:nth-child(2)");
        let poemText = poemDiv === null || poemDiv === void 0 ? void 0 : poemDiv.innerHTML.replace(/<[^>]*>/g, "");
        return poemText;
    });
    return poem;
});
