// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { AttachmentLayoutTypes, CardFactory } = require('botbuilder');
const { ActivityHandler } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const https = require('https');

const snxHost = 'ec.synnex.com';

class DispatchBot extends ActivityHandler {
    constructor() {
        super();

        // If the includeApiResults parameter is set to true, as shown below, the full response
        // from the LUIS api will be made available in the properties  of the RecognizerResult
        const dispatchRecognizer = new LuisRecognizer({
            applicationId: '7167df16-5dec-44d9-9525-8098120b8726',
            endpointKey: '86983d0697844ab0948e135a856f96d3',
            endpoint: 'https://westus.api.cognitive.microsoft.com/'
        }, {
            includeAllIntents: true,
            includeInstanceData: true
        }, true);

        this.dispatchRecognizer = dispatchRecognizer;

        this.onMessage(async (context, next) => {
            //await context.sendActivity('Processing Message Activity.');

            // First, we use the dispatch model to determine which cognitive service (LUIS or QnA) to use.
            const recognizerResult = await dispatchRecognizer.recognize(context);

            //await context.sendActivity('call dispatcher');
            const intent = LuisRecognizer.topIntent(recognizerResult);
            //await context.sendActivity('intent name: ' + intent);
            const topIntentScore = recognizerResult.intents[intent].score;
            //await context.sendActivity('intent score: ' + topIntentScore);
            if (typeof topIntentScore === 'number' && topIntentScore < 0.3) {
                await this.processNone(context, recognizerResult.luisResult);
            } else {
                //await context.sendActivity('call topIntent');
                //await context.sendActivity(intent);
                await this.dispatchToTopIntentAsync(context, intent, recognizerResult);
            }

            // Top intent tell us which cognitive service to use.
            //const intent = LuisRecognizer.topIntent(recognizerResult);

            // Next, we call the dispatcher with the top intent.
            //await this.dispatchToTopIntentAsync(context, intent, recognizerResult);

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;

            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                } else {
                    await context.sendActivity({ attachments: [this.createEntranceCard('请问您有什么问题？')] });
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async dispatchToTopIntentAsync(context, intent, recognizerResult) {
        switch (intent) {
            case 'BackOrder':
                //await context.sendActivity('enter dispache BackOrder');
                await this.processBackOrder(context, recognizerResult);
                break;
            case 'MSO':
                //await context.sendActivity('enter dispache MSO');
                await this.processMSO(context, recognizerResult);
                break;
            case 'SalesOrder':
                //await context.sendActivity('enter dispache SalesOrder');
                await this.processSalesOrder(context, recognizerResult);
                break;
            case 'SalesRelease':
                //await context.sendActivity('enter dispache SalesRelease');
                await this.processSalesRelease(context, recognizerResult);
                break;
            case 'WebQuote':
                //await context.sendActivity('enter dispache WebQuote');
                await this.processWebQuote(context, recognizerResult);
                break;
            case 'None':
                await this.processNone(context, recognizerResult.luisResult);
                break;
            default:
                console.log(`Dispatch unrecognized intent: ${intent}.`);
                await context.sendActivity(`Dispatch unrecognized intent: ${intent}.`);
                break;
        }
    }

    async processNone(context, luisResult) {
        console.log('processNone');

        await context.sendActivity(`对不起，我没有能力回答您的问题`);
        await context.sendActivity({ attachments: [this.createEntranceCard('您还有什么需要我效劳的')] });

    }

    async processBackOrder(context, luisResult) {
        console.log('processBackOrder');

        await context.sendActivity(`Description: A distribution termthat refers to the status of items on a purchase order in the event that someor all of the inventory required to fulfill the order is insufficient to satisfy demand.`);
        await context.sendActivity(`BO’s Function.`);
        await context.sendActivity(`1 For entering the production scheduleinformation and delivery date information.`);
        await context.sendActivity(`2 For analyzing data on parts deliveredand parts makers who delivered parts, and the completion of back orders isdelayed.`);
        await context.sendActivity(`3 Share the information about the progress of transactions relating to back orders.`);
        await context.sendActivity(`4 Per back order, information is processed accurately and quickly ,delivery date is decided quickly, notice about delivery date is given quickly.`);
        await context.sendActivity(`5 We could create preorders for ourcustomer, tell buyers to order while it is on order, once the stock arrives wedelete the preorder BO and allocate using the order we created.`);
        await context.sendActivity({ attachments: [this.createVideoCard('Back Order', 'Details in KM', 'http://kmbj.synnex.org/skm/index.php?c=in&page=4473')] });
        await context.sendActivity(`本轮回答结束`);
        
    }

    async processMSO(context, luisResult) {
        console.log('processMSO');

        await context.sendActivity(`The order number assigned to a One Source or Drop Ship order entered by sales. Master Sales Orders are routed to a buyers queue for PO placement with a supplier.`);
        await context.sendActivity({ attachments: [this.createVideoCard('MSO', 'Details in KM', 'http://kmbj.synnex.org/skm/index.php?c=in&page=4444')] });
        await context.sendActivity(`本轮回答结束`);
        
    }

    async processSalesOrder(context, luisResult) {
        console.log('processInternetPermission');

        await context.sendActivity(`Description：Regular sales order created by sales reps. A seller-generated document that authorizes sale of the specified item(s), issued after receipt of a customer's purchase order. A sales order usually implies that there will be no additional labor or material cost incurred for the sale, except where it is used to initiate a production process.`);
        await context.sendActivity(`Introduction：The Sales Order, sometimes abbreviated as SO, is an order issued by a business to a customer. A sales order may be for products and/or services. Given the wide variety of businesses, this means that the orders can be fulfilled in several ways. Broadly, the fulfillment modes, based on the relationship between the order receipt and production, are as follows:`);
        await context.sendActivity(`1 Digital Copy - Where PRICES are digital and inventory is maintained with a single digital master. Copies are made on demand in real time and instantly delivered to customers.`);
        await context.sendActivity(`2 Build to Stock - Where products are built and stocked in anticipation of demand. Most products for the consumer would fall into this category`);
        await context.sendActivity(`3 Build to Order - Where products are built based on orders received. This is most prevalent for custom parts where the designs are known beforehand.`);
        await context.sendActivity(`4 Configure to Order - Where products are configured or assembled to meet unique customer requirements e.g. Computers`);
        await context.sendActivity(`5 Engineer to Order - Where some amount of product design work is done after receiving the order
        A sales order is an internal document of the company, meaning it is generated by the company itself. A sales order should record the customer's originating purchase order which is an external document. Rather than using the customer's purchase order document, an internal sales order form allows the internal audit control of completeness to be monitored as a sequential sales order number can be used by the company for its sales order documents. The customer's PO is the originating document which triggers the creation of the sales order. A sales order, being an internal document, can therefore contain many customer purchase orders under it. In a manufacturing environment, a sales order can be converted into a work order to show that work is about to begin to manufacture, build or engineer the products the customer wants.`);
        await context.sendActivity({ attachments: [this.createVideoCard('Sales Order', 'Details in KM', 'http://kmbj.synnex.org/skm/index.php?c=in&page=4471')] });
        await context.sendActivity(`本轮回答结束`);
        
    }

    async processSalesRelease(context, luisResult) {
        console.log('processSalesRelease');

        await context.sendActivity(`Description: When sales related order created by sales rep, the order is queued to sales queue. The order within sales queue will be released by system or by sales supervisor. The release date will be added into the order when it was released.`);
        await context.sendActivity(`An order release consists of the following:`);
        await context.sendActivity(`1 Order Release ID that is automatically generated`);
        await context.sendActivity(`2 Order Release Name and Type`);
        await context.sendActivity(`3 Order Base ID that references the order base from which the order release was created`);
        await context.sendActivity(`4 Source and Destination location`);
        await context.sendActivity(`5 Gross/Net Weight and Volume`);
        await context.sendActivity(`6 Early/late Pick Up dates`);
        await context.sendActivity(`7 Assigned or Fixed itinerary`);
        await context.sendActivity(`8 Current Status `);
        await context.sendActivity(`9 Package or Non-package data attributes`);
        await context.sendActivity({ attachments: [this.createVideoCard('Sales Release', 'Details in KM', 'http://kmbj.synnex.org/skm/index.php?c=in&page=4463')] });
        await context.sendActivity(`本轮回答结束`);
        
    }

    async processWebQuote(context, luisResult) {
        console.log('processWebQuote');

        await context.sendActivity(`Description: A tool mainly used for order entry and quotation. We can track a PO# by WQ# or PO ID. There are a lot of info needed to create a SO/BO, such as Acct#, ship to, EU Info, PO#, Part List, Ship method, Freight and etc.`);
        await context.sendActivity(`There are some sessions used frequently.`);
        await context.sendActivity(`Expenses: used for choosing the ship method. Some ship method can also be chosen on shipping session.`);
        await context.sendActivity(`Billing/CC: used for looking up the acct# and change the acct# which is incorrect.`);
        await context.sendActivity(`Comments: a session used for adding coments on Reseller/WH Pick/Internal/Credit/Ship BOL/Pack list.`);
        await context.sendActivity(`End user: used for adding end user info.`);
        await context.sendActivity(`Status/Tracking: When a order is created, you click ok on the pop-up windows. Then you'll enter this session and you can see the detail and SO# of this order.`);
        await context.sendActivity({ attachments: [this.createVideoCard('WebQuote', 'Details in KM', 'http://kmbj.synnex.org/skm/index.php?c=in&page=15783')] });
        await context.sendActivity(`本轮回答结束`);
        
    }

    createEntranceCard(promptText) {

        const card = CardFactory.heroCard(
            promptText,
            CardFactory.images(['https://i1.wp.com/www.cbot.ai/wp-content/uploads/2019/08/chatbot_adoption.jpg?w=786&ssl=1']),
            CardFactory.actions([
                {
                    type: 'imBack',
                    title: '什么是SO',
                    value: '什么是SO'
                },
                {
                    type: 'imBack',
                    title: '怎么理解Back Order',
                    value: '怎么理解Back Order'
                },
                {
                    type: 'imBack',
                    title: '什么是MSO',
                    value: '什么是MSO'
                },
                {
                    type: 'imBack',
                    title: '怎么理解WQ',
                    value: '怎么理解WQ'
                },
                {
                    type: 'imBack',
                    title: '什么是sales release? ',
                    value: '什么是sales release? '
                }
            ])
        );

        return card;
    }

    

    createVideoCard(titleResult, finalresult, linkUrl) {
        return CardFactory.videoCard(
            titleResult,
            [{ url: 'https://sec.ch9.ms/ch9/783d/d57287a5-185f-4df9-aa08-fcab699a783d/IC18WorldChampionshipIntro2.mp4' }],
            [{
                type: 'openUrl',
                title: finalresult,
                value: linkUrl
            }]
        );
    }
}

async function requestRemoteByGetUser(url, user) {
    return new Promise(function (resolve, reject) {
        var crypto = require('crypto');
        const options = {
            hostname: snxHost,
            port: 443,
            path: url,
            method: 'GET',
            headers: {
                'user': crypto.createHash('sha1').update(user).digest('base64')
            }
        };
        const request = https.get(options, res => {
            res.setEncoding('utf8');
            let body = '';
            res.on('data', data => {
                body += data;
            });
            res.on('end', () => {
                console.log("Pure Result is : " + body);
                resolve(body);
            });
        });

        request.on('error', (err) => reject(err));
    });
}

async function requestRemoteByGet(url) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: snxHost,
            port: 443,
            path: url,
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + new Buffer('ethanh:!ethanh2019A').toString('base64')
            }
        };
        const request = https.get(options, res => {
            res.setEncoding('utf8');
            let body = '';
            res.on('data', data => {
                body += data;
            });
            res.on('end', () => {
                console.log("Pure Result is : " + body);
                resolve(body);
            });
        });

        request.on('error', (err) => reject(err));
    });
}

module.exports.DispatchBot = DispatchBot;
