import fs from "fs"
import readline from "readline"
import fetch from "node-fetch"
async function main(){
    let data = []
    const csvStream = fs.createReadStream("./email-data/data12.csv")
    const rl = readline.createInterface({
        input: csvStream,
        crlfDelay: Infinity
    });
    for await (const line of rl){
        data.push((line.split(" -- ")[0]).replace(/""/g, '"'))
    }

    let jumlah = 0
    data.map(async data => {
        const jsonData = JSON.parse(data)
        try {
            jumlah++
            const sendFirstData = await fetch("https://flashcampus.vercel.app/api/metric", {
                method: "POST", 
                body: JSON.stringify({
                    Message: data
                })
            })
            const sendMessage = await sendFirstData.json()
            console.log(sendMessage)
            console.log(jumlah)
        } catch (error) {
            jumlah++
            console.log(error)
            console.log(jsonData)
        }
    })

}
main()