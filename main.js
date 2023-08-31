const akaManager = "tz1WCYsbPyHTBcnj4saWG6SRFHECCj2TTzC6"
const tdManager = "tz1hmpmvpEzrdcvYjunNEGGEtSQgSEwt39ge"
const akaMinter = "KT1ULea6kxqiYe1A7CZVfMuGmTx7NmDGAph1"
const akaNFTContract = "KT1AFq5XorPduoYyWxs5gEyrFK6fVjJVbtCj"
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

const akaChargeV1 = "KT1TZLHB88sPT6z4w7oe13F1pgZpRc4tSHjL"
const akaChargeV2 = "KT1NsaxAY49uGVMUuuBHHZa6dznzGCjVBxNm"

let chargeFeeListV1 = []
let chargeFeeListV2 = []

const akaDropChargeNameMap = {
    "AKADROP_MAKE_POOL_EDITION_TEZ": "版次費",
    "AKADROP_MAKE_POOL_TEZ": "開辦費",
    "AKADROP_REFRESHABLE_TEZ": "動態更新QRCode費"
}

const akaDAOQuipuExchange = "KT1Qej1k8WxPvBLUjGVtFXStgzQtcx3itSk5"
const priceCount = 5

const allMarket = ([akaAuction, akaBundleV2, akaBundleV1, akaGacha, akaOffer, akaMetaverseV2, akaMetaverseV1]).join(",")

const allResultID = [
    "akaRec-result",
    "akaSend-result",
    "akaSend-result-list",
    "akaDrop-result",
    "akaDrop-result-list",
    "tdRec-result",
    "tdSend-result",
    "tdSend-result-list",
    "akaMint-result",
    "akaBuyer-result",
    "akaSeller-result",
    "akaPeople-result",
    "akaDAO-price-result",
    "akaDAO-exchange-result"
]

const allHintID = [
    "akaWallet-hint",
    "akaDrop-hint",
    "tdWallet-hint",
    "akaStat-hint",
    "akaDAO-hint"
]

const ignoreCollectionList = [
    "hicetnunc",
    "fxhash-genesis",
    "fxhash",
    "fxparams"
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

async function generateChargeFeeList(){
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
        for(let j = 0; j < updateData.length; j++){
            const feeData = updateData[j]
            feeMap[feeData.charge_type] = {
                "per": parseInt(feeData.charge_data.per),
                "price": parseInt(feeData.charge_data.price.tez)
            }
        }
        chargeFeeListV1.push({
            "startTime": Date.parse(updateChargeV1Data[i].timestamp),
            "feeMap": JSON.parse(JSON.stringify(feeMap))
        })
    }

    const updateChargeV2Data = await getAPIData(transactionAPI,
        {
            "target": akaChargeV2,
            "status": "applied",
            "entrypoint": "_update_charge_data",
            "sort.asc": "level"
        }
    )
    feeMap = {}
    for (let i = 0; i < updateChargeV2Data.length; i++) {
        const updateData = updateChargeV2Data[i].parameter.value
        for(let j = 0; j < updateData.length; j++){
            const feeData = updateData[j]
            feeMap[feeData["charge_type"]] = {
                "per": parseInt(feeData.charge_data.per),
                "price": parseInt(feeData.charge_data.price.tez)
            }
        }
        chargeFeeListV2.push({
            "startTime": Date.parse(updateChargeV2Data[i].timestamp),
            "feeMap": JSON.parse(JSON.stringify(feeMap))
        })
    }
}


function setFetching(elementId, msg = "Fetching data...") {
    document.getElementById(elementId).className = "alert alert-primary"
    document.getElementById(elementId).innerHTML = msg
}

function setSuccess(elementId, msg) {
    document.getElementById(elementId).className = "alert alert-success"
    document.getElementById(elementId).innerHTML = msg
}

function setFailed(elementId, msg) {
    document.getElementById(elementId).className = "alert alert-danger"
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
    for (let i = 0; i < allResultID.length; i++)
        document.getElementById(allResultID[i]).innerHTML = ""
    for (let i = 0; i < allHintID.length; i++) {
        document.getElementById(allHintID[i]).className = ""
        document.getElementById(allHintID[i]).innerHTML = ""
    }

}

