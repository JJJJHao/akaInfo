const akaManager = "tz1WCYsbPyHTBcnj4saWG6SRFHECCj2TTzC6"
const tdManager = "tz1hmpmvpEzrdcvYjunNEGGEtSQgSEwt39ge"
const akaMinter = "KT1ULea6kxqiYe1A7CZVfMuGmTx7NmDGAph1"
const akaNFTContract = "KT1AFq5XorPduoYyWxs5gEyrFK6fVjJVbtCj"
const accountAPI = "https://api.tzkt.io/v1/accounts"
const collectionAPI = "https://akaswap.com/data/collections_mainnet.json"
const transactionAPI = "https://api.tzkt.io/v1/operations/transactions"
const storageAPI = "https://api.tzkt.io/v1/contracts/{0}/storage"
const bigmapAPI = "https://api.tzkt.io/v1/bigmaps/{0}/keys"
const opHashLink = "https://tzkt.io/"
const objktGraphqlAPI = "https://data.objkt.com/v3/graphql"


const akaAuction = "KT1B2BN4qgmtsaoLRhhnFVDNoTyybwTfdrE4"
const akaBundleV2 = "KT1SbPeJafLwJvp39ZMTfM4giNSghym3FJk8"
const akaBundleV1 = "KT1NL8H5GTAWrVNbQUxxDzagRAURsdeV3Asz"
const akaGacha = "KT1JRVrBzSyEX1xnidEgMkujeuc2Q6j5FJzB"
const akaOffer = "KT1J2C7BsYNnSjQsGoyrSXShhYGkrDDLVGDd"
const akaMetaverseV2 = "KT1Dn3sambs7KZGW88hH2obZeSzfmCmGvpFo"
const akaMetaverseV1 = "KT1HGL8vx7DP4xETVikL4LUYvFxSV19DxdFN"

const akaDropV1 = "KT1QZ7nCoug95CDHT6JhcfwMKipJ7UxDaKo9"
const akaDropV1_1 = "KT1Dag396rQYpBKPtSFEUDfJHUysvRyoQALi"
const akaDropV1_2 = "KT1GyHsoewbUGk4wpAVZFUYpP2VjZPqo1qBf"
const akaChargeV1 = "KT1TZLHB88sPT6z4w7oe13F1pgZpRc4tSHjL"
const akaChargeV1_1 = "KT1NsaxAY49uGVMUuuBHHZa6dznzGCjVBxNm"

const allDropJoin = [akaDropV1, akaDropV1_1, akaDropV1_2].join(",")


const akaBrokerV1 = "KT1PEdN7Ghy3WTzuWhQGdDM4NFD7J2xuZVNM"

let chargeFeeListV1 = []
let chargeFeeListV2 = []

const akaDropChargeNameMap = {
    "AKADROP_MAKE_POOL_EDITION_TEZ": "版次費",
    "AKADROP_MAKE_POOL_LOW_EDITION_TEZ": "低版版次費",
    "AKADROP_MAKE_POOL_TEZ": "開辦費",
    "AKADROP_REFRESHABLE_TEZ": "動態更新QRCode費"
}

const DATE_ERROR_MSG = "ERROR! \"From Date\" or \"To Date\" CANNOT be empty."

const akaDAOQuipuExchange = "KT1Qej1k8WxPvBLUjGVtFXStgzQtcx3itSk5"
const priceCount = 5

const allMarketList = [akaAuction, akaBundleV2, akaBundleV1, akaGacha, akaOffer, akaMetaverseV2, akaMetaverseV1]
const allMarketJoin = allMarketList.join(",")

const ignoreCollectionList = [
    "hicetnunc",
    "fxhash-genesis",
    "fxhash",
    "fxparams",
    "momapostcard"
]

async function getAPIData(APIUrl, params = {}) {
    let result = []
    let offset = 0
    params["limit"] = 10000
    while (true) {
        params["offset"] = offset
        let apiResult = await fetch(APIUrl + "?" + new URLSearchParams(params)).then(response => response.json())
        if (apiResult.length == 0)
            break
        result = result.concat(apiResult)
        if (apiResult.length < 10000)
            break
        offset += 10000
    }
    return result
}

