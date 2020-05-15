import PupParser from './PupParser'
import LamaRobot from '../captcha/LamaRobot'
import {INPUT_TYPE, RESULT} from './types'

const parser = new PupParser({headless: false})
const lamaRobot = new LamaRobot({Token: '90e2245b92d727bc3dd6aeba649a6ad4185ba716'})

export const FSSPParser = async (taskList, before, after) => {
  parser.init().then(async () => {
    const newTask = parser.createTask('fssp', {
      maxNumberOfAttempts: 3,
      errorScript: (data) => {
        if (data.createPage && data.createPage && data.createPage.page) {
          data.createPage.page.close()
        }
      }
    })

    newTask.addScript('createPage', createPage)
    newTask.addScript('searchPage', searchPage)
    newTask.addScript('resolveCaptcha', resolveCaptcha)
    newTask.addScript('parseTable', parseTable)

    await parser.runSeries('fssp', taskList, {
      numberOfThreads: 1,
      after,
      before,
    })

    await parser.browser.close()
  })
}

async function createPage(data) {
  const page = await parser.createPage('http://fssprus.ru/iss/ip')
  return {page}
}

async function searchPage(data) {
  try {
    const initial = data.initial
    const page = data.createPage.page

    const inputData = [
      {selector: '#input01', value: initial['Имя']},
      {selector: '#input02', value: initial['Фамилия']},
      {selector: '#input05', value: initial['Отчество']},
      {selector: '#input06', value: initial['Дата']},
      {
        selector: '#region_id_chosen > div > div > input',
        value: 'Все регионы',
        options: {type: INPUT_TYPE.KEYBOARD},
        afterInput: async () => {
          await page.waitFor(200) // TODO
          await page.keyboard.press('Enter')
        }
      },
    ]

    await parser.fillForm(page, inputData)
    await page.waitFor(200)
    // page.screenshot({path: `./screen/test${+new Date()}.png`})
    await page.click('#btn-sbm')
    await parser.waitForResponse(page, 'https://is.fssprus.ru/ajax_search')

    return {page}
  } catch (error) {
    // console.log(error)
    // await page.screenshot({path: `./screen/scripts/searchPage/${+new Date()}.png`})
    throw error
  }
}

async function resolveCaptcha(data) {
  const {page} = data.searchPage
  try {
    let captchaImage, inputString

    for (let i = 0; i < 3; i++) {
      captchaImage = await page.evaluate('document.querySelector("#capchaVisual").getAttribute("src")')

      inputString = await lamaRobot.solveCaptcha(captchaImage)

      if (inputString && !inputString.error) {

        await parser.fillInput(page, {
          selector: '#captcha-popup-code',
          value: inputString,
          afterInput: async () => {
            await page.focus('#captcha-popup-code')
            await page.keyboard.press('Enter')
            // console.log('captcha: ', inputString)
          }
        })

        await parser.waitForResponse(page, 'https://is.fssprus.ru/ajax_search')

        if (!(await page.$('.b-form__label.b-form__label--error'))) {
          break
        } else {
          console.error('Invalid captcha: ', inputString && !inputString.error)
          await page.screenshot({path: `./screen/${+new Date()}.png`})
        }
      }
      else {
        console.error('Invalid captcha: ', inputString && !inputString.error)
        await page.screenshot({path: `./screen/${+new Date()}.png`})
        page.click('#capchaVisual')
        await parser.waitForResponse(page,  'data:image')
      }
    }


    return {page}
  } catch(error) {
    // console.error(error)
    // await page.screenshot({path: `./screen/scripts/resolveCaptcha/${+new Date()}.png`})
    throw error
  }
}

async function parseTable(data) {
  const {page} = data.resolveCaptcha
  try {
    const initial = data.initial

    // проверка наличия данных
    if (await page.$('.b-search-message')) {
      await page.close()
      return [
        [
          `${initial['Имя']} ${initial['Фамилия']} ${initial['Отчество']} ${initial['Дата']}`,
          'Нет данных', 'Нет данных', 'Нет данных', 'Нет данных', 'Нет данных', 'Нет данных'
        ]
      ]
    }

    const getTableData = async () => {
      try {
        return await page.evaluate(`
        var rows = document.querySelector('table').rows
        rows.map = [].map
        rows.map((row, index) => {
          if (index < 2) return null
          const cells = row.cells
          cells.map = [].map
          return cells.map((cell, index) => {
            if (index === 4) return null
            return cell.innerHTML.replace(/<br>/g, '; ') //.replace(/,/g, ';  ')
          }).filter(cell => cell !== null)
        }).filter(row => row !== null)
      `)
      } catch(e) {
        // page.screenshot({path: `./screen/tableErrors/${+new Date}.png`})
      }
    }

    let tableData = [...await getTableData()]

    // сбор данных таблицы по страницам
    while (await page.$('.pagination .active + a')) {
      await page.click('.pagination .active + a')
      await parser.waitForResponse(page, 'https://is.fssprus.ru/ajax_search')

      // проверка наличия запроса капчи
      try {
        if (await page.waitFor('#capchaVisual', {timeout: 200})) {
          await resolveCaptcha(data)
        }
      } catch (e) {}

      tableData = [...tableData, ...await getTableData()]
    }

    await page.close()
    return tableData
  } catch (error) {
    // console.log(error)
    // await page.screenshot({path: `./screen/scripts/searchPage/${+new Date()}.png`})
    throw error
  }

}

async function pageInterceptors(page) {
  page.on('request', async (interceptedRequest) => {
    // console.log(interceptedRequest.url().slice(0, 75))
    const url = interceptedRequest.url()
    if (
      /getUserRegionCode/.test(url)
      || interceptedRequest.resourceType() === 'font'
      || url.startsWith('https://mc.yandex.ru/')
      || url.startsWith('http://stat.sputnik.ru/')
      || (interceptedRequest.resourceType() === 'image' && !url.startsWith('data:'))
    ) {
      interceptedRequest.continue()
    } else {
      interceptedRequest.continue()
    }
  })
}
