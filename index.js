import AWS from 'aws-sdk'
import fs from "fs"
import ClientPromise from "./lib/mongodb.js"
import readline from "readline"
import 'dotenv/config'

const ses = new AWS.SES({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET
})

const dbApplication = (await ClientPromise).db(process.env.MONGODB_DB)

const ask = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

async function send(template, id, to){
    const parameter = {
        Destination: {
            ToAddresses: to
        },
        Source: 'FlashCampus <team@flashcampus.com>',
        Template: template,
        TemplateData: `{"nama" : "${to[0].split('@')[0]}", "id" : "${id}"}`,
        ConfigurationSetName: 'flashcampus-tracking'
    }
    return new Promise((resolve, reject) => {
        ses.sendTemplatedEmail(parameter, (err, res) => {
            if(err){
                reject(err)
            }else{
                resolve(res)
            }
        })
    })
}

async function sendPrivateEmail(to){
    const parameter = {
        Destination: {
            ToAddresses: to
        },
        Source: 'rafsi@flashcampus.com',
        Message: {
            Body: {
                Text: {
                    Data: `Halo ${to[0].split("@")[0]} 👋\n\nSemoga kabar kamu baik di sana. Kalau kamu subscriber baru FlashCampus, selamat datang! Salam kenal, aku Rafsi, salah satu orang di balik FlashCampus.\n\nSetelah kurang lebih sebulan menemani pengembangan diri teman-teman pelajar di Indonesia, FlashCampus sedang mempersiapkan untuk segera hadir dengan FlashCampus Versi 1.2 🔥\n\nIya, kamu enggak akan lagi menerima konten FlashCampus dengan format dan frekuensi seperti sekarang. Akan ada beberapa perubahan yang terjadi dengan tujuan mengakomodasi kebutuhan pengembangan diri kamu secara lebih baik. Untuk itu, kita butuh bantuan kamu!\n\nBantu FlashCampus jadi lebih baik dengan mengisi https://forms.gle/iChgUm18c8nAwX2u7 (anonim, kok 😉).\n\nPartisipasi kamu sangat berharga untuk membantu teman-teman di seluruh Indonesia. Tunggu lebih banyak hal menarik untuk kamu ke depannya, ya! ✨\n\nRafsi Albar\nCo-founder & CEO, FlashCampus`
                }
            },
            Subject: {
                Data: "Nasib FlashCampus ke depannya..."
            }
        },
        ReplyToAddresses: ["rafsi@flashcampus.com"],
        ConfigurationSetName: 'flashcampus-private-email'
    }
    return new Promise((resolve, reject) => {
        ses.sendEmail(parameter, (err, res) => {
            if(err){
                reject(err)
            }else{
                resolve(res)
            }
        })
    })
}


function createEmailTemplate(templateName, subject){
    let file
    try {
        file = fs.readFileSync(`./template/${templateName}.html`, 'utf8');
    } catch (err) {
        console.error(err);
    }
    const parameter = {
        Template: {
            TemplateName: templateName,
            HtmlPart: file,
            SubjectPart: subject
        }
    }
    return new Promise(async (resolve, reject) => {
        ses.createTemplate(parameter, (err, res) => {
            if(err){
                reject(err)
            }else{
                resolve(res)
            }
        })
    })
}

function deleteEmailTemplate(templateName){
    return new Promise(async (resolve, reject) => {
        ses.deleteTemplate({TemplateName: templateName}, (err, res) => {
            if(err){
                reject(err)
            }else{
                resolve(res)
            }
        })
    })
}

async function emailSendDriver(templateName){
    let counter = 0
    const collectionUser = dbApplication.collection("users")
    const user = await collectionUser.find().toArray()
    const sending = setInterval(async () => {
        const data = user.pop()
        let sendEmail
        if(data && !data.isUnsubscribe){
            try {
                sendEmail = await send(templateName, data._id.toString(), [data.email])
                if(sendEmail){
                    counter++
                    console.log("Email : " + data.email + " Counter : " + counter)
                    console.log(sendEmail)
                }
            } catch (error) {
                console.log("Email Error: " + data.email + " Counter : " + counter)
                console.log(error)
            }
        }
        if(user.length === 0){
            clearInterval(sending)
            if(sendEmail){
                console.log("Pengiriman Email Selesai!")
            }
        }
    }, 100)
}