async function getBurnedTokenData(startDatePlusStr, endDatePlusStr) {

    const query_burnedToken = `
    query getBurnedToken($startTime: timestamptz, $endTime: timestamptz, $offset: Int) {
        token(
            offset: $offset,
            where: {
                fa_contract: {
                    _eq: "KT1AFq5XorPduoYyWxs5gEyrFK6fVjJVbtCj"
                }, 
                timestamp: {
                    _gte: $startTime, 
                    _lt: $endTime
                }, 
                supply: {
                    _eq: "0"
                }
            }
        ) {
            supply
        }
    }
    `;
    let result = []
    let offset = 0
    while (true) {
        const apiResult = await fetch(objktGraphqlAPI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query_burnedToken,
                variables: {
                    startTime: startDatePlusStr,
                    endTime: endDatePlusStr,
                    offset: offset
                },
                operationName: 'getBurnedToken'
            }),
        })
            .then((res) => res.json())
        // console.log(apiResult)
        const listResult = apiResult.data.token
        if (listResult.length == 0)
            break
        result = result.concat(listResult)
        if (listResult.length < 500)
            break
        offset += 500
    }
    return result
}

async function generateChargeFeeList() {
    const updateChargeV1Data = await getAPIData(transactionAPI,
        {
            "target": akaChargeV1,
            "status": "applied",
            "entrypoint": "_update_charge_data",
            "sort.asc": "level"
        }
    )

    let feeMap = {}
    for (let i = 0; i < updateChargeV1Data.length; i++) {
        const updateData = updateChargeV1Data[i].parameter.value
        for (let j = 0; j < updateData.length; j++) {
            const feeData = updateData[j]
            feeMap[feeData.charge_type] = {
                "per": parseInt(feeData.charge_data?feeData.charge_data.per:1),
                "price": parseInt(feeData.charge_data?feeData.charge_data.price.tez:0)
            }
        }
        chargeFeeListV1.push({
            "startTime": Date.parse(updateChargeV1Data[i].timestamp),
            "feeMap": JSON.parse(JSON.stringify(feeMap))
        })
    }

    const updateChargeV2Data = await getAPIData(transactionAPI,
        {
            "target": akaChargeV1_1,
            "status": "applied",
            "entrypoint": "_update_charge_data",
            "sort.asc": "level"
        }
    )
    feeMap = {}
    for (let i = 0; i < updateChargeV2Data.length; i++) {
        const updateData = updateChargeV2Data[i].parameter.value
        for (let j = 0; j < updateData.length; j++) {
            const feeData = updateData[j]
            feeMap[feeData["charge_type"]] = {
                "per": parseInt(feeData.charge_data?feeData.charge_data.per:1),
                "price": parseInt(feeData.charge_data?feeData.charge_data.price.tez:0)
            }
        }
        chargeFeeListV2.push({
            "startTime": Date.parse(updateChargeV2Data[i].timestamp),
            "feeMap": JSON.parse(JSON.stringify(feeMap))
        })
    }
}

async function getAlias(address){
    accountData = await fetch(accountAPI + "?address=" + address).then(response => response.json())
    if (accountData == undefined || accountData.length == 0)
        return address
    else if (accountData[0].hasOwnProperty('alias'))
        return accountData[0].alias
    else
        return address
}

async function getAliasMap(addresses){
    let result = {}
    const BATCH_NUM = 100
    for(let i = 0; i < addresses.length; i += BATCH_NUM){
        let lastIdx = i + BATCH_NUM
        if(lastIdx >= addresses.length)
            lastIdx = addresses.length
        const subAddrs = addresses.slice(i, lastIdx)
        
        accountsData = await fetch(accountAPI + "?address.in=" + subAddrs.join(",")).then(response => response.json())
        for(let j = 0; j < accountsData.length; j++){
            const addr = accountsData[j].address
            if ("alias" in accountsData[j])
                result[addr] = accountsData[j].alias
            else
                result[addr] = addr
        }
    }
    return result
}

let startDateZStr = "2000-01-01T16:00:00Z"
let endDateZStr = "2000-01-01T16:00:00Z"
let startDatePlusStr = "2000-01-01T16:00:00+00:00"
let endDatePlusStr = "2000-01-01T16:00:00+00:00"

function setStartEndTime(){
    const inputStartDate = document.getElementById("startDate").value
    const inputEndDate = document.getElementById("endDate").value

    if(inputStartDate == "" || inputEndDate == ""){
        alert(DATE_ERROR_MSG)
        return false
    }
    

    let utcStartDate = new Date(inputStartDate)
    utcStartDate.setDate(utcStartDate.getDate() - 1)
    const startDate = utcStartDate.getFullYear() + '-' + ('0' + (utcStartDate.getMonth() + 1)).slice(-2) + '-' + ('0' + (utcStartDate.getDate())).slice(-2)

    let utcEndDate = new Date(inputEndDate)
    utcEndDate.setDate(utcEndDate.getDate() - 1)
    const endDate = utcEndDate.getFullYear() + '-' + ('0' + (utcEndDate.getMonth() + 1)).slice(-2) + '-' + ('0' + (utcEndDate.getDate())).slice(-2)

    startDateZStr = startDate + "T16:00:00Z"
    endDateZStr = endDate + "T16:00:00Z"
    startDatePlusStr = startDate + "T16:00:00+00:00"
    endDatePlusStr = endDate + "T16:00:00+00:00"
    return true
}

