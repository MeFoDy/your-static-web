(async () => {
    const { chromium } = require('playwright');

    const browser = await chromium.launch();

    const page = await browser.newPage();
    await page.goto('https://web-standards.ru/articles/a-content-slider/');

    await page.pdf({
        path: 'page.pdf',
        printBackground: true,
        preferCSSPageSize: true,
    });

    await browser.close();
})();