async function privateEmailSendTestDriver(){
    const testEmail = [
        [1, 'syahrizacio@gmail.com'],
        // [2, 'fakhrinalendro@gmail.com'],
        // [3, 'jeremyalvax@gmail.com'],
        // [4, 'fahmi.firstian@ui.ac.id'],
        [5, 'irfankamal021002@gmail.com'],
        // [6, 'rianfebriansyah22@gmail.com'],
        // [7, 'rafsiazzam@mail.ugm.ac.id'],
        // [8, 'schalkeanindya@gmail.com'],
        // [9, 'ahnaf20002@mail.unpad.ac.id'],
        // [10, 'amanda.sinaga24@gmail.com'],
        // [11, 'arielprananda07@gmail.com'],
        // [12, 'auckyqq@gmail.com'],
        // [13, 'glory.christabella@gmail.com'],
        // [14, 'jeremyalvax@gmail.com'],
        // [15, 'kinantihanuunr@gmail.com'],
        // [16, 'najma.asshiddiqie@gmail.com'],
        // [17, 'owen.mulianto@gmail.com'],
        // [18, 'schalkeanindya@gmail.com'],
        // [19, 'tjenjocelyn8@gmail.com'],
        // [20, 'yasmin.hana@ui.ac.id'],
        // [21, 'contact.flashcampus@gmail.com']
    ]

    let counter = 0
    const sending = setInterval(async () => {
        const data = testEmail.pop()
        let sendEmail
        if(data){
            try {
                sendEmail = await sendPrivateEmail([data[1]])
                if(sendEmail){
                    counter++
                    console.log("Email : " + data[1] + " Counter : " + counter)
                    console.log(sendEmail)
                }
            } catch (error) {
                console.log("Email Error: " + data[1] + " Counter : " + counter)
                console.log(error)
            }
        }
        if(testEmail.length === 0){
            clearInterval(sending)
            if(sendEmail){
                console.log("Pengiriman Email Selesai!")
            }
        }
    }, 100)
}

async function privateEmailSendDriver(){
    const collectionUser = dbApplication.collection("users")
    const user = await collectionUser.find().toArray()
    let counter = 0
    const sending = setInterval(async () => {
        const data = user.pop()
        let sendEmail
        if(data && !data.isUnsubscribe){
            try {
                sendEmail = await sendPrivateEmail([data.email])
                if(sendEmail){
                    counter++
                    console.log("Email : " + data.email + " Counter : " + counter)
                    console.log(sendEmail)
                }
            } catch (error) {
                console.log("Email Error: " + data.email + " Counter : " + counter)
                console.log(error)
            }
        }
        if(user.length === 0){
            clearInterval(sending)
            if(sendEmail){
                console.log("Pengiriman Email Selesai!")
            }
        }
    }, 100)
}

async function emailSendTestDriver(templateName){
        const testEmail = [
            // [1, 'syahrizacio@gmail.com'],
            // [2, 'fakhrinalendro@gmail.com'],
            // [3, 'jeremyalvax@gmail.com'],
            // [4, 'fahmi.firstian@ui.ac.id'],
            [5, 'irfankamal021002@gmail.com'],
            // [6, 'rianfebriansyah22@gmail.com'],
            // [7, 'rafsiazzam@mail.ugm.ac.id'],
            // [8, 'schalkeanindya@gmail.com'],
            // [9, 'ahnaf20002@mail.unpad.ac.id'],
            // [10, 'amanda.sinaga24@gmail.com'],
            // [11, 'arielprananda07@gmail.com'],
            // [12, 'auckyqq@gmail.com'],
            // [13, 'glory.christabella@gmail.com'],
            // [14, 'jeremyalvax@gmail.com'],
            // [15, 'kinantihanuunr@gmail.com'],
            // [16, 'najma.asshiddiqie@gmail.com'],
            // [17, 'owen.mulianto@gmail.com'],
            // [18, 'schalkeanindya@gmail.com'],
            // [19, 'tjenjocelyn8@gmail.com'],
            // [20, 'yasmin.hana@ui.ac.id']
        ]
        let counter = 0
        const sending = setInterval(async () => {
            const data = testEmail.pop()
            if(data){
                try {
                    const sendEmail = await send(templateName, data[0], [data[1]])
                    if(sendEmail){
                        counter++
                        console.log("Email : " + data[1] + " Counter : " + counter)
                        console.log(sendEmail)
                    }
                } catch (error) {
                    console.log("Email Error: " + data[1] + " Counter : " + counter)
                    console.log(error)
                }
            }else{
                clearInterval(sending)
                console.log("Pengiriman Email Selesai!")
            }
        }, 100)
}

async function main(){
    console.log("1. Membuat template")
    console.log("2. Menghapus template")
    console.log("3. Mengirim ke seluruh user")
    console.log("4. Mengirim ke tim")
    console.log("5. Mengirim private email ke user")
    console.log("6. Mengirim private email ke tim")
    console.log("7. Keluar")
    ask.question("Proses yang ingin dilakukan : ", async key => {
        switch (key) {
            case "1":
                ask.question("Nama template : ", nama => {
                    ask.question("Subject template : ", async subject => {
                        ask.close()
                        console.log("Pesan :")
                        console.log(await createEmailTemplate(nama, subject))
                    })
                })
                break;
            case "2":
                ask.question("Nama template : ", async nama => {
                    ask.close()
                    console.log("Pesan :")
                    console.log(await deleteEmailTemplate(nama))
                })
                break;
            case "3":
                ask.question("Nama template : ", async nama => {
                    ask.close()
                    console.log(await emailSendDriver(nama))
                })
                break;
            case "4":
                ask.question("Nama template : ", async nama => {
                    ask.close()
                    console.log(await emailSendTestDriver(nama))
                })
                break;
            case "5":
                    privateEmailSendDriver()
                break;
            case "6":
                    privateEmailSendTestDriver()
                break;
            case "7":
                ask.close()
                break;
            default:
                break;
        }
    })
}

main()