async function fetchAkaDrop(startTimestamp, endTimestamp){
// async function fetchAkaDrop(startTimestamp = "2023-08-01T00:00:00Z", endTimestamp = "2023-08-30T00:00:00Z"){
    setFetching("akaDrop-hint")

    await generateChargeFeeList()

    let chargeAmountMap = {}
    let detailList = []

    const chargeDataV1 = await getAPIData(transactionAPI,
        {
            "target": akaChargeV1,
            "status": "applied",
            "entrypoint": "charge",
            "timestamp.ge": startTimestamp,
            "timestamp.lt": endTimestamp
        }
    )
    for(let i = 0; i < chargeDataV1.length; i++){
        const chargeDataList = chargeDataV1[i].parameter.value
        let feeIndex = -1
        for(let j = 0; j < chargeFeeListV1.length; j++){
            if(Date.parse(chargeDataV1[i].timestamp) < chargeFeeListV1[j].startTime)
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
        for(let j = 0; j < chargeDataList.length; j++){
            const chargeData = chargeDataList[j]
            const feeData = chargeFeeListV1[feeIndex]["feeMap"][chargeData.charge_name]
            const chargeAmount = parseInt(chargeData.amount)
            const price = Math.ceil(chargeAmount/feeData.per) * feeData.price
            if(!(chargeData.charge_name in chargeAmountMap))
                chargeAmountMap[chargeData.charge_name] = 0
            chargeAmountMap[chargeData.charge_name] += price
            consumerDetail.charge[chargeData.charge_name] = price
        }
        detailList.push(consumerDetail)
    }

    const chargeDataV2 = await getAPIData(transactionAPI,
        {
            "target": akaChargeV2,
            "status": "applied",
            "entrypoint": "charge",
            "timestamp.ge": startTimestamp,
            "timestamp.lt": endTimestamp
        }
    )

    
    for(let i = 0; i < chargeDataV2.length; i++){
        const chargeDataList = chargeDataV2[i].parameter.value
        let feeIndex = -1
        for(let j = 0; j < chargeFeeListV2.length; j++){
            if(Date.parse(chargeDataV2[i].timestamp) < chargeFeeListV2[j].startTime)
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
        for(let j = 0; j < chargeDataList.length; j++){
            const chargeData = chargeDataList[j]
            const feeData = chargeFeeListV2[feeIndex]["feeMap"][chargeData.charge_name]
            const chargeAmount = parseInt(chargeData.amount)
            const price = Math.ceil(chargeAmount/feeData.per) * feeData.price
            if(!(chargeData.charge_name in chargeAmountMap))
                chargeAmountMap[chargeData.charge_name] = 0
            chargeAmountMap[chargeData.charge_name] += price
            consumerDetail.charge[chargeData.charge_name] = price
        }
        detailList.push(consumerDetail)
    }
    
    let akaDropResult = ""
    for(const [key, value] of Object.entries(chargeAmountMap))
        akaDropResult += akaDropChargeNameMap[key] + "：" + (value / 1000000).toString() + " tez<br/>"
    document.getElementById("akaDrop-result").innerHTML = akaDropResult

    
    let akaDropListResult = ""
    for(let i = 0; i < detailList.length; i++){
        const detailData = detailList[i]
        akaDropListResult += "<a href=\"" + opHashLink + detailData.address + "\" target=\"_blank\">" + detailData.consumer + "</a> "
        akaDropListResult += "<a href=\"" + opHashLink + detailData.opHash + "\" target=\"_blank\">製作Drop</a><br/>"
        let totalAmount = 0
        for(const [key, value] of Object.entries(detailData.charge))
            if(value > 0){
                totalAmount += value
                akaDropListResult += akaDropChargeNameMap[key] + "：" + (value / 1000000).toString() + " tez<br/>"
            }
        akaDropListResult += "<b>共計花費 " + (totalAmount / 1000000).toString() + " tez</b><br/>"
    }
    document.getElementById("akaDrop-result-list").innerHTML = akaDropListResult

    // akaDropChargeNameMap

    setSuccess("akaDrop-hint", "Done!")
}


async function search() {

    clearResult()
    const inputStartDate = document.getElementById("startDate").value
    const inputEndDate = document.getElementById("endDate").value

    let utcStartDate = new Date(inputStartDate)
    utcStartDate.setDate(utcStartDate.getDate() - 1)
    const startDate = utcStartDate.getFullYear() + '-' + ('0' + (utcStartDate.getMonth() + 1)).slice(-2) + '-' + ('0' + (utcStartDate.getDate())).slice(-2)

    let utcEndDate = new Date(inputEndDate)
    utcEndDate.setDate(utcEndDate.getDate() - 1)
    const endDate = utcEndDate.getFullYear() + '-' + ('0' + (utcEndDate.getMonth() + 1)).slice(-2) + '-' + ('0' + (utcEndDate.getDate())).slice(-2)



    const startDateZStr = startDate + "T16:00:00Z"
    const endDateZStr = endDate + "T16:00:00Z"
    const startDatePlusStr = startDate + "T16:00:00+00:00"
    const endDatePlusStr = endDate + "T16:00:00+00:00"

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
    
    await fetchAkaDrop(startDateZStr, endDateZStr)

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
            "target.in": allMarket,
            "entrypoint.in": "bid,direct_purchase,collect_bundle,collect_gacha,make_offer,collect",
            "status": "applied",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )
    let akaAllSet = new Set()
    let buySet = new Map()
    buySet[akaAuction] = new Set()
    buySet[akaBundleV2] = new Set()
    buySet[akaBundleV1] = new Set()
    buySet[akaGacha] = new Set()
    buySet[akaOffer] = new Set()
    buySet[akaMetaverseV2] = new Set()
    buySet[akaMetaverseV1] = new Set()

    let allBuySet = new Set()

    akaBuyData.forEach((buyData, idx) => {
        buySet[buyData.target.address].add(buyData.sender.address)
        allBuySet.add(buyData.sender.address)
        akaAllSet.add(buyData.sender.address)
    })

    document.getElementById("akaBuyer-result").innerHTML =
        "共 <b>" + allBuySet.size + "</b> 位買家<br/>" +
        "詳細數量:<br/>" +
        "akaMetaverse V2.1: " + buySet[akaMetaverseV2].size + " 位買家<br/>" +
        "akaMetaverse V1: " + buySet[akaMetaverseV1].size + " 位買家<br/>" +
        "akaOffer: " + buySet[akaOffer].size + " 位買家<br/>" +
        "akaGacha: " + buySet[akaGacha].size + " 位買家<br/>" +
        "akaBundle V1: " + buySet[akaBundleV1].size + " 位買家<br/>" +
        "akaBundle V2: " + buySet[akaBundleV2].size + " 位買家<br/>" +
        "akaAuction: " + buySet[akaAuction].size + " 位買家<br/>"

    // sell
    const akaSellData = await getAPIData(transactionAPI,
        {
            "target.in": allMarket,
            "entrypoint.in": "make_auction,make_bundle,make_gacha,fulfill_offer,swap",
            "status": "applied",
            "timestamp.ge": startDateZStr,
            "timestamp.lt": endDateZStr
        }
    )

    let sellSet = new Map()
    sellSet[akaAuction] = new Set()
    sellSet[akaBundleV2] = new Set()
    sellSet[akaBundleV1] = new Set()
    sellSet[akaGacha] = new Set()
    sellSet[akaOffer] = new Set()
    sellSet[akaMetaverseV2] = new Set()
    sellSet[akaMetaverseV1] = new Set()

    let allSellSet = new Set()

    akaSellData.forEach((sellData, idx) => {
        sellSet[sellData.target.address].add(sellData.sender.address)
        allSellSet.add(sellData.sender.address)
        akaAllSet.add(sellData.sender.address)
    })

    document.getElementById("akaSeller-result").innerHTML =
        "共 <b>" + allSellSet.size + "</b> 位賣家<br/>" +
        "詳細數量:<br/>" +
        "akaMetaverse V2.1: " + sellSet[akaMetaverseV2].size + " 位賣家<br/>" +
        "akaMetaverse V1: " + sellSet[akaMetaverseV1].size + " 位賣家<br/>" +
        "akaOffer: " + sellSet[akaOffer].size + " 位賣家<br/>" +
        "akaGacha: " + sellSet[akaGacha].size + " 位賣家<br/>" +
        "akaBundle V1: " + sellSet[akaBundleV1].size + " 位賣家<br/>" +
        "akaBundle V2: " + sellSet[akaBundleV2].size + " 位賣家<br/>" +
        "akaAuction: " + sellSet[akaAuction].size + " 位賣家<br/>"

    let allMintSet = new Set()
    akaMintData.forEach((mintData, idx) => {
        allMintSet.add(mintData.sender.address)
        akaAllSet.add(mintData.sender.address)
    })


    document.getElementById("akaPeople-result").innerHTML =
        "共 <b>" + allMintSet.size + "</b> 位鑄造NFT<br/>" +
        "共 <b>" + akaAllSet.size + "</b> 位網站使用人數"

    setSuccess("akaStat-hint", "Done!")
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

async function fetchHolders() {
    
    document.getElementById("akaCollectionSection").style.display = "block"
    document.getElementById("akaCollection-result").innerHTML = ""
    document.getElementById("akaCollection-hint").className = ""
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
        const ledgerBigMapNum = (storageAPIResult.ledger).toString()
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