function setFetching(elementId, msg = "Fetching data...") {
    document.getElementById(elementId).className = "hint alert alert-primary"
    document.getElementById(elementId).innerHTML = msg
}

function setSuccess(elementId, msg) {
    document.getElementById(elementId).className = "hint alert alert-success"
    document.getElementById(elementId).innerHTML = msg
}

function setFailed(elementId, msg) {
    document.getElementById(elementId).className = "hint alert alert-danger"
    document.getElementById(elementId).innerHTML = msg
}

function tezMap2String(data) {
    let result = ""
    for (const [key, value] of Object.entries(data))
        result += "<a href=\"" + opHashLink + key + "\" target=\"_blank\">" + value.name + "</a> : " + (value.amount / 1000000).toString() + " tez<br/>"
    return (result == "") ? "NO DATA" : result
}

function sendOpHashMap2Link(data) {
    let result = "支出詳細:<br/>"
    for (const [key, value] of Object.entries(data))
        result += "<a href=\"" + opHashLink + key + "\" target=\"_blank\">" + (value.amount / 1000000).toString() + " tez → " + value.name + "</a><br/>"
    return result
}

function sendOpHashMap2Link(data) {
    let result = "支出詳細:<br/>"
    for (const [key, value] of Object.entries(data))
        result += "<a href=\"" + opHashLink + key + "\" target=\"_blank\">" + (value.amount / 1000000).toString() + " tez → " + value.name + "</a><br/>"
    return result
}

function clearResult() {
    for (const resultElement of document.getElementsByClassName("result"))
        resultElement.innerHTML = ""
    
    for (const resultElement of document.getElementsByClassName("hint")){
        resultElement.className = "hint"
        resultElement.innerHTML = ""
    }

}

function flatten(data) {
    var result = {};
    function recurse(cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            for (var i = 0, l = cur.length; i < l; i++)
                recurse(cur[i], prop + "[" + i + "]");
            if (l == 0)
                result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop + "." + p : p);
            }
            if (isEmpty && prop)
                result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
}

function findLedgerBigMapNum(storageData) {
    if ("ledger" in storageData)
        return (storageData.ledger).toString()
    const flattenData = flatten(storageData)
    let allKeys = Object.keys(flattenData)
    for(let i = 0; i < allKeys.length; i++){
        if (allKeys[i].endsWith(".ledger"))
            return (flattenData[allKeys[i]]).toString()
    }
    return "-1"
}

function generateNewSet(setMap, addrList){
    addrList.forEach((addr, idx) => {
        setMap[addr] = {
            "set": new Set(),
            "count": 0
        }
    })
}

