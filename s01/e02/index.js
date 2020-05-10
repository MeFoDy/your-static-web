const { chromium } = require('playwright');
const fs = require('mz/fs');

function getNumberFromString(string) {
    return Number(string.replace(/[^\d]/gi, ''));
}

async function getSocialData(browser, url, getter) {
    const page = await browser.newPage();
    await page.goto(url);

    return await getter(page);
}

async function getTwitterData(browser) {
    const result = await getSocialData(
        browser,
        'https://twitter.com/webstandards_ru',
        async page => {
            await page.waitForSelector(`text=/^Followers$/i`);
            const span = await page.$(`text=/^Followers$/i`);

            const followers = await page.evaluate(async span => {
                return span.parentNode.parentNode.getAttribute('title');
            }, span);

            return followers;
        }
    );

    return getNumberFromString(result);
}

async function getVkData(browser) {
    const result = await getSocialData(browser, 'https://vk.com/webstandards_ru', async page => {
        const followers = await page.evaluate(() => {
            const span = document.querySelector('#public_followers .module_header .header_count');
            return span.textContent;
        });

        return followers;
    });

    return getNumberFromString(result);
}

async function getFacebookData(browser) {
    const result = await getSocialData(
        browser,
        'https://www.facebook.com/webstandardsru/',
        async page => {
            await page.waitForSelector('#PagesProfileHomeSecondaryColumnPagelet');
            const span = await page.$(`text=/^Подписаны.+$/i`);
            const followers = await span.textContent();

            return followers;
        }
    );

    return getNumberFromString(result);
}

async function getTelegramData(browser) {
    const result = await getSocialData(browser, 'https://t.me/webstandards_ru', async page => {
        const followers = await page.evaluate(() => {
            const span = document.querySelector('.tgme_page_extra');
            return span.textContent;
        });

        return followers;
    });

    return getNumberFromString(result);
}

(async () => {
    const currentData = JSON.parse(await fs.readFileSync('data.json'));

    const browser = await chromium.launch();

    const twitter = await getTwitterData(browser);
    const vk = await getVkData(browser);
    const facebook = await getFacebookData(browser);
    const telegram = await getTelegramData(browser);

    await browser.close();

    const date = new Date();
    const dateString = `${date.getUTCFullYear()}.${(date.getUTCMonth() + 1)
        .toString()
        .padStart(2, '0')}.${date.getUTCDate().toString().padStart(2, '0')}`;

    const newDay = {
        vk,
        twitter,
        facebook,
        telegram,
        date: dateString,
    };

    const thisDayInData = currentData.findIndex(day => day.date === dateString);

    if (thisDayInData !== -1) {
        currentData[thisDayInData] = newDay;
    } else {
        currentData.push(newDay);
    }

    await fs.writeFileSync('data.json', JSON.stringify(currentData, null, '  '));
})();
