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
            applicationId: '232471b4-d9d7-440f-ba4b-c486da24ecbb',
            endpointKey: '024525c05fc441ec9d6d1f460e5af43c',
            endpoint: 'https://lingethan.cognitiveservices.azure.com/'
        }, {
            includeAllIntents: true,
            includeInstanceData: true
        }, true);

        this.dispatchRecognizer = dispatchRecognizer;

        this.onMessage(async (context, next) => {
            await context.sendActivity('Processing Message Activity.');

            // First, we use the dispatch model to determine which cognitive service (LUIS or QnA) to use.
            const recognizerResult = await dispatchRecognizer.recognize(context);
            await context.sendActivity('call dispatcher');
            const intent = LuisRecognizer.topIntent(recognizerResult);
            await context.sendActivity('call topIntent');
            await context.sendActivity(intent);
            await this.dispatchToTopIntentAsync(context, intent, recognizerResult);

            // Top intent tell us which cognitive service to use.
            //const intent = LuisRecognizer.topIntent(recognizerResult);

            // Next, we call the dispatcher with the top intent.
            //await this.dispatchToTopIntentAsync(context, intent, recognizerResult);

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const welcomeText = 'Type a greeting or a question about the weather to get started.';
            const membersAdded = context.activity.membersAdded;

            for (const member of membersAdded) {
                await context.sendActivity(member.id);
                await context.sendActivity(member.name);
                await context.sendActivity(context.activity.recipient.id);
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity(`Welcome to Dispatch bot ${member.name}. ${welcomeText}`);
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async dispatchToTopIntentAsync(context, intent, recognizerResult) {
        switch (intent) {
            case 'VendorSearch':
                await context.sendActivity('enter dispathere vendor search');
                await this.processVendor(context, recognizerResult);
                break;
            case 'BacklogStatus':
                await context.sendActivity('enter dispathere backlog');
                await this.processBacklog(context, recognizerResult);
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

    async processVendor(context, recognizerResult) {
        console.log('processVendor');

        try {
            const luisResult = recognizerResult.luisResult;
            if (luisResult.entities.length > 0) {
                await context.sendActivity(`processVendor entities were found in the message: ${luisResult.entities.map((entityObj) => entityObj.entity).join('\n\n')}.`);
                const vendorKey = luisResult.entities[0].entity;

                await context.sendActivity(`${vendorKey}`);

                const url = encodeURI('/gateway/p1-service?app_code=vendor-service&invoke_method=/api/vendor/vendorNamePattern/{patternName}/headers&paths={\"patternName\":\"' + vendorKey.toString() + '\"}\"');
                console.log('--------------search Path:' + url);

                let finalresult = '';

                let tmpresult = await requestRemoteByGetUser(url, 'ethanh');
                let items = JSON.parse(tmpresult);
                console.log('--------------Result :' + items.toString());

                if (!items.hasOwnProperty('message')) {
                    finalresult = 'I am sorry, I cannot find any related information. ';
                } else if (!items.message.hasOwnProperty('data')) {
                    finalresult = 'I am sorry, I cannot find any related information. ';
                } else if (!items.message.data.hasOwnProperty('content')) {
                    finalresult = 'I am sorry, I cannot find any related information. ';
                } else {

                    var array = [];
                    if (!(items.message.data.content instanceof Array)) {
                        array.push(items.message.data.content);
                    } else {
                        array = items.message.data.content;
                    }

                    var resultvendor = 'Vendor Information: ' + '  \n\t\r';
                    for (var pos = 0; pos < array.length; pos++) {
                        resultvendor = resultvendor + array[pos].vendNo + '---' + array[pos].vendName + '  \n\t\r';
                    }

                    if (array.length < 1) {
                        resultvendor = resultvendor + 'Not Found';
                    }
                    finalresult = resultvendor;
                }

                await context.sendActivity(finalresult);
            }
        } catch (error) {
            await context.sendActivity(error);
        }
    }

    async processBacklog(context, recognizerResult) {
        console.log('processBacklog');

        try {
            const luisResult = recognizerResult.luisResult;
            if (luisResult.entities.length > 0) {
                await context.sendActivity(`processBacklog entities were found in the message: ${luisResult.entities.map((entityObj) => entityObj.entity).join('\n\n')}.`);
                const backlogKey = luisResult.entities[0].entity;

                await context.sendActivity(`${backlogKey}`);

                let finalresult = '';

                await context.sendActivity({ attachments: [this.createVideoCard()] });
            }
        } catch (error) {
            await context.sendActivity(error);
        }
    }

    async processNone(context, luisResult) {
        console.log('processNone');

        await context.sendActivity(`Sorry, I can't understand you, and I can help you to find the backlog status or vendor search`);

    }

    createVideoCard() {
        return CardFactory.videoCard(
            '2018 Imagine Cup World Championship Intro',
            [{ url: 'https://sec.ch9.ms/ch9/783d/d57287a5-185f-4df9-aa08-fcab699a783d/IC18WorldChampionshipIntro2.mp4' }],
            [{
                type: 'openUrl',
                title: 'Lean More',
                value: 'https://channel9.msdn.com/Events/Imagine-Cup/World-Finals-2018/2018-Imagine-Cup-World-Championship-Intro'
            }],
            {
                subtitle: 'by Microsoft',
                text: 'Microsoft\'s Imagine Cup has empowered student developers around the world to create and innovate on the world stage for the past 16 years. These innovations will shape how we live, work and play.'
            }
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

module.exports.DispatchBot = DispatchBot;