async function fetchAkaWallet(fetchTime){
    if(fetchTime && !setStartEndTime()){
        setFailed("akaWallet-hint", DATE_ERROR_MSG)
        return
    }


    setFetching("akaWallet-hint")

    // rec
    const akaRecData = await getAPIData(transactionAPI,
        {
            "target": akaManager,
            "status": "applied",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )
    let recMap = {}
    let totalRec = 0
    for (let i = 0; i < akaRecData.length; i++) {
        const recData = akaRecData[i]
        if (recData.amount == 0)
            continue
        let name = recData.sender.alias
        if (name == undefined || name == "")
            name = recData.sender.address
        const addr = recData.sender.address
        if (!(addr in recMap))
            recMap[addr] = { "amount": 0, "name": name }
        recMap[addr].amount += recData.amount
        totalRec += recData.amount
    }
    document.getElementById("akaRec-result").innerHTML =
        "共 <b>" + (totalRec / 1000000).toString() + "</b> tez<br/>"
        + tezMap2String(recMap)

    // send
    const akaSendData = await getAPIData(transactionAPI,
        {
            "sender": akaManager,
            "status": "applied",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )
    let sendMap = {}
    let sendOpHashMap = {}
    let totalSend = 0
    for (let i = 0; i < akaSendData.length; i++) {
        const sendData = akaSendData[i]
        if (sendData.amount == 0)
            continue
        let name = sendData.target.alias
        if (name == undefined || name == "")
            name = sendData.target.address
        const addr = sendData.target.address
        if (!(addr in sendMap))
            sendMap[addr] = { "amount": 0, "name": name }
        sendMap[addr].amount += sendData.amount
        totalSend += sendData.amount
        sendOpHashMap[sendData.hash] = { "amount": sendData.amount, "name": name }
    }
    document.getElementById("akaSend-result").innerHTML =
        "共 <b>" + (totalSend / 1000000).toString() + "</b> tez<br/>"
        + tezMap2String(sendMap)
    document.getElementById("akaSend-result-list").innerHTML = sendOpHashMap2Link(sendOpHashMap)

    setSuccess("akaWallet-hint", "Done!")
}

async function fetchAkaBroker(fetchTime){
    if(fetchTime && !setStartEndTime()){
        setFailed("akaBroker-hint", DATE_ERROR_MSG)
        return
    }
    setFetching("akaBroker-hint")

    const brokerDataV1 = await getAPIData(transactionAPI,
        {
            "target": akaBrokerV1,
            "sender.in": "KT1PALN4Gukz39weupsJGwziieTVJtqt3XxX,tz1UQrVHHrcvqiwdNTicGfQ6xwQPwCDnEm1d",
            "status": "applied",
            "entrypoint": "buy_for",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )

    let buyerSet = new Set()
    let totalAmount = 0
    let resultList = []
    let akaBrokerListResult = ""

    for (let i = 0; i < brokerDataV1.length; i++) {
        const buyForParam = brokerDataV1[i].parameter.value
        resultList.push(
            {
                address: buyForParam.target,
                hash: brokerDataV1[i].hash,
                tezString: (brokerDataV1[i].amount / 1000000).toString()
            }
        )
        
        
        buyerSet.add(buyForParam.target)
        totalAmount += brokerDataV1[i].amount
    }

    const aliasMap = await getAliasMap(Array.from(buyerSet))

    for(let i = 0; i < resultList.length; i++){
        akaBrokerListResult += "<a href=\"" + opHashLink + resultList[i].address + "\" target=\"_blank\">" + aliasMap[resultList[i].address] + "</a> "
        akaBrokerListResult += "<a href=\"" + opHashLink + resultList[i].hash + "\" target=\"_blank\">刷了 <b>" + resultList[i].tezString + "</b> tez</a><br/>"
    }

    document.getElementById("akaBroker-result").innerHTML = 
    "共計 " + brokerDataV1.length.toString() + " 次刷卡購買<br/>" + 
    "共有 " + buyerSet.size.toString() + " 人刷卡購買<br/>" + 
    "共刷了 <b>" + (totalAmount / 1000000).toString() + "</b> tez <br/>"

    document.getElementById("akaBroker-result-list").innerHTML = akaBrokerListResult

    setSuccess("akaBroker-hint", "Done!")
}

async function fetchAkaDrop(fetchTime) {
    if(fetchTime && !setStartEndTime()){
        setFailed("akaDrop-hint", DATE_ERROR_MSG)
        return
    }

    setFetching("akaDrop-hint")

    await generateChargeFeeList()

    let chargeAmountMap = {}
    let detailList = []

    let dropUserCount = 0
    let dropUserSet = new Set()
    const dropData = await getAPIData(transactionAPI,
        {
            "target.in": allDropJoin,
            "status": "applied",
            "entrypoint": "drop",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )
    for (let i = 0; i < dropData.length; i++) {
        const dropDataList = dropData[i].parameter.value
        for(let j = 0; j < dropDataList.length; j++)
            dropUserSet.add(dropDataList[j].target)
        dropUserCount += dropDataList.length
    }
    let makePoolUserSet = new Set()
    const makePoolData = await getAPIData(transactionAPI,
        {
            "target.in": allDropJoin,
            "status": "applied",
            "entrypoint": "make_pool",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )
    for (let i = 0; i < makePoolData.length; i++)
        makePoolUserSet.add(makePoolData[i].sender.address)

    document.getElementById("akaDrop-user-result").innerHTML = 
        "領取Drop次數：" + dropUserCount + " 次<br/>" + 
        "領取Drop人數：" + dropUserSet.size + " 人<br/><br/>" + 
        "製作Drop次數：" + makePoolData.length + " 次<br/>" + 
        "製作Drop人數：" + makePoolUserSet.size + " 人"
    

    const chargeDataV1 = await getAPIData(transactionAPI,
        {
            "sender.in": allDropJoin,
            "target": akaChargeV1,
            "status": "applied",
            "entrypoint": "charge",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )
    for (let i = 0; i < chargeDataV1.length; i++) {
        const chargeDataList = chargeDataV1[i].parameter.value
        let feeIndex = -1
        for (let j = 0; j < chargeFeeListV1.length; j++) {
            if (Date.parse(chargeDataV1[i].timestamp) < chargeFeeListV1[j].startTime)
                break
            feeIndex += 1
        }
        let consumerName = chargeDataV1[i].initiator.alias
        if (consumerName == undefined || consumerName == "")
            consumerName = chargeDataV1[i].initiator.address
        consumerDetail = {
            "consumer": consumerName,
            "address": chargeDataV1[i].initiator.address,
            "opHash": chargeDataV1[i].hash,
            "charge": {}
        }
        for (let j = 0; j < chargeDataList.length; j++) {
            const chargeData = chargeDataList[j]
            const feeData = chargeFeeListV1[feeIndex]["feeMap"][chargeData.charge_name]
            const chargeAmount = parseInt(chargeData.amount)
            const price = Math.ceil(chargeAmount / feeData.per) * feeData.price
            if (!(chargeData.charge_name in chargeAmountMap))
                chargeAmountMap[chargeData.charge_name] = 0
            chargeAmountMap[chargeData.charge_name] += price
            consumerDetail.charge[chargeData.charge_name] = price
        }
        detailList.push(consumerDetail)
    }

    const chargeDataV2 = await getAPIData(transactionAPI,
        {
            "sender.in": allDropJoin,
            "target": akaChargeV1_1,
            "status": "applied",
            "entrypoint": "charge",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )


    for (let i = 0; i < chargeDataV2.length; i++) {
        const chargeDataList = chargeDataV2[i].parameter.value
        let feeIndex = -1
        for (let j = 0; j < chargeFeeListV2.length; j++) {
            if (Date.parse(chargeDataV2[i].timestamp) < chargeFeeListV2[j].startTime)
                break
            feeIndex += 1
        }
        let consumerName = chargeDataV2[i].initiator.alias
        if (consumerName == undefined || consumerName == "")
            consumerName = chargeDataV2[i].initiator.address
        consumerDetail = {
            "consumer": consumerName,
            "address": chargeDataV2[i].initiator.address,
            "opHash": chargeDataV2[i].hash,
            "charge": {}
        }
        for (let j = 0; j < chargeDataList.length; j++) {
            const chargeData = chargeDataList[j]
            const feeData = chargeFeeListV2[feeIndex]["feeMap"][chargeData.charge_name]
            const chargeAmount = parseInt(chargeData.amount)
            const price = Math.ceil(chargeAmount / feeData.per) * feeData.price
            if (!(chargeData.charge_name in chargeAmountMap))
                chargeAmountMap[chargeData.charge_name] = 0
            chargeAmountMap[chargeData.charge_name] += price
            consumerDetail.charge[chargeData.charge_name] = price
        }
        detailList.push(consumerDetail)
    }

    let akaDropResult = ""
    for (const [key, value] of Object.entries(chargeAmountMap))
        akaDropResult += akaDropChargeNameMap[key] + "：" + (value / 1000000).toString() + " tez<br/>"
    document.getElementById("akaDrop-result").innerHTML = akaDropResult


    let akaDropListResult = ""
    for (let i = 0; i < detailList.length; i++) {
        const detailData = detailList[i]
        akaDropListResult += "<a href=\"" + opHashLink + detailData.address + "\" target=\"_blank\">" + detailData.consumer + "</a> "
        akaDropListResult += "<a href=\"" + opHashLink + detailData.opHash + "\" target=\"_blank\">製作Drop</a><br/>"
        let totalAmount = 0
        for (const [key, value] of Object.entries(detailData.charge))
            if (value > 0) {
                totalAmount += value
                akaDropListResult += akaDropChargeNameMap[key] + "：" + (value / 1000000).toString() + " tez<br/>"
            }
        akaDropListResult += "<b>共計花費 " + (totalAmount / 1000000).toString() + " tez</b><br/>"
    }
    document.getElementById("akaDrop-result-list").innerHTML = akaDropListResult

    setSuccess("akaDrop-hint", "Done!")
}

async function fetchTDWallet(fetchTime){
    if(fetchTime && !setStartEndTime()){
        setFailed("tdWallet-hint", DATE_ERROR_MSG)
        return
    }

    setFetching("tdWallet-hint")

    // rec
    const tdRecData = await getAPIData(transactionAPI,
        {
            "target": tdManager,
            "status": "applied",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )
    recMap = {}
    totalRec = 0
    for (let i = 0; i < tdRecData.length; i++) {
        const recData = tdRecData[i]
        if (recData.amount == 0)
            continue
        let name = recData.sender.alias
        if (name == undefined || name == "")
            name = recData.sender.address
        const addr = recData.sender.address
        if (!(addr in recMap))
            recMap[addr] = { "amount": 0, "name": name }
        recMap[addr].amount += recData.amount
        totalRec += recData.amount
    }
    document.getElementById("tdRec-result").innerHTML =
        "共 <b>" + (totalRec / 1000000).toString() + "</b> tez<br/>"
        + tezMap2String(recMap)

    // send
    const tdSendData = await getAPIData(transactionAPI,
        {
            "sender": tdManager,
            "status": "applied",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )
    sendMap = {}
    sendOpHashMap = {}
    totalSend = 0
    for (let i = 0; i < tdSendData.length; i++) {
        const sendData = tdSendData[i]
        if (sendData.amount == 0)
            continue
        let name = sendData.target.alias
        if (name == undefined || name == "")
            name = sendData.target.address
        const addr = sendData.target.address
        if (!(addr in sendMap))
            sendMap[addr] = { "amount": 0, "name": name }
        sendMap[addr].amount += sendData.amount
        totalSend += sendData.amount
        sendOpHashMap[sendData.hash] = { "amount": sendData.amount, "name": name }
    }
    document.getElementById("tdSend-result").innerHTML =
        "共 <b>" + (totalSend / 1000000).toString() + "</b> tez<br/>"
        + tezMap2String(sendMap)
    document.getElementById("tdSend-result-list").innerHTML = sendOpHashMap2Link(sendOpHashMap)

    setSuccess("tdWallet-hint", "Done!")
}

async function fetchAkaStat(fetchTime){
    if(fetchTime && !setStartEndTime()){
        setFailed("akaStat-hint", DATE_ERROR_MSG)
        return
    }

    setFetching("akaStat-hint")

    // mint
    const akaMintData = await getAPIData(transactionAPI,
        {
            "target": akaMinter,
            "entrypoint": "mint_akaOBJ",
            "status": "applied",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )
    const mintAmount = akaMintData.length
    let burnedAmount = 0
    if (mintAmount > 0) {
        const burnedAPIResult = await getBurnedTokenData(startDatePlusStr, endDatePlusStr)
        burnedAmount = burnedAPIResult.length
    }
    document.getElementById("akaMint-result").innerHTML =
        "總鑄造量: " + mintAmount.toString() + "<br/>" +
        "燒毀量: " + burnedAmount.toString() + "<br/>" +
        "實際鑄造量: " + (mintAmount - burnedAmount).toString()


    // buy
    const akaBuyData = await getAPIData(transactionAPI,
        {
            "target.in": allMarketJoin,
            "entrypoint.in": "bid,direct_purchase,collect_bundle,collect_gacha,make_offer,collect",
            "status": "applied",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )
    let akaAllSet = new Set()
    let buyMap = new Map()
    generateNewSet(buyMap, allMarketList)

    let allBuySet = new Set()

    akaBuyData.forEach((buyData, idx) => {
        buyMap[buyData.target.address].set.add(buyData.sender.address)
        buyMap[buyData.target.address].count += 1
        allBuySet.add(buyData.sender.address)
        akaAllSet.add(buyData.sender.address)
    })

    document.getElementById("akaBuyer-result").innerHTML =
        "共 <b>" + akaBuyData.length + "</b> 次購買行為，共 <b>" + allBuySet.size + "</b> 位買家<br/>" +
        "詳細數量:<br/>" +
        "akaMetaverse V2.1: " + buyMap[akaMetaverseV2].count + " 次購買， " + buyMap[akaMetaverseV2].set.size + " 位買家<br/>" +
        "akaMetaverse V1: " + buyMap[akaMetaverseV1].count + " 次購買， " + buyMap[akaMetaverseV1].set.size + " 位買家<br/>" +
        "akaOffer: " + buyMap[akaOffer].count + " 次喊價， " + buyMap[akaOffer].set.size + " 位買家<br/>" +
        "akaGacha: " + buyMap[akaGacha].count + " 次購買， " + buyMap[akaGacha].set.size + " 位買家<br/>" +
        "akaBundle V1: " + buyMap[akaBundleV1].count + " 次購買， " + buyMap[akaBundleV1].set.size + " 位買家<br/>" +
        "akaBundle V2: " + buyMap[akaBundleV2].count + " 次購買， " + buyMap[akaBundleV2].set.size + " 位買家<br/>" +
        "akaAuction: " + buyMap[akaAuction].count + " 次購買， " + buyMap[akaAuction].set.size + " 位買家<br/>"

    // sell
    const akaSellData = await getAPIData(transactionAPI,
        {
            "target.in": allMarketJoin,
            "entrypoint.in": "make_auction,make_bundle,make_gacha,fulfill_offer,swap",
            "status": "applied",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )

    let sellMap = new Map()
    generateNewSet(sellMap, allMarketList)

    let allSellSet = new Set()

    akaSellData.forEach((sellData, idx) => {
        sellMap[sellData.target.address].set.add(sellData.sender.address)
        sellMap[sellData.target.address].count += 1
        allSellSet.add(sellData.sender.address)
        akaAllSet.add(sellData.sender.address)
    })

    document.getElementById("akaSeller-result").innerHTML =
        "共 <b>" + akaSellData.length + "</b> 次販售行為，共 <b>" + allSellSet.size + "</b> 位賣家<br/>" +
        "詳細數量:<br/>" +
        "akaMetaverse V2.1: " + sellMap[akaMetaverseV2].count + " 次上架， " + sellMap[akaMetaverseV2].set.size + " 位賣家<br/>" +
        "akaMetaverse V1: " + sellMap[akaMetaverseV1].count + " 次上架， " + sellMap[akaMetaverseV1].set.size + " 位賣家<br/>" +
        "akaOffer: " + sellMap[akaOffer].count + " 次完成交易， " + sellMap[akaOffer].set.size + " 位賣家<br/>" +
        "akaGacha: " + sellMap[akaGacha].count + " 次上架， " + sellMap[akaGacha].set.size + " 位賣家<br/>" +
        "akaBundle V1: " + sellMap[akaBundleV1].count + " 次上架， " + sellMap[akaBundleV1].set.size + " 位賣家<br/>" +
        "akaBundle V2: " + sellMap[akaBundleV2].count + " 次上架， " + sellMap[akaBundleV2].set.size + " 位賣家<br/>" +
        "akaAuction: " + sellMap[akaAuction].count + " 次上架， " + sellMap[akaAuction].set.size + " 位賣家<br/>"

    let allMintSet = new Set()
    akaMintData.forEach((mintData, idx) => {
        allMintSet.add(mintData.sender.address)
        akaAllSet.add(mintData.sender.address)
    })


    document.getElementById("akaPeople-result").innerHTML =
        "共 <b>" + (akaBuyData.length-buyMap[akaOffer].count+sellMap[akaOffer].count) + "</b> 次交易<br/>" +
        "共 <b>" + allMintSet.size + "</b> 位鑄造NFT<br/>" +
        "共 <b>" + akaAllSet.size + "</b> 位網站使用人數"

    setSuccess("akaStat-hint", "Done!")
}

async function fetchAkaDAO(fetchTime){
    if(fetchTime && !setStartEndTime()){
        setFailed("akaDAO-hint", DATE_ERROR_MSG)
        return
    }

    setFetching("akaDAO-hint")
    // akaDAO
    const akaDAOQuipuData = await getAPIData(transactionAPI,
        {
            "target": akaDAOQuipuExchange,
            "entrypoint.in": "tezToTokenPayment,tokenToTezPayment",
            "status": "applied",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )
    if (akaDAOQuipuData.length > 0) {
        let priceResult = ""
        priceAdd = Math.floor(akaDAOQuipuData.length / (priceCount - 1))
        for (let i = 0; i < priceCount; i++) {
            const idx = (i * priceAdd >= akaDAOQuipuData.length) ? (akaDAOQuipuData.length - 1) : (i * priceAdd)
            let opDataList = await fetch(transactionAPI + "/" + akaDAOQuipuData[idx].hash).then(response => response.json())
            for (let j = 0; j < opDataList.length; j++) {
                const opData = opDataList[j]
                if (opData.target.address == akaDAOQuipuExchange) {
                    const price = parseFloat(opData.storage.storage.tez_pool) / parseFloat(opData.storage.storage.token_pool)
                    const roundPrice = Math.round(price * 1000) / 1000
                    if (i > 0)
                        priceResult += " → "
                    priceResult += roundPrice.toString() + " tez"
                    break
                }
            }
        }
        document.getElementById("akaDAO-price-result").innerHTML = priceResult
        let exchangeResult = ""
        let buySum = 0
        let sellSum = 0
        for (let i = 0; i < akaDAOQuipuData.length; i++) {
            const opData = akaDAOQuipuData[i]
            if (opData.parameter.entrypoint == "tezToTokenPayment") {
                const buyAmount = opData.amount
                buySum += buyAmount
                let name = opData.sender.alias
                if (name == undefined || name == "")
                    name = opData.sender.address
                exchangeResult += "<a href=\"" + opHashLink + opData.sender.address + "\" target=\"_blank\">" + name + "</a> <a href=\"" + opHashLink + opData.hash + "\" target=\"_blank\">購買</a> " + (buyAmount / 1000000).toString() + " tez<br/>"
            }
            else {
                const sellAmount = parseInt(opData.parameter.value.amount)
                sellSum += sellAmount
                let name = opData.sender.alias
                if (name == undefined || name == "")
                    name = opData.sender.address
                exchangeResult += "<a href=\"" + opHashLink + opData.sender.address + "\" target=\"_blank\">" + name + "</a> <a href=\"" + opHashLink + opData.hash + "\" target=\"_blank\">出售</a> " + (sellAmount / 1000000).toString() + " akaDAO<br/>"
            }
        }
        exchangeResult =
            "共計購買 <b>" + (buySum / 1000000).toString() + "</b> tez<br/>" +
            "共計出售 <b>" + (sellSum / 1000000).toString() + "</b> akaDAO<br/>" + exchangeResult
        document.getElementById("akaDAO-exchange-result").innerHTML = exchangeResult
    }
    else {
        document.getElementById("akaDAO-price-result").innerHTML = "NO DATA"
        document.getElementById("akaDAO-exchange-result").innerHTML = "NO DATA"
    }
    setSuccess("akaDAO-hint", "Done!")
}

async function search() {

    clearResult()
    if(!setStartEndTime()){
        setFailed("akaWallet-hint", DATE_ERROR_MSG)
        return
    }

    await fetchAkaWallet(false)

    await fetchAkaBroker(false)

    await fetchAkaDrop(false)

    await fetchTDWallet(false)
    
    await fetchAkaStat(false)

    await fetchAkaDAO(false)
    
    
}


async function fetchHolders() {

    document.getElementById("akaCollectionSection").style.display = "block"
    document.getElementById("akaCollection-result").innerHTML = ""
    document.getElementById("akaCollection-hint").className = "hint"
    document.getElementById("akaCollection-hint").innerHTML = ""

    const collectionInfo = await fetch(collectionAPI).then(response => response.json())
    const ignoreCollectionSet = new Set(ignoreCollectionList)
    let collectionResult = ""
    let totalTokenCount = 0
    let allCollectorSet = new Set()
    let allNonZeroCollectorSet = new Set()
    for (const [collectionKey, collectionData] of Object.entries(collectionInfo.fa2)) {
        if (ignoreCollectionSet.has(collectionKey))
            continue

        const fa2Addr = collectionData.addr
        const collectionName = collectionData.title
        setFetching("akaCollection-hint", "Fetching data in " + collectionName + " collection...")
        // Get ledger bigmap number
        const storageAPIResult = await fetch(storageAPI.replace("{0}", fa2Addr)).then(response => response.json())
        const ledgerBigMapNum = findLedgerBigMapNum(storageAPIResult)
        // Find ledger datas
        let collectorSet = new Set()
        let nonZeroCollectorSet = new Set()
        let tokenIDSet = new Set()
        const allKeyData = await getAPIData(bigmapAPI.replace("{0}", ledgerBigMapNum))
        allKeyData.forEach((keyData, idx) => {
            const collectorAddr = keyData.key.address
            tokenIDSet.add(keyData.key.nat)
            if (parseInt(keyData.value) > 0) {
                allNonZeroCollectorSet.add(collectorAddr)
                nonZeroCollectorSet.add(collectorAddr)
            }
            allCollectorSet.add(collectorAddr)
            collectorSet.add(collectorAddr)
        })
        // console.log(nonZeroCollectorSet.size)
        // console.log(collectorSet.size)
        collectionResult += collectionName + " - 現有" + (nonZeroCollectorSet.size).toString() + "位，曾有" + (collectorSet.size).toString() + "位。 共計" + (tokenIDSet.size).toString() + "個token<br/>"
        document.getElementById("akaCollection-result").innerHTML = collectionResult
        totalTokenCount += tokenIDSet.size
    }
    collectionResult += "<hr><b>統計 - 現有" + (allNonZeroCollectorSet.size).toString() + "位，曾有" + (allCollectorSet.size).toString() + "位。 共計" + totalTokenCount.toString() + "個token</b><br/>"

    document.getElementById("akaCollection-result").innerHTML = collectionResult
    setSuccess("akaCollection-hint", "Done!")

}

// async function test(){
//     fetchAkaBroker("2023-09-30T16:00:00Z", "2023-11-30T16:00:00Z")
// }