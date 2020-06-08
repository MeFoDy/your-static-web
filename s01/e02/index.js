const { chromium } = require('playwright');
const fs = require('mz/fs');
const fetch = require('node-fetch');

function getNumberFromString(string) {
    return Number(string.replace(/[^\d]/gi, ''));
}

async function getSocialData(browser, url, getter) {
    const page = await browser.newPage();
    await page.goto(url);

    return await getter(page);
}

async function getTwitterData() {
    const url =
        'https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=webstandards_ru';

    return await fetch(url)
        .then(res => res.json())
        .then(json => {
            return json[0].followers_count;
        });
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
            const span = await page.$(`text=/^Подписан.+$/i`);
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

    try {
        const twitter = await getTwitterData(browser);
        const vk = await getVkData(browser);
        const facebook = await getFacebookData(browser);
        const telegram = await getTelegramData(browser);

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
    } catch (e) {
        console.error(e);
    }

    await browser.close();
})();
