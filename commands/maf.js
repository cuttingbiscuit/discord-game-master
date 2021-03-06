/*{
    "maf": n,    // обычный маф
    "don": bool, // доп маф
    "doc": bool, //
    "com": bool, //
}*/

//const { DiscordAPI } = require('../discord/discordapi')

const { DiscordAPI } = require('../discord/discordapi')
const { shuffle } = require('../utils')

//Возвращает рандомного пользователя (номер)

function formRules(maf, don, com, doc, pCount, mId, recieved) {
    pCount -= (maf + don + doc + com)
    let embed = {
        "title": "Роли",
        "description": "Информация об игре",
        "color": 6888224,
        "fields": [
            {
                "name": "Ведущий",
                "value": `<@!${mId}>`
            },
            {
                "name": "Мирные :slight_smile:",
                "value": `Количество - ${pCount}`,
            },

        ]
    }

    if (maf)
        embed.fields.push(
            {
                "name": "Мафия :spy:",
                "value": `Количество - ${maf}`
            },
        )

    if (don)
        embed.fields.push(
            {
                "name": `\:tophat:`,
                "value": "Дон",
                "inline": true
            }
        )
    if (com)
        embed.fields.push(
            {
                "name": ":mag:",
                "value": "Комиссар",
                "inline": true
            }
        )
    if (doc)
        embed.fields.push(
            {
                "name": ":pill:",
                "value": "Врач",
                "inline": true
            }
        )

    // let showRules = 'В этой игре: '

    //     showRules += 'Мафия: ' + rules.maf + '\n'
    // showRules += 'Дон: ' + rules.don ? '\:white_check_mark:' : '\:x:'
    // showRules += 'Доктор: ' + rules.doc ? '\:white_check_mark:' : '\:x:'
    // showRules += 'Коммисар: ' + rules.com ? '\:white_check_mark:' : '\:x:'
    // showRules += 'Мирных жителей: ' + pCount

    recieved.channel.send({ embed })
}
let Game = 0
async function run(client, recieved) {
    const myDiscord = new DiscordAPI(client, recieved)  //Инит апи нашей

    let command = recieved.content.split(' ').slice(1)  //Убираем первое слово ака команда

    let masterId = '' // сохраняет ведущего
    let viewersId = [] // зрители
    let players = [] // игроки
    //
    if (command.length > 0) { //Значит указан ведущий
        const reg = /\d+/
        masterId = command.shift().match(reg)   //Получили айди админа

        command.forEach(el => {
            let id = el.match(reg)
            if (id)
                viewersId.push(id[0])
        })

        players = await myDiscord.getAllConnectedMembers(myDiscord.getVoiceChannel())

        players = players.filter(el => {
            return (!viewersId.includes(el) && el != masterId)
        })

        let { maf, don, com, doc } = require('../games/mafia.json')[players.length] //Читаю правила (массив)

        if (players.length >= 4) {
            Game++
            const numOfGame = 'Игра №' + Game + '\n'
            let forVedushii = 'Роли:\n'
            formRules(maf, don, com, doc, players.length, masterId, recieved)
            shuffle(players).forEach(el => {
                if (maf > 0) {
                    myDiscord.sendRole(el, numOfGame + "Ты мафия. Обыкновенная мафия(не дон)")
                    forVedushii += `<@${el}> - мафия\n`
                    maf--
                } else if (don) {
                    myDiscord.sendRole(el, numOfGame + "Ты дон. Рули парадом мафиози")
                    forVedushii += `<@${el}> - дон\n`
                    don = false
                } else if (doc) {
                    myDiscord.sendRole(el, numOfGame + "Ты доктор. Лечи людей :)")
                    forVedushii += `<@${el}> - доктор\n`
                    doc = false
                } else if (com) {
                    myDiscord.sendRole(el, numOfGame + "Ты комиссар . Надо вычислить мафию")
                    forVedushii += `<@${el}> - комиссар\n`
                    com = false
                } else {
                    myDiscord.sendRole(el, numOfGame + "Ты мирный житель. Веселой игры :D ")
                }
            })

            let deleteBeforeDash = (nick) => {
                nick = nick.split('-')
                if (nick.length > 1)
                    nick = nick[1]
                else
                    nick = nick[0]
                nick = nick.trim()
                return nick
            }
            shuffle(players).forEach(async (el, i) => {
                let oldNick = await myDiscord.getNickname(el)

                oldNick = deleteBeforeDash(oldNick)

                let newNick = ((i + 1) >= 10) ? ('l' + (i + 1) % 10) : (i + 1) + ' - ' + oldNick

                if (myDiscord.isOwner(el))
                    recieved.channel.send(`Не могу изменить никнейм владельцу севрера! <@${el}>, измени свой никнейм на ${newNick}`)
                else
                     myDiscord.setNickname(el, newNick)
            })

            let masterName = await myDiscord.getNickname(masterId)
            masterName = 'Ведущий - ' + deleteBeforeDash(masterName)
            if (myDiscord.isOwner(`${masterId}`))
                recieved.channel.send(`Не могу изменить никнейм владельцу севрера! <@${masterId}>, измени свой никнейм на ${masterName}`)
            else
                myDiscord.setNickname(masterId, masterName)        
            myDiscord.sendRole(masterId, forVedushii)
        } else {    
            throw 'Слишком мало человек в голосовом канале. Позовите побольше друзей и начинайте игру'
        }

    } else {
        throw 'Вы не указали ведущего в данной партии.'
    }

}
module.exports.run = run
